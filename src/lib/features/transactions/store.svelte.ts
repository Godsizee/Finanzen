import { transactionApi, type TransactionCreate } from './api';
import type { RecordModel } from 'pocketbase';
import { calculateBalance } from '$lib/core/math';
import { toast } from '$lib/core/toastStore.svelte';
import { authStore } from '$lib/features/auth/authStore.svelte';
import { recurringStore } from '$lib/features/recurring/store.svelte';

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

	private calculateTotalBalance(): number {
		const myId = authStore.currentUser?.id;
		if (!myId) return 0;
		return this.unsettledTransactions.reduce((acc, tx) => {
			const didIPay = tx.paid_by === myId;
			return acc + calculateBalance(tx.total_amount, tx.split_mode, didIPay);
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
			this.error = err.message || 'Error loading transactions';
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
			toast.success('Ausgabe erfolgreich gespeichert!');
		} catch (err: any) {
			// Rollback
			this.transactions = this.transactions.filter((tx) => tx.id !== tempId);
			this.error = err.message || 'Error adding transaction';
			toast.error('Fehler beim Speichern: ' + this.error);
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
			this.error = err.message || 'Error settling transactions';
			toast.error('Fehler beim Abrechnen: ' + this.error);
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
			this.error = err.message || 'Error updating transaction';
			toast.error('Fehler beim Aktualisieren: ' + this.error);
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
			this.error = err.message || 'Error deleting transaction';
			toast.error('Fehler beim Löschen: ' + this.error);
		}
	}
}

// Export a singleton instance
export const transactionStore = new TransactionStore();
