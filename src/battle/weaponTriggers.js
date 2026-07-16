// 武器触发器运行时
// 在战斗中按事件触发武器被动效果（叠层、持续时间、条件激活）
//
// 状态保存在 unit.weaponStacks 上：
//   { [triggerIdx]: { stacks, duration, effect, value, ...trigger } }
//
// 在动作发生时调用 fireTrigger(unit, eventName, ctx)
// 在伤害计算时调用 collectWeaponBonus(unit, dmgType, defender) 拿到当前总加成
// 在回合结束时调用 tickWeaponTriggers(unit) 持续时间 -1

function weaponTeamAtkSrc(unitName, triggerIdx) {
  return `武器·全队攻击·${unitName}·${triggerIdx}`;
}

/** team_atk：写入全队 atkUp buff（collectWeaponBonus 不处理，避免只加成自己） */
function applyTeamAtkFromWeapon(unit, triggerIdx, t, stacks, battle) {
  if (!battle?.team || t.effect !== 'team_atk') return;
  const src = weaponTeamAtkSrc(unit.name, triggerIdx);
  const value = t.value * stacks;
  const duration = (t.duration || 2) + 1; // +1 补偿当回合 tick
  for (const member of battle.team) {
    if (!member.alive) continue;
    member.buffs = (member.buffs || []).filter(b => b.src !== src);
    member.buffs.push({
      type: 'atkUp',
      value,
      duration,
      src,
      installer: unit.idx
    });
  }
}

/**
 * 在事件发生后激活对应触发器
 * unit: 队员
 * eventName: 'normal_hit' | 'skill_hit' | 'burst_cast' | 'variation' | 'outro' | 'heavy_hit' | 'concerto_consume' | 'heal_skill' | 'offstage' | 'condition_attack'
 * ctx: { battle, target?, ... } — 给某些条件触发器用
 * 返回：触发了多少个新效果（用于日志）
 */
export function fireTrigger(unit, eventName, ctx = {}) {
  if (!unit.weaponTriggers) return 0;
  unit.weaponStacks = unit.weaponStacks || {};
  let fired = 0;
  unit.weaponTriggers.forEach((t, i) => {
    if (t.on !== eventName) return;
    // 条件检查（如气动侵蚀目标）
    if (t.condition && !checkCondition(t.condition, ctx)) return;
    const existing = unit.weaponStacks[i];
    let stacks;
    if (existing) {
      // 叠层增加，重置持续时间
      existing.stacks = Math.min(t.maxStacks || 1, existing.stacks + 1);
      existing.duration = t.duration || 99;
      stacks = existing.stacks;
    } else {
      stacks = 1;
      unit.weaponStacks[i] = {
        stacks: 1,
        maxStacks: t.maxStacks || 1,
        duration: t.duration || 99,
        effect: t.effect,
        value: t.value,
        element: t.element,
        condition: t.condition
      };
    }
    fired++;
    // 特殊处理：协奏值回复
    if (t.effect === 'concerto_refund') {
      unit.concerto = Math.min(100, (unit.concerto || 0) + t.value);
    }
    // 全队攻击：叠层写入各队员 buff（星序协响 / 部分 4★）
    if (t.effect === 'team_atk') {
      applyTeamAtkFromWeapon(unit, i, t, stacks, ctx.battle);
    }
  });
  return fired;
}

/** 清除该单位全部 offstage 武器叠层（入场时调用） */
export function clearOffstageWeaponStacks(unit) {
  if (!unit?.weaponTriggers || !unit.weaponStacks) return;
  unit.weaponTriggers.forEach((t, i) => {
    if (t.on === 'offstage') delete unit.weaponStacks[i];
  });
}

// 检查条件标签
function checkCondition(condition, ctx) {
  if (!ctx.target) return false;
  if (condition === 'enemy_has_erosion_aero') {
    return (ctx.target.debuffs || []).some(d =>
      (d.type === 'effect' && d.effect === 'wind_erosion' && (d.stacks || 0) > 0) ||
      (d.type === 'erosion' && d.element === '气动') // 兼容历史残片
    );
  }
  if (condition === 'enemy_has_spectro_frazzle') {
    return (ctx.target.debuffs || []).some(d => d.type === 'spectro_frazzle');
  }
  return false;
}

// 收集当前对某个伤害类型的所有加成（来自武器叠层 buff）
// 返回 { atkBonus, normalBonus, skillBonus, burstBonus, heavyBonus, elemBonus:{}, defPierce, condBonus }
export function collectWeaponBonus(unit, dmgType, ctx = {}) {
  const out = { atkBonus: 0, normalBonus: 0, skillBonus: 0, burstBonus: 0, heavyBonus: 0,
                elemBonus: {}, defPierce: 0, condBonus: 0 };
  const applyStack = (s) => {
    const total = (s.value || 0) * (s.stacks || 1);
    switch (s.effect) {
      case 'atk_pct':     out.atkBonus += total; break;
      case 'normal_pct':  out.normalBonus += total; break;
      case 'skill_pct':   out.skillBonus += total; break;
      case 'burst_pct':   out.burstBonus += total; break;
      case 'heavy_pct':   out.heavyBonus += total; break;
      case 'elem_dmg':
        if (s.element) out.elemBonus[s.element] = (out.elemBonus[s.element] || 0) + total;
        break;
      case 'def_pierce':  out.defPierce += total; break;
      case 'condition_bonus':
        if (checkCondition(s.condition, ctx)) out.condBonus += total;
        break;
      case 'crate':       out.crateBonus = (out.crateBonus || 0) + total; break;
      // team_atk 已通过 applyTeamAtkFromWeapon 写入 buffs，不在此重复
    }
  };
  if (unit.weaponStacks) {
    Object.values(unit.weaponStacks).forEach(applyStack);
  }
  // on:'always' 不会经 fireTrigger 入栈；结算时直接读武器触发表
  if (unit.weaponTriggers) {
    unit.weaponTriggers.forEach(t => {
      if (t.on !== 'always') return;
      applyStack({
        effect: t.effect,
        value: t.value,
        stacks: 1,
        element: t.element,
        condition: t.condition,
      });
    });
  }
  return out;
}

// 每回合末尾减一持续时间，到期清除
export function tickWeaponTriggers(unit) {
  if (!unit.weaponStacks) return;
  Object.keys(unit.weaponStacks).forEach(k => {
    const s = unit.weaponStacks[k];
    s.duration--;
    if (s.duration <= 0) delete unit.weaponStacks[k];
  });
}
