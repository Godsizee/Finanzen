<script lang="ts">
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { authApi } from '$lib/features/auth/api';
	import { User, UserPlus, Users, LogOut, Search, XCircle, CheckCircle, Coins } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from '$lib/core/toastStore.svelte';

	let searchEmail = $state('');
	let searchResult = $state<any>(null);
	let searching = $state(false);

	let incomeInput = $state('');
	let savingIncome = $state(false);

	$effect(() => {
		if (authStore.currentUser) {
			incomeInput = authStore.currentUser.income ? (authStore.currentUser.income / 100).toString() : '';
		}
	});

	onMount(() => {
		partnerStore.loadPartnerStatus();
	});

	function handleLogout() {
		authStore.logout();
		goto('/login');
	}

	async function handleSearch(e: Event) {
		e.preventDefault();
		searching = true;
		searchResult = await partnerStore.searchByEmail(searchEmail);
		if (!searchResult) {
			toast.info('Kein Nutzer mit dieser E-Mail gefunden.');
		}
		searching = false;
	}

	async function saveIncome(e: Event) {
		e.preventDefault();
		savingIncome = true;
		try {
			const parsed = parseFloat(incomeInput.replace(',', '.'));
			if (isNaN(parsed) || parsed < 0) {
				toast.error('Bitte ein gültiges Einkommen eingeben.');
				return;
			}
			const cents = Math.round(parsed * 100);
			const updated = await authApi.updateProfile({ income: cents });
			authStore.currentUser = updated;
			toast.success('Nettoeinkommen gespeichert!');
		} catch (err: any) {
			toast.error('Fehler beim Speichern: ' + err.message);
		} finally {
			savingIncome = false;
		}
	}
</script>

