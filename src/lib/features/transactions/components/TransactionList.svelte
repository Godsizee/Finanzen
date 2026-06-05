<script lang="ts">
	import Card from '$lib/ui/Card.svelte';
	import { transactionStore } from '../store.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { ReceiptText, ShoppingBag, Home, Sparkles, Car, CircleEllipsis } from '@lucide/svelte';

	let transactions = $derived(transactionStore.transactions);

	const iconMap: Record<string, any> = {
		ShoppingBag,
		Home,
		Sparkles,
		Car,
		CircleEllipsis
	};

	const colorMap: Record<string, string> = {
		emerald: 'bg-emerald-50 text-emerald-600',
		blue: 'bg-blue-50 text-blue-600',
		amber: 'bg-amber-50 text-amber-600',
		indigo: 'bg-indigo-50 text-indigo-600',
		slate: 'bg-slate-100 text-slate-600'
	};
</script>

<div class="flex flex-col gap-3 mt-8">
	<h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">Letzte Ausgaben</h3>
	
	{#if transactions.length === 0}
		<div class="text-center py-10 text-slate-400 text-sm">
			Noch keine Ausgaben erfasst.
		</div>
	{/if}

	{#each transactions as tx (tx.id)}
		{@const cat = tx.expand?.category}
		{@const IconComponent = cat ? iconMap[cat.icon] : ReceiptText}
		{@const colorClasses = (cat && colorMap[cat.color]) || 'bg-slate-100 text-slate-600'}

		{#if !tx.settlement_id}
			<a href="/edit/{tx.id}" class="block active:scale-[0.98] transition-transform">
				<Card class="flex items-center gap-4 p-4 hover:border-slate-200 transition-all cursor-pointer">
					<div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 {colorClasses}">
						<IconComponent size={20} />
					</div>
					<div class="flex-1 flex flex-col min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-medium text-slate-900 truncate">
								{tx.note || 'Ausgabe'}
							</span>
							{#if tx.split_mode === 'kasse'}
								<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
									Kasse
								</span>
							{:else if tx.split_mode === 'deposit'}
								<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
									Einzahlung
								</span>
							{/if}
						</div>
						<span class="text-xs text-slate-500 mt-0.5">
							{new Date(tx.date).toLocaleDateString('de-DE')} • 
							{#if tx.split_mode === 'kasse'}
								aus Kasse bezahlt
							{:else if tx.split_mode === 'deposit'}
								von {tx.paid_amount_user_a > 0 ? 'Dir' : 'Partner'}
							{:else}
								bezahlt von {tx.paid_amount_user_a > 0 ? 'Dir' : 'Partner'}
							{/if}
						</span>
					</div>
					<div class="font-semibold {tx.split_mode === 'deposit' ? 'text-emerald-600' : 'text-slate-900'}">
						{tx.split_mode === 'deposit' ? '+' : ''}{formatCurrency(tx.total_amount)}
					</div>
				</Card>
			</a>
		{:else}
			<div class="opacity-60">
				<Card class="flex items-center gap-4 p-4 bg-slate-50 border-dashed">
					<div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 {colorClasses}">
						<IconComponent size={20} />
					</div>
					<div class="flex-1 flex flex-col min-w-0">
						<div class="flex items-center gap-2">
							<span class="font-medium text-slate-900 truncate">
								{tx.note || 'Ausgabe'}
							</span>
							{#if tx.split_mode === 'kasse'}
								<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
									Kasse
								</span>
							{:else if tx.split_mode === 'deposit'}
								<span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
									Einzahlung
								</span>
							{/if}
						</div>
						<span class="text-xs text-slate-500 mt-0.5">
							{new Date(tx.date).toLocaleDateString('de-DE')} • abgerechnet
						</span>
					</div>
					<div class="font-semibold text-slate-500">
						{formatCurrency(tx.total_amount)}
					</div>
				</Card>
			</div>
		{/if}
	{/each}
</div>
