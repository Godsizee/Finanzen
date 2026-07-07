<script lang="ts">
	import { onMount } from 'svelte';
	import { groupStore } from '$lib/features/groups/store.svelte';
	import { groupApi } from '$lib/features/groups/api';
	import { authStore } from '$lib/features/auth/authStore.svelte';
	import { toast } from '$lib/core/toastStore.svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import Card from '$lib/ui/Card.svelte';
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte';
	import {
		ArrowLeft,
		Users,
		Plus,
		Check,
		Copy,
		RefreshCw,
		LogOut,
		Crown,
		Eye
	} from '@lucide/svelte';

	let newGroupName = $state('');
	let creating = $state(false);
	let showCreateForm = $state(false);
	let showLeaveConfirm = $state(false);
	let copied = $state(false);

	onMount(() => {
		groupStore.init();
	});

	let myMembership = $derived(
		groupStore.members.find((m) => m.user === authStore.currentUser?.id) ?? null
	);
	let isAdmin = $derived(myMembership?.role === 'admin');

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newGroupName.trim()) return;
		creating = true;
		try {
			const group = await groupStore.createGroup(newGroupName.trim());
			if (group) {
				await groupStore.setActive(group.id);
				newGroupName = '';
				showCreateForm = false;
			}
		} finally {
			creating = false;
		}
	}

	async function copyInviteLink() {
		if (!groupStore.inviteLink) return;
		try {
			await navigator.clipboard.writeText(groupStore.inviteLink);
			copied = true;
			toast.success('Einladungslink kopiert!');
			setTimeout(() => (copied = false), 2000);
		} catch {
			toast.error('Kopieren fehlgeschlagen — Link bitte manuell markieren.');
		}
	}

	async function leaveGroup() {
		if (!myMembership) return;
		if (groupStore.groups.length <= 1) {
			toast.error('Du kannst deine letzte Gruppe nicht verlassen.');
			return;
		}
		const admins = groupStore.members.filter((m) => m.role === 'admin');
		if (isAdmin && admins.length === 1 && groupStore.members.length > 1) {
			toast.error('Bestimme zuerst einen anderen Admin, bevor du die Gruppe verlässt.');
			return;
		}
		try {
			await groupApi.removeMember(myMembership.id);
			groupStore.groups = groupStore.groups.filter((g) => g.id !== groupStore.activeGroupId);
			toast.info('Du hast die Gruppe verlassen.');
			const next = groupStore.groups[0];
			if (next) await groupStore.setActive(next.id);
			goto('/');
		} catch {
			toast.error('Gruppe konnte nicht verlassen werden.');
		}
	}

	const roleLabels: Record<string, string> = {
		admin: 'Admin',
		member: 'Mitglied',
		readonly: 'Nur Lesen'
	};
</script>

