// 露帕 DoD：狼焰→狼舞·决意·极、追猎/荣光、链不双算、skillHints 对账
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/lupa — 露帕', () => {
  let combat;
  let idx;
  let skillHints;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    idx = await import('../../src/battle/characters/index.js');
    skillHints = await import('../../src/ui/panels/roleModal/skillHints/index.js');
  });

  beforeEach(() => {
    resetState({
      team: ['露帕', '安可', '忌炎'],
      roles: {
        '露帕': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
  });

  function lp(battle) {
    return battle.team.find(t => t.name === '露帕');
  }
  function lpIdx(battle) {
    return battle.team.findIndex(t => t.name === '露帕');
  }

  it('普攻/技能/重击攒狼焰；满时技能替换狼舞×580% burst 并清空', () => {
    const battle = quickBattle();
    const a = lp(battle);
    battle.active = lpIdx(battle);
    expect(a.hasHeavy).toBe(true);

    battle.ap = 4;
    const ei = firstEnemy(battle);
    expect(combat.doAttack(battle, ei).ok).toBe(true);
    expect(a.forte.current).toBe(10);

    a.forte.current = 100;
    a.forte.ready = true;
    const form = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(form?.isLangwu).toBe(true);
    expect(form.mult).toBeCloseTo(5.8, 5);
    expect(form.dmgType).toBe('burst');

    battle.ap = 4;
    const hp0 = battle.enemies[ei].hp;
    expect(combat.doSkill(battle, ei).ok).toBe(true);
    expect(a.forte.current).toBe(0);
    expect(a.forte.ready).toBe(false);
    expect(battle.enemies[ei].hp).toBeLessThan(hp0);
    expect(battle.log.some(l => l.action === '狼舞·决意·极')).toBe(true);
  });

  it('解放回满狼焰 + 追猎/荣光；C0 无常驻双算', () => {
    const battle = quickBattle();
    const a = lp(battle);
    battle.active = lpIdx(battle);
    expect(a.pierceDef || 0).toBe(0);
    expect(a.elemBonus?.['热熔'] || 0).toBe(0);
    expect(a.skillBonus || 0).toBe(0);
    expect(a.burstBonus || 0).toBe(0);

    a.energy = a.energyMax;
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(a.forte.current).toBe(100);
    expect(a.forte.ready).toBe(true);
    expect(battle.team.every(t =>
      !t.alive || (t.buffs || []).some(b => b.src === '露帕追猎' && b.type === 'elemFusionUp' && b.value === 0.10)
    )).toBe(true);
    expect(battle.team.every(t =>
      !t.alive || (t.buffs || []).some(b => b.src === '露帕荣光' && b.type === 'elemResistIgnore' && b.value === 0.03)
    )).toBe(true);
  });

  it('C4 狼舞×1305%；C6 穿防 + 凶噬回焰；C1/C2/C5 不 flat 双算', () => {
    resetState({
      team: ['露帕', '安可', '忌炎'],
      roles: {
        '露帕': { level: 90, chain: 6 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = lp(battle);
    battle.active = lpIdx(battle);

    expect(a.pierceDef || 0).toBe(0);
    expect(a.crate).toBeLessThan(0.3); // 无 C1 flat crate
    expect(a.skillBonus || 0).toBe(0);
    expect(a.burstBonus || 0).toBe(0);
    expect(a.elemBonus?.['热熔'] || 0).toBe(0);
    expect(a.variationBonus || 0).toBeCloseTo(1.0, 5); // C3 变奏×2

    a.forte.current = 100;
    a.forte.ready = true;
    // C6 FORTE_BOOST +0.4 → 3.6 基线；C4 ×2.25 → 8.1
    const form = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(form.mult).toBeCloseTo(6.2 * 2.25, 5);

    expect(idx.queryCharacterHook(a, 'extraPierce', 'burst')).toBeCloseTo(0.3, 5);
    expect(idx.queryCharacterHook(a, 'extraPierce', 'skill')).toBe(0);

    a.forte.current = 0;
    a.forte.ready = false;
    battle.ap = 4;
    expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(true);
    // 技能 +15 再 C6 +100 → 100 满
    expect(a.forte.current).toBe(100);
    expect(a.forte.ready).toBe(true);
  });

  it('skillHints 狼舞 5800/解放 11000，非工厂假数', () => {
    const lines = skillHints.SKILL_HINTS['露帕'].customLines({ atk: 1000 }, { chain: 0 });
    const langwu = lines.find(l => l.name.includes('狼舞'));
    const burst = lines.find(l => l.name.includes('荣光欢酣'));
    const skill = lines.find(l => l.name.includes('凶噬'));
    expect(langwu.desc).toContain('5800');
    expect(burst.desc).toContain('11000'); // 全局解放主 700%
    expect(burst.desc).toContain('5500'); // 副目标 350%
    expect(skill.desc).toContain('3000');
  });
});
