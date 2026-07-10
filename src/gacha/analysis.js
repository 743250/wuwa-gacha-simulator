// 抽卡记录分析 + 欧非评价
//
// 数据源：S 对象（state.js）
//   - 全局计数器 S.total / S.five / S.four / S.upHits：准确累计
//   - S.log：所有抽卡明细（每条 {r,n,t,pool,pity,up,no,date}），不裁剪
//   - S.pity：各池当前垫的抽数
//
// 关键约束：
//   - 出金率用全局计数器算（avoid 任何裁剪导致失真）
//   - 歪率只统计 eventChar/collabChar 这两个真正 50/50 的池子
//     （武器池/常驻/新手/新旅都是 100% 或 0%，不算"歪"）
//   - log 中 eventChar+collabChar 的 5★ 数 <1 时无歪率数据

export const THRESHOLDS = {
  rate: {
    ouhuang: 0.0160,   // >1.6% 欧皇
    xiaoou: 0.0133,    // >1.33% 小欧
    pingwen: 0.0105,   // 1.05%-1.33% 平稳
    xiaofei: 0.0086,   // <1.05% 小非，<0.86% 非酋
    dafei: 0.0070,     // <0.70% 大非酋
  },
  loss: {
    ou: 0.35,          // <35% 不歪
    fei: 0.65,         // >65% 爱歪
  },
  recent: {
    hot: 0.0160,
    cold: 0.0080,
  },
  weight: { rate: 0.5, loss: 0.3, recent: 0.2 },
  score: { ouhuang: 1.5, xiaoou: 0.5, pingwen: -0.5, xiaofei: -1.0, feiqiu: -1.8 },
};

const TITLES = [
  { key: 'ouhuang',  label: '欧皇',     comment: '天命所归，你被星声眷顾',     color: 'gold'   },
  { key: 'xiaoou',   label: '小欧',     comment: '运气不错，今天适合抽卡',     color: 'gold'   },
  { key: 'pingwen',  label: '平稳',     comment: '中规中矩，不欧不非',         color: 'accent' },
  { key: 'xiaofei',  label: '小非',     comment: '有点黑，建议换个时间',       color: 'muted'  },
  { key: 'feiqiu',   label: '非酋',     comment: '非洲大草原在召唤你',         color: 'red'    },
  { key: 'dafei',    label: '大非酋',   comment: '呜… 看哭了，建议停手',       color: 'red'    },
];

// 真正的 50/50 池子（小保底机制）
const PVP_POOLS = new Set(['eventChar', 'collabChar']);

function safeDiv(a, b) {
  if (!b || b <= 0) return 0;
  return a / b;
}

function rateScore(rate) {
  const t = THRESHOLDS.rate;
  if (rate > t.ouhuang) return 2;
  if (rate > t.xiaoou) return 1;
  if (rate >= t.pingwen) return 0;
  if (rate >= t.xiaofei) return -1;
  if (rate >= t.dafei) return -2;
  return -3;
}

function lossScore(lossRate) {
  if (lossRate == null) return 0;
  if (lossRate < THRESHOLDS.loss.ou) return 1;
  if (lossRate > THRESHOLDS.loss.fei) return -1;
  return 0;
}

function recentScore(recentRate) {
  if (recentRate > THRESHOLDS.recent.hot) return 1;
  if (recentRate < THRESHOLDS.recent.cold) return -1;
  return 0;
}

function judgeTitle(overallRate, lossRate, lossReliable, recentRate) {
  const w = THRESHOLDS.weight;
  let score = rateScore(overallRate) * w.rate;
  if (lossReliable) score += lossScore(lossRate) * w.loss;
  score += recentScore(recentRate) * w.recent;

  const s = THRESHOLDS.score;
  let idx;
  if (score >= s.ouhuang) idx = 0;
  else if (score >= s.xiaoou) idx = 1;
  else if (score > s.pingwen) idx = 2;
  else if (score >= s.xiaofei) idx = 3;
  else if (score >= s.feiqiu) idx = 4;
  else idx = 5;

  return { ...TITLES[idx], score };
}

// 计算分池统计：按 pool 分组
function computePerPool(log) {
  const map = {};
  for (const x of log) {
    if (!x || !x.pool) continue;
    const p = map[x.pool] || (map[x.pool] = { pulls: 0, five: 0, four: 0, pitySum: 0, pityCount: 0, upCount: 0 });
    p.pulls++;
    if (x.r === 5) {
      p.five++;
      if (x.up) p.upCount++;
      if (typeof x.pity === 'number') {
        p.pitySum += x.pity;
        p.pityCount++;
      }
    } else if (x.r === 4) {
      p.four++;
    }
  }
  const list = Object.entries(map).map(([pool, v]) => ({
    pool,
    pulls: v.pulls,
    five: v.five,
    four: v.four,
    avgPity: v.pityCount > 0 ? v.pitySum / v.pityCount : 0,
    upCount: v.upCount,
  }));
  list.sort((a, b) => b.pulls - a.pulls);
  return list;
}

