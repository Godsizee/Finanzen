<script lang="ts">
	import { goto } from '$app/navigation';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { settlementApi } from '$lib/features/settlements/api';
	import { formatCurrency } from '$lib/core/math';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import { ArrowLeft, CheckCircle2, History } from '@lucide/svelte';

	let unsettled = $derived(transactionStore.unsettledTransactions);
	let balanceA = $derived(transactionStore.balanceUserA);
	let settledTxs = $derived(transactionStore.transactions.filter(tx => !!tx.settlement_id));
	
	let loading = $state(false);

	async function handleSettle() {
		if (unsettled.length === 0) return;
		if (balanceA === 0) {
			alert('Ihr seid quitt, keine Abrechnung nötig.');
			// We can still mark them as settled with amount 0
		}

		loading = true;
		try {
			const amount = Math.abs(balanceA);
			const fromUser = balanceA > 0 ? 'b' : 'a'; // if balanceA is positive, B owes A. So from B to A.
			const toUser = balanceA > 0 ? 'a' : 'b';

			// Create settlement record
			const settlement = await settlementApi.create({
				date: new Date().toISOString(),
				amount,
				from_user: fromUser,
				to_user: toUser
			});

			// Update all unsettled transactions
			await transactionStore.settle(settlement.id);
			alert('Abrechnung erfolgreich abgeschlossen!');
		} catch (e: any) {
			alert('Fehler bei der Abrechnung: ' + e.message);
		} finally {
			loading = false;
		}
	}
</script>

<div class="p-4 pt-8 h-full flex flex-col bg-slate-50">
	<header class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<button onclick={() => goto('/')} class="p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors">
				<ArrowLeft size={24} class="text-slate-900" />
			</button>
			<h1 class="text-xl font-bold tracking-tight text-slate-900">Historie & Abrechnung</h1>
		</div>
	</header>

	{#if unsettled.length > 0}
		<Card class="bg-emerald-50 border-emerald-100 mb-8 p-5">
			<h2 class="text-emerald-900 font-semibold mb-2">Offene Abrechnung</h2>
			<p class="text-sm text-emerald-700 mb-4">Es gibt {unsettled.length} offene Transaktionen.</p>
			
			<div class="flex items-center justify-between mb-4">
				<span class="text-emerald-900 font-medium text-sm">Ausgleichsbetrag:</span>
				<span class="text-emerald-900 font-bold text-lg">{formatCurrency(Math.abs(balanceA))}</span>
			</div>
			
			<Button onclick={handleSettle} class="w-full" variant="primary">
				<CheckCircle2 size={18} class="mr-2" />
				{loading ? 'Rechne ab...' : 'Jetzt abrechnen'}
			</Button>
		</Card>
	{/if}

	<div class="flex flex-col gap-6">
		<section>
			<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">Offene Ausgaben</h3>
			{#if unsettled.length === 0}
				<p class="text-sm text-slate-400 px-1">Keine offenen Ausgaben.</p>
			{/if}
			<div class="flex flex-col gap-3">
				{#each unsettled as tx (tx.id)}
					<Card class="flex justify-between items-center p-4">
						<div class="flex flex-col">
							<span class="font-medium text-slate-900">{tx.note}</span>
							<span class="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</span>
						</div>
						<span class="font-semibold text-slate-900">{formatCurrency(tx.total_amount)}</span>
					</Card>
				{/each}
			</div>
		</section>

		<section class="opacity-70">
			<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
				<History size={16} /> Abgerechnet
			</h3>
			{#if settledTxs.length === 0}
				<p class="text-sm text-slate-400 px-1">Bisher keine Historie.</p>
			{/if}
			<div class="flex flex-col gap-3">
				{#each settledTxs as tx (tx.id)}
					<Card class="flex justify-between items-center p-4 bg-slate-50">
						<div class="flex flex-col">
							<span class="font-medium text-slate-900">{tx.note}</span>
							<span class="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</span>
						</div>
						<span class="font-semibold text-slate-900">{formatCurrency(tx.total_amount)}</span>
					</Card>
				{/each}
			</div>
		</section>
	</div>
</div>
