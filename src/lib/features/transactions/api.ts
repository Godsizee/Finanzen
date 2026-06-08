import { pb } from '$lib/core/pb';
import type { RecordModel } from 'pocketbase';

export interface TransactionCreate {
	id?: string;
	total_amount: number;
	date: string;
	paid_by: string; // User ID
	split_mode: string;
	note?: string;
	category?: string;
	metadata?: unknown;
}

export const transactionApi = {
	async getAll(): Promise<RecordModel[]> {
		return await pb.collection('transactions').getFullList({
			sort: '-date',
			expand: 'category'
		});
	},

	async create(data: TransactionCreate): Promise<RecordModel> {
		return await pb.collection('transactions').create(data, {
			expand: 'category'
		});
	},

	async update(
		id: string,
		data: Partial<TransactionCreate & { settlement_id: string | null }>
	): Promise<RecordModel> {
		return await pb.collection('transactions').update(id, data, {
			expand: 'category'
		});
	},

	async delete(id: string): Promise<boolean> {
		return await pb.collection('transactions').delete(id);
	},

	subscribe(callback: (e: { action: string; record: RecordModel }) => void) {
		pb.collection('transactions').subscribe('*', callback);
		return () => {
			pb.collection('transactions').unsubscribe('*');
		};
	}
};
