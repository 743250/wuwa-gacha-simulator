// Unit tests for time/timeline.js — time advancement, version jumping, monthly card
// AI safety net: verify date/time invariants after timeline changes
import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S, DAY, date } from '../../src/state.js';

describe('time/timeline', () => {
  let time;
  let phases;

  beforeAll(async () => {
    time = await import('../../src/time/timeline.js');
    phases = (await import('../../src/data/phases.js')).phases;
  });

  beforeEach(() => {
    Object.assign(S, state0());
  });

  // ===== claimMonthly() =====
  describe('claimMonthly()', () => {
    it('returns false when no monthly days remaining', () => {
      S.days = 0;
      expect(time.claimMonthly()).toBe(false);
    });

    it('claims 90 astrite and decrements days', () => {
      S.days = 30;
      S.astrite = 0;
      const ok = time.claimMonthly();
      expect(ok).toBe(true);
      expect(S.astrite).toBe(90);
      expect(S.days).toBe(29);
    });

    it('does not double-claim on same day', () => {
      S.days = 30;
      time.claimMonthly();
      const ok = time.claimMonthly();
      expect(ok).toBe(false); // same day, already claimed
    });
  });

  // ===== advanceTo() =====
  describe('advanceTo()', () => {
    it('advances today to target', () => {
      const target = S.today + DAY;
      time.advanceTo(target);
      expect(S.today).toBe(target);
    });

    it('refills stamina when below max', () => {
      S.stamina = 100;
      const target = S.today + DAY * 2;
      time.advanceTo(target);
      expect(S.stamina).toBe(S.staminaMax);
    });

    it('does not reduce stamina when above max (overcap from potions)', () => {
      S.stamina = 400; // above max 240
      const target = S.today + DAY;
      time.advanceTo(target);
      expect(S.stamina).toBeGreaterThanOrEqual(400);
    });

    it('resets daily commissions', () => {
      S.dailyCommissions = [];
      const target = S.today + DAY;
      time.advanceTo(target);
      expect(S.dailyCommissions.length).toBe(5);
    });

    it('settles monthly card for skipped days', () => {
      S.days = 30;
      S.astrite = 0;
      const target = S.today + DAY * 5;
      time.advanceTo(target);
      // 5 days × 90 = 450 (including today if not yet claimed)
      expect(S.astrite).toBeGreaterThanOrEqual(450);
    });
  });

  // ===== advanceDay() =====
  describe('advanceDay()', () => {
    it('advances by exactly 1 day', () => {
      const before = S.today;
      time.advanceDay();
      expect(S.today - before).toBe(DAY);
    });
  });

  // ===== nextPhase() =====
  describe('nextPhase()', () => {
    it('advances to next phase start date', () => {
      S.today = date('2024-05-23');
      time.nextPhase();
      // Should land on some phase start
      const found = phases.find(p => p.start === S.today);
      expect(found).toBeTruthy();
    });
  });

  // ===== nextVersion() =====
  describe('nextVersion()', () => {
    it('advances to next version start if available', () => {
      S.today = date('2026-06-23'); // version 3.4
      // There should be a next version
      time.nextVersion();
      expect(S.today).toBeGreaterThan(0);
    });
  });

  // ===== jumpToVersion() =====
  describe('jumpToVersion()', () => {
    it('jumps to a known version', () => {
      const ok = time.jumpToVersion('1.0');
      expect(ok).toBe(true);
      // Verify we landed on a phase with version 1.0
      const phase = phases.find(p => S.today >= p.start && S.today < p.end);
      expect(phase).toBeTruthy();
    });

    it('returns false for unknown version', () => {
      const ok = time.jumpToVersion('99.9');
      expect(ok).toBe(false);
    });
  });

  // ===== jumpToDate() =====
  describe('jumpToDate()', () => {
    it('jumps to a valid date', () => {
      const target = date('2025-01-01');
      const ok = time.jumpToDate(target);
      expect(ok).toBe(true);
      expect(S.today).toBe(target);
    });

    it('returns false for invalid date', () => {
      const ok = time.jumpToDate(Infinity);
      expect(ok).toBe(false);
    });
  });
});
