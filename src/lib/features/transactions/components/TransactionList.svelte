<script lang="ts">
	import Card from '$lib/ui/Card.svelte';
	import { transactionStore } from '../store.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { ReceiptText } from '@lucide/svelte';

	let transactions = $derived(transactionStore.transactions);
</script>

<div class="flex flex-col gap-3 mt-8">
	<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Letzte Ausgaben</h3>
	
	{#if transactions.length === 0}
		<div class="text-center py-10 text-slate-400 text-sm">
			Noch keine Ausgaben erfasst.
		</div>
	{/if}

	{#each transactions as tx (tx.id)}
		<Card class="flex items-center gap-4 p-4">
			<div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
				<ReceiptText size={20} />
			</div>
			<div class="flex-1 flex flex-col min-w-0">
				<span class="font-medium text-slate-900 truncate">
					{tx.note || 'Ausgabe'}
				</span>
				<span class="text-xs text-slate-500">
					{new Date(tx.date).toLocaleDateString('de-DE')}
				</span>
			</div>
			<div class="font-semibold text-slate-900">
				{formatCurrency(tx.total_amount)}
			</div>
		</Card>
	{/each}
</div>
