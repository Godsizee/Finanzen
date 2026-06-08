<script lang="ts">
	import { onMount } from 'svelte';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { categoryStore } from '$lib/features/categories/categoryStore.svelte';
	import { recurringStore } from '$lib/features/recurring/store.svelte';
	import HeroCard from '$lib/features/transactions/components/HeroCard.svelte';
	import FairShareAlert from '$lib/features/transactions/components/FairShareAlert.svelte';
	import MonthlyStats from '$lib/features/transactions/components/MonthlyStats.svelte';
	import TransactionList from '$lib/features/transactions/components/TransactionList.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { Plus, User, Users, ArrowRight, CalendarDays, Coins } from '@lucide/svelte';
	import { formatCurrency } from '$lib/core/math';
	import Card from '$lib/ui/Card.svelte';

	let monthlyBudget = $state(0);

	onMount(() => {
		transactionStore.load();
		categoryStore.load();
		recurringStore.load();
		partnerStore.loadPartnerStatus();

		const storedBudget = localStorage.getItem('fairshare_monthly_budget');
		if (storedBudget) {
			monthlyBudget = parseInt(storedBudget);
		}
	});

	// Budget Calculation
	let thisMonthExpenses = $derived(
		transactionStore.transactions.filter((tx) => {
			const date = new Date(tx.date);
			const today = new Date();
			return (
				date.getMonth() === today.getMonth() &&
				date.getFullYear() === today.getFullYear() &&
				tx.split_mode !== 'deposit'
			);
		})
	);

	let totalThisMonthCents = $derived(
		thisMonthExpenses.reduce((acc, tx) => acc + tx.total_amount, 0)
	);

	let pendingFixkostenCents = $derived.by(() => {
		const today = new Date();
		const currentMonth = today.getMonth();
		const currentYear = today.getFullYear();

		return recurringStore.expenses
			.filter((rule) => {
				if (!rule.active) return false;
				if (!rule.last_generated) return true;
				const lastGen = new Date(rule.last_generated);
				return lastGen.getMonth() !== currentMonth || lastGen.getFullYear() !== currentYear;
			})
			.reduce((acc, rule) => acc + rule.amount, 0);
	});

	let availableBudget = $derived(monthlyBudget - totalThisMonthCents - pendingFixkostenCents);

	let remainingDays = $derived.by(() => {
		const today = new Date();
		const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
		const currentDay = today.getDate();
		return Math.max(1, lastDayOfMonth - currentDay + 1);
	});

	let dailyBudget = $derived(remainingDays > 0 ? Math.round(availableBudget / remainingDays) : 0);

	// Upcoming Bills Calculation
	let upcomingBills = $derived.by(() => {
		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonthIndex = today.getMonth();
		const currentDate = today.getDate();

		const iconMap: Record<string, any> = {
			ShoppingBag: '🛒',
			Home: '🏠',
			Zap: '⚡',
			Sparkles: '✨',
			Car: '🚗',
			Gamepad2: '🎮',
			Tv: '📺',
			Utensils: '🍔',
			Heart: '❤️',
			Shield: '🛡️',
			Shirt: '👕',
			CircleEllipsis: '⚙️'
		};

		return recurringStore.expenses
			.filter((rule) => rule.active)
			.map((rule) => {
				let dueDay = rule.day_of_month;
				let dueMonth = currentMonthIndex;
				let dueYear = currentYear;

				if (dueDay <= currentDate) {
					dueMonth += 1;
					if (dueMonth > 11) {
						dueMonth = 0;
						dueYear += 1;
					}
				}

				const dueDate = new Date(dueYear, dueMonth, dueDay, 12, 0, 0, 0);
				const category = categoryStore.categories.find((c) => c.id === rule.category);
				const emoji = category ? iconMap[category.icon] || '📅' : '📅';

				return {
					rule,
					dueDate,
					emoji
				};
			})
			.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
			.slice(0, 3);
	});
</script>

