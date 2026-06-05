import { pb } from '$lib/core/pb';
import type { RecordModel } from 'pocketbase';

export interface RecurringExpenseCreate {
	name: string;
	amount: number;
	category: string;
	paid_by: string;
	split_mode: string;
	frequency: string; // monthly, quarterly, yearly
	day_of_month: number;
	start_date: string;
	last_generated?: string | null;
	active: boolean;
}

export const recurringApi = {
	async getAll(): Promise<RecordModel[]> {
		return await pb.collection('recurring_expenses').getFullList({
			sort: '-created',
			expand: 'category'
		});
	},

	async create(data: RecurringExpenseCreate): Promise<RecordModel> {
		return await pb.collection('recurring_expenses').create(data, {
			expand: 'category'
		});
	},

	async update(id: string, data: Partial<RecurringExpenseCreate>): Promise<RecordModel> {
		return await pb.collection('recurring_expenses').update(id, data, {
			expand: 'category'
		});
	},

	async delete(id: string): Promise<boolean> {
		return await pb.collection('recurring_expenses').delete(id);
	},
	
	subscribe(callback: (e: any) => void) {
		pb.collection('recurring_expenses').subscribe('*', callback);
		return () => {
			pb.collection('recurring_expenses').unsubscribe('*');
		};
	}
};
