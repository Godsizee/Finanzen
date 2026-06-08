<script lang="ts">
	import { goto } from '$app/navigation';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { settlementApi } from '$lib/features/settlements/api';
	import { formatCurrency } from '$lib/core/math';
	import { toast } from '$lib/core/toastStore.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte';
	import { ArrowLeft, CheckCircle2, History } from '@lucide/svelte';

	let unsettled = $derived(transactionStore.unsettledTransactions);
	let myBalance = $derived(transactionStore.myBalance);
	let settledTxs = $derived(transactionStore.transactions.filter(tx => !!tx.settlement_id));
	
	let loading = $state(false);
	let showConfirm = $state(false);
	let activeTab = $state<'offen' | 'abgerechnet'>('offen');

	function handleSettleClick() {
		if (unsettled.length === 0) return;
		if (myBalance === 0) {
			toast.info('Ihr seid quitt, keine Abrechnung nötig.');
			return;
		}
		if (!authStore.currentUser || !partnerStore.partnerUser) {
			toast.error('Kein Partner für die Abrechnung gefunden.');
			return;
		}
		showConfirm = true;
	}

	async function performSettle() {
		loading = true;
		try {
			const amount = Math.abs(myBalance);

			// Create settlement record
			const settlement = await settlementApi.create({
				date: new Date().toISOString(),
				amount,
				created_by: authStore.currentUser.id,
				settled_with: partnerStore.partnerUser.id
			});

			// Update all unsettled transactions
			await transactionStore.settle(settlement.id);
			toast.success('Abrechnung erfolgreich abgeschlossen!');
		} catch (e: any) {
			toast.error('Fehler bei der Abrechnung: ' + e.message);
		} finally {
			loading = false;
			showConfirm = false;
			activeTab = 'abgerechnet';
		}
	}
	
	let settleMessage = $derived.by(() => {
		if (myBalance > 0) return `Dein Partner überweist dir ${formatCurrency(myBalance)}.`;
		if (myBalance < 0) return `Du überweist deinem Partner ${formatCurrency(Math.abs(myBalance))}.`;
		return 'Ihr seid quitt.';
	});
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
				<span class="text-emerald-900 font-bold text-lg">{formatCurrency(Math.abs(myBalance))}</span>
			</div>
			
			<Button onclick={handleSettleClick} class="w-full" variant="primary">
				<CheckCircle2 size={18} class="mr-2" />
				{loading ? 'Rechne ab...' : 'Jetzt abrechnen'}
			</Button>
		</Card>
	{/if}

	<!-- Segment Control for Tabs -->
	<div class="flex bg-slate-200 p-1 rounded-xl mb-6 mt-2">
		<button 
			type="button"
			class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all {activeTab === 'offen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
			onclick={() => activeTab = 'offen'}
		>
			Offen ({unsettled.length})
		</button>
		<button 
			type="button"
			class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all {activeTab === 'abgerechnet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
			onclick={() => activeTab = 'abgerechnet'}
		>
			Abgerechnet ({settledTxs.length})
		</button>
	</div>

	<div class="flex flex-col gap-6 pb-24">
		{#if activeTab === 'offen'}
		<section class="animate-in fade-in duration-300">
			{#if unsettled.length === 0}
				<p class="text-sm text-slate-400 px-1 text-center py-8">Keine offenen Ausgaben.</p>
			{/if}
			<div class="flex flex-col gap-3">
				{#each unsettled as tx (tx.id)}
					<Card class="flex justify-between items-center p-4">
						<div class="flex flex-col min-w-0">
							<div class="flex items-center gap-2">
								<span class="font-medium text-slate-900 truncate">{tx.note}</span>
								{#if tx.split_mode === 'kasse'}
									<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">Kasse</span>
								{:else if tx.split_mode === 'deposit'}
									<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">Einzahlung</span>
								{/if}
							</div>
							<span class="text-xs text-slate-500 mt-0.5">
								{new Date(tx.date).toLocaleDateString('de-DE')} • 
								{#if tx.split_mode === 'kasse'}
									aus Kasse bezahlt
								{:else if tx.split_mode === 'deposit'}
									von {tx.paid_by === authStore.currentUser?.id ? 'Dir' : 'Partner'}
								{:else}
									bezahlt von {tx.paid_by === authStore.currentUser?.id ? 'Dir' : 'Partner'}
								{/if}
							</span>
						</div>
						<span class="font-semibold shrink-0 {tx.split_mode === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}">
							{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
						</span>
					</Card>
				{/each}
			</div>
		</section>
		{/if}

		{#if activeTab === 'abgerechnet'}
		<section class="opacity-80 animate-in fade-in duration-300">
			{#if settledTxs.length === 0}
				<p class="text-sm text-slate-400 px-1 text-center py-8">Bisher keine Historie.</p>
			{/if}
			<div class="flex flex-col gap-3">
				{#each settledTxs as tx (tx.id)}
					<Card class="flex justify-between items-center p-4 bg-slate-50">
						<div class="flex flex-col min-w-0">
							<div class="flex items-center gap-2">
								<span class="font-medium text-slate-900 truncate">{tx.note}</span>
								{#if tx.split_mode === 'kasse'}
									<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">Kasse</span>
								{:else if tx.split_mode === 'deposit'}
									<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">Einzahlung</span>
								{/if}
							</div>
							<span class="text-xs text-slate-500 mt-0.5">
								{new Date(tx.date).toLocaleDateString('de-DE')} • 
								{#if tx.split_mode === 'kasse'}
									aus Kasse bezahlt
								{:else if tx.split_mode === 'deposit'}
									von {tx.paid_by === authStore.currentUser?.id ? 'Dir' : 'Partner'}
								{:else}
									bezahlt von {tx.paid_by === authStore.currentUser?.id ? 'Dir' : 'Partner'}
								{/if}
							</span>
						</div>
						<span class="font-semibold shrink-0 {tx.split_mode === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}">
							{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
						</span>
					</Card>
				{/each}
			</div>
		</section>
		{/if}
	</div>
</div>

<ConfirmDialog
	bind:show={showConfirm}
	title="Abrechnung abschließen"
	message="{settleMessage} Enthalten sind {unsettled.length} offene Buchungen."
	confirmText="Abrechnung abschließen"
	onconfirm={performSettle}
/>
