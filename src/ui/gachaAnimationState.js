// 抽卡翻牌动画 UI 交互状态 · Phase 2 步骤 D
//
// 历史:原本 animating 是 src/state.js 里的 `export let animating = false`,
// 还挂到 window。但它是抽卡 UI 防重复点击用的瞬时交互 flag,
// 不属于可持久化游戏状态(不进存档、不影响战斗/抽卡结果)。
// 现迁到 UI 域:
//   · 不写入存档
//   · 不挂到 window
//   · tryPull/doPullN/toFive 的防重复点击行为不变(读 animating early-return)
//
// 注意:这个状态只在 gacha UI 层用,不应被 domain/gacha/core 或 state 引用。
//
// 保持原 export let 写法以最小化调用方修改:gacha/actions.js 仍写 `if (animating) return`,
// animation.js 仍写 setAnimating(true/false)。

export let animating = false;
export function setAnimating(v) { animating = v; }