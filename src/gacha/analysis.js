// 抽卡记录分析 + 欧非评价
//
// 数据源：S 对象（state.js）
//   - 全局计数器 S.total / S.five / S.four / S.upHits：准确累计
//   - S.log：所有抽卡明细（每条 {r,n,t,pool,pity,up,no,date}）
//     约定：新记录在前（actions.recordPullResults 用 unshift 风格）
//   - S.pity：各池当前垫的抽数
//
// 欧非判定（贴近社区抽卡分析工具常见口径）：
//   主指标 = 平均五星抽数 avgPity（相对硬保 80、软保 65 的期望约 62）
//   辅指标 = 角色限定/联动池 50/50 歪率（样本不足时不参与）
//   微调 = 近 100 抽（log 前 100 条 = 最新）出金率
//
// 关键约束：
//   - 出金率用全局计数器算
//   - 歪率只统计 eventChar/collabChar/noviceChoice 的「小保底」结果
//   - 大保底（歪后的 100% UP）不进歪率分母
//   - 武器/常驻/新手池/新旅武器不算「歪」

// 鸣潮硬保 80；社区经验期望约 60~64 抽出金。主轴 = 平均抽数，辅轴 = 歪率/近况。
// 称号档位对齐常见抽卡分析工具：不止「欧皇/非酋」，按均抽细分 + 组合副标。
export const THRESHOLDS = {
  // 平均五星抽数（越低越欧）— 分 9 档
  avgPity: {
    tianxuan: 42,  // ≤42 天选
    ouhuang: 50,   // ≤50 欧皇
    daou: 54,      // ≤54 大欧
    xiaoou: 58,    // ≤58 小欧
    pingwen: 64,   // ≤64 平稳（期望区）
    xiaofei: 68,   // ≤68 小非
    feiqiu: 72,    // ≤72 非酋
    dafei: 76,     // ≤76 大非
    // >76 绝非
  },
  loss: {
    ou: 0.30,          // <30% 极不歪
    mildOu: 0.40,      // <40% 偏不歪
    fei: 0.60,         // >60% 偏歪
    hardFei: 0.75,     // >75% 狂歪
    minSamples: 5,     // 至少 5 个限定 5★ 才参与评分/副标
  },
  recent: {
    hot: 0.0160,
    cold: 0.0080,
    window: 100,
  },
  // 主称号只由 avgPity 定档；loss/recent 最多让主档 ±1，并写进副标文案
  adjustCap: 1,
};

// 主称号（按综合分）
const TITLES = [
  { key: 'tianxuan', label: '天选之人', comment: '均抽离谱，星声在给你打工',     color: 'gold'   },
  { key: 'ouhuang',  label: '欧皇',     comment: '天命所归，你被星声眷顾',       color: 'gold'   },
  { key: 'daou',     label: '大欧',     comment: '运气在线，池子见你就软',       color: 'gold'   },
  { key: 'xiaoou',   label: '小欧',     comment: '略优于期望，今天适合抽卡',     color: 'accent' },
  { key: 'pingwen',  label: '平稳',     comment: '卡在期望线上，不欧不非',       color: 'accent' },
  { key: 'xiaofei',  label: '小非',     comment: '略黑一截，再抽要心态管理',     color: 'muted'  },
  { key: 'feiqiu',   label: '非酋',     comment: '非洲户口本已盖章',             color: 'red'    },
  { key: 'dafei',    label: '大非酋',   comment: '软保底是你的主场',             color: 'red'    },
  { key: 'juefei',   label: '绝非',     comment: '呜… 建议关掉唤取界面冷静',     color: 'red'    },
];

// 真正的 50/50 池子（小保底机制；新旅角色同款）
const PVP_POOLS = new Set(['eventChar', 'collabChar', 'noviceChoice']);
// UP 五星武器池（模拟器内出金即目标武器，up 恒为 true）
const WEAPON_UP_POOLS = new Set(['eventWeapon', 'collabWeapon', 'noviceWeapon']);

function safeDiv(a, b) {
  if (!b || b <= 0) return 0;
  return a / b;
}

/** UP 五星武器平均抽数：武器限定/联动/新旅武器池出金 pity 均值 */
function computeAvgWeaponUpPity(fives) {
  let sum = 0, n = 0;
  for (const x of fives) {
    if (!x || !WEAPON_UP_POOLS.has(x.pool) || typeof x.pity !== 'number') continue;
    sum += x.pity;
    n++;
  }
  return n > 0 ? sum / n : 0;
}

