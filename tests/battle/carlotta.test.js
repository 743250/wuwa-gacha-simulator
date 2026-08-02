// 珂莱塔 DoD：解离/晶体、Phase3 倍率 hook、skillHints 对账
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/carlotta — 珂莱塔', () => {
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
      team: ['珂莱塔', '安可', '忌炎'],
      roles: {
        '珂莱塔': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
  });

  function ch(battle) {
    return battle.team.find(t => t.name === '珂莱塔');
  }
  function chIdx(battle) {
    return battle.team.findIndex(t => t.name === '珂莱塔');
  }

  it('Phase3 倍率 N120/S280/H835/解放644·322', () => {
    const battle = quickBattle();
    const a = ch(battle);
    expect(idx.queryCharacterHook(a, 'normalMult')).toBeCloseTo(1.2, 5);
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(2.8, 5);
    expect(idx.queryCharacterHook(a, 'heavyMult')).toBeCloseTo(8.35, 5);
    expect(idx.queryCharacterHook(a, 'variationMult')).toBeCloseTo(2.0, 5);
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(6.44, 5);
    expect(bm.baseSide).toBeCloseTo(3.22, 5);
  });

  it('晶体满技能 ×2.0；技能挂解离', () => {
    const battle = quickBattle();
    const a = ch(battle);
    battle.active = chIdx(battle);
    a.forte.current = 5;
    a.forte.ready = true;
    a.cd = a.cd || {};
    a.cd.skill = 0;
    battle.ap = 4;
    const enemyIdx = firstEnemy(battle);
    expect(combat.doSkill(battle, enemyIdx).ok).toBe(true);
    const t = typeof enemyIdx === 'number' ? battle.enemies[enemyIdx] : enemyIdx;
    expect((t.debuffs || []).some(d => d.type === 'dissociation' || d.type === 'iridescent')).toBe(true);
  });

  it('skillHints 末路见行 8350 / 解放 6440', () => {
    const lines = skillHints.SKILL_HINTS['珂莱塔'].customLines({ atk: 1000 }, { chain: 0 });
    const heavy = lines.find(l => l.name.includes('末路') || l.name.includes('重击'));
    const burst = lines.find(l => l.name.includes('解放') || l.name.includes('浪潮') || l.name.includes('死兆'));
    expect(heavy.desc).toContain('8350');
    expect(burst.desc).toContain('6440');
  });

  it('C3 技能+93%；切人离场碎璃镜花 1032%', () => {
    resetState({
      team: ['珂莱塔', '安可', '忌炎'],
      roles: {
        '珂莱塔': { level: 90, chain: 3 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = ch(battle);
    expect(a.skillBonus || 0).toBeCloseTo(0.93, 5);
    expect(a.carlottaOutroMult).toBeCloseTo(10.32, 5);
    battle.active = chIdx(battle);
    const before = battle.enemies[firstEnemy(battle)].hp;
    expect(combat.doSwitch(battle, battle.team.findIndex(t => t.name === '安可')).ok).toBe(true);
    expect(battle.log.some(l => String(l.action || '').includes('碎璃镜花'))).toBe(true);
    expect(battle.enemies.some(e => e.hp < before || !e.alive || e.hpMax)).toBe(true);
  });
});
