<script lang="ts">
	import { Home, History, Plus, Repeat, Users } from '@lucide/svelte';
	import { page } from '$app/stores';

	let currentPath = $derived($page.url.pathname);

	const links = [
		{ href: '/', icon: Home, label: 'Übersicht' },
		{ href: '/history', icon: History, label: 'Verlauf' },
		{ href: '/add', icon: Plus, label: 'Neu', isAction: true },
		{ href: '/recurring', icon: Repeat, label: 'Fixkosten' },
		{ href: '/settings', icon: Users, label: 'Haushalt' }
	];
</script>

<!-- Mobile Bottom Navigation -->
<nav
	class="fixed right-0 bottom-0 left-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
>
	<div class="mx-auto flex h-16 max-w-lg items-center justify-around px-2 max-[340px]:px-1">
		{#each links as link}
			{#if link.isAction}
				<a
					href={link.href}
					class="z-10 -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform hover:bg-emerald-700 active:scale-95 max-[340px]:-mt-6 max-[340px]:h-11 max-[340px]:w-11"
					aria-label={link.label}
				>
					<link.icon class="h-7 w-7 max-[340px]:h-5 max-[340px]:w-5" />
				</a>
			{:else}
				<a
					href={link.href}
					class="flex h-full w-16 flex-col items-center justify-center text-[10px] transition-colors max-[340px]:w-11 max-[340px]:text-[8px] {currentPath ===
					link.href
						? 'font-medium text-emerald-600'
						: 'text-slate-500 hover:text-slate-900'} active:scale-95"
					aria-label={link.label}
				>
					<link.icon class="mb-1 h-6 w-6 max-[340px]:h-5 max-[340px]:w-5" />
					<span class="w-full truncate text-center">{link.label}</span>
				</a>
			{/if}
		{/each}
	</div>
</nav>

<!-- Desktop Sidebar Navigation -->
<aside
	class="fixed top-0 left-0 z-40 hidden h-screen w-64 flex-col bg-slate-900 text-slate-300 md:flex"
>
	<div class="flex items-center gap-3 p-6">
		<img src="/logo.svg" alt="FairShare Logo" class="h-8 w-8" />
		<h1 class="text-2xl font-bold tracking-tight text-white">FairShare</h1>
	</div>

	<nav class="mt-4 flex-1 space-y-2 px-4">
		{#each links as link}
			{#if link.isAction}
				<a
					href={link.href}
					class="mt-8 mb-4 flex items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 font-medium text-white shadow-sm transition-transform hover:bg-emerald-500 active:scale-95"
				>
					<link.icon size={20} />
					<span>Ausgabe erfassen</span>
				</a>
			{:else}
				<a
					href={link.href}
					class="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors {currentPath ===
					link.href
						? 'bg-slate-800 font-medium text-white'
						: 'hover:bg-slate-800 hover:text-white'} active:scale-95"
				>
					<link.icon size={20} />
					<span>{link.label}</span>
				</a>
			{/if}
		{/each}
	</nav>
</aside>
