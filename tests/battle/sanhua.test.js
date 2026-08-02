// 散华 DoD：冰棘满才爆裂、清空、C3/C4/C5/C6、凛絜
import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeSoloTeam, forceEnergy, forceForte,
  expectNoFlatDoubleCount, skillHintsSmoke,
} from './helpers/charDoD.js';

describe('battle/characters/sanhua — 散华', () => {
  let combat;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    skillHints = await import('../../src/ui/panels/roleModal/skillHints/index.js');
  });

  it('C0 有重击、无常驻 flat typeBonus 双算', () => {
    const { unit } = makeSoloTeam('散华', { chain: 0 });
    expect(unit.hasHeavy).toBe(true);
    expectNoFlatDoubleCount(unit);
  });

  it('冰棘未满不可重击；满条可爆裂并清空', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('散华', { chain: 0 });
    battle.ap = 4;
    forceForte(unit, 50);
    const blocked = combat.doHeavy(battle, enemyIdx);
    expect(blocked.ok).toBe(false);

    forceForte(unit, 100);
    expect(unit.forte.ready).toBe(true);
    const ok = combat.doHeavy(battle, enemyIdx);
    expect(ok.ok).toBe(true);
    expect(unit.forte.current).toBe(0);
    expect(unit.forte.ready).toBe(false);
    const heavyLog = battle.log.filter(l => l.type === 'heavy' || l.action === '重击·爆裂');
    expect(heavyLog.length).toBeGreaterThan(0);
  });

  it('普攻 +10 / 技能 +20 冰棘', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('散华', { chain: 0 });
    battle.ap = 4;
    forceForte(unit, 0);
    combat.doAttack(battle, enemyIdx);
    expect(unit.forte.current).toBe(10);
    combat.doSkill(battle, enemyIdx);
    expect(unit.forte.current).toBe(30);
  });

  it('C1 第 5 次普攻挂暴击窗', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('散华', { chain: 1 });
    battle.ap = 10;
    for (let i = 0; i < 5; i++) {
      battle.ap = Math.max(battle.ap, 2);
      combat.doAttack(battle, enemyIdx);
    }
    expect(unit.sanhuaNormalCount).toBe(5);
    const crate = (unit.buffs || []).find(b => b.src === '孤身孑然' && b.type === 'crateUp');
    expect(crate).toBeTruthy();
    expect(crate.value).toBeCloseTo(0.15);
  });

  it('C2 常驻 heavyBonus +20%', () => {
    const { unit } = makeSoloTeam('散华', { chain: 2 });
    expect(unit.heavyBonus || 0).toBeCloseTo(0.2);
  });

  it('C3 对生命低于 70% 目标增伤', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('散华', { chain: 3 });
    expect(unit.sanhuaC3).toBeCloseTo(0.35);
    const enemy = battle.enemies[enemyIdx];
    enemy.hp = Math.floor(enemy.hpMax * 0.5);
    const mech = combat; // hooks via unit
    // 通过 getCharacterMechanic 间接：calc 路径用 getMarkDamageBonus
    const { getCharacterMechanic } = require('../../src/battle/characters/index.js');
    const m = getCharacterMechanic('散华');
    expect(m.getMarkDamageBonus(unit, enemy)).toBeCloseTo(1.35);
    enemy.hp = enemy.hpMax;
    expect(m.getMarkDamageBonus(unit, enemy)).toBe(1);
  });

  it('C4 解放回能 + 下次爆裂窗，爆裂后清除', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('散华', { chain: 4 });
    forceEnergy(unit);
    const energyBefore = unit.energy;
    battle.ap = 6;
    combat.doBurst(battle);
    expect(unit.energy).toBeGreaterThanOrEqual(Math.min(unit.energyMax, 10)); // 回 10 后再可能因其他逻辑变化
    const win = (unit.buffs || []).find(b => b.src === '剑修五蕴');
    expect(win).toBeTruthy();
    expect(win.value).toBeCloseTo(1.2);

    forceForte(unit, 100);
    battle.ap = 4;
    combat.doHeavy(battle, enemyIdx);
    const after = (unit.buffs || []).find(b => b.src === '剑修五蕴');
    expect(after).toBeFalsy();
    void energyBefore;
  });

  it('C5 仅 heavy 吃 cdmgBonus，普攻不吃', () => {
    const { unit } = makeSoloTeam('散华', { chain: 5 });
    expect(unit.sanhuaC5).toBeCloseTo(1);
    const { getCharacterMechanic } = require('../../src/battle/characters/index.js');
    const m = getCharacterMechanic('散华');
    expect(m.cdmgBonus(unit, null, 'heavy')).toBeCloseTo(1);
    expect(m.cdmgBonus(unit, null, 'normal')).toBe(0);
    // 面板 cdmg 不应被链直接 +100%
    expect(unit.cdmg).toBeLessThan(3);
  });

  it('C6 爆裂叠全队攻最多 2 层', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('散华', { chain: 6 });
    battle.ap = 8;
    forceForte(unit, 100);
    combat.doHeavy(battle, enemyIdx);
    const layers1 = (unit.buffs || []).filter(b => b.src === '曙色天光');
    expect(layers1.length).toBe(1);
    expect(layers1[0].value).toBeCloseTo(0.1);

    unit.cd.heavy = 0;
    forceForte(unit, 100);
    battle.ap = 4;
    combat.doHeavy(battle, enemyIdx);
    const layers2 = (unit.buffs || []).filter(b => b.src === '曙色天光');
    expect(layers2.length).toBe(2);

    unit.cd.heavy = 0;
    forceForte(unit, 100);
    battle.ap = 4;
    combat.doHeavy(battle, enemyIdx);
    const layers3 = (unit.buffs || []).filter(b => b.src === '曙色天光');
    expect(layers3.length).toBe(2);
  });

  it('延奏凛絜：切出给下一位普攻加深 38%', () => {
    const { battle, unit } = makeSoloTeam('散华', { chain: 0, fillers: ['安可', '忌炎'] });
    const shIdx = battle.team.findIndex(t => t.name === '散华');
    const otherIdx = battle.team.findIndex(t => t.name !== '散华');
    battle.active = shIdx;
    battle.switchUsedThisTurn = false;
    combat.doSwitch(battle, otherIdx);
    const other = battle.team[otherIdx];
    const lin = (other.buffs || []).find(b => b.src === '凛絜' && b.type === 'normalDmgUp');
    expect(lin).toBeTruthy();
    expect(lin.value).toBeCloseTo(0.38);
    void unit;
  });

  it('skillHints 冒烟', () => {
    const entry = skillHints.SKILL_HINTS['散华'];
    expect(entry.intro).toContain('冰棘');
    const smoke = skillHintsSmoke(entry, 6);
    expect(smoke.ok).toBe(true);
  });
});
