// P0 tests for battle/chains.js — chain effect parsing and application
import { describe, it, expect, beforeEach } from 'vitest';
import { state0, S } from '../../src/state.js';
import { resetState } from '../helpers.js';

describe('battle/chains', () => {
  let chains;
  let stats;

  beforeAll(async () => {
    chains = await import('../../src/battle/chains.js');
    stats = await import('../../src/battle/stats.js');
  });

  beforeEach(() => {
    resetState({
      team: ['忌炎', '守岸人', '安可'],
      roles: {
        '忌炎': { level: 90, chain: 6, equipWeapon: '苍鳞千嶂' },
        '守岸人': { level: 90, chain: 6, equipWeapon: '星序协响' },
        '安可': { level: 90, chain: 6, equipWeapon: '漪澜浮录' },
      },
    });
  });

  // ===== getChainEffects() =====
  describe('getChainEffects()', () => {
    it('returns empty array for chain=0', () => {
      const effects = chains.getChainEffects('忌炎', 0);
      expect(effects).toEqual([]);
    });

    it('returns 1 effect for chain=1', () => {
      const effects = chains.getChainEffects('忌炎', 1);
      expect(effects.length).toBe(1);
    });

    it('returns 6 effects for chain=6', () => {
      const effects = chains.getChainEffects('忌炎', 6);
      expect(effects.length).toBe(6);
    });

    it('clamps chain to max 6', () => {
      const effects = chains.getChainEffects('忌炎', 10);
      expect(effects.length).toBe(6);
    });

    it('returns effects for known characters', () => {
      for (const name of ['忌炎', '守岸人', '今汐', '长离', '椿', '维里奈']) {
        const effects = chains.getChainEffects(name, 3);
        expect(effects.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('returns empty for unknown characters (Phase 4: fallback removed)', () => {
      const effects = chains.getChainEffects('不存在的角色', 3);
      expect(effects.length).toBe(0);
    });
  });

  // ===== chain effects modify battle unit stats =====
  describe('chain stat impact', () => {
    it('chain=0 vs chain=6 gives different unit stats after createBattle', async () => {
      const { createBattle } = await import('../../src/battle/combat.js');

      // 忌炎 0-chain
      S.roles['忌炎'].chain = 0;
      const names = ['忌炎', '守岸人', '安可'];
      const b0 = createBattle(names, ['火鬃狼']);
      const unit0 = b0?.team?.find(t => t.name === '忌炎');

      resetState({
        team: ['忌炎', '守岸人', '安可'],
        roles: {
          '忌炎': { level: 90, chain: 6, equipWeapon: '苍鳞千嶂' },
          '守岸人': { level: 90, chain: 6, equipWeapon: '星序协响' },
          '安可': { level: 90, chain: 6, equipWeapon: '漪澜浮录' },
        },
      });

      // 忌炎 6-chain
      S.roles['忌炎'].chain = 6;
      const b6 = createBattle(['忌炎', '守岸人', '安可'], ['火鬃狼']);
      const unit6 = b6?.team?.find(t => t.name === '忌炎');

      expect(unit0).toBeTruthy();
      expect(unit6).toBeTruthy();
      // 6-chain 忌炎 has: skillChargesMax 2 (C1) + ruiyi upgrade (C6) 等
      const hasDiff =
        (unit0.skillChargesMax || 1) !== (unit6.skillChargesMax || 1) ||
        (unit0.jiyanRuiyiCap || 0) !== (unit6.jiyanRuiyiCap || 0) ||
        !!unit6.jiyanMingDuan !== !!unit0.jiyanMingDuan;
      expect(hasDiff).toBe(true);
    });
  });

  // ===== getEnergyRefund() =====
  describe('getEnergyRefund()', () => {
    it('returns positive value for characters with energy refund chains', () => {
      // 卡卡罗 chain 1 has energyRefund=10
      S.roles['卡卡罗'] = {
        n: '卡卡罗', r: 5, owned: 1, chain: 1, pulled: 1,
        level: 90, exp: 0, equipWeapon: null,
        skillLevels: { 普攻: 1, 技能: 1, 解放: 1, 回路: 1 },
        spare: 0, bought: 0,
      };
      const effects = chains.getChainEffects('卡卡罗', 1);
      const hasEnergy = effects.some(e => e.effect === 'energyRefund');
      expect(hasEnergy).toBe(true);
      // Verify the value
      const refund = chains.getEnergyRefund({
        name: '卡卡罗',
        chain: 1,
      });
      expect(refund).toBeGreaterThan(0);
    });
  });

  // ===== Specific chain effects for key characters =====
  describe('specific chain effects', () => {
    it('忌炎 6-chain has jiyanRuiyiUpgrade effect', () => {
      const effects = chains.getChainEffects('忌炎', 6);
      const ruiyi = effects.find(e => e.effect === 'jiyanRuiyiUpgrade');
      expect(ruiyi).toBeTruthy();
      expect(ruiyi.cap).toBe(3);
      expect(ruiyi.perStack).toBe(1.2);
    });

    it('守岸人 5-chain has normalSplit effect', () => {
      const effects = chains.getChainEffects('守岸人', 5);
      const split = effects.find(e => e.effect === 'normalSplit');
      expect(split).toBeTruthy();
      expect(split.value).toBe(2);
    });

    it('守岸人 6-chain has variation damage bonus', () => {
      const effects = chains.getChainEffects('守岸人', 6);
      const c6 = effects.find(e => e.effect === 'shorekeeperC6');
      expect(c6).toBeTruthy();
      expect(c6.variationBonus).toBeCloseTo(0.42, 5);
      expect(c6.cdmg).toBe(5);
    });

    it('吟霖 3-chain has yinlinMarkVuln effect', () => {
      const effects = chains.getChainEffects('吟霖', 3);
      const boost = effects.find(e => e.effect === 'yinlinJudgmentBoost');
      expect(boost).toBeTruthy();
      expect(boost.value).toBeCloseTo(0.55, 5);
    });
  });
});
