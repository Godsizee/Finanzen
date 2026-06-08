<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { toCents } from '$lib/core/math';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	import { toast } from '$lib/core/toastStore.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { ShoppingBag, Home, Sparkles, Car, CircleEllipsis, Zap, Gamepad2, Tv, Utensils, Heart, Shield, Shirt } from '@lucide/svelte';

	const iconMap: Record<string, any> = {
		ShoppingBag, Home, Sparkles, Car, CircleEllipsis, Zap, Gamepad2, Tv, Utensils, Heart, Shield, Shirt
	};

	let type = $state<'expense' | 'deposit'>('expense');
	let amount = $state('');
	let note = $state('');
	let payer = $state<'ich' | 'partner' | 'kasse'>('ich');
	let splitMode = $state('50_50'); // 50_50, fair, me, partner, custom
	let selectedCategoryId = $state<string>('');
	let showAdvanced = $state(false);

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
								splitPercentMe = meta.split_percent[authStore.currentUser?.id || '']?.toString() || '50';
								splitPercentPartner = meta.split_percent[partnerStore.partnerUser?.id || '']?.toString() || '50';
							} else if (meta.split_cents) {
								customSplitType = 'amount';
								splitAmountMe = ((meta.split_cents[authStore.currentUser?.id || ''] || 0) / 100).toString().replace('.', ',');
								splitAmountPartner = ((meta.split_cents[partnerStore.partnerUser?.id || ''] || 0) / 100).toString().replace('.', ',');
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
			const sonstiges = categoryStore.categories.find(c => c.name === 'Sonstiges');
			selectedCategoryId = sonstiges ? sonstiges.id : categoryStore.categories[0].id;
		}
	});

	function selectFavorite(favName: string, catName: string) {
		note = favName;
		const cat = categoryStore.categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
		if (cat) {
			selectedCategoryId = cat.id;
		}
		showAdvanced = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!amount || isNaN(parseFloat(amount.replace(',', '.')))) {
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

		if (type === 'expense' && payer !== 'kasse' && finalSplitMode === 'custom') {
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
				if (isNaN(valMe) || isNaN(valPartner) || Math.round((valMe + valPartner) * 100) !== totalCents) {
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
			toast.success('Erfolgreich gespeichert', 'Rückgängig', async () => {
				await transactionStore.deleteTransaction(record.id);
			});
		}

		loading = false;
		goto('/');
	}
</script>

<div class="p-4 pt-8 max-[340px]:p-2 max-[340px]:pt-6 h-full flex flex-col bg-slate-50">
	<header class="mb-8 max-[340px]:mb-4 flex items-center gap-4 max-[340px]:gap-2">
		<button onclick={() => goto('/')} class="p-2 -ml-2 max-[340px]:-ml-3 rounded-full hover:bg-slate-200 transition-colors" aria-label="Zurück">
			<ArrowLeft class="w-6 h-6 max-[340px]:w-5 max-[340px]:h-5 text-slate-900" />
		</button>
		<h1 class="text-xl font-bold tracking-tight text-slate-900 max-[340px]:text-lg">
			{type === 'expense' ? 'Ausgabe hinzufügen' : 'Einzahlung hinzufügen'}
		</h1>
	</header>

	<!-- Segment Control -->
	<div class="flex bg-slate-200 p-1 rounded-xl mb-6">
		<button 
			type="button"
			class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all {type === 'expense' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
			onclick={() => type = 'expense'}
		>
			Ausgabe
		</button>
		<button 
			type="button"
			class="flex-1 py-2 text-sm font-semibold rounded-lg transition-all {type === 'deposit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}"
			onclick={() => type = 'deposit'}
		>
			Einzahlung
		</button>
	</div>

	<form onsubmit={handleSubmit} class="flex flex-col gap-6 flex-1">
		<div class="flex flex-col gap-2">
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
			
			<!-- Fast Favorites Grid -->
			{#if type === 'expense'}
				<div class="flex gap-2 overflow-x-auto pb-1 mt-1 text-slate-600 select-none">
					<button type="button" onclick={() => selectFavorite('Rewe', 'Lebensmittel')} class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-full active:scale-95 transition-all shrink-0">
						🛒 Rewe
					</button>
					<button type="button" onclick={() => selectFavorite('Tanken', 'Auto & Transport')} class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-full active:scale-95 transition-all shrink-0">
						🚗 Tanken
					</button>
					<button type="button" onclick={() => selectFavorite('dm Drogerie', 'Haushalt')} class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-full active:scale-95 transition-all shrink-0">
						🧼 dm Drogerie
					</button>
					<button type="button" onclick={() => selectFavorite('Restaurant', 'Hobby & Freizeit')} class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-full active:scale-95 transition-all shrink-0">
						🍔 Restaurant
					</button>
				</div>
			{/if}
		</div>

		{#if !showAdvanced}
			<button type="button" class="text-sm font-medium text-emerald-600 hover:text-emerald-700 text-left mb-2" onclick={() => showAdvanced = true}>
				+ Kategorie & Aufteilung ändern
			</button>
		{/if}

		{#if showAdvanced}
			<div class="animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col gap-6">
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
									class="flex flex-col items-center justify-center p-3 max-[340px]:p-1.5 rounded-2xl max-[340px]:rounded-xl border text-center transition-all min-h-[72px] max-[340px]:min-h-[56px] active:scale-95
										{selectedCategoryId === cat.id ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}"
									onclick={() => selectedCategoryId = cat.id}
								>
									<svelte:component this={IconComponent} class="w-5 h-5 max-[340px]:w-4 max-[340px]:h-4 {selectedCategoryId === cat.id ? 'text-emerald-400' : 'text-slate-500'}" />
									<span class="text-[11px] max-[340px]:text-[8px] font-semibold mt-1 leading-tight">{cat.name}</span>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<div class="flex flex-col gap-2">
					<span class="text-sm font-medium text-slate-700">
						{type === 'expense' ? 'Wer hat bezahlt?' : 'Wer zahlt ein?'}
					</span>
					<div class="flex gap-2 max-[340px]:gap-1">
						<Button 
							type="button" 
							variant={payer === 'ich' ? 'primary' : 'secondary'} 
							class="flex-1 max-[340px]:px-1 max-[340px]:text-xs max-[340px]:min-h-[40px]"
							onclick={() => payer = 'ich'}
						>
							Ich
						</Button>
						{#if partnerStore.partnerStatus === 'active'}
						<Button 
							type="button" 
							variant={payer === 'partner' ? 'primary' : 'secondary'} 
							class="flex-1 max-[340px]:px-1 max-[340px]:text-xs max-[340px]:min-h-[40px]"
							onclick={() => payer = 'partner'}
						>
							Partner
						</Button>
						{/if}
						{#if type === 'expense'}
							<Button 
								type="button" 
								variant={payer === 'kasse' ? 'primary' : 'secondary'} 
								class="flex-1 max-[340px]:px-1 max-[340px]:text-xs max-[340px]:min-h-[40px]"
								onclick={() => payer = 'kasse'}
							>
								Kasse
							</Button>
						{/if}
					</div>
				</div>

				{#if type === 'expense' && payer !== 'kasse'}
					<div class="flex flex-col gap-2 border-t border-slate-100 pt-4">
						<label for="add-split-mode" class="text-sm font-medium text-slate-700">Kostenaufteilung</label>
						<select 
							id="add-split-mode"
							bind:value={splitMode}
							class="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
						>
							<option value="50_50">Geteilt (50:50)</option>
							{#if partnerStore.partnerStatus === 'active'}
								<option value="fair">Faires Split-Verhältnis (Einkommensbasiert)</option>
							{/if}
							<option value="me">Nur Ich (Persönliche Ausgabe)</option>
							<option value="partner">Nur Partner</option>
							<option value="custom">Individuelle Aufteilung (Prozent/Betrag)</option>
						</select>
					</div>

					{#if splitMode === 'custom'}
						<div class="p-4 bg-slate-100 rounded-2xl flex flex-col gap-4 border border-slate-200/50 animate-in fade-in slide-in-from-top-2 duration-200">
							<div class="flex bg-slate-200 p-0.5 rounded-lg self-start">
								<button 
									type="button"
									class="px-3 py-1 text-xs font-semibold rounded-md transition-all {customSplitType === 'percent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}"
									onclick={() => customSplitType = 'percent'}
								>
									Prozent
								</button>
								<button 
									type="button"
									class="px-3 py-1 text-xs font-semibold rounded-md transition-all {customSplitType === 'amount' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}"
									onclick={() => customSplitType = 'amount'}
								>
									Betrag
								</button>
							</div>

							{#if customSplitType === 'percent'}
								<div class="grid grid-cols-2 gap-4">
									<Input label="Ich (%)" type="number" min="0" max="100" bind:value={splitPercentMe} />
									<Input label="Partner (%)" type="number" min="0" max="100" bind:value={splitPercentPartner} />
								</div>
							{:else}
								<div class="grid grid-cols-2 gap-4">
									<Input label="Ich (€)" type="text" placeholder="0,00" bind:value={splitAmountMe} />
									<Input label="Partner (€)" type="text" placeholder="0,00" bind:value={splitAmountPartner} />
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
