import { transactionApi, type TransactionCreate } from './api';
import type { RecordModel } from 'pocketbase';
import { calculateBalance } from '$lib/core/math';

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
	
	// Derived states for balances based ONLY on unsettled transactions
	balanceUserA = $derived(this.calculateTotalBalance('a'));
	balanceUserB = $derived(this.calculateTotalBalance('b'));

	private calculateTotalBalance(user: 'a' | 'b'): number {
		return this.unsettledTransactions.reduce((acc, tx) => {
			const paid = user === 'a' ? tx.paid_amount_user_a : tx.paid_amount_user_b;
			return acc + calculateBalance(tx.total_amount, paid, tx.split_mode);
		}, 0);
	}

	async load() {
		this.loading = true;
		this.error = null;
		try {
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
		} catch (err: any) {
			// Rollback
			this.transactions = this.transactions.filter((tx) => tx.id !== tempId);
			this.error = err.message || 'Error adding transaction';
			// Here you could also trigger a toast notification
			alert('Fehler beim Speichern der Transaktion: ' + this.error);
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
			alert('Fehler beim Abrechnen: ' + this.error);
		}
	}
}

// Export a singleton instance
export const transactionStore = new TransactionStore();
