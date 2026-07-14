// Unit tests for daily/stamina.js — stamina spend, refill, crystal/solvent, natural recovery
// Official model:
//   waveplate_crystal: 1:1 redeem to staminaMax, hold cap 480
//   crystal_solvent: +60 each, can overcharge to POTION_CAP 480
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { state0, S } from '../../src/state.js';

describe('daily/stamina', () => {
  let stamina;

  beforeAll(async () => {
    stamina = await import('../../src/daily/stamina.js');
  });

  beforeEach(() => {
    Object.assign(S, state0());
  });

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
      expect(S.stamina).toBe(10);
    });

    it('returns false for cost > stamina', () => {
      expect(stamina.spendStamina(9999)).toBe(false);
    });
  });

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

  describe('usePotion()', () => {
    it('redeems waveplate_crystal 1:1 up to staminaMax', () => {
      S.materials.waveplate_crystal = 100;
      S.stamina = 200;
      S.staminaMax = 240;
      const r = stamina.usePotion('waveplate_crystal', 50);
      expect(r.ok).toBe(true);
      expect(r.kind).toBe('crystal');
      expect(r.gained).toBe(40);
      expect(S.stamina).toBe(240);
      expect(S.materials.waveplate_crystal).toBe(60);
    });

    it('rejects crystal redeem when already at staminaMax', () => {
      S.materials.waveplate_crystal = 50;
      S.stamina = 240;
      S.staminaMax = 240;
      const r = stamina.usePotion('waveplate_crystal', 10);
      expect(r.ok).toBe(false);
    });

    it('accepts legacy condensed_waveplate alias as crystal', () => {
      S.materials.waveplate_crystal = 30;
      S.stamina = 200;
      S.staminaMax = 240;
      const r = stamina.usePotion('condensed_waveplate', 20);
      expect(r.ok).toBe(true);
      expect(r.kind).toBe('crystal');
      expect(r.gained).toBe(20);
      expect(S.stamina).toBe(220);
      expect(S.materials.waveplate_crystal).toBe(10);
    });

    it('returns err for unknown potion', () => {
      const r = stamina.usePotion('unknown_potion');
      expect(r.ok).toBe(false);
      expect(r.err).toBeTruthy();
    });

    it('returns err when crystal insufficient', () => {
      S.materials.waveplate_crystal = 0;
      S.stamina = 100;
      const r = stamina.usePotion('waveplate_crystal');
      expect(r.ok).toBe(false);
    });

    it('crystal_solvent adds 60 and caps at POTION_CAP', () => {
      S.materials.crystal_solvent = 10;
      S.stamina = 470;
      const r = stamina.usePotion('crystal_solvent', 1);
      expect(r.ok).toBe(true);
      expect(r.kind).toBe('potion');
      expect(S.stamina).toBe(480);
    });

    it('deducts solvent count for multiple uses', () => {
      S.materials.crystal_solvent = 5;
      S.stamina = 100;
      stamina.usePotion('crystal_solvent', 3);
      expect(S.materials.crystal_solvent).toBe(2);
      expect(S.stamina).toBe(280);
    });
  });

  describe('useAllPotions()', () => {
    it('returns 0 when no items', () => {
      S.materials.waveplate_crystal = 0;
      S.materials.crystal_solvent = 0;
      expect(stamina.useAllPotions()).toBe(0);
    });

    it('crystal fill uses only available points', () => {
      S.materials.waveplate_crystal = 50;
      S.materials.crystal_solvent = 1;
      S.stamina = 100;
      S.staminaMax = 240;
      const gained = stamina.useAllPotions();
      expect(gained).toBe(110);
      expect(S.materials.waveplate_crystal).toBe(0);
      expect(S.materials.crystal_solvent).toBe(0);
      expect(S.stamina).toBe(210);
    });

    it('caps solvent overcharge at POTION_CAP', () => {
      S.materials.waveplate_crystal = 0;
      S.materials.crystal_solvent = 10;
      S.stamina = 0;
      const gained = stamina.useAllPotions();
      expect(gained).toBe(600);
      expect(S.stamina).toBe(480);
    });
  });

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

  describe('grantWaveplateCrystal()', () => {
    it('adds points up to WAVEPLATE_CRYSTAL_CAP', () => {
      S.materials.waveplate_crystal = 0;
      const gained = stamina.grantWaveplateCrystal(100);
      expect(gained).toBe(100);
      expect(S.materials.waveplate_crystal).toBe(100);
    });

    it('caps at 480', () => {
      S.materials.waveplate_crystal = 470;
      const gained = stamina.grantWaveplateCrystal(30);
      expect(gained).toBe(10);
      expect(S.materials.waveplate_crystal).toBe(480);
    });

    it('legacy grantCondensedWaveplate maps to points', () => {
      S.materials.waveplate_crystal = 0;
      const gained = stamina.grantCondensedWaveplate(3);
      expect(gained).toBe(3);
      expect(S.materials.waveplate_crystal).toBe(3);
    });
  });

  describe('applyNaturalRecovery()', () => {
    it('fills under-max stamina then converts overflow to crystal', () => {
      S.stamina = 100;
      S.staminaMax = 240;
      S.materials.waveplate_crystal = 0;
      const r = stamina.applyNaturalRecovery(2);
      expect(r.filled).toBe(140);
      expect(r.crystal).toBe(340);
      expect(S.stamina).toBe(240);
      expect(S.materials.waveplate_crystal).toBe(340);
    });

    it('when already full, all recovery becomes crystal', () => {
      S.stamina = 240;
      S.staminaMax = 240;
      S.materials.waveplate_crystal = 10;
      const r = stamina.applyNaturalRecovery(1);
      expect(r.filled).toBe(0);
      expect(r.crystal).toBe(240);
      expect(S.stamina).toBe(240);
      expect(S.materials.waveplate_crystal).toBe(250);
    });

    it('keeps overcharge intact', () => {
      S.stamina = 300;
      S.staminaMax = 240;
      S.materials.waveplate_crystal = 0;
      const r = stamina.applyNaturalRecovery(1);
      expect(S.stamina).toBe(300);
      expect(r.filled).toBe(0);
      expect(r.crystal).toBe(240);
    });
  });

  describe('constants', () => {
    it('POTION_CAP is 480', () => {
      expect(stamina.POTION_CAP).toBe(480);
    });
    it('WAVEPLATE_CRYSTAL_CAP is 480', () => {
      expect(stamina.WAVEPLATE_CRYSTAL_CAP).toBe(480);
    });
    it('CONDENSED_CAP aliases WAVEPLATE_CRYSTAL_CAP', () => {
      expect(stamina.CONDENSED_CAP).toBe(480);
    });
    it('STAMINA_BUY_COST is 60', () => {
      expect(stamina.STAMINA_BUY_COST).toBe(60);
    });
    it('STAMINA_BUY_VALUE is 60', () => {
      expect(stamina.STAMINA_BUY_VALUE).toBe(60);
    });
  });
});
