// 嘉贝莉娜 DoD：猎杀阈值→满解放×1.6、C6×2.1、C4 解放后全队 allDmg、链对账、skillHints
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/gaberina — 嘉贝莉娜', () => {
  let combat;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  beforeEach(() => {
    resetState({
      team: ['嘉贝莉娜', '安可', '忌炎'],
      roles: {
        '嘉贝莉娜': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
  });

  function gb(battle) {
    return battle.team.find(t => t.name === '嘉贝莉娜');
  }
  function gbIdx(battle) {
    return battle.team.findIndex(t => t.name === '嘉贝莉娜');
  }

  it('普攻/技能攒阈值；满值解放增强后重置', () => {
    const battle = quickBattle();
    const a = gb(battle);
    battle.active = gbIdx(battle);
    expect(a.hasHeavy).toBe(true);
    expect(a.forte.effectType).toBe('enhancedBurst');
    expect(a.forte.effectMult).toBeCloseTo(1.6, 5);

    battle.ap = 4;
    expect(combat.doAttack(battle, firstEnemy(battle)).ok).toBe(true);
    expect(a.forte.current).toBe(8);

    a.forte.current = 100;
    a.forte.ready = true;
    a.energy = a.energyMax;
    battle.ap = 4;
    const ei = firstEnemy(battle);
    const hp0 = battle.enemies[ei].hp;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(battle.enemies[ei].hp).toBeLessThan(hp0);
    // gainForte(+25) 后 fEnh consumeForte → 归零（设计：满阈值解放先增强再重置）
    expect(a.forte.current).toBe(0);
    expect(a.forte.ready).toBe(false);
    expect(battle.log.some(l => l.type === 'burst')).toBe(true);
  });

  it('C0 无 C4 常驻；C4 解放后全队 allDmgUp；C1/2/3/5/6 flat 按设计', () => {
    const battle0 = quickBattle();
    const a0 = gb(battle0);
    expect(a0.pierceDef || 0).toBe(0);
    expect((a0.buffs || []).some(b => b.src === '嘉贝莉娜4链')).toBe(false);

    resetState({
      team: ['嘉贝莉娜', '安可', '忌炎'],
      roles: {
        '嘉贝莉娜': { level: 90, chain: 6 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = gb(battle);
    battle.active = gbIdx(battle);

    // C1 cdmg +0.8；C2 atk×2.5；C3 burst +1.3；C5 skill +1.5；C6 allDmg +0.6 叠进各 typeBonus；C6 FORTE 1.6+0.5
    expect(a.cdmg).toBeGreaterThanOrEqual(1.5 + 0.8 - 0.01);
    expect(a.burstBonus || 0).toBeCloseTo(1.3 + 0.6, 5);
    expect(a.skillBonus || 0).toBeCloseTo(1.5 + 0.6, 5);
    expect(a.normalBonus || 0).toBeCloseTo(0.6, 5);
    expect(a.forte.effectMult).toBeCloseTo(2.1, 5);
    // C4 不常驻 teamAllDmg
    expect((a.buffs || []).some(b => b.src === '嘉贝莉娜4链')).toBe(false);

    a.energy = a.energyMax;
    a.forte.current = 100;
    a.forte.ready = true;
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(battle.team.every(t =>
      !t.alive || (t.buffs || []).some(b => b.src === '嘉贝莉娜4链' && b.type === 'allDmgUp' && b.value === 0.2)
    )).toBe(true);
  });

  it('skillHints 炼净/阈值文案对齐设计', () => {
    const lines0 = skillHints.SKILL_HINTS['嘉贝莉娜'].customLines({ atk: 1000 }, { chain: 0 });
    const burst0 = lines0.find(l => l.name.includes('炼净'));
    expect(burst0.desc).toContain('4000');
    expect(burst0.desc).toContain('1.6');
    expect(skillHints.SKILL_HINTS['嘉贝莉娜'].intro).toContain('猎杀阈值');
    expect(skillHints.SKILL_HINTS['嘉贝莉娜'].forteName).toBe('猎杀阈值');

    const lines6 = skillHints.SKILL_HINTS['嘉贝莉娜'].customLines({ atk: 1000 }, { chain: 6 });
    const burst6 = lines6.find(l => l.name.includes('炼净'));
    expect(burst6.desc).toContain('2.1');
  });
});
