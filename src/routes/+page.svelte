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
		transactionStore.transactions.filter(tx => {
			const date = new Date(tx.date);
			const today = new Date();
			return date.getMonth() === today.getMonth() &&
				   date.getFullYear() === today.getFullYear() &&
				   tx.split_mode !== 'deposit';
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
			.filter(rule => {
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
			ShoppingBag: '🛒', Home: '🏠', Zap: '⚡', Sparkles: '✨', Car: '🚗', Gamepad2: '🎮',
			Tv: '📺', Utensils: '🍔', Heart: '❤️', Shield: '🛡️', Shirt: '👕', CircleEllipsis: '⚙️'
		};
		
		return recurringStore.expenses
			.filter(rule => rule.active)
			.map(rule => {
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
				const category = categoryStore.categories.find(c => c.id === rule.category);
				const emoji = category ? (iconMap[category.icon] || '📅') : '📅';
				
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

<div class="p-4 pt-8 h-full flex flex-col relative bg-slate-50">
	<header class="mb-6 px-1 flex justify-between items-center">
		<div class="flex items-center gap-2">
			<img src="/logo.svg" alt="FairShare Logo" class="w-8 h-8" />
			<h1 class="text-xl font-bold tracking-tight text-slate-900">FairShare</h1>
		</div>
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
	
	<div class="flex flex-col gap-4 overflow-y-auto pb-24">
		<HeroCard />

		{#if monthlyBudget > 0}
			<Card class="flex flex-col gap-3 p-4">
				<div class="flex justify-between items-center">
					<div class="flex items-center gap-2 text-slate-500">
						<Coins size={18} />
						<span class="text-xs font-semibold uppercase tracking-wider">Verfügbares Budget</span>
					</div>
					<span class="text-xs font-bold text-slate-400">
						Monatsziel: {formatCurrency(monthlyBudget)}
					</span>
				</div>
				
				<div class="flex justify-between items-baseline">
					<span class="text-2xl font-black tracking-tight {availableBudget >= 0 ? 'text-slate-900' : 'text-red-600'}">
						{formatCurrency(availableBudget)}
					</span>
					<span class="text-xs font-medium text-slate-500">
						Ø {formatCurrency(dailyBudget)} / Tag ({remainingDays} Tage)
					</span>
				</div>

				<!-- Progress Bar -->
				{@const percent = Math.min(100, Math.max(0, Math.round((totalThisMonthCents / monthlyBudget) * 100)))}
				<div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
					<div 
						class="h-full rounded-full transition-all duration-300 {percent >= 90 ? 'bg-red-500' : percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'}"
						style="width: {percent}%"
					></div>
				</div>
				<div class="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
					<span>Verbraucht: {percent}%</span>
					<span>Puffer inkl. Fixkosten</span>
				</div>
			</Card>
		{/if}

		{#if partnerStore.partnerStatus === 'none'}
			<div class="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
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
			<div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
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
			<div class="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
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

		<!-- Upcoming Bills Section -->
		{#if upcomingBills.length > 0}
			<Card class="flex flex-col gap-3 p-4">
				<div class="flex items-center gap-2 text-slate-500 pb-1 border-b border-slate-100">
					<CalendarDays size={18} />
					<span class="text-xs font-semibold uppercase tracking-wider">Demnächst fällig</span>
				</div>
				
				<div class="flex flex-col gap-2.5">
					{#each upcomingBills as item}
						<div class="flex justify-between items-center text-sm">
							<div class="flex items-center gap-2.5 min-w-0">
								<span class="text-base shrink-0">{item.emoji}</span>
								<div class="flex flex-col min-w-0">
									<span class="font-bold text-slate-800 truncate">{item.rule.name}</span>
									<span class="text-[10px] text-slate-400 font-semibold">
										Fällig am {item.dueDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
									</span>
								</div>
							</div>
							<span class="font-bold text-slate-900 shrink-0">
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
		class="fixed bottom-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 transition-transform active:scale-95 z-50"
		aria-label="Neue Ausgabe hinzufügen"
	>
		<Plus size={24} />
	</a>
</div>
