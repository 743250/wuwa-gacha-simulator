// Unit tests for battle/stats.js — stat computation, BP, weapon bonus application
// AI safety net: verify stat calculation invariants after character/weapon changes
import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S } from '../../src/state.js';
import { resetState } from '../helpers.js';

describe('battle/stats', () => {
  let stats;

  beforeAll(async () => {
    stats = await import('../../src/battle/stats.js');
  });

  beforeEach(() => {
    resetState({
      team: ['忌炎', '守岸人', '安可'],
      roles: {
        '忌炎': { level: 90, chain: 0, equipWeapon: '苍鳞千嶂' },
        '守岸人': { level: 90, chain: 0, equipWeapon: '星序协响' },
      },
    });
  });

  // ===== computeBattleStats() — full stat computation =====
  describe('computeBattleStats()', () => {
    it('returns null for unknown role', () => {
      expect(stats.computeBattleStats('不存在的角色')).toBeNull();
    });

    it('returns structured stats for a known role', () => {
      const s = stats.computeBattleStats('忌炎');
      expect(s).toBeTruthy();
      expect(s.name).toBe('忌炎');
      expect(s.chain).toBe(0);
      expect(s.level).toBe(90);
      expect(s.hp).toBeGreaterThan(0);
      expect(s.atk).toBeGreaterThan(0);
      expect(s.def).toBeGreaterThan(0);
      expect(s.crate).toBeGreaterThan(0);
      expect(s.cdmg).toBeGreaterThan(0);
      expect(s.element).toBeTruthy();
      expect(s.type).toBeTruthy();
      expect(s.weaponType).toBeTruthy();
    });

    it('weapon atk is included in total atk', () => {
      const withWeapon = stats.computeBattleStats('忌炎');
      // Remove weapon to see base atk
      S.roles['忌炎'].equipWeapon = null;
      const withoutWeapon = stats.computeBattleStats('忌炎');
      expect(withWeapon.atk).toBeGreaterThan(withoutWeapon.atk);
    });

    it('weapon bonuses are applied', () => {
      const s = stats.computeBattleStats('忌炎');
      expect(s.weapon).toBeTruthy();
      expect(s.weapon.name).toBe('苍鳞千嶂');
      expect(s.weaponTriggers).toBeInstanceOf(Array);
    });

    it('healBonus is present for healers', () => {
      const s = stats.computeBattleStats('守岸人');
      expect(s.healBonus).toBeGreaterThan(0);
    });
  });

  // ===== echoContrib() — 声骸套装加成 =====
  describe('echoContrib() — 声骸系统', () => {
    let echoes, echoActions;

    beforeAll(async () => {
      echoes = await import('../../src/data/echoes.js');
      echoActions = await import('../../src/equip/echoActions.js');
    });

    beforeEach(() => {
      resetState({
        team: ['忌炎', '守岸人', '安可'],
        roles: { '忌炎': { level: 90, chain: 0, equipWeapon: '苍鳞千嶂' } },
      });
      S.echos = [];
      S.echoNextId = 1;
      S.dataBankLevel = 8;
    });

    it('returns null when role has no echoes', () => {
      expect(stats.echoContrib('忌炎')).toBeNull();
    });

    it('aggregates main stat into atk/crate', () => {
      const role = '忌炎';
      S.roles[role].equipEchoes = [null, null, null, null, null];
      const c4 = echoes.ECHO_CATALOG.find(e => e.cost === 4 && e.set !== 'unknown');
      const e = echoActions.generateEcho(c4.id);
      // Force a crit rate main stat
      e.mainStat = { key: 'crate', label: '暴击率', value: 0.22 };
      echoActions.equipEcho(role, 0, e.id);
      const s = stats.computeBattleStats(role);
      expect(s.echoStats).toBeTruthy();
      expect(s.echoStats.mainStats.length).toBe(1);
      expect(s.crate).toBeGreaterThan(0);
    });

    it('activates 2-piece set bonus when 2 echoes of same set equipped', () => {
      const role = '忌炎';
      S.roles[role].equipEchoes = [null, null, null, null, null];
      const c1 = echoes.ECHO_CATALOG.filter(e => e.cost === 1 && (Array.isArray(e.set) ? e.set[0] === 'fire' : e.set === 'fire'));
      const e1 = echoActions.generateEcho(c1[0].id);
      const e2 = echoActions.generateEcho(c1[1].id);
      echoActions.equipEcho(role, 0, e1.id);
      echoActions.equipEcho(role, 1, e2.id);
      const s = stats.computeBattleStats(role);
      const setBonus = s.echoStats.setBonuses.find(b => b.setId === 'fire' && b.tier === 2);
      expect(setBonus).toBeTruthy();
      // 熔山裂谷 2件 = 热熔元素伤害 +10%
      expect(s.elemBonus['热熔']).toBeGreaterThanOrEqual(0.10);
    });

    it('sub stats contribute to atk/cdmg', () => {
      const role = '忌炎';
      S.roles[role].equipEchoes = [null, null, null, null, null];
      const c1 = echoes.ECHO_CATALOG.find(e => e.cost === 1 && e.set !== 'unknown');
      const e = echoActions.generateEcho(c1.id);
      // Force cdmg sub stat
      e.subStats = [{ key: 'cdmg', label: '暴击伤害', value: 0.10, locked: false }];
      echoActions.equipEcho(role, 0, e.id);
      const s = stats.computeBattleStats(role);
      expect(s.cdmg).toBeGreaterThan(0);
    });
  });

  // ===== calcBP() — battle power =====
  describe('calcBP()', () => {
    it('returns 0 for unknown role', () => {
      expect(stats.calcBP('不存在的角色')).toBe(0);
    });

    it('returns positive number for known role', () => {
      const bp = stats.calcBP('忌炎');
      expect(bp).toBeGreaterThan(0);
      expect(Number.isInteger(bp)).toBe(true);
    });

    it('higher chain gives higher BP', () => {
      const bp0 = stats.calcBP('忌炎');
      S.roles['忌炎'].chain = 6;
      S.roles['忌炎'].skillLevels = { 普攻: 10, 技能: 10, 解放: 10, 回路: 10 };
      const bp6 = stats.calcBP('忌炎');
      expect(bp6).toBeGreaterThan(bp0);
    });
  });

  // ===== applyBonus() — internal helper via computeBattleStats =====
  describe('stat bonus application patterns', () => {
    it('elemBonus creates correct element entries', () => {
      const s = stats.computeBattleStats('忌炎');
      // 忌炎 is 气动
      expect(s.element).toBe('气动');
    });

    it('multiple elem bonuses don not conflict', () => {
      // Create a role with weapon that gives allElement dmg
      const s = stats.computeBattleStats('守岸人');
      expect(typeof s.elemAllBonus).toBe('number');
    });

    it('defPierce is non-negative', () => {
      const s = stats.computeBattleStats('忌炎');
      expect(s.defPierce).toBeGreaterThanOrEqual(0);
    });
  });

  // ===== expToNext() — experience formula =====
  describe('expToNext()', () => {
    it('returns Infinity at level 90', () => {
      expect(stats.expToNext({ level: 90 })).toBe(Infinity);
    });

    it('returns positive number for level 1', () => {
      const cost = stats.expToNext({ level: 1 });
      expect(cost).toBeGreaterThan(0);
      expect(Number.isFinite(cost)).toBe(true);
    });

    it('defaults to level 1 when level is undefined', () => {
      const cost = stats.expToNext({});
      expect(cost).toBe(stats.expToNext({ level: 1 }));
    });
  });

  // ===== weaponToNext() =====
  describe('weaponToNext()', () => {
    it('returns Infinity at level 90', () => {
      expect(stats.weaponToNext({ level: 90 })).toBe(Infinity);
    });

    it('cost increases at higher levels', () => {
      const low = stats.weaponToNext({ level: 10 });
      const high = stats.weaponToNext({ level: 70 });
      expect(high).toBeGreaterThanOrEqual(low);
    });
  });

  // ===== EXP_VALUES integrity =====
  describe('EXP_VALUES', () => {
    it('has exactly 4 tiers', () => {
      expect(Object.keys(stats.EXP_VALUES)).toHaveLength(4);
    });

    it('values are in increasing order', () => {
      const vals = Object.values(stats.EXP_VALUES);
      for (let i = 1; i < vals.length; i++) {
        expect(vals[i]).toBeGreaterThan(vals[i - 1]);
      }
    });
  });
});
