<script lang="ts">
	import { onMount } from 'svelte';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import HeroCard from '$lib/features/transactions/components/HeroCard.svelte';
	import MonthlyStats from '$lib/features/transactions/components/MonthlyStats.svelte';
	import TransactionList from '$lib/features/transactions/components/TransactionList.svelte';
	import { Plus, User } from '@lucide/svelte';

	onMount(() => {
		transactionStore.load();
		categoryStore.load();
	});
</script>

<div class="p-4 pt-8 h-full flex flex-col relative">
	<header class="mb-6 px-1 flex justify-between items-center">
		<h1 class="text-2xl font-bold tracking-tight text-slate-900">Übersicht</h1>
		<div class="flex items-center gap-4">
			<a href="/history" class="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
				Historie
			</a>
			<a href="/profile" class="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
				<User size={18} />
			</a>
		</div>
	</header>
	
	<HeroCard />

	<MonthlyStats />
	
	<TransactionList />

	<!-- Floating Action Button -->
	<a 
		href="/add" 
		class="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 transition-transform active:scale-95 z-50"
		aria-label="Neue Ausgabe hinzufügen"
	>
		<Plus size={24} />
	</a>
</div>

