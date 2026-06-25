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
        '安可': { level: 90, chain: 6, equipWeapon: '焰光裁定' },
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

    it('returns fallback for unknown characters', () => {
      const effects = chains.getChainEffects('不存在的角色', 3);
      expect(effects.length).toBe(3);
    });
  });

  // ===== getOverrideMeta() =====
  describe('getOverrideMeta()', () => {
    it('returns metadata for known characters', () => {
      const meta = chains.getOverrideMeta('忌炎', 0);
      expect(meta).toBeTruthy();
      expect(meta).toHaveProperty('title');
      expect(meta).toHaveProperty('summary');
    });

    it('returns null for unknown characters', () => {
      expect(chains.getOverrideMeta('不存在', 0)).toBeNull();
    });
  });

  // ===== hasChainOverride() / hasChainBattleEffects() =====
  describe('hasChainOverride()', () => {
    it('returns true for extracted characters', () => {
      expect(chains.hasChainOverride('忌炎')).toBe(true);
      expect(chains.hasChainOverride('守岸人')).toBe(true);
    });

    it('returns boolean for unknown characters', () => {
      expect(typeof chains.hasChainOverride('不存在')).toBe('boolean');
    });
  });

  // ===== chain effects modify battle unit stats =====
  describe('chain stat impact', () => {
    it('chain=0 vs chain=6 gives different unit stats after createBattle', async () => {
      const { createBattle } = await import('../../src/battle/combat.js');

      // 忌炎 0-chain
      S.roles['忌炎'].chain = 0;
      const names = ['忌炎', '守岸人', '安可'];
      const b0 = createBattle(names, ['幼狼']);
      const unit0 = b0?.team?.find(t => t.name === '忌炎');

      resetState({
        team: ['忌炎', '守岸人', '安可'],
        roles: {
          '忌炎': { level: 90, chain: 6, equipWeapon: '苍鳞千嶂' },
          '守岸人': { level: 90, chain: 6, equipWeapon: '星序协响' },
          '安可': { level: 90, chain: 6, equipWeapon: '焰光裁定' },
        },
      });

      // 忌炎 6-chain
      S.roles['忌炎'].chain = 6;
      const b6 = createBattle(['忌炎', '守岸人', '安可'], ['幼狼']);
      const unit6 = b6?.team?.find(t => t.name === '忌炎');

      expect(unit0).toBeTruthy();
      expect(unit6).toBeTruthy();
      // 6-chain 忌炎 has: jiyanSkillChargeFaster (skillCdReduce), jiyanRuiyiUpgrade (cap + perStack), etc.
      // At minimum, skillCdReduce should differ
      const hasDiff =
        (unit0.skillCdReduce || 0) !== (unit6.skillCdReduce || 0) ||
        (unit0.jiyanRuiyiCap || 0) !== (unit6.jiyanRuiyiCap || 0);
      expect(hasDiff).toBe(true);
    });
  });

  // ===== getChainLabels() — UI labels =====
  describe('getChainLabels()', () => {
    it('returns 6 labels for known characters', () => {
      const labels = chains.getChainLabels('忌炎');
      expect(labels).toHaveLength(6);
      expect(typeof labels[0]).toBe('string');
      expect(labels[0].length).toBeGreaterThan(0);
    });

    it('returns HTML content for extracted characters', () => {
      const labels = chains.getChainLabels('忌炎');
      const hasHtml = labels.some(l => l.includes('<b class='));
      expect(hasHtml).toBe(true);
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
      const vari = effects.find(e => e.effect === 'variationDmg');
      expect(vari).toBeTruthy();
      expect(vari.value).toBe(5.0);
    });

    it('吟霖 3-chain has yinlinMarkVuln effect', () => {
      const effects = chains.getChainEffects('吟霖', 3);
      const vuln = effects.find(e => e.effect === 'yinlinMarkVuln');
      expect(vuln).toBeTruthy();
      expect(vuln.value).toBeGreaterThan(0);
    });
  });
});
