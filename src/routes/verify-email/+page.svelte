<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { pb } from '$lib/core/pb';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { toast } from '$lib/core/toastStore.svelte';
	import { Mail, CheckCircle, AlertTriangle, ArrowRight, LogOut, RefreshCw } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';

	let token = $derived($page.url.searchParams.get('token'));
	let verifying = $state(false);
	let success = $state(false);
	let errorMsg = $state('');

	let resending = $state(false);

	onMount(async () => {
		if (token) {
			verifying = true;
			try {
				await pb.collection('users').confirmVerification(token);
				success = true;
				toast.success('E-Mail erfolgreich verifiziert!');
				
				// Refresh auth if logged in
				if (authStore.isLoggedIn) {
					await pb.collection('users').authRefresh();
				}
				
				setTimeout(() => {
					goto('/');
				}, 2000);
			} catch (err: any) {
				errorMsg = err.message || 'Verifikations-Token ist ungültig oder abgelaufen.';
				toast.error(errorMsg);
			} finally {
				verifying = false;
			}
		}
	});

	async function handleResend() {
		if (!authStore.currentUser?.email) return;
		resending = true;
		try {
			await pb.collection('users').requestVerification(authStore.currentUser.email);
			toast.success('Verifikations-E-Mail erneut gesendet!');
		} catch (err: any) {
			toast.error('Fehler: ' + (err.message || err));
		} finally {
			resending = false;
		}
	}

	async function handleRefresh() {
		try {
			const updated = await pb.collection('users').authRefresh();
			if (updated.record.verified) {
				toast.success('Verifikation bestätigt!');
				goto('/');
			} else {
				toast.info('Deine E-Mail ist noch nicht verifiziert.');
			}
		} catch (err) {
			toast.error('Aktualisierung fehlgeschlagen.');
		}
	}

	function handleLogout() {
		authStore.logout();
		goto('/login');
	}
</script>

<div class="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-slate-50">
	<div class="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 space-y-6">
		{#if token}
			<!-- Verifikations-Flow über Token -->
			<div class="text-center space-y-4">
				{#if verifying}
					<div class="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full animate-spin">
						<RefreshCw class="w-6 h-6 text-slate-900" />
					</div>
					<h1 class="text-2xl font-bold text-slate-900">E-Mail wird verifiziert</h1>
					<p class="text-slate-500">Bitte gedulde dich einen kurzen Moment...</p>
				{:else if success}
					<div class="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full">
						<CheckCircle class="w-6 h-6 text-emerald-600" />
					</div>
					<h1 class="text-2xl font-bold text-slate-900">Erfolgreich verifiziert!</h1>
					<p class="text-slate-500">Du wirst sofort weitergeleitet...</p>
					<Button onclick={() => goto('/')} variant="primary" class="w-full">
						Direkt zur App <ArrowRight class="ml-2 w-4 h-4" />
					</Button>
				{:else}
					<div class="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
						<AlertTriangle class="w-6 h-6 text-red-600" />
					</div>
					<h1 class="text-2xl font-bold text-slate-900">Verifikation fehlgeschlagen</h1>
					<p class="text-slate-500">{errorMsg}</p>
					<Button onclick={() => goto('/login')} variant="primary" class="w-full">
						Zurück zum Login
					</Button>
				{/if}
			</div>
		{:else}
			<!-- Info-Screen für unbestätigte Nutzer -->
			<div class="text-center space-y-3">
				<img src="/logo.svg" alt="FairShare Logo" class="w-16 h-16 mx-auto mb-2" />
				<h1 class="text-2xl font-bold text-slate-900">E-Mail bestätigen</h1>
				<p class="text-slate-500 text-sm">
					Bitte bestätige deine E-Mail-Adresse unter <strong class="text-slate-800">{authStore.currentUser?.email}</strong>, um FairShare zu nutzen.
				</p>
			</div>

			<div class="space-y-3 pt-2">
				<Button
					variant="primary"
					class="w-full h-12 flex justify-center items-center gap-2"
					onclick={handleRefresh}
				>
					<RefreshCw class="w-4 h-4" />
					Ich habe die E-Mail bestätigt
				</Button>

				<Button
					variant="secondary"
					disabled={resending}
					class="w-full h-12 flex justify-center items-center gap-2"
					onclick={handleResend}
				>
					{resending ? 'Wird gesendet...' : 'E-Mail erneut senden'}
				</Button>

				<button
					onclick={handleLogout}
					class="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-900 flex justify-center items-center gap-2 rounded-xl transition-colors min-h-[48px]"
				>
					<LogOut class="w-4 h-4" />
					Abmelden
				</button>
			</div>
		{/if}
	</div>
</div>
