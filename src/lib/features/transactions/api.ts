import { pb } from '$lib/core/pb';
import { groupStore } from '$lib/features/groups/store.svelte';
import type { RecordModel } from 'pocketbase';

export interface TransactionCreate {
	id?: string;
	total_amount: number;
	date: string;
	paid_by: string; // User ID
	split_mode: string;
	note?: string;
	category?: string;
	group?: string; // Group ID (Mandant)
	metadata?: unknown;
}

export const transactionApi = {
	async getAll(groupId?: string): Promise<RecordModel[]> {
		const g = groupId ?? groupStore.activeGroupId;
		return await pb.collection('transactions').getFullList({
			sort: '-date',
			expand: 'category',
			...(g ? { filter: pb.filter('group = {:g}', { g }) } : {})
		});
	},

	async create(data: TransactionCreate): Promise<RecordModel> {
		// Fallback für alte Offline-Queue-Einträge ohne group
		const payload = { ...data, group: data.group || groupStore.activeGroupId || '' };
		return await pb.collection('transactions').create(payload, {
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