<div class="relative flex h-full flex-col bg-slate-50 p-4 pt-8 max-[340px]:p-2 max-[340px]:pt-6">
	<header class="mb-6 flex items-center justify-between px-1">
		<div class="flex items-center gap-2 max-[340px]:gap-1">
			<img src="/logo.svg" alt="FairShare Logo" class="h-8 w-8 max-[340px]:h-7 max-[340px]:w-7" />
			<h1 class="text-xl font-bold tracking-tight text-slate-900 max-[340px]:text-lg">FairShare</h1>
		</div>
		<div class="flex items-center gap-4 max-[340px]:gap-2">
			<a
				href="/recurring"
				class="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 max-[340px]:hidden"
			>
				Fixkosten
			</a>
			<a
				href="/history"
				class="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 max-[340px]:hidden"
			>
				Historie
			</a>
			<a
				href="/profile"
				class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
			>
				<User size={18} />
			</a>
		</div>
	</header>

	<div class="flex flex-col gap-4 overflow-y-auto pb-24">
		<HeroCard />

		{#if monthlyBudget > 0}
			<Card class="flex flex-col gap-3 p-4 max-[340px]:p-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-slate-500">
						<Coins class="h-[18px] w-[18px] max-[340px]:h-3.5 max-[340px]:w-3.5" />
						<span class="text-xs font-semibold tracking-wider uppercase max-[340px]:text-[10px]"
							>Verfügbares Budget</span
						>
					</div>
					<span class="text-xs font-bold text-slate-400 max-[340px]:text-[9px]">
						Monatsziel: {formatCurrency(monthlyBudget)}
					</span>
				</div>

				<div class="flex items-baseline justify-between">
					<span
						class="text-2xl font-black tracking-tight {availableBudget >= 0
							? 'text-slate-900'
							: 'text-red-600'} max-[340px]:text-lg"
					>
						{formatCurrency(availableBudget)}
					</span>
					<span class="text-xs font-medium text-slate-500 max-[340px]:text-[10px]">
						Ø {formatCurrency(dailyBudget)} / Tag
					</span>
				</div>

				<!-- Progress Bar -->
				{@const percent = Math.min(
					100,
					Math.max(0, Math.round((totalThisMonthCents / monthlyBudget) * 100))
				)}
				<div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
					<div
						class="h-full rounded-full transition-all duration-300 {percent >= 90
							? 'bg-red-500'
							: percent >= 75
								? 'bg-amber-500'
								: 'bg-emerald-500'}"
						style="width: {percent}%"
					></div>
				</div>
				<div
					class="flex justify-between text-[10px] font-bold text-slate-400 uppercase max-[340px]:text-[8px]"
				>
					<span>Verbraucht: {percent}%</span>
					<span>Puffer inkl. Fixkosten</span>
				</div>
			</Card>
		{/if}

		{#if partnerStore.partnerStatus === 'none'}
			<div
				class="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-xs"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
					>
						<Users size={18} />
					</div>
					<div class="min-w-0 flex-1">
						<h4 class="text-sm font-semibold text-amber-900">Partner einladen</h4>
						<p class="mt-0.5 text-xs text-amber-700">
							Verknüpfe dich, um Kosten gemeinsam aufzuteilen.
						</p>
					</div>
				</div>
				<a
					href="/profile"
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-white transition-transform active:scale-95"
					aria-label="Partner einladen"
				>
					<ArrowRight size={16} />
				</a>
			</div>
		{:else if partnerStore.partnerStatus === 'pending_sent'}
			<div
				class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex h-9 w-9 shrink-0 animate-pulse items-center justify-center rounded-full bg-slate-100 text-slate-500"
					>
						<Users size={18} />
					</div>
					<div class="min-w-0 flex-1">
						<h4 class="text-sm font-semibold text-slate-800">Einladung ausstehend</h4>
						<p class="mt-0.5 text-xs text-slate-500">Warte auf die Bestätigung deines Partners.</p>
					</div>
				</div>
				<a
					href="/profile"
					class="text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
					aria-label="Status ansehen"
				>
					Details
				</a>
			</div>
		{:else if partnerStore.partnerStatus === 'pending_received'}
			<div
				class="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-xs"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"
					>
						<Users size={18} />
					</div>
					<div class="min-w-0 flex-1">
						<h4 class="text-sm font-semibold text-blue-900">Einladung erhalten</h4>
						<p class="mt-0.5 text-xs text-blue-700">Ein Partner möchte sich mit dir verknüpfen.</p>
					</div>
				</div>
				<a
					href="/profile"
					class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-transform active:scale-95"
					aria-label="Einladung ansehen"
				>
					Antworten
				</a>
			</div>
		{/if}

		<FairShareAlert />

		<!-- Upcoming Bills Section -->
		{#if upcomingBills.length > 0}
			<Card class="flex flex-col gap-3 p-4">
				<div class="flex items-center gap-2 border-b border-slate-100 pb-1 text-slate-500">
					<CalendarDays size={18} />
					<span class="text-xs font-semibold tracking-wider uppercase">Demnächst fällig</span>
				</div>

				<div class="flex flex-col gap-2.5">
					{#each upcomingBills as item}
						<div class="flex items-center justify-between text-sm">
							<div class="flex min-w-0 items-center gap-2.5">
								<span class="shrink-0 text-base">{item.emoji}</span>
								<div class="flex min-w-0 flex-col">
									<span class="truncate font-bold text-slate-800">{item.rule.name}</span>
									<span class="text-[10px] font-semibold text-slate-400">
										Fällig am {item.dueDate.toLocaleDateString('de-DE', {
											day: '2-digit',
											month: '2-digit'
										})}
									</span>
								</div>
							</div>
							<span class="shrink-0 font-bold text-slate-900">
								{formatCurrency(item.rule.amount)}
							</span>
						</div>
					{/each}
				</div>
			</Card>
		{/if}

		<MonthlyStats />

		<TransactionList />
	</div>

	<!-- Floating Action Button -->
	<a
		href="/add"
		class="fixed bottom-6 left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-transform hover:bg-slate-800 active:scale-95"
		aria-label="Neue Ausgabe hinzufügen"
	>
		<Plus size={24} />
	</a>
</div>
