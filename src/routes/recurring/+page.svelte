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
		ArrowLeft,
		Plus,
		Play,
		Pause,
		Edit2,
		Trash2,
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
		CircleEllipsis,
		CalendarDays
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
			case 'monthly':
				return 'Monatlich';
			case 'quarterly':
				return 'Quartalsweise';
			case 'yearly':
				return 'Jährlich';
			default:
				return freq;
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

<div class="flex h-full flex-col bg-slate-50 p-4 pt-8 max-[340px]:p-2 max-[340px]:pt-6">
	<header class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-4 max-[340px]:gap-2">
			<button
				onclick={() => goto('/')}
				class="-ml-2 rounded-full p-2 transition-colors hover:bg-slate-200 max-[340px]:-ml-3"
			>
				<ArrowLeft class="h-6 w-6 text-slate-900 max-[340px]:h-5 max-[340px]:w-5" />
			</button>
			<h1 class="text-xl font-bold tracking-tight text-slate-900 max-[340px]:text-sm">
				Wiederkehrende Ausgaben
			</h1>
		</div>
	</header>

	{#if recurringStore.loading}
		<div class="py-10 text-center text-sm text-slate-400">Lädt Abonnements...</div>
	{:else}
		<div class="flex flex-1 flex-col gap-3">
			{#if recurringStore.expenses.length === 0}
				<div class="px-4 py-16 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400"
					>
						<CalendarDays size={32} />
					</div>
					<h3 class="mb-1 font-semibold text-slate-800">Keine wiederkehrenden Ausgaben</h3>
					<p class="mx-auto mb-6 max-w-xs text-xs text-slate-500">
						Erfasse regelmäßige Zahlungen wie Miete, Internet, Spotify oder Versicherungen. Sie
						werden automatisch an Fälligkeitsterminen generiert.
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

						<Card
							class="relative flex flex-col gap-3 p-4 transition-all max-[340px]:gap-2 max-[340px]:p-2.5 {rule.active
								? 'border-slate-200'
								: 'border-dashed bg-slate-50 opacity-65'}"
						>
							<div class="flex items-center gap-3 max-[340px]:gap-2">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full max-[340px]:h-8 max-[340px]:w-8 {colorClasses}"
								>
									<svelte:component
										this={IconComponent}
										class="h-5 w-5 max-[340px]:h-4 max-[340px]:w-4"
									/>
								</div>

								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2 max-[340px]:gap-1">
										<h3 class="truncate text-sm font-bold text-slate-900 max-[340px]:text-xs">
											{rule.name}
										</h3>
										<span
											class="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 max-[340px]:px-1 max-[340px]:py-0 max-[340px]:text-[8px]"
										>
											{getFrequencyLabel(rule.frequency)}
										</span>
									</div>
									<p class="mt-0.5 text-xs text-slate-500 max-[340px]:text-[9px]">
										Bezahlt von: {rule.paid_by === authStore.currentUser?.id
											? 'Ich'
											: partnerStore.partnerUser?.username || 'Partner'} • Split: {rule.split_mode ===
										'50_50'
											? '50/50'
											: 'Kasse'}
									</p>
								</div>

								<div class="shrink-0 text-right">
									<span class="text-base font-bold text-slate-900 max-[340px]:text-xs">
										{formatCurrency(rule.amount)}
									</span>
									<p class="mt-0.5 text-[10px] text-slate-400 max-[340px]:text-[8px]">
										Tag {rule.day_of_month}. des Monats
									</p>
								</div>
							</div>

							<div class="h-px bg-slate-100"></div>

							<div class="flex items-center justify-between pt-1 text-xs">
								<span class="text-[10px] text-slate-400 max-[340px]:text-[8px]">
									{#if rule.last_generated}
										Zuletzt generiert: {new Date(rule.last_generated).toLocaleDateString('de-DE')}
									{:else}
										Fällig ab: {new Date(rule.start_date).toLocaleDateString('de-DE')}
									{/if}
								</span>

								<div class="flex items-center gap-2 max-[340px]:gap-1">
									<button
										onclick={() => toggleActive(rule)}
										class="flex items-center gap-1.5 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 active:scale-95 max-[340px]:gap-1 max-[340px]:p-1"
										title={rule.active ? 'Pausieren' : 'Aktivieren'}
									>
										{#if rule.active}
											<Pause class="h-3.5 w-3.5 text-amber-500 max-[340px]:h-3 max-[340px]:w-3" />
											<span class="text-[10px] font-semibold text-amber-500 max-[340px]:text-[8px]"
												>Pausieren</span
											>
										{:else}
											<Play class="h-3.5 w-3.5 text-emerald-500 max-[340px]:h-3 max-[340px]:w-3" />
											<span
												class="text-[10px] font-semibold text-emerald-500 max-[340px]:text-[8px]"
												>Aktivieren</span
											>
										{/if}
									</button>

									<button
										onclick={() => goto(`/recurring/edit/${rule.id}`)}
										class="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-95"
										title="Bearbeiten"
									>
										<Edit2 size={14} />
									</button>

									<button
										onclick={() => confirmDelete(rule.id)}
										class="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95"
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
			class="fixed bottom-6 left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform hover:bg-slate-800 active:scale-95"
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
