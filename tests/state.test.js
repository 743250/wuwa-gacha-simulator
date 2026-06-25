// Unit tests for state.js — global state utilities and default state invariants
// AI safety net: verify state structure after adding new state fields
import { describe, it, expect } from 'vitest';
import { state0, DAY, fmt, date, pick } from '../src/state.js';

describe('state', () => {
  // ===== DAY constant =====
  describe('DAY', () => {
    it('is 86400000 ms (24 hours)', () => {
      expect(DAY).toBe(86400000);
    });
  });

  // ===== fmt() =====
  describe('fmt()', () => {
    it('formats a timestamp as YYYY-MM-DD', () => {
      const d = new Date('2026-06-25T00:00:00Z').getTime();
      expect(fmt(d)).toBe('2026-06-25');
    });
  });

  // ===== date() =====
  describe('date()', () => {
    it('parses a YYYY-MM-DD string to UTC timestamp', () => {
      const d = date('2026-06-25');
      expect(d).toBe(new Date('2026-06-25T00:00:00Z').getTime());
    });
  });

  // ===== pick() =====
  describe('pick()', () => {
    it('returns an element from the array', () => {
      const arr = [1, 2, 3];
      const chosen = pick(arr);
      expect(arr).toContain(chosen);
    });
  });

  // ===== state0() default state invariants =====
  describe('state0() defaults', () => {
    let s;
    beforeEach(() => { s = state0(); });

    it('has required account fields', () => {
      expect(typeof s.total).toBe('number');
      expect(typeof s.astrite).toBe('number');
      expect(typeof s.lunite).toBe('number');
      expect(typeof s.spent).toBe('number');
      expect(s.total).toBe(0);
      expect(s.astrite).toBe(16000);
    });

    it('has all pity counters initialized to 0', () => {
      const expectedPools = [
        'eventChar', 'eventWeapon', 'collabChar', 'collabWeapon',
        'standardChar', 'standardWeapon', 'beginner', 'noviceChoice', 'noviceWeapon',
      ];
      expectedPools.forEach(pool => {
        expect(s.pity[pool]).toBe(0);
        expect(s.p4[pool]).toBe(0);
      });
    });

    it('has guarantee flags as booleans', () => {
      expect(typeof s.g.eventChar).toBe('boolean');
      expect(s.g.eventChar).toBe(false);
      expect(typeof s.g4.eventChar).toBe('boolean');
    });

    it('has team array with 3 null slots', () => {
      expect(s.team).toHaveLength(3);
      expect(s.team).toEqual([null, null, null]);
    });

    it('has all materials with default values', () => {
      expect(s.materials.exp_low).toBe(20);
      expect(s.materials.exp_mid).toBe(10);
      expect(s.materials.exp_high).toBe(5);
      expect(s.materials.exp_super).toBe(2);
      expect(s.materials.weapon_book).toBe(30);
    });

    it('has stamina fields', () => {
      expect(s.stamina).toBe(240);
      expect(s.staminaMax).toBe(240);
      expect(s.lastStaminaTick).toBe(0);
    });

    it('has daily commission fields', () => {
      expect(Array.isArray(s.dailyCommissions)).toBe(true);
      expect(typeof s.lastDailyReset).toBe('string');
    });

    it('has abyss fields', () => {
      expect(s.abyss).toBeTruthy();
      expect(typeof s.abyss.stars).toBe('object');
    });

    it('has podcast structure', () => {
      expect(s.podcast).toBeTruthy();
      expect(s.podcast.version).toBe('1.0');
      expect(s.podcast.level).toBe(0);
      expect(s.podcast.paid).toBe(false);
      expect(Array.isArray(s.podcast.claimedFree)).toBe(true);
      expect(Array.isArray(s.podcast.claimedPaid)).toBe(true);
    });

    it('has novice target fields', () => {
      expect(s.noviceTarget).toBe('守岸人');
      expect(s.noviceWeaponTarget).toBe('星序协响');
      expect(s.standardWeaponTarget).toBe('千古洑流');
    });

    it('has shop fields', () => {
      expect(typeof s.shopFirstTime).toBe('object');
      expect(typeof s.shopBuyCount).toBe('object');
    });

    it('has weekly boss fields', () => {
      expect(typeof s.weeklyBoss.used).toBe('object');
      expect(typeof s.weeklyBoss.lastReset).toBe('string');
    });

    it('materials object does not contain deprecated keys', () => {
      const deprecated = ['skill_mat', 'echo_tube', 'echo_tuner', 'boss_mat', 'weekly_skill_mat'];
      deprecated.forEach(key => {
        expect(s.materials[key]).toBeUndefined();
      });
    });
  });
});
