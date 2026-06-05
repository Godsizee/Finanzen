import { recurringApi } from './api';
import { transactionApi } from '$lib/features/transactions/api';
import type { RecordModel } from 'pocketbase';
import { toast } from '$lib/core/toastStore.svelte';

class RecurringStore {
	expenses = $state<RecordModel[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);
	generating = $state(false);

	async load() {
		this.loading = true;
		this.error = null;
		try {
			this.expenses = await recurringApi.getAll();
		} catch (err: any) {
			this.error = err.message || 'Fehler beim Laden der wiederkehrenden Ausgaben';
			toast.error(this.error);
		} finally {
			this.loading = false;
		}
	}

	async create(data: Parameters<typeof recurringApi.create>[0]) {
		try {
			const record = await recurringApi.create(data);
			this.expenses = [record, ...this.expenses];
			toast.success('Wiederkehrende Ausgabe angelegt');
			
			// Trigger generation immediately for new rule
			await this.generateDueTransactions();
			
			return record;
		} catch (err: any) {
			toast.error('Fehler beim Erstellen: ' + (err.message || err));
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
		} catch (err: any) {
			toast.error('Fehler beim Aktualisieren: ' + (err.message || err));
			throw err;
		}
	}

	async delete(id: string) {
		try {
			await recurringApi.delete(id);
			this.expenses = this.expenses.filter((e) => e.id !== id);
			toast.success('Wiederkehrende Ausgabe gelöscht');
		} catch (err: any) {
			toast.error('Fehler beim Löschen: ' + (err.message || err));
			throw err;
		}
	}

	// Calculate due dates for a single recurring expense rule
	getDueDates(startDateStr: string, dayOfMonth: number, frequency: string, lastGeneratedStr: string | null): Date[] {
		const start = new Date(startDateStr);
		start.setUTCHours(12, 0, 0, 0);

		let current = new Date(start);
		if (lastGeneratedStr) {
			const lastGen = new Date(lastGeneratedStr);
			lastGen.setUTCHours(12, 0, 0, 0);
			current = new Date(lastGen);
			
			if (frequency === 'monthly') {
				current.setUTCMonth(current.getUTCMonth() + 1);
			} else if (frequency === 'quarterly') {
				current.setUTCMonth(current.getUTCMonth() + 3);
			} else if (frequency === 'yearly') {
				current.setUTCFullYear(current.getUTCFullYear() + 1);
			}
		}
		
		current.setUTCDate(dayOfMonth);

		const today = new Date();
		today.setHours(12, 0, 0, 0);

		const dueDates: Date[] = [];
		
		if (current < start) {
			if (frequency === 'monthly') {
				current.setUTCMonth(current.getUTCMonth() + 1);
			} else if (frequency === 'quarterly') {
				current.setUTCMonth(current.getUTCMonth() + 3);
			} else if (frequency === 'yearly') {
				current.setUTCFullYear(current.getUTCFullYear() + 1);
			}
		}

		while (current <= today) {
			dueDates.push(new Date(current));
			
			if (frequency === 'monthly') {
				current.setUTCMonth(current.getUTCMonth() + 1);
			} else if (frequency === 'quarterly') {
				current.setUTCMonth(current.getUTCMonth() + 3);
			} else if (frequency === 'yearly') {
				current.setUTCFullYear(current.getUTCFullYear() + 1);
			}
		}
		
		return dueDates;
	}

	// Trigger transaction generation for all active rules
	async generateDueTransactions() {
		if (this.generating) return;
		this.generating = true;
		
		try {
			// Reload rules to make sure we have the latest state
			const rules = await recurringApi.getAll();
			this.expenses = rules;

			const activeRules = rules.filter(r => r.active);
			let generatedCount = 0;

			for (const rule of activeRules) {
				const dueDates = this.getDueDates(
					rule.start_date,
					rule.day_of_month,
					rule.frequency,
					rule.last_generated
				);

				if (dueDates.length === 0) continue;

				console.log(`Generating ${dueDates.length} transactions for rule "${rule.name}"`);
				
				let latestDateStr = rule.last_generated;

				for (const dueDate of dueDates) {
					// Format date to PocketBase format: YYYY-MM-DD 12:00:00
					const formattedDate = dueDate.toISOString().slice(0, 10) + ' 12:00:00';
					
					// Create transaction
					await transactionApi.create({
						total_amount: rule.amount,
						date: formattedDate,
						paid_by: rule.paid_by,
						split_mode: rule.split_mode,
						note: rule.name,
						category: rule.category
					});

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

			if (generatedCount > 0) {
				console.log(`Successfully generated ${generatedCount} recurring transactions!`);
			}
		} catch (err: any) {
			console.error('Fehler bei der automatischen Generierung:', err);
		} finally {
			this.generating = false;
		}
	}

	subscribe() {
		const unsubscribe = recurringApi.subscribe((e) => {
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
