// Unit tests for battle/weaponTriggers.js — weapon passive trigger runtime
// AI safety net: verify weapon trigger logic after adding/modifying weapon effects
import { describe, it, expect, beforeEach } from 'vitest';

describe('battle/weaponTriggers', () => {
  let wt;

  beforeAll(async () => {
    wt = await import('../../src/battle/weaponTriggers.js');
  });

  let unit;
  beforeEach(() => {
    unit = {
      name: '测试角色',
      weaponTriggers: [],
      weaponStacks: {},
    };
  });

  // ===== fireTrigger() =====
  describe('fireTrigger()', () => {
    it('returns 0 when no triggers defined', () => {
      expect(wt.fireTrigger(unit, 'normal_hit')).toBe(0);
    });

    it('returns 0 when triggers array is empty', () => {
      unit.weaponTriggers = [];
      expect(wt.fireTrigger(unit, 'normal_hit')).toBe(0);
    });

    it('fires a matching trigger on first call', () => {
      unit.weaponTriggers = [
        { on: 'normal_hit', effect: 'atk_pct', value: 0.08, maxStacks: 2, duration: 3 },
      ];
      const fired = wt.fireTrigger(unit, 'normal_hit');
      expect(fired).toBe(1);
      expect(unit.weaponStacks['0']).toBeTruthy();
      expect(unit.weaponStacks['0'].stacks).toBe(1);
      expect(unit.weaponStacks['0'].duration).toBe(3);
    });

    it('ignores non-matching event', () => {
      unit.weaponTriggers = [
        { on: 'skill_hit', effect: 'atk_pct', value: 0.08 },
      ];
      expect(wt.fireTrigger(unit, 'normal_hit')).toBe(0);
    });

    it('stacks up to maxStacks', () => {
      unit.weaponTriggers = [
        { on: 'normal_hit', effect: 'atk_pct', value: 0.08, maxStacks: 3, duration: 3 },
      ];
      wt.fireTrigger(unit, 'normal_hit');
      wt.fireTrigger(unit, 'normal_hit');
      wt.fireTrigger(unit, 'normal_hit'); // should cap at 3
      expect(unit.weaponStacks['0'].stacks).toBe(3);

      // 4th fire should still be capped at 3
      wt.fireTrigger(unit, 'normal_hit');
      expect(unit.weaponStacks['0'].stacks).toBe(3);
    });

    it('resets duration on re-fire', () => {
      unit.weaponTriggers = [
        { on: 'normal_hit', effect: 'atk_pct', value: 0.08, maxStacks: 2, duration: 3 },
      ];
      wt.fireTrigger(unit, 'normal_hit');
      unit.weaponStacks['0'].duration = 1; // nearly expired
      wt.fireTrigger(unit, 'normal_hit');
      expect(unit.weaponStacks['0'].duration).toBe(3); // refreshed
    });

    it('concerto_refund effect adds concerto', () => {
      unit.weaponTriggers = [
        { on: 'outro', effect: 'concerto_refund', value: 12 },
      ];
      wt.fireTrigger(unit, 'outro');
      expect(unit.concerto).toBe(12);
    });
  });

  // ===== collectWeaponBonus() =====
  describe('collectWeaponBonus()', () => {
    it('returns zeros for unit without stacks', () => {
      const bonus = wt.collectWeaponBonus(unit, 'normal');
      expect(bonus.atkBonus).toBe(0);
      expect(bonus.normalBonus).toBe(0);
    });

    it('collects atk_pct bonus from active stacks', () => {
      unit.weaponStacks = {
        '0': { stacks: 2, value: 0.05, effect: 'atk_pct' },
      };
      const bonus = wt.collectWeaponBonus(unit, 'normal');
      expect(bonus.atkBonus).toBeCloseTo(0.10);
    });

    it('collects normal_pct bonus', () => {
      unit.weaponStacks = {
        '0': { stacks: 1, value: 0.15, effect: 'normal_pct' },
      };
      const bonus = wt.collectWeaponBonus(unit, 'normal');
      expect(bonus.normalBonus).toBeCloseTo(0.15);
    });

    it('collects elem_dmg bonus', () => {
      unit.weaponStacks = {
        '0': { stacks: 2, value: 0.10, effect: 'elem_dmg', element: '热熔' },
      };
      const bonus = wt.collectWeaponBonus(unit, 'skill');
      expect(bonus.elemBonus['热熔']).toBeCloseTo(0.20);
    });

    it('collects multiple bonus types from multiple stacks', () => {
      unit.weaponStacks = {
        '0': { stacks: 1, value: 0.08, effect: 'atk_pct' },
        '1': { stacks: 2, value: 0.05, effect: 'skill_pct' },
      };
      const bonus = wt.collectWeaponBonus(unit, 'skill');
      expect(bonus.atkBonus).toBeCloseTo(0.08);
      expect(bonus.skillBonus).toBeCloseTo(0.10);
    });
  });

  // ===== tickWeaponTriggers() =====
  describe('tickWeaponTriggers()', () => {
    it('does nothing when no stacks exist', () => {
      wt.tickWeaponTriggers(unit); // should not throw
    });

    it('decrements duration by 1', () => {
      unit.weaponStacks = {
        '0': { stacks: 1, duration: 3, value: 0.1, effect: 'atk_pct' },
      };
      wt.tickWeaponTriggers(unit);
      expect(unit.weaponStacks['0'].duration).toBe(2);
    });

    it('removes expired stacks', () => {
      unit.weaponStacks = {
        '0': { stacks: 1, duration: 1, value: 0.1, effect: 'atk_pct' },
      };
      wt.tickWeaponTriggers(unit);
      expect(unit.weaponStacks['0']).toBeUndefined();
    });

    it('preserves non-expired stacks', () => {
      unit.weaponStacks = {
        '0': { stacks: 2, duration: 2, value: 0.1, effect: 'atk_pct' },
        '1': { stacks: 1, duration: 5, value: 0.2, effect: 'skill_pct' },
      };
      wt.tickWeaponTriggers(unit);
      expect(unit.weaponStacks['0'].duration).toBe(1);
      expect(unit.weaponStacks['1'].duration).toBe(4);
    });
  });

  // ===== condition check =====
  describe('condition check', () => {
    it('fires when condition is met (erosion_aero)', () => {
      unit.weaponTriggers = [
        { on: 'normal_hit', effect: 'condition_bonus', value: 0.20, condition: 'enemy_has_erosion_aero' },
      ];
      const ctx = { target: { debuffs: [{ type: 'erosion', element: '气动' }] } };
      const fired = wt.fireTrigger(unit, 'normal_hit', ctx);
      expect(fired).toBe(1);
    });

    it('does not fire when condition is not met', () => {
      unit.weaponTriggers = [
        { on: 'normal_hit', effect: 'condition_bonus', value: 0.20, condition: 'enemy_has_erosion_aero' },
      ];
      const ctx = { target: { debuffs: [] } };
      const fired = wt.fireTrigger(unit, 'normal_hit', ctx);
      expect(fired).toBe(0);
    });

    it('returns false from checkCondition when no target in ctx', () => {
      unit.weaponTriggers = [
        { on: 'normal_hit', effect: 'condition_bonus', value: 0.20, condition: 'enemy_has_erosion_aero' },
      ];
      const fired = wt.fireTrigger(unit, 'normal_hit', { target: null });
      expect(fired).toBe(0);
    });
  });
});