export function computeAnalysis(S) {
  const empty = {
    totalPulls: 0, fiveCount: 0, fourCount: 0,
    overallRate: 0, avgPity: 0, avgUpPity: 0,
    limitedPvpFive: 0, limitedPvpLost: 0, lossRate: null, lossRateReliable: false,
    luckiestPity: null, unluckiestPity: null,
    recent100Rate: 0, recent100Five: 0,
    perPool: [],
    title: { key: 'pingwen', label: '平稳', comment: '暂无数据', score: 0, color: 'muted' },
  };
  try {
    const total = S.total || 0;
    const five = S.five || 0;
    const four = S.four || 0;
    const log = Array.isArray(S.log) ? S.log : [];

    if (total === 0) return { ...empty, totalPulls: 0 };

    const overallRate = safeDiv(five, total);
    // 所有 5★ 出金记录（log 不再裁剪，覆盖全期）
    const fives = log.filter(x => x && x.r === 5);
    // 平均出金抽数：所有 5★ 出金时已垫的 pity 均值
    let pitySum = 0, pityCount = 0;
    let upPitySum = 0, upPityCount = 0;
    for (const x of fives) {
      if (typeof x.pity === 'number') {
        pitySum += x.pity; pityCount++;
        if (x.up) { upPitySum += x.pity; upPityCount++; }
      }
    }
    const avgPity = pityCount > 0 ? pitySum / pityCount : 0;
    const avgUpPity = upPityCount > 0 ? upPitySum / upPityCount : 0;

    // 歪率：只看 eventChar/collabChar 池的 5★
    let limitedFive = 0, limitedLost = 0;
    for (const x of fives) {
      if (PVP_POOLS.has(x.pool)) {
        limitedFive++;
        if (!x.up) limitedLost++;
      }
    }
    const lossRateReliable = limitedFive >= 1;
    const lossRate = lossRateReliable ? safeDiv(limitedLost, limitedFive) : null;

    // 欧非极值
    let luckiest = null, unluckiest = null;
    for (const x of fives) {
      if (typeof x.pity === 'number') {
        if (luckiest == null || x.pity < luckiest) luckiest = x.pity;
        if (unluckiest == null || x.pity > unluckiest) unluckiest = x.pity;
      }
    }

    // 近 100 抽手感
    const recent = log.slice(-100);
    const recentFive = recent.filter(x => x && x.r === 5).length;
    const recent100Rate = safeDiv(recentFive, Math.min(100, log.length));

    const perPool = computePerPool(fives);

    const title = judgeTitle(overallRate, lossRate, lossRateReliable, recent100Rate);

    return {
      totalPulls: total,
      fiveCount: five,
      fourCount: four,
      overallRate,
      avgPity,
      avgUpPity,
      limitedPvpFive: limitedFive,
      limitedPvpLost: limitedLost,
      lossRate,
      lossRateReliable,
      luckiestPity: luckiest,
      unluckiestPity: unluckiest,
      recent100Rate,
      recent100Five: recentFive,
      recent100Size: recent.length,
      perPool,
      title,
    };
  } catch (e) {
    return { ...empty, totalPulls: S.total || 0 };
  }
}

// 出金时间线数据：log 中所有 5★ 按 no 升序（旧的，正向）
export function timelineFiveStars(S) {
  const log = Array.isArray(S.log) ? S.log : [];
  return log
    .filter(x => x && x.r === 5)
    .sort((a, b) => (a.no || 0) - (b.no || 0));
}

// 时间线分池+倒序：返回 { poolKey: [timeline entries] } 并按 no 倒序
export function timelineByPoolDesc(S) {
  const log = Array.isArray(S.log) ? S.log : [];
  const fives = log.filter(x => x && x.r === 5);
  const groups = {};
  for (const x of fives) {
    if (!x.pool) continue;
    if (!groups[x.pool]) groups[x.pool] = [];
    groups[x.pool].push(x);
  }
  for (const k of Object.keys(groups)) {
    groups[k].sort((a, b) => (b.no || 0) - (a.no || 0));
  }
  return groups;
}

// 所有抽过的池键（log 中出现过该池的任何记录就算）
export function poolsTouched(S) {
  const log = Array.isArray(S.log) ? S.log : [];
  const seen = new Set();
  const order = [];
  for (const x of log) {
    if (!x || !x.pool || seen.has(x.pool)) continue;
    seen.add(x.pool);
    order.push(x.pool);
  }
  return order;
}

// 限定池（eventChar / collabChar）的判定信息，需要 banner 历史找目标 UP 角色
// 这里只返回带"歪/UP"语义的标记，名字翻译留给 UI
// 歪 = 出金但 up===false（官方常驻池 5★，注入到活动池里）
// UP = 出金且 up===true（拿到了当期 UP）
// 对于 weapon/novice/beginner/standard 等池，up 字段语义不是 50/50，标记为 'fixed'
export function fiveStarKind(x) {
  if (!x) return 'fixed';
  if (x.pool === 'eventChar' || x.pool === 'collabChar') {
    return x.up ? 'up' : 'lost';
  }
  return 'fixed';   // 武器/常驻/新手/新旅 — 这些池子没有"歪"概念
}

// 当前垫条：限定池（活动角色池）当前已垫抽数；只取当前 banner 池
export function currentPity(S, poolKey) {
  return (S && S.pity && S.pity[poolKey]) || 0;
}
