import { pb } from '$lib/core/pb';
import type { RecordModel } from 'pocketbase';

export const authApi = {
	async login(email: string, pass: string): Promise<RecordModel> {
		const authData = await pb.collection('users').authWithPassword(email, pass);
		return authData.record;
	},

	async register(email: string, pass: string, name: string): Promise<RecordModel> {
		const data = {
			email: email,
			password: pass,
			passwordConfirm: pass,
			name: name
		};
		const record = await pb.collection('users').create(data);
		
		try {
			await pb.collection('users').requestVerification(email);
		} catch (err) {
			console.error('Verifikations-E-Mail-Fehler:', err);
		}

		// Immediately log in after registration
		await this.login(email, pass);
		return record;
	},

	logout() {
		pb.authStore.clear();
	},

	async updateProfile(data: Partial<RecordModel>): Promise<RecordModel> {
		if (!pb.authStore.record) throw new Error('Not logged in');
		const record = await pb.collection('users').update(pb.authStore.record.id, data);
		return record;
	}
};
