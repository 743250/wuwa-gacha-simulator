// 吟霖 DoD：审判值→审判之雷挂印记、印记增伤、链不双算、skillHints 对账
import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeSoloTeam, forceEnergy,
  expectNoFlatDoubleCount, skillHintsSmoke,
} from './helpers/charDoD.js';

describe('battle/characters/yinlin — 吟霖', () => {
  let combat;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  it('C0 无重击、无常驻 typeBonus 双算', () => {
    const { unit } = makeSoloTeam('吟霖', { chain: 0 });
    expect(unit.hasHeavy).toBe(false);
    expectNoFlatDoubleCount(unit);
  });

  it('普攻+15 / 技能+30 审判值；满 100 触发审判之雷挂印记', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('吟霖', { chain: 0 });
    const enemy = battle.enemies[enemyIdx];
    expect(unit.verdict || 0).toBe(0);

    battle.ap = 4;
    expect(combat.doAttack(battle, enemyIdx).ok).toBe(true);
    expect(unit.verdict).toBe(15);
    expect(unit.forte?.current).toBe(15);

    battle.ap = 4;
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    expect(unit.verdict).toBe(45);

    // 清 CD 后继续：45+30=75；+15=90；+30→满触发
    unit.cd.skill = 0;
    battle.ap = 4;
    combat.doSkill(battle, enemyIdx);
    expect(unit.verdict).toBe(75);
    battle.ap = 4;
    combat.doAttack(battle, enemyIdx);
    expect(unit.verdict).toBe(90);
    unit.cd.skill = 0;
    battle.ap = 4;
    combat.doSkill(battle, enemyIdx);
    expect(unit.verdict).toBe(0);
    expect(enemy.judgeMark?.layers).toBeGreaterThanOrEqual(1);
    expect(battle.log.some(l => l.type === 'mechanic' && /审判之雷/.test(l.msg || ''))).toBe(true);
  });

  it('解放必挂印记；C1/C3/C5 对印记目标技能/解放有数', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('吟霖', { chain: 6 });
    const enemy = battle.enemies[enemyIdx];
    expect(unit.yinlinMarkSkillBonus).toBeCloseTo(0.7, 5);
    expect(unit.yinlinMarkBurstBonus).toBeCloseTo(0.5, 5);
    expect(unit.yinlinMarkVulnPerStack).toBeCloseTo(0.1, 5);

    forceEnergy(unit);
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(enemy.judgeMark?.layers).toBeGreaterThanOrEqual(1);

    // 再技能命中印记：叠层 + C1 技能增伤路径有伤害
    battle.ap = 4;
    const beforeHp = enemy.hp;
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    expect(beforeHp - enemy.hp).toBeGreaterThan(0);
    expect(enemy.judgeMark.layers).toBeGreaterThanOrEqual(2);
  });

  it('C4 审判之雷或解放挂前行的鼓舞全队 atk+15%；C6 疾霆窗口', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('吟霖', { chain: 6 });
    expect(unit.yinlinJudgmentTeamAtk?.value).toBeCloseTo(0.15, 5);
    expect(unit.yinlinJiTing?.value).toBeCloseTo(0.7, 5);

    // 直接把审判值堆满触发审判之雷（C4 buff）
    unit.verdict = 90;
    battle.ap = 4;
    combat.doAttack(battle, enemyIdx);
    for (const t of battle.team) {
      if (!t.alive) continue;
      expect((t.buffs || []).some(b => b.src === '前行的鼓舞' && b.type === 'atkUp' && Math.abs(b.value - 0.15) < 1e-6)).toBe(true);
    }

    const enemy = battle.enemies[enemyIdx];
    forceEnergy(unit);
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(unit.yinlinJiTingActive).toBeGreaterThan(0);
    expect(enemy.judgeMark?.layers).toBeGreaterThanOrEqual(1);

    // 普攻命中印记 → 疾霆昭彰
    battle.ap = 4;
    combat.doAttack(battle, enemyIdx);
    expect(battle.log.some(l => l.action === '疾霆昭彰（6 链）')).toBe(true);
  });

  it('skillHints C6 印记叠满技能/解放数字与链倍率一致', () => {
    const entry = skillHints.SKILL_HINTS['吟霖'];
    const smoke = skillHintsSmoke(entry, 6);
    expect(smoke.ok).toBe(true);
    const atk = 1000;
    // 技能：1800 × 1.7 × (1+0.1*3) = 1800 × 1.7 × 1.3
    const markedSkill = Math.round(atk * 1.8 * 1.7 * 1.3);
    // 解放主：7000 × 1.7 × 1.5 × 1.3
    const markedBurst = Math.round(atk * 7.0 * 1.7 * 1.5 * 1.3);
    const skillLine = smoke.lines.find(l => l.name && l.name.includes('共鸣技能'));
    const burstLine = smoke.lines.find(l => l.name && l.name.includes('解放'));
    expect(skillLine?.desc).toMatch(new RegExp(String(markedSkill)));
    expect(burstLine?.desc).toMatch(new RegExp(String(markedBurst)));
    // 疾霆 1000×0.7×1.7
    const jiTing = Math.round(atk * 0.7 * 1.7);
    const normalLine = smoke.lines.find(l => l.name && l.name.includes('普攻'));
    expect(normalLine?.desc).toMatch(new RegExp(String(jiTing)));
  });
});
