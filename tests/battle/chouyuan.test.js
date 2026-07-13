// 仇远 DoD：ATK 核 · 挑灯问剑 → 淋漓醉墨 → 答剑三连；竹照/且从容；链占位不双算
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/chouyuan — 仇远', () => {
  let combat;
  let idx;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    idx = await import('../../src/battle/characters/index.js');
  });

  beforeEach(() => {
    resetState({
      team: ['仇远', '守岸人', '安可'],
      roles: {
        '仇远': { level: 90, chain: 0 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
  });

  function cy(battle) {
    return battle.team.find(t => t.name === '仇远');
  }
  function cyIdx(battle) {
    return battle.team.findIndex(t => t.name === '仇远');
  }
  function enterDrunk(a, battle) {
    a.chouyuanStack = 90;
    idx.fireCharacterHook(a, 'onAttack', { battle }); // +10 → 100 enter
  }

  it('普攻 +10 挑灯问剑；非醉墨不可重击', () => {
    const battle = quickBattle();
    const a = cy(battle);
    battle.active = cyIdx(battle);
    expect(a.chouyuanStack || 0).toBe(0);
    expect(combat.canHeavy(a, battle, firstEnemy(battle)).ok).toBe(false);

    battle.ap = 4;
    expect(combat.doAttack(battle, firstEnemy(battle)).ok).toBe(true);
    expect(a.chouyuanStack).toBe(10);
  });

  it('满 100 进淋漓醉墨 + 且从容 + 竹照；答剑×1.5 后退出', () => {
    const battle = quickBattle();
    const a = cy(battle);
    battle.active = cyIdx(battle);
    enterDrunk(a, battle);

    expect(a.chouyuanDrunkTurns).toBe(2);
    expect(a.chouyuanCalmActive).toBe(true);
    expect(a.chouyuanCalmUsed).toBe(true);
    expect(battle.team.every(t =>
      !t.alive || (t.buffs || []).some(b => b.src === '仇远竹照' && b.type === 'elemAllUp' && b.value === 0.30)
    )).toBe(true);

    const form = idx.queryCharacterHook(a, 'resolveHeavy', battle);
    expect(form?.isAnswerSword).toBe(true);
    expect(form.mult).toBeCloseTo(5.5 * 1.5, 5);

    battle.ap = 4;
    const ei = firstEnemy(battle);
    const enemy = battle.enemies[ei];
    const hp0 = enemy.hp;
    expect(combat.doHeavy(battle, ei).ok).toBe(true);
    expect(enemy.hp).toBeLessThan(hp0);
    expect(a.chouyuanStack).toBe(0);
    expect(a.chouyuanDrunkTurns || 0).toBe(0);
    expect(a.chouyuanCalmActive).toBe(false);
    expect(battle.log.some(l => l.action === '答剑三连')).toBe(true);
  });

  it('C2 竹照 60%；C3 解放×900% 且无 flat burstBonus；荷蓑出林进窗无且从容', () => {
    resetState({
      team: ['仇远', '守岸人', '安可'],
      roles: {
        '仇远': { level: 90, chain: 3 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = cy(battle);
    battle.active = cyIdx(battle);
    expect(a.burstBonus || 0).toBe(0);
    expect(a.heavyBonus || 0).toBe(0);

    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(9.0, 5);
    expect(bm.baseSide).toBeCloseTo(4.5, 5);

    a.concerto = 100;
    const skillForm = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(skillForm?.isHeSuoChuLin).toBe(true);
    expect(skillForm.mult).toBeCloseTo(5.0, 5);

    battle.ap = 4;
    expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(true);
    expect(a.chouyuanDrunkTurns).toBe(2);
    expect(a.chouyuanStack).toBe(100);
    expect(a.chouyuanCalmActive).toBe(false);
    expect(a._chouyuanC3BoostActive).toBe(true);
    expect(a.concerto).toBe(40); // 100 - 60
    expect(battle.log.some(l => l.action === '荷蓑出林')).toBe(true);

    const slash = idx.queryCharacterHook(a, 'resolveHeavy', battle);
    expect(slash.mult).toBeCloseTo(5.5 * 7, 5);

    const bamboo = (battle.team[0].buffs || []).find(b => b.src === '仇远竹照');
    expect(bamboo?.value).toBeCloseTo(0.60, 5);
  });

  it('C6 答剑后停滞 + 退出 AOE；无 flat cdmg 常驻', () => {
    resetState({
      team: ['仇远', '守岸人', '安可'],
      roles: {
        '仇远': { level: 90, chain: 6 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = cy(battle);
    battle.active = cyIdx(battle);
    // 基础 cdmg 约 1.5，占位链不应再 +1.0 常驻
    expect(a.cdmg).toBeLessThan(2.0);

    enterDrunk(a, battle);
    expect(a.chouyuanDrunkTurns).toBeGreaterThan(0);

    battle.ap = 4;
    const ei = firstEnemy(battle);
    const enemy = battle.enemies[ei];
    const hp0 = enemy.hp;
    combat.doHeavy(battle, ei);
    expect(enemy.suppressed || 0).toBeGreaterThan(0);
    expect(enemy.hp).toBeLessThan(hp0);
    expect(battle.log.some(l => l.action && String(l.action).includes('退出淋漓'))).toBe(true);
  });
});
