// Phase 3 倍率批 2：夏空 / 坎特蕾拉 / 相里要 / 洛可可
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle } from '../helpers.js';

describe('Phase3 mult batch2 — 夏空/坎特蕾拉/相里要/洛可可', () => {
  let idx;
  let skillHints;

  beforeAll(async () => {
    idx = await import('../../src/battle/characters/index.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  beforeEach(() => {
    resetState({
      team: ['夏空', '坎特蕾拉', '相里要'],
      roles: {
        '夏空': { level: 90, chain: 0 },
        '坎特蕾拉': { level: 90, chain: 0 },
        '相里要': { level: 90, chain: 0 },
        '洛可可': { level: 90, chain: 0 },
      },
    });
  });

  it('夏空 resolveBurstMult 1100/550 · skillHints 11000/5500', () => {
    const battle = quickBattle();
    const a = battle.team.find(t => t.name === '夏空');
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(11.0, 5);
    expect(bm.baseSide).toBeCloseTo(5.5, 5);
    expect(idx.queryCharacterHook(a, 'variationMult')).toBeCloseTo(1.9, 5);
    const lines = skillHints.SKILL_HINTS['夏空'].customLines({ atk: 1000 }, { chain: 0 });
    const burst = lines.find(l => l.name.includes('三重') || l.name.includes('解放'));
    expect(burst.desc).toContain('11000');
    expect(burst.desc).toContain('5500');
  });

  it('坎特蕾拉 S380/H400/解放400·200 满迷离720·360', () => {
    resetState({
      team: ['坎特蕾拉', '安可', '忌炎'],
      roles: {
        '坎特蕾拉': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = battle.team.find(t => t.name === '坎特蕾拉');
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(3.8, 5);
    expect(idx.queryCharacterHook(a, 'heavyMult')).toBeCloseTo(4.0, 5);
    expect(idx.queryCharacterHook(a, 'variationMult')).toBeCloseTo(1.2, 5);
    a.forte.ready = false;
    a.forte.current = 0;
    let bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(4.0, 5);
    expect(bm.baseSide).toBeCloseTo(2.0, 5);
    a.forte.current = 100;
    a.forte.ready = true;
    bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(7.2, 5);
    expect(bm.baseSide).toBeCloseTo(3.6, 5);
    const lines = skillHints.SKILL_HINTS['坎特蕾拉'].customLines({ atk: 1000 }, { chain: 0 });
    expect(lines.some(l => l.desc.includes('3800'))).toBe(true);
    expect(lines.some(l => l.desc.includes('4000'))).toBe(true);
  });

  it('相里要 N130/S200/H400/解放1500·750', () => {
    resetState({
      team: ['相里要', '安可', '忌炎'],
      roles: {
        '相里要': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = battle.team.find(t => t.name === '相里要');
    expect(idx.queryCharacterHook(a, 'normalMult')).toBeCloseTo(1.3, 5);
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(2.0, 5);
    expect(idx.queryCharacterHook(a, 'heavyMult')).toBeCloseTo(4.0, 5);
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(15.0, 5);
    expect(bm.baseSide).toBeCloseTo(7.5, 5);
    const lines = skillHints.SKILL_HINTS['相里要'].customLines({ atk: 1000 }, { chain: 0 });
    expect(lines.some(l => l.desc.includes('15000'))).toBe(true);
    expect(lines.some(l => l.desc.includes('2000'))).toBe(true);
  });

  it('凌阳 N125/S210/解放400·200', () => {
    resetState({
      team: ['凌阳', '安可', '忌炎'],
      roles: {
        '凌阳': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = battle.team.find(t => t.name === '凌阳');
    expect(idx.queryCharacterHook(a, 'normalMult')).toBeCloseTo(1.25, 5);
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(2.1, 5);
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(4.0, 5);
    expect(bm.baseSide).toBeCloseTo(2.0, 5);
    const lines = skillHints.SKILL_HINTS['凌阳'].customLines({ atk: 1000 }, { chain: 0 });
    expect(lines.some(l => l.desc.includes('2100'))).toBe(true);
    expect(lines.some(l => l.desc.includes('4000'))).toBe(true);
  });

  it('鉴心 N110/S300/H400/解放650·325', () => {
    resetState({
      team: ['鉴心', '安可', '忌炎'],
      roles: {
        '鉴心': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = battle.team.find(t => t.name === '鉴心');
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(3.0, 5);
    expect(idx.queryCharacterHook(a, 'heavyMult')).toBeCloseTo(4.0, 5);
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(6.5, 5);
    expect(bm.baseSide).toBeCloseTo(3.25, 5);
    const lines = skillHints.SKILL_HINTS['鉴心'].customLines({ atk: 1000 }, { chain: 0 });
    expect(lines.some(l => l.desc.includes('3000'))).toBe(true);
    expect(lines.some(l => l.desc.includes('6500'))).toBe(true);
  });

  it('维里奈 治疗位 S120/解放200·100', () => {
    resetState({
      team: ['维里奈', '安可', '忌炎'],
      roles: {
        '维里奈': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = battle.team.find(t => t.name === '维里奈');
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(1.2, 5);
    const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
    expect(bm.baseMain).toBeCloseTo(2.0, 5);
    expect(bm.baseSide).toBeCloseTo(1.0, 5);
    const lines = skillHints.SKILL_HINTS['维里奈'].customLines({ atk: 1000 }, { chain: 0 });
    expect(lines.some(l => l.desc.includes('1200'))).toBe(true);
    expect(lines.some(l => l.desc.includes('2000'))).toBe(true);
  });

  it('洛可可 N100/S180/H400/变奏170 · 解放走全局', () => {
    resetState({
      team: ['洛可可', '安可', '忌炎'],
      roles: {
        '洛可可': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
      },
    });
    const battle = quickBattle();
    const a = battle.team.find(t => t.name === '洛可可');
    expect(idx.queryCharacterHook(a, 'normalMult')).toBeCloseTo(1.0, 5);
    expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(1.8, 5);
    expect(idx.queryCharacterHook(a, 'heavyMult')).toBeCloseTo(4.0, 5);
    expect(idx.queryCharacterHook(a, 'variationMult')).toBeCloseTo(1.7, 5);
    expect(idx.queryCharacterHook(a, 'resolveBurstMult')).toBeUndefined();
    const lines = skillHints.SKILL_HINTS['洛可可'].customLines({ atk: 1000 }, { chain: 0 });
    expect(lines.some(l => l.desc.includes('7000'))).toBe(true);
    expect(lines.some(l => l.desc.includes('1700'))).toBe(true);
  });
});
