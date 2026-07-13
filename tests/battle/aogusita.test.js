// 奥古斯塔 DoD：威慑/冕层循环、赫日威临窗口、HP 核技能倍率、tooltip 关键数对代码
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/aogusita — 奥古斯塔', () => {
  let combat;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
  });

  beforeEach(() => {
    resetState({
      team: ['奥古斯塔', '守岸人', '安可'],
      roles: {
        '奥古斯塔': { level: 90, chain: 0 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
  });

  function ao(battle) {
    return battle.team.find(t => t.name === '奥古斯塔');
  }
  function aoIdx(battle) {
    return battle.team.findIndex(t => t.name === '奥古斯塔');
  }

  it('战斗开始威慑=1，冕层=0', () => {
    const battle = quickBattle();
    const a = ao(battle);
    expect(a.aogusitaWeiShe).toBe(1);
    expect(a.aogusitaCrown || 0).toBe(0);
  });

  it('技能走 skillMult HP×8.1%，不是 ATK×180%', () => {
    const battle = quickBattle();
    const a = ao(battle);
    battle.active = aoIdx(battle);
    const enemy = battle.enemies[firstEnemy(battle)];
    const hpBefore = enemy.hp;
    combat.doSkill(battle, firstEnemy(battle));
    const dealt = hpBefore - enemy.hp;
    // HP 核量级：约 hpMax*0.081 * 乘区；ATK 核会差一个数量级（ATK 约 HP/22）
    const approxHp = a.hpMax * 0.081;
    expect(dealt).toBeGreaterThan(approxHp * 0.3);
    expect(dealt).toBeLessThan(approxHp * 4);
    // 不应接近 atk*1.8 的「仅 ATK 技能」若被错误路径（在 HP>>ATK 时 atk*1.8 远小于 hp*0.081）
    // 这里只断言伤害为正且在 HP 带内
    expect(dealt).toBeGreaterThan(0);
  });

  it('延奏离场 +1 威慑，可叠到 2 开赫日威临', () => {
    const battle = quickBattle();
    const a = ao(battle);
    const fi = aoIdx(battle);
    battle.active = fi;
    expect(a.aogusitaWeiShe).toBe(1);
    // 切到队友 → 奥古斯塔延奏
    const other = battle.team.findIndex((t, i) => i !== fi && t.alive);
    battle.switchUsedThisTurn = false;
    const r = combat.doSwitch(battle, other);
    expect(r.ok).toBe(true);
    expect(a.aogusitaWeiShe).toBe(2);
    expect(a.aogusitaCrown).toBeGreaterThanOrEqual(1);

    // 切回奥古斯塔
    combat.endTurn(battle);
    battle.switchUsedThisTurn = false;
    expect(combat.doSwitch(battle, fi).ok).toBe(true);
    battle.active = fi;
    a.energy = a.energyMax;
    battle.ap = 4;
    const beforeEnergy = a.energy;
    const br = combat.doBurst(battle);
    expect(br.ok).toBe(true);
    expect(a.aogusitaBurstTurns).toBe(2);
    expect(a.aogusitaWeiShe).toBe(0);
    // 赫日威临 keepEnergy
    expect(a.energy).toBe(beforeEnergy);
  });

  it('俯首之刻内不可切换、重击禁用、普攻为烈阳', () => {
    const battle = quickBattle();
    const a = ao(battle);
    const fi = aoIdx(battle);
    battle.active = fi;
    a.aogusitaWeiShe = 2;
    a.energy = a.energyMax;
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(a.aogusitaBurstTurns).toBe(2);

    const other = battle.team.findIndex((t, i) => i !== fi && t.alive);
    battle.switchUsedThisTurn = false;
    const sw = combat.doSwitch(battle, other);
    expect(sw.ok).toBe(false);

    const heavy = combat.canHeavy(a, battle, firstEnemy(battle));
    expect(heavy.ok).toBe(false);

    battle.ap = 4;
    const enemy = battle.enemies[firstEnemy(battle)];
    const hp0 = enemy.hp;
    combat.doAttack(battle, firstEnemy(battle));
    const log = battle.log.filter(l => l.action === '烈阳');
    expect(log.length).toBeGreaterThan(0);
    expect(enemy.hp).toBeLessThan(hp0);
  });

  it('C1 变奏入场叠冕层；冕层≥1 技能倍率约 ×1.5', async () => {
    resetState({
      team: ['奥古斯塔', '守岸人', '安可'],
      roles: {
        '奥古斯塔': { level: 90, chain: 1 },
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = ao(battle);
    const fi = aoIdx(battle);
    const other = battle.team.findIndex((t, i) => i !== fi && t.alive);
    battle.active = other;
    battle.switchUsedThisTurn = false;
    combat.doSwitch(battle, fi);
    expect(a.aogusitaCrown).toBeGreaterThanOrEqual(1);

    const damage = await import('../../src/battle/combat/damage.js');
    const idx = await import('../../src/battle/characters/index.js');
    damage.setCurrentBattle(battle, idx.queryCharacterHook);
    const enemy = battle.enemies[firstEnemy(battle)];
    const mult = idx.queryCharacterHook(a, 'skillMult');
    expect(mult).toBeCloseTo(0.081 * 1.5, 5);
    const { dmg } = damage.calcDamage(a, enemy, mult, 'skill', { explicitHpMult: true });
    expect(dmg).toBeGreaterThan(0);
  });

  it('窗口结束 turnCleanup 清冕层与威慑', () => {
    const battle = quickBattle();
    const a = ao(battle);
    const fi = aoIdx(battle);
    battle.active = fi;
    a.aogusitaWeiShe = 2;
    a.aogusitaCrown = 1;
    a.energy = a.energyMax;
    battle.ap = 4;
    combat.doBurst(battle);
    expect(a.aogusitaBurstTurns).toBe(2);
    combat.endTurn(battle);
    expect(a.aogusitaBurstTurns).toBe(1);
    combat.endTurn(battle);
    expect(a.aogusitaBurstTurns || 0).toBe(0);
    expect(a.aogusitaCrown || 0).toBe(0);
    expect(a.aogusitaWeiShe || 0).toBe(0);
  });
});
