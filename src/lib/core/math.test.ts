import { describe, it, expect } from 'vitest';
import { calculateTransactionBalanceChange, toCents, formatCurrency } from './math';

describe('math.ts', () => {
	describe('toCents', () => {
		it('converts correctly', () => {
			expect(toCents('10,50')).toBe(1050);
			expect(toCents('10.5')).toBe(1050);
			expect(toCents('0,99')).toBe(99);
		});
	});

	describe('formatCurrency', () => {
		it('formats correctly', () => {
			expect(formatCurrency(1050)).toBe('10,50\u00A0€');
		});
	});

	describe('calculateTransactionBalanceChange', () => {
		const txBase = { total_amount: 1000, metadata: null };
		const myId = 'user_me';
		const partnerId = 'user_partner';

		it('50_50: I paid, my balance goes up by 500 (partner owes me)', () => {
			const tx = { ...txBase, paid_by: myId, split_mode: '50_50' };
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.5)).toBe(500);
		});

		it('50_50: Partner paid, my balance goes down by 500 (I owe partner)', () => {
			const tx = { ...txBase, paid_by: partnerId, split_mode: '50_50' };
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.5)).toBe(-500);
		});

		it('income_ratio: I paid, ratio is 0.6', () => {
			const tx = { ...txBase, paid_by: myId, split_mode: 'income_ratio' };
			// my ratio is 0.6, so I owe 60%. I paid 100%. Partner owes me 40%.
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.6)).toBe(400);
		});

		it('income_ratio: Partner paid, ratio is 0.6', () => {
			const tx = { ...txBase, paid_by: partnerId, split_mode: 'income_ratio' };
			// my ratio is 0.6, so I owe 60%. Partner paid 100%. I owe partner 60%.
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.6)).toBe(-600);
		});

		it('me: I paid for myself, balance change 0', () => {
			const tx = { ...txBase, paid_by: myId, split_mode: 'me' };
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.5)).toBe(0);
		});

		it('me: Partner paid for me, I owe 1000', () => {
			const tx = { ...txBase, paid_by: partnerId, split_mode: 'me' };
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.5)).toBe(-1000);
		});

		it('partner: I paid for partner, partner owes me 1000', () => {
			const tx = { ...txBase, paid_by: myId, split_mode: 'partner' };
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.5)).toBe(1000);
		});

		it('custom: amount split', () => {
			const tx = {
				...txBase,
				paid_by: myId,
				split_mode: 'custom',
				metadata: { split_cents: { [myId]: 300, [partnerId]: 700 } }
			};
			// I paid 1000, but my share is 300. Partner owes me 700.
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.5)).toBe(700);
		});

		it('custom: percent split', () => {
			const tx = {
				...txBase,
				paid_by: myId,
				split_mode: 'custom',
				metadata: { split_percent: { [myId]: 20, [partnerId]: 80 } }
			};
			// I paid 1000, my share is 20%. Partner owes me 800.
			expect(calculateTransactionBalanceChange(tx, myId, partnerId, 0.5)).toBe(800);
		});
	});
});
