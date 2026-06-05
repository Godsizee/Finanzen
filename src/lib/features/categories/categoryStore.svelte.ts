import { categoryApi } from './api';
import type { RecordModel } from 'pocketbase';
import { toast } from '$lib/core/toastStore.svelte';

class CategoryStore {
	categories = $state<RecordModel[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async load() {
		this.loading = true;
		this.error = null;
		try {
			let list = await categoryApi.getAll();
			
			// If empty, perform seeding of default categories
			if (list.length === 0) {
				console.log("Seeding default categories...");
				const defaults = [
					{ name: 'Lebensmittel', icon: 'ShoppingBag', color: 'emerald' },
					{ name: 'Haushalt', icon: 'Home', color: 'blue' },
					{ name: 'Freizeit', icon: 'Sparkles', color: 'amber' },
					{ name: 'Auto', icon: 'Car', color: 'indigo' },
					{ name: 'Sonstiges', icon: 'CircleEllipsis', color: 'slate' }
				];
				
				const created = [];
				for (const cat of defaults) {
					const record = await categoryApi.create(cat);
					created.push(record);
				}
				list = created;
				console.log("Categories seeded successfully!");
			}
			
			this.categories = list;
		} catch (err: any) {
			this.error = err.message || 'Error loading categories';
			toast.error('Fehler beim Laden der Kategorien: ' + this.error);
		} finally {
			this.loading = false;
		}
	}
}

export const categoryStore = new CategoryStore();
