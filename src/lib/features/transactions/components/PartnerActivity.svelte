<script lang="ts">
	import { transactionStore } from '../store.svelte';
	import { partnerStore } from '$lib/features/auth/partnerStore.svelte';
	import { formatCurrency } from '$lib/core/math';
	import { Inbox } from '@lucide/svelte';
	import Card from '$lib/ui/Card.svelte';

	let partnerName = $derived(partnerStore.partnerUser?.name || 'Partner');

	let todaysPartnerTx = $derived.by(() => {
		const partnerId = partnerStore.partnerUser?.id;
		if (!partnerId) return [];
		const today = new Date();
		return transactionStore.transactions.filter((tx) => {
			if (tx.paid_by !== partnerId || tx.split_mode === 'deposit') return false;
			const txDate = new Date(tx.date);
			return (
				txDate.getFullYear() === today.getFullYear() &&
				txDate.getMonth() === today.getMonth() &&
				txDate.getDate() === today.getDate()
			);
		});
	});

	let totalCents = $derived(todaysPartnerTx.reduce((acc, tx) => acc + tx.total_amount, 0));
	let latest = $derived(todaysPartnerTx[0]);

	function timeAgo(dateStr: string): string {
		const minutes = Math.max(1, Math.round((Date.now() - new Date(dateStr).getTime()) / 60000));
		if (minutes < 60) return `vor ${minutes} Min.`;
		return `vor ${Math.round(minutes / 60)} Std.`;
	}
</script>

{#if partnerStore.partnerStatus === 'active' && todaysPartnerTx.length > 0}
	<Card class="flex items-center gap-3 border border-slate-200/60 bg-slate-50 p-4 shadow-xs">
		<div
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900/5 text-slate-700"
		>
			<Inbox class="h-[18px] w-[18px]" />
		</div>
		<div class="min-w-0 flex-1">
			<p class="text-sm font-semibold text-slate-900">
				{partnerName} hat heute {todaysPartnerTx.length}
				{todaysPartnerTx.length === 1 ? 'Ausgabe' : 'Ausgaben'} erfasst ({formatCurrency(
					totalCents
				)})
			</p>
			{#if latest}
				<p class="mt-0.5 truncate text-xs text-slate-500">
					Zuletzt: {latest.note || 'Ausgabe'} · {formatCurrency(latest.total_amount)} · {timeAgo(
						latest.date
					)}
				</p>
			{/if}
		</div>
	</Card>
{/if}
