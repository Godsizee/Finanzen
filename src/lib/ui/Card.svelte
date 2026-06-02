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

<div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 {className}">
	{@render children()}
</div>
