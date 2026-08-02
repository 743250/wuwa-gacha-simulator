// Phase 3 倍率批 3：12 个 4★ 工厂（encore Lv10 抽象）
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { resetState, quickBattle } from '../helpers.js';

const FOUR = {
  '散华': { n: 1.2, s: 3.6, h: 3.7, bm: 8.1, bs: 4.05, v: 1.4, heavy: true },
  '桃祈': { n: 1.1, s: 1.3, h: 2.2, bm: 4.5, bs: 2.25, v: 2.1, heavy: true },
  '炽霞': { n: 1.2, s: 2.5, bm: 9.5, bs: 4.75, v: 1.0, heavy: false },
  '白芷': { n: 1.0, s: 0.2, bm: 0.5, bs: 0.25, v: 0.8, heavy: false },
  '丹瑾': { n: 1.0, s: 3.5, bm: 7.9, bs: 3.95, v: 2.0, heavy: false },
  '秧秧': { n: 1.1, s: 1.4, h: 2.2, bm: 5.6, bs: 2.8, v: 1.6, heavy: true },
  '渊武': { n: 1.1, s: 2.0, bm: 3.5, bs: 1.75, v: 0.6, heavy: false },
  '莫特斐': { n: 1.2, s: 2.1, bm: 3.2, bs: 1.6, v: 1.7, heavy: false },
  '灯灯': { n: 1.1, s: 3.6, bm: 9.5, bs: 4.75, v: 1.7, heavy: false },
  '釉瑚': { n: 1.0, s: 3.7, bm: 3.3, bs: 1.65, v: 0.9, heavy: false },
  '卜灵': { n: 1.0, s: 0.6, bm: 5.4, bs: 2.7, v: 1.3, heavy: false },
  '秋水': { n: 1.2, s: 0.6, bm: 4.0, bs: 2.0, v: 2.0, heavy: false },
};

describe('Phase3 mult batch3 — 4★ 工厂', () => {
  let idx;
  let skillHints;

  beforeAll(async () => {
    idx = await import('../../src/battle/characters/index.js');
    skillHints = await import('../../src/ui/panels/roleModal/skillHints/index.js');
  });

  beforeEach(() => {
    resetState({
      team: ['散华', '忌炎', '安可'],
      roles: {
        '散华': { level: 90, chain: 0 },
        '忌炎': { level: 90, chain: 0 },
        '安可': { level: 90, chain: 0 },
        ...Object.fromEntries(Object.keys(FOUR).map(n => [n, { level: 90, chain: 0 }])),
      },
    });
  });

  for (const [name, m] of Object.entries(FOUR)) {
    it(`${name} hook 倍率 N${m.n}/S${m.s}/B${m.bm}·${m.bs}`, () => {
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

      const lines = skillHints.SKILL_HINTS[name].customLines({ atk: 1000 }, { chain: 0 });
      const skill = lines.find(l => l.name.includes('共鸣技能') || l.name.includes('技能'));
      const burst = lines.find(l => l.name.includes('解放'));
      expect(String(skill?.desc || '')).toContain(String(Math.round(1000 * m.s)));
      expect(String(burst?.desc || '')).toContain(String(Math.round(1000 * m.bm)));
    });
  }
});
