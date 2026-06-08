<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AlertTriangle, Home, RefreshCw } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';

	let status = $derived($page.status);
	let error = $derived($page.error);
</script>

<div
	class="flex min-h-[80vh] flex-col items-center justify-center bg-slate-50 p-6 text-slate-900 selection:bg-emerald-200"
>
	<div
		class="w-full max-w-md space-y-6 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm"
	>
		<div
			class="inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-red-50 text-red-600"
		>
			<AlertTriangle size={32} />
		</div>

		<div class="space-y-2">
			<h1 class="text-2xl font-bold tracking-tight text-slate-900">
				{#if status === 404}
					Seite nicht gefunden
				{:else}
					Fehler aufgetreten
				{/if}
			</h1>
			<p class="text-sm leading-relaxed text-slate-500">
				{#if status === 404}
					Die gesuchte Seite existiert leider nicht.
				{:else}
					{error?.message || 'Ein unerwarteter Systemfehler ist aufgetreten.'}
				{/if}
			</p>
			{#if status}
				<span
					class="inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
				>
					Statuscode {status}
				</span>
			{/if}
		</div>

		<div class="flex flex-col gap-3 pt-2 sm:flex-row">
			<Button
				variant="primary"
				class="flex h-12 flex-1 items-center justify-center gap-2"
				onclick={() => goto('/')}
			>
				<Home size={18} /> Startseite
			</Button>
			<Button
				variant="secondary"
				class="flex h-12 flex-1 items-center justify-center gap-2"
				onclick={() => window.location.reload()}
			>
				<RefreshCw size={18} /> Neu laden
			</Button>
		</div>
	</div>
</div>
