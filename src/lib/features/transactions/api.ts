import { pb } from '$lib/core/pb';
import type { RecordModel } from 'pocketbase';

export interface TransactionCreate {
	total_amount: number;
	date: string;
	paid_amount_user_a: number;
	paid_amount_user_b: number;
	split_mode: string;
	note?: string;
	category?: string;
}

export const transactionApi = {
	async getAll(): Promise<RecordModel[]> {
		return await pb.collection('transactions').getFullList({
			sort: '-date'
		});
	},

	async create(data: TransactionCreate): Promise<RecordModel> {
		return await pb.collection('transactions').create(data);
	},

	async update(id: string, data: Partial<TransactionCreate & { settlement_id: string }>): Promise<RecordModel> {
		return await pb.collection('transactions').update(id, data);
	},
	
	subscribe(callback: (e: any) => void) {
		pb.collection('transactions').subscribe('*', callback);
		return () => {
			pb.collection('transactions').unsubscribe('*');
		};
	}
};
