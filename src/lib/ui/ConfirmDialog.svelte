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
		class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-[999] transition-opacity duration-300"
		onclick={handleCancel}
		onkeydown={handleKeyDown}
		aria-modal="true"
		role="dialog"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div 
			class="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-xl space-y-6 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
			onclick={(e) => e.stopPropagation()}
		>
			<header class="flex justify-between items-start">
				<div class="flex items-center gap-3">
					{#if variant === 'danger'}
						<div class="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center shrink-0">
							<AlertTriangle size={20} />
						</div>
					{/if}
					<div>
						<h3 class="text-lg font-bold text-slate-900">{title}</h3>
					</div>
				</div>
				<button 
					onclick={handleCancel} 
					class="p-1 text-slate-400 hover:bg-slate-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
					aria-label="Schließen"
				>
					<X size={20} />
				</button>
			</header>

			<p class="text-sm text-slate-500 leading-relaxed">{message}</p>

			<footer class="flex flex-col sm:flex-row gap-3 pt-2">
				<Button 
					variant={variant === 'danger' ? 'danger' : 'primary'} 
					class="flex-1 min-h-[48px]" 
					onclick={handleConfirm}
				>
					{confirmText}
				</Button>
				<Button 
					variant="secondary" 
					class="flex-1 min-h-[48px]" 
					onclick={handleCancel}
				>
					{cancelText}
				</Button>
			</footer>
		</div>
	</div>
{/if}
