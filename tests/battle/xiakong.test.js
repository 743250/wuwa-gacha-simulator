// 夏空 DoD：音律→四拍重奏、音律独奏气动光环、演绎、链不双算、skillHints 对账
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/xiakong — 夏空', () => {
  let combat;
  let idx;
  let skillHints;
  let erosion;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
    idx = await import('../../src/battle/characters/index.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
    erosion = await import('../../src/battle/combat/erosion.js');
  });

  beforeEach(() => {
    resetState({
      team: ['夏空', '忌炎', '安可'],
      roles: {
        '夏空': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
  });

  function xk(battle) {
    return battle.team.find(t => t.name === '夏空');
  }
  function xkIdx(battle) {
    return battle.team.findIndex(t => t.name === '夏空');
  }

  it('普攻 +1 音律 + 叠风蚀 + 进独奏光环；无独立重击', () => {
    const battle = quickBattle();
    const a = xk(battle);
    battle.active = xkIdx(battle);
    expect(a.hasHeavy).toBe(false);
    expect(combat.canHeavy(a, battle, firstEnemy(battle)).ok).toBe(false);

    battle.ap = 4;
    const ei = firstEnemy(battle);
    expect(combat.doAttack(battle, ei).ok).toBe(true);
    expect(a.forte.current).toBe(1);
    expect(a.xiakongSoloActive).toBe(true);
    expect(erosion.getErosionStacks(battle.enemies[ei])).toBeGreaterThanOrEqual(1);
    expect(battle.team.every(t =>
      !t.alive || (t.buffs || []).some(b => b.src === '夏空独奏' && b.type === 'elemAeroUp' && b.value === 0.24)
    )).toBe(true);
  });

  it('满 3 音律普攻替换四拍重奏 atk×200% heavy 并清空音律', () => {
    const battle = quickBattle();
    const a = xk(battle);
    battle.active = xkIdx(battle);
    a.forte.current = 3;
    a.forte.ready = true;

    const form = idx.queryCharacterHook(a, 'resolveNormal', battle);
    expect(form?.isXiakongQuad).toBe(true);
    expect(form.mult).toBeCloseTo(2.0, 5);
    expect(form.dmgType).toBe('heavy');

    battle.ap = 4;
    const ei = firstEnemy(battle);
    const hp0 = battle.enemies[ei].hp;
    expect(combat.doAttack(battle, ei).ok).toBe(true);
    expect(a.forte.current).toBe(0);
    expect(battle.enemies[ei].hp).toBeLessThan(hp0);
    expect(battle.log.some(l => l.action === '重击·四拍重奏')).toBe(true);
  });

  it('技能 atk×150% 只叠风蚀不加音律；解放进演绎+护盾 1100%/550%', () => {
    const battle = quickBattle();
    const a = xk(battle);
    battle.active = xkIdx(battle);

    const skill = idx.queryCharacterHook(a, 'resolveSkill', battle);
    expect(skill.mult).toBeCloseTo(1.5, 5);
    const notes0 = a.forte.current || 0;
    battle.ap = 4;
    const ei = firstEnemy(battle);
    const stacks0 = erosion.getErosionStacks(battle.enemies[ei]);
    expect(combat.doSkill(battle, ei).ok).toBe(true);
    expect(a.forte.current || 0).toBe(notes0);
    expect(erosion.getErosionStacks(battle.enemies[ei])).toBeGreaterThan(stacks0);

    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(11.0, 5);
    expect(bm.baseSide).toBeCloseTo(5.5, 5);

    a.energy = a.energyMax;
    battle.ap = 4;
    const shield0 = a.shield || 0;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(a.xiakongPerformTurns).toBe(2);
    expect(a.shield).toBeGreaterThan(shield0);
  });

  it('C1/C2/C4 不常驻双算；C3 普攻 +2 音律；C6 独奏 AOE', () => {
    resetState({
      team: ['夏空', '忌炎', '安可'],
      roles: {
        '夏空': { level: 90, chain: 6 },
        '忌炎': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = xk(battle);
    battle.active = xkIdx(battle);

    // C1 atk / C2 teamElem / C4 pierce 占位；C3 skillCdReduce + C5 burstDmg 为真 flat
    expect(a.pierceDef || 0).toBe(0);
    expect(a.elemBonus?.['气动'] || 0).toBe(0);
    expect(a.burstBonus || 0).toBeCloseTo(0.4, 5);
    expect(a.skillCdReduce || 0).toBe(1);

    battle.ap = 4;
    expect(combat.doAttack(battle, firstEnemy(battle)).ok).toBe(true);
    // C3：普攻 +1 再 +1 = 2
    expect(a.forte.current).toBe(2);
    expect((a.buffs || []).some(b => b.src === '夏空1链' && b.value === 0.35)).toBe(true);
    expect(battle.log.some(l => String(l.msg || '').includes('终曲未终') || String(l.msg || '').includes('220'))).toBe(true);

    expect(idx.queryCharacterHook(a, 'extraPierce', 'heavy')).toBeCloseTo(0.45, 5);
    expect(idx.queryCharacterHook(a, 'extraPierce', 'normal')).toBe(0);
  });

  it('skillHints 技能 150% / 解放 1100% / 四拍 200%，非工厂 180/400', () => {
    const lines = skillHints.SKILL_HINTS['夏空'].customLines({ atk: 1000 }, { chain: 0 });
    const skill = lines.find(l => l.name.includes('谐律'));
    const burst = lines.find(l => l.name.includes('三重'));
    expect(skill.desc).toContain('1500');
    expect(skill.desc).not.toContain('1800');
    expect(burst.desc).toContain('11000');
    expect(burst.desc).toContain('5500');
    const normal = lines.find(l => l.name.includes('四拍的舞曲'));
    expect(normal.desc).toContain('2000');
  });
});
