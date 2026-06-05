<script lang="ts">
	import { toast } from '$lib/core/toastStore.svelte';
	import { CheckCircle2, AlertCircle, Info } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
</script>

<div class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
	{#each toast.toasts as t (t.id)}
		<div 
			transition:fly={{ y: -20, duration: 250 }}
			class="flex items-center gap-3 p-4 rounded-2xl shadow-md border pointer-events-auto backdrop-blur-md transition-all
				{t.type === 'success' ? 'bg-emerald-600 border-emerald-700 text-white' : ''}
				{t.type === 'error' ? 'bg-red-600 border-red-700 text-white' : ''}
				{t.type === 'info' ? 'bg-slate-800 border-slate-900 text-white' : ''}
			"
		>
			{#if t.type === 'success'}
				<CheckCircle2 size={18} class="shrink-0" />
			{:else if t.type === 'error'}
				<AlertCircle size={18} class="shrink-0" />
			{:else}
				<Info size={18} class="shrink-0" />
			{/if}
			<span class="text-sm font-medium">{t.message}</span>
		</div>
	{/each}
</div>