<div class="space-y-6 p-4 md:p-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<button
			onclick={() => history.back()}
			class="rounded-full p-2 transition-colors hover:bg-slate-100"
			aria-label="Zurück"
		>
			<ArrowLeft class="h-5 w-5 text-slate-700" />
		</button>
		<div>
			<h1 class="text-xl font-bold text-slate-900">Gruppen</h1>
			<p class="text-xs text-slate-500">Verwalte deine Haushalts- und Gruppenkassen</p>
		</div>
	</div>

	<!-- Meine Gruppen -->
	<div class="space-y-2">
		<h2 class="text-sm font-semibold text-slate-700">Meine Gruppen</h2>
		{#each groupStore.groups as group (group.id)}
			<button
				onclick={() => groupStore.setActive(group.id)}
				class="flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors {group.id ===
				groupStore.activeGroupId
					? 'border-emerald-300 bg-emerald-50'
					: 'border-slate-200 bg-white hover:border-slate-300'}"
			>
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full {group.id ===
						groupStore.activeGroupId
							? 'bg-emerald-600 text-white'
							: 'bg-slate-100 text-slate-500'}"
					>
						<Users class="h-5 w-5" />
					</div>
					<div>
						<p class="text-sm font-semibold text-slate-900">{group.name}</p>
						{#if group.id === groupStore.activeGroupId}
							<p class="text-xs text-emerald-700">Aktive Gruppe</p>
						{/if}
					</div>
				</div>
				{#if group.id === groupStore.activeGroupId}
					<Check class="h-5 w-5 text-emerald-600" />
				{/if}
			</button>
		{/each}

		{#if showCreateForm}
			<form onsubmit={handleCreate} class="flex gap-2 pt-2">
				<div class="flex-1">
					<Input
						label=""
						type="text"
						bind:value={newGroupName}
						placeholder="z.B. WG-Kasse, Urlaubsgruppe..."
						required
					/>
				</div>
				<Button type="submit" variant="primary" disabled={creating} class="h-12 shrink-0 px-5">
					{creating ? '...' : 'Erstellen'}
				</Button>
			</form>
		{:else}
			<button
				onclick={() => (showCreateForm = true)}
				class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-sm font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700"
			>
				<Plus class="h-4 w-4" /> Neue Gruppe erstellen
			</button>
		{/if}
	</div>

	{#if groupStore.activeGroup}
		<!-- Mitglieder der aktiven Gruppe -->
		<Card>
			<div class="space-y-3">
				<h2 class="text-sm font-semibold text-slate-700">
					Mitglieder — {groupStore.activeGroup.name}
				</h2>
				{#each groupStore.members as member (member.id)}
					{@const user = member.expand?.user}
					<div class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
						<div class="flex items-center gap-3">
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
							>
								{(user?.name || user?.email || '?').charAt(0).toUpperCase()}
							</div>
							<div>
								<p class="text-sm font-medium text-slate-900">
									{user?.name || 'Unbekannt'}
									{#if member.user === authStore.currentUser?.id}
										<span class="text-xs font-normal text-slate-400">(du)</span>
									{/if}
								</p>
								{#if user?.email}
									<p class="text-xs text-slate-500">{user.email}</p>
								{/if}
							</div>
						</div>
						<span
							class="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold {member.role ===
							'admin'
								? 'bg-amber-100 text-amber-800'
								: member.role === 'readonly'
									? 'bg-slate-200 text-slate-600'
									: 'bg-blue-100 text-blue-800'}"
						>
							{#if member.role === 'admin'}<Crown class="h-3 w-3" />{/if}
							{#if member.role === 'readonly'}<Eye class="h-3 w-3" />{/if}
							{roleLabels[member.role] || member.role}
						</span>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Einladen -->
		<Card>
			<div class="space-y-3">
				<h2 class="text-sm font-semibold text-slate-700">Mitglieder einladen</h2>
				<p class="text-xs text-slate-500">
					Teile diesen Link — wer ihn öffnet und eingeloggt ist, kann der Gruppe beitreten.
				</p>
				{#if groupStore.inviteLink}
					<div class="flex items-center gap-2">
						<input
							type="text"
							readonly
							value={groupStore.inviteLink}
							class="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
							onfocus={(e) => (e.target as HTMLInputElement).select()}
						/>
						<button
							onclick={copyInviteLink}
							class="shrink-0 rounded-lg bg-slate-900 p-2.5 text-white transition-transform active:scale-95"
							aria-label="Link kopieren"
						>
							{#if copied}<Check class="h-4 w-4" />{:else}<Copy class="h-4 w-4" />{/if}
						</button>
					</div>
					{#if isAdmin}
						<button
							onclick={() => groupStore.regenerateInviteCode()}
							class="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
						>
							<RefreshCw class="h-3 w-3" /> Link erneuern (alter Link wird ungültig)
						</button>
					{/if}
				{:else}
					<p class="text-xs text-slate-400">Kein Einladungslink verfügbar.</p>
				{/if}
			</div>
		</Card>

		<!-- Gruppe verlassen -->
		<Card>
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-sm font-semibold text-slate-700">Gruppe verlassen</h2>
					<p class="text-xs text-slate-500">Deine Buchungen bleiben in der Gruppe erhalten.</p>
				</div>
				<Button
					variant="secondary"
					class="flex items-center gap-2 text-red-600"
					onclick={() => (showLeaveConfirm = true)}
				>
					<LogOut class="h-4 w-4" /> Verlassen
				</Button>
			</div>
		</Card>
	{/if}
</div>

<ConfirmDialog
	bind:show={showLeaveConfirm}
	title="Gruppe verlassen?"
	message={`Möchtest du „${groupStore.activeGroup?.name}" wirklich verlassen? Du verlierst den Zugriff auf alle Buchungen dieser Gruppe.`}
	confirmText="Verlassen"
	variant="danger"
	onconfirm={leaveGroup}
/>
