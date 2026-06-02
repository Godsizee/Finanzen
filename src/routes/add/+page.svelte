<script lang="ts">
	import { goto } from '$app/navigation';
	import { transactionStore } from '$lib/features/transactions/store.svelte';
	import { toCents } from '$lib/core/math';
	import Button from '$lib/ui/Button.svelte';
	import Input from '$lib/ui/Input.svelte';
	import { ArrowLeft } from '@lucide/svelte';

	let amount = $state('');
	let note = $state('');
	// Default to user A paying the full amount and splitting 50/50
	let payer = $state<'a' | 'b'>('a');
	
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!amount || isNaN(parseFloat(amount.replace(',', '.')))) {
			alert('Bitte einen gültigen Betrag eingeben');
			return;
		}

		loading = true;
		const totalCents = toCents(amount);
		
		await transactionStore.addTransaction({
			total_amount: totalCents,
			date: new Date().toISOString(),
			paid_amount_user_a: payer === 'a' ? totalCents : 0,
			paid_amount_user_b: payer === 'b' ? totalCents : 0,
			split_mode: '50_50',
			note: note || 'Ausgabe'
		});

		loading = false;
		goto('/');
	}
</script>

<div class="p-4 pt-8 h-full flex flex-col bg-slate-50">
	<header class="mb-8 flex items-center gap-4">
		<button onclick={() => goto('/')} class="p-2 -ml-2 rounded-full hover:bg-slate-200 transition-colors" aria-label="Zurück">
			<ArrowLeft size={24} class="text-slate-900" />
		</button>
		<h1 class="text-xl font-bold tracking-tight text-slate-900">Ausgabe hinzufügen</h1>
	</header>

	<form onsubmit={handleSubmit} class="flex flex-col gap-6 flex-1">
		<Input 
			label="Betrag (€)" 
			type="text" 
			inputmode="decimal" 
			placeholder="0,00" 
			required 
			bind:value={amount} 
			class="text-lg"
		/>

		<Input 
			label="Wofür?" 
			type="text" 
			placeholder="Supermarkt, Tanken..." 
			bind:value={note} 
		/>

		<div class="flex flex-col gap-2 mt-2">
			<span class="text-sm font-medium text-slate-700">Wer hat bezahlt?</span>
			<div class="flex gap-2">
				<Button 
					type="button" 
					variant={payer === 'a' ? 'primary' : 'secondary'} 
					class="flex-1"
					onclick={() => payer = 'a'}
				>
					Ich
				</Button>
				<Button 
					type="button" 
					variant={payer === 'b' ? 'primary' : 'secondary'} 
					class="flex-1"
					onclick={() => payer = 'b'}
				>
					Partner
				</Button>
			</div>
		</div>

		<div class="mt-auto pt-6">
			<Button type="submit" variant="primary" class="w-full">
				{loading ? 'Wird gespeichert...' : 'Speichern'}
			</Button>
		</div>
	</form>
</div>
