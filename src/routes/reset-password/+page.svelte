<script lang="ts">
	import { pb } from '$lib/core/pb';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/core/toastStore.svelte';
	import { ShieldCheck, AlertTriangle } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { isValidPassword } from '$lib/core/validation';

	let token = $derived($page.url.searchParams.get('token'));
	let password = $state('');
	let passwordConfirm = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!token) {
			toast.error('Token fehlt oder ist ungültig.');
			return;
		}

		const pwValidation = isValidPassword(password);
		if (!pwValidation.valid) {
			toast.error(pwValidation.message || 'Passwort-Validierung fehlgeschlagen.');
			return;
		}

		if (password !== passwordConfirm) {
			toast.error('Die Passwörter stimmen nicht überein.');
			return;
		}

		loading = true;
		try {
			await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);
			toast.success('Passwort erfolgreich zurückgesetzt! Bitte logge dich neu ein.');
			goto('/login');
		} catch (err: any) {
			toast.error('Fehler: ' + (err.message || err));
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center bg-slate-50 p-4">
	<div class="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
		{#if token}
			<div class="space-y-2 text-center">
				<div
					class="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"
				>
					<ShieldCheck class="h-6 w-6 text-slate-900" />
				</div>
				<h1 class="text-2xl font-bold text-slate-900">Neues Passwort vergeben</h1>
				<p class="text-sm text-slate-500">
					Lege ein neues, sicheres Passwort für deinen Account fest.
				</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<Input
					label="Neues Passwort (min. 8 Zeichen)"
					type="password"
					bind:value={password}
					required
					placeholder="••••••••"
				/>

				<Input
					label="Passwort bestätigen"
					type="password"
					bind:value={passwordConfirm}
					required
					placeholder="••••••••"
				/>

				<Button
					type="submit"
					disabled={loading}
					variant="primary"
					class="flex h-12 w-full items-center justify-center font-medium"
				>
					{loading ? 'Lade...' : 'Passwort zurücksetzen'}
				</Button>
			</form>
		{:else}
			<div class="space-y-4 text-center">
				<div class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
					<AlertTriangle class="h-6 w-6 text-red-600" />
				</div>
				<h1 class="text-2xl font-bold text-slate-900">Ungültiger Link</h1>
				<p class="text-sm text-slate-500">
					Der Passwort-Reset-Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Link an.
				</p>
				<Button onclick={() => goto('/forgot-password')} variant="primary" class="mt-2 h-12 w-full">
					Neuen Link anfordern
				</Button>
			</div>
		{/if}
	</div>
</div>
