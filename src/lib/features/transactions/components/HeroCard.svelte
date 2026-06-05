<script lang="ts">
	import Card from '$lib/ui/Card.svelte';
	import { transactionStore } from '../store.svelte';
	import { formatCurrency } from '$lib/core/math';

	// Assuming current user is user A
	let balance = $derived(transactionStore.myBalance);
	let kasseBalance = $derived(transactionStore.kasseBalance);
	let isPositive = $derived(balance >= 0);
</script>

<Card class="bg-slate-900 text-white border-0 p-6 flex flex-col gap-4">
	<div class="flex flex-col gap-1">
		<span class="text-xs text-slate-400 font-semibold tracking-wider uppercase">Gemeinsame Kasse</span>
		<div class="text-4xl font-bold tracking-tight text-emerald-400">
			{formatCurrency(kasseBalance)}
		</div>
	</div>
	
	<div class="h-px bg-slate-800 my-1"></div>
	
	<div class="flex justify-between items-center">
		<span class="text-sm text-slate-400 font-medium">Dein Saldo:</span>
		<div class="text-right">
			<span class="font-semibold text-base {balance === 0 ? 'text-slate-300' : isPositive ? 'text-emerald-400' : 'text-red-400'}">
				{formatCurrency(Math.abs(balance))}
			</span>
			<span class="block text-xs {balance === 0 ? 'text-slate-400' : isPositive ? 'text-emerald-400/80' : 'text-red-400/80'} font-medium mt-0.5">
				{#if balance === 0}
					Ihr seid quitt!
				{:else if isPositive}
					wird dir geschuldet
				{:else}
					schuldest du
				{/if}
			</span>
		</div>
	</div>
</Card>

