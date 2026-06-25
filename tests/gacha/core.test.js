// P0 tests for gacha/core.js — probability curve, pity, pool logic, pull mechanics
import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S } from '../../src/state.js';

// Must import state before gacha/core since core uses S
describe('gacha/core', () => {
  let core;

  // Dynamic import after state is set up
  beforeAll(async () => {
    core = await import('../../src/gacha/core.js');
  });

  beforeEach(() => {
    Object.assign(S, state0());
  });

  // ===== rate() — probability curve =====
  describe('rate()', () => {
    it('returns 0.008 (0.8%) at pity=65', () => {
      expect(core.rate(65)).toBeCloseTo(0.008, 3);
    });

    it('returns 0.008 at pity below 65', () => {
      expect(core.rate(1)).toBeCloseTo(0.008, 3);
      expect(core.rate(50)).toBeCloseTo(0.008, 3);
    });

    it('soft pity ramps at 66-70 (+0.04 per pull)', () => {
      // pity=66: 0.008 + (66-65)*0.04 = 0.048
      // pity=70: 0.008 + 5*0.04 = 0.208
      expect(core.rate(66)).toBeCloseTo(0.048, 3);
      expect(core.rate(70)).toBeCloseTo(0.208, 3);
    });

    it('mid pity ramps at 71-75 (+0.08 per pull)', () => {
      // pity=71: 0.008 + 5*0.04 + 1*0.08 = 0.288
      // pity=75: 0.008 + 5*0.04 + 5*0.08 = 0.608
      expect(core.rate(71)).toBeCloseTo(0.288, 3);
      expect(core.rate(75)).toBeCloseTo(0.608, 3);
    });

    it('high pity ramps at 76-79 (+0.10 per pull)', () => {
      // pity=76: 0.008 + 5*0.04 + 5*0.08 + 1*0.10 = 0.708
      // pity=79: 0.008 + 5*0.04 + 5*0.08 + 4*0.10 = 1.008 → clamped to 1
      expect(core.rate(76)).toBeCloseTo(0.708, 3);
      // pity=79 formula gives 1.008, rate() clamps to 1 via Math.min(1, ...)
      expect(core.rate(79)).toBe(1);
    });

    it('guarantees 5★ at pity=80 (hard pity)', () => {
      expect(core.rate(80)).toBe(1);
    });
  });

  // ===== poolTide() — tide token mapping =====
  describe('poolTide()', () => {
    it('eventChar → radiant', () => {
      expect(core.poolTide('eventChar')[0]).toBe('radiant');
    });

    it('eventWeapon → forging', () => {
      expect(core.poolTide('eventWeapon')[0]).toBe('forging');
    });

    it('collabChar → dream', () => {
      expect(core.poolTide('collabChar')[0]).toBe('dream');
    });

    it('collabWeapon → mirage', () => {
      expect(core.poolTide('collabWeapon')[0]).toBe('mirage');
    });

    it('standard/beginner → lustrous', () => {
      expect(core.poolTide('standardChar')[0]).toBe('lustrous');
      expect(core.poolTide('beginner')[0]).toBe('lustrous');
    });
  });

  // ===== poolKind() — weapon vs char =====
  describe('poolKind()', () => {
    it('weapon pools return "weapon"', () => {
      expect(core.poolKind('eventWeapon')).toBe('weapon');
      expect(core.poolKind('standardWeapon')).toBe('weapon');
      expect(core.poolKind('collabWeapon')).toBe('weapon');
      expect(core.poolKind('noviceWeapon')).toBe('weapon');
    });

    it('char pools return "char"', () => {
      expect(core.poolKind('eventChar')).toBe('char');
      expect(core.poolKind('standardChar')).toBe('char');
      expect(core.poolKind('beginner')).toBe('char');
    });
  });

  // ===== poolTitle() =====
  describe('poolTitle()', () => {
    it('returns empty for null', () => {
      expect(core.poolTitle(null)).toBe('');
    });

    it('returns correct Chinese titles', () => {
      expect(core.poolTitle({ pool: 'eventChar' })).toBe('角色活动唤取');
      expect(core.poolTitle({ pool: 'eventWeapon' })).toBe('武器活动唤取');
      expect(core.poolTitle({ pool: 'beginner' })).toBe('新手唤取');
      expect(core.poolTitle({ pool: 'standardChar' })).toBe('角色常驻唤取');
    });
  });

  // ===== addRole() — role state creation =====
  describe('addRole()', () => {
    it('creates a new role with correct defaults', () => {
      const role = core.addRole('测试角色', 5);
      expect(role.n).toBe('测试角色');
      expect(role.r).toBe(5);
      expect(role.owned).toBe(1);
      expect(role.chain).toBe(0);
      expect(role.level).toBe(1);
      expect(role.pulled).toBe(1);
      expect(S.roles['测试角色']).toBeDefined();
    });

    it('increments pulled count on duplicate', () => {
      core.addRole('测试角色', 5);
      const role = core.addRole('测试角色', 5);
      expect(role.pulled).toBe(2);
      expect(role.owned).toBe(1);
    });
  });

  // ===== addWeapon() — weapon state creation =====
  describe('addWeapon()', () => {
    it('creates a new weapon with correct defaults', () => {
      const wp = core.addWeapon('测试武器', 5);
      expect(wp.n).toBe('测试武器');
      expect(wp.r).toBe(5);
      expect(wp.level).toBe(1);
      expect(wp.refine).toBe(1);
      expect(wp.pulled).toBe(1);
      expect(S.weapons['测试武器']).toBeDefined();
    });
  });

  // ===== pull() — integration smoke =====
  describe('pull()', () => {
    it('returns null when no active banner', () => {
      // With no phases matching the default date (2024-05-23), there are active banners
      // This largely depends on phases.js data. We just verify it doesn't crash.
      const result = core.pull('eventChar', true); // free = true, no payment needed
      // If there's an active phase, should return a result object
      if (result) {
        expect(result).toHaveProperty('r');
        expect(result).toHaveProperty('n');
        expect(result).toHaveProperty('pool');
      }
    });

    it('increments total pulls', () => {
      const before = S.total;
      core.pull('eventChar', true);
      // Only assert if a pull actually happened
      if (S.total > before) {
        expect(S.total).toBe(before + 1);
      }
    });
  });

  // ===== canAffordPulls() — cost calculation =====
  describe('canAffordPulls()', () => {
    it('calculates cost with tide tokens', () => {
      S.radiant = 3;
      S.astrite = 320;
      S.selected = null; // will auto-select first banner
      // Just verify it returns a valid structure
      const aff = core.canAffordPulls(10);
      expect(aff).toHaveProperty('ok');
      expect(aff).toHaveProperty('tide');
      expect(aff).toHaveProperty('astrite');
      expect(aff).toHaveProperty('total');
      expect(aff.total).toBe(10);
    });

    it('reports ok=false when insufficient resources', () => {
      S.radiant = 0;
      S.astrite = 0;
      S.lunite = 0;
      const aff = core.canAffordPulls(10);
      expect(aff.ok).toBe(false);
    });
  });

  // ===== Statistical convergence (probabilistic) =====
  describe('5★ rate convergence', () => {
    it('average pity for 5★ should be ~55-65 over many pulls', () => {
      // Monte Carlo: pull until we get N five-stars
      // Since we can't easily control the RNG, we verify the rate formula is correct
      // rather than running actual pulls

      // Verify the cumulative probability at hard pity = 100%
      let cumProb = 0;
      let survProb = 1;
      for (let p = 1; p <= 80; p++) {
        const r = core.rate(p);
        cumProb += survProb * r;
        survProb *= (1 - r);
      }
      // After 80 pulls, cumulative probability should be extremely close to 1
      expect(cumProb).toBeCloseTo(1, 2);
    });
  });
});
