import PocketBase from 'pocketbase';

// Replace with your actual PocketBase URL when deploying.
// For local development, this is usually http://127.0.0.1:8090
export const pb = new PocketBase('http://127.0.0.1:8090');

// Disable auto-cancellation to prevent issues with rapid concurrent requests
pb.autoCancellation(false);
