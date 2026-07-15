// 今汐 DoD：韶光→惊龙破空、C3 谪仙、C4 全队 allDmg、C5 解放、skillHints 对账
import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeSoloTeam, forceEnergy, forceForte,
  expectNoFlatDoubleCount, skillHintsSmoke,
} from './helpers/charDoD.js';

describe('battle/characters/jinhsi — 今汐', () => {
  let combat;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  it('C0 有重击；无 C3/C4 常驻 typeBonus 双算', () => {
    const { unit } = makeSoloTeam('今汐', { chain: 0 });
    expect(unit.hasHeavy).toBe(true);
    expectNoFlatDoubleCount(unit);
  });

  it('技能 +1 韶光，满 4 层惊龙破空消耗并 ×3.0（绝对 480%）', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('今汐', { chain: 0 });
    expect(unit.forte.max).toBe(4);
    expect(unit.forte.effectMult).toBeCloseTo(3.0, 5);

    for (let i = 0; i < 3; i++) {
      unit.cd.skill = 0;
      battle.ap = 4;
      expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    }
    expect(unit.forte.current).toBe(3);
    unit.cd.skill = 0;
    battle.ap = 4;
    combat.doSkill(battle, enemyIdx);
    expect(unit.forte.current).toBe(4);
    expect(unit.forte.ready).toBe(true);

    unit.cd.skill = 0;
    battle.ap = 4;
    const beforeHp = battle.enemies[enemyIdx].hp;
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    expect(unit.forte.current).toBe(0);
    expect(unit.forte.ready).toBe(false);
    expect(beforeHp - battle.enemies[enemyIdx].hp).toBeGreaterThan(0);
    expect(battle.log.some(l => l.type === 'skill' && /强化|韶光/.test(String(l.action || '')))).toBe(true);
  });

  it('C3 变奏谪仙 atk+50%；C4 惊龙/解放全队 allDmgUp；C6 forte ×3.4', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('今汐', { chain: 6 });
    expect(unit.jinhsiZheXian).toBe(true);
    expect(unit.jinhsiTeamAllDmg).toBe(true);
    expect(unit.skillBonus || 0).toBeCloseTo(0.8, 5); // 仅 C1
    expect(unit.burstBonus || 0).toBeCloseTo(1.2, 5);
    expect(unit.forte.effectMult).toBeCloseTo(3.4, 5); // 3.0+0.4

    const other = battle.team.findIndex(t => t.name !== '今汐');
    battle.active = other;
    battle.ap = 4;
    expect(combat.doSwitch(battle, battle.team.findIndex(t => t.name === '今汐')).ok).toBe(true);
    expect((unit.buffs || []).some(b => b.src === '谪仙' && b.type === 'atkUp' && Math.abs(b.value - 0.5) < 1e-6)).toBe(true);

    forceForte(unit, 4);
    unit.cd.skill = 0;
    battle.ap = 4;
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    for (const t of battle.team) {
      if (!t.alive) continue;
      expect((t.buffs || []).some(b => b.src === '自甘佑凡尘' && b.type === 'allDmgUp')).toBe(true);
    }

    forceEnergy(unit);
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(unit.forte.current).toBeGreaterThanOrEqual(2);
  });

  it('skillHints C6 惊龙/解放数字含 C1/C5 与 ×3.4', () => {
    const entry = skillHints.SKILL_HINTS['今汐'];
    // 注入 skillBonus/burstBonus 模拟 getSkillHintRoleContext
    const role = { chain: 6, skillBonus: 0.8, burstBonus: 1.2 };
    const lines = entry.customLines({ atk: 1000, maxEnergy: 125 }, role);
    expect(Array.isArray(lines) && lines.length >= 1).toBe(true);
    // 惊龙：1000 * 1.6 * 3.4 * 1.8 = 9792
    const jing = Math.round(1000 * 1.6 * 3.4 * 1.8);
    const skillLine = lines.find(l => l.name && l.name.includes('共鸣技能'));
    expect(skillLine?.desc).toMatch(new RegExp(String(jing)));
    // 解放主：1000*10*2.2 = 22000（1000% × C5 +120%）
    const burstMain = Math.round(1000 * 10.0 * 2.2);
    const burstLine = lines.find(l => l.name && l.name.includes('解放'));
    expect(burstLine?.desc).toMatch(new RegExp(String(burstMain)));
    expect(skillHintsSmoke(entry, 6).ok).toBe(true);
  });
});
