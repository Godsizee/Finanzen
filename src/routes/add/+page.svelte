<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { toCents, formatCurrency } from '$lib/core/math';
	import { isValidAmount } from '$lib/core/validation';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	import { toast } from '$lib/core/toastStore.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import {
		ShoppingBag,
		Home,
		Sparkles,
		Car,
		CircleEllipsis,
		Zap,
		Gamepad2,
		Tv,
		Utensils,
		Heart,
		Shield,
		Shirt
	} from '@lucide/svelte';

	const iconMap: Record<string, any> = {
		ShoppingBag,
		Home,
		Sparkles,
		Car,
		CircleEllipsis,
		Zap,
		Gamepad2,
		Tv,
		Utensils,
		Heart,
		Shield,
		Shirt
	};

	let type = $state<'expense' | 'deposit'>('expense');
	let amount = $state('');
	let note = $state('');
	let payer = $state<'ich' | 'partner' | 'kasse'>('ich');
	let splitMode = $state('own_costs'); // 50_50, income_ratio, me, partner, custom, own_costs
	$effect(() => {
		if (authStore.currentUser) {
			const mode = authStore.currentUser.cost_sharing_mode;
			splitMode = mode === 'income_ratio' ? 'income_ratio' : mode === '50_50' ? '50_50' : 'own_costs';
		}
	});
	let selectedCategoryId = $state<string>('');
	let showAdvanced = $state(false);

	const categoryEmojis: Record<string, string> = {
		ShoppingBag: '🛒',
		Home: '🏠',
		Zap: '⚡',
		Sparkles: '✨',
		Car: '🚗',
		Gamepad2: '🎮',
		Tv: '📺',
		Utensils: '🍔',
		Heart: '❤️',
		Shield: '🛡️',
		Shirt: '👕',
		CircleEllipsis: '🏷️'
	};

	let favoriteCategories = $derived.by(() => {
		const favorites = ['Lebensmittel', 'Drogerie', 'Mobilität', 'Restaurants'];
		const list: any[] = [];
		const seen = new Set<string>();
		
		for (const name of favorites) {
			const cat = categoryStore.categories.find(
				(c) => c.name.toLowerCase().includes(name.toLowerCase())
			);
			if (cat && !seen.has(cat.id)) {
				seen.add(cat.id);
				list.push(cat);
			}
		}
		if (list.length === 0) {
			return categoryStore.categories.slice(0, 4);
		}
		return list;
	});

	let lastTx = $derived.by(() => {
		const myId = authStore.currentUser?.id;
		if (!myId) return null;
		return transactionStore.transactions.find((tx) => tx.paid_by === myId);
	});

	// Custom percentages/cents for custom split
	let splitPercentMe = $state('50');
	let splitPercentPartner = $state('50');
	let splitAmountMe = $state('');
	let splitAmountPartner = $state('');
	let customSplitType = $state<'percent' | 'amount'>('percent');

	let loading = $state(false);

	onMount(async () => {
		categoryStore.load();
		partnerStore.loadPartnerStatus();
		await transactionStore.load();

		// Check for duplicate query param
		const duplicateId = $page.url.searchParams.get('duplicate');
		if (duplicateId) {
			const tx = transactionStore.transactions.find((t) => t.id === duplicateId);
			if (tx) {
				amount = (tx.total_amount / 100).toString().replace('.', ',');
				note = tx.note || '';
				selectedCategoryId = tx.category || '';
				type = tx.split_mode === 'deposit' ? 'deposit' : 'expense';
				showAdvanced = true;

				if (tx.split_mode === 'kasse') {
					payer = 'kasse';
					splitMode = 'kasse';
				} else if (tx.split_mode === 'deposit') {
					payer = tx.paid_by === authStore.currentUser?.id ? 'ich' : 'partner';
					splitMode = 'deposit';
				} else {
					payer = tx.paid_by === authStore.currentUser?.id ? 'ich' : 'partner';
					splitMode = tx.split_mode;

					// Check for custom metadata
					if (tx.split_mode === 'custom' && tx.metadata) {
						try {
							const meta = typeof tx.metadata === 'string' ? JSON.parse(tx.metadata) : tx.metadata;
							if (meta.split_percent) {
								customSplitType = 'percent';
								splitPercentMe =
									meta.split_percent[authStore.currentUser?.id || '']?.toString() || '50';
								splitPercentPartner =
									meta.split_percent[partnerStore.partnerUser?.id || '']?.toString() || '50';
							} else if (meta.split_cents) {
								customSplitType = 'amount';
								splitAmountMe = ((meta.split_cents[authStore.currentUser?.id || ''] || 0) / 100)
									.toString()
									.replace('.', ',');
								splitAmountPartner = (
									(meta.split_cents[partnerStore.partnerUser?.id || ''] || 0) / 100
								)
									.toString()
									.replace('.', ',');
							}
						} catch (e) {
							console.error('Failed to parse metadata', e);
						}
					}
				}
			}
		}
	});

	// Adjust default payer and category when switching type
	$effect(() => {
		if (type === 'deposit' && payer === 'kasse') {
			payer = 'ich';
		}
	});

	$effect(() => {
		if (!selectedCategoryId && categoryStore.categories.length > 0) {
			const sonstiges = categoryStore.categories.find((c) => c.name === 'Sonstiges');
			selectedCategoryId = sonstiges ? sonstiges.id : categoryStore.categories[0].id;
		}
	});

	function selectFavorite(favName: string, catName: string) {
		note = favName;
		const cat = categoryStore.categories.find(
			(c) => c.name.toLowerCase() === catName.toLowerCase()
		);
		if (cat) {
			selectedCategoryId = cat.id;
		}
		showAdvanced = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!isValidAmount(amount)) {
			toast.error('Bitte einen gültigen Betrag eingeben');
			return;
		}

		loading = true;
		const totalCents = toCents(amount);

		let paidBy = authStore.currentUser?.id;

		if (payer === 'partner') {
			if (!partnerStore.partnerUser) {
				toast.error('Kein Partner gefunden!');
				loading = false;
				return;
			}
			paidBy = partnerStore.partnerUser.id;
		}

		let finalSplitMode = splitMode;
		let metadata: any = null;

		if (type === 'deposit') {
			finalSplitMode = 'deposit';
		} else if (payer === 'kasse') {
			finalSplitMode = 'kasse';
		}

		if (type === 'expense' && payer !== 'kasse' && (finalSplitMode === 'income_ratio' || finalSplitMode === 'fair')) {
			const myIncome = authStore.currentUser?.income || 0;
			const partnerIncome = partnerStore.partnerUser?.income || 0;
			const total = myIncome + partnerIncome;
			const myPercent = total > 0 ? Math.round((myIncome / total) * 100) : 50;
			const partnerPercent = 100 - myPercent;

			metadata = {
				split_percent: {
					[authStore.currentUser?.id || '']: myPercent,
					[partnerStore.partnerUser?.id || '']: partnerPercent
				}
			};
		} else if (type === 'expense' && payer !== 'kasse' && finalSplitMode === 'custom') {
			if (customSplitType === 'percent') {
				const pctMe = parseFloat(splitPercentMe);
				const pctPartner = parseFloat(splitPercentPartner);
				if (isNaN(pctMe) || isNaN(pctPartner) || pctMe + pctPartner !== 100) {
					toast.error('Die Prozentwerte müssen in der Summe 100 ergeben!');
					loading = false;
					return;
				}
				metadata = {
					split_percent: {
						[authStore.currentUser?.id || '']: pctMe,
						[partnerStore.partnerUser?.id || '']: pctPartner
					}
				};
			} else {
				const valMe = parseFloat(splitAmountMe.replace(',', '.'));
				const valPartner = parseFloat(splitAmountPartner.replace(',', '.'));
				if (
					isNaN(valMe) ||
					isNaN(valPartner) ||
					Math.round((valMe + valPartner) * 100) !== totalCents
				) {
					toast.error('Die Summe der Beträge muss dem Gesamtbetrag entsprechen!');
					loading = false;
					return;
				}
				metadata = {
					split_cents: {
						[authStore.currentUser?.id || '']: Math.round(valMe * 100),
						[partnerStore.partnerUser?.id || '']: Math.round(valPartner * 100)
					}
				};
			}
		}

		try {
			const record = await transactionStore.addTransaction({
				total_amount: totalCents,
				date: new Date().toISOString(),
				paid_by: paidBy as string,
				split_mode: finalSplitMode,
				note: note || (type === 'expense' ? 'Ausgabe' : 'Einzahlung'),
				category: type === 'expense' ? selectedCategoryId : undefined,
				metadata: metadata
			});

			if (record) {
				toast.success(
					`${formatCurrency(record.total_amount)} gespeichert`,
					'Rückgängig',
					async () => {
						await transactionStore.deleteTransaction(record.id);
					},
					'Weitere erfassen',
					() => {
						goto('/add');
					}
				);
				goto('/');
			}
		} catch (err: any) {
			toast.error('Fehler beim Speichern: ' + (err.message || err));
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex h-full flex-col bg-slate-50 p-4 pt-8 max-[340px]:p-2 max-[340px]:pt-6">
	<header class="mb-8 flex items-center gap-4 max-[340px]:mb-4 max-[340px]:gap-2">
		<button
			onclick={() => goto('/')}
			class="-ml-2 rounded-full p-2 transition-colors hover:bg-slate-200 max-[340px]:-ml-3"
			aria-label="Zurück"
		>
			<ArrowLeft class="h-6 w-6 text-slate-900 max-[340px]:h-5 max-[340px]:w-5" />
		</button>
		<h1 class="text-xl font-bold tracking-tight text-slate-900 max-[340px]:text-lg">
			{type === 'expense' ? 'Ausgabe hinzufügen' : 'Einzahlung hinzufügen'}
		</h1>
	</header>

	{#if lastTx}
		<button
			type="button"
			onclick={() => {
				amount = (lastTx.total_amount / 100).toString().replace('.', ',');
				note = lastTx.note || '';
				selectedCategoryId = lastTx.category || '';
				payer = lastTx.paid_by === authStore.currentUser?.id ? 'ich' : 'partner';
				splitMode = lastTx.split_mode || '50_50';
				toast.success('Letzte Buchung wiederholt!');
			}}
			class="mb-4 flex items-center justify-between rounded-xl bg-slate-900/5 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-900/10 transition-colors text-left"
		>
			<span>🔁 Letzte wiederholen: {lastTx.note || 'Ausgabe'} ({formatCurrency(lastTx.total_amount)})</span>
		</button>
	{/if}

	<!-- Segment Control -->
	<div class="mb-6 flex rounded-xl bg-slate-200 p-1">
		<button
			type="button"
			class="flex-1 rounded-lg py-2 text-sm font-semibold transition-all {type === 'expense'
				? 'bg-white text-slate-900 shadow-sm'
				: 'text-slate-600 hover:text-slate-900'}"
			onclick={() => (type = 'expense')}
		>
			Ausgabe
		</button>
		<button
			type="button"
			class="flex-1 rounded-lg py-2 text-sm font-semibold transition-all {type === 'deposit'
				? 'bg-white text-slate-900 shadow-sm'
				: 'text-slate-600 hover:text-slate-900'}"
			onclick={() => (type = 'deposit')}
		>
			Einzahlung
		</button>
	</div>

	<form onsubmit={handleSubmit} class="flex flex-1 flex-col gap-6">
		<div class="flex flex-col gap-4">
			<Input
				label="Betrag (€)"
				type="text"
				inputmode="decimal"
				placeholder="0,00"
				required
				autofocus
				bind:value={amount}
				class="text-4xl font-bold"
			/>

			<!-- Zahler Switcher (Always visible & compact) -->
			<div class="flex items-center justify-between gap-4 rounded-2xl bg-white p-3 border border-slate-100 shadow-xs">
				<span class="text-sm font-semibold text-slate-700">
					{type === 'expense' ? 'Wer bezahlt?' : 'Wer zahlt ein?'}
				</span>
				<div class="flex rounded-xl bg-slate-100 p-0.5 shrink-0">
					<button
						type="button"
						class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {payer === 'ich' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}"
						onclick={() => (payer = 'ich')}
					>
						Ich
					</button>
					{#if partnerStore.partnerStatus === 'active'}
						<button
							type="button"
							class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {payer === 'partner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}"
							onclick={() => (payer = 'partner')}
						>
							Partner
						</button>
					{/if}
					{#if type === 'expense'}
						<button
							type="button"
							class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {payer === 'kasse' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}"
							onclick={() => (payer = 'kasse')}
						>
							Kasse
						</button>
					{/if}
				</div>
			</div>

			<!-- Favorite Categories Bar -->
			{#if type === 'expense' && favoriteCategories.length > 0}
				<div class="flex flex-col gap-2">
					<span class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Kategorie-Favoriten</span>
					<div class="flex gap-2 overflow-x-auto pb-1 select-none">
						{#each favoriteCategories as cat (cat.id)}
							{@const emoji = categoryEmojis[cat.icon] || '🏷️'}
							<button
								type="button"
								onclick={() => {
									selectedCategoryId = cat.id;
								}}
								class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-95 border
									{selectedCategoryId === cat.id
										? 'bg-slate-900 border-slate-900 text-white shadow-xs'
										: 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}"
							>
								{emoji} {cat.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		{#if !showAdvanced}
			<button
				type="button"
				class="mb-2 text-left text-sm font-medium text-emerald-600 hover:text-emerald-700"
				onclick={() => (showAdvanced = true)}
			>
				+ Kategorie & Aufteilung ändern
			</button>
		{/if}

		{#if showAdvanced}
			<div class="animate-in fade-in slide-in-from-top-4 flex flex-col gap-6 duration-300">
				<Input
					label={type === 'expense' ? 'Wofür?' : 'Beschreibung (optional)'}
					type="text"
					placeholder={type === 'expense' ? 'Supermarkt, Tanken...' : 'Monatlicher Beitrag...'}
					bind:value={note}
				/>

				{#if type === 'expense'}
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium text-slate-700 max-[340px]:text-xs">Kategorie</span>
						<div class="grid grid-cols-3 gap-2 max-[340px]:gap-1">
							{#each categoryStore.categories as cat (cat.id)}
								{@const IconComponent = iconMap[cat.icon] || CircleEllipsis}
								<button
									type="button"
									class="flex min-h-[72px] flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all active:scale-95 max-[340px]:min-h-[56px] max-[340px]:rounded-xl max-[340px]:p-1.5
										{selectedCategoryId === cat.id
										? 'border-slate-900 bg-slate-900 text-white shadow-sm'
										: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}"
									onclick={() => (selectedCategoryId = cat.id)}
								>
									<svelte:component
										this={IconComponent}
										class="h-5 w-5 max-[340px]:h-4 max-[340px]:w-4 {selectedCategoryId === cat.id
											? 'text-emerald-400'
											: 'text-slate-500'}"
									/>
									<span class="mt-1 text-[11px] leading-tight font-semibold max-[340px]:text-[8px]"
										>{cat.name}</span
									>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if type === 'expense' && payer !== 'kasse'}
					<div class="flex flex-col gap-2 border-t border-slate-100 pt-4">
						<label for="add-split-mode" class="text-sm font-medium text-slate-700"
							>Kostenaufteilung</label
						>
						<select
							id="add-split-mode"
							bind:value={splitMode}
							class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 transition-all focus:ring-2 focus:ring-slate-900 focus:outline-none"
						>
							<option value="own_costs">Jeder zahlt selbst</option>
							<option value="50_50">Geteilt (50:50)</option>
							{#if partnerStore.partnerStatus === 'active'}
								<option value="income_ratio">Nach Nettoeinkommen (Einkommensbasiert)</option>
							{/if}
							<option value="me">Nur Ich (Persönliche Ausgabe)</option>
							<option value="partner">Nur Partner</option>
							<option value="custom">Individuelle Aufteilung (Prozent/Betrag)</option>
						</select>
					</div>

					{#if splitMode === 'custom'}
						<div
							class="animate-in fade-in slide-in-from-top-2 flex flex-col gap-4 rounded-2xl border border-slate-200/50 bg-slate-100 p-4 duration-200"
						>
							<div class="flex self-start rounded-lg bg-slate-200 p-0.5">
								<button
									type="button"
									class="rounded-md px-3 py-1 text-xs font-semibold transition-all {customSplitType ===
									'percent'
										? 'bg-white text-slate-900 shadow-sm'
										: 'text-slate-600'}"
									onclick={() => (customSplitType = 'percent')}
								>
									Prozent
								</button>
								<button
									type="button"
									class="rounded-md px-3 py-1 text-xs font-semibold transition-all {customSplitType ===
									'amount'
										? 'bg-white text-slate-900 shadow-sm'
										: 'text-slate-600'}"
									onclick={() => (customSplitType = 'amount')}
								>
									Betrag
								</button>
							</div>

							{#if customSplitType === 'percent'}
								<div class="grid grid-cols-2 gap-4">
									<Input
										label="Ich (%)"
										type="number"
										min="0"
										max="100"
										bind:value={splitPercentMe}
									/>
									<Input
										label="Partner (%)"
										type="number"
										min="0"
										max="100"
										bind:value={splitPercentPartner}
									/>
								</div>
							{:else}
								<div class="grid grid-cols-2 gap-4">
									<Input
										label="Ich (€)"
										type="text"
										placeholder="0,00"
										bind:value={splitAmountMe}
									/>
									<Input
										label="Partner (€)"
										type="text"
										placeholder="0,00"
										bind:value={splitAmountPartner}
									/>
								</div>
							{/if}
						</div>
					{/if}
				{/if}
			</div>
		{/if}

		<div class="mt-auto pt-6">
			<Button type="submit" variant="primary" class="w-full">
				{loading ? 'Wird gespeichert...' : 'Speichern'}
			</Button>
		</div>
	</form>
</div>
