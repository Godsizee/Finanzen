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
	import Navigation from '$lib/ui/Navigation.svelte';

	let { children } = $props();

	let isPublicRoute = $derived(
		['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(
			$page.url.pathname
		)
	);

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
				} else if (
					!needsOnboarding &&
					(path === '/login' ||
						path === '/register' ||
						path === '/verify-email' ||
						path === '/onboarding')
				) {
					goto('/');
				}
			}
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-200">
	<Toaster />

	{#if authStore.isLoggedIn && !isPublicRoute && $page.url.pathname !== '/onboarding'}
		<Navigation />
	{/if}

	<div class="flex min-h-screen flex-col md:pl-64">
		<main
			class="relative mx-auto w-full max-w-lg flex-1 bg-white pb-24 shadow-sm md:my-6 md:min-h-0 md:max-w-2xl md:rounded-2xl md:border md:border-slate-200"
		>
			{@render children()}
		</main>
	</div>
</div>
