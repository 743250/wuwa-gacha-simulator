// 千咲 DoD：残响循环、齿轨→电锯、锯环疾攻/终结、万缕、HP 核、绞痕增伤、链占位不双算
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/qianxiao — 千咲', () => {
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
      team: ['千咲', '守岸人', '安可'],
      roles: {
        '千咲': { level: 90, chain: 0 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
  });

  function qx(battle) {
    return battle.team.find(t => t.name === '千咲');
  }
  function qxIdx(battle) {
    return battle.team.findIndex(t => t.name === '千咲');
  }

  it('技能走 HP×7.3%，并叠残响+25、挂虚无绞痕', () => {
    const battle = quickBattle();
    const a = qx(battle);
    battle.active = qxIdx(battle);
    const ei = firstEnemy(battle);
    const enemy = battle.enemies[ei];
    const hpBefore = enemy.hp;
    const stack0 = a.qianxiaoStack || 0;
    expect(combat.doSkill(battle, ei).ok).toBe(true);
    const dealt = hpBefore - enemy.hp;
    const approxHp = a.hpMax * 0.073;
    expect(dealt).toBeGreaterThan(approxHp * 0.3);
    expect(dealt).toBeLessThan(approxHp * 4);
    expect(a.qianxiaoStack || 0).toBe(stack0 + 25);
    expect(enemy.qianxiaoMark).toBeGreaterThan(0);
  });

  it('残响满→齿轨轮回进电锯；普攻为锯环疾攻', () => {
    const battle = quickBattle();
    const a = qx(battle);
    const fi = qxIdx(battle);
    battle.active = fi;
    a.qianxiaoStack = 100;
    battle.ap = 4;
    const ei = firstEnemy(battle);
    expect(combat.doSkill(battle, ei).ok).toBe(true);
    expect(a.qianxiaoSawTurns).toBe(3);
    expect(a.qianxiaoStack || 0).toBe(0);

    const form = idx.queryCharacterHook(a, 'resolveNormal', battle);
    expect(form?.isSawSlash).toBe(true);
    expect(form?.mult).toBeCloseTo(0.053 * 3, 5);

    battle.ap = 4;
    const enemy = battle.enemies[ei];
    const hp0 = enemy.hp;
    combat.doAttack(battle, ei);
    expect(enemy.hp).toBeLessThan(hp0);
    expect(a.qianxiaoStack).toBe(36);
    const log = battle.log.filter(l => l.action === '环·疾攻' || l.action === '锯环·疾攻');
    // label in resolveNormal is '环·疾攻' (typo in source) or fixed
    expect(battle.log.some(l => typeof l.action === 'string' && l.action.includes('疾攻') || (l.msg && String(l.msg).includes('疾攻')))).toBe(true);
  });

  it('电锯内残响满→锯环终结退出；万缕提前结束', () => {
    const battle = quickBattle();
    const a = qx(battle);
    const fi = qxIdx(battle);
    battle.active = fi;
    a.qianxiaoSawTurns = 3;
    a.qianxiaoStack = 100;
    a.qianxiaoWanlvyTurns = 2;
    battle.ap = 4;
    const ei = firstEnemy(battle);
    const form = idx.queryCharacterHook(a, 'resolveNormal', battle);
    expect(form?.isSawFinish).toBe(true);
    expect(form?.mult).toBeCloseTo(0.122 * (1 + 1.20), 5); // 万缕 +120%

    combat.doAttack(battle, ei);
    expect(a.qianxiaoSawTurns || 0).toBe(0);
    expect(a.qianxiaoStack || 0).toBe(0);
    expect(a.qianxiaoWanlvyTurns || 0).toBe(0);
  });

  it('解放进万缕·汇终 + 全队回血；锯环倍率×2.2', () => {
    const battle = quickBattle();
    const a = qx(battle);
    const fi = qxIdx(battle);
    battle.active = fi;
    a.energy = a.energyMax;
    battle.ap = 4;
    const ally = battle.team.find(t => t.name === '安可');
    ally.hp = Math.max(1, Math.floor(ally.hpMax * 0.5));
    const hpAlly = ally.hp;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(a.qianxiaoWanlvyTurns).toBe(2);
    expect(ally.hp).toBeGreaterThan(hpAlly);

    a.qianxiaoSawTurns = 2;
    a.qianxiaoStack = 0;
    const mult = idx.queryCharacterHook(a, 'resolveNormal', battle).mult;
    expect(mult).toBeCloseTo(0.053 * 3 * 2.2, 5);
  });

  it('变奏 HP×3.3%；C0 链不常驻 skillBonus 双算', () => {
    const battle = quickBattle();
    const a = qx(battle);
    // C0：registry 占位不应注入 skillBonus/allDmg
    expect(a.skillBonus || 0).toBe(0);
    expect(a.burstBonus || 0).toBe(0);

    damage.setCurrentBattle(battle, idx.queryCharacterHook);
    const enemy = battle.enemies[firstEnemy(battle)];
    const core = idx.queryCharacterHook(a, 'hpCore', 'variation');
    expect(core.hpMultOverride).toBeCloseTo(0.033, 5);
    const { dmg } = damage.calcDamage(a, enemy, 0.8, 'variation');
    expect(dmg).toBeGreaterThan(0);
  });

  it('C3 锯环倍率再 +120%；C5 解放×2；绞痕 +15%', () => {
    resetState({
      team: ['千咲', '守岸人', '安可'],
      roles: {
        '千咲': { level: 90, chain: 5 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = qx(battle);
    // 链3/5 走状态机，不应因 registry flat 给常驻 skill/burst
    expect(a.skillBonus || 0).toBe(0);
    // C5 burst 在 resolveBurstMult 内 ×2
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(0.163 * 2, 5);

    a.qianxiaoSawTurns = 2;
    a.qianxiaoWanlvyTurns = 2;
    // 万缕+链3 = 1+1.2+1.2
    const slash = idx.queryCharacterHook(a, 'resolveNormal', battle);
    expect(slash.mult).toBeCloseTo(0.053 * 3 * (1 + 1.2 + 1.2), 5);

    damage.setCurrentBattle(battle, idx.queryCharacterHook);
    const enemy = battle.enemies[firstEnemy(battle)];
    enemy.qianxiaoMark = 3;
    const m = idx.queryCharacterHook(a, 'getMarkDamageBonus', enemy);
    expect(m).toBeCloseTo(1.15, 5);
  });

  it('C6 终焉 +40% 与电锯致死不倒', () => {
    resetState({
      team: ['千咲', '守岸人', '安可'],
      roles: {
        '千咲': { level: 90, chain: 6 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = qx(battle);
    damage.setCurrentBattle(battle, idx.queryCharacterHook);
    const enemy = battle.enemies[firstEnemy(battle)];
    enemy.qianxiaoMark = 2;
    enemy.qianxiaoTerminal = true;
    const m = idx.queryCharacterHook(a, 'getMarkDamageBonus', enemy);
    expect(m).toBeCloseTo(1.15 * 1.4, 5);

    a.qianxiaoSawTurns = 2;
    a.hp = 10;
    const blocked = idx.queryCharacterHook(a, 'onLethal', battle);
    expect(blocked).toBe(true);
    expect(a.hp).toBe(1);
    expect(a.qianxiaoLethalUsed).toBe(true);
    expect(idx.queryCharacterHook(a, 'onLethal', battle)).toBe(false);
  });
});
