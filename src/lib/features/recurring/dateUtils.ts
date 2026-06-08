import { SvelteDate } from 'svelte/reactivity';

export function getDueDates(
	startDateStr: string,
	dayOfMonth: number,
	frequency: string,
	lastGeneratedStr: string | null
): Date[] {
	const start = new SvelteDate(startDateStr);
	start.setUTCHours(12, 0, 0, 0);

	let current = new SvelteDate(start);
	
	const advance = (date: Date, freq: string) => {
		const d = new SvelteDate(date);
		const monthsToAdd = freq === 'monthly' ? 1 : freq === 'quarterly' ? 3 : freq === 'yearly' ? 12 : 0;
		d.setUTCDate(1);
		d.setUTCMonth(d.getUTCMonth() + monthsToAdd);
		
		const lastDayOfMonth = new SvelteDate(d);
		lastDayOfMonth.setUTCMonth(lastDayOfMonth.getUTCMonth() + 1, 0);
		const maxDay = lastDayOfMonth.getUTCDate();
		
		d.setUTCDate(Math.min(dayOfMonth, maxDay));
		return d;
	};

	if (lastGeneratedStr) {
		const lastGen = new SvelteDate(lastGeneratedStr);
		lastGen.setUTCHours(12, 0, 0, 0);
		current = advance(lastGen, frequency);
	} else {
		const firstDayOfMonth = new SvelteDate(current);
		firstDayOfMonth.setUTCDate(1);
		const lastDayOfMonth = new SvelteDate(firstDayOfMonth);
		lastDayOfMonth.setUTCMonth(lastDayOfMonth.getUTCMonth() + 1, 0);
		const maxDay = lastDayOfMonth.getUTCDate();
		current.setUTCDate(Math.min(dayOfMonth, maxDay));
	}

	const today = new SvelteDate();
	today.setUTCHours(12, 0, 0, 0);

	const dueDates: Date[] = [];

	if (current < start) {
		current = advance(current, frequency);
	}

	while (current <= today) {
		dueDates.push(new SvelteDate(current));
		current = advance(current, frequency);
	}

	return dueDates;
}
