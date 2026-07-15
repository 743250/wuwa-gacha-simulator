// Unit tests for battle/weaponTriggers.js — weapon passive trigger runtime
// AI safety net: verify weapon trigger logic after adding/modifying weapon effects
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/weaponTriggers', () => {
  let wt;
  let combat;

  beforeAll(async () => {
    wt = await import('../../src/battle/weaponTriggers.js');
    combat = await import('../../src/battle/combat.js');
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

  describe('team_atk / 实战集成', () => {
    it('team_atk 写入全队 atkUp buff', () => {
      unit.name = '守岸人';
      unit.idx = 0;
      unit.weaponTriggers = [
        { on: 'heal_skill', effect: 'team_atk', value: 0.14, maxStacks: 1, duration: 2 },
      ];
      const ally = { name: '忌炎', alive: true, buffs: [] };
      const battle = { team: [unit, ally] };
      unit.alive = true;
      unit.buffs = [];
      expect(wt.fireTrigger(unit, 'heal_skill', { battle })).toBe(1);
      for (const t of battle.team) {
        expect((t.buffs || []).some(b => b.type === 'atkUp' && Math.abs(b.value - 0.14) < 1e-6)).toBe(true);
      }
      // collect 不双算
      expect(wt.collectWeaponBonus(unit, 'skill').atkBonus).toBe(0);
    });

    it('苍鳞千嶂：解放叠重击%（不依赖协奏）', () => {
      resetState({
        team: ['忌炎', '守岸人', '安可'],
        roles: {
          '忌炎': { level: 90, chain: 0, equipWeapon: '苍鳞千嶂' },
          '守岸人': { level: 90, chain: 0 },
          '安可': { level: 90, chain: 0 },
        },
      });
      const battle = quickBattle();
      const j = battle.team.find(t => t.name === '忌炎');
      battle.active = battle.team.findIndex(t => t.name === '忌炎');
      expect(j.weaponTriggers?.some(t => t.effect === 'heavy_pct')).toBe(true);
      expect((j.elemAllBonus || 0)).toBeGreaterThanOrEqual(0.12 - 1e-6);
      j.energy = j.energyMax;
      battle.ap = 4;
      expect(combat.doBurst(battle).ok).toBe(true);
      const wb = wt.collectWeaponBonus(j, 'heavy');
      expect(wb.heavyBonus).toBeCloseTo(0.24, 5);
    });

    it('苍鳞千嶂：普通切人变奏也叠重击%（不绑协奏满）', () => {
      resetState({
        team: ['安可', '忌炎', '守岸人'],
        roles: {
          '忌炎': { level: 90, chain: 0, equipWeapon: '苍鳞千嶂' },
          '安可': { level: 90, chain: 0 },
          '守岸人': { level: 90, chain: 0 },
        },
      });
      const battle = quickBattle();
      const j = battle.team.find(t => t.name === '忌炎');
      battle.active = battle.team.findIndex(t => t.name === '安可');
      // 确保协奏未满
      const anke = battle.team.find(t => t.name === '安可');
      anke.concerto = 0;
      battle.ap = 4;
      expect(combat.doSwitch(battle, battle.team.findIndex(t => t.name === '忌炎')).ok).toBe(true);
      expect(wt.collectWeaponBonus(j, 'heavy').heavyBonus).toBeCloseTo(0.24, 5);
    });

    it('星序协响：治疗技能给全队 atkUp', () => {
      resetState({
        team: ['守岸人', '忌炎', '安可'],
        roles: {
          '守岸人': { level: 90, chain: 0, equipWeapon: '星序协响' },
          '忌炎': { level: 90, chain: 0 },
          '安可': { level: 90, chain: 0 },
        },
      });
      const battle = quickBattle();
      const sk = battle.team.find(t => t.name === '守岸人');
      battle.active = battle.team.findIndex(t => t.name === '守岸人');
      battle.ap = 4;
      expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(true);
      for (const t of battle.team) {
        if (!t.alive) continue;
        expect((t.buffs || []).some(b => b.type === 'atkUp' && b.src?.includes('武器·全队攻击'))).toBe(true);
      }
      expect(sk.weaponStacks && Object.keys(sk.weaponStacks).length).toBeGreaterThan(0);
    });
  });
});
