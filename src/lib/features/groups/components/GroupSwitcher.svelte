<script lang="ts">
	import { groupStore } from '$lib/features/groups/store.svelte';
	import { Users, Settings } from '@lucide/svelte';

	interface Props {
		/** 'dark' für die Desktop-Sidebar, 'light' für helle Flächen */
		variant?: 'dark' | 'light';
	}
	let { variant = 'light' }: Props = $props();

	async function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		await groupStore.setActive(target.value);
	}
</script>

{#if groupStore.groups.length > 0}
	<div class="flex flex-col gap-1.5">
		<label
			for="group-switcher-{variant}"
			class="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase {variant ===
			'dark'
				? 'text-slate-500'
				: 'text-slate-400'}"
		>
			<Users class="h-3 w-3" /> Gruppe
		</label>
		<div class="flex items-center gap-2">
			<select
				id="group-switcher-{variant}"
				value={groupStore.activeGroupId}
				onchange={handleChange}
				class="w-full cursor-pointer rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus:outline-none {variant ===
				'dark'
					? 'border-slate-700 bg-slate-800 text-white hover:border-slate-600'
					: 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300'}"
			>
				{#each groupStore.groups as group (group.id)}
					<option value={group.id}>{group.name}</option>
				{/each}
			</select>
			<a
				href="/groups"
				aria-label="Gruppen verwalten"
				class="shrink-0 rounded-lg p-2 transition-colors {variant === 'dark'
					? 'text-slate-400 hover:bg-slate-800 hover:text-white'
					: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}"
			>
				<Settings class="h-4 w-4" />
			</a>
		</div>
	</div>
{/if}
