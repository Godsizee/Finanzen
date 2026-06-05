<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toaster from '$lib/ui/Toaster.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
	<Toaster />
	<main class="w-full max-w-lg mx-auto min-h-screen pb-20 relative shadow-sm bg-white">
		{@render children()}
	</main>
</div>

