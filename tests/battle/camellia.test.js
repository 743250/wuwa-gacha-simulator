// 椿 DoD：红椿·蕊+协奏→永生花→含苞、链不双算、skillHints 对账
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/camellia — 椿', () => {
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
      team: ['椿', '安可', '忌炎'],
      roles: {
        '椿': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
  });

  function ch(battle) {
    return battle.team.find(t => t.name === '椿');
  }
  function chIdx(battle) {
    return battle.team.findIndex(t => t.name === '椿');
  }

  it('满蕊+协奏→永生花进含苞；含苞普攻×1.5', () => {
    const battle = quickBattle();
    const a = ch(battle);
    battle.active = chIdx(battle);

    battle.ap = 4;
    expect(combat.doAttack(battle, firstEnemy(battle)).ok).toBe(true);
    expect(a.forte.current).toBe(10);

    a.forte.current = 100;
    a.forte.ready = true;
    a.concerto = 50;
    const form = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(form?.yongsheng).toBe(true);
    expect(form.mult).toBeCloseTo(8.0, 5);

    battle.ap = 4;
    expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(true);
    expect(a.forte.hanbao).toBeGreaterThan(0);
    expect(idx.queryCharacterHook(a, 'windowMultiplier', 'normal')).toBeCloseTo(1.5, 5);
    expect(battle.log.some(l => l.action === '永生花')).toBe(true);
  });

  it('C1/C3/C4 不常驻双算；C2 永生花×17.6；C6 续窗', () => {
    resetState({
      team: ['椿', '安可', '忌炎'],
      roles: {
        '椿': { level: 90, chain: 6 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = ch(battle);
    battle.active = chIdx(battle);

    expect(a.cdmg).toBeLessThan(1.5 + 0.28 - 0.01); // 无 C1 flat
    expect(a.burstBonus || 0).toBe(0); // 无 C3 flat
    expect(a.normalBonus || 0).toBe(0); // 无 C4 flat teamNormal

    a.forte.current = 100;
    a.concerto = 50;
    const form = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(form.mult).toBeCloseTo(8.0 * 2.2, 5);

    battle.ap = 4;
    expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(true);
    expect((a.buffs || []).some(b => b.src === '含苞·酣梦' && b.value === 0.58)).toBe(true);
    expect((a.buffs || []).some(b => b.src === '含苞·解放' && b.type === 'burstDmgUp')).toBe(true);
    expect(idx.queryCharacterHook(a, 'windowMultiplier', 'skill')).toBeCloseTo(2.5, 5);

    // C6 续窗：含苞中再满双资源
    a.forte.current = 100;
    a.concerto = 50;
    const refresh = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(refresh?.isRefresh).toBe(true);
  });

  it('skillHints 永生花 8000 / 解放 9000', () => {
    const lines = skillHints.SKILL_HINTS['椿'].customLines({ atk: 1000 }, { chain: 0 });
    const yong = lines.find(l => l.name.includes('永生花'));
    const burst = lines.find(l => l.name.includes('芳华'));
    expect(yong.desc).toContain('8000');
    expect(burst.desc).toContain('9000'); // Phase3 解放主 900%
  });
});
