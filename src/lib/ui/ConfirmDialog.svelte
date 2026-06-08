<script lang="ts">
	import { X, AlertTriangle } from '@lucide/svelte';
	import Button from './Button.svelte';

	let {
		show = $bindable(false),
		title = 'Aktion bestätigen',
		message = 'Möchtest du diese Aktion wirklich ausführen?',
		confirmText = 'Bestätigen',
		cancelText = 'Abbrechen',
		variant = 'primary',
		onconfirm,
		oncancel
	}: {
		show: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'primary' | 'danger';
		onconfirm: () => void;
		oncancel?: () => void;
	} = $props();

	function handleConfirm() {
		show = false;
		onconfirm();
	}

	function handleCancel() {
		show = false;
		if (oncancel) oncancel();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-[999] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity duration-300 sm:items-center"
		onclick={handleCancel}
		onkeydown={handleKeyDown}
		aria-modal="true"
		role="dialog"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="animate-in slide-in-from-bottom sm:zoom-in-95 w-full max-w-md space-y-6 rounded-t-3xl bg-white p-6 shadow-xl duration-200 sm:rounded-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<header class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					{#if variant === 'danger'}
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"
						>
							<AlertTriangle size={20} />
						</div>
					{/if}
					<div>
						<h3 class="text-lg font-bold text-slate-900">{title}</h3>
					</div>
				</div>
				<button
					onclick={handleCancel}
					class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100"
					aria-label="Schließen"
				>
					<X size={20} />
				</button>
			</header>

			<p class="text-sm leading-relaxed text-slate-500">{message}</p>

			<footer class="flex flex-col gap-3 pt-2 sm:flex-row">
				<Button
					variant={variant === 'danger' ? 'danger' : 'primary'}
					class="min-h-[48px] flex-1"
					onclick={handleConfirm}
				>
					{confirmText}
				</Button>
				<Button variant="secondary" class="min-h-[48px] flex-1" onclick={handleCancel}>
					{cancelText}
				</Button>
			</footer>
		</div>
	</div>
{/if}
