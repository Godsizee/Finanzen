<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'primary',
		class: className = '',
		onclick,
		type = 'button'
	}: {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'danger';
		class?: string;
		onclick?: (e: Event) => void;
		type?: 'button' | 'submit';
	} = $props();

	const baseClasses = "flex items-center justify-center min-h-[48px] px-6 rounded-2xl font-medium transition-transform active:scale-95";
	const variants = {
		primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
		secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
		danger: "bg-red-50 text-red-600 hover:bg-red-100"
	};
</script>

<button {type} {onclick} class="{baseClasses} {variants[variant]} {className}">
	{@render children()}
</button>
