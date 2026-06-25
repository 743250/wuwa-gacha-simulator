// Unit tests for daily/commission.js — daily quest generation, completion, reset
// AI safety net: verify daily reward systems after tuning
import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S } from '../../src/state.js';

describe('daily/commission', () => {
  let commission;

  beforeAll(async () => {
    commission = await import('../../src/daily/commission.js');
  });

  beforeEach(() => {
    Object.assign(S, state0());
  });

  // ===== generateCommissions() =====
  describe('generateCommissions()', () => {
    it('returns 5 commissions (4 small + 1 challenge)', () => {
      const cs = commission.generateCommissions('2026-06-25');
      expect(cs).toHaveLength(5);
    });

    it('all commissions have required fields', () => {
      const cs = commission.generateCommissions('2026-06-25');
      cs.forEach(c => {
        expect(c.id).toBeTruthy();
        expect(c.name).toBeTruthy();
        expect(c.reward).toBeTruthy();
        expect(c.done).toBe(false);
      });
    });

    it('last commission is a challenge (id starts with c)', () => {
      const cs = commission.generateCommissions('2026-06-25');
      expect(cs[4].id).toMatch(/^c/);
    });

    it('same seed produces same commissions (deterministic)', () => {
      const cs1 = commission.generateCommissions('2026-06-25');
      const cs2 = commission.generateCommissions('2026-06-25');
      cs1.forEach((c, i) => {
        expect(c.id).toBe(cs2[i].id);
      });
    });

    it('seeds produce some variety across widely-spaced seeds', () => {
      // Timestamps with very different magnitudes to avoid hash periodicity
      const seeds = [1, 10000, 123456789, 987654321, '2026-01-01', '2026-07-01'];
      const seen = new Set();
      seeds.forEach(s => {
        const cs = commission.generateCommissions(s);
        const key = cs.map(c => c.id).join(',');
        seen.add(key);
      });
      expect(seen.size).toBeGreaterThan(1);
    });

    it('total daily astrite is 60 (4×10 + 20)', () => {
      const cs = commission.generateCommissions('2026-06-25');
      const totalAstrite = cs.reduce((sum, c) => sum + (c.reward.astrite || 0), 0);
      expect(totalAstrite).toBe(60);
    });
  });

  // ===== completeCommission() =====
  describe('completeCommission()', () => {
    it('awards rewards and marks done', () => {
      S.dailyCommissions = commission.generateCommissions('2026-06-25');
      const before = S.astrite;
      commission.completeCommission(0);
      expect(S.dailyCommissions[0].done).toBe(true);
      expect(S.astrite).toBeGreaterThanOrEqual(before + 10);
    });

    it('does nothing for already completed commission', () => {
      S.dailyCommissions = commission.generateCommissions('2026-06-25');
      S.dailyCommissions[0].done = true;
      const before = S.astrite;
      commission.completeCommission(0);
      expect(S.astrite).toBe(before);
    });

    it('does nothing for out-of-bounds index', () => {
      S.dailyCommissions = commission.generateCommissions('2026-06-25');
      const before = S.astrite;
      commission.completeCommission(99);
      expect(S.astrite).toBe(before);
    });
  });

  // ===== resetDailyIfNeeded() =====
  describe('resetDailyIfNeeded()', () => {
    it('generates new commissions on first call', () => {
      S.lastDailyReset = '';
      const changed = commission.resetDailyIfNeeded();
      expect(changed).toBe(true);
      expect(S.dailyCommissions).toHaveLength(5);
    });

    it('does not regenerate on same day', () => {
      commission.resetDailyIfNeeded();
      const cs = S.dailyCommissions;
      commission.resetDailyIfNeeded(); // same day
      expect(S.dailyCommissions).toBe(cs); // same array reference
    });

    it('regenerates on new day', () => {
      commission.resetDailyIfNeeded();
      const cs1 = S.dailyCommissions;
      S.lastDailyReset = 'not-today';
      const changed = commission.resetDailyIfNeeded();
      expect(changed).toBe(true);
    });
  });
});
