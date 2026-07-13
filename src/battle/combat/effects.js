// 通用元素异常效应系统
//
// 六种元素异常效应（官方 encore.moe term 850008-850013）分三类机制：
//   1. 周期性 DoT：风蚀(气动)/光噪(衍射)/电磁(导电) —— 敌人回合开始时 tick 一次
//   2. 防御降 debuff：虚湮(湮灭) —— 3 层上限，每层 -2% 防御
//   3. 累积爆发：聚爆(热熔)/霜渐(冷凝) —— 10 层上限，满层触发爆炸/冰冻
//
// 数据结构（写入 target.debuffs）：
//   { type:'effect', effect:'wind_erosion', element:'气动', stacks:N, maxStacks, duration }

export const EFFECT_DEFS = {
  wind_erosion: {
    name: '风蚀效应',
    element: '气动',
    cls: 'dot',
    maxStacks: Infinity,
    duration: 3,
    tickType: 'dot_self',
    perStack: 0.3
  },
  light_noise: {
    name: '光噪效应',
    element: '衍射',
    cls: 'dot_self_decay1',
    maxStacks: Infinity,    // 官方未给上限
    duration: 3,
    tickType: 'dot_self',
    perStack: 0.3,
    decayOnTick: 1          // 每次触发后减 1 层（官方原文）
  },
  void_erosion: {
    name: '虚湮效应',
    element: '湮灭',
    cls: 'def_down',
    maxStacks: 3,           // 官方明确
    duration: 3,
    tickType: 'none',
    perStack: 0.02,         // 官方明确：每层防御 -2%
    defDownPerStack: 0.02
  },
  scorch_burst: {
    name: '聚爆效应',
    element: '热熔',
    cls: 'accumulate_burst',
    maxStacks: 10,          // 官方明确
    duration: 3,
    tickType: 'burst_on_max',
    perStack: 0.3           // 爆炸倍率：敌人 ATK × stacks × 0.3
  },
  electro_magnetic: {
    name: '电磁效应',
    element: '导电',
    cls: 'dot_half_decay',
    maxStacks: 10,          // 官方明确
    duration: 3,
    tickType: 'dot_self',
    perStack: 0.3,
    decayOnTick: 'half',    // 每次触发后减一半层数（官方原文）
    overflowTo: 'electro_burst'
  },
  electro_burst: {
    name: '电磁爆发',
    element: '导电',
    cls: 'dot_self',
    maxStacks: 10,
    duration: 3,
    tickType: 'dot_self',
    perStack: 0.3
  },
  frost_gradient: {
    name: '霜渐效应',
    element: '冷凝',
    cls: 'accumulate_freeze',
    maxStacks: 10,          // 官方明确
    duration: 3,
    tickType: 'freeze_on_max',
    perStack: 0.3           // 冰冻前 DoT 倍率
  }
};

// 元素 → 效应映射（附加时方便查）
export const ELEMENT_TO_EFFECT = {
  '气动': 'wind_erosion',
  '衍射': 'light_noise',
  '湮灭': 'void_erosion',
  '热熔': 'scorch_burst',
  '导电': 'electro_magnetic',
  '冷凝': 'frost_gradient'
};

// 在 target.debuffs 里查找指定效应 entry
export function getEffectEntry(target, effectType) {
  if (!target || !target.debuffs) return null;
  return target.debuffs.find(d => d.type === 'effect' && d.effect === effectType) || null;
}

// 读取层数
export function getEffectStacks(target, effectType) {
  const entry = getEffectEntry(target, effectType);
  return entry ? (entry.stacks || 0) : 0;
}

// 获取效应定义
export function getEffectDef(effectType) {
  return EFFECT_DEFS[effectType] || null;
}

