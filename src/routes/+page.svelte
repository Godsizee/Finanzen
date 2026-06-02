<script lang="ts">
	import { onMount } from 'svelte';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import HeroCard from '$lib/features/transactions/components/HeroCard.svelte';
	import TransactionList from '$lib/features/transactions/components/TransactionList.svelte';
	import { Plus } from '@lucide/svelte';

	onMount(() => {
		transactionStore.load();
	});
</script>

<div class="p-4 pt-8 h-full flex flex-col relative">
	<header class="mb-6 px-1 flex justify-between items-center">
		<h1 class="text-2xl font-bold tracking-tight text-slate-900">Übersicht</h1>
		<a href="/history" class="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
			Historie
		</a>
	</header>
	
	<HeroCard />
	
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
