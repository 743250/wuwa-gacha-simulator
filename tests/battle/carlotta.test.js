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
    skillHints = await import('../../src/ui/render/skillHints.js');
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

  it('Phase3 倍率 N120/S280/H550/解放1000·500', () => {
    const battle = quickBattle();
    const a = ch(battle);
    expect(idx.queryCharacterHook(a, 'normalMult')).toBeCloseTo(1.2, 5);
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(2.8, 5);
    expect(idx.queryCharacterHook(a, 'heavyMult')).toBeCloseTo(5.5, 5);
    expect(idx.queryCharacterHook(a, 'variationMult')).toBeCloseTo(2.0, 5);
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(10.0, 5);
    expect(bm.baseSide).toBeCloseTo(5.0, 5);
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

  it('skillHints 末路见行 5500 / 解放 10000', () => {
    const lines = skillHints.SKILL_HINTS['珂莱塔'].customLines({ atk: 1000 }, { chain: 0 });
    const heavy = lines.find(l => l.name.includes('末路') || l.name.includes('重击'));
    const burst = lines.find(l => l.name.includes('解放') || l.name.includes('浪潮') || l.name.includes('死兆'));
    expect(heavy.desc).toContain('5500');
    expect(burst.desc).toContain('10000');
  });
});
