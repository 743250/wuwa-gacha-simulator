// 形态注册表 · 2026-06-27 战斗抽象 Step C
//
// 收口双形态角色的进/退形态逻辑（卡提希娅芙露德莉斯、安可黑咩、菲比赦罪/告解等）。
// 设计原则：
//   · 每个形态注册一个 id，进/退 hook 在 def 里
//   · 进入后写 unit.activeForm = id，并设 unit.displayName = enterName
//   · 数据层用 unit.name 不变，UI 显示层统一用 unit.displayName ?? unit.name
//   · 切人不丢形态的角色（场地态）carryOnSwitch = true；切人即清的角色（角色态）= false
//
// 形态字段 unit.activeForm / unit.displayName 由 forms.js 维护，外部不要直接写。

const FORM_DEFS = {};

export function registerForm(id, def) {
  FORM_DEFS[id] = def;
}

export function hasForm(unit, id) {
  return unit.activeForm === id;
}

export function getActiveForm(unit) {
  return unit.activeForm ? FORM_DEFS[unit.activeForm] : null;
}

// 进入形态。enterName 可传字符串或 (unit,battle)=>string，不传则不修改 displayName
export function enterForm(unit, id, battle, opts = {}) {
  const def = FORM_DEFS[id];
  if (!def) return;
  // 先退出当前形态（防止直接跨界切换）
  if (unit.activeForm && unit.activeForm !== id) {
    exitForm(unit, unit.activeForm, battle);
  }
  unit.activeForm = id;
  if (def.enterName != null) {
    const name = typeof def.enterName === 'function' ? def.enterName(unit, battle) : def.enterName;
    unit.displayName = name;
  }
  if (def.onEnter) def.onEnter(unit, battle, opts);
}

// 退出形态。displayName 回退到 unit.name，并清 activeForm
export function exitForm(unit, id, battle) {
  const def = FORM_DEFS[id];
  if (unit.activeForm !== id) return;
  if (def?.onExit) def.onExit(unit, battle);
  unit.activeForm = null;
  unit.displayName = unit.name;
}

// 切人钩子：carryOnSwitch=false 时主动退出形态（角色态形态）
// 在 combat.js doSwitch 切人前调一次
export function onUnitSwitchOut(unit, battle) {
  if (!unit.activeForm) return;
  const def = FORM_DEFS[unit.activeForm];
  if (def && def.carryOnSwitch === false) {
    exitForm(unit, unit.activeForm, battle);
  }
}