import { json } from '@sveltejs/kit';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export async function GET() {
	try {
		const res = await fetch(`${PUBLIC_POCKETBASE_URL}/api/health`);
		if (!res.ok) {
			throw new Error('PocketBase health check failed');
		}
		return json({ status: 'healthy', database: 'connected' });
	} catch (err: any) {
		console.error('Health check failed:', err);
		return json({ status: 'unhealthy', error: err.message }, { status: 500 });
	}
}
