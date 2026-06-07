<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toaster from '$lib/ui/Toaster.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';
	import { pb } from '$lib/core/pb';

	let { children } = $props();

	onMount(async () => {
		if (authStore.isLoggedIn) {
			try {
				await pb.collection('users').authRefresh();
			} catch (err) {
				authStore.logout();
				goto('/login');
			}
		}
	});

	// Auth Guard & Partner Load
	$effect(() => {
		const path = $page.url.pathname;
		const isPublicRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(path);
		
		if (!authStore.isLoggedIn) {
			if (!isPublicRoute) {
				goto('/login');
			}
		} else {
			const isUnverified = authStore.currentUser && !authStore.currentUser.verified;
			if (isUnverified && path !== '/verify-email') {
				goto('/verify-email');
			} else if (!isUnverified) {
				partnerStore.loadPartnerStatus();
				const needsOnboarding = authStore.currentUser && !authStore.currentUser.onboarded;
				if (needsOnboarding && path !== '/onboarding') {
					goto('/onboarding');
				} else if (!needsOnboarding && (path === '/login' || path === '/register' || path === '/verify-email' || path === '/onboarding')) {
					goto('/');
				}
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

