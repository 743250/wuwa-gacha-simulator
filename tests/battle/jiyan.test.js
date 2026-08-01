// 忌炎 DoD：锐意攒放、破阵强化普攻、链不双算、skillHints 对账
import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeSoloTeam, forceEnergy, forceForte, forceStack,
  expectNoFlatDoubleCount, skillHintsSmoke,
} from './helpers/charDoD.js';

describe('battle/characters/jiyan — 忌炎', () => {
  let combat;
  let stacks;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    stacks = await import('../../src/battle/stacks.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  it('C0 无常驻 typeBonus 双算；有重击', () => {
    const { unit } = makeSoloTeam('忌炎', { chain: 0 });
    expect(unit.hasHeavy).toBe(true);
    expectNoFlatDoubleCount(unit);
  });

  it('技能/重击各 +1 锐意，上限 2；解放消耗并 ×(1+层)', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('忌炎', { chain: 0 });
    expect(stacks.getStack(unit, 'jiyan_ruiyi')).toBe(0);

    battle.ap = 4;
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    expect(stacks.getStack(unit, 'jiyan_ruiyi')).toBe(1);

    battle.ap = 4;
    expect(combat.doHeavy(battle, enemyIdx).ok).toBe(true);
    expect(stacks.getStack(unit, 'jiyan_ruiyi')).toBe(2);

    // 满 cap 后再技能不加
    battle.ap = 4;
    combat.doSkill(battle, enemyIdx);
    expect(stacks.getStack(unit, 'jiyan_ruiyi')).toBe(2);

    forceEnergy(unit);
    battle.ap = 4;
    const beforeAtk = unit.atk;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(stacks.getStack(unit, 'jiyan_ruiyi')).toBe(0);
    // 2 层 ×0.4 → 解放 ×1.8；基底后动 715% → 约 12.87×atk
    const burstLog = [...battle.log].reverse().find(l => l.type === 'burst' && l.src === '忌炎');
    expect(burstLog).toBeTruthy();
    const primary = (burstLog.results || []).find(r => r.primary) || burstLog.results?.[0];
    expect(primary?.dmg).toBeGreaterThan(0);
    // 命中前主目标约 12.87×atk，扣抗 + 官方 DEF(1512, defMult≈0.501) 后约 5.8×atk
    expect(primary.dmg).toBeGreaterThan(beforeAtk * 5);
    expect(battle.log.some(l => l.type === 'mechanic' && /锐意之势 2/.test(l.msg || ''))).toBe(true);
  });

  it('破阵满后下次普攻强化 ×2', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('忌炎', { chain: 0 });
    forceForte(unit, 100);
    expect(unit.forte.ready).toBe(true);
    battle.ap = 4;
    expect(combat.doAttack(battle, enemyIdx).ok).toBe(true);
    expect(battle.log.some(l =>
      l.src === '忌炎' && (l.action === '枪扫风定·强化连段' || /破阵|强化/.test(String(l.action || l.msg || '')))
    ) || unit.forte.current < 100).toBe(true);
  });

  it('C6 锐意 cap3 perStack1.2；skillHints 满锐意主目标数字一致', () => {
    const { unit } = makeSoloTeam('忌炎', { chain: 6 });
    expect(unit.jiyanRuiyiCap).toBe(3);
    expect(unit.jiyanRuiyiPerStack).toBeCloseTo(1.2, 5);

    const atk = 1000;
    const entry = skillHints.SKILL_HINTS['忌炎'];
    const smoke = skillHintsSmoke(entry, 6);
    expect(smoke.ok).toBe(true);
    const fullMult = 1 + 3 * 1.2; // 4.6
    const burstFull = Math.round(atk * 7.15 * fullMult); // 32890（后动 715% × 满锐意）
    const burstLine = smoke.lines.find(l => l.name && l.name.includes('解放'));
    expect(burstLine?.desc).toMatch(new RegExp(String(burstFull)));
    expect(burstLine?.desc).toMatch(/×4\.6|4\.6/);
    expect(burstLine?.desc).toMatch(/715%/);
  });

  it('C2/C5 变奏入场挂攻击；C4 解放后全队重击加深', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('忌炎', { chain: 6 });
    // 切到副手再切回触发 switchIn
    const other = battle.team.findIndex(t => t.name !== '忌炎');
    battle.active = other;
    battle.ap = 4;
    expect(combat.doSwitch(battle, battle.team.findIndex(t => t.name === '忌炎')).ok).toBe(true);
    expect(stacks.getStack(unit, 'jiyan_ruiyi')).toBeGreaterThanOrEqual(1);
    expect((unit.buffs || []).some(b => b.src === '通变' && b.type === 'atkUp')).toBe(true);
    expect((unit.buffs || []).some(b => b.src === '明断' && b.type === 'atkUp')).toBe(true);

    forceStack(unit, 'jiyan_ruiyi', 3);
    forceEnergy(unit);
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    for (const t of battle.team) {
      if (!t.alive) continue;
      expect((t.buffs || []).some(b => b.src === '奇正' && b.type === 'heavyDmgUp' && Math.abs(b.value - 0.25) < 1e-6)).toBe(true);
    }
  });

  it('C1 技能充能上限 2：可连放两次再进 CD', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('忌炎', { chain: 1 });
    expect(unit.skillChargesMax).toBe(2);
    expect(unit.skillCharges).toBe(2);
    battle.ap = 4;
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    expect(unit.skillCharges).toBe(1);
    // 仍有 1 层，可立刻再放
    battle.ap = 4;
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    expect(unit.skillCharges).toBe(0);
    battle.ap = 4;
    const blocked = combat.doSkill(battle, enemyIdx);
    expect(blocked.ok).toBe(false);
  });
});
