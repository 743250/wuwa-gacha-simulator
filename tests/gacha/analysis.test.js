import { describe, it, expect } from 'vitest';
import { computeAnalysis, computePoolGroups, detailedHistory, historyTier } from '../../src/gacha/analysis.js';

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

describe('historyTier · 抽数分档', () => {
  const cases = [
    [3, 'super-euro'], [10, 'super-euro'],
    [11, 'euro'], [50, 'euro'],
    [51, 'mid'], [69, 'mid'],
    [70, 'bad'], [73, 'bad'],
    [74, 'super-bad'], [80, 'super-bad'],
  ];
  for (const [pity, tier] of cases) {
    it(`${pity} 抽 → ${tier}`, () => {
      expect(historyTier(pity)).toBe(tier);
    });
  }
  it('缺 pity 时按 0 处理（不崩）', () => {
    expect(historyTier(undefined)).toBe('super-euro');
  });
});

describe('detailedHistory · 逐金明细', () => {
  function entry(partial) {
    return {
      r: partial.r ?? 3,
      n: partial.n || '杂项',
      t: '',
      pool: partial.pool || 'eventChar',
      pity: partial.pity ?? 1,
      up: !!partial.up,
      no: partial.no,
      date: partial.date || '2026-01-01',
    };
  }

  it('倒序输出（新→旧）', () => {
    const rows = detailedHistory({ log: [
      entry({ r: 5, n: '甲', no: 1, pity: 40 }),
      entry({ r: 5, n: '乙', no: 5, pity: 70 }),
    ] });
    expect(rows.map(r => r.name)).toEqual(['乙', '甲']);
  });

  it('四星陪跑只收「上一颗 5★ 之后、本颗之前」的，且按名合并计数', () => {
    const rows = detailedHistory({ log: [
      entry({ r: 5, n: '旧金', no: 1, pity: 50 }),
      entry({ r: 4, n: '秧秧', no: 2 }),
      entry({ r: 3, n: '三星', no: 3 }),
      entry({ r: 4, n: '桃祈', no: 4 }),
      entry({ r: 4, n: '秧秧', no: 5 }),
      entry({ r: 5, n: '新金', no: 6, pity: 30 }),
    ] });
    const xin = rows.find(r => r.name === '新金');
    expect(xin.fours.map(f => `${f.name}x${f.count}`).sort()).toEqual(['桃祈x1', '秧秧x2']);
    expect(rows.find(r => r.name === '旧金').fours).toEqual([]);
  });

  it('窗口不跨池：另一池的四星不算进来', () => {
    const rows = detailedHistory({ log: [
      entry({ r: 5, n: '甲', no: 1, pool: 'eventChar', pity: 50 }),
      entry({ r: 4, n: '秧秧', no: 2, pool: 'standardChar' }),
      entry({ r: 5, n: '乙', no: 3, pool: 'eventChar', pity: 60 }),
    ] });
    expect(rows.find(r => r.name === '乙').fours).toEqual([]);
  });

  it('四星按名区分角色/武器', () => {
    const rows = detailedHistory({ log: [
      entry({ r: 4, n: '秧秧', no: 1 }),
      entry({ r: 4, n: '东落', no: 2 }), // fourWeapons 里的四星武器
      entry({ r: 5, n: '金', no: 3, pity: 50 }),
    ] });
    const kinds = Object.fromEntries(rows[0].fours.map(f => [f.name, f.kind]));
    expect(kinds['秧秧']).toBe('char');
    expect(kinds['东落']).toBe('weapon');
  });

  it('缺 log 时返回空数组', () => {
    expect(detailedHistory({})).toEqual([]);
  });
});

describe('computePoolGroups · 四池分组', () => {
  function e(partial) {
    return {
      r: partial.r ?? 3,
      n: partial.n || '杂项',
      t: '',
      pool: partial.pool,
      pity: partial.pity ?? 1,
      up: !!partial.up,
      no: partial.no,
      date: '2026-01-01',
    };
  }
  const groups = (log) => Object.fromEntries(computePoolGroups({ log }).map(g => [g.key, g]));

  it('恒返回四组，顺序固定', () => {
    const g = computePoolGroups({ log: [] });
    expect(g.map(x => x.key)).toEqual(['limited', 'weapon', 'standard', 'collab']);
  });

  it('按组聚合抽数与出金，常驻组合并角色/武器两池', () => {
    const g = groups([
      e({ pool: 'eventChar', r: 5, pity: 60 }),
      e({ pool: 'eventChar' }),
      e({ pool: 'standardChar', r: 5, pity: 40 }),
      e({ pool: 'standardWeapon', r: 5, pity: 50 }),
    ]);
    expect(g.limited).toMatchObject({ pulls: 2, five: 1 });
    expect(g.standard).toMatchObject({ pulls: 2, five: 2 });
    expect(g.standard.avgPity).toBeCloseTo(45, 5);
  });

  it('限定组记歪，常驻/武器组的歪显示为 0 或 null', () => {
    const g = groups([
      e({ pool: 'eventChar', r: 5, up: false, pity: 70 }),
      e({ pool: 'eventWeapon', r: 5, up: true, pity: 50 }),
    ]);
    expect(g.limited.lost).toBe(1);
    expect(g.limited.showLost).toBe(true);
    expect(g.weapon.lost).toBe(0);      // 武器无 50/50
    expect(g.standard.lost).toBe(null); // 常驻不显示歪
    expect(g.standard.showLost).toBe(false);
  });

  it('被动的平均标签与口径', () => {
    const g = computePoolGroups({ log: [] });
    expect(g.find(x => x.key === 'standard').avgLabel).toBe('五星平均');
    expect(g.find(x => x.key === 'limited').avgLabel).toBe('UP平均');
  });
});
