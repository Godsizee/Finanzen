import { transactionApi, type TransactionCreate } from './api';
import type { RecordModel } from 'pocketbase';
import { calculateBalance } from '$lib/core/math';
import { toast } from '$lib/core/toastStore.svelte';
import { authStore } from '$lib/features/auth/authStore.svelte';
import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
import { recurringStore } from '$lib/features/recurring/store.svelte';
import { handleAppError } from '$lib/core/errorHandler';

class TransactionStore {
	transactions = $state<RecordModel[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	private unsubscribe: (() => void) | null = null;

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

	unsettledTransactions = $derived(this.transactions.filter(tx => !tx.settlement_id));
	
	kasseDeposits = $derived(this.transactions.filter(tx => tx.split_mode === 'deposit').reduce((acc, tx) => acc + tx.total_amount, 0));
	kasseExpenses = $derived(this.transactions.filter(tx => tx.split_mode === 'kasse').reduce((acc, tx) => acc + tx.total_amount, 0));
	kasseBalance = $derived(this.kasseDeposits - this.kasseExpenses);

	// Derived states for balances based ONLY on unsettled transactions
	myBalance = $derived(this.calculateTotalBalance());

	fairSharingActive = $derived(
		partnerStore.partnerStatus === 'active' &&
		(authStore.currentUser?.income || 0) > 0 &&
		(partnerStore.partnerUser?.income || 0) > 0
	);

	fairSharingRatio = $derived.by(() => {
		if (!this.fairSharingActive) return 0;
		const myIncome = authStore.currentUser?.income || 0;
		const partnerIncome = partnerStore.partnerUser?.income || 0;
		const total = myIncome + partnerIncome;
		return total > 0 ? myIncome / total : 0;
	});

	fairBalance = $derived.by(() => {
		if (!this.fairSharingActive) return 0;
		const myId = authStore.currentUser?.id;
		if (!myId) return 0;
		
		const ratioA = this.fairSharingRatio;
		
		return this.unsettledTransactions.reduce((acc, tx) => {
			if (tx.split_mode === 'kasse') return acc;
			
			const totalAmount = tx.total_amount;
			const didIPay = tx.paid_by === myId;
			const myShare = Math.round(totalAmount * ratioA);
			const myContribution = didIPay ? totalAmount : 0;
			
			return acc + (myContribution - myShare);
		}, 0);
	});

	private calculateTotalBalance(): number {
		const myId = authStore.currentUser?.id;
		if (!myId) return 0;
		return this.unsettledTransactions.reduce((acc, tx) => {
			if (tx.split_mode === 'kasse') return acc;
			
			const totalAmount = tx.total_amount;
			const didIPay = tx.paid_by === myId;
			
			let myShare = Math.round(totalAmount / 2); // Default 50_50
			
			if (tx.split_mode === 'fair' && this.fairSharingActive) {
				const ratio = this.fairSharingRatio;
				myShare = Math.round(totalAmount * ratio);
			} else if (tx.split_mode === 'me') {
				myShare = totalAmount;
			} else if (tx.split_mode === 'partner') {
				myShare = 0;
			} else if (tx.split_mode === 'custom' && tx.metadata) {
				try {
					const meta = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
					if (meta.split_cents && meta.split_cents[myId] !== undefined) {
						myShare = meta.split_cents[myId];
					} else if (meta.split_percent && meta.split_percent[myId] !== undefined) {
						myShare = Math.round(totalAmount * (meta.split_percent[myId] / 100));
					}
				} catch (e) {
					console.error('Error parsing custom split metadata', e);
				}
			} else if (tx.split_mode === 'deposit') {
				myShare = Math.round(totalAmount / 2);
			}
			
			const myContribution = didIPay ? totalAmount : 0;
			return acc + (myContribution - myShare);
		}, 0);
	}

	async load() {
		this.loading = true;
		this.error = null;
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
			// Rollback
			this.transactions = this.transactions.filter((tx) => tx.id !== tempId);
			const appErr = handleAppError(err);
			this.error = appErr.message;
		}
	}
	async settle(settlementId: string) {
		// Update all currently unsettled transactions locally for instant feedback
		const unsettled = this.unsettledTransactions;
		const originalTxs = [...this.transactions];
		
		this.transactions = this.transactions.map(tx => 
			!tx.settlement_id ? { ...tx, settlement_id: settlementId } as RecordModel : tx
		);

		try {
			// Update in background
			await Promise.all(unsettled.map(tx => 
				transactionApi.update(tx.id, { settlement_id: settlementId })
			));
		} catch (err: any) {
			// Rollback
			this.transactions = originalTxs;
			const appErr = handleAppError(err);
			this.error = appErr.message;
		}
	}

	async updateTransaction(id: string, data: Partial<TransactionCreate>) {
		const originalTxs = [...this.transactions];
		// Optimistic update
		this.transactions = this.transactions.map(tx => tx.id === id ? { ...tx, ...data } as unknown as RecordModel : tx);

		try {
			const record = await transactionApi.update(id, data);
			// Replace with actual updated record
			this.transactions = this.transactions.map(tx => tx.id === id ? record : tx);
			toast.success('Transaktion aktualisiert!');
		} catch (err: any) {
			// Rollback
			this.transactions = originalTxs;
			const appErr = handleAppError(err);
			this.error = appErr.message;
		}
	}

	async deleteTransaction(id: string) {
		const originalTxs = [...this.transactions];
		// Optimistic update
		this.transactions = this.transactions.filter(tx => tx.id !== id);

		try {
			await transactionApi.delete(id);
			toast.success('Transaktion gelöscht!');
		} catch (err: any) {
			// Rollback
			this.transactions = originalTxs;
			const appErr = handleAppError(err);
			this.error = appErr.message;
		}
	}
}

// Export a singleton instance
export const transactionStore = new TransactionStore();
