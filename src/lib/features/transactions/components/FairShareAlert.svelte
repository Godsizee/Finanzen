<script lang="ts">
	import { transactionStore } from '../store.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { HeartHandshake, ArrowRightLeft } from '@lucide/svelte';
	import Card from '$lib/ui/Card.svelte';

	let active = $derived(transactionStore.fairSharingActive);
	let balance = $derived(transactionStore.fairBalance);
	let myIncome = $derived(authStore.currentUser?.income || 0);
	let partnerIncome = $derived(partnerStore.partnerUser?.income || 0);

	let myRatio = $derived(transactionStore.fairSharingRatio);
	let myPercent = $derived(Math.round(myRatio * 100));
	let partnerPercent = $derived(100 - myPercent);

	let isPositive = $derived(balance >= 0);
	let amount = $derived(Math.abs(balance));
	
	let meName = $derived(authStore.currentUser?.name || 'Du');
	let partnerName = $derived(partnerStore.partnerUser?.name || 'Partner');
</script>

{#if active && balance !== 0}
	<Card class="mt-4 bg-slate-50 border border-slate-200/60 p-5 flex flex-col gap-3 shadow-xs">
		<div class="flex items-start gap-3">
			<div class="p-2 bg-slate-900/5 text-slate-800 rounded-lg">
				<HeartHandshake class="w-5 h-5" />
			</div>
			<div class="flex-1 min-w-0">
				<h4 class="text-sm font-semibold text-slate-900">Manuelle Kostenaufteilung</h4>
				<p class="text-xs text-slate-500 mt-0.5">
					Verhältnis: {myPercent}% ({meName}) zu {partnerPercent}% ({partnerName})
				</p>
			</div>
		</div>

		<div class="bg-white rounded-xl p-3.5 border border-slate-100 flex items-center justify-between gap-3">
			<div class="flex flex-col">
				<span class="text-xs text-slate-400 font-medium uppercase tracking-wider">Empfehlung</span>
				<span class="text-sm font-medium text-slate-800 mt-1">
					{#if isPositive}
						<strong class="font-semibold">{partnerName}</strong> sollte dir <strong class="font-semibold text-emerald-600">{formatCurrency(amount)}</strong> überweisen.
					{:else}
						Du solltest <strong class="font-semibold">{partnerName}</strong> <strong class="font-semibold text-red-600">{formatCurrency(amount)}</strong> überweisen.
					{/if}
				</span>
			</div>
			<div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
				<ArrowRightLeft class="w-4 h-4" />
			</div>
		</div>
	</Card>
{/if}