// 附加 N 层效应（默认刷新持续时间）
export function addEffect(target, effectType, n, battle, opts = {}) {
  if (!target || n <= 0) return;
  const def = EFFECT_DEFS[effectType];
  if (!def) return;
  // spawnEnemy 等路径可能未初始化 debuffs，这里兜底
  target.debuffs = target.debuffs || [];
  let entry = getEffectEntry(target, effectType);
  if (!entry) {
    entry = {
      type: 'effect',
      effect: effectType,
      element: def.element,
      stacks: 0,
      maxStacks: def.maxStacks,
      duration: def.duration
    };
    target.debuffs.push(entry);
  }
  const before = entry.stacks;
  const max = entry.maxStacks || def.maxStacks;
  const wouldOverflow = before + n > max;

  // 电磁效应溢出 → 转化为电磁爆发
  if (wouldOverflow && def.overflowTo) {
    entry.stacks = max;
    const overflow = before + n - max;
    const burstDef = EFFECT_DEFS[def.overflowTo];
    if (burstDef) {
      let burst = getEffectEntry(target, def.overflowTo);
      if (!burst) {
        burst = {
          type: 'effect', effect: def.overflowTo, element: burstDef.element,
          stacks: 0, maxStacks: burstDef.maxStacks, duration: burstDef.duration
        };
        target.debuffs.push(burst);
      }
      burst.stacks = Math.min(burst.maxStacks, burst.stacks + overflow);
      battle?.log?.push({
        type: 'mechanic', src: opts.src || def.name,
        msg: `${target.name} ${def.name}溢出 → ${burstDef.name} +${overflow}（${burst.stacks}/${burst.maxStacks}）`
      });
    }
  } else {
    entry.stacks = Math.min(max, before + n);
  }

  entry.duration = opts.refreshDuration === false ? (entry.duration || def.duration) : def.duration;

  if (entry.stacks !== before) {
    battle?.log?.push({
      type: 'mechanic', src: opts.src || def.name,
      msg: `${target.name} ${def.name} +${entry.stacks - before} 层（${before} → ${entry.stacks}/${max}）`
    });
  }
}

// 消耗全部层数
export function consumeAllEffect(target, effectType, battle, opts = {}) {
  const stacks = getEffectStacks(target, effectType);
  if (stacks <= 0) return 0;
  const entry = getEffectEntry(target, effectType);
  if (entry) entry.stacks = 0;
  const def = EFFECT_DEFS[effectType];
  battle?.log?.push({
    type: 'mechanic', src: opts.src || (def?.name || '效应'),
    msg: `${target.name} ${(def?.name || effectType)}全部消耗（${stacks} 层）`
  });
  return stacks;
}

// 虚湮效应：防御降低倍率（damage.js 调用，返回 1 - 总降低百分比）
export function voidErosionDefMult(target) {
  const stacks = getEffectStacks(target, 'void_erosion');
  if (stacks <= 0) return 1;
  const def = EFFECT_DEFS.void_erosion;
  return Math.max(0, 1 - stacks * def.defDownPerStack);
}

