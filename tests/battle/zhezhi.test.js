// 折枝 DoD：解放墨鹤领域、追击、点睛护盾、链 cap/白鹤、skillHints 有数
import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeSoloTeam, forceEnergy,
  expectNoFlatDoubleCount, skillHintsSmoke,
} from './helpers/charDoD.js';

describe('battle/characters/zhezhi — 折枝', () => {
  let combat;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  it('C0 有重击；无 flat typeBonus 双算', () => {
    const { unit } = makeSoloTeam('折枝', { chain: 0 });
    expect(unit.hasHeavy).toBe(true);
    expectNoFlatDoubleCount(unit);
  });

  it('解放展开领域初召 6 墨鹤；普攻触发追击消耗 1', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('折枝', { chain: 0 });
    forceEnergy(unit);
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(unit.zhezhiFieldTurns).toBeGreaterThan(0);
    expect(unit.zhezhiCranes).toBe(6);

    const cranesBefore = unit.zhezhiCranes;
    battle.ap = 4;
    expect(combat.doAttack(battle, enemyIdx).ok).toBe(true);
    expect(unit.zhezhiCranes).toBe(cranesBefore - 1);
    expect(battle.log.some(l => /墨鹤追击/.test(String(l.action || '')))).toBe(true);
  });

  it('领域内技能补 +1 墨鹤；重击点睛转护盾', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('折枝', { chain: 0 });
    forceEnergy(unit);
    battle.ap = 4;
    combat.doBurst(battle);
    // 追击先耗 1 → 5；技能补 +1 且技能自身也会 craneAssist 再 -1 → 净 5
    unit.zhezhiCranes = 5;
    unit.cd.skill = 0;
    battle.ap = 4;
    combat.doSkill(battle, enemyIdx);
    expect(battle.log.some(l => /墨鹤 \+1|神来之笔/.test(String(l.msg || '')))).toBe(true);

    unit.zhezhiCranes = 4;
    battle.ap = 4;
    expect(combat.doHeavy(battle, enemyIdx).ok).toBe(true);
    expect(battle.log.some(l => /点睛/.test(String(l.msg || '')))).toBe(true);
    for (const t of battle.team) {
      if (t.alive) expect((t.shield || 0)).toBeGreaterThan(0);
    }
  });

  it('C2 cap12；C4 解放全队 atk；C6 白鹤；skillHints 有数', () => {
    const { battle, unit } = makeSoloTeam('折枝', { chain: 6 });
    expect(unit.zhezhiCraneCapBonus).toBe(6);
    expect(unit.zhezhiTeamAtk4Chain).toBe(true);
    expect(unit.zhezhiWhiteCrane).toBe(true);
    expect(unit.zhezhiExtraCrane).toBe(true);

    forceEnergy(unit);
    battle.ap = 4;
    combat.doBurst(battle);
    expect(unit.zhezhiCraneCap).toBe(12);
    expect(unit.zhezhiCranes).toBe(6);
    for (const t of battle.team) {
      if (!t.alive) continue;
      expect((t.buffs || []).some(b => b.src === '随类赋彩' && b.type === 'atkUp')).toBe(true);
    }

    unit.cd.skill = 0;
    battle.ap = 4;
    combat.doSkill(battle, 0);
    expect(battle.log.some(l => /白鹤/.test(String(l.action || '')))).toBe(true);

    const smoke = skillHintsSmoke(skillHints.SKILL_HINTS['折枝'], 6);
    expect(smoke.ok).toBe(true);
  });
});
