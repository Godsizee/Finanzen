import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Mock PocketBase API requests
		await page.route('**/api/collections/users/auth-refresh', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					token: 'mock-token-xyz',
					record: {
						id: 'mock-user-id-1',
						verified: true,
						email: 'deine@email.de',
						name: 'Basti',
						partner: 'mock-partner-id-2',
						onboarded: true
					}
				})
			});
		});

		await page.route('**/api/collections/users/records/mock-partner-id-2', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					id: 'mock-partner-id-2',
					name: 'Partner',
					email: 'partner@email.de',
					partner: 'mock-user-id-1'
				})
			});
		});

		await page.route('**/api/collections/categories/records**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ page: 1, perPage: 500, totalItems: 0, totalPages: 0, items: [] })
			});
		});

		await page.route('**/api/collections/transactions/records**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ page: 1, perPage: 30, totalItems: 0, totalPages: 0, items: [] })
			});
		});

		await page.route('**/api/collections/recurring_expenses/records**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ page: 1, perPage: 500, totalItems: 0, totalPages: 0, items: [] })
			});
		});

		await page.route('**/api/realtime', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'text/event-stream',
				body: 'retry: 10000\n\n'
			});
		});

		// Console and page error logging for debugging
		page.on('console', (msg) => {
			console.log(`PAGE CONSOLE [${msg.type()}]: ${msg.text()}`);
		});
		page.on('pageerror', (err) => {
			console.log(`PAGE ERROR: ${err.message}\n${err.stack || ''}`);
		});
	});

	test('shows error toast on invalid credentials', async ({ page }) => {
		await page.route('**/api/collections/users/auth-with-password', async (route) => {
			await route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({
					code: 400,
					message: 'Failed to authenticate.',
					data: {}
				})
			});
		});

		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		await page.fill('#email', 'wrong@email.de');
		await page.fill('#password', 'wrongpass');
		await page.click('button[type="submit"]');

		const toast = page.locator('.bg-red-600');
		await expect(toast).toBeVisible();
		await expect(toast).toContainText('Login fehlgeschlagen');
	});

	test('logs in successfully and redirects to dashboard', async ({ page }) => {
		await page.route('**/api/collections/users/auth-with-password', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					token: 'mock-token-xyz',
					record: {
						id: 'mock-user-id-1',
						verified: true,
						email: 'deine@email.de',
						name: 'Basti',
						partner: 'mock-partner-id-2',
						onboarded: true
					}
				})
			});
		});

		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		await page.fill('#email', 'deine@email.de');
		await page.fill('#password', 'validpass');
		await page.click('button[type="submit"]');

		await expect(page).toHaveURL('/');
	});
});
