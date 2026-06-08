<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'primary',
		class: className = '',
		onclick,
		type = 'button',
		disabled = false
	}: {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'danger';
		class?: string;
		onclick?: (e: Event) => void;
		type?: 'button' | 'submit';
		disabled?: boolean;
	} = $props();

	const baseClasses =
		'flex items-center justify-center min-h-[48px] px-6 rounded-2xl font-medium transition-all active:scale-95';
	const variants = {
		primary:
			'bg-slate-900 text-white hover:bg-slate-800 shadow-sm disabled:bg-slate-300 disabled:text-slate-500',
		secondary:
			'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400',
		danger: 'bg-red-50 text-red-600 hover:bg-red-100 disabled:bg-red-50/50 disabled:text-red-400'
	};
</script>

<button
	{type}
	{onclick}
	{disabled}
	class="{baseClasses} {variants[
		variant
	]} {className} disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60"
>
	{@render children()}
</button>
