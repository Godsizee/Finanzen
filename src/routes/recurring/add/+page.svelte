<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { recurringStore } from '$lib/features/recurring/store.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { toCents } from '$lib/core/math';
	import { isValidAmount } from '$lib/core/validation';
	import { toast } from '$lib/core/toastStore.svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';

	import {
		ArrowLeft,
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

	let name = $state('');
	let amount = $state('');
	let selectedCategoryId = $state<string>('');
	let payer = $state<'ich' | 'partner' | 'kasse'>('ich');
	let frequency = $state<'monthly' | 'quarterly' | 'yearly'>('monthly');
	let dayOfMonth = $state(1);
	let startDate = $state(new Date().toISOString().slice(0, 10)); // Default to today

	let loading = $state(false);

	onMount(() => {
		categoryStore.load();
	});

	$effect(() => {
		if (!selectedCategoryId && categoryStore.categories.length > 0) {
			const sonstiges = categoryStore.categories.find((c) => c.name === 'Sonstiges');
			selectedCategoryId = sonstiges ? sonstiges.id : categoryStore.categories[0].id;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) {
			toast.error('Bitte einen Namen eingeben');
			return;
		}
		if (!isValidAmount(amount)) {
			toast.error('Bitte einen gültigen Betrag eingeben');
			return;
		}
		if (dayOfMonth < 1 || dayOfMonth > 31) {
			toast.error('Der Tag des Monats muss zwischen 1 und 31 liegen');
			return;
		}

		loading = true;
		const totalCents = toCents(amount);

		let paidBy = authStore.currentUser?.id;
		let splitMode = '50_50';

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

		try {
			await recurringStore.create({
				name,
				amount: totalCents,
				category: selectedCategoryId,
				paid_by: paidBy as string,
				split_mode: splitMode,
				frequency,
				day_of_month: dayOfMonth,
				start_date: startDate + ' 12:00:00',
				active: true
			});
			goto('/recurring');
		} catch (err) {
			// error is handled in store
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex h-full flex-col bg-slate-50 p-4 pt-8">
	<header class="mb-6 flex items-center gap-4">
		<button
			onclick={() => goto('/recurring')}
			class="-ml-2 rounded-full p-2 transition-colors hover:bg-slate-200"
			aria-label="Zurück"
		>
			<ArrowLeft size={24} class="text-slate-900" />
		</button>
		<h1 class="text-xl font-bold tracking-tight text-slate-900">Abo einrichten</h1>
	</header>

	<form onsubmit={handleSubmit} class="flex flex-1 flex-col gap-5 pb-10">
		<Input
			label="Name des Abos / der Ausgabe"
			type="text"
			placeholder="z.B. Spotify, Netflix, Miete..."
			required
			bind:value={name}
		/>

		<div class="grid grid-cols-2 gap-4">
			<Input
				label="Betrag (€)"
				type="text"
				inputmode="decimal"
				placeholder="0,00"
				required
				bind:value={amount}
			/>

			<div class="flex flex-col gap-1">
				<label
					for="day-of-month"
					class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Tag im Monat</label
				>
				<input
					id="day-of-month"
					type="number"
					min="1"
					max="31"
					required
					bind:value={dayOfMonth}
					class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="flex flex-col gap-1">
				<label for="frequency" class="text-xs font-semibold tracking-wider text-slate-500 uppercase"
					>Intervall</label
				>
				<select
					id="frequency"
					bind:value={frequency}
					class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-slate-900 focus:outline-none"
				>
					<option value="monthly">Monatlich</option>
					<option value="quarterly">Quartalsweise</option>
					<option value="yearly">Jährlich</option>
				</select>
			</div>

			<div class="flex flex-col gap-1">
				<label
					for="start-date"
					class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Startdatum</label
				>
				<input
					id="start-date"
					type="date"
					required
					bind:value={startDate}
					class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 transition-all focus:border-transparent focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<span class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Kategorie</span>
			<div class="grid grid-cols-3 gap-2">
				{#each categoryStore.categories as cat (cat.id)}
					{@const IconComponent = iconMap[cat.icon] || CircleEllipsis}
					<button
						type="button"
						class="flex min-h-[64px] flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all active:scale-95
							{selectedCategoryId === cat.id
							? 'border-slate-900 bg-slate-900 text-white shadow-sm'
							: 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}"
						onclick={() => (selectedCategoryId = cat.id)}
					>
						<IconComponent
							size={18}
							class={selectedCategoryId === cat.id ? 'text-emerald-400' : 'text-slate-500'}
						/>
						<span class="mt-1 text-[10px] font-semibold">{cat.name}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<span class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Wer bezahlt?</span
			>
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
				<Button
					type="button"
					variant={payer === 'kasse' ? 'primary' : 'secondary'}
					class="flex-1"
					onclick={() => (payer = 'kasse')}
				>
					Kasse
				</Button>
			</div>
		</div>

		<div class="mt-auto pt-4">
			<Button type="submit" variant="primary" class="w-full">
				{loading ? 'Wird eingerichtet...' : 'Abo einrichten'}
			</Button>
		</div>
	</form>
</div>
