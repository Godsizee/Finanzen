import { pb } from '$lib/core/pb';
import { authApi } from './api';
import type { RecordModel } from 'pocketbase';
import { toast } from '$lib/core/toastStore.svelte';

class AuthStore {
	currentUser = $state<RecordModel | null>(pb.authStore.record);
	isLoggedIn = $derived(this.currentUser !== null);

	constructor() {
		pb.authStore.onChange((token, record) => {
			this.currentUser = record;
		});
	}

	async login(email: string, pass: string) {
		try {
			await authApi.login(email, pass);
			toast.success('Erfolgreich eingeloggt!');
		} catch (err) {
			const msg = err instanceof Error ? err.message : '';
			toast.error('Login fehlgeschlagen: ' + (msg || 'Falsche Daten?'));
			throw err;
		}
	}

	async register(email: string, pass: string, name: string) {
		try {
			await authApi.register(email, pass, name);
			toast.success('Registrierung erfolgreich!');
		} catch (err) {
			const msg = err instanceof Error ? err.message : '';
			toast.error('Registrierung fehlgeschlagen: ' + (msg || 'Ein Fehler ist aufgetreten'));
			throw err;
		}
	}

	logout() {
		authApi.logout();
		toast.info('Erfolgreich abgemeldet.');
	}
}

export const authStore = new AuthStore();
