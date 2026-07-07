import { pb } from '$lib/core/pb';
import { authStore } from './authStore.svelte';
import type { RecordModel } from 'pocketbase';
import { toast } from '$lib/core/toastStore.svelte';

class PartnerStore {
	partnerStatus = $state<'none' | 'active' | 'pending_sent' | 'pending_received'>('none');
	partnerUser = $state<RecordModel | null>(null);

	async loadPartnerStatus() {
		if (!authStore.isLoggedIn || !authStore.currentUser) return;

		const me = authStore.currentUser;
		const myPartnerId = me.partner;

		try {
			if (myPartnerId) {
				// Ich habe jemanden als Partner eingetragen. Hat er mich auch eingetragen?
				const p = await pb.collection('users').getOne(myPartnerId);
				this.partnerUser = p;

				if (p.partner === me.id) {
					this.partnerStatus = 'active';
				} else {
					this.partnerStatus = 'pending_sent';
				}
			} else {
				// Hat jemand mich eingetragen?
				const records = await pb.collection('users').getList(1, 1, {
					filter: pb.filter('partner = {:meId}', { meId: me.id })
				});

				if (records.items.length > 0) {
					this.partnerUser = records.items[0];
					this.partnerStatus = 'pending_received';
				} else {
					this.partnerUser = null;
					this.partnerStatus = 'none';
				}
			}
		} catch (err) {
			console.error('Fehler beim Laden des Partner-Status', err);
		}
	}

	async searchByEmail(email: string): Promise<RecordModel | null> {
		if (!email) return null;
		try {
			const res = await pb
				.collection('users')
				.getFirstListItem(pb.filter('email = {:email}', { email }));
			if (res.id === authStore.currentUser?.id) {
				toast.error('Du kannst dich nicht selbst einladen!');
				return null;
			}
			return res;
		} catch {
			return null;
		}
	}

	async sendInvite(userId: string) {
		if (!authStore.currentUser) return;
		try {
			const updatedMe = await pb.collection('users').update(authStore.currentUser.id, {
				partner: userId
			});
			authStore.currentUser = updatedMe;
			toast.success('Einladung gesendet!');
			await this.loadPartnerStatus();
		} catch {
			toast.error('Einladung konnte nicht gesendet werden.');
		}
	}

	async acceptInvite() {
		if (!authStore.currentUser || !this.partnerUser) return;
		try {
			const updatedMe = await pb.collection('users').update(authStore.currentUser.id, {
				partner: this.partnerUser.id
			});
			authStore.currentUser = updatedMe;
			toast.success('Partnerschaft erfolgreich bestätigt!');
			await this.loadPartnerStatus();

			// M1: Partner teilen sich eine gemeinsame Gruppe (Mandant)
			try {
				const { groupStore } = await import('$lib/features/groups/store.svelte');
				await groupStore.createSharedGroupWithPartner(this.partnerUser.id);
			} catch (err) {
				console.error('Gemeinsame Gruppe konnte nicht erstellt werden', err);
			}
		} catch {
			toast.error('Fehler beim Bestätigen der Partnerschaft.');
		}
	}

	async rejectInvite() {
		if (!authStore.currentUser || !this.partnerUser) return;
		try {
			// Der andere hat mich als Partner gesetzt. Ich setze es bei ihm auf null.
			await pb.collection('users').update(this.partnerUser.id, {
				partner: null
			});
			toast.info('Einladung abgelehnt.');
			await this.loadPartnerStatus();
		} catch {
			toast.error('Fehler beim Ablehnen der Einladung.');
		}
	}

	async cancelPartnership() {
		if (!authStore.currentUser || !this.partnerUser) return;
		try {
			// Wir müssen es bei beiden auf null setzen. Da wir das Recht dazu haben (Update Rule):
			await pb.collection('users').update(this.partnerUser.id, { partner: null });
			const updatedMe = await pb
				.collection('users')
				.update(authStore.currentUser.id, { partner: null });

			authStore.currentUser = updatedMe;
			toast.info('Verpartnerung aufgehoben.');
			await this.loadPartnerStatus();
		} catch {
			toast.error('Fehler beim Aufheben der Verpartnerung.');
		}
	}
}

export const partnerStore = new PartnerStore();
