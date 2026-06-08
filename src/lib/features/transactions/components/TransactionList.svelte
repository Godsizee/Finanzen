<script lang="ts">
	import Card from '$lib/ui/Card.svelte';
	import { transactionStore } from '../store.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import {
		ReceiptText,
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

	import SkeletonCard from '$lib/ui/SkeletonCard.svelte';

	let transactions = $derived(transactionStore.unsettledTransactions);
	let cappedTransactions = $derived(transactions.slice(0, 5));

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

	const colorMap: Record<string, string> = {
		emerald: 'bg-emerald-50 text-emerald-600',
		blue: 'bg-blue-50 text-blue-600',
		amber: 'bg-amber-50 text-amber-600',
		indigo: 'bg-indigo-50 text-indigo-600',
		slate: 'bg-slate-100 text-slate-600',
		yellow: 'bg-yellow-50 text-yellow-600',
		pink: 'bg-pink-50 text-pink-600',
		violet: 'bg-violet-50 text-violet-600',
		cyan: 'bg-cyan-50 text-cyan-600',
		orange: 'bg-orange-50 text-orange-600',
		red: 'bg-red-50 text-red-600',
		rose: 'bg-rose-50 text-rose-600',
		teal: 'bg-teal-50 text-teal-600'
	};
</script>

<div class="mt-8 flex flex-col gap-3">
	<h3 class="mb-2 px-1 text-sm font-semibold tracking-wider text-slate-500 uppercase">
		Letzte Ausgaben
	</h3>

	{#if transactionStore.loading}
		<SkeletonCard lines={2} hasIcon={true} />
		<SkeletonCard lines={2} hasIcon={true} />
		<SkeletonCard lines={2} hasIcon={true} />
	{:else if transactions.length === 0}
		<div class="rounded-2xl border border-slate-100 bg-white px-4 py-12 text-center">
			<div
				class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400"
			>
				<ReceiptText size={24} />
			</div>
			<p class="text-sm font-semibold text-slate-800">Noch keine Ausgaben erfasst</p>
			<p class="mt-1 text-xs text-slate-500">
				Füge deine erste Ausgabe hinzu, um die Verrechnung zu starten.
			</p>
		</div>
	{/if}

	{#each cappedTransactions as tx (tx.id)}
		{@const cat = tx.expand?.category}
		{@const IconComponent = cat ? iconMap[cat.icon] : ReceiptText}
		{@const colorClasses = (cat && colorMap[cat.color]) || 'bg-slate-100 text-slate-600'}

		<a href="/edit/{tx.id}" class="block transition-transform active:scale-[0.98]">
			<Card
				class="flex cursor-pointer items-center gap-4 p-4 transition-all hover:border-slate-200 max-[340px]:gap-2 max-[340px]:p-3"
			>
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full max-[340px]:h-8 max-[340px]:w-8 {colorClasses}"
				>
					<svelte:component
						this={IconComponent}
						class="h-5 w-5 max-[340px]:h-4 max-[340px]:w-4"
					/>
				</div>
				<div class="flex min-w-0 flex-1 flex-col">
					<div class="flex items-center gap-2 max-[340px]:gap-1">
						<span class="truncate text-sm font-medium text-slate-900 max-[340px]:text-xs">
							{tx.note || 'Ausgabe'}
						</span>
						{#if tx.split_mode === 'kasse'}
							<span
								class="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 max-[340px]:px-1 max-[340px]:py-0 max-[340px]:text-[9px]"
							>
								Kasse
							</span>
						{:else if tx.split_mode === 'deposit'}
							<span
								class="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 max-[340px]:px-1 max-[340px]:py-0 max-[340px]:text-[9px]"
							>
								Einzahlung
							</span>
						{/if}
					</div>
					<span class="mt-0.5 text-xs text-slate-500 max-[340px]:text-[10px]">
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
				<div
					class="text-sm font-semibold max-[340px]:text-xs {tx.split_mode === 'deposit'
						? 'text-emerald-600'
						: 'text-slate-900'}"
				>
					{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
				</div>
			</Card>
		</a>
	{/each}

	{#if transactions.length > 5}
		<a
			href="/history"
			class="mt-2 block text-center text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors py-3 border border-dashed border-slate-200 bg-white rounded-2xl hover:border-slate-300"
		>
			Alle Buchungen anzeigen ({transactions.length})
		</a>
	{/if}
</div>
