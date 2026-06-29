// Unit tests for data/echoes.js — catalog, sets, query functions
import { describe, it, expect } from 'vitest';
import {
  ECHO_CATALOG, ECHO_SETS, MAIN_STAT_POOL, SUB_STAT_POOL,
  getSetById, getEchoById, getEchoesBySet, getEchoesByElement, getEchoesByCost,
} from '../../src/data/echoes.js';

describe('data/echoes', () => {
  describe('ECHO_CATALOG', () => {
    it('has many entries across COST tiers', () => {
      expect(ECHO_CATALOG.length).toBeGreaterThan(50);
      const costs = new Set(ECHO_CATALOG.map(e => e.cost));
      expect(costs.has(1)).toBe(true);
      expect(costs.has(3)).toBe(true);
      expect(costs.has(4)).toBe(true);
    });

    it('every entry has required fields', () => {
      for (const e of ECHO_CATALOG) {
        expect(e.id).toBeTruthy();
        expect(e.name).toBeTruthy();
        expect(e.cost).toBeGreaterThan(0);
        expect(e.element).toBeTruthy();
      }
    });

    it('every catalog set reference resolves (or is "unknown")', () => {
      for (const e of ECHO_CATALOG) {
        const setId = Array.isArray(e.set) ? e.set[0] : e.set;
        if (setId === 'unknown') continue; // 未分类的声骸
        expect(getSetById(setId)).toBeTruthy();
      }
    });
  });

  describe('ECHO_SETS', () => {
    it('has at least 15 sets', () => {
      expect(ECHO_SETS.length).toBeGreaterThanOrEqual(15);
    });

    it('every set has 2pc and 5pc bonuses', () => {
      for (const s of ECHO_SETS) {
        expect(s.id).toBeTruthy();
        expect(s.name).toBeTruthy();
        expect(s.bonus2).toBeTruthy();
        expect(s.bonus5).toBeTruthy();
        expect(s.bonus2.type).toBeTruthy();
        expect(s.bonus5.type).toBeTruthy();
      }
    });

    it('set ids are unique', () => {
      const ids = ECHO_SETS.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('MAIN_STAT_POOL', () => {
    it('COST4 includes crate, cdmg, atk_pct, heal_bonus', () => {
      const keys = MAIN_STAT_POOL[4].map(s => s.key);
      expect(keys).toContain('crate');
      expect(keys).toContain('cdmg');
      expect(keys).toContain('atk_pct');
      expect(keys).toContain('heal_bonus');
    });

    it('COST3 includes elemental dmg stats', () => {
      const keys = MAIN_STAT_POOL[3].map(s => s.key);
      expect(keys).toContain('elem_dmg_fire');
      expect(keys).toContain('elem_dmg_thunder');
    });

    it('every stat has key/label/value', () => {
      for (const cost of [4, 3, 1]) {
        for (const s of MAIN_STAT_POOL[cost]) {
          expect(s.key).toBeTruthy();
          expect(s.label).toBeTruthy();
          expect(typeof s.value).toBe('number');
          expect(s.value).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('SUB_STAT_POOL', () => {
    it('has multiple sub stats', () => {
      expect(SUB_STAT_POOL.length).toBeGreaterThanOrEqual(8);
    });

    it('every sub stat has key/label/min/max', () => {
      for (const s of SUB_STAT_POOL) {
        expect(s.key).toBeTruthy();
        expect(s.label).toBeTruthy();
        expect(typeof s.min).toBe('number');
        expect(typeof s.max).toBe('number');
        expect(s.max).toBeGreaterThanOrEqual(s.min);
      }
    });
  });

  describe('query functions', () => {
    it('getSetById returns matching set or undefined', () => {
      expect(getSetById('frost')?.name).toBe('凝夜白霜');
      expect(getSetById('nonexistent_set')).toBeUndefined();
    });

    it('getEchoById returns matching echo or undefined', () => {
      const first = ECHO_CATALOG[0];
      expect(getEchoById(first.id)?.name).toBe(first.name);
      expect(getEchoById('nonexistent_echo')).toBeUndefined();
    });

    it('getEchoesBySet returns echoes for that set', () => {
      const fireEchoes = getEchoesBySet('fire');
      expect(fireEchoes.length).toBeGreaterThan(0);
      for (const e of fireEchoes) {
        const sid = Array.isArray(e.set) ? e.set[0] : e.set;
        expect(sid).toBe('fire');
      }
    });

    it('getEchoesByElement filters by element', () => {
      const fire = getEchoesByElement('热熔');
      for (const e of fire) expect(e.element).toBe('热熔');
    });

    it('getEchoesByCost filters by cost', () => {
      const c4 = getEchoesByCost(4);
      for (const e of c4) expect(e.cost).toBe(4);
    });
  });
});
