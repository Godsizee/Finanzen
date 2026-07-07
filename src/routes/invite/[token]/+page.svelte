<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { groupApi } from '$lib/features/groups/api';
	import { groupStore } from '$lib/features/groups/store.svelte';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import Button from '$lib/ui/Button.svelte';
	import { Users, AlertTriangle } from '@lucide/svelte';
	import type { RecordModel } from 'pocketbase';

	// Token-Format: <groupId>~<inviteCode>
	let groupId = $derived($page.params.token?.split('~')[0] ?? '');
	let inviteCode = $derived($page.params.token?.split('~')[1] ?? '');

	let group = $state<RecordModel | null>(null);
	let loading = $state(true);
	let joining = $state(false);
	let invalid = $state(false);

	let alreadyMember = $derived(groupStore.groups.some((g) => g.id === groupId));

	onMount(async () => {
		if (!groupId || !inviteCode) {
			invalid = true;
			loading = false;
			return;
		}
		try {
			await groupStore.init();
			group = await groupApi.getOne(groupId);
		} catch {
			invalid = true;
		} finally {
			loading = false;
		}
	});

	async function join() {
		joining = true;
		try {
			const ok = await groupStore.joinByInvite(groupId, inviteCode);
			if (ok) goto('/');
		} finally {
			joining = false;
		}
	}

	async function openGroup() {
		await groupStore.setActive(groupId);
		goto('/');
	}
</script>

<div class="flex min-h-[85vh] flex-col items-center justify-center p-4">
	<div class="w-full max-w-md space-y-6 rounded-3xl bg-white p-6 text-center shadow-sm">
		{#if loading}
			<p class="text-sm text-slate-500">Einladung wird geladen…</p>
		{:else if invalid || !group}
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600"
			>
				<AlertTriangle class="h-6 w-6" />
			</div>
			<h1 class="text-xl font-bold text-slate-900">Ungültige Einladung</h1>
			<p class="text-sm text-slate-500">
				Dieser Einladungslink ist ungültig oder abgelaufen. Bitte lass dir einen neuen Link
				schicken.
			</p>
			<Button variant="secondary" class="w-full" onclick={() => goto('/')}>Zur Übersicht</Button>
		{:else}
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
			>
				<Users class="h-6 w-6" />
			</div>
			<h1 class="text-xl font-bold text-slate-900">Einladung zu „{group.name}"</h1>
			{#if alreadyMember}
				<p class="text-sm text-slate-500">Du bist bereits Mitglied dieser Gruppe.</p>
				<Button variant="primary" class="w-full" onclick={openGroup}>Gruppe öffnen</Button>
			{:else}
				<p class="text-sm text-slate-500">
					{authStore.currentUser?.name || 'Hallo'}, du wurdest eingeladen, dieser Gruppe
					beizutreten. Ihr teilt euch dann Ausgaben und Abrechnungen.
				</p>
				<Button variant="primary" class="w-full" disabled={joining} onclick={join}>
					{joining ? 'Trete bei…' : 'Gruppe beitreten'}
				</Button>
				<Button variant="secondary" class="w-full" onclick={() => goto('/')}>Ablehnen</Button>
			{/if}
		{/if}
	</div>
</div>
