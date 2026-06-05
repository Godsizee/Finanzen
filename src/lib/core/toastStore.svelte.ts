class ToastStore {
	toasts = $state<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

	add(message: string, type: 'success' | 'error' | 'info' = 'info') {
		const id = crypto.randomUUID();
		this.toasts = [...this.toasts, { id, message, type }];
		setTimeout(() => {
			this.toasts = this.toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	success(message: string) {
		this.add(message, 'success');
	}

	error(message: string) {
		this.add(message, 'error');
	}

	info(message: string) {
		this.add(message, 'info');
	}
}

export const toast = new ToastStore();