// 单个敌人的效应 tick（敌人回合开始时调用）
export function tickEffect(enemy, battle, effectType) {
  if (!enemy || !enemy.alive) return;
  const def = EFFECT_DEFS[effectType];
  if (!def) return;
  const stacks = getEffectStacks(enemy, effectType);
  if (stacks <= 0) return;

  // DoT 类：敌人自身 ATK × stacks × perStack
  if (def.tickType === 'dot_self' || def.tickType === 'dot_self_decay1' || def.tickType === 'dot_half_decay') {
    const dmg = Math.round((enemy.atk || 0) * stacks * def.perStack);
    if (dmg > 0) {
      enemy.hp = Math.max(0, enemy.hp - dmg);
      battle.log.push({
        type: 'mechanic', src: enemy.name,
        msg: `${def.name}造成 ${dmg} 点${def.element}伤害（${stacks} 层 × ATK ${enemy.atk || 0} × ${def.perStack}）`
      });
      if (enemy.hp <= 0) {
        enemy.alive = false;
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `${enemy.name} 被${def.name}击败` });
      }
    }
    // 减层
    if (def.decayOnTick === 1) {
      const entry = getEffectEntry(enemy, effectType);
      if (entry) entry.stacks = Math.max(0, entry.stacks - 1);
    } else if (def.decayOnTick === 'half') {
      const entry = getEffectEntry(enemy, effectType);
      if (entry) entry.stacks = Math.floor(entry.stacks / 2);
    }
  }

  // 聚爆：满层爆炸
  if (def.tickType === 'burst_on_max' && stacks >= def.maxStacks) {
    const dmg = Math.round((enemy.atk || 0) * stacks * def.perStack);
    enemy.hp = Math.max(0, enemy.hp - dmg);
    battle.log.push({
      type: 'mechanic', src: enemy.name,
      msg: `${def.name}满层爆炸！造成 ${dmg} 点${def.element}伤害，移除全部层数`
    });
    if (enemy.hp <= 0) {
      enemy.alive = false;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `${enemy.name} 被${def.name}爆炸击败` });
    }
    consumeAllEffect(enemy, effectType, battle);
  }

  // 霜渐：满层冰冻 + 眩晕 1 回合
  if (def.tickType === 'freeze_on_max' && stacks >= def.maxStacks) {
    const dmg = Math.round((enemy.atk || 0) * stacks * def.perStack);
    enemy.hp = Math.max(0, enemy.hp - dmg);
    enemy.suppressed = (enemy.suppressed || 0) + 1;
    battle.log.push({
      type: 'mechanic', src: enemy.name,
      msg: `${def.name}满层冰冻！造成 ${dmg} 点${def.element}伤害，眩晕 1 回合，移除全部层数`
    });
    if (enemy.hp <= 0) {
      enemy.alive = false;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `${enemy.name} 被${def.name}冰冻击败` });
    }
    consumeAllEffect(enemy, effectType, battle);
  }
}

// 敌人回合开始时 tick 所有效应
export function tickAllEffects(enemy, battle) {
  if (!enemy || !enemy.alive) return;
  Object.keys(EFFECT_DEFS).forEach(et => tickEffect(enemy, battle, et));
}

// 持续时间递减（回合结束时调用）
export function decayEffectDurations(enemy, battle) {
  if (!enemy || !enemy.debuffs) return;
  enemy.debuffs.forEach(d => {
    if (d.type === 'effect' && d.duration > 0) {
      d.duration -= 1;
    }
  });
  enemy.debuffs = enemy.debuffs.filter(d => !(d.type === 'effect' && d.duration <= 0));
}

// 兼容旧 API：旧签名 addErosion(target, n, battle, opts) → addEffect(target, 'wind_erosion', n, ...)


export const EROSION_PER_STACK = 0.3;
export const EROSION_DURATION = 3;
export const EROSION_MAX_STACKS = 6;

export function getErosionEntry(target) {
  return getEffectEntry(target, 'wind_erosion');
}

export function getErosionStacks(target) {
  return getEffectStacks(target, 'wind_erosion');
}

export function addErosion(target, n, battle, opts = {}) {
  // 旧签名 (target, n, battle, opts) → 新签名 (target, effectType, n, battle, opts)
  return addEffect(target, 'wind_erosion', n, battle, opts);
}

export function consumeAllErosion(target, battle, opts = {}) {
  return consumeAllEffect(target, 'wind_erosion', battle, opts);
}

export function doubleErosionStacks(target, battle, opts = {}) {
  const cur = getEffectStacks(target, 'wind_erosion');
  if (cur <= 0) return 0;
  const def = EFFECT_DEFS.wind_erosion;
  const doubled = Math.min(def.maxStacks, cur * 2);
  const entry = getEffectEntry(target, 'wind_erosion');
  if (entry) entry.stacks = doubled;
  if (battle && doubled !== cur) {
    battle.log.push({
      type: 'mechanic', src: opts.src || '风蚀效应',
      msg: `${target.name} 风蚀效应层数翻倍（${cur} → ${doubled}）`
    });
  }
  return doubled;
}

export function erosionTick(enemy, battle) {
  return tickEffect(enemy, battle, 'wind_erosion');
}

export function erosionDebuffBonus(target, attackerElement) {
  return 0;
}
