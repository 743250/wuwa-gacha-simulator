// 层数资源注册表 · 2026-06-27 战斗抽象 Step B
//
// 收口散写在各角色文件里的「叠层资源」逻辑（忌炎锐意、卡提希娅决意等）。
// 设计原则：
//   · 每个机制注册一个 id，cap/decay/render/hook 都在 def 里
//   · 角色文件不再自己维护 unit.X = (unit.X||0)+1 这种散写
//   · 渲染统一由 renderStacks 收集，战斗 UI 直接调一次即可
//   · 衰减由 tickStacks 在 endTurn 一次性触发；不衰减的资源不实现 decayCooldown
//
// 层数值保存在 `unit._stacks[id]`，衰减计时在 `unit._stackTimers[id]`，
// 把这两个字段当成注册器私产，外部不要直接读写。

const STACK_DEFS = {};

export function registerStack(id, def) {
  STACK_DEFS[id] = def;
}

export function getStack(unit, id) {
  return unit._stacks?.[id] || 0;
}

export function getStackCap(unit, id) {
  const def = STACK_DEFS[id];
  if (!def) return 0;
  return typeof def.cap === 'function' ? def.cap(unit) : (def.cap ?? 0);
}

// 加层。return 新层数
export function gainStack(unit, id, source, battle, n = 1) {
  const def = STACK_DEFS[id];
  if (!def) return 0;
  const cap = getStackCap(unit, id);
  const before = getStack(unit, id);
  const after = Math.min(cap, before + n);
  if (after <= before) {
    // 满了，仍可能想触发刷新衰减计时
    if (def.resetDecayOnGain && def.decayCooldown && unit._stackTimers) {
      unit._stackTimers[id] = def.decayCooldown;
    }
    return after;
  }
  if (!unit._stacks) unit._stacks = {};
  unit._stacks[id] = after;
  if (def.resetDecayOnGain && def.decayCooldown) {
    if (!unit._stackTimers) unit._stackTimers = {};
    unit._stackTimers[id] = def.decayCooldown;
  }
  if (def.onGain) def.onGain(unit, battle, after, before, source);
  if (def.onCap && after >= cap) def.onCap(unit, battle);
  return after;
}

// 一次性消耗全部，返回消耗前层数
export function consumeStack(unit, id, battle) {
  const before = getStack(unit, id);
  if (before > 0) {
    unit._stacks[id] = 0;
    if (unit._stackTimers) unit._stackTimers[id] = 0;
    const def = STACK_DEFS[id];
    if (def?.onConsume) def.onConsume(unit, battle, before);
  }
  return before;
}

// endTurn 调用，统一衰减
export function tickStacks(battle, unit) {
  if (!unit._stacks) return;
  for (const id of Object.keys(unit._stacks)) {
    const def = STACK_DEFS[id];
    if (!def || !def.decayCooldown) continue;
    if (!unit._stackTimers) continue;
    let timer = unit._stackTimers[id] || 0;
    if (timer <= 0) continue;
    timer--;
    unit._stackTimers[id] = timer;
    if (timer > 0) continue;
    const before = unit._stacks[id] || 0;
    if (before > 1) {
      unit._stacks[id] = before - 1;
      unit._stackTimers[id] = def.decayCooldown;
      if (def.onDecay) def.onDecay(unit, battle);
    } else {
      unit._stacks[id] = 0;
      if (def.onExhaust) def.onExhaust(unit, battle);
    }
  }
}

// 角色面板 / 战斗 UI 调用，合并所有注册 stack 的渲染
export function renderStacks(unit) {
  if (!unit._stacks) return '';
  let html = '';
  for (const id of Object.keys(unit._stacks)) {
    const def = STACK_DEFS[id];
    if (!def?.render) continue;
    html += def.render(unit) || '';
  }
  return html;
}