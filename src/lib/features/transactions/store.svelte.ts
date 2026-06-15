import { transactionApi, type TransactionCreate } from './api';
import type { RecordModel } from 'pocketbase';
import { calculateTransactionBalanceChange } from '$lib/core/math';
import { toast } from '$lib/core/toastStore.svelte';
import { authStore } from '$lib/features/auth/authStore.svelte';
import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
import { recurringStore } from '$lib/features/recurring/store.svelte';
import { handleAppError } from '$lib/core/errorHandler';
import { offlineStore } from '$lib/core/offlineStore.svelte';
import { browser } from '$app/environment';

class TransactionStore {
	transactions = $state<RecordModel[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: (() => void) | null = null;
	private syncListenerAdded = false;

	initRealtime() {
		if (this.unsubscribe) return;
		this.unsubscribe = transactionApi.subscribe((e) => {
			if (e.action === 'create') {
				if (!this.transactions.find((tx) => tx.id === e.record.id)) {
					this.transactions = [e.record, ...this.transactions];
				}
			} else if (e.action === 'update') {
				this.transactions = this.transactions.map((tx) => (tx.id === e.record.id ? e.record : tx));
			} else if (e.action === 'delete') {
				this.transactions = this.transactions.filter((tx) => tx.id !== e.record.id);
			}
		});
	}

	private initSync() {
		if (!browser || this.syncListenerAdded) return;
		this.syncListenerAdded = true;
		window.addEventListener('fairshare_sync_queue', () => this.syncQueueOnline());
	}

	async syncQueueOnline() {
		const queue = [...offlineStore.queue];
		if (queue.length === 0) return;

		for (const action of queue) {
			try {
				if (action.type === 'CREATE_TX') {
					const { _tempId, ...data } = action.payload as TransactionCreate & { _tempId?: string };
					const record = await transactionApi.create(data);
					offlineStore.removeAction(action.id);
					if (_tempId) {
						this.transactions = this.transactions.map((tx) =>
							tx.id === _tempId ? record : tx
						);
					}
				} else if (action.type === 'UPDATE_TX') {
					const { id, data } = action.payload as { id: string; data: Partial<TransactionCreate> };
					const record = await transactionApi.update(id, data);
					offlineStore.removeAction(action.id);
					this.transactions = this.transactions.map((tx) => (tx.id === id ? record : tx));
				} else if (action.type === 'DELETE_TX') {
					const { id } = action.payload as { id: string };
					await transactionApi.delete(id);
					offlineStore.removeAction(action.id);
				}
			} catch (err: any) {
				console.error('Sync-Fehler bei Aktion', action.id, err);
				toast.error('Synchronisation fehlgeschlagen. Wird beim nächsten Online-Zugang erneut versucht.');
				break;
			}
		}
	}

	unsettledTransactions = $derived(this.transactions.filter((tx) => !tx.settlement_id));

	kasseDeposits = $derived(
		this.transactions
			.filter((tx) => tx.split_mode === 'deposit')
			.reduce((acc, tx) => acc + tx.total_amount, 0)
	);
	kasseExpenses = $derived(
		this.transactions
			.filter((tx) => tx.split_mode === 'kasse')
			.reduce((acc, tx) => acc + tx.total_amount, 0)
	);
	kasseBalance = $derived(this.kasseDeposits - this.kasseExpenses);

	// Derived states for balances based ONLY on unsettled transactions
	myBalance = $derived(this.calculateTotalBalance());

	fairSharingActive = $derived(partnerStore.partnerStatus === 'active');

	fairSharingRatio = $derived.by(() => {
		if (!this.fairSharingActive) return 0.5;
		const currentUser = authStore.currentUser;
		const partnerUser = partnerStore.partnerUser;
		const myIncome = currentUser?.income || 0;
		const partnerIncome = partnerUser?.income || 0;
		const totalIncome = myIncome + partnerIncome;
		if (totalIncome <= 0) return 0.5;
		return myIncome / totalIncome;
	});

	fairBalance = $derived.by(() => {
		if (!this.fairSharingActive) return 0;
		const myId = authStore.currentUser?.id;
		if (!myId) return 0;

		const ratio = this.fairSharingRatio;

		return this.unsettledTransactions.reduce((acc, tx) => {
			const txCopy = {
				total_amount: tx.total_amount,
				paid_by: tx.paid_by,
				split_mode: tx.split_mode === 'kasse' || tx.split_mode === 'deposit' ? tx.split_mode : 'income_ratio',
				metadata: tx.metadata
			};
			return acc + calculateTransactionBalanceChange(txCopy, myId, partnerStore.partnerUser?.id, ratio);
		}, 0);
	});

	private calculateTotalBalance(): number {
		const currentUser = authStore.currentUser;
		const myId = currentUser?.id;
		if (!myId) return 0;

		const partnerUser = partnerStore.partnerUser;
		const globalMode = currentUser.cost_sharing_mode || 'own_costs';

		const myIncome = currentUser.income || 0;
		const partnerIncome = partnerUser?.income || 0;
		const totalIncome = myIncome + partnerIncome;
		const myRatio = (globalMode === '50_50' || globalMode === 'own_costs' || totalIncome <= 0) ? 0.5 : myIncome / totalIncome;

		return this.unsettledTransactions.reduce((acc, tx) => {
			let txSplitMode = tx.split_mode;
			if (txSplitMode === '50_50' || txSplitMode === 'income_ratio' || txSplitMode === 'fair') {
				txSplitMode = globalMode;
			}
			const txCopy = {
				total_amount: tx.total_amount,
				paid_by: tx.paid_by,
				split_mode: txSplitMode,
				metadata: tx.metadata
			};
			return acc + calculateTransactionBalanceChange(txCopy, myId, partnerUser?.id, myRatio);
		}, 0);
	}

	async load() {
		this.loading = true;
		this.error = null;
		this.initSync();
		try {
			// Trigger generation of due recurring expenses
			try {
				await recurringStore.generateDueTransactions();
			} catch (reErr) {
				console.error('Error generating recurring transactions:', reErr);
			}

			this.transactions = await transactionApi.getAll();
			this.initRealtime();
		} catch (err: any) {
			const appErr = handleAppError(err);
			this.error = appErr.message;
		} finally {
			this.loading = false;
		}
	}

	async addTransaction(data: TransactionCreate) {
		// Optimistic UI update (mock ID for instant feedback)
		const tempId = crypto.randomUUID();
		const optimisticRecord = { ...data, id: tempId } as unknown as RecordModel;
		this.transactions = [optimisticRecord, ...this.transactions];

		try {
			const record = await transactionApi.create(data);
			// Replace optimistic record with real one
			this.transactions = this.transactions.map((tx) => (tx.id === tempId ? record : tx));
			return record;
		} catch (err: any) {
			if (!navigator.onLine || err.status === 0 || err.isAbort) {
				offlineStore.addAction({ type: 'CREATE_TX', payload: { ...data, _tempId: tempId } });
				toast.info('Offline gespeichert. Wird synchronisiert, sobald du wieder online bist.');
				return optimisticRecord;
			}

			// Rollback
			this.transactions = this.transactions.filter((tx) => tx.id !== tempId);
			const appErr = handleAppError(err);
			this.error = appErr.message;
			throw err;
		}
	}
	async settle(settlementId: string) {
		// Update all currently unsettled transactions locally for instant feedback
		const unsettled = this.unsettledTransactions;
		const originalTxs = [...this.transactions];

		this.transactions = this.transactions.map((tx) =>
			!tx.settlement_id ? ({ ...tx, settlement_id: settlementId } as RecordModel) : tx
		);

		try {
			await Promise.all(
				unsettled.map((tx) => transactionApi.update(tx.id, { settlement_id: settlementId }))
			);
			toast.success('Abrechnung abgeschlossen.');
		} catch (err: any) {
			this.transactions = originalTxs;
			const appErr = handleAppError(err);
			this.error = appErr.message;
			toast.error('Abrechnung fehlgeschlagen: ' + appErr.message);
			throw err;
		}
	}

	async updateTransaction(id: string, data: Partial<TransactionCreate>) {
		const originalTxs = [...this.transactions];
		// Optimistic update
		this.transactions = this.transactions.map((tx) =>
			tx.id === id ? ({ ...tx, ...data } as unknown as RecordModel) : tx
		);

		try {
			const record = await transactionApi.update(id, data);
			// Replace with actual updated record
			this.transactions = this.transactions.map((tx) => (tx.id === id ? record : tx));
			toast.success('Transaktion aktualisiert!');
			return record;
		} catch (err: any) {
			if (!navigator.onLine || err.status === 0 || err.isAbort) {
				offlineStore.addAction({ type: 'UPDATE_TX', payload: { id, data } });
				toast.info('Offline gespeichert. Wird synchronisiert, sobald du wieder online bist.');
				return;
			}

			// Rollback
			this.transactions = originalTxs;
			const appErr = handleAppError(err);
			this.error = appErr.message;
			throw err;
		}
	}

	async deleteTransaction(id: string) {
		const originalTxs = [...this.transactions];
		// Optimistic update
		this.transactions = this.transactions.filter((tx) => tx.id !== id);

		try {
			await transactionApi.delete(id);
			toast.success('Transaktion gelöscht!');
		} catch (err: any) {
			if (!navigator.onLine || err.status === 0 || err.isAbort) {
				offlineStore.addAction({ type: 'DELETE_TX', payload: { id } });
				toast.info('Offline gespeichert. Wird synchronisiert, sobald du wieder online bist.');
				return;
			}

			// Rollback
			this.transactions = originalTxs;
			const appErr = handleAppError(err);
			this.error = appErr.message;
		}
	}
}

// Export a singleton instance
export const transactionStore = new TransactionStore();
