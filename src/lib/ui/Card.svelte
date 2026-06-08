<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = ''
	}: {
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div class="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm {className}">
	{@render children()}
</div>
