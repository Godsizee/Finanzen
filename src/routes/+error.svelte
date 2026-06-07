<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AlertTriangle, Home, RefreshCw } from '@lucide/svelte';
	import Button from '$lib/ui/Button.svelte';

	let status = $derived($page.status);
	let error = $derived($page.error);
</script>

<div class="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-slate-50 text-slate-900 selection:bg-emerald-200">
	<div class="w-full max-w-md bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center space-y-6">
		<div class="inline-flex items-center justify-center w-16 h-16 bg-red-50 text-red-600 rounded-full animate-pulse">
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
			<p class="text-sm text-slate-500 leading-relaxed">
				{#if status === 404}
					Die gesuchte Seite existiert leider nicht.
				{:else}
					{error?.message || 'Ein unerwarteter Systemfehler ist aufgetreten.'}
				{/if}
			</p>
			{#if status}
				<span class="inline-block px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
					Statuscode {status}
				</span>
			{/if}
		</div>

		<div class="flex flex-col sm:flex-row gap-3 pt-2">
			<Button variant="primary" class="flex-1 h-12 flex justify-center items-center gap-2" onclick={() => goto('/')}>
				<Home size={18} /> Startseite
			</Button>
			<Button variant="secondary" class="flex-1 h-12 flex justify-center items-center gap-2" onclick={() => window.location.reload()}>
				<RefreshCw size={18} /> Neu laden
			</Button>
		</div>
	</div>
</div>
