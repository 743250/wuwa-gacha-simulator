// 尤诺 DoD：灵性 → 月相/满月 → 至臻完满；链占位不双算；skillHints 倍率对账
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/younuo — 尤诺', () => {
  let combat;
  let idx;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    idx = await import('../../src/battle/characters/index.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  beforeEach(() => {
    resetState({
      team: ['尤诺', '守岸人', '安可'],
      roles: {
        '尤诺': { level: 90, chain: 0 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
  });

  function yn(battle) {
    return battle.team.find(t => t.name === '尤诺');
  }
  function ynIdx(battle) {
    return battle.team.findIndex(t => t.name === '尤诺');
  }

  it('普攻 +12 灵性；未满月不可重击', () => {
    const battle = quickBattle();
    const a = yn(battle);
    battle.active = ynIdx(battle);
    expect(a.younuoLingxing || 0).toBe(0);
    expect(combat.canHeavy(a, battle, firstEnemy(battle)).ok).toBe(false);

    battle.ap = 4;
    expect(combat.doAttack(battle, firstEnemy(battle)).ok).toBe(true);
    expect(a.younuoLingxing).toBe(12);
  });

  it('技能告终进月相；灵性满才开满月；至臻完满后清空退出', () => {
    const battle = quickBattle();
    const a = yn(battle);
    battle.active = ynIdx(battle);

    const skillForm = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(skillForm?.isGaoZhong).toBe(true);
    expect(skillForm.mult).toBeCloseTo(1.8, 5);
    expect(skillForm.dmgType).toBe('skill');

    battle.ap = 4;
    expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(true);
    expect(a.younuoLingxing).toBe(25);
    expect(a.younuoMoonTurns).toBe(3);
    expect(a.younuoFullMoonTurns || 0).toBe(0);
    expect(combat.canHeavy(a, battle, firstEnemy(battle)).ok).toBe(false);
    expect((a.buffs || []).some(b => b.src === '尤诺月相' && b.type === 'atkUp' && b.value === 0.20)).toBe(true);

    const yue = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(yue?.isYueXian).toBe(true);
    expect(yue.dmgType).toBe('burst');

    // 拉满灵性 → 满月
    a.younuoLingxing = 90;
    idx.fireCharacterHook(a, 'onAttack', { battle }); // +20 → 100
    expect(a.younuoLingxing).toBe(100);
    expect(a.younuoFullMoonTurns).toBe(3);
    expect(combat.canHeavy(a, battle, firstEnemy(battle)).ok).toBe(true);

    const form = idx.queryCharacterHook(a, 'resolveHeavy', battle);
    expect(form?.isYounuoZhenWan).toBe(true);
    expect(form.mult).toBeCloseTo(4.0, 5);

    battle.ap = 4;
    const ei = firstEnemy(battle);
    const enemy = battle.enemies[ei];
    const hp0 = enemy.hp;
    expect(combat.doHeavy(battle, ei).ok).toBe(true);
    expect(enemy.hp).toBeLessThan(hp0);
    expect(a.younuoLingxing).toBe(0);
    expect(a.younuoMoonTurns || 0).toBe(0);
    expect(a.younuoFullMoonTurns || 0).toBe(0);
    expect(battle.log.some(l => l.action === '重击·至臻的完满')).toBe(true);
  });

  it('C1/C3 不常驻双算；C2 变奏挂全队 40%；C6 至臻×20 且重置', () => {
    resetState({
      team: ['尤诺', '守岸人', '安可'],
      roles: {
        '尤诺': { level: 90, chain: 6 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = yn(battle);
    battle.active = ynIdx(battle);

    // C1 atk / C3 allDmg / C6 heavy 均为占位，开场不应常驻
    // C5 burstDmg 0.2 是真 flat
    expect(a.heavyBonus || 0).toBe(0);
    expect(a.normalBonus || 0).toBe(0);
    expect(a.skillBonus || 0).toBe(0);
    expect(a.burstBonus || 0).toBeCloseTo(0.2, 5);

    // 直接进满月
    a.younuoLingxing = 100;
    a.younuoMoonTurns = 0;
    a.younuoFullMoonTurns = 0;
    a.buffs = [];
    const mech = idx.getCharacterMechanic('尤诺');
    mech.enterMoonFlow(a, battle);
    expect(a.younuoMoonTurns).toBe(3);
    expect(a.younuoFullMoonTurns).toBe(3);
    expect((a.buffs || []).some(b => b.src === '尤诺月相' && b.value === 0.40)).toBe(true);
    expect((a.buffs || []).some(b => b.src === '尤诺3链' && b.value === 0.65)).toBe(true);

    const form = idx.queryCharacterHook(a, 'resolveHeavy', battle);
    expect(form.mult).toBeCloseTo(20.0, 5);

    battle.ap = 4;
    a.cd.skill = 2;
    expect(combat.doHeavy(battle, firstEnemy(battle)).ok).toBe(true);
    expect(a.younuoLingxing).toBe(100);
    expect(a.younuoMoonTurns).toBe(3);
    expect(a.younuoFullMoonTurns).toBe(3);
    expect(a.cd.skill).toBe(0);
    expect((a.buffs || []).some(b => b.src === '尤诺4链' && b.type === 'atkUp' && b.value === 0.10)).toBe(true);

    // C2：切到尤诺触发变奏
    battle.active = 1;
    battle.switchUsedThisTurn = false;
    battle.ap = 4;
    combat.doSwitch(battle, ynIdx(battle));
    expect(battle.team.every(t =>
      !t.alive || (t.buffs || []).some(b => b.src === '尤诺2链' && b.value === 0.40)
    )).toBe(true);
  });

  it('skillHints 至臻完满展示 atk×400% / C6×2000%，非工厂 220%', () => {
    const lines0 = skillHints.SKILL_HINTS['尤诺'].customLines({ atk: 1000 }, { chain: 0 });
    const heavy0 = lines0.find(l => l.name.includes('至臻'));
    expect(heavy0.desc).toContain('4000');
    expect(heavy0.desc).not.toContain('2200');

    const lines6 = skillHints.SKILL_HINTS['尤诺'].customLines({ atk: 1000 }, { chain: 6 });
    const heavy6 = lines6.find(l => l.name.includes('至臻'));
    expect(heavy6.desc).toContain('20000');
  });

  it('解放 400/200 · 变奏 80% 对齐设计 §4（非全局 700/150）', () => {
    const battle = quickBattle();
    const a = battle.team.find(t => t.name === '尤诺');
    expect(idx.queryCharacterHook(a, 'resolveBurstMult')).toEqual({ baseMain: 4.0, baseSide: 2.0 });
    expect(idx.queryCharacterHook(a, 'variationMult')).toBeCloseTo(0.8, 5);
    const lines = skillHints.SKILL_HINTS['尤诺'].customLines({ atk: 1000 }, { chain: 0 });
    const burst = lines.find(l => l.name.includes('溺失') || l.name.includes('解放'));
    expect(burst.desc).toContain('4000');
    expect(burst.desc).not.toContain('7000');
    const v = lines.find(l => l.name.includes('变奏') || l.name.includes('照我'));
    expect(v.desc).toContain('800');
  });
});
