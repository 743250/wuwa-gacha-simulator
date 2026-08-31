// 概率曲线常量(五星角色/武器共用)
// 改动需同步 tests/gacha/core.test.js:19-54 的锁定值。

export const BASE_RATE = .008;        // 65 抽以内基础概率 0.8%
export const HARD_PITY = 80;          // 80 抽硬保底
export const SOFT_PITY_KNOT = 65;     // 软保底起点
export const MID_PITY_KNOT = 70;      // 中段拐点
export const HIGH_PITY_KNOT = 75;     // 高段拐点
export const SOFT_SLOPE = .04;        // 66-70 每抽 +4%
export const MID_SLOPE = .08;         // 71-75 每抽 +8%
export const HIGH_SLOPE = .10;        // 76-79 每抽 +10%
export const SOFT_SPAN = MID_PITY_KNOT - SOFT_PITY_KNOT;   // 5 抽
export const MID_SPAN = HIGH_PITY_KNOT - MID_PITY_KNOT;    // 5 抽

export const ASTRITE_PER_PULL = 160;   // 1 抽 = 160 星声（星声兑换波纹基准）
