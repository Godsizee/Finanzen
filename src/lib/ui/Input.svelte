<script lang="ts">
	let {
		value = $bindable(),
		label,
		type = 'text',
		inputmode,
		placeholder = '',
		required = false,
		autofocus = false,
		min,
		max,
		step,
		class: className = ''
	}: {
		value: any;
		label?: string;
		type?: 'text' | 'number' | 'date' | 'password' | 'email';
		inputmode?: 'text' | 'decimal' | 'numeric';
		placeholder?: string;
		required?: boolean;
		autofocus?: boolean;
		min?: string | number;
		max?: string | number;
		step?: string | number;
		class?: string;
	} = $props();
</script>

<label class="flex flex-col gap-2 {className}">
	{#if label}
		<span class="text-sm font-medium text-slate-700">{label}</span>
	{/if}
	<input
		{type}
		{inputmode}
		{placeholder}
		{required}
		{autofocus}
		{min}
		{max}
		{step}
		bind:value
		class="min-h-[48px] px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
	/>
</label>
