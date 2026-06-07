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

	// Step 2: Income
	let income = $state('');
	let savingIncome = $state(false);

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
				// Allow skipping income but let's encourage setting it
				step = 3;
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
				const updated = await authApi.updateProfile({ income: cents });
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

<div class="flex flex-col items-center justify-center min-h-[85vh] p-4 bg-slate-50">
	<div class="w-full max-w-md bg-white rounded-3xl shadow-sm p-6 space-y-6 relative overflow-hidden">
		<!-- Progress Bar -->
		<div class="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 flex">
			<div class="bg-slate-900 h-full transition-all duration-300" style="width: {(step / 3) * 100}%"></div>
		</div>

		<!-- Step Indicators -->
		<div class="flex justify-between items-center px-2 pt-2">
			<div class="flex items-center gap-1.5">
				<div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors {step === 1 ? 'bg-slate-900 text-white' : step > 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}">
					{#if step > 1}<Check size={14} />{:else}1{/if}
				</div>
				<span class="text-xs font-semibold {step === 1 ? 'text-slate-900' : 'text-slate-400'}">Profil</span>
			</div>
			<div class="w-8 h-px bg-slate-200"></div>
			<div class="flex items-center gap-1.5">
				<div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors {step === 2 ? 'bg-slate-900 text-white' : step > 2 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}">
					{#if step > 2}<Check size={14} />{:else}2{/if}
				</div>
				<span class="text-xs font-semibold {step === 2 ? 'text-slate-900' : 'text-slate-400'}">Finanzen</span>
			</div>
			<div class="w-8 h-px bg-slate-200"></div>
			<div class="flex items-center gap-1.5">
				<div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors {step === 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}">
					3
				</div>
				<span class="text-xs font-semibold {step === 3 ? 'text-slate-900' : 'text-slate-400'}">Partner</span>
			</div>
		</div>

		<!-- Step Content -->
		{#if step === 1}
			<div class="space-y-6 animate-in fade-in duration-300">
				<div class="text-center space-y-2">
					<div class="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-2">
						<User class="w-6 h-6 text-slate-900" />
					</div>
					<h2 class="text-2xl font-bold text-slate-900">Wie heißt du?</h2>
					<p class="text-slate-500 text-sm">Gib uns deinen Vornamen, damit dein Partner sieht, wer eine Ausgabe eingetragen hat.</p>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); nextStep(); }} class="space-y-4">
					<Input
						label="Dein Vorname"
						type="text"
						bind:value={name}
						required
						placeholder="Basti"
					/>

					<Button
						type="submit"
						disabled={savingName}
						variant="primary"
						class="w-full h-12 flex justify-center items-center gap-2 font-medium"
					>
						{savingName ? 'Wird gespeichert...' : 'Weiter'} <ArrowRight size={18} />
					</Button>
				</form>
			</div>
		{:else if step === 2}
			<div class="space-y-6 animate-in fade-in duration-300">
				<div class="text-center space-y-2">
					<div class="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-2">
						<Coins class="w-6 h-6 text-slate-900" />
					</div>
					<h2 class="text-2xl font-bold text-slate-900">Dein Einkommen</h2>
					<p class="text-slate-500 text-sm">Trage dein monatliches Nettoeinkommen ein, um faire Verhältnisse zu berechnen. Kann übersprungen werden.</p>
				</div>

				<form onsubmit={(e) => { e.preventDefault(); nextStep(); }} class="space-y-4">
					<div class="relative">
						<Input
							label="Monatliches Nettoeinkommen (€)"
							type="text"
							inputmode="decimal"
							bind:value={income}
							placeholder="z.B. 2500"
						/>
					</div>

					<div class="flex gap-3">
						<Button
							type="button"
							variant="secondary"
							class="flex-1 h-12 flex justify-center items-center gap-2 font-medium"
							onclick={prevStep}
						>
							<ArrowLeft size={18} /> Zurück
						</Button>

						<Button
							type="submit"
							disabled={savingIncome}
							variant="primary"
							class="flex-1 h-12 flex justify-center items-center gap-2 font-medium"
						>
							{savingIncome ? '...' : income ? 'Weiter' : 'Überspringen'} <ArrowRight size={18} />
						</Button>
					</div>
				</form>
			</div>
		{:else if step === 3}
			<div class="space-y-6 animate-in fade-in duration-300">
				<div class="text-center space-y-2">
					<div class="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-2">
						<Users class="w-6 h-6 text-slate-900" />
					</div>
					<h2 class="text-2xl font-bold text-slate-900">Partner einladen</h2>
					<p class="text-slate-500 text-sm">Gib die E-Mail deines Partners ein, um euch miteinander zu verknüpfen.</p>
				</div>

				<div class="space-y-4">
					<form onsubmit={handlePartnerSearch} class="flex gap-2">
						<input
							type="email"
							bind:value={partnerEmail}
							placeholder="Partner E-Mail suchen..."
							required
							class="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm min-h-[48px]"
						/>
						<button
							type="submit"
							disabled={searching}
							class="px-5 bg-slate-900 text-white rounded-xl font-medium active:scale-95 transition-transform disabled:opacity-50 text-sm shrink-0 min-h-[48px]"
						>
							{searching ? '...' : 'Suchen'}
						</button>
					</form>

					{#if searchResult}
						<div class="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 animate-in zoom-in-95 duration-150">
							<div>
								<p class="font-medium text-slate-900 text-sm">{searchResult.name || 'Partner'}</p>
								<p class="text-xs text-slate-500">{searchResult.email}</p>
							</div>
							<button
								onclick={() => invitePartner(searchResult.id)}
								class="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg active:scale-95 transition-transform hover:bg-emerald-700"
							>
								Verknüpfen
							</button>
						</div>
					{/if}

					<div class="flex gap-3 pt-4">
						<Button
							type="button"
							variant="secondary"
							class="flex-1 h-12 flex justify-center items-center gap-2 font-medium"
							onclick={prevStep}
						>
							<ArrowLeft size={18} /> Zurück
						</Button>

						<Button
							type="button"
							variant="primary"
							class="flex-1 h-12 flex justify-center items-center gap-2 font-medium"
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