// 主档：只由平均抽数决定（社区工具主轴）
function pityTierIndex(avgPity) {
  if (!(avgPity > 0)) return 4; // 平稳占位，调用方会覆盖「命运未定」
  const t = THRESHOLDS.avgPity;
  if (avgPity <= t.tianxuan) return 0;
  if (avgPity <= t.ouhuang) return 1;
  if (avgPity <= t.daou) return 2;
  if (avgPity <= t.xiaoou) return 3;
  if (avgPity <= t.pingwen) return 4;
  if (avgPity <= t.xiaofei) return 5;
  if (avgPity <= t.feiqiu) return 6;
  if (avgPity <= t.dafei) return 7;
  return 8;
}

// 辅轴只允许 ±1 档，避免「均抽平稳 + 不歪」直接跳欧皇
// 近况只进 flavor，不改主档
function adjustDelta(lossRate, lossReliable) {
  let d = 0;
  if (lossReliable && lossRate != null) {
    const t = THRESHOLDS.loss;
    if (lossRate < t.ou) d -= 1;          // 不歪 → 更欧一档（idx 更小）
    else if (lossRate > t.hardFei) d += 1; // 狂歪 → 更非一档
  }
  const cap = THRESHOLDS.adjustCap;
  return Math.max(-cap, Math.min(cap, d));
}

function flavorSuffix(lossRate, lossReliable, recentRate, recentSize, luckiest, unluckiest) {
  const bits = [];
  if (lossReliable && lossRate != null) {
    if (lossRate < THRESHOLDS.loss.ou) bits.push('不歪战士');
    else if (lossRate < THRESHOLDS.loss.mildOu) bits.push('小保底友好');
    else if (lossRate > THRESHOLDS.loss.hardFei) bits.push('五十必歪传说');
    else if (lossRate > THRESHOLDS.loss.fei) bits.push('爱歪体质');
  }
  if (recentSize >= 50) {
    if (recentRate > THRESHOLDS.recent.hot) bits.push('近况火热');
    else if (recentRate < THRESHOLDS.recent.cold) bits.push('近况冰封');
  }
  if (typeof luckiest === 'number' && luckiest <= 20) bits.push(`最欧${luckiest}抽`);
  if (typeof unluckiest === 'number' && unluckiest >= 78) bits.push(`最非${unluckiest}抽`);
  return bits.length ? bits.join(' · ') : '';
}

function judgeTitle(avgPity, lossRate, lossReliable, recentRate, recentSize, luckiest, unluckiest) {
  if (!(avgPity > 0)) {
    return {
      key: 'pingwen', label: '命运未定', comment: '还没出金，抽几发再来看',
      score: 0, color: 'muted', flavor: '',
    };
  }

  let idx = pityTierIndex(avgPity);
  const delta = adjustDelta(lossRate, lossReliable);
  idx = Math.max(0, Math.min(TITLES.length - 1, idx + delta));

  const base = TITLES[idx];
  const flavor = flavorSuffix(lossRate, lossReliable, recentRate, recentSize, luckiest, unluckiest);
  const comment = flavor ? `${base.comment}（${flavor}）` : base.comment;

  // 展示分：均抽档位映射到 -2~+2 便于横幅摘要
  const score = (4 - idx) * 0.45 - delta * 0.2;

  let label = base.label;
  if (lossReliable && lossRate != null) {
    if (idx <= 2 && lossRate > THRESHOLDS.loss.hardFei) label = `${base.label}·爱歪`;
    else if (idx >= 6 && lossRate < THRESHOLDS.loss.ou) label = `${base.label}·不歪`;
    else if (idx <= 1 && lossRate < THRESHOLDS.loss.ou) label = `${base.label}·双修`;
  }

  return { ...base, label, comment, score, flavor };
}

// 平均 UP 成本：按池时间序合并「歪 + 大保底 UP」
// fives 可为任意顺序；内部按 pool 分组再按 no 升序
function computeAvgUpCost(fives) {
  const byPool = {};
  for (const x of fives) {
    if (!x || !PVP_POOLS.has(x.pool) || typeof x.pity !== 'number') continue;
    (byPool[x.pool] || (byPool[x.pool] = [])).push(x);
  }
  let costSum = 0, upCount = 0;
  for (const list of Object.values(byPool)) {
    list.sort((a, b) => (a.no || 0) - (b.no || 0));
    let pendingLost = 0; // 尚未被 UP 吃掉的歪 pity 累计
    for (const x of list) {
      if (x.up) {
        costSum += pendingLost + x.pity;
        upCount++;
        pendingLost = 0;
      } else {
        pendingLost += x.pity;
      }
    }
    // 末尾未闭合的歪不计入（还没换到 UP）
  }
  return upCount > 0 ? costSum / upCount : 0;
}

