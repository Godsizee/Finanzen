import { recurringApi } from './api';
import { transactionApi } from '$lib/features/transactions/api';
import type { RecordModel } from 'pocketbase';
import { toast } from '$lib/core/toastStore.svelte';
import { authStore } from '$lib/features/auth/authStore.svelte';
import { handleAppError } from '$lib/core/errorHandler';
import { groupStore } from '$lib/features/groups/store.svelte';
import { SvelteDate } from 'svelte/reactivity';
import { generateDeterministicId } from '$lib/core/math';
import { getDueDates } from './dateUtils';

interface PocketBaseError {
	message?: string;
	response?: {
		data?: Record<string, unknown>;
	};
}

class RecurringStore {
	expenses = $state<RecordModel[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	generating = $state(false);

	async load() {
		if (!authStore.isLoggedIn) return;
		this.loading = true;
		this.error = null;
		try {
			await groupStore.init();
			this.expenses = await recurringApi.getAll(groupStore.activeGroupId ?? undefined);
		} catch (err) {
			const appErr = handleAppError(err);
			this.error = appErr.message;
		} finally {
			this.loading = false;
		}
	}

	async create(data: Parameters<typeof recurringApi.create>[0]) {
		try {
			if (!data.group && groupStore.activeGroupId) data.group = groupStore.activeGroupId;
			const record = await recurringApi.create(data);
			this.expenses = [record, ...this.expenses];
			toast.success('Wiederkehrende Ausgabe angelegt');

			// Trigger generation immediately for new rule
			await this.generateDueTransactions();

			return record;
		} catch (err) {
			handleAppError(err);
			throw err;
		}
	}

	async update(id: string, data: Parameters<typeof recurringApi.update>[1]) {
		try {
			const record = await recurringApi.update(id, data);
			this.expenses = this.expenses.map((e) => (e.id === id ? record : e));
			toast.success('Wiederkehrende Ausgabe aktualisiert');

			// Trigger generation in case active state or dates changed
			await this.generateDueTransactions();

			return record;
		} catch (err) {
			handleAppError(err);
			throw err;
		}
	}

	async delete(id: string) {
		try {
			await recurringApi.delete(id);
			this.expenses = this.expenses.filter((e) => e.id !== id);
			toast.success('Wiederkehrende Ausgabe gelöscht');
		} catch (err) {
			handleAppError(err);
			throw err;
		}
	}

	// Calculate due dates for a single recurring expense rule
	getDueDates(
		startDateStr: string,
		dayOfMonth: number,
		frequency: string,
		lastGeneratedStr: string | null
	): Date[] {
		return getDueDates(startDateStr, dayOfMonth, frequency, lastGeneratedStr);
	}

	// Trigger transaction generation for all active rules
	async generateDueTransactions() {
		if (this.generating) return;
		this.generating = true;

		try {
			// Reload rules to make sure we have the latest state
			await groupStore.init();
			const rules = await recurringApi.getAll(groupStore.activeGroupId ?? undefined);
			this.expenses = rules;

			const activeRules = rules.filter((r) => r.active);
			let generatedCount = 0;

			for (const rule of activeRules) {
				const dueDates = this.getDueDates(
					rule.start_date,
					rule.day_of_month,
					rule.frequency,
					rule.last_generated
				);

				if (dueDates.length === 0) continue;

				let latestDateStr = rule.last_generated;

				for (const dueDate of dueDates) {
					// Format date to PocketBase format: YYYY-MM-DD 12:00:00
					const formattedDate = dueDate.toISOString().slice(0, 10) + ' 12:00:00';
					const deterministicId = generateDeterministicId(rule.id, formattedDate);

					try {
						// Create transaction
						await transactionApi.create({
							id: deterministicId,
							total_amount: rule.amount,
							date: formattedDate,
							paid_by: rule.paid_by,
							split_mode: rule.split_mode,
							note: rule.name,
							category: rule.category,
							group: rule.group || groupStore.activeGroupId || ''
						});
					} catch (err: any) {
						if (err.status === 400 || err.message?.includes('constraint') || err.message?.includes('already exists')) {
							console.log('Transaction already generated, skipping...');
						} else {
							throw err;
						}
					}

					latestDateStr = formattedDate;
					generatedCount++;
				}

				// Update last_generated on the rule
				if (latestDateStr) {
					await recurringApi.update(rule.id, {
						last_generated: latestDateStr
					});
				}
			}
		} catch (err) {
			console.error('Fehler bei der automatischen Generierung:', err);
			const pbErr = err as PocketBaseError;
			const details = pbErr.response?.data
				? JSON.stringify(pbErr.response.data)
				: pbErr.message || String(err);
			toast.error('Generierungsfehler: ' + details);
		} finally {
			this.generating = false;
		}
	}

	subscribe() {
		const unsubscribe = recurringApi.subscribe((e) => {
			// Nur Events der aktiven Gruppe verarbeiten
			if (e.record.group && e.record.group !== groupStore.activeGroupId) return;
			if (e.action === 'create') {
				if (!this.expenses.some((x) => x.id === e.record.id)) {
					this.expenses = [e.record, ...this.expenses];
				}
			} else if (e.action === 'update') {
				this.expenses = this.expenses.map((x) => (x.id === e.record.id ? e.record : x));
			} else if (e.action === 'delete') {
				this.expenses = this.expenses.filter((x) => x.id !== e.record.id);
			}
		});
		return unsubscribe;
	}
}

export const recurringStore = new RecurringStore();
