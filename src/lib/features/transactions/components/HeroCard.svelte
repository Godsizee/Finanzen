<script lang="ts">
	import { transactionStore } from '../store.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';

	let balance = $derived(transactionStore.myBalance);
	let kasseBalance = $derived(transactionStore.kasseBalance);
	let isPositive = $derived(balance >= 0);
	
	let isPartnerActive = $derived(partnerStore.partnerStatus === 'active');
	
	let totalIncome = $derived.by(() => {
		const myInc = authStore.currentUser?.income || 0;
		const partnerInc = (isPartnerActive && partnerStore.partnerUser?.income) || 0;
		return myInc + partnerInc;
	});
</script>

<div class="bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800 flex flex-col gap-4">
	<div class="flex flex-col gap-1">
		<span class="text-xs text-slate-400 font-semibold tracking-wider uppercase">
			{isPartnerActive ? 'Gemeinsames Einkommen' : 'Mein Nettoeinkommen'}
		</span>
		<div class="text-4xl font-bold tracking-tight text-emerald-400">
			{formatCurrency(totalIncome)}
		</div>
	</div>
	
	<div class="h-px bg-slate-800 my-1"></div>
	
	<div class="grid grid-cols-2 gap-4">
		<!-- Kassenstand -->
		<div class="flex flex-col">
			<span class="text-xs text-slate-400 font-medium">Gemeinsame Kasse:</span>
			<span class="font-semibold text-sm text-slate-200 mt-1">
				{formatCurrency(kasseBalance)}
			</span>
		</div>
		
		<!-- Dein Saldo -->
		<div class="flex flex-col text-right">
			<span class="text-xs text-slate-400 font-medium">Dein Saldo:</span>
			<div class="mt-1">
				<span class="font-semibold text-sm {balance === 0 ? 'text-slate-300' : isPositive ? 'text-emerald-400' : 'text-red-400'}">
					{formatCurrency(Math.abs(balance))}
				</span>
				<span class="block text-[10px] {balance === 0 ? 'text-slate-500' : isPositive ? 'text-emerald-400/80' : 'text-red-400/80'} font-medium">
					{#if balance === 0}
						quitt
					{:else if isPositive}
						dir geschuldet
					{:else}
						du schuldest
					{/if}
				</span>
			</div>
		</div>
	</div>
</div>

