<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { recurringStore } from '$lib/features/recurring/store.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { formatCurrency } from '$lib/core/math';
	import Card from '$lib/ui/Card.svelte';
	import Button from '$lib/ui/Button.svelte';
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte';
	
	import { 
		ArrowLeft, Plus, Play, Pause, Edit2, Trash2, 
		ShoppingBag, Home, Zap, Sparkles, Car, Gamepad2, 
		Tv, Utensils, Heart, Shield, Shirt, CircleEllipsis, CalendarDays
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

	const colorMap: Record<string, string> = {
		emerald: 'bg-emerald-50 text-emerald-600',
		blue: 'bg-blue-50 text-blue-600',
		yellow: 'bg-yellow-50 text-yellow-600',
		pink: 'bg-pink-50 text-pink-600',
		indigo: 'bg-indigo-50 text-indigo-600',
		violet: 'bg-violet-50 text-violet-600',
		cyan: 'bg-cyan-50 text-cyan-600',
		orange: 'bg-orange-50 text-orange-600',
		red: 'bg-red-50 text-red-600',
		rose: 'bg-rose-50 text-rose-600',
		teal: 'bg-teal-50 text-teal-600',
		slate: 'bg-slate-100 text-slate-600'
	};

	onMount(() => {
		recurringStore.load();
		categoryStore.load();
		
		const unsub = recurringStore.subscribe();
		return () => unsub();
	});

	function getFrequencyLabel(freq: string) {
		switch (freq) {
			case 'monthly': return 'Monatlich';
			case 'quarterly': return 'Quartalsweise';
			case 'yearly': return 'Jährlich';
			default: return freq;
		}
	}

	async function toggleActive(rule: any) {
		try {
			await recurringStore.update(rule.id, {
				active: !rule.active
			});
		} catch (e) {
			// Toast is handled in store
		}
	}

	let showConfirmDelete = $state(false);
	let ruleIdToDelete = $state<string | null>(null);

	function confirmDelete(id: string) {
		ruleIdToDelete = id;
		showConfirmDelete = true;
	}

	async function executeDelete() {
		if (!ruleIdToDelete) return;
		try {
			await recurringStore.delete(ruleIdToDelete);
		} catch (e) {
			// Toast is handled in store
		} finally {
			ruleIdToDelete = null;
		}
	}
</script>

<div class="p-4 pt-8 max-[340px]:p-2 max-[340px]:pt-6 h-full flex flex-col bg-slate-50">
	<header class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-4 max-[340px]:gap-2">
			<button onclick={() => goto('/')} class="p-2 -ml-2 max-[340px]:-ml-3 rounded-full hover:bg-slate-200 transition-colors">
				<ArrowLeft class="w-6 h-6 max-[340px]:w-5 max-[340px]:h-5 text-slate-900" />
			</button>
			<h1 class="text-xl font-bold tracking-tight text-slate-900 max-[340px]:text-sm">Wiederkehrende Ausgaben</h1>
		</div>
	</header>

	{#if recurringStore.loading}
		<div class="text-center py-10 text-slate-400 text-sm">
			Lädt Abonnements...
		</div>
	{:else}
		<div class="flex-1 flex flex-col gap-3">
			{#if recurringStore.expenses.length === 0}
				<div class="text-center py-16 px-4">
					<div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
						<CalendarDays size={32} />
					</div>
					<h3 class="text-slate-800 font-semibold mb-1">Keine wiederkehrenden Ausgaben</h3>
					<p class="text-slate-500 text-xs max-w-xs mx-auto mb-6">
						Erfasse regelmäßige Zahlungen wie Miete, Internet, Spotify oder Versicherungen. Sie werden automatisch an Fälligkeitsterminen generiert.
					</p>
					<Button onclick={() => goto('/recurring/add')} variant="primary" class="mx-auto">
						<Plus size={18} class="mr-2" />
						Abo einrichten
					</Button>
				</div>
			{:else}
				<div class="flex flex-col gap-3 pb-24">
					{#each recurringStore.expenses as rule (rule.id)}
						{@const cat = rule.expand?.category}
						{@const IconComponent = cat ? iconMap[cat.icon] : CalendarDays}
						{@const colorClasses = (cat && colorMap[cat.color]) || 'bg-slate-100 text-slate-600'}
						
						<Card class="flex flex-col gap-3 max-[340px]:gap-2 p-4 max-[340px]:p-2.5 transition-all relative {rule.active ? 'border-slate-200' : 'opacity-65 border-dashed bg-slate-50'}">
							<div class="flex items-center gap-3 max-[340px]:gap-2">
								<div class="w-10 h-10 max-[340px]:w-8 max-[340px]:h-8 rounded-full flex items-center justify-center shrink-0 {colorClasses}">
									<IconComponent class="w-5 h-5 max-[340px]:w-4 max-[340px]:h-4" />
								</div>
								
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 max-[340px]:gap-1">
										<h3 class="font-bold text-slate-900 text-sm max-[340px]:text-xs truncate">{rule.name}</h3>
										<span class="inline-flex items-center px-1.5 py-0.5 max-[340px]:px-1 max-[340px]:py-0 rounded-md text-[10px] max-[340px]:text-[8px] font-semibold bg-slate-100 text-slate-700">
											{getFrequencyLabel(rule.frequency)}
										</span>
									</div>
									<p class="text-xs max-[340px]:text-[9px] text-slate-500 mt-0.5">
										Bezahlt von: {rule.paid_by === authStore.currentUser?.id ? 'Ich' : (partnerStore.partnerUser?.username || 'Partner')} • 
										Split: {rule.split_mode === '50_50' ? '50/50' : 'Kasse'}
									</p>
								</div>

								<div class="text-right shrink-0">
									<span class="font-bold text-slate-900 text-base max-[340px]:text-xs">
										{formatCurrency(rule.amount)}
									</span>
									<p class="text-[10px] max-[340px]:text-[8px] text-slate-400 mt-0.5">
										Tag {rule.day_of_month}. des Monats
									</p>
								</div>
							</div>

							<div class="h-px bg-slate-100"></div>

							<div class="flex items-center justify-between text-xs pt-1">
								<span class="text-slate-400 text-[10px] max-[340px]:text-[8px]">
									{#if rule.last_generated}
										Zuletzt generiert: {new Date(rule.last_generated).toLocaleDateString('de-DE')}
									{:else}
										Fällig ab: {new Date(rule.start_date).toLocaleDateString('de-DE')}
									{/if}
								</span>

								<div class="flex items-center gap-2 max-[340px]:gap-1">
									<button 
										onclick={() => toggleActive(rule)} 
										class="p-1.5 max-[340px]:p-1 rounded-md text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1.5 max-[340px]:gap-1 active:scale-95"
										title={rule.active ? 'Pausieren' : 'Aktivieren'}
									>
										{#if rule.active}
											<Pause class="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 text-amber-500" />
											<span class="text-[10px] max-[340px]:text-[8px] font-semibold text-amber-500">Pausieren</span>
										{:else}
											<Play class="w-3.5 h-3.5 max-[340px]:w-3 max-[340px]:h-3 text-emerald-500" />
											<span class="text-[10px] max-[340px]:text-[8px] font-semibold text-emerald-500">Aktivieren</span>
										{/if}
									</button>

									<button 
										onclick={() => goto(`/recurring/edit/${rule.id}`)}
										class="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors active:scale-95"
										title="Bearbeiten"
									>
										<Edit2 size={14} />
									</button>

									<button 
										onclick={() => confirmDelete(rule.id)}
										class="p-1.5 rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors active:scale-95"
										title="Löschen"
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if recurringStore.expenses.length > 0}
		<!-- Floating Action Button for adding recurring expenses -->
		<a 
			href="/recurring/add" 
			class="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 transition-transform active:scale-95 z-50"
			aria-label="Neues Abo hinzufügen"
		>
			<Plus size={24} />
		</a>
	{/if}

	<ConfirmDialog
		bind:show={showConfirmDelete}
		title="Abo löschen"
		message="Möchtest du dieses wiederkehrende Abonnement wirklich löschen? Zukünftige Ausgaben werden nicht mehr automatisch generiert."
		confirmText="Abo löschen"
		cancelText="Abbrechen"
		variant="danger"
		onconfirm={executeDelete}
	/>
</div>
