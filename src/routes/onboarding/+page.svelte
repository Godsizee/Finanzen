<script lang="ts">
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { authApi } from '$lib/features/auth/api';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/core/toastStore.svelte';
	import { User, Coins, Users, Check, ArrowRight, ArrowLeft } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';

	let step = $state(1);

	// Step 1: Profile Name
	let name = $state(authStore.currentUser?.name || '');
	let savingName = $state(false);

	// Step 2: Income + Cost Sharing Mode
	let income = $state('');
	let savingIncome = $state(false);
	let costSharingMode = $state<'own_costs' | '50_50' | 'income_ratio'>('50_50');

	// Step 3: Partner Email
	let partnerEmail = $state('');
	let searching = $state(false);
	let searchResult = $state<any>(null);

	async function nextStep() {
		if (step === 1) {
			if (!name.trim()) {
				toast.error('Bitte gib deinen Namen ein.');
				return;
			}
			savingName = true;
			try {
				const updated = await authApi.updateProfile({ name });
				authStore.currentUser = updated;
				step = 2;
			} catch (err: any) {
				toast.error('Fehler beim Speichern: ' + err.message);
			} finally {
				savingName = false;
			}
		} else if (step === 2) {
			if (!income.trim()) {
				savingIncome = true;
				try {
					const updated = await authApi.updateProfile({ cost_sharing_mode: costSharingMode });
					authStore.currentUser = updated;
					step = 3;
				} catch (err: any) {
					toast.error('Fehler beim Speichern: ' + err.message);
				} finally {
					savingIncome = false;
				}
				return;
			}
			savingIncome = true;
			try {
				const parsed = parseFloat(income.replace(',', '.'));
				if (isNaN(parsed) || parsed < 0) {
					toast.error('Bitte ein gültiges Einkommen eingeben.');
					return;
				}
				const cents = Math.round(parsed * 100);
				const updated = await authApi.updateProfile({ income: cents, cost_sharing_mode: costSharingMode });
				authStore.currentUser = updated;
				step = 3;
			} catch (err: any) {
				toast.error('Fehler beim Speichern: ' + err.message);
			} finally {
				savingIncome = false;
			}
		} else if (step === 3) {
			finish();
		}
	}

	function prevStep() {
		if (step > 1) {
			step -= 1;
		}
	}

	async function handlePartnerSearch(e: Event) {
		e.preventDefault();
		searching = true;
		searchResult = await partnerStore.searchByEmail(partnerEmail);
		if (!searchResult) {
			toast.info('Kein Nutzer mit dieser E-Mail gefunden.');
		}
		searching = false;
	}

	async function invitePartner(userId: string) {
		await partnerStore.sendInvite(userId);
		await finish();
	}

	async function finish() {
		try {
			const updated = await authApi.updateProfile({ onboarded: true });
			authStore.currentUser = updated;
			toast.success('Onboarding erfolgreich abgeschlossen!');
			goto('/');
		} catch (err: any) {
			toast.error('Fehler beim Abschließen: ' + err.message);
		}
	}
</script>