<div class="p-4 space-y-6">
	<!-- Profil Info -->
	<div class="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
		<div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
			<User class="w-8 h-8 text-slate-500" />
		</div>
		<div class="flex-1">
			<h2 class="text-xl font-bold text-slate-900">{authStore.currentUser?.name || 'Mein Profil'}</h2>
			<p class="text-sm text-slate-500">{authStore.currentUser?.email}</p>
		</div>
		<button
			onclick={handleLogout}
			class="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-full transition-colors"
			title="Abmelden"
		>
			<LogOut class="w-6 h-6" />
		</button>
	</div>

	<!-- Nettoeinkommen Bereich -->
	<div class="bg-white rounded-2xl shadow-sm p-6 space-y-4">
		<h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
			<Coins class="w-5 h-5 text-slate-500" />
			Nettoeinkommen
		</h3>
		<p class="text-sm text-slate-500">
			Trage dein monatliches Nettoeinkommen ein, um das faire Kostenverhältnis mit deinem Partner zu berechnen.
		</p>
		<form onsubmit={saveIncome} class="flex gap-2">
			<div class="relative flex-1">
				<span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">€</span>
				<input
					type="text"
					inputmode="decimal"
					bind:value={incomeInput}
					placeholder="z. B. 2500"
					required
					class="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
				/>
			</div>
			<button
				type="submit"
				disabled={savingIncome}
				class="px-6 bg-slate-900 text-white rounded-xl font-medium active:scale-95 transition-transform disabled:opacity-50 min-h-[48px]"
			>
				{savingIncome ? '...' : 'Speichern'}
			</button>
		</form>

		{#if partnerStore.partnerStatus === 'active' && partnerStore.partnerUser}
			<div class="mt-4 pt-4 border-t border-slate-100 space-y-2">
				<div class="flex justify-between text-sm">
					<span class="text-slate-500">Einkommen Partner ({partnerStore.partnerUser.name}):</span>
					<span class="font-semibold text-slate-800">
						{partnerStore.partnerUser.income ? (partnerStore.partnerUser.income / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : 'Nicht eingetragen'}
					</span>
				</div>
				
				{#if (authStore.currentUser?.income || 0) > 0 && (partnerStore.partnerUser.income || 0) > 0}
					{@const total = (authStore.currentUser?.income || 0) + (partnerStore.partnerUser.income || 0)}
					{@const myPercent = Math.round(((authStore.currentUser?.income || 0) / total) * 100)}
					{@const partnerPercent = 100 - myPercent}
					<div class="flex flex-col gap-1.5 pt-2">
						<span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Faires Split-Verhältnis</span>
						<div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
							<div class="bg-slate-900 h-full transition-all" style="width: {myPercent}%" title="Du: {myPercent}%"></div>
							<div class="bg-slate-400 h-full transition-all" style="width: {partnerPercent}%" title="Partner: {partnerPercent}%"></div>
						</div>
						<div class="flex justify-between text-xs text-slate-500 font-medium">
							<span>Du: {myPercent}%</span>
							<span>{partnerStore.partnerUser.name}: {partnerPercent}%</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Partner Bereich -->
	<div class="bg-white rounded-2xl shadow-sm p-6 space-y-6">
		<h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
			<Users class="w-5 h-5" />
			Partnerschaft
		</h3>

		{#if partnerStore.partnerStatus === 'active'}
			<div class="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-4">
				<div class="flex items-center gap-3">
					<CheckCircle class="w-6 h-6 text-emerald-600" />
					<div>
						<p class="text-sm font-medium text-emerald-900">Verpartnert mit</p>
						<p class="font-bold text-emerald-700">{partnerStore.partnerUser?.name} ({partnerStore.partnerUser?.email})</p>
					</div>
				</div>
				<button
					onclick={() => partnerStore.cancelPartnership()}
					class="w-full py-2 px-4 bg-white border border-red-200 text-red-600 rounded-lg font-medium active:scale-95 transition-transform"
				>
					Verpartnerung aufheben
				</button>
			</div>
		{:else if partnerStore.partnerStatus === 'pending_received'}
			<div class="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
				<div class="flex items-center gap-3">
					<UserPlus class="w-6 h-6 text-blue-600" />
					<div>
						<p class="font-bold text-blue-900">{partnerStore.partnerUser?.name}</p>
						<p class="text-sm text-blue-800">hat dich als Partner hinzugefügt. Stimmt das?</p>
					</div>
				</div>
				<div class="flex gap-3">
					<button
						onclick={() => partnerStore.acceptInvite()}
						class="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium active:scale-95 transition-transform"
					>
						Ja, bestätigen
					</button>
					<button
						onclick={() => partnerStore.rejectInvite()}
						class="flex-1 py-2 px-4 bg-white border border-blue-200 text-blue-600 rounded-lg font-medium active:scale-95 transition-transform"
					>
						Nein
					</button>
				</div>
			</div>
		{:else if partnerStore.partnerStatus === 'pending_sent'}
			<div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
				<div class="flex items-center gap-3">
					<div class="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin"></div>
					<div>
						<p class="font-bold text-slate-900">Einladung gesendet an</p>
						<p class="text-sm text-slate-500">{partnerStore.partnerUser?.email}</p>
					</div>
				</div>
				<p class="text-xs text-slate-400">Warte auf Bestätigung des Partners...</p>
				<button
					onclick={() => partnerStore.cancelPartnership()}
					class="w-full py-2 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium active:scale-95 transition-transform"
				>
					Einladung zurückziehen
				</button>
			</div>
		{:else}
			<div class="space-y-4">
				<p class="text-sm text-slate-500">
					Du kannst die App gemeinsam mit deinem Partner nutzen. Such nach seiner E-Mail-Adresse, um eine Einladung zu senden.
				</p>

				<form onsubmit={handleSearch} class="flex gap-2">
					<div class="relative flex-1">
						<Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
						<input
							type="email"
							bind:value={searchEmail}
							placeholder="E-Mail suchen..."
							required
							class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
						/>
					</div>
					<button
						type="submit"
						disabled={searching}
						class="px-4 bg-slate-900 text-white rounded-xl font-medium active:scale-95 transition-transform disabled:opacity-50"
					>
						Suchen
					</button>
				</form>

				{#if searchResult}
					<div class="p-4 bg-slate-50 rounded-xl flex items-center justify-between mt-4 border border-slate-200">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
								<User class="w-5 h-5 text-slate-500" />
							</div>
							<div>
								<p class="font-medium text-slate-900">{searchResult.name || 'Ohne Name'}</p>
								<p class="text-xs text-slate-500">{searchResult.email}</p>
							</div>
						</div>
						<button
							onclick={() => partnerStore.sendInvite(searchResult.id)}
							class="p-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium active:scale-95 transition-transform hover:bg-emerald-200"
							title="Einladen"
						>
							<UserPlus class="w-5 h-5" />
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
