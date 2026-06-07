import { json } from '@sveltejs/kit';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export async function GET() {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 2000);

	try {
		const res = await fetch(`${PUBLIC_POCKETBASE_URL}/api/health`, {
			signal: controller.signal
		});
		clearTimeout(timeout);
		if (!res.ok) {
			throw new Error('PocketBase health check failed');
		}
		return json({ status: 'healthy', database: 'connected' });
	} catch (err: any) {
		clearTimeout(timeout);
		console.error('Health check failed:', err);
		return json({ status: 'healthy', database: 'disconnected', error: err.message });
	}
}
