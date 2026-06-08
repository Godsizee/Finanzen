<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { toCents } from '$lib/core/math';
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

	const id = $page.params.id as string;

	let type = $state<'expense' | 'deposit'>('expense');
	let amount = $state('');
	let note = $state('');
	let payer = $state<'ich' | 'partner' | 'kasse'>('ich');
	let splitMode = $state('50_50'); // 50_50, fair, me, partner, custom
	let selectedCategoryId = $state<string>('');
	let showAdvanced = $state(true);

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

		const tx = transactionStore.transactions.find((t) => t.id === id);
		if (!tx) {
			toast.error('Transaktion nicht gefunden');
			goto('/history');
			return;
		}

		amount = (tx.total_amount / 100).toString().replace('.', ',');
		note = tx.note || '';
		selectedCategoryId = tx.category || '';
		type = tx.split_mode === 'deposit' ? 'deposit' : 'expense';

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
						splitAmountPartner = ((meta.split_cents[partnerStore.partnerUser?.id || ''] || 0) / 100)
							.toString()
							.replace('.', ',');
					}
				} catch (e) {
					console.error('Failed to parse metadata', e);
				}
			}
		}
	});

	$effect(() => {
		if (type === 'deposit' && payer === 'kasse') {
			payer = 'ich';
		}
	});

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
		} else if (finalSplitMode === 'custom') {
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

		const dataToUpdate: any = {
			total_amount: totalCents,
			paid_by: paidBy as string,
			split_mode: finalSplitMode,
			note: note || (type === 'expense' ? 'Ausgabe' : 'Einzahlung'),
			category: type === 'expense' ? selectedCategoryId : null,
			metadata: metadata
		};

		try {
			await transactionStore.updateTransaction(id, dataToUpdate);
			goto('/history');
		} catch (err: any) {
			toast.error('Fehler beim Aktualisieren: ' + (err.message || err));
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex h-full flex-col bg-slate-50 p-4 pt-8">
	<header class="mb-8 flex items-center gap-4">
		<button
			onclick={() => goto('/history')}
			class="-ml-2 rounded-full p-2 transition-colors hover:bg-slate-200"
			aria-label="Zurück"
		>
			<ArrowLeft size={24} class="text-slate-900" />
		</button>
		<h1 class="text-xl font-bold tracking-tight text-slate-900">Eintrag bearbeiten</h1>
	</header>

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
		<Input
			label="Betrag (€)"
			type="text"
			inputmode="decimal"
			placeholder="0,00"
			required
			bind:value={amount}
			class="mb-4 text-4xl font-bold"
		/>

		<div class="flex flex-col gap-6">
			<Input
				label={type === 'expense' ? 'Wofür?' : 'Beschreibung (optional)'}
				type="text"
				placeholder={type === 'expense' ? 'Supermarkt, Tanken...' : 'Monatlicher Beitrag...'}
				bind:value={note}
			/>

			{#if type === 'expense'}
				<div class="flex flex-col gap-2">
					<span class="text-sm font-medium text-slate-700">Kategorie</span>
					<div class="grid grid-cols-3 gap-2">
						{#each categoryStore.categories as cat (cat.id)}
							{@const IconComponent = iconMap[cat.icon] || CircleEllipsis}
							<button
								type="button"
								class="flex min-h-[72px] flex-col items-center justify-center rounded-2xl border p-3 text-center transition-all active:scale-95
									{selectedCategoryId === cat.id
									? 'border-slate-900 bg-slate-900 text-white shadow-sm'
									: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}"
								onclick={() => (selectedCategoryId = cat.id)}
							>
								<svelte:component
									this={IconComponent}
									size={20}
									class={selectedCategoryId === cat.id ? 'text-emerald-400' : 'text-slate-500'}
								/>
								<span class="mt-1 text-[11px] font-semibold">{cat.name}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<div class="flex flex-col gap-2">
				<span class="text-sm font-medium text-slate-700">
					{type === 'expense' ? 'Wer hat bezahlt?' : 'Wer zahlt ein?'}
				</span>
				<div class="flex gap-2">
					<Button
						type="button"
						variant={payer === 'ich' ? 'primary' : 'secondary'}
						class="flex-1"
						onclick={() => (payer = 'ich')}
					>
						Ich
					</Button>
					{#if partnerStore.partnerStatus === 'active'}
						<Button
							type="button"
							variant={payer === 'partner' ? 'primary' : 'secondary'}
							class="flex-1"
							onclick={() => (payer = 'partner')}
						>
							Partner
						</Button>
					{/if}
					{#if type === 'expense'}
						<Button
							type="button"
							variant={payer === 'kasse' ? 'primary' : 'secondary'}
							class="flex-1"
							onclick={() => (payer = 'kasse')}
						>
							Kasse
						</Button>
					{/if}
				</div>
			</div>

			{#if type === 'expense' && payer !== 'kasse'}
				<div class="flex flex-col gap-2 border-t border-slate-100 pt-4">
					<label for="split-mode" class="text-sm font-medium text-slate-700">Kostenaufteilung</label
					>
					<select
						id="split-mode"
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
								<Input label="Ich (€)" type="text" placeholder="0,00" bind:value={splitAmountMe} />
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

		<div class="mt-auto pt-6">
			<Button type="submit" variant="primary" class="w-full">
				{loading ? 'Wird gespeichert...' : 'Änderungen speichern'}
			</Button>
		</div>
	</form>
</div>
