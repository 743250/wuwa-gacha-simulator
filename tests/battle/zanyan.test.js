// 赞妮 DoD：灼焰形态、重斩耗焰光、终绝结算、HP 核 skill/heavy、链不双算
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/zanyan — 赞妮', () => {
  let combat;
  let damage;
  let idx;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    damage = await import('../../src/battle/combat/damage.js');
    idx = await import('../../src/battle/characters/index.js');
  });

  beforeEach(() => {
    resetState({
      team: ['赞妮', '守岸人', '安可'],
      roles: {
        '赞妮': { level: 90, chain: 0 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
  });

  function zy(battle) {
    return battle.team.find(t => t.name === '赞妮');
  }
  function zyIdx(battle) {
    return battle.team.findIndex(t => t.name === '赞妮');
  }

  it('技能走 HP×7.5%', () => {
    const battle = quickBattle();
    const a = zy(battle);
    battle.active = zyIdx(battle);
    const ei = firstEnemy(battle);
    const enemy = battle.enemies[ei];
    const hp0 = enemy.hp;
    expect(combat.doSkill(battle, ei).ok).toBe(true);
    const dealt = hp0 - enemy.hp;
    const approx = a.hpMax * 0.075;
    expect(dealt).toBeGreaterThan(approx * 0.3);
    expect(dealt).toBeLessThan(approx * 4);
  });

  it('解放进灼焰 +50 焰光；普攻为重斩并耗 20 焰光', () => {
    const battle = quickBattle();
    const a = zy(battle);
    battle.active = zyIdx(battle);
    a.energy = a.energyMax;
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(a.zanYanFormTurns).toBe(3);
    expect(a.zanYanFlameGauge).toBe(50);

    const form = idx.queryCharacterHook(a, 'resolveNormal', battle);
    expect(form?.isHeavySlash).toBe(true);
    expect(form?.mult).toBeCloseTo(0.12, 5);

    battle.ap = 4;
    const ei = firstEnemy(battle);
    const enemy = battle.enemies[ei];
    const hp0 = enemy.hp;
    combat.doAttack(battle, ei);
    expect(enemy.hp).toBeLessThan(hp0);
    expect(a.zanYanFlameGauge).toBe(30);
    expect(a.zanYanFlameConsumed).toBe(20);
    expect(battle.log.some(l => l.action === '重斩 · 破晓')).toBe(true);

    const heavy = combat.canHeavy(a, battle, ei);
    expect(heavy.ok).toBe(false);
  });

  it('形态 3 回结束触发终绝 pendingFinal（HP% 结算）', () => {
    const battle = quickBattle();
    const a = zy(battle);
    battle.active = zyIdx(battle);
    a.energy = a.energyMax;
    battle.ap = 4;
    combat.doBurst(battle);
    // 消耗 2 次重斩
    battle.ap = 4;
    combat.doAttack(battle, firstEnemy(battle));
    battle.ap = 4;
    combat.doAttack(battle, firstEnemy(battle));
    expect(a.zanYanFlameConsumed).toBe(40);

    const ei = firstEnemy(battle);
    const enemy = battle.enemies[ei];
    // tick 3 次结束形态
    combat.endTurn(battle);
    expect(a.zanYanFormTurns).toBe(2);
    combat.endTurn(battle);
    expect(a.zanYanFormTurns).toBe(1);
    const hp0 = enemy.hp;
    combat.endTurn(battle);
    expect(a.zanYanFormTurns || 0).toBe(0);
    expect(a.zanYanFlameGauge || 0).toBe(0);
    // 终绝应有伤害日志
    const finale = battle.log.filter(l => l.action && String(l.action).includes('终绝'));
    expect(finale.length).toBeGreaterThan(0);
    expect(enemy.hp).toBeLessThan(hp0);
  });

  it('C2 技能×1.8；C5 重燃×2.2；C3 终绝按焰光；无 flat burst/heavy 双算', () => {
    resetState({
      team: ['赞妮', '守岸人', '安可'],
      roles: {
        '赞妮': { level: 90, chain: 5 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = zy(battle);
    expect(a.burstBonus || 0).toBe(0);
    expect(a.heavyBonus || 0).toBe(0);
    expect(a.crate).toBeGreaterThan(0.05); // C2 crate +20%

    const skillM = idx.queryCharacterHook(a, 'skillMult');
    expect(skillM).toBeCloseTo(0.075 * 1.8, 5);
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(0.16 * 2.2, 5);

    a.zanYanFlameConsumed = 100;
    const fin = idx.queryCharacterHook(a, 'finalMult');
    // C3: 100 * 0.02 = 2.0 cap → ×3
    expect(fin).toBeCloseTo(0.20 * 3, 5);
  });

  it('C6 重斩×1.4 + 致死不倒；C1 技能后衍射 buff', () => {
    resetState({
      team: ['赞妮', '守岸人', '安可'],
      roles: {
        '赞妮': { level: 90, chain: 6 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = zy(battle);
    battle.active = zyIdx(battle);
    // C1 on skill
    battle.ap = 4;
    combat.doSkill(battle, firstEnemy(battle));
    expect(a.buffs.some(b => b.src === '赞妮链1' && b.value === 0.5)).toBe(true);

    a.zanYanFormTurns = 2;
    a.zanYanFlameGauge = 50;
    const slash = idx.queryCharacterHook(a, 'resolveNormal', battle);
    expect(slash.mult).toBeCloseTo(0.12 * 1.4, 5);

    a.hp = 5;
    expect(idx.queryCharacterHook(a, 'onLethal', battle)).toBe(true);
    expect(a.hp).toBe(1);
  });
});
