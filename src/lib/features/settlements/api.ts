import { pb } from '$lib/core/pb';
import type { RecordModel } from 'pocketbase';

export interface SettlementCreate {
	date: string;
	amount: number;
	from_user: 'a' | 'b';
	to_user: 'a' | 'b';
}

export const settlementApi = {
	async getAll(): Promise<RecordModel[]> {
		return await pb.collection('settlements').getFullList({
			sort: '-date'
		});
	},

	async create(data: SettlementCreate): Promise<RecordModel> {
		return await pb.collection('settlements').create(data);
	}
};
