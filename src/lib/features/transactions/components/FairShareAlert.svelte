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
	<Card class="mt-4 flex flex-col gap-3 border border-slate-200/60 bg-slate-50 p-5 shadow-xs">
		<div class="flex items-start gap-3">
			<div class="rounded-lg bg-slate-900/5 p-2 text-slate-800">
				<HeartHandshake class="h-5 w-5" />
			</div>
			<div class="min-w-0 flex-1">
				<h4 class="text-sm font-semibold text-slate-900">Manuelle Kostenaufteilung</h4>
				<p class="mt-0.5 text-xs text-slate-500">
					Verhältnis: {myPercent}% ({meName}) zu {partnerPercent}% ({partnerName})
				</p>
			</div>
		</div>

		<div
			class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3.5"
		>
			<div class="flex flex-col">
				<span class="text-xs font-medium tracking-wider text-slate-400 uppercase">Empfehlung</span>
				<span class="mt-1 text-sm font-medium text-slate-800">
					{#if isPositive}
						<strong class="font-semibold">{partnerName}</strong> sollte dir
						<strong class="font-semibold text-emerald-600">{formatCurrency(amount)}</strong> überweisen.
					{:else}
						Du solltest <strong class="font-semibold">{partnerName}</strong>
						<strong class="font-semibold text-red-600">{formatCurrency(amount)}</strong> überweisen.
					{/if}
				</span>
			</div>
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
			>
				<ArrowRightLeft class="h-4 w-4" />
			</div>
		</div>
	</Card>
{/if}
