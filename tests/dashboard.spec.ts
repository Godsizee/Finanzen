import { test, expect } from '@playwright/test';

test.describe('Dashboard & Transactions', () => {
	test.beforeEach(async ({ page }) => {
		// Log in using localStorage init script
		await page.addInitScript(() => {
			window.localStorage.setItem(
				'pocketbase_auth',
				JSON.stringify({
					token: 'mock-token-xyz',
					model: {
						id: 'mock-user-id-1',
						verified: true,
						email: 'deine@email.de',
						name: 'Basti',
						partner: 'mock-partner-id-2',
						onboarded: true
					}
				})
			);
		});

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
				body: JSON.stringify({
					page: 1,
					perPage: 500,
					totalItems: 2,
					totalPages: 1,
					items: [
						{
							id: 'cat-1',
							name: 'Lebensmittel',
							icon: 'Utensils',
							color: 'emerald'
						},
						{
							id: 'cat-2',
							name: 'Auto',
							icon: 'Car',
							color: 'blue'
						}
					]
				})
			});
		});

		await page.route('**/api/collections/transactions/records**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					page: 1,
					perPage: 30,
					totalItems: 2,
					totalPages: 1,
					items: [
						{
							id: 'tx-1',
							total_amount: 1000,
							date: '2026-06-08T12:00:00Z',
							category: 'cat-1',
							paid_amount_user_a: 1000,
							paid_amount_user_b: 0,
							split_mode: '50_50',
							note: 'Supermarkt',
							settlement_id: ''
						},
						{
							id: 'tx-2',
							total_amount: 2000,
							date: '2026-06-08T13:00:00Z',
							category: 'cat-2',
							paid_amount_user_a: 0,
							paid_amount_user_b: 2000,
							split_mode: '50_50',
							note: 'Tanken',
							settlement_id: ''
						}
					]
				})
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

	test('renders dashboard layout and items correctly', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Check logo and app name
		const title = page.locator('header h1');
		await expect(title).toContainText('FairShare');

		// Check transaction list items are rendered
		const supermarktTx = page.locator('text=Supermarkt');
		await expect(supermarktTx).toBeVisible();

		const tankenTx = page.locator('text=Tanken');
		await expect(tankenTx).toBeVisible();
	});
});
