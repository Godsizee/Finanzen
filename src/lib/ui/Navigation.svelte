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
<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50 pb-[env(safe-area-inset-bottom)]">
	<div class="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
		{#each links as link}
			{#if link.isAction}
				<a href={link.href}
				   class="flex items-center justify-center -mt-8 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 z-10"
				   aria-label={link.label}>
					<link.icon size={28} />
				</a>
			{:else}
				<a href={link.href}
				   class="flex flex-col items-center justify-center w-16 h-full text-[10px] transition-colors {currentPath === link.href ? 'text-emerald-600 font-medium' : 'text-slate-500 hover:text-slate-900'} active:scale-95"
				   aria-label={link.label}>
					<link.icon size={24} class="mb-1" />
					<span class="truncate w-full text-center">{link.label}</span>
				</a>
			{/if}
		{/each}
	</div>
</nav>

<!-- Desktop Sidebar Navigation -->
<aside class="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-slate-900 text-slate-300 z-40">
	<div class="p-6">
		<h1 class="text-2xl font-bold text-white tracking-tight">FairShare</h1>
	</div>
	
	<nav class="flex-1 px-4 space-y-2 mt-4">
		{#each links as link}
			{#if link.isAction}
				<a href={link.href}
				   class="flex items-center gap-3 px-4 py-3 mt-8 mb-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-transform active:scale-95 font-medium">
					<link.icon size={20} />
					<span>Ausgabe erfassen</span>
				</a>
			{:else}
				<a href={link.href}
				   class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors {currentPath === link.href ? 'bg-slate-800 text-white font-medium' : 'hover:bg-slate-800 hover:text-white'} active:scale-95">
					<link.icon size={20} />
					<span>{link.label}</span>
				</a>
			{/if}
		{/each}
	</nav>
</aside>
