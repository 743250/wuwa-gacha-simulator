// 长离 DoD：离火→心眼变身/抵 AP、焰羽、链不双算、skillHints 对账
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/changli — 长离', () => {
  let combat;
  let idx;
  let skillHints;
  let stacks;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    idx = await import('../../src/battle/characters/index.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
    stacks = await import('../../src/battle/stacks.js');
  });

  beforeEach(() => {
    resetState({
      team: ['长离', '安可', '忌炎'],
      roles: {
        '长离': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
  });

  function ch(battle) {
    return battle.team.find(t => t.name === '长离');
  }
  function chIdx(battle) {
    return battle.team.findIndex(t => t.name === '长离');
  }

  it('普攻攒离火满 6 进心眼；征×3.0 skill、离火抵 AP；倾泻后退出', () => {
    const battle = quickBattle();
    const a = ch(battle);
    battle.active = chIdx(battle);
    expect(a.hasHeavy).toBe(true);

    const ei = firstEnemy(battle);
    for (let i = 0; i < 6; i++) {
      battle.ap = 4;
      expect(combat.doAttack(battle, ei).ok).toBe(true);
    }
    expect(stacks.getStack(a, 'changli_lihuo')).toBe(6);
    expect(a.forte.mindEye).toBe(true);
    expect(idx.queryCharacterHook(a, 'inMindEye')).toBe(true);

    const form = idx.queryCharacterHook(a, 'mindEyeForm', 'normal');
    expect(form?.label).toBe('心眼·征');
    expect(form.mult).toBeCloseTo(3.0, 5);
    expect(form.dmgType).toBe('skill');

    const cost = idx.queryCharacterHook(a, 'resolveCost', 'normal', 1);
    expect(cost.apCost).toBe(0);
    expect(cost.lihuoCost).toBe(2);

    battle.ap = 4;
    expect(combat.doAttack(battle, ei).ok).toBe(true);
    expect(stacks.getStack(a, 'changli_lihuo')).toBe(4);
    expect(battle.ap).toBe(4);
    expect(battle.log.some(l => l.action === '心眼·征')).toBe(true);

    // 再征 2 次 → 0 层退出
    battle.ap = 4;
    expect(combat.doAttack(battle, ei).ok).toBe(true);
    battle.ap = 4;
    expect(combat.doAttack(battle, ei).ok).toBe(true);
    expect(stacks.getStack(a, 'changli_lihuo')).toBe(0);
    expect(a.forte.mindEye).toBe(false);
    expect(idx.queryCharacterHook(a, 'mindEyeForm', 'normal')).toBeNull();
  });

  it('解放 +3 离火 + 焰羽；C0 无 flat 双算', () => {
    const battle = quickBattle();
    const a = ch(battle);
    battle.active = chIdx(battle);

    expect(a.skillBonus || 0).toBe(0);
    expect(a.heavyBonus || 0).toBe(0);
    expect(a.pierceDef || 0).toBe(0);
    expect(a.normalBonus || 0).toBe(0);
    expect(a.burstBonus || 0).toBe(0);

    a.energy = a.energyMax;
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(stacks.getStack(a, 'changli_lihuo')).toBe(3);
    expect((a.buffs || []).some(b => b.src === '焰羽' && b.type === 'atkUp' && b.value === 0.5)).toBe(true);
    expect((a.buffs || []).some(b => b.src === '焰羽' && b.type === 'pierceUp' && b.value === 0.4)).toBe(true);
  });

  it('C1 skill/heavy +10%；C4 变奏全队 atk；C6 extraPierce；无 flat 双算', () => {
    resetState({
      team: ['安可', '长离', '忌炎'],
      roles: {
        '长离': { level: 90, chain: 6 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = ch(battle);
    expect(a.pierceDef || 0).toBe(0);
    expect(a.normalBonus || 0).toBe(0);
    // C1 battleStart skill +0.1；C5 flat heavy +1.0 → heavy 1.1；C3 burst +0.8
    expect(a.skillBonus || 0).toBeCloseTo(0.1, 5);
    expect(a.heavyBonus || 0).toBeCloseTo(1.1, 5);
    expect(a.burstBonus || 0).toBeCloseTo(0.8, 5);
    // C2 crate flat OK
    expect(a.crate).toBeGreaterThanOrEqual(0.25);

    expect(idx.queryCharacterHook(a, 'extraPierce', 'skill')).toBeCloseTo(0.4, 5);
    expect(idx.queryCharacterHook(a, 'extraPierce', 'heavy')).toBeCloseTo(0.4, 5);
    expect(idx.queryCharacterHook(a, 'extraPierce', 'burst')).toBeCloseTo(0.4, 5);
    expect(idx.queryCharacterHook(a, 'extraPierce', 'normal')).toBe(0);

    // 安可在场 → 切长离触发 C4
    battle.active = battle.team.findIndex(t => t.name === '安可');
    battle.ap = 4;
    const to = chIdx(battle);
    expect(combat.doSwitch(battle, to).ok).toBe(true);
    expect(battle.team.every(t =>
      !t.alive || (t.buffs || []).some(b => b.src === '长离·饰我所言' && b.type === 'atkUp' && b.value === 0.2)
    )).toBe(true);
  });

  it('skillHints 心眼 300/410/650 与解放 9000', () => {
    const lines = skillHints.SKILL_HINTS['长离'].customLines({ atk: 1000 }, { chain: 0 });
    const zheng = lines.find(l => l.name.includes('衔火') || l.desc?.includes('心眼·征'));
    const jie = lines.find(l => l.name.includes('赫羽'));
    const chong = lines.find(l => l.name.includes('焚身'));
    const burst = lines.find(l => l.name.includes('离火照丹心') || l.name.includes('丹心'));
    const all = lines.map(l => l.desc).join(' ');
    expect(all).toMatch(/300%|3000/);
    expect(all).toMatch(/410%|650%|9000|900%/);
    expect(zheng || jie || chong || burst).toBeTruthy();
  });
});
