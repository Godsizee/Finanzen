<script lang="ts">
	import Card from '$lib/ui/Card.svelte';
	import { transactionStore } from '../store.svelte';
	import { formatCurrency } from '$lib/core/math';

	// Assuming current user is user A for this mock
	let balance = $derived(transactionStore.balanceUserA);
	let isPositive = $derived(balance >= 0);
</script>

<Card class="bg-slate-900 text-white border-0">
	<div class="flex flex-col gap-1">
		<span class="text-sm text-slate-300 font-medium tracking-wide uppercase">Aktueller Stand</span>
		<div class="text-4xl font-semibold tracking-tight mt-1">
			{formatCurrency(Math.abs(balance))}
		</div>
		<div class="mt-2 text-sm font-medium {isPositive ? 'text-emerald-400' : 'text-red-400'}">
			{#if balance === 0}
				Ihr seid quitt!
			{:else if isPositive}
				Dir wird geschuldet
			{:else}
				Du schuldest
			{/if}
		</div>
	</div>
</Card>
