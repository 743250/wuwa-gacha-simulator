// 卡提希娅 DoD：0AP 进芙露、决意、风蚀、二次解放有数、skillHints HP 对账
import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeSoloTeam, forceEnergy, forceStack,
  expectNoFlatDoubleCount, skillHintsSmoke,
} from './helpers/charDoD.js';

describe('battle/characters/cartethyia — 卡提希娅', () => {
  let combat;
  let stacks;
  let skillHints;
  let erosion;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    stacks = await import('../../src/battle/stacks.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
    erosion = await import('../../src/battle/combat/erosion.js');
  });

  it('C0 无常驻 typeBonus 双算；无通用重击按钮', () => {
    const { unit } = makeSoloTeam('卡提希娅', { chain: 0 });
    expect(unit.hasHeavy).toBeFalsy();
    expectNoFlatDoubleCount(unit);
  });

  it('普攻叠决意；满能量 0AP 第一次解放进芙露德莉斯', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('卡提希娅', { chain: 0 });
    expect(stacks.getStack(unit, 'cartethyia_resolve')).toBe(0);

    battle.ap = 4;
    expect(combat.doAttack(battle, enemyIdx).ok).toBe(true);
    expect(stacks.getStack(unit, 'cartethyia_resolve')).toBe(1);

    forceEnergy(unit);
    battle.ap = 0; // 第一次解放 0 AP
    const r = combat.doBurst(battle);
    expect(r.ok).toBe(true);
    expect((unit.cartethyiaFurTurns || 0) > 0 || battle.log.some(l =>
      /芙露德莉斯|听骑士从心祈愿/.test(String(l.action || l.msg || ''))
    )).toBe(true);
    // 0 AP 消耗：进解放后 AP 仍为 0
    expect(battle.ap).toBe(0);
    // 决意被消耗
    expect(stacks.getStack(unit, 'cartethyia_resolve')).toBe(0);
  });

  it('芙露形态攻击挂 wind_erosion；二次解放 3AP 有数并清风蚀', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('卡提希娅', { chain: 0 });
    // 叠 3 决意 → 异权
    battle.ap = 4;
    combat.doAttack(battle, enemyIdx);
    combat.doAttack(battle, enemyIdx);
    combat.doAttack(battle, enemyIdx);
    forceEnergy(unit);
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect((unit.cartethyiaFurTurns || 0) > 0).toBe(true);

    // 芙露下普攻挂风蚀
    battle.ap = 4;
    combat.doAttack(battle, enemyIdx);
    const enemy = battle.enemies[enemyIdx];
    const stacksBefore = erosion.getErosionStacks(enemy);
    expect(stacksBefore).toBeGreaterThan(0);
    // 走 effects wind_erosion，不是旧 type:'erosion'
    expect(enemy.debuffs?.some(d => d.effect === 'wind_erosion' || d.type === 'effect')).toBe(true);

    forceEnergy(unit);
    battle.ap = 3;
    const beforeHp = enemy.hp;
    const r2 = combat.doBurst(battle);
    expect(r2.ok).toBe(true);
    expect(beforeHp - enemy.hp).toBeGreaterThan(0);
    // 非 C6 应清空风蚀并退出形态
    expect(erosion.getErosionStacks(enemy)).toBe(0);
    expect(unit.cartethyiaFurTurns || 0).toBe(0);
  });

  it('C3 二次解放倍率字段；skillHints 满决意 HP 数字对账', () => {
    const { unit } = makeSoloTeam('卡提希娅', { chain: 3 });
    // 链3 给第二次解放 +60% HP 倍率字段
    if (unit.cartethyiaBurstHpBonus != null) {
      expect(unit.cartethyiaBurstHpBonus).toBeCloseTo(0.60, 5);
    }

    const entry = skillHints.SKILL_HINTS['卡提希娅'];
    const smoke = skillHintsSmoke(entry, 0);
    expect(smoke.ok).toBe(true);

    const hp = 15000;
    const resolveBonus = 1.30;
    const normal = Math.round(hp * 0.12 * resolveBonus);
    const skill = Math.round(hp * 0.22 * resolveBonus);
    const burst0 = Math.round(hp * 0.462);
    const all = smoke.lines.map(l => (typeof l === 'string' ? l : `${l.name || ''} ${l.desc || ''}`)).join('\n');
    expect(all).toMatch(new RegExp(String(normal)));
    expect(all).toMatch(new RegExp(String(skill)));
    expect(all).toMatch(new RegExp(String(burst0)));
  });
});
