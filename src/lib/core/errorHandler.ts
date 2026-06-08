import { toast } from './toastStore.svelte';
import { authStore } from '$lib/features/auth/authStore.svelte';
import { goto } from '$app/navigation';
import { base } from '$app/paths';

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

interface PocketBaseError {
	status?: number;
	message?: string;
	response?: {
		data?: Record<string, { message?: string }>;
	};
}

export function handleAppError(err: unknown): AppError {
	console.error('Captured application error:', err);

	let message = 'Ein unerwarteter Fehler ist aufgetreten.';
	let code = 'UNKNOWN';
	let status = 0;

	if (err && typeof err === 'object') {
		const pbErr = err as PocketBaseError;
		if (pbErr.status) {
			status = pbErr.status;
			if (pbErr.status === 401 || pbErr.status === 403) {
				message = 'Sitzung abgelaufen oder nicht autorisiert. Bitte logge dich neu ein.';
				code = 'UNAUTHORIZED';
				authStore.logout();
				goto(`${base}/login`);
			} else if (pbErr.status === 400) {
				if (pbErr.response?.data) {
					const data = pbErr.response.data;
					const firstKey = Object.keys(data)[0];
					if (firstKey) {
						message = `Ungültige Eingabe: ${firstKey} - ${data[firstKey].message}`;
					} else {
						message = pbErr.message || 'Fehlerhafte Anfrage.';
					}
				} else {
					message = pbErr.message || 'Fehlerhafte Anfrage.';
				}
				code = 'BAD_REQUEST';
			} else if (pbErr.status === 404) {
				message = 'Die angeforderte Ressource wurde nicht gefunden.';
				code = 'NOT_FOUND';
			} else if (pbErr.status >= 500) {
				message = 'Der Server hat ein Problem. Bitte versuche es später noch einmal.';
				code = 'SERVER_ERROR';
			}
		} else if (pbErr.message) {
			if (pbErr.message.includes('Failed to fetch') || pbErr.message.includes('NetworkError')) {
				message = 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
				code = 'NETWORK_ERROR';
			} else {
				message = pbErr.message;
			}
		}
	} else if (typeof err === 'string') {
		message = err;
	}

	const appError = new AppError(message, code, status);
	toast.error(message);
	return appError;
}
