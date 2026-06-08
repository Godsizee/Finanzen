<script lang="ts">
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { goto } from '$app/navigation';
	import { LogIn } from '@lucide/svelte';
	import { toast } from '$lib/core/toastStore.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;
		try {
			await authStore.login(email, password);
			goto('/');
		} catch (err) {
			// Toast is handled in authStore
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center p-4">
	<div class="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-sm">
		<div class="space-y-2 text-center">
			<img src="/logo.svg" alt="FairShare Logo" class="mx-auto mb-2 h-16 w-16" />
			<h1 class="text-2xl font-bold text-slate-900">Willkommen zurück</h1>
			<p class="text-slate-500">Logge dich ein, um FairShare zu nutzen.</p>
		</div>

		<form onsubmit={handleLogin} class="space-y-4">
			<div class="space-y-1">
				<label for="email" class="text-sm font-medium text-slate-700">E-Mail Adresse</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					placeholder="deine@email.de"
					class="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 transition-shadow focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
			</div>

			<div class="space-y-1">
				<label for="password" class="text-sm font-medium text-slate-700">Passwort</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					placeholder="••••••••"
					class="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 transition-shadow focus:ring-2 focus:ring-slate-900 focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'Lade...' : 'Einloggen'}
			</button>
		</form>

		<div class="flex flex-col gap-3 text-center text-sm text-slate-500">
			<p>
				Noch keinen Account?
				<a href="/register" class="font-medium text-slate-900 hover:underline">Hier registrieren</a>
			</p>
			<p>
				<a
					href="/forgot-password"
					class="text-slate-600 transition-colors hover:text-slate-900 hover:underline"
					>Passwort vergessen?</a
				>
			</p>
		</div>
	</div>
</div>
