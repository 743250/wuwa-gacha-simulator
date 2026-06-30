// 切人入场钩子注册表 · 2026-06-27 战斗抽象 Step E
//
// 收口散写在 combat.js doSwitch 末尾的"切人入场效果"：
//   · 忌炎 jiyanSwitchIn：锐意 / 2 链通变 / 5 链明断 / 3 链观势
//   · 今汐 jinhsiSwitchIn：3 链谪仙 / 韶光 +2
//   · 卡提希娅 cartethyiaErosionOnSwitchIn：2 链 · 变奏上场主目标 +1 层风蚀
//   · 安可 encoreGainDisorder：变奏·咩咩帮手 +30 失序
//
// 设计原则：
//   · registerSwitchHook(name, fn) 按角色名挂载
//   · fireSwitchHook({ from, to, battle, ctx }) 在 doSwitch 入场后统一调用
//   · ctx 携带入场上下文（当前只有 variationTarget：变奏主目标，可能为 null）
//   · 后续赞妮 / 露帕扩展时无需再改 combat.js，只在各自角色文件 registerSwitchHook
//
// 字段：SWITCH_HOOKS 是私产，外部不要直接读写。

const SWITCH_HOOKS = {};
// switchOut 钩子：离场时触发（按 from.name 查找），用于弗洛洛指挥状态退出等
const SWITCH_OUT_HOOKS = {};

export function registerSwitchHook(name, fn) {
  SWITCH_HOOKS[name] = fn;
}

export function registerSwitchOutHook(name, fn) {
  SWITCH_OUT_HOOKS[name] = fn;
}

export function getSwitchHook(name) {
  return SWITCH_HOOKS[name];
}

// 在 doSwitch 切人入场后调用：fireSwitchHook({ from, to, battle, ctx })
//   · from：离场角色（可能为 null）
//   · to：入场角色
//   · ctx：{ variationTarget? } —— 入场变奏命中目标（无变奏时为 undefined）
export function fireSwitchHook({ from, to, battle, ctx }) {
  if (!to?.name) return;
  const fn = SWITCH_HOOKS[to.name];
  if (typeof fn !== 'function') return;
  fn({ from, to, battle, ctx });
}

// 在 doSwitch 离场时调用：fireSwitchOutHook({ from, to, battle })
export function fireSwitchOutHook({ from, to, battle }) {
  if (!from?.name) return;
  const fn = SWITCH_OUT_HOOKS[from.name];
  if (typeof fn !== 'function') return;
  fn({ from, to, battle });
}
