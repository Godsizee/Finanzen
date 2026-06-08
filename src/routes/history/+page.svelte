<script lang="ts">
	import { goto } from '$app/navigation';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { settlementApi } from '$lib/features/settlements/api';
	import { formatCurrency, getTransactionShare } from '$lib/core/math';
	import { toast } from '$lib/core/toastStore.svelte';
	import { pb } from '$lib/core/pb';
	import Button from '$lib/ui/Button.svelte';
	import Card from '$lib/ui/Card.svelte';
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte';
	import { onMount } from 'svelte';
	import {
		ArrowLeft,
		CheckCircle2,
		Search,
		SlidersHorizontal,
		X,
		Edit2,
		Trash2,
		Copy,
		CalendarPlus,
		ShoppingBag,
		Home,
		Zap,
		Sparkles,
		Car,
		Gamepad2,
		Tv,
		Utensils,
		Heart,
		Shield,
		Shirt,
		CircleEllipsis
	} from '@lucide/svelte';

	const iconMap: Record<string, any> = {
		ShoppingBag,
		Home,
		Zap,
		Sparkles,
		Car,
		Gamepad2,
		Tv,
		Utensils,
		Heart,
		Shield,
		Shirt,
		CircleEllipsis
	};

	let unsettled = $derived(transactionStore.unsettledTransactions);
	let myBalance = $derived(transactionStore.myBalance);
	let settledTxs = $derived(transactionStore.transactions.filter((tx) => !!tx.settlement_id));

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
			const myId = authStore.currentUser!.id;
			const partnerId = partnerStore.partnerUser!.id;

			const payerId = myBalance < 0 ? myId : partnerId;
			const receiverId = myBalance < 0 ? partnerId : myId;
			const splitMode = authStore.currentUser?.cost_sharing_mode || '50_50';

			const unsettledTxs = [...unsettled];
			const details = {
				unsettled_transaction_ids: unsettledTxs.map((tx) => tx.id),
				cost_sharing_mode: splitMode,
				payer_name: myBalance < 0 ? authStore.currentUser?.name : partnerStore.partnerUser?.name,
				receiver_name: myBalance < 0 ? partnerStore.partnerUser?.name : authStore.currentUser?.name
			};

			const settlementId = Array.from({ length: 15 }, () => Math.floor(Math.random() * 36).toString(36)).join('');

			const batch = pb.createBatch();

			batch.collection('settlements').create({
				id: settlementId,
				date: new Date().toISOString(),
				amount,
				created_by: myId,
				settled_with: partnerId,
				status: 'bezahlt',
				payer: payerId,
				receiver: receiverId,
				split_mode: splitMode,
				details: details
			});

			for (const tx of unsettledTxs) {
				batch.collection('transactions').update(tx.id, {
					settlement_id: settlementId
				});
			}

			await batch.send();
			await transactionStore.load();
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

	let settleDetails = $derived.by(() => {
		if (unsettled.length === 0) return '';
		const myId = authStore.currentUser?.id;
		const partnerId = partnerStore.partnerUser?.id;
		if (!myId || !partnerId) return '';

		const globalMode = authStore.currentUser?.cost_sharing_mode || '50_50';
		const myIncome = authStore.currentUser?.income || 0;
		const partnerIncome = partnerStore.partnerUser?.income || 0;
		const totalIncome = myIncome + partnerIncome;
		const myRatio = (globalMode === '50_50' || totalIncome <= 0) ? 0.5 : myIncome / totalIncome;

		let totalShared = 0;
		let paidByMe = 0;
		let paidByPartner = 0;
		let mySharedShare = 0;
		let partnerSharedShare = 0;

		let kasseDepositedByMe = 0;
		let kasseDepositedByPartner = 0;

		for (const tx of unsettled) {
			const amt = tx.total_amount;
			const isMe = tx.paid_by === myId;

			let txSplitMode = tx.split_mode;
			if (txSplitMode === '50_50' || txSplitMode === 'income_ratio' || txSplitMode === 'fair') {
				txSplitMode = globalMode;
			}

			if (txSplitMode === 'deposit') {
				if (isMe) kasseDepositedByMe += amt;
				else kasseDepositedByPartner += amt;
			} else if (txSplitMode === 'kasse') {
				// paid from joint pool
			} else {
				// Shared expense
				totalShared += amt;
				if (isMe) paidByMe += amt;
				else paidByPartner += amt;

				const myShare = getTransactionShare(amt, txSplitMode, tx.paid_by, myId, partnerId, myRatio, tx.metadata);
				mySharedShare += myShare;
				partnerSharedShare += (amt - myShare);
			}
		}

		const meName = authStore.currentUser?.name || 'Du';
		const partnerName = partnerStore.partnerUser?.name || 'Partner';

		let text = '';
		if (totalShared > 0) {
			text += `• Gemeinsame Ausgaben: ${formatCurrency(totalShared)}\n`;
			text += `  - Von ${meName} bezahlt: ${formatCurrency(paidByMe)} (Anteil: ${formatCurrency(mySharedShare)})\n`;
			text += `  - Von ${partnerName} bezahlt: ${formatCurrency(paidByPartner)} (Anteil: ${formatCurrency(partnerSharedShare)})\n`;
		}
		if (kasseDepositedByMe > 0 || kasseDepositedByPartner > 0) {
			text += `• Einzahlungen in die Kasse:\n`;
			if (kasseDepositedByMe > 0) text += `  - Von ${meName}: ${formatCurrency(kasseDepositedByMe)}\n`;
			if (kasseDepositedByPartner > 0) text += `  - Von ${partnerName}: ${formatCurrency(kasseDepositedByPartner)}\n`;
		}

		return text;
	});

	// Filtering Logic
	function filterTransactions(txs: typeof transactionStore.transactions) {
		return txs.filter((tx) => {
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

	function groupByMonth(txs: typeof transactionStore.transactions) {
		const groups: Record<string, typeof transactionStore.transactions> = {};
		for (const tx of txs) {
			const date = new Date(tx.date);
			const key = date.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
			if (!groups[key]) groups[key] = [];
			groups[key].push(tx);
		}
		return Object.entries(groups).sort((a, b) => {
			const dateA = new Date(a[1][0].date);
			const dateB = new Date(b[1][0].date);
			return dateB.getTime() - dateA.getTime();
		});
	}

	let groupedUnsettled = $derived(groupByMonth(filteredUnsettled));
	let groupedSettled = $derived(groupByMonth(filteredSettled));

	let hasActiveFilters = $derived(
		searchQuery || selectedCategory || selectedPayer || selectedSplit
	);

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

<div class="flex h-full flex-col bg-slate-50 p-4 pt-8 max-[340px]:p-2 max-[340px]:pt-6">
	<header class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-4 max-[340px]:gap-2">
			<button
				onclick={() => goto('/')}
				class="-ml-2 rounded-full p-2 transition-colors hover:bg-slate-200 max-[340px]:-ml-3"
			>
				<ArrowLeft class="h-6 w-6 text-slate-900 max-[340px]:h-5 max-[340px]:w-5" />
			</button>
			<h1 class="text-xl font-bold tracking-tight text-slate-900 max-[340px]:text-[15px]">
				Historie & Abrechnung
			</h1>
		</div>
	</header>

	{#if unsettled.length > 0}
		<Card class="mb-6 border-emerald-100 bg-emerald-50 p-5 max-[340px]:p-3">
			<h2 class="mb-2 font-semibold text-emerald-900 max-[340px]:text-sm">Offene Abrechnung</h2>
			<p class="mb-4 text-sm text-emerald-700 max-[340px]:mb-3 max-[340px]:text-xs">
				Es gibt {unsettled.length} offene Transaktionen.
			</p>

			<div class="mb-4 flex items-center justify-between max-[340px]:mb-3">
				<span class="text-sm font-medium text-emerald-900 max-[340px]:text-xs"
					>Ausgleichsbetrag:</span
				>
				<span class="text-lg font-bold text-emerald-900 max-[340px]:text-base"
					>{formatCurrency(Math.abs(myBalance))}</span
				>
			</div>

			<Button
				onclick={handleSettleClick}
				class="w-full max-[340px]:min-h-[40px] max-[340px]:text-xs"
				variant="primary"
			>
				<CheckCircle2 class="mr-2 h-[18px] w-[18px] max-[340px]:h-4 max-[340px]:w-4" />
				{loading ? 'Rechne ab...' : 'Jetzt abrechnen'}
			</Button>
		</Card>
	{/if}

	<!-- Search & Filter Controls -->
	<div class="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
		<div class="flex gap-2">
			<div class="relative flex-1">
				<Search class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Beschreibung suchen..."
					class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 text-sm focus:border-transparent focus:ring-2 focus:ring-slate-950 focus:outline-none"
				/>
			</div>
			<button
				onclick={() => (showFilters = !showFilters)}
				class="flex items-center justify-center rounded-xl border border-slate-200 p-2 transition-colors hover:bg-slate-50 {showFilters
					? 'border-slate-900 bg-slate-900 text-white'
					: 'bg-white text-slate-600'}"
				aria-label="Filter einblenden"
			>
				<SlidersHorizontal size={20} />
			</button>
		</div>

		{#if showFilters}
			<div
				class="animate-in fade-in slide-in-from-top-2 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 duration-200 max-[340px]:grid-cols-1 max-[340px]:gap-1.5"
			>
				<!-- Category Filter -->
				<div class="flex flex-col gap-1">
					<span
						class="text-[10px] font-bold tracking-wider text-slate-500 uppercase max-[340px]:text-[9px]"
						>Kategorie</span
					>
					<select
						bind:value={selectedCategory}
						class="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none max-[340px]:px-2 max-[340px]:py-1 max-[340px]:text-[11px]"
					>
						<option value="">Alle</option>
						{#each categoryStore.categories as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<!-- Payer Filter -->
				<div class="flex flex-col gap-1">
					<span
						class="text-[10px] font-bold tracking-wider text-slate-500 uppercase max-[340px]:text-[9px]"
						>Zahler</span
					>
					<select
						bind:value={selectedPayer}
						class="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none max-[340px]:px-2 max-[340px]:py-1 max-[340px]:text-[11px]"
					>
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
					<span
						class="text-[10px] font-bold tracking-wider text-slate-500 uppercase max-[340px]:text-[9px]"
						>Aufteilung</span
					>
					<select
						bind:value={selectedSplit}
						class="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs focus:outline-none max-[340px]:px-2 max-[340px]:py-1 max-[340px]:text-[11px]"
					>
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
			<button
				onclick={resetFilters}
				class="mt-1 flex items-center gap-1 self-start text-xs font-semibold text-red-500 transition-colors hover:text-red-600"
			>
				<X size={14} /> Filter zurücksetzen
			</button>
		{/if}
	</div>

	<!-- Segment Control for Tabs -->
	<div class="mb-4 flex rounded-xl bg-slate-200 p-1">
		<button
			type="button"
			class="flex-1 rounded-lg py-2 text-sm font-semibold transition-all max-[340px]:py-1.5 max-[340px]:text-xs {activeTab ===
			'offen'
				? 'bg-white text-slate-900 shadow-sm'
				: 'text-slate-600 hover:text-slate-900'}"
			onclick={() => (activeTab = 'offen')}
		>
			Offen ({filteredUnsettled.length})
		</button>
		<button
			type="button"
			class="flex-1 rounded-lg py-2 text-sm font-semibold transition-all max-[340px]:py-1.5 max-[340px]:text-xs {activeTab ===
			'abgerechnet'
				? 'bg-white text-slate-900 shadow-sm'
				: 'text-slate-600 hover:text-slate-900'}"
			onclick={() => (activeTab = 'abgerechnet')}
		>
			Abgesp. ({filteredSettled.length})
		</button>
	</div>

	<div class="flex flex-1 flex-col gap-6 overflow-y-auto pb-24">
		{#if activeTab === 'offen'}
			<section class="animate-in fade-in duration-300">
				{#if filteredUnsettled.length === 0}
					<p class="px-1 py-8 text-center text-sm text-slate-400">
						Keine passenden offenen Ausgaben.
					</p>
				{/if}
				<div class="flex flex-col gap-3">
					{#each groupedUnsettled as [monthKey, txs]}
						<div class="mt-4 mb-2 pl-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase first:mt-0">
							{monthKey}
						</div>
						{#each txs as tx (tx.id)}
							<Card class="flex flex-col gap-2.5 p-4 transition-all hover:border-slate-300">
							<div class="flex items-start justify-between">
								<div class="flex min-w-0 flex-col">
									<div class="flex flex-wrap items-center gap-2">
										<span class="truncate font-bold text-slate-900">{tx.note}</span>
										{#if tx.split_mode === 'kasse'}
											<span
												class="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700"
												>Kasse</span
											>
										{:else if tx.split_mode === 'deposit'}
											<span
												class="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800"
												>Einzahlung</span
											>
										{:else if tx.split_mode === 'fair'}
											<span
												class="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-800"
												>Fair Split</span
											>
										{:else if tx.split_mode === 'me'}
											<span
												class="inline-flex items-center rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800"
												>Nur Ich</span
											>
										{:else if tx.split_mode === 'partner'}
											<span
												class="inline-flex items-center rounded-md bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-800"
												>Nur Partner</span
											>
										{/if}
									</div>
									<span class="mt-1 text-xs text-slate-400">
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
								<span
									class="shrink-0 text-base font-bold {tx.split_mode === 'deposit'
										? 'text-emerald-600'
										: 'text-slate-900'}"
								>
									{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
								</span>
							</div>

							<div class="my-0.5 h-px bg-slate-100"></div>

							<!-- Action Row -->
							<div class="flex items-center justify-end gap-1.5 pt-0.5 text-slate-400">
								<button
									onclick={() => goto(`/edit/${tx.id}`)}
									class="rounded-lg p-2 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90"
									title="Bearbeiten"
								>
									<Edit2 size={16} />
								</button>
								<button
									onclick={() => goto(`/add?duplicate=${tx.id}`)}
									class="rounded-lg p-2 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90"
									title="Duplizieren"
								>
									<Copy size={16} />
								</button>
								<button
									onclick={() => goto(`/recurring/add?from_tx=${tx.id}`)}
									class="rounded-lg p-2 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90"
									title="Als Fixkosten speichern"
								>
									<CalendarPlus size={16} />
								</button>
								<button
									onclick={() => handleDelete(tx.id)}
									class="rounded-lg p-2 transition-all hover:bg-red-50 hover:text-red-600 active:scale-90"
									title="Löschen"
								>
									<Trash2 size={16} />
								</button>
							</div>
						</Card>
						{/each}
					{/each}
				</div>
			</section>
		{/if}

		{#if activeTab === 'abgerechnet'}
			<section class="animate-in fade-in opacity-90 duration-300">
				{#if filteredSettled.length === 0}
					<p class="px-1 py-8 text-center text-sm text-slate-400">
						Bisher keine passenden abgerechneten Transaktionen.
					</p>
				{/if}
				<div class="flex flex-col gap-3">
					{#each groupedSettled as [monthKey, txs]}
						<div class="mt-4 mb-2 pl-2 text-[11px] font-bold tracking-widest text-slate-400 uppercase first:mt-0">
							{monthKey}
						</div>
						{#each txs as tx (tx.id)}
							<Card class="flex flex-col gap-2.5 border-slate-200 bg-slate-100/70 p-4">
							<div class="flex items-start justify-between">
								<div class="flex min-w-0 flex-col">
									<div class="flex flex-wrap items-center gap-2">
										<span class="truncate font-bold text-slate-800">{tx.note}</span>
										{#if tx.split_mode === 'kasse'}
											<span
												class="inline-flex items-center rounded-md bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700"
												>Kasse</span
											>
										{:else if tx.split_mode === 'deposit'}
											<span
												class="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800"
												>Einzahlung</span
											>
										{:else if tx.split_mode === 'fair'}
											<span
												class="inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-800"
												>Fair Split</span
											>
										{:else if tx.split_mode === 'me'}
											<span
												class="inline-flex items-center rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-800"
												>Nur Ich</span
											>
										{:else if tx.split_mode === 'partner'}
											<span
												class="inline-flex items-center rounded-md bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-800"
												>Nur Partner</span
											>
										{/if}
									</div>
									<span class="mt-1 text-xs text-slate-400">
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
								<span
									class="shrink-0 text-base font-bold {tx.split_mode === 'deposit'
										? 'text-emerald-600/80'
										: 'text-slate-700'}"
								>
									{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
								</span>
							</div>
						</Card>
						{/each}
					{/each}
				</div>
			</section>
		{/if}
	</div>
</div>

<ConfirmDialog
	bind:show={showConfirm}
	title="Abrechnung abschließen"
	message="{settleMessage}\n\nEnthalten sind {unsettled.length} offene Buchungen.\n\n{settleDetails}"
	confirmText="Abrechnung abschließen"
	onconfirm={performSettle}
/>
