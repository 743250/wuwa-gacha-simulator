import { describe, it, expect } from 'vitest';
import { computeAnalysis } from '../../src/gacha/analysis.js';

function five(partial) {
  return {
    r: 5,
    n: partial.n || (partial.up ? 'UP角' : '常驻角'),
    t: '',
    pool: partial.pool || 'eventChar',
    pity: partial.pity ?? 60,
    up: !!partial.up,
    no: partial.no,
    date: '2026-01-01',
  };
}

function analysisFromFives(fives, total = 1000) {
  return computeAnalysis({
    total,
    five: fives.length,
    four: 0,
    log: fives,
    pity: {},
  });
}

describe('computeAnalysis · 歪率只计小保底', () => {
  it('歪 + 大保底 UP 只算 1 次小保底（100% 歪），大保底不进分母', () => {
    // 小保底歪 → 大保底 UP
    const a = analysisFromFives([
      five({ no: 1, up: false, pity: 70 }),
      five({ no: 2, up: true, pity: 65 }),
    ]);
    expect(a.limitedPvpFive).toBe(1); // 仅 1 次小保底
    expect(a.limitedPvpLost).toBe(1);
    expect(a.lossRate).toBeCloseTo(1, 5);
  });

  it('小保底 UP 计入分母且不算歪', () => {
    const a = analysisFromFives([
      five({ no: 1, up: true, pity: 50 }),
      five({ no: 2, up: true, pity: 55 }),
    ]);
    expect(a.limitedPvpFive).toBe(2);
    expect(a.limitedPvpLost).toBe(0);
    expect(a.lossRate).toBeCloseTo(0, 5);
  });

  it('歪→大保底UP→小保底UP = 1/2，不是 1/3', () => {
    const a = analysisFromFives([
      five({ no: 1, up: false, pity: 70 }), // 小保底歪
      five({ no: 2, up: true, pity: 60 }),  // 大保底 UP（不进分母）
      five({ no: 3, up: true, pity: 40 }),  // 小保底 UP
    ]);
    expect(a.limitedPvpFive).toBe(2);
    expect(a.limitedPvpLost).toBe(1);
    expect(a.lossRate).toBeCloseTo(0.5, 5);
  });

  it('多池各自维护大保底状态，不串池', () => {
    const a = analysisFromFives([
      five({ no: 1, pool: 'eventChar', up: false, pity: 70 }),
      five({ no: 2, pool: 'collabChar', up: true, pity: 50 }), // 另一池小保底 UP
      five({ no: 3, pool: 'eventChar', up: true, pity: 60 }),  // event 大保底
    ]);
    // event: 1 小保底歪；collab: 1 小保底 UP；event 大保底不计
    expect(a.limitedPvpFive).toBe(2);
    expect(a.limitedPvpLost).toBe(1);
    expect(a.lossRate).toBeCloseTo(0.5, 5);
  });

  it('武器/常驻/新旅武器不进歪率；新旅角色计入', () => {
    const a = analysisFromFives([
      five({ no: 1, pool: 'eventWeapon', up: true, pity: 70 }),
      five({ no: 2, pool: 'standardChar', up: false, pity: 70 }),
      five({ no: 3, pool: 'noviceWeapon', up: true, pity: 70 }),
      five({ no: 4, pool: 'noviceChoice', up: false, pity: 70 }),
      five({ no: 5, pool: 'noviceChoice', up: true, pity: 70 }),
    ]);
    expect(a.limitedPvpFive).toBe(1);
    expect(a.limitedPvpLost).toBe(1);
    expect(a.lossRate).toBeCloseTo(1, 5);
  });

  it('log 倒序（新在前）也能正确还原序列', () => {
    const a = analysisFromFives([
      five({ no: 3, up: true, pity: 40 }),
      five({ no: 2, up: true, pity: 60 }),
      five({ no: 1, up: false, pity: 70 }),
    ]);
    expect(a.limitedPvpFive).toBe(2);
    expect(a.limitedPvpLost).toBe(1);
    expect(a.lossRate).toBeCloseTo(0.5, 5);
  });
});
