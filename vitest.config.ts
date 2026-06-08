import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			'$env/static/public': path.resolve(__dirname, './src/lib/core/env-mock.ts')
		}
	}
});
