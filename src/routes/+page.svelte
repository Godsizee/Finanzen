<script lang="ts">
	import { onMount } from 'svelte';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import HeroCard from '$lib/features/transactions/components/HeroCard.svelte';
	import FairShareAlert from '$lib/features/transactions/components/FairShareAlert.svelte';
	import MonthlyStats from '$lib/features/transactions/components/MonthlyStats.svelte';
	import TransactionList from '$lib/features/transactions/components/TransactionList.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { Plus, User, Users, ArrowRight } from '@lucide/svelte';

	onMount(() => {
		transactionStore.load();
		categoryStore.load();
	});
</script>

<div class="p-4 pt-8 h-full flex flex-col relative">
	<header class="mb-6 px-1 flex justify-between items-center">
		<h1 class="text-2xl font-bold tracking-tight text-slate-900">Übersicht</h1>
		<div class="flex items-center gap-4">
			<a href="/recurring" class="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
				Abos
			</a>
			<a href="/history" class="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
				Historie
			</a>
			<a href="/profile" class="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
				<User size={18} />
			</a>
		</div>
	</header>
	
	<HeroCard />

	{#if partnerStore.partnerStatus === 'none'}
		<div class="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center shrink-0">
					<Users size={18} />
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-semibold text-amber-900">Partner einladen</h4>
					<p class="text-xs text-amber-700 mt-0.5">Verknüpfe dich, um Kosten gemeinsam aufzuteilen.</p>
				</div>
			</div>
			<a href="/profile" class="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0" aria-label="Partner einladen">
				<ArrowRight size={16} />
			</a>
		</div>
	{:else if partnerStore.partnerStatus === 'pending_sent'}
		<div class="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center shrink-0 animate-pulse">
					<Users size={18} />
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-semibold text-slate-800">Einladung ausstehend</h4>
					<p class="text-xs text-slate-500 mt-0.5">Werte auf Bestätigung von deines Partners.</p>
				</div>
			</div>
			<a href="/profile" class="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors" aria-label="Status ansehen">
				Details
			</a>
		</div>
	{:else if partnerStore.partnerStatus === 'pending_received'}
		<div class="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
			<div class="flex items-center gap-3">
				<div class="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
					<Users size={18} />
				</div>
				<div class="flex-1 min-w-0">
					<h4 class="text-sm font-semibold text-blue-900">Einladung erhalten</h4>
					<p class="text-xs text-blue-700 mt-0.5">Ein Partner möchte sich mit dir verknüpfen.</p>
				</div>
			</div>
			<a href="/profile" class="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg active:scale-95 transition-transform" aria-label="Einladung ansehen">
				Antworten
			</a>
		</div>
	{/if}
	
	<FairShareAlert />

	<MonthlyStats />
	
	<TransactionList />

	<!-- Floating Action Button -->
	<a 
		href="/add" 
		class="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 transition-transform active:scale-95 z-50"
		aria-label="Neue Ausgabe hinzufügen"
	>
		<Plus size={24} />
	</a>
</div>

