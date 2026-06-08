<script lang="ts">
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { authApi } from '$lib/features/auth/api';
	import {
		User,
		UserPlus,
		Users,
		LogOut,
		Search,
		XCircle,
		CheckCircle,
		Coins,
		KeyRound,
		Mail,
		AlertTriangle,
		ShieldCheck
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from '$lib/core/toastStore.svelte';
	import { pb } from '$lib/core/pb';
	import { isValidEmail, isValidPassword } from '$lib/core/validation';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { Download } from '@lucide/svelte';

	let searchEmail = $state('');
	let searchResult = $state<any>(null);
	let searching = $state(false);

	let incomeInput = $state('');
	let savingIncome = $state(false);
	let budgetInput = $state('');
	let savingBudget = $state(false);

	let costSharingMode = $state<'50_50' | 'income_ratio'>('50_50');
	let costSharingPercent = $state(50);
	let savingCostSharing = $state(false);

	let oldPassword = $state('');
	let newPassword = $state('');
	let newPasswordConfirm = $state('');
	let changingPassword = $state(false);

	let newEmail = $state('');
	let changingEmail = $state(false);

	async function handlePasswordChange(e: Event) {
		e.preventDefault();
		if (!authStore.currentUser) return;

		const pwValidation = isValidPassword(newPassword);
		if (!pwValidation.valid) {
			toast.error(pwValidation.message || 'Passwort-Validierung fehlgeschlagen.');
			return;
		}

		if (newPassword !== newPasswordConfirm) {
			toast.error('Passwörter stimmen nicht überein.');
			return;
		}

		changingPassword = true;
		try {
			await pb.collection('users').update(authStore.currentUser.id, {
				oldPassword,
				password: newPassword,
				passwordConfirm: newPasswordConfirm
			});
			toast.success('Passwort erfolgreich geändert!');
			oldPassword = '';
			newPassword = '';
			newPasswordConfirm = '';
		} catch (err: any) {
			toast.error('Fehler: ' + (err.message || err));
		} finally {
			changingPassword = false;
		}
	}

	async function handleEmailChange(e: Event) {
		e.preventDefault();
		if (!isValidEmail(newEmail)) {
			toast.error('Bitte eine gültige E-Mail-Adresse eingeben.');
			return;
		}

		changingEmail = true;
		try {
			await pb.collection('users').requestEmailChange(newEmail);
			toast.success('Eine Bestätigungs-E-Mail wurde an die neue Adresse gesendet!');
			newEmail = '';
		} catch (err: any) {
			toast.error('Fehler: ' + (err.message || err));
		} finally {
			changingEmail = false;
		}
	}

	async function handleAccountDelete() {
		if (!authStore.currentUser) return;
		const conf = confirm(
			'Möchtest du deinen Account wirklich unwiderruflich löschen? Alle deine Daten werden gelöscht. Dies kann nicht rückgängig gemacht werden!'
		);
		if (!conf) return;

		try {
			await pb.collection('users').delete(authStore.currentUser.id);
			toast.success('Account gelöscht.');
			authStore.logout();
			goto('/login');
		} catch (err: any) {
			toast.error('Fehler: ' + (err.message || err));
		}
	}

	function handleExportCSV() {
		const txs = transactionStore.transactions;
		if (txs.length === 0) {
			toast.info('Keine Transaktionen vorhanden.');
			return;
		}

		const headers = ['Datum', 'Notiz', 'Kategorie', 'Betrag (EUR)', 'Bezahlt von', 'Split', 'Status'];
		const rows = [headers.join(',')];

		for (const tx of txs) {
			const row = [
				new Date(tx.date).toLocaleDateString('de-DE'),
				`"${(tx.note || '').replace(/"/g, '""')}"`,
				tx.expand?.category?.name || '',
				(tx.total_amount / 100).toFixed(2).replace('.', ','),
				tx.paid_by === authStore.currentUser?.id ? 'Ich' : 'Partner',
				tx.split_mode,
				tx.settlement_id ? 'Abgerechnet' : 'Offen'
			];
			rows.push(row.join(','));
		}

		const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `fairshare_export_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}

	$effect(() => {
		if (authStore.currentUser) {
			incomeInput = authStore.currentUser.income
				? (authStore.currentUser.income / 100).toString()
				: '';
			const serverMode = authStore.currentUser.cost_sharing_mode;
			costSharingMode = serverMode === 'income_ratio' ? 'income_ratio' : '50_50';
			costSharingPercent = authStore.currentUser.cost_sharing_percent || 50;
		}
		const storedBudget = localStorage.getItem('fairshare_monthly_budget');
		if (storedBudget) {
			budgetInput = (parseInt(storedBudget) / 100).toString().replace('.', ',');
		}
	});

	onMount(() => {
		partnerStore.loadPartnerStatus();

		// Check for invite query param
		const inviteEmail = new URLSearchParams(window.location.search).get('invite');
		if (inviteEmail && !partnerStore.partnerUser) {
			searchEmail = decodeURIComponent(inviteEmail);
			partnerStore.searchByEmail(searchEmail).then((res) => {
				if (res) {
					searchResult = res;
					const confirmInvite = confirm(
						`Möchtest du ${res.name} (${res.email}) als Partner einladen?`
					);
					if (confirmInvite) {
						partnerStore.sendInvite(res.id);
					}
				}
			});
		}
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

	async function saveCostSharing(e: Event) {
		e.preventDefault();
		savingCostSharing = true;
		try {
			const updated = await authApi.updateProfile({
				cost_sharing_mode: costSharingMode
			});
			authStore.currentUser = updated;

			if (partnerStore.partnerStatus === 'active' && partnerStore.partnerUser) {
				await pb.collection('users').update(partnerStore.partnerUser.id, {
					cost_sharing_mode: costSharingMode
				});
				partnerStore.partnerUser.cost_sharing_mode = costSharingMode;
			}
			toast.success('Kostenaufteilung gespeichert!');
		} catch (err: any) {
			toast.error('Fehler beim Speichern: ' + err.message);
		} finally {
			savingCostSharing = false;
		}
	}

	async function saveBudget(e: Event) {
		e.preventDefault();
		savingBudget = true;
		try {
			const parsed = parseFloat(budgetInput.replace(',', '.'));
			if (isNaN(parsed) || parsed < 0) {
				toast.error('Bitte ein gültiges Budget eingeben.');
				return;
			}
			const cents = Math.round(parsed * 100);
			localStorage.setItem('fairshare_monthly_budget', cents.toString());
			toast.success('Haushaltsbudget gespeichert!');
		} catch (err: any) {
			toast.error('Fehler beim Speichern: ' + err.message);
		} finally {
			savingBudget = false;
		}
	}

	function copyInviteLink() {
		if (!authStore.currentUser?.email) return;
		const link =
			window.location.origin + '/profile?invite=' + encodeURIComponent(authStore.currentUser.email);
		navigator.clipboard
			.writeText(link)
			.then(() => {
				toast.success('Einladungslink kopiert!');
			})
			.catch(() => {
				toast.error('Fehler beim Kopieren des Links.');
			});
	}
</script>

<div class="space-y-6 p-4">
	<!-- Profil Info -->
	<div class="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
		<div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
			<User class="h-8 w-8 text-slate-500" />
		</div>
		<div class="flex-1">
			<h2 class="text-xl font-bold text-slate-900">
				{authStore.currentUser?.name || 'Mein Profil'}
			</h2>
			<p class="text-sm text-slate-500">{authStore.currentUser?.email}</p>
		</div>
		<button
			onclick={handleLogout}
			class="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
			title="Abmelden"
		>
			<LogOut class="h-6 w-6" />
		</button>
	</div>

	<!-- Nettoeinkommen Bereich -->
	<div class="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
		<h3 class="flex items-center gap-2 text-lg font-bold text-slate-900">
			<Coins class="h-5 w-5 text-slate-500" />
			Nettoeinkommen
		</h3>
		<p class="text-sm text-slate-500">
			Trage dein monatliches Nettoeinkommen ein, um das faire Kostenverhältnis mit deinem Partner zu
			berechnen.
		</p>
		<form onsubmit={saveIncome} class="flex gap-2">
			<div class="relative flex-1">
				<span class="absolute top-1/2 right-4 -translate-y-1/2 font-medium text-slate-400">€</span>
				<input
					type="text"
					inputmode="decimal"
					bind:value={incomeInput}
					placeholder="z. B. 2500"
					required
					class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-4 font-medium transition-all focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
			</div>
			<button
				type="submit"
				disabled={savingIncome}
				class="min-h-[48px] rounded-xl bg-slate-900 px-6 font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
			>
				{savingIncome ? '...' : 'Speichern'}
			</button>
		</form>

		{#if partnerStore.partnerStatus === 'active' && partnerStore.partnerUser}
			<div class="mt-4 space-y-2 border-t border-slate-100 pt-4">
				<div class="flex justify-between text-sm">
					<span class="text-slate-500">Einkommen Partner ({partnerStore.partnerUser.name}):</span>
					<span class="font-semibold text-slate-800">
						{partnerStore.partnerUser.income
							? (partnerStore.partnerUser.income / 100).toLocaleString('de-DE', {
									style: 'currency',
									currency: 'EUR'
								})
							: 'Nicht eingetragen'}
					</span>
				</div>

				{#if (authStore.currentUser?.income || 0) > 0 && (partnerStore.partnerUser.income || 0) > 0}
					{@const total =
						(authStore.currentUser?.income || 0) + (partnerStore.partnerUser.income || 0)}
					{@const myPercent = Math.round(((authStore.currentUser?.income || 0) / total) * 100)}
					{@const partnerPercent = 100 - myPercent}
					<div class="flex flex-col gap-1.5 pt-2">
						<span class="text-xs font-semibold tracking-wider text-slate-400 uppercase"
							>Faires Split-Verhältnis</span
						>
						<div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
							<div
								class="h-full bg-slate-900 transition-all"
								style="width: {myPercent}%"
								title="Du: {myPercent}%"
							></div>
							<div
								class="h-full bg-slate-400 transition-all"
								style="width: {partnerPercent}%"
								title="Partner: {partnerPercent}%"
							></div>
						</div>
						<div class="flex justify-between text-xs font-medium text-slate-500">
							<span>Du: {myPercent}%</span>
							<span>{partnerStore.partnerUser.name}: {partnerPercent}%</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Standard-Split Bereich -->
	<div class="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
		<h3 class="flex items-center gap-2 text-lg font-bold text-slate-900">
			<Users class="h-5 w-5 text-slate-500" />
			Standard-Split
		</h3>
		<p class="text-sm text-slate-500">
			Lege fest, wie gemeinsame Ausgaben standardmäßig gesplittet werden sollen.
		</p>
		<form onsubmit={saveCostSharing} class="space-y-6">
			<div class="flex rounded-xl bg-slate-100 p-1">
				<button
					type="button"
					onclick={() => (costSharingMode = '50_50')}
					class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors {costSharingMode ===
					'50_50'
						? 'bg-white text-slate-900 shadow-sm'
						: 'text-slate-500 hover:text-slate-700'}"
				>
					50/50 Split
				</button>
				<button
					type="button"
					onclick={() => (costSharingMode = 'income_ratio')}
					class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors {costSharingMode ===
					'income_ratio'
						? 'bg-white text-slate-900 shadow-sm'
						: 'text-slate-500 hover:text-slate-700'}"
				>
					Einkommensbasierter Split
				</button>
			</div>

			{#if costSharingMode === 'income_ratio'}
				{@const myInc = authStore.currentUser?.income || 0}
				{@const partnerInc = (partnerStore.partnerStatus === 'active' && partnerStore.partnerUser?.income) || 0}
				{#if myInc > 0 && partnerInc > 0}
					{@const total = myInc + partnerInc}
					{@const myPercent = Math.round((myInc / total) * 100)}
					{@const partnerPercent = 100 - myPercent}
					<div class="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
						<div class="flex items-center justify-between text-sm font-medium">
							<span class="text-slate-900">Du zahlst: {myPercent}%</span>
							<span class="text-slate-500"
								>{partnerStore.partnerUser?.name || 'Partner'}: {partnerPercent}%</span
							>
						</div>
						<div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-200">
							<div
								class="h-full bg-slate-900 transition-all"
								style="width: {myPercent}%"
							></div>
							<div
								class="h-full bg-slate-400 transition-all"
								style="width: {partnerPercent}%"
							></div>
						</div>
						<p class="text-center text-xs text-slate-500">
							Das Verhältnis wird automatisch anhand eurer Nettoeinkommen berechnet.
						</p>
					</div>
				{:else}
					<div class="rounded-xl border border-amber-100 bg-amber-50 p-4">
						<p class="text-center text-sm text-amber-800">
							Bitte tragt beide euer Nettoeinkommen ein, um das einkommensbasierte Verhältnis zu berechnen.
						</p>
					</div>
				{/if}
			{:else}
				<div class="rounded-xl border border-slate-100 bg-slate-50 p-4">
					<p class="text-center text-sm text-slate-600">
						Kosten werden 50/50 aufgeteilt. Schulden und Guthaben werden weiterhin ganz normal im
						Dashboard berechnet.
					</p>
				</div>
			{/if}

			<button
				type="submit"
				disabled={savingCostSharing}
				class="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
			>
				{savingCostSharing ? 'Speichere...' : 'Aufteilung speichern'}
			</button>
		</form>
	</div>

	<!-- Haushaltsbudget Bereich -->
	<div class="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
		<h3 class="flex items-center gap-2 text-lg font-bold text-slate-900">
			<Coins class="h-5 w-5 text-slate-500" />
			Gemeinsames Monatsbudget
		</h3>
		<p class="text-sm text-slate-500">
			Lege ein monatliches Budget für euren gemeinsamen Haushalt fest, um das noch verfügbare Geld
			auf dem Dashboard anzuzeigen.
		</p>
		<form onsubmit={saveBudget} class="flex gap-2">
			<div class="relative flex-1">
				<span class="absolute top-1/2 right-4 -translate-y-1/2 font-medium text-slate-400">€</span>
				<input
					type="text"
					inputmode="decimal"
					bind:value={budgetInput}
					placeholder="z. B. 1000"
					required
					class="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-4 font-medium transition-all focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
			</div>
			<button
				type="submit"
				disabled={savingBudget}
				class="min-h-[48px] rounded-xl bg-slate-900 px-6 font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
			>
				{savingBudget ? '...' : 'Speichern'}
			</button>
		</form>
	</div>

	<!-- Partner Bereich -->
	<div class="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
		<h3 class="flex items-center gap-2 text-lg font-bold text-slate-900">
			<Users class="h-5 w-5" />
			Partnerschaft
		</h3>

		{#if partnerStore.partnerStatus === 'active'}
			<div class="space-y-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
				<div class="flex items-center gap-3">
					<CheckCircle class="h-6 w-6 text-emerald-600" />
					<div>
						<p class="text-sm font-medium text-emerald-900">Verpartnert mit</p>
						<p class="font-bold text-emerald-700">
							{partnerStore.partnerUser?.name} ({partnerStore.partnerUser?.email})
						</p>
					</div>
				</div>
				<button
					onclick={() => partnerStore.cancelPartnership()}
					class="w-full rounded-lg border border-red-200 bg-white px-4 py-2 font-medium text-red-600 transition-transform active:scale-95"
				>
					Verpartnerung aufheben
				</button>
			</div>
		{:else if partnerStore.partnerStatus === 'pending_received'}
			<div class="space-y-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
				<div class="flex items-center gap-3">
					<UserPlus class="h-6 w-6 text-blue-600" />
					<div>
						<p class="font-bold text-blue-900">{partnerStore.partnerUser?.name}</p>
						<p class="text-sm text-blue-800">hat dich als Partner hinzugefügt. Stimmt das?</p>
					</div>
				</div>
				<div class="flex gap-3">
					<button
						onclick={() => partnerStore.acceptInvite()}
						class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-transform active:scale-95"
					>
						Ja, bestätigen
					</button>
					<button
						onclick={() => partnerStore.rejectInvite()}
						class="flex-1 rounded-lg border border-blue-200 bg-white px-4 py-2 font-medium text-blue-600 transition-transform active:scale-95"
					>
						Nein
					</button>
				</div>
			</div>
		{:else if partnerStore.partnerStatus === 'pending_sent'}
			<div class="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
				<div class="flex items-center gap-3">
					<div
						class="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
					></div>
					<div>
						<p class="font-bold text-slate-900">Einladung gesendet an</p>
						<p class="text-sm text-slate-500">{partnerStore.partnerUser?.email}</p>
					</div>
				</div>
				<p class="text-xs text-slate-400">Warte auf Bestätigung des Partners...</p>
				<button
					onclick={() => partnerStore.cancelPartnership()}
					class="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 transition-transform active:scale-95"
				>
					Einladung zurückziehen
				</button>
			</div>
		{:else}
			<div class="space-y-4">
				<p class="text-sm text-slate-500">
					Du kannst die App gemeinsam mit deinem Partner nutzen. Such nach seiner E-Mail-Adresse
					oder teile einen Einladungslink.
				</p>

				<button
					type="button"
					onclick={copyInviteLink}
					class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-800 transition-transform hover:bg-slate-200 active:scale-95"
				>
					<UserPlus size={16} /> Einladungslink kopieren
				</button>

				<div class="my-2 flex items-center">
					<div class="h-px flex-1 bg-slate-200"></div>
					<span class="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase"
						>Oder</span
					>
					<div class="h-px flex-1 bg-slate-200"></div>
				</div>

				<form onsubmit={handleSearch} class="flex gap-2">
					<div class="relative flex-1">
						<Search class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400" />
						<input
							type="email"
							bind:value={searchEmail}
							placeholder="E-Mail suchen..."
							required
							class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-4 pl-10 focus:ring-2 focus:ring-slate-900 focus:outline-none"
						/>
					</div>
					<button
						type="submit"
						disabled={searching}
						class="rounded-xl bg-slate-900 px-4 font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
					>
						Suchen
					</button>
				</form>

				{#if searchResult}
					<div
						class="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
					>
						<div class="flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
								<User class="h-5 w-5 text-slate-500" />
							</div>
							<div>
								<p class="font-medium text-slate-900">{searchResult.name || 'Ohne Name'}</p>
								<p class="text-xs text-slate-500">{searchResult.email}</p>
							</div>
						</div>
						<button
							onclick={() => partnerStore.sendInvite(searchResult.id)}
							class="rounded-lg bg-emerald-100 p-2 font-medium text-emerald-700 transition-transform hover:bg-emerald-200 active:scale-95"
							title="Einladen"
						>
							<UserPlus class="h-5 w-5" />
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Sicherheit & Account Bereich -->
	<div class="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
		<h3 class="flex items-center gap-2 text-lg font-bold text-slate-900">
			<ShieldCheck class="h-5 w-5 text-slate-500" />
			Sicherheit & Account
		</h3>

		<!-- Datenexport -->
		<div class="space-y-3">
			<h4 class="flex items-center gap-2 text-sm font-semibold text-slate-700">
				<Download class="h-4 w-4 text-slate-400" />
				Datenexport
			</h4>
			<p class="text-xs text-slate-500">
				Lade alle deine Transaktionen als CSV-Datei herunter.
			</p>
			<button
				type="button"
				onclick={handleExportCSV}
				class="min-h-[48px] w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
			>
				Als CSV herunterladen
			</button>
		</div>

		<div class="h-px bg-slate-100"></div>

		<!-- E-Mail-Adresse ändern -->
		<div class="space-y-3">
			<h4 class="flex items-center gap-2 text-sm font-semibold text-slate-700">
				<Mail class="h-4 w-4 text-slate-400" />
				E-Mail-Adresse ändern
			</h4>
			<p class="text-xs text-slate-500">
				Trage eine neue E-Mail-Adresse ein. Du erhältst dort einen Link zur Bestätigung.
			</p>
			<form onsubmit={handleEmailChange} class="flex gap-2">
				<input
					type="email"
					bind:value={newEmail}
					placeholder="neue@email.de"
					required
					class="min-h-[48px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
				<button
					type="submit"
					disabled={changingEmail}
					class="min-h-[48px] shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
				>
					{changingEmail ? '...' : 'Ändern'}
				</button>
			</form>
		</div>

		<div class="h-px bg-slate-100"></div>

		<!-- Passwort ändern -->
		<form onsubmit={handlePasswordChange} class="space-y-3">
			<h4 class="flex items-center gap-2 text-sm font-semibold text-slate-700">
				<KeyRound class="h-4 w-4 text-slate-400" />
				Passwort ändern
			</h4>

			<div class="space-y-2">
				<input
					type="password"
					bind:value={oldPassword}
					placeholder="Aktuelles Passwort"
					required
					class="min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
				<input
					type="password"
					bind:value={newPassword}
					placeholder="Neues Passwort (min. 8 Zeichen)"
					required
					class="min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
				<input
					type="password"
					bind:value={newPasswordConfirm}
					placeholder="Neues Passwort bestätigen"
					required
					class="min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				disabled={changingPassword}
				class="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
			>
				{changingPassword ? 'Wird geändert...' : 'Passwort aktualisieren'}
			</button>
		</form>

		<div class="h-px bg-slate-100"></div>

		<!-- Gefahrenzone / Account löschen -->
		<div class="space-y-3">
			<h4 class="flex items-center gap-2 text-sm font-semibold text-red-600">
				<AlertTriangle class="h-4 w-4" />
				Gefahrenzone
			</h4>
			<p class="text-xs text-slate-500">
				Hier kannst du deinen Account dauerhaft löschen. Diese Aktion löscht deine Profildaten
				unwiderruflich.
			</p>
			<button
				type="button"
				onclick={handleAccountDelete}
				class="min-h-[48px] w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-100 active:scale-95"
			>
				Account unwiderruflich löschen
			</button>
		</div>
	</div>
</div>
