<script lang="ts">
	import { toast } from '$lib/core/toastStore.svelte';
	import { CheckCircle2, AlertCircle, Info } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
</script>

<div
	class="pointer-events-none fixed top-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
>
	{#each toast.toasts as t (t.id)}
		<div
			transition:fly={{ y: -20, duration: 250 }}
			class="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-md backdrop-blur-md transition-all
				{t.type === 'success' ? 'border-emerald-700 bg-emerald-600 text-white' : ''}
				{t.type === 'error' ? 'border-red-700 bg-red-600 text-white' : ''}
				{t.type === 'info' ? 'border-slate-900 bg-slate-800 text-white' : ''}
			"
		>
			<div class="flex items-center gap-3">
				{#if t.type === 'success'}
					<CheckCircle2 size={18} class="shrink-0" />
				{:else if t.type === 'error'}
					<AlertCircle size={18} class="shrink-0" />
				{:else}
					<Info size={18} class="shrink-0" />
				{/if}
				<span class="text-sm font-medium">{t.message}</span>
			</div>

			<div class="flex items-center gap-1.5 shrink-0">
				{#if t.actionName && t.actionFn}
					<button
						class="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold transition-colors hover:bg-white/30"
						onclick={() => {
							t.actionFn?.();
							toast.toasts = toast.toasts.filter((toastItem) => toastItem.id !== t.id);
						}}
					>
						{t.actionName}
					</button>
				{/if}
				{#if t.actionName2 && t.actionFn2}
					<button
						class="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold transition-colors hover:bg-white/30"
						onclick={() => {
							t.actionFn2?.();
							toast.toasts = toast.toasts.filter((toastItem) => toastItem.id !== t.id);
						}}
					>
						{t.actionName2}
					</button>
				{/if}
			</div>
		</div>
	{/each}
</div>
