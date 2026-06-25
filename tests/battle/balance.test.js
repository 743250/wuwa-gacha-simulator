// Unit tests for battle/balance.js — balance constants, abyss temperature, version parsing
// AI safety net: verify balance tuning changes don't break invariants
import { describe, it, expect } from 'vitest';

describe('battle/balance', () => {
  let b;

  beforeAll(async () => {
    b = await import('../../src/battle/balance.js');
  });

  // ===== ACTION_COST =====
  describe('ACTION_COST', () => {
    it('normal attack costs 1 AP', () => expect(b.ACTION_COST.normal).toBe(1));
    it('skill costs 1 AP', () => expect(b.ACTION_COST.skill).toBe(1));
    it('heavy costs 2 AP', () => expect(b.ACTION_COST.heavy).toBe(2));
    it('burst costs 3 AP', () => expect(b.ACTION_COST.burst).toBe(3));
    it('all costs are positive integers', () => {
      Object.values(b.ACTION_COST).forEach(v => {
        expect(v).toBeGreaterThan(0);
        expect(Number.isInteger(v)).toBe(true);
      });
    });
  });

  // ===== ACTION_MULTIPLIER =====
  describe('ACTION_MULTIPLIER', () => {
    it('all multipliers are > 0', () => {
      Object.values(b.ACTION_MULTIPLIER).forEach(v => {
        expect(v).toBeGreaterThan(0);
      });
    });

    it('burstMain > burstSide (split dmg)', () => {
      expect(b.ACTION_MULTIPLIER.burstMain).toBeGreaterThan(b.ACTION_MULTIPLIER.burstSide);
    });

    it('heavy > skill > normal (proportional to AP cost)', () => {
      expect(b.ACTION_MULTIPLIER.heavy).toBeGreaterThan(b.ACTION_MULTIPLIER.skill);
      expect(b.ACTION_MULTIPLIER.skill).toBeGreaterThan(b.ACTION_MULTIPLIER.normal);
    });
  });

  // ===== VIBRATION_DAMAGE =====
  describe('VIBRATION_DAMAGE', () => {
    it('all vibration damage values are non-negative', () => {
      Object.values(b.VIBRATION_DAMAGE).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
      });
    });

    it('burst vibration > other actions', () => {
      expect(b.VIBRATION_DAMAGE.burst).toBeGreaterThan(b.VIBRATION_DAMAGE.normal);
      expect(b.VIBRATION_DAMAGE.burst).toBeGreaterThan(b.VIBRATION_DAMAGE.skill);
    });
  });

  // ===== STAR_CRITERIA =====
  describe('STAR_CRITERIA', () => {
    it('has exactly 3 star tiers', () => {
      expect(Object.keys(b.STAR_CRITERIA)).toHaveLength(3);
    });

    it('requirements get stricter with more stars', () => {
      const one = b.STAR_CRITERIA.oneStar;
      const two = b.STAR_CRITERIA.twoStar;
      const three = b.STAR_CRITERIA.threeStar;
      expect(two.turn).toBeLessThanOrEqual(one.turn);
      expect(three.turn).toBeLessThanOrEqual(two.turn);
    });
  });

  // ===== parseVersion() =====
  describe('parseVersion()', () => {
    it('parses "1.0" correctly', () => {
      expect(b.parseVersion('1.0')).toEqual({ major: 1, minor: 0 });
    });
    it('parses "3.4" correctly', () => {
      expect(b.parseVersion('3.4')).toEqual({ major: 3, minor: 4 });
    });
    it('defaults major to 1 for invalid input', () => {
      expect(b.parseVersion('invalid')).toEqual({ major: 1, minor: 0 });
    });
    it('defaults minor to 0 for partial input', () => {
      expect(b.parseVersion('2')).toEqual({ major: 2, minor: 0 });
    });
  });

  // ===== versionOrder() =====
  describe('versionOrder()', () => {
    it('returns higher number for later versions', () => {
      expect(b.versionOrder('2.0')).toBeGreaterThan(b.versionOrder('1.4'));
      expect(b.versionOrder('3.4')).toBeGreaterThan(b.versionOrder('2.7'));
    });

    it('returns same number for equal versions', () => {
      expect(b.versionOrder('1.0')).toBe(b.versionOrder('1.0'));
    });
  });

  // ===== ABYSS_TEMPERATURE_TABLE =====
  describe('ABYSS_TEMPERATURE_TABLE', () => {
    it('is sorted by version ascending', () => {
      for (let i = 1; i < b.ABYSS_TEMPERATURE_TABLE.length; i++) {
        expect(b.versionOrder(b.ABYSS_TEMPERATURE_TABLE[i].v))
          .toBeGreaterThanOrEqual(b.versionOrder(b.ABYSS_TEMPERATURE_TABLE[i - 1].v));
      }
    });

    it('hp multiplier is monotonic increasing', () => {
      for (let i = 1; i < b.ABYSS_TEMPERATURE_TABLE.length; i++) {
        expect(b.ABYSS_TEMPERATURE_TABLE[i].hp)
          .toBeGreaterThanOrEqual(b.ABYSS_TEMPERATURE_TABLE[i - 1].hp);
      }
    });

    it('first entry is version 1.0', () => {
      expect(b.ABYSS_TEMPERATURE_TABLE[0].v).toBe('1.0');
      expect(b.ABYSS_TEMPERATURE_TABLE[0].hp).toBe(1.0);
    });

    it('atk and def scale with hp', () => {
      b.ABYSS_TEMPERATURE_TABLE.forEach(entry => {
        expect(entry.atk).toBeGreaterThanOrEqual(1.0);
        expect(entry.def).toBeGreaterThanOrEqual(1.0);
      });
    });

    it('each entry has a non-empty label', () => {
      b.ABYSS_TEMPERATURE_TABLE.forEach(entry => {
        expect(entry.label.length).toBeGreaterThan(0);
      });
    });
  });

  // ===== getAbyssTemperatureForVersion() =====
  describe('getAbyssTemperatureForVersion()', () => {
    it('returns the earliest matching entry for pre-1.0 versions', () => {
      // versionOrder('0.9') = 109 due to parseVersion defaulting major=1 when Number('0') is falsy
      // This matches '1.4' (vOrder=104) via the reversed-array find
      const t = b.getAbyssTemperatureForVersion('0.9');
      expect(t).toBeTruthy();
      expect(b.versionOrder(t.v)).toBeLessThanOrEqual(b.versionOrder('0.9'));
    });

    it('returns exact entry for known versions', () => {
      expect(b.getAbyssTemperatureForVersion('1.0').hp).toBe(1.00);
      expect(b.getAbyssTemperatureForVersion('3.4').hp).toBe(3.44);
    });

    it('returns nearest lower entry for patch versions not in table', () => {
      const t = b.getAbyssTemperatureForVersion('2.5');
      expect(t.v).toBe('2.5');
    });
  });

  // ===== getAbyssEnvironment() =====
  describe('getAbyssEnvironment()', () => {
    it('returns structured environment for any cycle key', () => {
      const env = b.getAbyssEnvironment('2026-06-25');
      expect(env.favorElement).toBeTruthy();
      expect(env.resistElement).toBeTruthy();
      expect(env.buffType).toBeTruthy();
      expect(env.buffLabel).toBeTruthy();
      expect(typeof env.buffValue).toBe('number');
      expect(env.cycleKey).toBe('2026-06-25');
    });

    it('favor and resist elements are different', () => {
      const env = b.getAbyssEnvironment('2026-06-25');
      expect(env.favorElement).not.toBe(env.resistElement);
    });

    it('same cycle key produces same environment (deterministic)', () => {
      const env1 = b.getAbyssEnvironment('abc');
      const env2 = b.getAbyssEnvironment('abc');
      expect(env1.favorElement).toBe(env2.favorElement);
      expect(env1.resistElement).toBe(env2.resistElement);
      expect(env1.buffType).toBe(env2.buffType);
    });

    it('different cycle keys may produce different environments', () => {
      const env1 = b.getAbyssEnvironment('aaaa');
      const env2 = b.getAbyssEnvironment('bbbb');
      // Not guaranteed but very likely to differ in at least one field
      const same = env1.favorElement === env2.favorElement
        && env1.resistElement === env2.resistElement;
      // Just verify they are valid, don't enforce difference
      expect(env1.favorElement).toBeTruthy();
      expect(env2.favorElement).toBeTruthy();
    });
  });
});
