// 剩余工厂向 S/A 角最小 DoD：核心循环有数 + C0 无 flat 双算嫌疑 + skillHints 有数
import { describe, it, expect, beforeAll } from 'vitest';
import {
  makeSoloTeam, forceEnergy, forceForte,
  expectNoFlatDoubleCount, skillHintsSmoke,
} from './helpers/charDoD.js';

const ROLES = ['相里要', '珂莱塔', '洛可可', '菲比', '布兰特', '坎特蕾拉'];

describe('battle · 剩余未验收工厂 S 角最小 DoD', () => {
  let combat;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  for (const name of ROLES) {
    it(`${name}：可开战、C0 无 flat typeBonus、普攻有数、skillHints 有数`, () => {
      const { battle, unit, enemyIdx } = makeSoloTeam(name, { chain: 0 });
      expect(unit).toBeTruthy();
      expectNoFlatDoubleCount(unit);
      battle.ap = 4;
      const before = battle.enemies[enemyIdx].hp;
      expect(combat.doAttack(battle, enemyIdx).ok).toBe(true);
      expect(before - battle.enemies[enemyIdx].hp).toBeGreaterThan(0);
      const entry = skillHints.SKILL_HINTS[name];
      expect(entry, `${name} missing skillHints`).toBeTruthy();
      expect(skillHintsSmoke(entry, 0).ok).toBe(true);
    });
  }

  it('相里要：满衍构解放进 burstWindow', () => {
    const { battle, unit } = makeSoloTeam('相里要', { chain: 0 });
    forceForte(unit, 100);
    forceEnergy(unit);
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect((unit.buffs || []).some(b => b.type === 'burstWindow')).toBe(true);
  });

  it('珂莱塔：技能挂解离；满晶体强化技能；C1 crate 字段；C4 重击全队 skillDmgUp', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('珂莱塔', { chain: 6 });
    expect(unit.carlottaCrateVsDebuff).toBeCloseTo(0.125, 5);
    expect(unit.carlottaTeamSkillAfterHeavy).toBeCloseTo(0.25, 5);
    // C1 不再常驻 crate
    expect(unit.crate).toBeLessThan(0.2);

    unit.cd.skill = 0;
    battle.ap = 4;
    combat.doSkill(battle, enemyIdx);
    const enemy = battle.enemies[enemyIdx];
    expect(enemy.debuffs?.some(d => d.type === 'dissociation' || d.type === 'iridescent')).toBe(true);

    forceForte(unit, 5);
    unit.cd.skill = 0;
    battle.ap = 4;
    combat.doSkill(battle, enemyIdx);
    expect(unit.forte.current).toBe(0);

    battle.ap = 4;
    expect(combat.doHeavy(battle, enemyIdx).ok).toBe(true);
    for (const t of battle.team) {
      if (!t.alive) continue;
      expect((t.buffs || []).some(b => b.src === '以旧雨' && b.type === 'skillDmgUp')).toBe(true);
    }
  });

  it('菲比：满 forte 技能 toggle 形态', () => {
    const { battle, unit, enemyIdx } = makeSoloTeam('菲比', { chain: 0 });
    forceForte(unit, 1);
    unit.cd.skill = 0;
    battle.ap = 4;
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    expect(battle.log.some(l => l.type === 'mechanic' && /衍射形态|赦罪|告解/.test(l.msg || ''))).toBe(true);
  });

  it('洛可可/布兰特/坎特蕾拉：满 gauge 解放有数', () => {
    for (const name of ['洛可可', '布兰特', '坎特蕾拉']) {
      const { battle, unit } = makeSoloTeam(name, { chain: 0 });
      forceForte(unit, 100);
      forceEnergy(unit);
      battle.ap = 4;
      const before = battle.enemies[0].hp;
      expect(combat.doBurst(battle).ok).toBe(true);
      // 至少打出主目标伤害或治疗日志
      const dealt = before - battle.enemies[0].hp;
      const healed = battle.log.some(l => l.type === 'heal' && l.src === name);
      expect(dealt > 0 || healed).toBe(true);
    }
  });
});
