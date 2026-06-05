/**
 * Converts a euro string (e.g., "15,50" or "15.5") to cents (integer)
 */
export function toCents(amount: string | number): number {
	if (typeof amount === 'number') {
		return Math.round(amount * 100);
	}
	const normalized = amount.replace(',', '.');
	const parsed = parseFloat(normalized);
	if (isNaN(parsed)) return 0;
	return Math.round(parsed * 100);
}

/**
 * Formats a cent value to a localized Euro string (e.g., 1550 -> "15,50 €")
 */
export function formatCurrency(cents: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR'
	}).format(cents / 100);
}

/**
 * Calculates the balance for a specific user based on a transaction.
 * Positive balance means the user is owed money (Guthaben).
 * Negative balance means the user owes money (Schulden).
 *
 * @param totalAmount Total transaction amount in cents
 * @param userPaidAmount The amount the user actually paid in cents
 * @param splitMode "50_50" or "custom" (custom not fully implemented here yet)
 */
export function calculateBalance(totalAmount: number, userPaidAmount: number, splitMode: string = '50_50'): number {
	if (splitMode === 'kasse') {
		return 0;
	}
	
	let userShare = 0;
	if (splitMode === '50_50' || splitMode === 'deposit') {
		userShare = Math.round(totalAmount / 2);
	} else {
		userShare = Math.round(totalAmount / 2);
	}
	
	// Balance = Ist (Paid) - Soll (Share)
	return userPaidAmount - userShare;
}