<div class="flex min-h-[85vh] flex-col items-center justify-center bg-slate-50 p-4">
	<div
		class="relative w-full max-w-md space-y-6 overflow-hidden rounded-3xl bg-white p-6 shadow-sm"
	>
		<!-- Progress Bar -->
		<div class="absolute top-0 right-0 left-0 flex h-1.5 bg-slate-100">
			<div
				class="h-full bg-slate-900 transition-all duration-300"
				style="width: {(step / 3) * 100}%"
			></div>
		</div>

		<!-- Step Indicators -->
		<div class="flex items-center justify-between px-2 pt-2">
			<div class="flex items-center gap-1.5">
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors {step ===
					1
						? 'bg-slate-900 text-white'
						: step > 1
							? 'bg-emerald-100 text-emerald-800'
							: 'bg-slate-100 text-slate-400'}"
				>
					{#if step > 1}<Check size={14} />{:else}1{/if}
				</div>
				<span class="text-xs font-semibold {step === 1 ? 'text-slate-900' : 'text-slate-400'}"
					>Profil</span
				>
			</div>
			<div class="h-px w-8 bg-slate-200"></div>
			<div class="flex items-center gap-1.5">
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors {step ===
					2
						? 'bg-slate-900 text-white'
						: step > 2
							? 'bg-emerald-100 text-emerald-800'
							: 'bg-slate-100 text-slate-400'}"
				>
					{#if step > 2}<Check size={14} />{:else}2{/if}
				</div>
				<span class="text-xs font-semibold {step === 2 ? 'text-slate-900' : 'text-slate-400'}"
					>Finanzen</span
				>
			</div>
			<div class="h-px w-8 bg-slate-200"></div>
			<div class="flex items-center gap-1.5">
				<div
					class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors {step ===
					3
						? 'bg-slate-900 text-white'
						: 'bg-slate-100 text-slate-400'}"
				>
					3
				</div>
				<span class="text-xs font-semibold {step === 3 ? 'text-slate-900' : 'text-slate-400'}"
					>Partner</span
				>
			</div>
		</div>

		<!-- Step Content -->
		{#if step === 1}
			<div class="animate-in fade-in space-y-6 duration-300">
				<div class="space-y-2 text-center">
					<div
						class="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
					>
						<User class="h-6 w-6 text-slate-900" />
					</div>
					<h2 class="text-2xl font-bold text-slate-900">Wie heißt du?</h2>
					<p class="text-sm text-slate-500">
						Gib uns deinen Vornamen, damit dein Partner sieht, wer eine Ausgabe eingetragen hat.
					</p>
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						nextStep();
					}}
					class="space-y-4"
				>
					<Input label="Dein Vorname" type="text" bind:value={name} required placeholder="Basti" />

					<Button
						type="submit"
						disabled={savingName}
						variant="primary"
						class="flex h-12 w-full items-center justify-center gap-2 font-medium"
					>
						{savingName ? 'Wird gespeichert...' : 'Weiter'}
						<ArrowRight size={18} />
					</Button>
				</form>
			</div>
		{:else if step === 2}
			<div class="animate-in fade-in space-y-6 duration-300">
				<div class="space-y-2 text-center">
					<div
						class="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
					>
						<Coins class="h-6 w-6 text-slate-900" />
					</div>
					<h2 class="text-2xl font-bold text-slate-900">Dein Einkommen</h2>
					<p class="text-sm text-slate-500">
						Trage dein monatliches Nettoeinkommen ein, um faire Verhältnisse zu berechnen. Kann
						übersprungen werden.
					</p>
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						nextStep();
					}}
					class="space-y-4"
				>
					<div class="relative">
						<Input
							label="Monatliches Nettoeinkommen (€)"
							type="text"
							inputmode="decimal"
							bind:value={income}
							placeholder="z.B. 2500"
						/>
					</div>

					<div class="space-y-2">
						<span class="text-sm font-medium text-slate-700">Kostenaufteilung</span>
						<div class="flex rounded-xl bg-slate-100 p-1">
							<button
								type="button"
								onclick={() => (costSharingMode = 'own_costs')}
								class="flex-1 rounded-lg py-2 text-xs font-medium transition-colors {costSharingMode === 'own_costs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}"
							>
								Jeder selbst
							</button>
							<button
								type="button"
								onclick={() => (costSharingMode = '50_50')}
								class="flex-1 rounded-lg py-2 text-xs font-medium transition-colors {costSharingMode === '50_50' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}"
							>
								50/50
							</button>
							<button
								type="button"
								onclick={() => (costSharingMode = 'income_ratio')}
								class="flex-1 rounded-lg py-2 text-xs font-medium transition-colors {costSharingMode === 'income_ratio' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}"
							>
								Einkommensbasiert
							</button>
						</div>
						{#if costSharingMode === 'income_ratio'}
							<p class="text-xs text-amber-700">
								Tragt beide euer Einkommen ein, damit das Verhältnis berechnet werden kann.
							</p>
						{/if}
					</div>

					<div class="flex gap-3">
						<Button
							type="button"
							variant="secondary"
							class="flex h-12 flex-1 items-center justify-center gap-2 font-medium"
							onclick={prevStep}
						>
							<ArrowLeft size={18} /> Zurück
						</Button>

						<Button
							type="submit"
							disabled={savingIncome}
							variant="primary"
							class="flex h-12 flex-1 items-center justify-center gap-2 font-medium"
						>
							{savingIncome ? '...' : income ? 'Weiter' : 'Überspringen'}
							<ArrowRight size={18} />
						</Button>
					</div>
				</form>
			</div>
		{:else if step === 3}
			<div class="animate-in fade-in space-y-6 duration-300">
				<div class="space-y-2 text-center">
					<div
						class="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
					>
						<Users class="h-6 w-6 text-slate-900" />
					</div>
					<h2 class="text-2xl font-bold text-slate-900">Partner einladen</h2>
					<p class="text-sm text-slate-500">
						Gib die E-Mail deines Partners ein, um euch miteinander zu verknüpfen.
					</p>
				</div>

				<div class="space-y-4">
					<form onsubmit={handlePartnerSearch} class="flex gap-2">
						<input
							type="email"
							bind:value={partnerEmail}
							placeholder="Partner E-Mail suchen..."
							required
							class="min-h-[48px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
						/>
						<button
							type="submit"
							disabled={searching}
							class="min-h-[48px] shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
						>
							{searching ? '...' : 'Suchen'}
						</button>
					</form>

					{#if searchResult}
						<div
							class="animate-in zoom-in-95 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 duration-150"
						>
							<div>
								<p class="text-sm font-medium text-slate-900">{searchResult.name || 'Partner'}</p>
								<p class="text-xs text-slate-500">{searchResult.email}</p>
							</div>
							<button
								onclick={() => invitePartner(searchResult.id)}
								class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-transform hover:bg-emerald-700 active:scale-95"
							>
								Verknüpfen
							</button>
						</div>
					{/if}

					<div class="flex gap-3 pt-4">
						<Button
							type="button"
							variant="secondary"
							class="flex h-12 flex-1 items-center justify-center gap-2 font-medium"
							onclick={prevStep}
						>
							<ArrowLeft size={18} /> Zurück
						</Button>

						<Button
							type="button"
							variant="primary"
							class="flex h-12 flex-1 items-center justify-center gap-2 font-medium"
							onclick={finish}
						>
							Fertigstellen
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
