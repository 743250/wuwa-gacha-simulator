// 守岸人 DoD：星域 HOT/暴击暴伤、技能治疗、链参数、skillHints 对账
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';

describe('battle/characters/shorekeeper — 守岸人', () => {
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
      team: ['守岸人', '安可', '忌炎'],
      roles: {
        '守岸人': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
  });

  function sk(battle) {
    return battle.team.find(t => t.name === '守岸人');
  }
  function skIdx(battle) {
    return battle.team.findIndex(t => t.name === '守岸人');
  }

  it('技能 ×80% + 全队治疗；无重击', () => {
    const battle = quickBattle();
    const a = sk(battle);
    battle.active = skIdx(battle);
    expect(a.hasHeavy).toBe(false);
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(0.8, 5);

    for (const t of battle.team) {
      if (t.alive) t.hp = Math.max(1, Math.floor(t.hpMax * 0.4));
    }
    const hpBefore = battle.team.map(t => t.hp);
    battle.ap = 4;
    expect(combat.doSkill(battle, firstEnemy(battle)).ok).toBe(true);
    expect(battle.team.some((t, i) => t.alive && t.hp > hpBefore[i])).toBe(true);
    expect(battle.log.some(l => l.type === 'heal' && l.src === '守岸人')).toBe(true);
  });

  it('解放展开星域 3 回：HOT + 暴击 +20% + 暴伤 +30%；C0 无 atk', () => {
    const battle = quickBattle();
    const a = sk(battle);
    battle.active = skIdx(battle);
    a.energy = a.energyMax;
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);

    for (const t of battle.team) {
      if (!t.alive) continue;
      expect((t.buffs || []).some(b => b.src === '星域' && b.type === 'healOverTime' && b.duration === 3)).toBe(true);
      expect((t.buffs || []).some(b => b.src === '星域' && b.type === 'crateUp' && Math.abs(b.value - 0.2) < 1e-6)).toBe(true);
      expect((t.buffs || []).some(b => b.src === '星域' && b.type === 'cdmgUp' && Math.abs(b.value - 0.3) < 1e-6)).toBe(true);
      expect((t.buffs || []).some(b => b.src === '星域' && b.type === 'atkUp')).toBe(false);
    }
  });

  it('C1 5 回×2.5 增益；C2 全队攻击；C4 仅技能治疗；C6 变奏+42%+暴伤500%', () => {
    resetState({
      team: ['安可', '守岸人', '忌炎'],
      roles: {
        '守岸人': { level: 90, chain: 6 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = sk(battle);
    expect(a.fieldExtendDur).toBe(2);
    expect(a.fieldPersistOnSwitch).toBe(true);
    expect(a.fieldExtraAtk).toBeCloseTo(0.4, 5);
    expect(a.healBuff4Chain).toBeCloseTo(0.7, 5);
    expect(a.burstEnergyRefund).toBe(20);
    expect(a.normalSplit).toBe(2);
    expect(a.variationBonus).toBeCloseTo(0.42, 5);
    expect(a.shorekeeperC6Cdmg?.value).toBeCloseTo(5, 5);

    battle.active = skIdx(battle);
    a.energy = a.energyMax;
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    for (const t of battle.team) {
      if (!t.alive) continue;
      expect((t.buffs || []).some(b => b.src === '星域' && b.type === 'healOverTime' && b.duration === 5)).toBe(true);
      expect((t.buffs || []).some(b => b.src === '星域' && b.type === 'crateUp' && Math.abs(b.value - 0.5) < 1e-6)).toBe(true);
      expect((t.buffs || []).some(b => b.src === '星域' && b.type === 'cdmgUp' && Math.abs(b.value - 0.75) < 1e-6)).toBe(true);
      expect((t.buffs || []).some(b => b.src === '星域' && b.type === 'atkUp' && Math.abs(b.value - 1.0) < 1e-6)).toBe(true);
      expect((t.buffs || []).some(b => b.src === '星域' && b.persistent)).toBe(true);
    }
    expect(a.energy).toBeGreaterThanOrEqual(20);

    const hot = (a.buffs || []).find(b => b.src === '星域' && b.type === 'healOverTime');
    const expectedHot = Math.round((a.hp * 0.05 + a.atk * 0.4) * (1 + (a.healBonus || 0)) * 2.5);
    expect(hot.value).toBe(expectedHot);
  });

  it('解放当场回血一跳，再挂 HOT', () => {
    const battle = quickBattle();
    const a = sk(battle);
    battle.active = skIdx(battle);
    for (const u of battle.team) {
      if (u.alive) u.hp = Math.max(1, Math.floor(u.hpMax * 0.4));
    }
    const before = battle.team.map(u => u.hp);
    // HOT 按展开瞬间当前生命结算；脉冲回血会抬 a.hp，期望值必须用展开前快照
    const expected = Math.round((a.hp * 0.05 + a.atk * 0.4) * (1 + (a.healBonus || 0)));
    a.energy = a.energyMax;
    battle.ap = 4;
    expect(combat.doBurst(battle).ok).toBe(true);
    expect(battle.team.some((u, i) => u.alive && u.hp > before[i])).toBe(true);
    expect(battle.log.some(l => l.type === 'heal' && l.src === '守岸人' && String(l.msg || '').includes('展开'))).toBe(true);
    const hot = (a.buffs || []).find(b => b.src === '星域' && b.type === 'healOverTime');
    expect(hot).toBeTruthy();
    expect(hot.value).toBe(expected);
  });

  it('skillHints：技能 80%、HOT 无 C4×1.7、星域数对齐', () => {
    const lines0 = skillHints.SKILL_HINTS['守岸人'].customLines(
      { atk: 1000, hp: 10000, healBonus: 0, maxEnergy: 125 },
      { chain: 0 }
    );
    const skill0 = lines0.find(l => l.name.includes('混沌理论'));
    expect(skill0.desc).toContain('800');
    expect(skill0.desc).not.toContain('1800');
    const burst0 = lines0.find(l => l.name.includes('终末回环'));
    expect(burst0.desc).toContain('展开立即治疗');
    expect(burst0.desc).toContain('900'); // hotTotal C0: 10000×5%+1000×40%=900

    const lines6 = skillHints.SKILL_HINTS['守岸人'].customLines(
      { atk: 1000, hp: 10000, healBonus: 0, maxEnergy: 125 },
      { chain: 6 }
    );
    const burst6 = lines6.find(l => l.name.includes('终末回环'));
    expect(burst6.desc).toContain('7000'); // 全局解放主目标 700%
    expect(burst6.desc).toContain('50%');
    expect(burst6.desc).toContain('75%');
    expect(burst6.desc).toContain('100%');
    expect(burst6.desc).toContain('2250'); // C1×2.5 HOT
  });
});
