// Unit tests for save.js — save/load, deepMerge, legacy migration
// AI safety net: verify save format compatibility after state changes
import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S } from '../src/state.js';

describe('save', () => {
  let save;

  beforeAll(async () => {
    save = await import('../src/save.js');
  });

  beforeEach(() => {
    Object.assign(S, state0());
    // Mock localStorage
    const store = {};
    globalThis.localStorage = {
      getItem(k) { return store[k] || null; },
      setItem(k, v) { store[k] = v; },
      removeItem(k) { delete store[k]; },
      clear() { Object.keys(store).forEach(k => delete store[k]); },
    };
  });

  // ===== saveStateNow() =====
  describe('saveStateNow()', () => {
    it('writes to localStorage', () => {
      S.astrite = 99999;
      save.saveStateNow();
      const raw = globalThis.localStorage.getItem('wuwa-gacha-save-v1');
      expect(raw).toBeTruthy();
      const data = JSON.parse(raw);
      expect(data.astrite).toBe(99999);
    });
  });

  // ===== loadState() =====
  describe('loadState()', () => {
    it('returns false when no save exists', async () => {
      globalThis.localStorage.clear();
      expect(await save.loadState()).toBe(false);
    });

    it('loads saved state from localStorage', async () => {
      globalThis.localStorage.setItem('wuwa-gacha-save-v1', JSON.stringify({ astrite: 50000 }));
      const ok = await save.loadState();
      expect(ok).toBe(true);
      expect(S.astrite).toBe(50000);
    });

    it('merges with state0 defaults for missing fields', async () => {
      globalThis.localStorage.setItem('wuwa-gacha-save-v1', JSON.stringify({ astrite: 100 }));
      await save.loadState();
      // Field that existed in state0 but not in saved data should keep default
      expect(typeof S.stamina).toBe('number');
      expect(typeof S.team).toBe('object');
    });
  });

  // ===== clearSave() =====
  describe('clearSave()', () => {
    it('removes saved data from localStorage', () => {
      save.saveStateNow();
      expect(globalThis.localStorage.getItem('wuwa-gacha-save-v1')).toBeTruthy();
      save.clearSave();
      expect(globalThis.localStorage.getItem('wuwa-gacha-save-v1')).toBeNull();
    });
  });

  // ===== migrateLegacy() (via loadState) =====
  describe('legacy migration', () => {
    it('migrates old stamina_potion to crystal_solvent', () => {
      const oldSave = {
        astrite: 100,
        materials: {
          stamina_potion: 2,
          stamina_potion_big: 1,
        },
      };
      globalThis.localStorage.setItem('wuwa-gacha-save-v1', JSON.stringify(oldSave));
      save.loadState();
      expect(S.materials.stamina_potion).toBeUndefined();
      expect(S.materials.stamina_potion_big).toBeUndefined();
      // small = 2, big = 1 → 2 + 1*2 = 4 crystal_solvent
      expect(S.materials.crystal_solvent).toBeGreaterThanOrEqual(4);
    });

    it('removes deprecated material fields', () => {
      const oldSave = {
        astrite: 100,
        materials: {
          skill_mat: 5,
          echo_tube: 10,
          exp_low: 10,
        },
      };
      globalThis.localStorage.setItem('wuwa-gacha-save-v1', JSON.stringify(oldSave));
      save.loadState();
      expect(S.materials.skill_mat).toBeUndefined();
      expect(S.materials.echo_tube).toBeUndefined();
      expect(S.materials.exp_low).toBe(10); // legitimate field preserved
    });
  });

  // ===== deepMerge integrity =====
  describe('deepMerge integrity', () => {
    it('preserves nested objects in target', () => {
      globalThis.localStorage.setItem('wuwa-gacha-save-v1', JSON.stringify({
        astrite: 200,
        materials: { exp_low: 50 },
      }));
      save.loadState();
      // Fields not in the saved data should keep state0 defaults
      expect(S.materials.exp_mid).toBe(10);   // default
      expect(S.materials.exp_high).toBe(5);   // default
      expect(S.materials.exp_low).toBe(50);   // override
    });

    it('handles corrupted save gracefully', async () => {
      globalThis.localStorage.setItem('wuwa-gacha-save-v1', 'not-json-at-all');
      const ok = await save.loadState();
      expect(ok).toBe(false);
      // S should still be in valid default state
      expect(S.astrite).toBe(16000);
    });
  });
});
