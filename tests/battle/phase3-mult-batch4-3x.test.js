// Phase 3 倍率批 4：3.0–3.4 十人（设计 §4 基底 · 非 encore 多形态合计）
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle } from '../helpers.js';

// hook 倍率 = 设计 §4 抽象；skillHints 展示与 hook 对齐（琳奈技能文案写加色 200%，hook 基底 180%）
const THREE_X = {
  '琳奈': { n: 1.0, s: 1.8, h: 4.0, bm: 2.8, bs: 1.4, v: 0.8, heavy: true, skillHintS: 2.0 },
  '莫宁': { n: 1.0, s: 1.5, bm: 4.0, bs: 2.0, v: 0.8, heavy: false },
  '爱弥斯': { n: 1.0, s: 1.8, h: 3.0, bm: 4.0, bs: 2.0, v: 0.8, heavy: true },
  '陆·赫斯': { n: 1.0, s: 1.5, bm: 3.0, bs: 1.5, v: 0.6, heavy: false },
  '西格莉卡': { n: 1.0, s: 1.8, h: 2.2, bm: 4.0, bs: 2.0, v: 0.8, heavy: true },
  '绯雪': { n: 1.0, s: 1.8, h: 0.01, bm: 4.0, bs: 2.0, v: 0.8, heavy: true, skipHeavyHint: true },
  '达妮娅': { n: 1.0, s: 1.8, bm: 4.0, bs: 2.0, v: 0.8, heavy: false },
  '露西': { n: 1.0, s: 1.8, h: 2.2, bm: 4.5, bs: 2.25, v: 0.8, heavy: true },
  '丽贝卡': { n: 1.0, s: 1.8, h: 2.2, bm: 4.0, bs: 2.0, v: 0.8, heavy: true },
  // 解放开窗无直伤：bm/bs=0，skillHints 不展示 0 伤害数字
  '洛瑟菈': { n: 1.0, s: 1.6, bm: 0, bs: 0, v: 0.8, heavy: false, burstOpenOnly: true },
};

describe('Phase3 mult batch4 — 3.x 设计§4', () => {
  let idx;
  let skillHints;

  beforeAll(async () => {
    idx = await import('../../src/battle/characters/index.js');
    skillHints = await import('../../src/ui/render/skillHints.js');
  });

  beforeEach(() => {
    resetState({
      team: ['琳奈', '忌炎', '安可'],
      roles: {
        '琳奈': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        ...Object.fromEntries(Object.keys(THREE_X).map(n => [n, { level: 90, chain: 0 }])),
      },
    });
  });

  for (const [name, m] of Object.entries(THREE_X)) {
    it(`${name} hook N${m.n}/S${m.s}/B${m.bm}·${m.bs}`, () => {
      resetState({
        team: [name, '忌炎', '安可'],
        roles: {
          [name]: { level: 90, chain: 0 },
          '忌炎': { level: 90, chain: 0 },
          '安可': { level: 90, chain: 0 },
        },
      });
      const battle = quickBattle();
      const a = battle.team.find(t => t.name === name);
      expect(a).toBeTruthy();
      expect(!!a.hasHeavy).toBe(m.heavy);
      expect(idx.queryCharacterHook(a, 'normalMult')).toBeCloseTo(m.n, 5);
      expect(idx.queryCharacterHook(a, 'skillMult')).toBeCloseTo(m.s, 5);
      if (m.heavy) {
        expect(idx.queryCharacterHook(a, 'heavyMult')).toBeCloseTo(m.h, 5);
      }
      expect(idx.queryCharacterHook(a, 'variationMult')).toBeCloseTo(m.v, 5);
      const bm = idx.queryCharacterHook(a, 'resolveBurstMult');
      expect(bm.baseMain).toBeCloseTo(m.bm, 5);
      expect(bm.baseSide).toBeCloseTo(m.bs, 5);

      const entry = skillHints.SKILL_HINTS[name];
      expect(entry).toBeTruthy();
      const lines = entry.customLines
        ? entry.customLines({ atk: 1000, hp: 10000, healBonus: 0, maxEnergy: 125 }, { chain: 0 })
        : entry; // factory paths unused for these ten
      expect(Array.isArray(lines)).toBe(true);
      const skill = lines.find(l => /共鸣技能|技能/.test(l.name || ''));
      const burst = lines.find(l => /解放/.test(l.name || ''));
      const sShow = m.skillHintS != null ? m.skillHintS : m.s;
      expect(String(skill?.desc || '')).toContain(String(Math.round(1000 * sShow)));
      if (m.burstOpenOnly) {
        expect(String(burst?.desc || '')).toMatch(/无独立开场|形态窗口|追忆|开启/);
      } else {
        expect(String(burst?.desc || '')).toContain(String(Math.round(1000 * m.bm)));
      }
    });
  }
});
