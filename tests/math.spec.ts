import { test, expect } from '@playwright/test';
import {
	toCents,
	getTransactionShare,
	calculateTransactionBalanceChange,
	generateDeterministicId
} from '../src/lib/core/math';

test.describe('Math Helpers Unit Tests', () => {
	test('toCents converts string and number to cents correctly', () => {
		expect(toCents('15,50')).toBe(1550);
		expect(toCents('15.5')).toBe(1550);
		expect(toCents(15.5)).toBe(1550);
		expect(toCents('0')).toBe(0);
		expect(toCents('invalid')).toBe(0);
	});

	test('getTransactionShare splits correctly', () => {
		// 50_50 split
		expect(getTransactionShare(1000, '50_50', 'user1', 'user1', 'user2', 0.6)).toBe(500);

		// income_ratio split without metadata (uses myRatio)
		expect(getTransactionShare(1000, 'income_ratio', 'user1', 'user1', 'user2', 0.6)).toBe(600);
		expect(getTransactionShare(1000, 'income_ratio', 'user1', 'user2', 'user1', 0.4)).toBe(400);

		// income_ratio split with metadata snapshot
		const meta = { split_percent: { user1: 70, user2: 30 } };
		expect(getTransactionShare(1000, 'income_ratio', 'user1', 'user1', 'user2', 0.6, meta)).toBe(700);

		// me split (Nur Ich)
		expect(getTransactionShare(1000, 'me', 'user1', 'user1', 'user2', 0.6)).toBe(1000);
		expect(getTransactionShare(1000, 'me', 'user2', 'user1', 'user2', 0.6)).toBe(1000);

		// partner split (Nur Partner)
		expect(getTransactionShare(1000, 'partner', 'user1', 'user1', 'user2', 0.6)).toBe(0);

		// custom split using metadata cents
		const metaCustomCents = { split_cents: { user1: 250, user2: 750 } };
		expect(getTransactionShare(1000, 'custom', 'user1', 'user1', 'user2', 0.6, metaCustomCents)).toBe(250);

		// custom split using metadata percent
		const metaCustomPct = { split_percent: { user1: 20, user2: 80 } };
		expect(getTransactionShare(1000, 'custom', 'user1', 'user1', 'user2', 0.6, metaCustomPct)).toBe(200);
	});

	test('calculateTransactionBalanceChange delta logic', () => {
		const myId = 'user1';
		const partnerId = 'user2';
		const myRatio = 0.6; // 60%

		// I paid 1000, split 50_50: I contribute 1000, my share is 500 => balance change is +500
		const tx1 = { total_amount: 1000, paid_by: myId, split_mode: '50_50' };
		expect(calculateTransactionBalanceChange(tx1, myId, partnerId, myRatio)).toBe(500);

		// Partner paid 1000, split 50_50: I contribute 0, my share is 500 => balance change is -500
		const tx2 = { total_amount: 1000, paid_by: partnerId, split_mode: '50_50' };
		expect(calculateTransactionBalanceChange(tx2, myId, partnerId, myRatio)).toBe(-500);

		// I paid 1000, split income_ratio (60%): I contribute 1000, my share is 600 => balance change is +400
		const tx3 = { total_amount: 1000, paid_by: myId, split_mode: 'income_ratio' };
		expect(calculateTransactionBalanceChange(tx3, myId, partnerId, myRatio)).toBe(400);

		// Partner paid 1000, split income_ratio (60%): I contribute 0, my share is 600 => balance change is -600
		const tx4 = { total_amount: 1000, paid_by: partnerId, split_mode: 'income_ratio' };
		expect(calculateTransactionBalanceChange(tx4, myId, partnerId, myRatio)).toBe(-600);

		// Deposit of 1000 by me: I contribute 1000, my share of cash pool is 500 => balance change is +500
		const tx5 = { total_amount: 1000, paid_by: myId, split_mode: 'deposit' };
		expect(calculateTransactionBalanceChange(tx5, myId, partnerId, myRatio)).toBe(500);
	});

	test('generateDeterministicId is unique, deterministic, and valid PocketBase ID', () => {
		const ruleId = 'rec1234567890ab';
		const dateStr = '2026-06-08';
		const id1 = generateDeterministicId(ruleId, dateStr);
		const id2 = generateDeterministicId(ruleId, dateStr);

		expect(id1).toBe(id2);
		expect(id1.length).toBe(15);
		expect(/^[a-z0-9]+$/.test(id1)).toBe(true);

		const differentDateId = generateDeterministicId(ruleId, '2026-06-09');
		expect(id1).not.toBe(differentDateId);
	});
});
