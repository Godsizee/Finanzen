import { toast } from './toastStore.svelte';
import { authStore } from '$lib/features/auth/authStore.svelte';
import { goto } from '$app/navigation';

export class AppError extends Error {
	constructor(
		message: string,
		public code: string = 'UNKNOWN',
		public status: number = 0
	) {
		super(message);
		this.name = 'AppError';
	}
}

export function handleAppError(err: any): AppError {
	console.error('Captured application error:', err);
	
	let message = 'Ein unerwarteter Fehler ist aufgetreten.';
	let code = 'UNKNOWN';
	let status = 0;

	if (err && typeof err === 'object') {
		if (err.status) {
			status = err.status;
			if (err.status === 401 || err.status === 403) {
				message = 'Sitzung abgelaufen oder nicht autorisiert. Bitte logge dich neu ein.';
				code = 'UNAUTHORIZED';
				authStore.logout();
				goto('/login');
			} else if (err.status === 400) {
				if (err.response?.data) {
					const data = err.response.data;
					const firstKey = Object.keys(data)[0];
					if (firstKey) {
						message = `Ungültige Eingabe: ${firstKey} - ${data[firstKey].message}`;
					} else {
						message = err.message || 'Fehlerhafte Anfrage.';
					}
				} else {
					message = err.message || 'Fehlerhafte Anfrage.';
				}
				code = 'BAD_REQUEST';
			} else if (err.status === 404) {
				message = 'Die angeforderte Ressource wurde nicht gefunden.';
				code = 'NOT_FOUND';
			} else if (err.status >= 500) {
				message = 'Der Server hat ein Problem. Bitte versuche es später noch einmal.';
				code = 'SERVER_ERROR';
			}
		} else if (err.message) {
			if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
				message = 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
				code = 'NETWORK_ERROR';
			} else {
				message = err.message;
			}
		}
	} else if (typeof err === 'string') {
		message = err;
	}

	const appError = new AppError(message, code, status);
	toast.error(message);
	return appError;
}
