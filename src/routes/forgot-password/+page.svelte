<script lang="ts">
	import { pb } from '$lib/core/pb';
	import { toast } from '$lib/core/toastStore.svelte';
	import { KeyRound, ArrowLeft, Mail } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { isValidEmail } from '$lib/core/validation';

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!isValidEmail(email)) {
			toast.error('Bitte eine gültige E-Mail-Adresse eingeben.');
			return;
		}

		loading = true;
		try {
			await pb.collection('users').requestPasswordReset(email);
			sent = true;
			toast.success('Passwort-Reset-E-Mail gesendet!');
		} catch (err: any) {
			toast.error('Fehler: ' + (err.message || err));
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-50">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 space-y-6">
		<header class="flex items-center gap-2">
			<button onclick={() => goto('/login')} class="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors" aria-label="Zurück">
				<ArrowLeft size={20} class="text-slate-900" />
			</button>
			<span class="text-sm font-semibold text-slate-900">Zurück zum Login</span>
		</header>

		{#if !sent}
			<div class="text-center space-y-2">
				<img src="/logo.svg" alt="FairShare Logo" class="w-16 h-16 mx-auto mb-2" />
				<h1 class="text-2xl font-bold text-slate-900">Passwort vergessen?</h1>
				<p class="text-slate-500 text-sm">Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.</p>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<Input
					label="E-Mail Adresse"
					type="email"
					bind:value={email}
					required
					placeholder="deine@email.de"
				/>

				<Button
					type="submit"
					disabled={loading}
					variant="primary"
					class="w-full h-12 flex justify-center items-center font-medium"
				>
					{loading ? 'Lade...' : 'Link anfordern'}
				</Button>
			</form>
		{:else}
			<div class="text-center space-y-4">
				<div class="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full">
					<Mail class="w-6 h-6 text-emerald-600" />
				</div>
				<h1 class="text-2xl font-bold text-slate-900">E-Mail gesendet!</h1>
				<p class="text-slate-500 text-sm">
					Wir haben eine E-Mail an <strong class="text-slate-800">{email}</strong> gesendet. Bitte folge dem Link in der E-Mail, um dein Passwort zurückzusetzen.
				</p>
				<Button onclick={() => goto('/login')} variant="secondary" class="w-full h-12 font-medium mt-2">
					Zurück zum Login
				</Button>
			</div>
		{/if}
	</div>
</div>
