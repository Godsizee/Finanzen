<script lang="ts">
	import Card from '$lib/ui/Card.svelte';
	import { transactionStore } from '../store.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { ReceiptText, ShoppingBag, Home, Sparkles, Car, CircleEllipsis, Zap, Gamepad2, Tv, Utensils, Heart, Shield, Shirt } from '@lucide/svelte';

	import SkeletonCard from '$lib/ui/SkeletonCard.svelte';

	let transactions = $derived(transactionStore.transactions);

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

<div class="flex flex-col gap-3 mt-8">
	<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Letzte Ausgaben</h3>
	
	{#if transactionStore.loading}
		<SkeletonCard lines={2} hasIcon={true} />
		<SkeletonCard lines={2} hasIcon={true} />
		<SkeletonCard lines={2} hasIcon={true} />
	{:else if transactions.length === 0}
		<div class="text-center py-12 px-4 bg-white border border-slate-100 rounded-2xl">
			<div class="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
				<ReceiptText size={24} />
			</div>
			<p class="text-slate-800 font-semibold text-sm">Noch keine Ausgaben erfasst</p>
			<p class="text-slate-500 text-xs mt-1">Füge deine erste Ausgabe hinzu, um die Verrechnung zu starten.</p>
		</div>
	{/if}

	{#each transactions as tx (tx.id)}
		{@const cat = tx.expand?.category}
		{@const IconComponent = cat ? iconMap[cat.icon] : ReceiptText}
		{@const colorClasses = (cat && colorMap[cat.color]) || 'bg-slate-100 text-slate-600'}

		{#if !tx.settlement_id}
			<a href="/edit/{tx.id}" class="block active:scale-[0.98] transition-transform">
				<Card class="flex items-center gap-4 max-[340px]:gap-2 p-4 max-[340px]:p-3 hover:border-slate-200 transition-all cursor-pointer">
					<div class="w-10 h-10 max-[340px]:w-8 max-[340px]:h-8 rounded-full flex items-center justify-center shrink-0 {colorClasses}">
						<svelte:component this={IconComponent} class="w-5 h-5 max-[340px]:w-4 max-[340px]:h-4" />
					</div>
					<div class="flex-1 flex flex-col min-w-0">
						<div class="flex items-center gap-2 max-[340px]:gap-1">
							<span class="font-medium text-slate-900 text-sm max-[340px]:text-xs truncate">
								{tx.note || 'Ausgabe'}
							</span>
							{#if tx.split_mode === 'kasse'}
								<span class="inline-flex items-center px-1.5 py-0.5 max-[340px]:px-1 max-[340px]:py-0 rounded-md text-[10px] max-[340px]:text-[9px] font-semibold bg-slate-100 text-slate-700">
									Kasse
								</span>
							{:else if tx.split_mode === 'deposit'}
								<span class="inline-flex items-center px-1.5 py-0.5 max-[340px]:px-1 max-[340px]:py-0 rounded-md text-[10px] max-[340px]:text-[9px] font-semibold bg-emerald-100 text-emerald-800">
									Einzahlung
								</span>
							{/if}
						</div>
						<span class="text-xs max-[340px]:text-[10px] text-slate-500 mt-0.5">
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
					<div class="font-semibold text-sm max-[340px]:text-xs {tx.split_mode === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}">
						{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
					</div>
				</Card>
			</a>
		{:else}
			<div class="opacity-60">
				<Card class="flex items-center gap-4 max-[340px]:gap-2 p-4 max-[340px]:p-3 bg-slate-50 border-dashed">
					<div class="w-10 h-10 max-[340px]:w-8 max-[340px]:h-8 rounded-full flex items-center justify-center shrink-0 {colorClasses}">
						<svelte:component this={IconComponent} class="w-5 h-5 max-[340px]:w-4 max-[340px]:h-4" />
					</div>
					<div class="flex-1 flex flex-col min-w-0">
						<div class="flex items-center gap-2 max-[340px]:gap-1">
							<span class="font-medium text-slate-900 text-sm max-[340px]:text-xs truncate">
								{tx.note || 'Ausgabe'}
							</span>
							{#if tx.split_mode === 'kasse'}
								<span class="inline-flex items-center px-1.5 py-0.5 max-[340px]:px-1 max-[340px]:py-0 rounded-md text-[10px] max-[340px]:text-[9px] font-semibold bg-slate-100 text-slate-700">
									Kasse
								</span>
							{:else if tx.split_mode === 'deposit'}
								<span class="inline-flex items-center px-1.5 py-0.5 max-[340px]:px-1 max-[340px]:py-0 rounded-md text-[10px] max-[340px]:text-[9px] font-semibold bg-emerald-100 text-emerald-800">
									Einzahlung
								</span>
							{/if}
						</div>
						<span class="text-xs max-[340px]:text-[10px] text-slate-500 mt-0.5">
							{new Date(tx.date).toLocaleDateString('de-DE')} • abgerechnet
						</span>
					</div>
					<div class="font-semibold text-sm max-[340px]:text-xs text-slate-500">
						{formatCurrency(tx.total_amount)}
					</div>
				</Card>
			</div>
		{/if}
	{/each}
</div>
