import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

// Disable auto-cancellation to prevent issues with rapid concurrent requests
pb.autoCancellation(false);

