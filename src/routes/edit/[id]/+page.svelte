<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { toCents } from '$lib/core/math';
	import { toast } from '$lib/core/toastStore.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { ArrowLeft, Trash2, ShoppingBag, Home, Sparkles, Car, CircleEllipsis, Zap, Gamepad2, Tv, Utensils, Heart, Shield, Shirt } from '@lucide/svelte';

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

	let txId = $derived($page.params.id);
	let tx = $derived(transactionStore.transactions.find(t => t.id === txId));

	// Form states
	let type = $state<'expense' | 'deposit'>('expense');
	let amount = $state('');
	let note = $state('');
	let payer = $state<'ich' | 'partner' | 'kasse'>('ich');
	let selectedCategoryId = $state<string>('');

	let isInitialized = $state(false);
	let loading = $state(false);

	// Load fields when transaction is loaded
	$effect(() => {
		if (tx && !isInitialized) {
			const isDeposit = tx.split_mode === 'deposit';
			type = isDeposit ? 'deposit' : 'expense';
			amount = (tx.total_amount / 100).toFixed(2).replace('.', ',');
			note = tx.note || '';
			
			if (tx.split_mode === 'kasse') {
				payer = 'kasse';
			} else if (tx.paid_by === authStore.currentUser?.id) {
				payer = 'ich';
			} else {
				payer = 'partner';
			}

			selectedCategoryId = tx.category || '';
			isInitialized = true;
		}
	});

	// Default to first category if empty
	$effect(() => {
		if (type === 'expense' && !selectedCategoryId && categoryStore.categories.length > 0) {
			const sonstiges = categoryStore.categories.find(c => c.name === 'Sonstiges');
			selectedCategoryId = sonstiges ? sonstiges.id : categoryStore.categories[0].id;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!tx) return;
		if (tx.settlement_id) {
			toast.error('Abgerechnete Transaktionen können nicht bearbeitet werden.');
			return;
		}
		if (!amount || isNaN(parseFloat(amount.replace(',', '.')))) {
			toast.error('Bitte einen gültigen Betrag eingeben');
			return;
		}

		loading = true;
		const totalCents = toCents(amount);
		
		let splitMode = '50_50';
		let paidBy = authStore.currentUser?.id;
		
		if (type === 'expense') {
			if (payer === 'partner') {
				if (!partnerStore.partnerUser) {
					toast.error('Kein Partner gefunden!');
					loading = false;
					return;
				}
				paidBy = partnerStore.partnerUser.id;
			} else if (payer === 'kasse') {
				splitMode = 'kasse';
			}
		} else {
			splitMode = 'deposit';
			if (payer === 'partner') {
				if (!partnerStore.partnerUser) {
					toast.error('Kein Partner gefunden!');
					loading = false;
					return;
				}
				paidBy = partnerStore.partnerUser.id;
			}
		}

		await transactionStore.updateTransaction(tx.id, {
			total_amount: totalCents,
			paid_by: paidBy as string,
			split_mode: splitMode,
			note: note || (type === 'expense' ? 'Ausgabe' : 'Einzahlung'),
			category: type === 'expense' ? selectedCategoryId : ''
		});

		loading = false;
		goto('/');
	}

	async function handleDelete() {
		if (!tx) return;
		if (tx.settlement_id) {
			toast.error('Abgerechnete Transaktionen können nicht gelöscht werden.');
			return;
		}

		if (confirm('Möchtest du diese Transaktion wirklich löschen?')) {
			loading = true;
			await transactionStore.deleteTransaction(tx.id);
			loading = false;
			goto('/');
		}
	}
</script>

<div class="p-4 pt-8 h-full flex flex-col bg-slate-50">
	<header class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<button onclick={() => goto('/')} class="p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Zurück">
				<ArrowLeft size={24} class="text-slate-900" />
			</button>
			<h1 class="text-xl font-bold tracking-tight text-slate-900">Eintrag bearbeiten</h1>
		</div>
		{#if tx && !tx.settlement_id}
			<button onclick={handleDelete} class="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" aria-label="Löschen">
				<Trash2 size={22} />
			</button>
		{/if}
	</header>

	{#if !tx}
		<div class="text-center py-20 text-slate-500">
			Transaktion nicht gefunden.
		</div>
	{:else if tx.settlement_id}
		<div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 mb-6">
			Diese Transaktion wurde bereits abgerechnet und kann aus Revisionssicherheitsgründen nicht mehr geändert oder gelöscht werden.
		</div>
	{:else}
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
			<Input 
				label="Betrag (€)" 
				type="text" 
				inputmode="decimal" 
				placeholder="0,00" 
				required 
				bind:value={amount} 
				class="text-lg"
			/>

			<Input 
				label={type === 'expense' ? 'Wofür?' : 'Beschreibung (optional)'} 
				type="text" 
				placeholder={type === 'expense' ? 'Supermarkt, Tanken...' : 'Monatlicher Beitrag...'} 
				bind:value={note} 
			/>

			{#if type === 'expense'}
				<div class="flex flex-col gap-2 mt-2">
					<span class="text-sm font-medium text-slate-700">Kategorie</span>
					<div class="grid grid-cols-3 gap-2">
						{#each categoryStore.categories as cat (cat.id)}
							{@const IconComponent = iconMap[cat.icon] || CircleEllipsis}
							<button
								type="button"
								class="flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all min-h-[72px] active:scale-95
									{selectedCategoryId === cat.id ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'}"
								onclick={() => selectedCategoryId = cat.id}
							>
								<IconComponent size={20} class={selectedCategoryId === cat.id ? 'text-emerald-400' : 'text-slate-500'} />
								<span class="text-[11px] font-semibold mt-1">{cat.name}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<div class="flex flex-col gap-2 mt-2">
				<span class="text-sm font-medium text-slate-700">
					{type === 'expense' ? 'Wer hat bezahlt?' : 'Wer zahlt ein?'}
				</span>
				<div class="flex gap-2">
					<Button 
						type="button" 
						variant={payer === 'ich' ? 'primary' : 'secondary'} 
						class="flex-1"
						onclick={() => payer = 'ich'}
					>
						Ich
					</Button>
					{#if partnerStore.partnerStatus === 'active'}
					<Button 
						type="button" 
						variant={payer === 'partner' ? 'primary' : 'secondary'} 
						class="flex-1"
						onclick={() => payer = 'partner'}
					>
						Partner
					</Button>
					{/if}
					{#if type === 'expense'}
						<Button 
							type="button" 
							variant={payer === 'kasse' ? 'primary' : 'secondary'} 
							class="flex-1"
							onclick={() => payer = 'kasse'}
						>
							Kasse
						</Button>
					{/if}
				</div>
			</div>

			<div class="mt-auto pt-6">
				<Button type="submit" variant="primary" class="w-full">
					{loading ? 'Wird gespeichert...' : 'Speichern'}
				</Button>
			</div>
		</form>
	{/if}
</div>
