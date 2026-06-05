<script lang="ts">
	import Card from '$lib/ui/Card.svelte';
	import { transactionStore } from '../store.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { ChevronLeft, ChevronRight, BarChart3 } from '@lucide/svelte';

	let currentMonth = $state(new Date());

	// Localized name of current month
	let monthLabel = $derived(currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }));

	function handlePrevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function handleNextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	// Filter transactions for this month
	let monthTransactions = $derived(
		transactionStore.transactions.filter((tx) => {
			const date = new Date(tx.date);
			return date.getMonth() === currentMonth.getMonth() && 
			       date.getFullYear() === currentMonth.getFullYear();
		})
	);

	// Total expenses in this month (exclude deposits)
	let totalExpenses = $derived(
		monthTransactions
			.filter(tx => tx.split_mode !== 'deposit')
			.reduce((acc, tx) => acc + tx.total_amount, 0)
	);

	const colorMap: Record<string, string> = {
		emerald: 'bg-emerald-500',
		blue: 'bg-blue-500',
		amber: 'bg-amber-500',
		indigo: 'bg-indigo-500',
		slate: 'bg-slate-400'
	};

	const bgMap: Record<string, string> = {
		emerald: 'bg-emerald-100',
		blue: 'bg-blue-100',
		amber: 'bg-amber-100',
		indigo: 'bg-indigo-100',
		slate: 'bg-slate-100'
	};

	// Calculate statistics by category
	let stats = $derived.by(() => {
		const map = new Map<string, number>();
		
		for (const cat of categoryStore.categories) {
			map.set(cat.id, 0);
		}

		for (const tx of monthTransactions) {
			if (tx.split_mode === 'deposit') continue;
			const catId = tx.category || '';
			if (catId) {
				map.set(catId, (map.get(catId) || 0) + tx.total_amount);
			} else {
				// Fallback to "Sonstiges"
				const sonstiges = categoryStore.categories.find(c => c.name === 'Sonstiges');
				if (sonstiges) {
					map.set(sonstiges.id, (map.get(sonstiges.id) || 0) + tx.total_amount);
				}
			}
		}

		return categoryStore.categories
			.map((cat) => {
				const amount = map.get(cat.id) || 0;
				const percent = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
				return {
					id: cat.id,
					name: cat.name,
					color: cat.color,
					amount,
					percent
				};
			})
			.filter(s => s.amount > 0)
			.sort((a, b) => b.amount - a.amount);
	});
</script>

<Card class="flex flex-col gap-4 mt-6">
	<!-- Month Selector Header -->
	<div class="flex items-center justify-between">
		<button 
			onclick={handlePrevMonth} 
			class="p-2 -ml-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
			aria-label="Vorheriger Monat"
		>
			<ChevronLeft size={20} class="text-slate-600" />
		</button>
		<span class="font-bold text-slate-800 text-sm select-none">{monthLabel}</span>
		<button 
			onclick={handleNextMonth} 
			class="p-2 -mr-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
			aria-label="Nächster Monat"
		>
			<ChevronRight size={20} class="text-slate-600" />
		</button>
	</div>

	<div class="h-px bg-slate-100"></div>

	<!-- Total Expense Summary -->
	<div class="flex justify-between items-center px-1">
		<div class="flex items-center gap-2 text-slate-500">
			<BarChart3 size={18} />
			<span class="text-xs font-semibold uppercase tracking-wider">Monatsausgaben</span>
		</div>
		<span class="font-bold text-slate-900 text-lg">
			{formatCurrency(totalExpenses)}
		</span>
	</div>

	<!-- Category Breakdown Bars -->
	<div class="flex flex-col gap-3 mt-1">
		{#if stats.length === 0}
			<div class="text-center py-6 text-slate-400 text-xs">
				Keine Ausgaben in diesem Monat.
			</div>
		{:else}
			{#each stats as item (item.id)}
				<div class="flex flex-col gap-1.5">
					<div class="flex justify-between text-xs font-medium">
						<span class="text-slate-700">{item.name}</span>
						<span class="text-slate-900 font-semibold">
							{formatCurrency(item.amount)} ({item.percent}%)
						</span>
					</div>
					<!-- Custom Progress Bar -->
					<div class="w-full h-2 rounded-full {bgMap[item.color] || 'bg-slate-100'} overflow-hidden">
						<div 
							class="h-full rounded-full transition-all duration-300 {colorMap[item.color] || 'bg-slate-500'}"
							style="width: {item.percent}%"
						></div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</Card>
