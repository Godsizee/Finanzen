class ToastStore {
	toasts = $state<
		{
			id: string;
			message: string;
			type: 'success' | 'error' | 'info';
			actionName?: string;
			actionFn?: () => void;
			actionName2?: string;
			actionFn2?: () => void;
		}[]
	>([]);

	add(
		message: string,
		type: 'success' | 'error' | 'info' = 'info',
		actionName?: string,
		actionFn?: () => void,
		actionName2?: string,
		actionFn2?: () => void
	) {
		const id = crypto.randomUUID();
		this.toasts = [...this.toasts, { id, message, type, actionName, actionFn, actionName2, actionFn2 }];
		setTimeout(() => {
			this.toasts = this.toasts.filter((t) => t.id !== id);
		}, 5000);
	}

	success(
		message: string,
		actionName?: string,
		actionFn?: () => void,
		actionName2?: string,
		actionFn2?: () => void
	) {
		this.add(message, 'success', actionName, actionFn, actionName2, actionFn2);
	}

	error(message: string) {
		this.add(message, 'error');
	}

	info(message: string) {
		this.add(message, 'info');
	}
}

export const toast = new ToastStore();
