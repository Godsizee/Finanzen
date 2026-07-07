import { pb } from '$lib/core/pb';
import type { RecordModel } from 'pocketbase';

export interface GroupCreate {
	name: string;
	description?: string;
	created_by: string;
	invite_code: string;
	default_split_mode?: string;
}

/** Zufälliger Einladungscode (12 Hex-Zeichen), clientseitig generiert. */
export function generateInviteCode(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(6));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const groupApi = {
	/** Alle Gruppen, in denen der eingeloggte User Mitglied ist (via listRule). */
	async getMyGroups(): Promise<RecordModel[]> {
		return await pb.collection('groups').getFullList();
	},

	async getOne(id: string): Promise<RecordModel> {
		return await pb.collection('groups').getOne(id);
	},

	async create(data: GroupCreate): Promise<RecordModel> {
		return await pb.collection('groups').create(data);
	},

	async update(id: string, data: Partial<GroupCreate>): Promise<RecordModel> {
		return await pb.collection('groups').update(id, data);
	},

	async getMembers(groupId: string): Promise<RecordModel[]> {
		return await pb.collection('group_members').getFullList({
			filter: pb.filter('group = {:g}', { g: groupId }),
			expand: 'user'
		});
	},

	/** Fügt ein Mitglied hinzu. Erlaubt für Gruppen-Ersteller (self, admin),
	 *  Selbst-Beitritt mit Einladungscode oder Gruppen-Admins (siehe createRule). */
	async addMember(
		groupId: string,
		userId: string,
		role: 'admin' | 'member' | 'readonly',
		inviteCode?: string
	): Promise<RecordModel> {
		return await pb.collection('group_members').create({
			group: groupId,
			user: userId,
			role,
			invite_code: inviteCode || '',
			is_active: true
		});
	},

	async removeMember(membershipId: string): Promise<boolean> {
		return await pb.collection('group_members').delete(membershipId);
	}
};
