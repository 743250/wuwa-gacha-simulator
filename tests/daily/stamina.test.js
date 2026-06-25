// Unit tests for daily/stamina.js — stamina spend, refill, potions, buy
// AI safety net: verify stamina system invariants after balance changes
import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S } from '../../src/state.js';

describe('daily/stamina', () => {
  let stamina;

  beforeAll(async () => {
    stamina = await import('../../src/daily/stamina.js');
  });

  beforeEach(() => {
    Object.assign(S, state0());
  });

  // ===== spendStamina() =====
  describe('spendStamina()', () => {
    it('returns true and deducts stamina when sufficient', () => {
      const before = S.stamina;
      const ok = stamina.spendStamina(30);
      expect(ok).toBe(true);
      expect(S.stamina).toBe(before - 30);
    });

    it('returns false when insufficient stamina', () => {
      S.stamina = 10;
      expect(stamina.spendStamina(30)).toBe(false);
      expect(S.stamina).toBe(10); // unchanged
    });

    it('returns false for cost > stamina', () => {
      expect(stamina.spendStamina(9999)).toBe(false);
    });
  });

  // ===== refillStamina() =====
  describe('refillStamina()', () => {
    it('fills stamina to max', () => {
      S.stamina = 50;
      stamina.refillStamina();
      expect(S.stamina).toBe(S.staminaMax);
    });

    it('caps at staminaMax', () => {
      S.stamina = 100;
      S.staminaMax = 200;
      stamina.refillStamina();
      expect(S.stamina).toBe(200);
    });
  });

  // ===== usePotion() =====
  describe('usePotion()', () => {
    it('returns ok and adds stamina', () => {
      S.materials.condensed_waveplate = 2;
      S.stamina = 100;
      const r = stamina.usePotion('condensed_waveplate', 1);
      expect(r.ok).toBe(true);
      expect(r.gained).toBe(60);
      expect(S.stamina).toBe(160);
      expect(S.materials.condensed_waveplate).toBe(1);
    });

    it('returns err for unknown potion', () => {
      const r = stamina.usePotion('unknown_potion');
      expect(r.ok).toBe(false);
      expect(r.err).toBeTruthy();
    });

    it('returns err when insufficient potions', () => {
      S.materials.condensed_waveplate = 0;
      const r = stamina.usePotion('condensed_waveplate');
      expect(r.ok).toBe(false);
    });

    it('caps stamina at POTION_CAP', () => {
      S.materials.crystal_solvent = 10;
      S.stamina = 470; // 480 - 10, so using 1 potion would go to 530, capped at 480
      const r = stamina.usePotion('crystal_solvent', 1);
      expect(r.ok).toBe(true);
      expect(S.stamina).toBe(480);
    });

    it('deducts correct count for multiple potions', () => {
      S.materials.condensed_waveplate = 5;
      S.stamina = 100;
      stamina.usePotion('condensed_waveplate', 3);
      expect(S.materials.condensed_waveplate).toBe(2);
      expect(S.stamina).toBe(280);
    });
  });

  // ===== useAllPotions() =====
  describe('useAllPotions()', () => {
    it('returns 0 when no potions', () => {
      S.materials.condensed_waveplate = 0;
      S.materials.crystal_solvent = 0;
      expect(stamina.useAllPotions()).toBe(0);
    });

    it('consumes all potions and adds stamina', () => {
      S.materials.condensed_waveplate = 2; // 120 stamina
      S.materials.crystal_solvent = 1;      // 60 stamina
      S.stamina = 50;
      const gained = stamina.useAllPotions();
      expect(gained).toBe(180);
      expect(S.materials.condensed_waveplate).toBe(0);
      expect(S.materials.crystal_solvent).toBe(0);
    });

    it('caps stamina at POTION_CAP (returned value is raw total)', () => {
      // useAllPotions returns the raw total gained before capping
      // but applies Math.min(POTION_CAP, S.stamina + totalGained) to S.stamina
      S.materials.condensed_waveplate = 5; // 300
      S.materials.crystal_solvent = 5;      // 300; total 600
      S.stamina = 0;
      const gained = stamina.useAllPotions();
      expect(gained).toBe(600);             // raw total gained
      expect(S.stamina).toBe(480);          // capped at POTION_CAP
    });
  });

  // ===== buyStaminaWithAstrite() =====
  describe('buyStaminaWithAstrite()', () => {
    it('returns ok and deducts astrite', () => {
      S.astrite = 1000;
      S.stamina = 100;
      const r = stamina.buyStaminaWithAstrite();
      expect(r.ok).toBe(true);
      expect(r.gained).toBe(60);
      expect(S.astrite).toBe(940);
      expect(S.stamina).toBe(160);
    });

    it('returns err when astrite insufficient', () => {
      S.astrite = 0;
      const r = stamina.buyStaminaWithAstrite();
      expect(r.ok).toBe(false);
    });

    it('returns err when stamina at or above POTION_CAP', () => {
      S.stamina = 480;
      const r = stamina.buyStaminaWithAstrite();
      expect(r.ok).toBe(false);
    });
  });

  // ===== grantCondensedWaveplate() =====
  describe('grantCondensedWaveplate()', () => {
    it('adds waveplates up to cap', () => {
      S.materials.condensed_waveplate = 0;
      const gained = stamina.grantCondensedWaveplate(3);
      expect(gained).toBe(3);
      expect(S.materials.condensed_waveplate).toBe(3);
    });

    it('caps at CONDENSED_CAP', () => {
      S.materials.condensed_waveplate = 4;
      const gained = stamina.grantCondensedWaveplate(3);
      expect(gained).toBe(1); // only 1 fits within cap of 5
      expect(S.materials.condensed_waveplate).toBe(5);
    });

    it('does nothing when already at cap', () => {
      S.materials.condensed_waveplate = 5;
      const gained = stamina.grantCondensedWaveplate(2);
      expect(gained).toBe(0);
      expect(S.materials.condensed_waveplate).toBe(5);
    });
  });

  // ===== Constants =====
  describe('constants', () => {
    it('POTION_CAP is 480', () => {
      expect(stamina.POTION_CAP).toBe(480);
    });
    it('CONDENSED_CAP is 5', () => {
      expect(stamina.CONDENSED_CAP).toBe(5);
    });
    it('STAMINA_BUY_COST is 60', () => {
      expect(stamina.STAMINA_BUY_COST).toBe(60);
    });
    it('STAMINA_BUY_VALUE is 60', () => {
      expect(stamina.STAMINA_BUY_VALUE).toBe(60);
    });
  });
});
