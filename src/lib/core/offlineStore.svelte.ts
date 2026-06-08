import { browser } from '$app/environment';

export type OfflineAction = {
	id: string;
	type: 'CREATE_TX' | 'UPDATE_TX' | 'DELETE_TX';
	payload: any;
	timestamp: number;
};

class OfflineStore {
	queue = $state<OfflineAction[]>([]);
	isOnline = $state(true);

	constructor() {
		if (browser) {
			this.isOnline = navigator.onLine;
			window.addEventListener('online', () => this.handleOnline());
			window.addEventListener('offline', () => (this.isOnline = false));

			const stored = localStorage.getItem('fairshare_offline_queue');
			if (stored) {
				try {
					this.queue = JSON.parse(stored);
				} catch (e) {
					this.queue = [];
				}
			}
		}
	}

	addAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
		const newAction: OfflineAction = {
			...action,
			id: crypto.randomUUID(),
			timestamp: Date.now()
		};
		this.queue.push(newAction);
		this.save();
	}

	removeAction(id: string) {
		this.queue = this.queue.filter((a) => a.id !== id);
		this.save();
	}

	private save() {
		if (browser) {
			localStorage.setItem('fairshare_offline_queue', JSON.stringify(this.queue));
		}
	}

	private async handleOnline() {
		this.isOnline = true;
		if (this.queue.length === 0) return;

		// Note: The actual sync logic should be implemented where the APIs are available
		// to avoid circular dependencies. We just emit an event or let the transaction store
		// observe the online status.
		window.dispatchEvent(new CustomEvent('fairshare_sync_queue'));
	}
}

export const offlineStore = new OfflineStore();
