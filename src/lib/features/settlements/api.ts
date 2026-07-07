import { pb } from '$lib/core/pb';
import type { RecordModel } from 'pocketbase';

export interface SettlementCreate {
	date: string;
	amount: number;
	created_by: string;
	settled_with: string;
	group?: string; // Group ID (Mandant)
}

export const settlementApi = {
	async getAll(groupId?: string): Promise<RecordModel[]> {
		return await pb.collection('settlements').getFullList({
			sort: '-date',
			...(groupId ? { filter: pb.filter('group = {:g}', { g: groupId }) } : {})
		});
	},

	async create(data: SettlementCreate): Promise<RecordModel> {
		return await pb.collection('settlements').create(data);
	}
};
