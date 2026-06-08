import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDueDates } from './dateUtils';

describe('Date Utils', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-08T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('getDueDates', () => {
		it('generates monthly dates correctly', () => {
			const dates = getDueDates('2026-01-01T12:00:00Z', 1, 'monthly', null);
			expect(dates.length).toBe(6);
			expect(dates[0].toISOString().startsWith('2026-01-01')).toBe(true);
			expect(dates[5].toISOString().startsWith('2026-06-01')).toBe(true);
		});

		it('handles last_generated correctly', () => {
			const dates = getDueDates('2026-01-01T12:00:00Z', 1, 'monthly', '2026-04-01T12:00:00Z');
			expect(dates.length).toBe(2);
			expect(dates[0].toISOString().startsWith('2026-05-01')).toBe(true);
			expect(dates[1].toISOString().startsWith('2026-06-01')).toBe(true);
		});

		it('handles February 28th/29th correctly when dayOfMonth is 31', () => {
			const dates = getDueDates('2026-01-31T12:00:00Z', 31, 'monthly', null);
			expect(dates.length).toBe(5); 
			expect(dates[0].toISOString().startsWith('2026-01-31')).toBe(true);
			expect(dates[1].toISOString().startsWith('2026-02-28')).toBe(true);
			expect(dates[2].toISOString().startsWith('2026-03-31')).toBe(true);
			expect(dates[3].toISOString().startsWith('2026-04-30')).toBe(true);
			expect(dates[4].toISOString().startsWith('2026-05-31')).toBe(true);
		});
	});
});
