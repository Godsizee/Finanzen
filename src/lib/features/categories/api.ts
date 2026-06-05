import { pb } from '$lib/core/pb';
import type { RecordModel } from 'pocketbase';

export interface CategoryCreate {
	name: string;
	icon: string;
	color: string;
}

export const categoryApi = {
	async getAll(): Promise<RecordModel[]> {
		return await pb.collection('categories').getFullList({
			sort: 'name'
		});
	},

	async create(data: CategoryCreate): Promise<RecordModel> {
		return await pb.collection('categories').create(data);
	}
};
