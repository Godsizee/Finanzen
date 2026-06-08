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

<div
	class="flex animate-pulse items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 {className}"
>
	{#if hasIcon}
		<div class="h-10 w-10 shrink-0 rounded-full bg-slate-200"></div>
	{/if}
	<div class="flex-1 space-y-2">
		<div class="h-4 w-1/3 rounded bg-slate-200"></div>
		{#if lines > 1}
			<div class="bg-slate-150 h-3 w-2/3 rounded"></div>
		{/if}
	</div>
	<div class="h-5 w-12 rounded bg-slate-200"></div>
</div>
