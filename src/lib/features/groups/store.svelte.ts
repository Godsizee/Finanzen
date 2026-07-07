import { groupApi, generateInviteCode } from './api';
import { authStore } from '$lib/features/auth/authStore.svelte';
import { toast } from '$lib/core/toastStore.svelte';
import { handleAppError } from '$lib/core/errorHandler';
import { browser } from '$app/environment';
import type { RecordModel } from 'pocketbase';

const ACTIVE_GROUP_KEY = 'fairshare_active_group';
export const GROUP_CHANGED_EVENT = 'fairshare_group_changed';

class GroupStore {
	groups = $state<RecordModel[]>([]);
	members = $state<RecordModel[]>([]);
	activeGroupId = $state<string | null>(browser ? localStorage.getItem(ACTIVE_GROUP_KEY) : null);
	loading = $state(false);
	error = $state<string | null>(null);

	activeGroup = $derived(this.groups.find((g) => g.id === this.activeGroupId) ?? null);

	private initPromise: Promise<void> | null = null;

	/** Idempotent: lädt Gruppen einmalig, legt bei Bedarf eine Default-Gruppe an
	 *  und stellt sicher, dass eine aktive Gruppe gesetzt ist. */
	init(): Promise<void> {
		if (!authStore.isLoggedIn) return Promise.resolve();
		if (!this.initPromise) {
			this.initPromise = this.loadAll().catch((err) => {
				this.initPromise = null; // Retry beim nächsten Aufruf erlauben
				throw err;
			});
		}
		return this.initPromise;
	}

	private async loadAll() {
		this.loading = true;
		this.error = null;
		try {
			this.groups = await groupApi.getMyGroups();

			if (this.groups.length === 0) {
				// Neuer User ohne Gruppe: Default-Gruppe anlegen
				await this.createGroup('Meine Kasse', { silent: true });
			}

			// Aktive Gruppe validieren bzw. initial setzen
			if (!this.activeGroupId || !this.groups.some((g) => g.id === this.activeGroupId)) {
				this.persistActive(this.groups[0]?.id ?? null);
			}

			await this.loadMembers();
		} catch (err) {
			const appErr = handleAppError(err);
			this.error = appErr.message;
			throw err;
		} finally {
			this.loading = false;
		}
	}

	private persistActive(id: string | null) {
		this.activeGroupId = id;
		if (browser) {
			if (id) localStorage.setItem(ACTIVE_GROUP_KEY, id);
			else localStorage.removeItem(ACTIVE_GROUP_KEY);
		}
	}

	async loadMembers() {
		if (!this.activeGroupId) {
			this.members = [];
			return;
		}
		try {
			this.members = await groupApi.getMembers(this.activeGroupId);
		} catch (err) {
			console.error('Fehler beim Laden der Gruppenmitglieder', err);
			this.members = [];
		}
	}

	/** Gruppe wechseln: setzt die aktive Gruppe und benachrichtigt die Daten-Stores. */
	async setActive(id: string) {
		if (id === this.activeGroupId) return;
		if (!this.groups.some((g) => g.id === id)) return;
		this.persistActive(id);
		await this.loadMembers();
		if (browser) window.dispatchEvent(new CustomEvent(GROUP_CHANGED_EVENT));
	}

	async createGroup(name: string, opts: { silent?: boolean } = {}): Promise<RecordModel | null> {
		const me = authStore.currentUser;
		if (!me) return null;
		try {
			const group = await groupApi.create({
				name,
				created_by: me.id,
				invite_code: generateInviteCode(),
				default_split_mode: me.cost_sharing_mode || '50_50'
			});
			await groupApi.addMember(group.id, me.id, 'admin');
			this.groups = [...this.groups, group];
			if (!opts.silent) toast.success(`Gruppe „${name}" erstellt!`);
			return group;
		} catch (err) {
			const appErr = handleAppError(err);
			if (!opts.silent) toast.error('Gruppe konnte nicht erstellt werden: ' + appErr.message);
			throw err;
		}
	}

	/** Beitritt per Einladungslink (/invite/[token] mit token = groupId~code). */
	async joinByInvite(groupId: string, code: string): Promise<boolean> {
		const me = authStore.currentUser;
		if (!me) return false;
		try {
			await groupApi.addMember(groupId, me.id, 'member', code);
		} catch (err: unknown) {
			const status = (err as { status?: number }).status;
			if (status === 400) {
				// Unique-Index (group,user): bereits Mitglied → einfach aktivieren
				const already = this.groups.some((g) => g.id === groupId);
				if (!already) {
					toast.error('Beitritt fehlgeschlagen. Ist der Einladungslink noch gültig?');
					return false;
				}
			} else {
				handleAppError(err);
				return false;
			}
		}
		this.groups = await groupApi.getMyGroups();
		await this.setActive(groupId);
		toast.success('Du bist der Gruppe beigetreten!');
		return true;
	}

	/** Erstellt eine gemeinsame Gruppe für ein frisch bestätigtes Partner-Paar. */
	async createSharedGroupWithPartner(partnerId: string): Promise<void> {
		await this.init();
		// Existiert bereits eine gemeinsame Gruppe mit dem Partner?
		for (const g of this.groups) {
			const members = await groupApi.getMembers(g.id);
			if (members.some((m) => m.user === partnerId)) return;
		}
		const group = await this.createGroup('Gemeinsame Kasse', { silent: true });
		if (!group) return;
		await groupApi.addMember(group.id, partnerId, 'member');
		await this.setActive(group.id);
		toast.success('Gemeinsame Gruppe „Gemeinsame Kasse" erstellt!');
	}

	async regenerateInviteCode(): Promise<void> {
		if (!this.activeGroupId) return;
		try {
			const updated = await groupApi.update(this.activeGroupId, {
				invite_code: generateInviteCode()
			});
			this.groups = this.groups.map((g) => (g.id === updated.id ? updated : g));
			toast.success('Neuer Einladungslink generiert.');
		} catch (err) {
			const appErr = handleAppError(err);
			toast.error('Einladungslink konnte nicht erneuert werden: ' + appErr.message);
		}
	}

	inviteLink = $derived.by(() => {
		const g = this.activeGroup;
		if (!g || !g.invite_code || !browser) return '';
		return `${window.location.origin}/invite/${g.id}~${g.invite_code}`;
	});

	/** Beim Logout aufrufen: Zustand zurücksetzen. */
	reset() {
		this.groups = [];
		this.members = [];
		this.initPromise = null;
		this.persistActive(null);
	}
}

export const groupStore = new GroupStore();