// 50/50 歪率：只计小保底
// 按池内时间序：歪后的下一次 5★ 是大保底（100% UP），不进分母
// 小保底 = 非大保底的限定池 5★（歪 or 小保底出 UP）
// 歪率 = 小保底歪次数 / 小保底次数
function computeSoftPityLoss(fives) {
  const byPool = {};
  for (const x of fives) {
    if (!x || !PVP_POOLS.has(x.pool)) continue;
    (byPool[x.pool] || (byPool[x.pool] = [])).push(x);
  }
  let softTrials = 0, softLost = 0;
  for (const list of Object.values(byPool)) {
    list.sort((a, b) => (a.no || 0) - (b.no || 0));
    let hardNext = false; // 上一发小保底歪了 → 下一发大保底
    for (const x of list) {
      if (hardNext) {
        // 大保底：必 UP，不计入 50/50 样本
        hardNext = false;
        continue;
      }
      softTrials++;
      if (!x.up) {
        softLost++;
        hardNext = true;
      }
    }
  }
  return { softTrials, softLost };
}

// 计算分池统计：必须喂完整 log，不能只喂 5★
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
    overallRate: 0, avgPity: 0, avgUpPity: 0, avgWeaponUpPity: 0,
    limitedPvpFive: 0, limitedPvpLost: 0, lossRate: null, softWinRate: null, lossRateReliable: false,
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
    const fives = log.filter(x => x && x.r === 5);

    // 平均出金抽数：所有 5★ 的 pity 均值
    let pitySum = 0, pityCount = 0;
    for (const x of fives) {
      if (typeof x.pity === 'number') {
        pitySum += x.pity; pityCount++;
      }
    }
    const avgPity = pityCount > 0 ? pitySum / pityCount : 0;

    // UP 角色平均抽数：拿到 1 次限定角色 UP 平均花多少抽
    // 正确口径（社区工具同款）：按池时间序把「歪 + 随后大保底 UP」合并为一次成本
    //   例：70 抽歪 → 65 抽 UP ⇒ 该次 UP 成本 135，不是 65
    // 未闭合的歪（后面还没出 UP）不计入；武器/常驻不参与
    const avgUpPity = computeAvgUpCost(fives);
    // UP 五星武器平均抽数：武器限定池出金 pity 均值（本模拟器武器池出金即目标）
    const avgWeaponUpPity = computeAvgWeaponUpPity(fives);

    // 小保底歪率 / 不歪率：eventChar/collabChar/noviceChoice 的 50/50
    // 大保底 UP 必中，不进分母（例：歪→大保底UP→小保底UP = 1/2，不是 1/3）
    const { softTrials: limitedFive, softLost: limitedLost } = computeSoftPityLoss(fives);
    const lossRateReliable = limitedFive >= THRESHOLDS.loss.minSamples;
    const lossRate = limitedFive >= 1 ? safeDiv(limitedLost, limitedFive) : null;
    // 展示用：小保底不歪率 = 1 - 歪率
    const softWinRate = lossRate != null ? Math.max(0, 1 - lossRate) : null;

    // 欧非极值
    let luckiest = null, unluckiest = null;
    for (const x of fives) {
      if (typeof x.pity === 'number') {
        if (luckiest == null || x.pity < luckiest) luckiest = x.pity;
        if (unluckiest == null || x.pity > unluckiest) unluckiest = x.pity;
      }
    }

    // 近 N 抽：log 新在前 → 取前 N 条
    const win = THRESHOLDS.recent.window;
    const recent = log.slice(0, win);
    const recentFive = recent.filter(x => x && x.r === 5).length;
    const recentSize = recent.length;
    const recent100Rate = safeDiv(recentFive, recentSize);

    const perPool = computePerPool(log);
    const title = judgeTitle(avgPity, lossRate, lossRateReliable, recent100Rate, recentSize, luckiest, unluckiest);

    return {
      totalPulls: total,
      fiveCount: five,
      fourCount: four,
      overallRate,
      avgPity,
      avgUpPity,
      avgWeaponUpPity,
      limitedPvpFive: limitedFive,
      limitedPvpLost: limitedLost,
      lossRate,
      softWinRate,
      lossRateReliable,
      luckiestPity: luckiest,
      unluckiestPity: unluckiest,
      recent100Rate,
      recent100Five: recentFive,
      recent100Size: recentSize,
      perPool,
      title,
    };
  } catch (e) {
    return { ...empty, totalPulls: S.total || 0 };
  }
}

// 出金时间线数据：log 中所有 5★ 按 no 升序（旧→新）
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

// 所有抽过的池键
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

// 限定/新旅角色池 50/50 语义；其余池 fixed
export function fiveStarKind(x) {
  if (!x) return 'fixed';
  if (x.pool === 'eventChar' || x.pool === 'collabChar' || x.pool === 'noviceChoice') {
    return x.up ? 'up' : 'lost';
  }
  return 'fixed';
}

export function currentPity(S, poolKey) {
  return (S && S.pity && S.pity[poolKey]) || 0;
}
