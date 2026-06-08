<script lang="ts">
	import { goto } from '$app/navigation';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { settlementApi } from '$lib/features/settlements/api';
	import { formatCurrency } from '$lib/core/math';
	import { toast } from '$lib/core/toastStore.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte';
	import { onMount } from 'svelte';
	import { 
		ArrowLeft, CheckCircle2, Search, SlidersHorizontal, X, 
		Edit2, Trash2, Copy, CalendarPlus, ShoppingBag, Home,
		Zap, Sparkles, Car, Gamepad2, Tv, Utensils, Heart,
		Shield, Shirt, CircleEllipsis
	} from '@lucide/svelte';

	const iconMap: Record<string, any> = {
		ShoppingBag, Home, Zap, Sparkles, Car, Gamepad2,
		Tv, Utensils, Heart, Shield, Shirt, CircleEllipsis
	};

	let unsettled = $derived(transactionStore.unsettledTransactions);
	let myBalance = $derived(transactionStore.myBalance);
	let settledTxs = $derived(transactionStore.transactions.filter(tx => !!tx.settlement_id));
	
	let loading = $state(false);
	let showConfirm = $state(false);
	let activeTab = $state<'offen' | 'abgerechnet'>('offen');

	// Search and Filter states
	let searchQuery = $state('');
	let selectedCategory = $state('');
	let selectedPayer = $state('');
	let selectedSplit = $state('');
	let showFilters = $state(false);

	onMount(() => {
		transactionStore.load();
		categoryStore.load();
		partnerStore.loadPartnerStatus();
	});

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

			const settlement = await settlementApi.create({
				date: new Date().toISOString(),
				amount,
				created_by: authStore.currentUser.id,
				settled_with: partnerStore.partnerUser.id
			});

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

	// Filtering Logic
	function filterTransactions(txs: typeof transactionStore.transactions) {
		return txs.filter(tx => {
			if (searchQuery && !tx.note?.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
			if (selectedCategory && tx.category !== selectedCategory) {
				return false;
			}
			if (selectedPayer) {
				const myId = authStore.currentUser?.id;
				const isMe = tx.paid_by === myId;
				if (selectedPayer === 'ich' && !isMe) return false;
				if (selectedPayer === 'partner' && isMe) return false;
				if (selectedPayer === 'kasse' && tx.split_mode !== 'kasse') return false;
			}
			if (selectedSplit && tx.split_mode !== selectedSplit) {
				return false;
			}
			return true;
		});
	}

	let filteredUnsettled = $derived(filterTransactions(unsettled));
	let filteredSettled = $derived(filterTransactions(settledTxs));

	let hasActiveFilters = $derived(searchQuery || selectedCategory || selectedPayer || selectedSplit);

	function resetFilters() {
		searchQuery = '';
		selectedCategory = '';
		selectedPayer = '';
		selectedSplit = '';
	}

	// Action methods
	async function handleDelete(id: string) {
		const confirmed = confirm('Möchtest du diese Transaktion wirklich löschen?');
		if (confirmed) {
			await transactionStore.deleteTransaction(id);
		}
	}
</script>

<div class="p-4 pt-8 max-[340px]:p-2 max-[340px]:pt-6 h-full flex flex-col bg-slate-50">
	<header class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-4 max-[340px]:gap-2">
			<button onclick={() => goto('/')} class="p-2 -ml-2 max-[340px]:-ml-3 rounded-full hover:bg-slate-200 transition-colors">
				<ArrowLeft class="w-6 h-6 max-[340px]:w-5 max-[340px]:h-5 text-slate-900" />
			</button>
			<h1 class="text-xl font-bold tracking-tight text-slate-900 max-[340px]:text-[15px]">Historie & Abrechnung</h1>
		</div>
	</header>

	{#if unsettled.length > 0}
		<Card class="bg-emerald-50 border-emerald-100 mb-6 p-5 max-[340px]:p-3">
			<h2 class="text-emerald-900 font-semibold mb-2 max-[340px]:text-sm">Offene Abrechnung</h2>
			<p class="text-sm text-emerald-700 mb-4 max-[340px]:text-xs max-[340px]:mb-3">Es gibt {unsettled.length} offene Transaktionen.</p>
			
			<div class="flex items-center justify-between mb-4 max-[340px]:mb-3">
				<span class="text-emerald-900 font-medium text-sm max-[340px]:text-xs">Ausgleichsbetrag:</span>
				<span class="text-emerald-900 font-bold text-lg max-[340px]:text-base">{formatCurrency(Math.abs(myBalance))}</span>
			</div>
			
			<Button onclick={handleSettleClick} class="w-full max-[340px]:min-h-[40px] max-[340px]:text-xs" variant="primary">
				<CheckCircle2 class="w-[18px] h-[18px] max-[340px]:w-4 max-[340px]:h-4 mr-2" />
				{loading ? 'Rechne ab...' : 'Jetzt abrechnen'}
			</Button>
		</Card>
	{/if}

	<!-- Search & Filter Controls -->
	<div class="flex flex-col gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
		<div class="flex gap-2">
			<div class="relative flex-1">
				<Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Beschreibung suchen..."
					class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent text-sm"
				/>
			</div>
			<button 
				onclick={() => showFilters = !showFilters}
				class="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center {showFilters ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white text-slate-600'}"
				aria-label="Filter einblenden"
			>
				<SlidersHorizontal size={20} />
			</button>
		</div>

		{#if showFilters}
			<div class="grid grid-cols-3 max-[340px]:grid-cols-1 gap-2 max-[340px]:gap-1.5 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
				<!-- Category Filter -->
				<div class="flex flex-col gap-1">
					<span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider max-[340px]:text-[9px]">Kategorie</span>
					<select bind:value={selectedCategory} class="p-2 max-[340px]:py-1 max-[340px]:px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs max-[340px]:text-[11px] focus:outline-none">
						<option value="">Alle</option>
						{#each categoryStore.categories as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<!-- Payer Filter -->
				<div class="flex flex-col gap-1">
					<span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider max-[340px]:text-[9px]">Zahler</span>
					<select bind:value={selectedPayer} class="p-2 max-[340px]:py-1 max-[340px]:px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs max-[340px]:text-[11px] focus:outline-none">
						<option value="">Alle</option>
						<option value="ich">Ich</option>
						{#if partnerStore.partnerStatus === 'active'}
							<option value="partner">Partner</option>
						{/if}
						<option value="kasse">Kasse</option>
					</select>
				</div>

				<!-- Split Filter -->
				<div class="flex flex-col gap-1">
					<span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider max-[340px]:text-[9px]">Aufteilung</span>
					<select bind:value={selectedSplit} class="p-2 max-[340px]:py-1 max-[340px]:px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs max-[340px]:text-[11px] focus:outline-none">
						<option value="">Alle</option>
						<option value="50_50">50:50</option>
						<option value="fair">Fair (Einkommen)</option>
						<option value="me">Nur Ich</option>
						<option value="partner">Nur Partner</option>
						<option value="kasse">Aus Kasse</option>
						<option value="deposit">Einzahlung</option>
					</select>
				</div>
			</div>
		{/if}

		{#if hasActiveFilters}
			<button onclick={resetFilters} class="text-xs font-semibold text-red-500 flex items-center gap-1 hover:text-red-600 transition-colors self-start mt-1">
				<X size={14} /> Filter zurücksetzen
			</button>
		{/if}
	</div>

	<!-- Segment Control for Tabs -->
	<div class="flex bg-slate-200 p-1 rounded-xl mb-4">
		<button 
			type="button"
			class="flex-1 py-2 max-[340px]:py-1.5 text-sm max-[340px]:text-xs font-semibold rounded-lg transition-all {activeTab === 'offen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
			onclick={() => activeTab = 'offen'}
		>
			Offen ({filteredUnsettled.length})
		</button>
		<button 
			type="button"
			class="flex-1 py-2 max-[340px]:py-1.5 text-sm max-[340px]:text-xs font-semibold rounded-lg transition-all {activeTab === 'abgerechnet' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
			onclick={() => activeTab = 'abgerechnet'}
		>
			Abgesp. ({filteredSettled.length})
		</button>
	</div>

	<div class="flex flex-col gap-6 pb-24 flex-1 overflow-y-auto">
		{#if activeTab === 'offen'}
		<section class="animate-in fade-in duration-300">
			{#if filteredUnsettled.length === 0}
				<p class="text-sm text-slate-400 px-1 text-center py-8">Keine passenden offenen Ausgaben.</p>
			{/if}
			<div class="flex flex-col gap-3">
				{#each filteredUnsettled as tx (tx.id)}
					<Card class="flex flex-col gap-2.5 p-4 hover:border-slate-300 transition-all">
						<div class="flex justify-between items-start">
							<div class="flex flex-col min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-bold text-slate-900 truncate">{tx.note}</span>
									{#if tx.split_mode === 'kasse'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-700">Kasse</span>
									{:else if tx.split_mode === 'deposit'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800">Einzahlung</span>
									{:else if tx.split_mode === 'fair'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-100 text-blue-800">Fair Split</span>
									{:else if tx.split_mode === 'me'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800">Nur Ich</span>
									{:else if tx.split_mode === 'partner'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-orange-100 text-orange-800">Nur Partner</span>
									{/if}
								</div>
								<span class="text-xs text-slate-400 mt-1">
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
							<span class="font-bold shrink-0 text-base {tx.split_mode === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}">
								{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
							</span>
						</div>
						
						<div class="h-px bg-slate-100 my-0.5"></div>
						
						<!-- Action Row -->
						<div class="flex items-center justify-end gap-1.5 text-slate-400 pt-0.5">
							<button 
								onclick={() => goto(`/edit/${tx.id}`)}
								class="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
								title="Bearbeiten"
							>
								<Edit2 size={16} />
							</button>
							<button 
								onclick={() => goto(`/add?duplicate=${tx.id}`)}
								class="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
								title="Duplizieren"
							>
								<Copy size={16} />
							</button>
							<button 
								onclick={() => goto(`/recurring/add?from_tx=${tx.id}`)}
								class="p-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-90"
								title="Als Abo speichern"
							>
								<CalendarPlus size={16} />
							</button>
							<button 
								onclick={() => handleDelete(tx.id)}
								class="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all active:scale-90"
								title="Löschen"
							>
								<Trash2 size={16} />
							</button>
						</div>
					</Card>
				{/each}
			</div>
		</section>
		{/if}

		{#if activeTab === 'abgerechnet'}
		<section class="opacity-90 animate-in fade-in duration-300">
			{#if filteredSettled.length === 0}
				<p class="text-sm text-slate-400 px-1 text-center py-8">Bisher keine passenden abgerechneten Transaktionen.</p>
			{/if}
			<div class="flex flex-col gap-3">
				{#each filteredSettled as tx (tx.id)}
					<Card class="flex flex-col gap-2.5 p-4 bg-slate-100/70 border-slate-200">
						<div class="flex justify-between items-start">
							<div class="flex flex-col min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-bold text-slate-800 truncate">{tx.note}</span>
									{#if tx.split_mode === 'kasse'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 text-slate-700">Kasse</span>
									{:else if tx.split_mode === 'deposit'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800">Einzahlung</span>
									{:else if tx.split_mode === 'fair'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-100 text-blue-800">Fair Split</span>
									{:else if tx.split_mode === 'me'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-800">Nur Ich</span>
									{:else if tx.split_mode === 'partner'}
										<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-orange-100 text-orange-800">Nur Partner</span>
									{/if}
								</div>
								<span class="text-xs text-slate-400 mt-1">
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
							<span class="font-bold shrink-0 text-base {tx.split_mode === 'deposit' ? 'text-emerald-600/80' : 'text-slate-700'}">
								{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
							</span>
						</div>
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
