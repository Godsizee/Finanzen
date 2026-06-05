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

<div class="flex flex-col items-center justify-center min-h-[80vh] p-4">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 space-y-6">
		<div class="text-center space-y-2">
			<div class="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-2">
				<LogIn class="w-6 h-6 text-slate-900" />
			</div>
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
					class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
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
					class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-medium active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
			>
				{loading ? 'Lade...' : 'Einloggen'}
			</button>
		</form>

		<p class="text-center text-sm text-slate-500">
			Noch keinen Account?
			<a href="/register" class="text-slate-900 font-medium hover:underline">Hier registrieren</a>
		</p>
	</div>
</div>
