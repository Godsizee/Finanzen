<script lang="ts">
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { goto } from '$app/navigation';
	import { UserPlus } from '@lucide/svelte';
	import { toast } from '$lib/core/toastStore.svelte';

	import { isValidEmail, isValidPassword } from '$lib/core/validation';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
		if (!isValidEmail(email)) {
			toast.error('Bitte eine gültige E-Mail-Adresse eingeben.');
			return;
		}

		const pwValidation = isValidPassword(password);
		if (!pwValidation.valid) {
			toast.error(pwValidation.message || 'Ungültiges Passwort.');
			return;
		}

		loading = true;
		try {
			await authStore.register(email, password, name);
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
				<UserPlus class="w-6 h-6 text-slate-900" />
			</div>
			<h1 class="text-2xl font-bold text-slate-900">Neuer Account</h1>
			<p class="text-slate-500">Registriere dich für FairShare.</p>
		</div>

		<form onsubmit={handleRegister} class="space-y-4">
			<div class="space-y-1">
				<label for="name" class="text-sm font-medium text-slate-700">Dein Name</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					placeholder="Vorname"
					class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
				/>
			</div>

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
				<label for="password" class="text-sm font-medium text-slate-700">Passwort (min. 8 Zeichen)</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					minlength="8"
					placeholder="••••••••"
					class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-shadow"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-medium active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
			>
				{loading ? 'Lade...' : 'Registrieren'}
			</button>
		</form>

		<p class="text-center text-sm text-slate-500">
			Bereits einen Account?
			<a href="/login" class="text-slate-900 font-medium hover:underline">Hier einloggen</a>
		</p>
	</div>
</div>
