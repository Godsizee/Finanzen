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

<div class="flex min-h-[80vh] flex-col items-center justify-center bg-slate-50 p-4">
	<div class="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
		<header class="flex items-center gap-2">
			<button
				onclick={() => goto('/login')}
				class="-ml-2 rounded-full p-2 transition-colors hover:bg-slate-100"
				aria-label="Zurück"
			>
				<ArrowLeft size={20} class="text-slate-900" />
			</button>
			<span class="text-sm font-semibold text-slate-900">Zurück zum Login</span>
		</header>

		{#if !sent}
			<div class="space-y-2 text-center">
				<img src="/logo.svg" alt="FairShare Logo" class="mx-auto mb-2 h-16 w-16" />
				<h1 class="text-2xl font-bold text-slate-900">Passwort vergessen?</h1>
				<p class="text-sm text-slate-500">
					Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
				</p>
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
					class="flex h-12 w-full items-center justify-center font-medium"
				>
					{loading ? 'Lade...' : 'Link anfordern'}
				</Button>
			</form>
		{:else}
			<div class="space-y-4 text-center">
				<div class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
					<Mail class="h-6 w-6 text-emerald-600" />
				</div>
				<h1 class="text-2xl font-bold text-slate-900">E-Mail gesendet!</h1>
				<p class="text-sm text-slate-500">
					Wir haben eine E-Mail an <strong class="text-slate-800">{email}</strong> gesendet. Bitte folge
					dem Link in der E-Mail, um dein Passwort zurückzusetzen.
				</p>
				<Button
					onclick={() => goto('/login')}
					variant="secondary"
					class="mt-2 h-12 w-full font-medium"
				>
					Zurück zum Login
				</Button>
			</div>
		{/if}
	</div>
</div>
