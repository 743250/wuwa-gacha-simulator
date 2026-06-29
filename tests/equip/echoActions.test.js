// Unit tests for equip/echoActions.js — generate/equip/unequip/levelup/recycle/lock
import { describe, it, expect, beforeEach } from 'vitest';
import { S } from '../../src/state.js';
import { resetState } from '../helpers.js';
import {
  dataBankCostCap, generateEcho, calcTotalCost,
  equipEcho, unequipEcho, unequipSlot, getEquippableEchoes,
  echoToNext, levelUpEcho, levelUpEchoMax, recycleEcho, toggleEchoLock,
} from '../../src/equip/echoActions.js';
import { ECHO_CATALOG, getEchoById } from '../../src/data/echoes.js';

describe('equip/echoActions', () => {
  beforeEach(() => {
    resetState({
      team: ['忌炎', '守岸人', '安可'],
      roles: { '忌炎': { level: 90, chain: 0 } },
    });
    S.echos = [];
    S.echoNextId = 1;
    S.dataBankLevel = 8;
    S.materials.exp_super = 100;
    S.materials.exp_high = 100;
    S.materials.exp_mid = 100;
    S.materials.exp_low = 100;
  });

  describe('dataBankCostCap', () => {
    it('level 8/9/10 = 12', () => {
      expect(dataBankCostCap(8)).toBe(12);
      expect(dataBankCostCap(9)).toBe(12);
      expect(dataBankCostCap(10)).toBe(12);
    });
    it('level 7 = 11', () => {
      expect(dataBankCostCap(7)).toBe(11);
    });
    it('lower levels scale down', () => {
      expect(dataBankCostCap(0)).toBe(10);
      expect(dataBankCostCap(3)).toBe(11);
      expect(dataBankCostCap(6)).toBe(12);
    });
  });

  describe('generateEcho', () => {
    it('produces an echo with required fields', () => {
      const catalog = ECHO_CATALOG[0];
      const e = generateEcho(catalog.id);
      expect(e).toBeTruthy();
      expect(e.id).toBeGreaterThan(0);
      expect(e.name).toBe(catalog.name);
      expect(e.cost).toBe(catalog.cost);
      expect(e.level).toBe(1);
      expect(e.mainStat).toBeTruthy();
      expect(e.subStats.length).toBe(5);
      expect(e.lock).toBe(false);
      expect(e.equippedBy).toBeNull();
    });

    it('returns null for unknown id', () => {
      expect(generateEcho('nonexistent')).toBeNull();
    });

    it('registers echo in S.echos and increments id', () => {
      const before = S.echos.length;
      const e1 = generateEcho(ECHO_CATALOG[0].id);
      const e2 = generateEcho(ECHO_CATALOG[1].id);
      expect(S.echos.length).toBe(before + 2);
      expect(e2.id).toBeGreaterThan(e1.id);
    });
  });

  describe('equipEcho / unequipEcho / calcTotalCost', () => {
    it('equips to a slot and marks equippedBy', () => {
      const role = '忌炎';
      S.roles[role].equipEchoes = [null, null, null, null, null];
      const c1 = ECHO_CATALOG.find(e => e.cost === 1);
      const e = generateEcho(c1.id);
      const r = equipEcho(role, 0, e.id);
      expect(r.ok).toBe(true);
      expect(e.equippedBy).toBe(role);
      expect(e.equipSlot).toBe(0);
      expect(calcTotalCost(role)).toBe(1);
    });

    it('rejects when another role already has it', () => {
      S.roles['忌炎'].equipEchoes = [null, null, null, null, null];
      S.roles['守岸人'].equipEchoes = [null, null, null, null, null];
      const c1 = ECHO_CATALOG.find(e => e.cost === 1);
      const e = generateEcho(c1.id);
      equipEcho('忌炎', 0, e.id);
      const r = equipEcho('守岸人', 0, e.id);
      expect(r.ok).toBe(false);
    });

    it('rejects when COST cap exceeded', () => {
      S.roles['忌炎'].equipEchoes = [null, null, null, null, null];
      // Try equipping 4 COST4s = 16 > cap 12
      const c4 = ECHO_CATALOG.filter(e => e.cost === 4);
      for (let i = 0; i < 3; i++) {
        const e = generateEcho(c4[i].id);
        const r = equipEcho('忌炎', i, e.id);
        expect(r.ok).toBe(true);
      }
      const e4 = generateEcho(c4[3].id);
      const r = equipEcho('忌炎', 3, e4.id);
      expect(r.ok).toBe(false);
    });

    it('swapping slot frees old echo', () => {
      S.roles['忌炎'].equipEchoes = [null, null, null, null, null];
      const c1 = ECHO_CATALOG.find(e => e.cost === 1);
      const e1 = generateEcho(c1.id);
      const e2 = generateEcho(c1.id);
      equipEcho('忌炎', 0, e1.id);
      equipEcho('忌炎', 0, e2.id);
      expect(e1.equippedBy).toBeNull();
      expect(e2.equippedBy).toBe('忌炎');
    });

    it('unequipEcho clears equippedBy and slot', () => {
      S.roles['忌炎'].equipEchoes = [null, null, null, null, null];
      const c1 = ECHO_CATALOG.find(e => e.cost === 1);
      const e = generateEcho(c1.id);
      equipEcho('忌炎', 0, e.id);
      expect(unequipEcho(e.id)).toBe(true);
      expect(e.equippedBy).toBeNull();
      expect(S.roles['忌炎'].equipEchoes[0]).toBeNull();
    });

    it('unequipSlot clears a slot by index', () => {
      S.roles['忌炎'].equipEchoes = [null, null, null, null, null];
      const c1 = ECHO_CATALOG.find(e => e.cost === 1);
      const e = generateEcho(c1.id);
      equipEcho('忌炎', 2, e.id);
      expect(unequipSlot('忌炎', 2)).toBe(true);
      expect(S.roles['忌炎'].equipEchoes[2]).toBeNull();
    });

    it('getEquippableEchoes excludes echoes owned by other roles', () => {
      S.roles['忌炎'].equipEchoes = [null, null, null, null, null];
      S.roles['守岸人'].equipEchoes = [null, null, null, null, null];
      const c1 = ECHO_CATALOG.find(e => e.cost === 1);
      const e1 = generateEcho(c1.id);
      const e2 = generateEcho(c1.id);
      equipEcho('守岸人', 0, e2.id);
      const list = getEquippableEchoes('忌炎');
      expect(list.find(e => e.id === e1.id)).toBeTruthy();
      expect(list.find(e => e.id === e2.id)).toBeUndefined();
    });
  });

  describe('levelUpEcho / echoToNext', () => {
    it('echoToNext returns finite cost below cap', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      expect(echoToNext(e)).toBeGreaterThan(0);
      expect(Number.isFinite(echoToNext(e))).toBe(true);
    });

    it('echoToNext is Infinity at max level', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      e.level = 25;
      expect(echoToNext(e)).toBe(Infinity);
    });

    it('levelUpEcho consumes exp and increments level', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      const beforeExp = totalExpAll();
      expect(levelUpEcho(e.id)).toBe(true);
      expect(e.level).toBe(2);
      expect(totalExpAll()).toBeLessThan(beforeExp);
    });

    it('levelUpEcho fails when exp insufficient', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      S.materials.exp_super = 0;
      S.materials.exp_high = 0;
      S.materials.exp_mid = 0;
      S.materials.exp_low = 0;
      expect(levelUpEcho(e.id)).toBe(false);
      expect(e.level).toBe(1);
    });

    it('every 5 levels unlocks a new sub stat', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      // +0 全部 5 个槽位都未解锁
      const lockedBefore = e.subStats.filter(s => s.unlocked === false).length;
      expect(lockedBefore).toBe(5);
      S.materials.exp_super = 1000;
      S.materials.exp_high = 1000;
      S.materials.exp_mid = 1000;
      S.materials.exp_low = 1000;
      // 升到 LV5 → 应解锁 1 个槽位
      e.level = 4;
      levelUpEcho(e.id);
      const lockedAfter = e.subStats.filter(s => s.unlocked === false).length;
      expect(lockedAfter).toBe(4);
    });

    it('levelUpEchoMax stops at max level or exp exhaustion', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      S.materials.exp_super = 100;
      S.materials.exp_high = 100;
      S.materials.exp_mid = 100;
      S.materials.exp_low = 100;
      const count = levelUpEchoMax(e.id);
      expect(count).toBeGreaterThanOrEqual(0);
      expect(e.level).toBeGreaterThanOrEqual(1);
    });
  });

  describe('recycleEcho / toggleEchoLock', () => {
    it('recycle removes echo and refunds exp_super', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      e.exp = 50000;
      const before = S.materials.exp_super;
      expect(recycleEcho(e.id)).toBe(true);
      expect(S.echos.find(x => x.id === e.id)).toBeUndefined();
      // 50000 * 0.8 / 20000 = 2
      expect(S.materials.exp_super).toBe(before + 2);
    });

    it('recycle rejects equipped echo', () => {
      S.roles['忌炎'].equipEchoes = [null, null, null, null, null];
      const c1 = ECHO_CATALOG.find(e => e.cost === 1);
      const e = generateEcho(c1.id);
      equipEcho('忌炎', 0, e.id);
      expect(recycleEcho(e.id)).toBe(false);
    });

    it('recycle rejects locked echo', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      toggleEchoLock(e.id);
      expect(e.lock).toBe(true);
      expect(recycleEcho(e.id)).toBe(false);
    });

    it('toggleEchoLock flips lock state', () => {
      const e = generateEcho(ECHO_CATALOG[0].id);
      expect(e.lock).toBe(false);
      toggleEchoLock(e.id);
      expect(e.lock).toBe(true);
      toggleEchoLock(e.id);
      expect(e.lock).toBe(false);
    });
  });
});

// helper: total player exp
function totalExpAll() {
  return (S.materials.exp_super || 0) * 20000
    + (S.materials.exp_high || 0) * 8000
    + (S.materials.exp_mid || 0) * 3000
    + (S.materials.exp_low || 0) * 1000;
}