// HP 核变奏：dmgType=variation 不得被 normal 的 hpMultOverride 吞掉；
// 协奏满时 multiplier 3.0 应对设计变奏 HP% 生效（相对 1.5 约 2 倍）。
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle } from '../helpers.js';
import { ACTION_MULTIPLIER } from '../../src/battle/balance.js';

describe('HP 核变奏路径', () => {
  let combat;
  let calcDamage;
  let setCurrentBattle;
  let queryCharacterHook;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    const damage = await import('../../src/battle/combat/damage.js');
    calcDamage = damage.calcDamage;
    setCurrentBattle = damage.setCurrentBattle;
    const idx = await import('../../src/battle/characters/index.js');
    queryCharacterHook = idx.queryCharacterHook;
  });

  beforeEach(() => {
    resetState({
      team: ['卡提希娅', '弗洛洛', '守岸人'],
      roles: {
        '卡提希娅': { level: 90, chain: 0 },
        '弗洛洛': { level: 90, chain: 0 },
        '守岸人': { level: 90, chain: 0 },
      },
    });
  });

  function unit(battle, name) {
    return battle.team.find(t => t.name === name);
  }

  function firstEnemyUnit(battle) {
    return battle.enemies.find(e => e.alive);
  }

  it('卡提希娅：变奏用 HP×10%，不是普攻 HP×12%', () => {
    const battle = quickBattle();
    setCurrentBattle(battle, queryCharacterHook);
    const self = unit(battle, '卡提希娅');
    const enemy = firstEnemyUnit(battle);
    const { dmg: varDmg } = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'variation');
    const { dmg: normalAsOld } = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'normal');
    // 旧 bug：variation 当 normal → 吃 0.12；新路径 0.10。两者应可区分（同面板无暴击差异时比例≈10/12）
    expect(varDmg).toBeGreaterThan(0);
    expect(normalAsOld).toBeGreaterThan(0);
    // 允许暴击噪声：用未暴击时的 ratio 近似——连续抽 20 次取中位数比
    const ratios = [];
    for (let i = 0; i < 30; i++) {
      const a = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'variation').dmg;
      const b = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'normal').dmg;
      if (b > 0) ratios.push(a / b);
    }
    ratios.sort((x, y) => x - y);
    const mid = ratios[Math.floor(ratios.length / 2)];
    // 0.10/0.12 ≈ 0.833；暴击同乘时仍接近
    expect(mid).toBeGreaterThan(0.7);
    expect(mid).toBeLessThan(0.95);
  });

  it('卡提希娅：协奏满变奏约为普通变奏的 2 倍（3.0/1.5）', () => {
    const battle = quickBattle();
    setCurrentBattle(battle, queryCharacterHook);
    const self = unit(battle, '卡提希娅');
    const enemy = firstEnemyUnit(battle);
    const ratios = [];
    for (let i = 0; i < 30; i++) {
      const weak = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'variation').dmg;
      const strong = calcDamage(self, enemy, ACTION_MULTIPLIER.concertoVariation, 'variation').dmg;
      if (weak > 0) ratios.push(strong / weak);
    }
    ratios.sort((x, y) => x - y);
    const mid = ratios[Math.floor(ratios.length / 2)];
    expect(mid).toBeGreaterThan(1.7);
    expect(mid).toBeLessThan(2.4);
  });

  it('弗洛洛：变奏 HP×3.3%，指挥状态 ×6.6%', () => {
    const battle = quickBattle(['弗洛洛', '守岸人', '安可']);
    setCurrentBattle(battle, queryCharacterHook);
    const self = unit(battle, '弗洛洛');
    const enemy = firstEnemyUnit(battle);
    const base = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'variation').dmg;
    self.furoloCommandTurns = 3;
    const cmd = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'variation').dmg;
    expect(base).toBeGreaterThan(0);
    expect(cmd).toBeGreaterThan(0);
    const ratios = [];
    for (let i = 0; i < 20; i++) {
      self.furoloCommandTurns = 0;
      const a = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'variation').dmg;
      self.furoloCommandTurns = 3;
      const b = calcDamage(self, enemy, ACTION_MULTIPLIER.variation, 'variation').dmg;
      if (a > 0) ratios.push(b / a);
    }
    ratios.sort((x, y) => x - y);
    const mid = ratios[Math.floor(ratios.length / 2)];
    expect(mid).toBeGreaterThan(1.6);
    expect(mid).toBeLessThan(2.5);
  });

  it('doSwitch 日志动作仍为变奏，且能结算伤害', () => {
    const battle = quickBattle();
    // 场上忌炎位实际是卡提——用队内切换
    const fi = battle.team.findIndex(t => t.name === '卡提希娅');
    const other = battle.team.findIndex((t, i) => i !== fi && t.alive);
    battle.active = other;
    battle.switchUsedThisTurn = false;
    const before = firstEnemyUnit(battle).hp;
    const r = combat.doSwitch(battle, fi);
    expect(r.ok).toBe(true);
    const after = firstEnemyUnit(battle).hp;
    expect(after).toBeLessThan(before);
    const varLog = battle.log.filter(l => l.action && String(l.action).includes('变奏'));
    expect(varLog.length).toBeGreaterThan(0);
  });
});
