// 攻守双向统一防御乘区
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { resetState, quickBattle } from '../helpers.js';
import { resistMultiplier } from '../../src/battle/elements.js';

describe('defenseMultiplier (official shared formula)', () => {
  let damage;
  let enemyAI;
  let combat;

  beforeAll(async () => {
    damage = await import('../../src/battle/combat/damage.js');
    enemyAI = await import('../../src/battle/combat/enemyAI.js');
    combat = await import('../../src/battle/combat.js');
  });

  beforeEach(() => {
    resetState({
      team: ['忌炎'],
      roles: { '忌炎': { level: 90, chain: 0, equipWeapon: '苍鳞千嶂' } },
    });
  });

  it('exports the shared formula', () => {
    // 1000 防 · 攻方 90 级 → 1000/(800+720+1000)=1000/2520
    const m = damage.defenseMultiplier(1000, 90);
    expect(m).toBeCloseTo(1 - 1000 / 2520, 6);
  });

  it('zero def deals full damage factor 1', () => {
    expect(damage.defenseMultiplier(0, 90)).toBe(1);
  });

  it('enemyAttack uses percentage mitigation not flat def*0.5', () => {
    const battle = quickBattle(null, [{ name: '火鬃狼', scale: 1 }]);
    const unit = battle.team[0];
    unit.def = 1000;
    unit.dodge = 0;
    const enemy = battle.enemies[0];
    enemy.level = 90;
    enemy.atk = 1000;
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const before = unit.hp;
    const dealt = enemyAI.enemyAttack(battle, enemy, unit, { mult: 1, critRate: 0 });
    vi.restoreAllMocks();
    const resMult = resistMultiplier(enemy.element, { element: unit.element });
    const defMult = damage.defenseMultiplier(1000, 90);
    const expected = Math.max(1, Math.round(1030 * resMult * defMult));
    expect(dealt).toBe(expected);
    expect(before - unit.hp).toBe(dealt);
    // 旧公式：max(30, 1030*res - 500)，与百分比结果不同
    const oldFlat = Math.max(30, Math.round(1030 * resMult - 500));
    expect(dealt).not.toBe(oldFlat);
  });

  it('combat facade re-exports defenseMultiplier', () => {
    expect(typeof combat.defenseMultiplier).toBe('function');
    expect(combat.defenseMultiplier(1000, 90)).toBeCloseTo(damage.defenseMultiplier(1000, 90), 10);
  });

  it('spawned enemies carry level for mitigation', () => {
    const battle = quickBattle(null, [{ name: '火鬃狼', scale: 1 }]);
    expect(battle.enemies[0].level).toBeTruthy();
  });
});
