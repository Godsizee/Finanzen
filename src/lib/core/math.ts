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

export interface TransactionLike {
	total_amount: number;
	paid_by: string;
	split_mode: string;
	metadata?: any;
}

/**
 * Calculates my share for a transaction.
 */
export function getTransactionShare(
	totalAmount: number,
	splitMode: string,
	paidBy: string,
	myId: string,
	partnerId: string | undefined,
	myRatio: number, // between 0 and 1
	metadata?: any
): number {
	if (splitMode === 'kasse') {
		return 0;
	}

	if (splitMode === 'me') {
		return totalAmount;
	}
	if (splitMode === 'partner') {
		return 0;
	}
	if (splitMode === 'own_costs') {
		return paidBy === myId ? totalAmount : 0;
	}

	if (splitMode === 'custom' && metadata) {
		try {
			const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
			if (meta?.split_cents && meta.split_cents[myId] !== undefined) {
				return meta.split_cents[myId];
			} else if (meta?.split_percent && meta.split_percent[myId] !== undefined) {
				return Math.round(totalAmount * (meta.split_percent[myId] / 100));
			}
		} catch (e) {
			console.error('Error parsing custom split metadata', e);
		}
	}

	if (splitMode === 'income_ratio' || splitMode === 'fair') {
		if (metadata) {
			try {
				const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
				if (meta?.split_percent && meta.split_percent[myId] !== undefined) {
					return Math.round(totalAmount * (meta.split_percent[myId] / 100));
				}
			} catch (e) {
				// fallback
			}
		}
		return Math.round(totalAmount * myRatio);
	}

	return Math.round(totalAmount / 2);
}

/**
 * Calculates the balance change for the current user for a single transaction.
 */
export function calculateTransactionBalanceChange(
	tx: TransactionLike,
	myId: string,
	partnerId: string | undefined,
	myRatio: number
): number {
	const myShare = getTransactionShare(
		tx.total_amount,
		tx.split_mode,
		tx.paid_by,
		myId,
		partnerId,
		myRatio,
		tx.metadata
	);
	const myContribution = tx.paid_by === myId ? tx.total_amount : 0;
	return myContribution - myShare;
}

/**
 * Generates a deterministic 15-character lowercase alphanumeric ID from ruleId and dueDate.
 */
export function generateDeterministicId(ruleId: string, dateStr: string): string {
	const input = `${ruleId}_${dateStr.slice(0, 10)}`;
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	let seed = Math.abs(hash);
	for (let i = 0; i < 15; i++) {
		seed = (seed * 9301 + 49297) % 233280;
		result += chars[seed % chars.length];
	}
	return result;
}

