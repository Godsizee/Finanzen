import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

// Disable auto-cancellation to prevent issues with rapid concurrent requests
pb.autoCancellation(false);

// Auto logout and redirect on 401/403 Unauthorized
pb.afterSend = (response: Response, data: any) => {
	if (response.status === 401 || response.status === 403) {
		pb.authStore.clear();
		if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
			window.location.href = '/login';
		}
	}
	return data;
};
