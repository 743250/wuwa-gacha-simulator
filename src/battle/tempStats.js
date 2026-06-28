// 临时属性变更注册表 · 2026-06-27 战斗抽象 Step D
//
// 收口散写在各处的"临时属性倍率叠加"：
//   · 敌人狂暴 atk +30% / 60% / 70%      → applyTempStat(enemy, 'atk', 1+atkBonus, Infinity, 'enrage')
//   · 无妄者过渡减伤 50%                → applyTempStat(enemy, 'dmgReduc', 0.5, 1, 'phase_transition')
//   · 海之女飞空无敌                    → applyTempStat(enemy, 'dmgImmune', '∞', flightTurns, 'flight')
//   · 弹反易伤 +50%                     → 已合入 suppressed 状态自身（不走这里）
//
// 设计原则：
//   · 多层叠加用乘子，伤害结算统一调 computeStat(target, stat, baseVal)
//   · 来源（source）唯一标识每个实例，方便 removeTempStat 一次性清掉同一来源全部层
//   · turns=Infinity 表示永久（如狂暴），其他按回合衰减
//   · dmgReduc 的语义：最终伤害 = baseVal × (1 - mult)。mult ∈ [0,1]
//   · dmgImmune 的语义：mult='∞' 时直接 0；否则 final = baseVal × mult
//   · atk 的语义：final = baseVal × mult
//
// 字段：`unit._tempStats[stat]` 是 [{ mult, turns, source }] 列表
// 把它当注册器私产，外部不要直接读写。

export function applyTempStat(unit, stat, mult, turns, source) {
  if (!unit) return;
  if (!unit._tempStats) unit._tempStats = {};
  if (!unit._tempStats[stat]) unit._tempStats[stat] = [];
  // 同 source 不重复叠（避免部分场景叠加失控）—— by source 替换
  unit._tempStats[stat] = unit._tempStats[stat].filter(s => s.source !== source);
  unit._tempStats[stat].push({ mult, turns, source });
}

// 按 source 一次性清除
export function removeTempStat(unit, source) {
  if (!unit._tempStats) return;
  for (const stat of Object.keys(unit._tempStats)) {
    unit._tempStats[stat] = unit._tempStats[stat].filter(s => s.source !== source);
    if (unit._tempStats[stat].length === 0) delete unit._tempStats[stat];
  }
}

// 按 stat 一次性清除（用于设置成新值）
export function clearTempStat(unit, stat) {
  if (!unit._tempStats) return;
  delete unit._tempStats[stat];
}

// 读取某 stat 的当前所有实例（只读视图）
export function getTempStatInstances(unit, stat) {
  if (!unit._tempStats?.[stat]) return [];
  return Array.from(unit._tempStats[stat]);
}

// 计算 stat 加成后的最终值
// · atk/dmgUp 类：final = base × Π(mult)
// · dmgReduc 类（语义不同）：final = base × Π(1 - mult)，mult ∈ [0,1]
// · dmgImmune 类：若任一实例 mult='∞' → 0；否则 final = base × Π(mult)
// · 没有任何实例：直接返回 baseVal
export function computeStat(unit, stat, baseVal) {
  const list = unit._tempStats?.[stat];
  if (!list || list.length === 0) return baseVal;
  let result = baseVal;
  let isImmuneZero = false;
  for (const { mult } of list) {
    if (mult === '∞' && stat === 'dmgImmune') { isImmuneZero = true; continue; }
    if (stat === 'dmgReduc') {
      // mult ∈ [0,1] 表示减伤率，叠加乘子取 (1 - mult)
      result = result * (1 - mult);
    } else {
      result = result * mult;
    }
  }
  if (isImmuneZero) return 0;
  return Math.round(result);
}

// 是否有某 stat 的临时实例（用于 UI 显示 / canTarget 等判断）
export function hasTempStat(unit, stat) {
  return !!(unit._tempStats?.[stat] && unit._tempStats[stat].length > 0);
}

// endTurn 一次性衰减所有 stat 的 turns（turns=Infinity 不减）
export function tickTempStats(unit) {
  if (!unit._tempStats) return;
  for (const stat of Object.keys(unit._tempStats)) {
    const list = unit._tempStats[stat];
    const next = [];
    for (const inst of list) {
      if (inst.turns === Infinity) { next.push(inst); continue; }
      inst.turns -= 1;
      if (inst.turns > 0) next.push(inst);
    }
    if (next.length === 0) delete unit._tempStats[stat];
    else unit._tempStats[stat] = next;
  }
}