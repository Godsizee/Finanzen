<script lang="ts">
	import { transactionStore } from '../store.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';

	let balance = $derived(transactionStore.myBalance);
	let kasseBalance = $derived(transactionStore.kasseBalance);
	let isPositive = $derived(balance > 0);
	let isNegative = $derived(balance < 0);
	let isZero = $derived(balance === 0);
	
	let isPartnerActive = $derived(partnerStore.partnerStatus === 'active');
	let isKasseMode = $derived(authStore.currentUser?.cost_sharing_mode === 'kasse');
	
	let totalIncome = $derived.by(() => {
		const myInc = authStore.currentUser?.income || 0;
		const partnerInc = (isPartnerActive && partnerStore.partnerUser?.income) || 0;
		return myInc + partnerInc;
	});
</script>

<div class="bg-slate-900 text-white rounded-3xl p-6 max-[340px]:p-4 shadow-sm border border-slate-800 flex flex-col gap-4 max-[340px]:gap-3">
	<div class="flex flex-col gap-1">
		<span class="text-xs text-slate-400 font-semibold tracking-wider uppercase max-[340px]:text-[10px]">
			Offener Ausgleich
		</span>
		<div class="text-2xl font-bold tracking-tight {isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-slate-200'} max-[340px]:text-lg">
			{#if isKasseMode}
				{#if isPositive}
					Dir fehlen {formatCurrency(balance)}.
				{:else if isNegative}
					{partnerStore.partnerUser?.name || 'Partner'} fehlen {formatCurrency(Math.abs(balance))}.
				{:else}
					Kontostand gedeckt.
				{/if}
			{:else}
				{#if isPositive}
					Du bekommst {formatCurrency(balance)} zurück.
				{:else if isNegative}
					Du schuldest {formatCurrency(Math.abs(balance))}.
				{:else}
					Ihr seid quitt.
				{/if}
			{/if}
		</div>
		<span class="text-xs {isPositive ? 'text-emerald-400/80' : isNegative ? 'text-red-400/80' : 'text-slate-400'} mt-1 max-[340px]:text-[10px] max-[340px]:leading-tight">
			{#if isKasseMode}
				{#if isPositive}
					Dein Partner müsste sie dir überweisen.
				{:else if isNegative}
					Du solltest sie deinem Partner überweisen.
				{:else}
					Aktuell ist kein Ausgleich erforderlich.
				{/if}
			{:else}
				{#if isPositive}
					Dein Partner sollte dir diesen Betrag überweisen.
				{:else if isNegative}
					Du solltest deinem Partner diesen Betrag überweisen.
				{:else}
					Aktuell ist kein Ausgleich erforderlich.
				{/if}
			{/if}
		</span>
	</div>
	
	<div class="h-px bg-slate-800 my-1 max-[340px]:my-0"></div>
	
	<div class="grid grid-cols-2 gap-4 max-[340px]:gap-2">
		<!-- Kassenstand -->
		<div class="flex flex-col">
			<span class="text-xs text-slate-400 font-medium max-[340px]:text-[10px]">Gemeinsame Kasse</span>
			<span class="font-semibold text-sm text-slate-200 mt-1 max-[340px]:text-xs">
				{formatCurrency(kasseBalance)}
			</span>
		</div>
		
		<!-- Einkommen -->
		<div class="flex flex-col text-right">
			<span class="text-xs text-slate-400 font-medium max-[340px]:text-[10px]">{isPartnerActive ? 'Einkommen' : 'Mein Einkommen'}</span>
			<span class="font-semibold text-sm text-slate-200 mt-1 max-[340px]:text-xs">
				{formatCurrency(totalIncome)}
			</span>
		</div>
	</div>
</div>

