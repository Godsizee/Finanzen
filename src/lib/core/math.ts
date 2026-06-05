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
export function calculateBalance(totalAmount: number, splitMode: string = '50_50', didIPay: boolean): number {
	if (splitMode === 'kasse') {
		return 0; // Kasse beeinflusst nicht das Schulden-Konto zwischen den Usern
	}
	
	const share = Math.round(totalAmount / 2);
	
	if (splitMode === 'deposit') {
		// Einzahlung in die Kasse (Ich habe Geld aus MEINER Tasche in die gemeinsame Kasse gelegt)
		// -> Partner schuldet mir 50% der Einzahlung
		return didIPay ? share : -share;
	}

	// Normale Ausgabe (50_50):
	// Ich zahle 100€ (didIPay=true). Mein Share ist 50€. Partner schuldet mir 50€. Balance = +50.
	// Partner zahlt 100€ (didIPay=false). Mein Share ist 50€. Ich schulde Partner 50€. Balance = -50.
	return didIPay ? share : -share;
}

