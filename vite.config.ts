import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'FairShare Haushaltsbuch',
				short_name: 'FairShare',
				description: 'Progressive Web App für faire Haushaltsfinanzen',
				theme_color: '#f8fafc',
				background_color: '#f8fafc',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				orientation: 'portrait',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/pocketbase-finanzen\.dasdann\.jetzt\/api\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pb-api-cache',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 24 * 60 * 60 // 24 hours
							},
							networkTimeoutSeconds: 5
						}
					}
				]
			}
		})
	]
});
