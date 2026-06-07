<script lang="ts">
	let {
		lines = 2,
		hasIcon = true,
		class: className = ''
	}: {
		lines?: number;
		hasIcon?: boolean;
		class?: string;
	} = $props();
</script>

<div class="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl animate-pulse {className}">
	{#if hasIcon}
		<div class="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
	{/if}
	<div class="flex-1 space-y-2">
		<div class="h-4 bg-slate-200 rounded w-1/3"></div>
		{#if lines > 1}
			<div class="h-3 bg-slate-150 rounded w-2/3"></div>
		{/if}
	</div>
	<div class="w-12 h-5 bg-slate-200 rounded"></div>
</div>
