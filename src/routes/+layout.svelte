<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toaster from '$lib/ui/Toaster.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { children } = $props();

	// Auth Guard & Partner Load
	$effect(() => {
		const isAuthRoute = $page.url.pathname === '/login' || $page.url.pathname === '/register';
		if (!authStore.isLoggedIn && !isAuthRoute) {
			goto('/login');
		} else if (authStore.isLoggedIn) {
			partnerStore.loadPartnerStatus();
			if (isAuthRoute) {
				goto('/');
			}
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
	<Toaster />
	<main class="w-full max-w-lg mx-auto min-h-screen pb-20 relative shadow-sm bg-white">
		{@render children()}
	</main>
</div>

