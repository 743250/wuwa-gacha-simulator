// Buff 渲染器注册表 + 状态徽章收集器
//
// 统一三类状态为徽章数据模型 { key, cls, icon, label, dur, tip }：
//   · 角色 buff/debuff/资源（BUFF_RENDERERS + collectUnitBadges）
//   · 敌人机制标志（ENEMY_STATUS_EXTRACTORS + collectEnemyBadges）
// 渲染层（renderBuffStripe / renderTeam / renderEnemies）只调 collect* 拿数组，
// 不再自己写 if (e._xxx) 分支。

import { getTempStatInstances, hasTempStat } from '../../battle/tempStats.js';
import { collectCharacterBadges } from '../../battle/characters/index.js';

function pct(v) { return `${(v * 100).toFixed(0)}%`; }

// 通用 tooltip HTML 转义（防 label/tip 里的引号破坏 data-tip 属性）
function escAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 把 badge 数组里的 tip 字段做转义，方便塞进 data-tip="..."
export function renderBadge(b) {
  if (!b) return '';
  const cls = b.cls || 'field';
  const tip = escAttr(b.tip || '');
  const dur = b.dur != null ? `<span class="bf-dur">${b.dur}</span>` : '';
  return `<span class="tip-term bf-buff ${cls}" data-tip="${tip}">${b.icon || ''} ${b.label || ''}${dur}</span>`;
}

export const BUFF_RENDERERS = {
  burstWindow: {
    cls: 'burst', icon: '🔥',
    label(buf, t) { return `${t.name} 强化形态 +${pct(buf.value)}`; },
    tip: '<b>强化形态</b><br>共鸣解放后伤害加成窗口。'
  },
  defense: {
    cls: 'def', icon: '🛡',
    label(buf, t) { return `${t.name} 减伤 ${pct(buf.value)}`; },
    tip: '<b>减伤</b><br>受到的最终伤害 ×(1 - 减伤%)。'
  },
  healUp: {
    cls: 'heal', icon: '💚',
    label(buf, t) { return `${t.name} 治疗效果 +${pct(buf.value)}`; },
    tip: '<b>治疗效果提升</b><br>所有治疗量 ×(1 + 加成%)。'
  },
  critUp: {
    cls: 'crit', icon: '✦',
    label(buf, t) { return `全队 暴击 +${pct(buf.value)}`; },
    tip: '<b>全队暴击加成</b><br>作用于所有存活队员。'
  },
  cdmgUp: {
    cls: 'crit', icon: '✦',
    label(buf, t) { return `全队 暴伤 +${pct(buf.value)}`; },
    tip: '<b>全队暴击伤害加成</b><br>作用于所有存活队员。'
  },
  atkUp: {
    cls: 'atk', icon: '⚔',
    label(buf, t) { return `全队 攻击 +${pct(buf.value)}`; },
    tip: '<b>全队攻击加成</b><br>作用于所有存活队员。'
  },
  field: {
    cls: 'field', icon: '🌐',
    label(buf, t) { return `${t.name} ${buf.label || '领域'}`; },
    tip: '<b>领域</b><br>场地型持续效果。'
  },
  healOverTime: {
    cls: 'heal', icon: '💚',
    label(buf, t) { return `${buf.src || '领域'} 每回合回血 ${buf.value.toFixed(0)}`; },
    tip: '<b>持续治疗</b><br>回合结束时回血。'
  },
  heavyDmgUp: {
    cls: 'atk', icon: '⚔',
    label(buf, t) { return `全队 重击伤害 +${pct(buf.value)}`; },
    tip: '<b>重击伤害加成</b><br>作用于所有存活队员的重击。'
  }
};

// TEAM_BUFF_TYPES: 去重白名单 — 全队 buff 在顶部 stripe 只显示一次
export const TEAM_BUFF_TYPES = new Set(['critUp', 'cdmgUp', 'atkUp', 'heavyDmgUp', 'healOverTime']);

// ============ 敌人机制提取器 ============
// 每个 extractor 读 enemy 上的 _xxx 标志位返回 badge 数组（空数组表示无此状态）
// 新增敌人机制时在这里加一条，不用改 battle.js
export const ENEMY_STATUS_EXTRACTORS = {
  shield(e) {
    if (!e.shield || e.shield <= 0) return [];
    const ice = getTempStatInstances(e, 'dmgReduc').find(s => s.source === 'ice_shield');
    return [{
      key: `sh-${e.name}`, cls: 'shield', icon: '🛡',
      label: `护盾 ${e.shield}`,
      tip: `<b>护盾</b><br>受击时优先扣护盾，再扣 HP。${ice ? `冰翼减伤 ${(ice.mult * 100).toFixed(0)}%。` : ''}`
    }];
  },
  suppressed(e) {
    if (!e.suppressed || e.suppressed <= 0) return [];
    return [{
      key: `sp-${e.name}`, cls: 'debuff', icon: '💢',
      label: `中断 ${e.suppressed}回`, dur: e.suppressed,
      tip: `<b>破韧中断</b><br>韧性归零后的破绽状态。受到伤害 ×${(1 + (e.suppressedVuln || 0.3)).toFixed(1)}。剩余 ${e.suppressed} 回合。`
    }];
  },
  flight(e) {
    if (!hasTempStat(e, 'dmgImmune')) return [];
    return [{
      key: `fl-${e.name}`, cls: 'field', icon: '🕊',
      label: '飞空无敌',
      tip: '<b>飞空无敌</b><br>近战角色无法命中，远程可命中。受到的伤害为 0。'
    }];
  },
  deflect(e) {
    if (!e._deflectActive) return [];
    const mult = ((e.mechanic?.value || 0.4) * 100).toFixed(0);
    return [{
      key: `defl-${e.name}`, cls: 'mechanic', icon: '🛡',
      label: `反弹 ${mult}%`,
      tip: `<b>反击姿态</b><br>受到伤害时按 ${mult}% 反弹给攻击者。`
    }];
  },
  bubble(e) {
    if (!e._bubbleHp || e._bubbleHp <= 0) return [];
    return [{
      key: `bub-${e.name}`, cls: 'heal', icon: '🫧',
      label: `绿泡 ${e._bubbleHp}`,
      tip: `<b>绿泡护罩</b><br>独立的 HP 池，回合末回复 ${e._bubbleHealAmt || 0}。`
    }];
  },
  debris(e) {
    if (!e._debrisReady) return [];
    return [{
      key: `deb-${e.name}`, cls: 'atk', icon: '⚙',
      label: '残骸可投',
      tip: '<b>残骸投掷</b><br>点击"残骸"按钮可眩晕 BOSS。'
    }];
  },
  wind_wall(e) {
    const w = getTempStatInstances(e, 'dmgReduc').find(s => s.source === 'wind_wall');
    if (!w) return [];
    return [{
      key: `ww-${e.name}`, cls: 'def', icon: '🌪',
      label: `风壁 ${(w.mult * 100).toFixed(0)}%`,
      dur: w.turns === Infinity ? null : w.turns,
      tip: `<b>风壁减伤</b><br>受到的最终伤害 ×(1 - ${(w.mult * 100).toFixed(0)}%)。`
    }];
  },
  overclock(e) {
    if (!e._overclockTurns || e._overclockTurns <= 0) return [];
    return [{
      key: `oc-${e.name}`, cls: 'mechanic', icon: '🔥',
      label: `双动 ${e._overclockTurns}回`, dur: e._overclockTurns,
      tip: '<b>Overclock 双动</b><br>本回合行动两次。'
    }];
  },
  laser(e) {
    if (!e._laserCharging) return [];
    return [{
      key: `laser-${e.name}`, cls: 'mechanic', icon: '⚡',
      label: '蓄力激光',
      tip: '<b>蓄力激光</b><br>下回合发射高伤激光。'
    }];
  },
  saws(e) {
    if (!e._saws || e._saws.length === 0) return [];
    return [{
      key: `saws-${e.name}`, cls: 'mechanic', icon: '🪚',
      label: `电锯 ×${e._saws.length}`,
      tip: '<b>追踪电锯</b><br>每回合追击随机队员。'
    }];
  },
  phase(e) {
    if (!e.phase || e.phase <= 1) return [];
    return [{
      key: `ph-${e.name}`, cls: 'mechanic', icon: '📌',
      label: `阶段 ${e.phase}${e._airPhase ? ' · 空中' : ''}`,
      tip: `<b>阶段 ${e.phase}</b><br>${e._airPhase ? '空中形态：近战伤害 -30%。' : ''}BOSS 进入新阶段。`
    }];
  },
  marks(e, b) {
    const has = Object.keys(e.marks || {}).some(k => (e.marks[k] || 0) > 0);
    if (!has) return [];
    const total = b.team.filter(t => t.alive).reduce((sum, t) => sum + (e.marks[t.idx] || 0), 0);
    return [{
      key: `mk-${e.name}`, cls: 'debuff', icon: '🔥',
      label: `灼伤 ${total}层`,
      tip: '<b>灼伤</b><br>标记角色受到额外火伤。'
    }];
  },
  cartethyia(e) {
    if (!e.cartethyiaErosion || e.cartethyiaErosion <= 0) return [];
    return [{
      key: `ce-${e.name}`, cls: 'debuff', icon: '🌪',
      label: `风蚀 ×${e.cartethyiaErosion}`,
      tip: '<b>风蚀</b><br>回合末每层扣 ATK×0.3。'
    }];
  },
  blast(e) {
    if (!e._delayedBlast) return [];
    return [{
      key: `bl-${e.name}`, cls: 'debuff', icon: '💥',
      label: '爆破蓄能',
      tip: '<b>延迟爆破</b><br>地面发光，下回合爆破。'
    }];
  },
};

// ============ 收集器 ============

// 敌人状态：遍历所有 extractor
export function collectEnemyBadges(e, b) {
  if (!e || !e.alive) return [];
  const out = [];
  for (const fn of Object.values(ENEMY_STATUS_EXTRACTORS)) {
    const arr = fn(e, b);
    if (Array.isArray(arr)) out.push(...arr);
  }
  // 侵蚀 debuff（敌人身上）
  (e.debuffs || []).forEach(d => {
    if (d.type === 'erosion') {
      out.push({
        key: `er-${e.name}-${d.element}`, cls: 'debuff', icon: '☣',
        label: `${d.element}侵蚀 +${(d.value * 100).toFixed(0)}%`, dur: d.duration,
        tip: `<b>${d.element}侵蚀</b><br>受到 ${d.element} 伤害时额外 +${(d.value * 100).toFixed(0)}%。`
      });
    }
    if (d.type === 'spectro_frazzle') {
      out.push({
        key: `sf-${e.name}`, cls: 'debuff', icon: '☣',
        label: '衍射失序', dur: d.duration,
        tip: '<b>衍射失序</b><br>衍射伤害加深。'
      });
    }
  });
  return out;
}

// 角色状态：合并 buff/debuff/资源/控制
// opts.includeTeamGlobal: 是否包含 TEAM_BUFF_TYPES（顶部 stripe 用 true 去重，卡内联用 false 过滤）
export function collectUnitBadges(unit, battle, opts = {}) {
  if (!unit || !unit.alive) return [];
  const out = [];
  const includeTeamGlobal = opts.includeTeamGlobal !== false;

  // buffs
  (unit.buffs || []).forEach(buf => {
    const isTeamGlobal = TEAM_BUFF_TYPES.has(buf.type);
    if (isTeamGlobal && !includeTeamGlobal) return;
    const r = BUFF_RENDERERS[buf.type];
    if (!r) return;
    out.push({
      key: `${buf.type}-${unit.name}`,
      cls: r.cls, icon: r.icon,
      label: r.label(buf, unit),
      dur: buf.duration,
      tip: r.tip || ''
    });
  });

  // debuffs（角色身上的）
  (unit.debuffs || []).forEach(d => {
    if (d.type === 'erosion') {
      out.push({
        key: `er-${unit.name}-${d.element}`, cls: 'debuff', icon: '☣',
        label: `${d.element}侵蚀`, dur: d.duration,
        tip: `<b>${d.element}侵蚀</b><br>受到 ${d.element} 伤害时额外 +${(d.value * 100).toFixed(0)}%。`
      });
    }
    if (d.type === 'havoc_erosion' && d.stacks > 0) {
      out.push({
        key: `he-${unit.name}`, cls: 'debuff', icon: '🌀',
        label: `湮灭之蚀 ×${d.stacks}`,
        tip: '<b>湮灭之蚀</b><br>每层降低受到的治疗。'
      });
    }
    if (d.type === 'defDown' && d.stacks > 0) {
      out.push({
        key: `df-${unit.name}`, cls: 'debuff', icon: '🔻',
        label: `防御 ↓${(d.stacks * d.value * 100).toFixed(0)}%`,
        tip: '<b>防御下降</b><br>受到的伤害增加。'
      });
    }
  });

  // 敌人灼伤 mark（角色身上）
  battle.enemies.forEach(e => {
    if (e.marks && (e.marks[unit.idx] || 0) > 0) {
      out.push({
        key: `mk-${unit.name}-${e.name}`, cls: 'debuff', icon: '🔥',
        label: `灼伤 ×${e.marks[unit.idx]}`,
        tip: `<b>灼伤</b><br>${e.name} 标记你,受到额外火伤。`
      });
    }
  });

  // 护盾
  if (unit.shield && unit.shield > 0) {
    out.push({
      key: `sh-${unit.name}`, cls: 'shield', icon: '🛡',
      label: `护盾 ${unit.shield}`,
      tip: '<b>护盾</b><br>受击时优先扣护盾,再扣 HP。'
    });
  }

  // 协奏满
  if ((unit.concerto || 0) >= 100) {
    out.push({
      key: `con-${unit.name}`, cls: 'crit', icon: '🎵',
      label: '协奏满',
      tip: '<b>协奏满</b><br>切换时触发延奏技能。'
    });
  }

  // 控制 / 封锁
  if ((unit.skillLockedTurns || 0) > 0) {
    out.push({
      key: `lock-${unit.name}`, cls: 'debuff', icon: '🔒',
      label: `技能封锁 ${unit.skillLockedTurns}回`, dur: unit.skillLockedTurns,
      tip: '<b>技能封锁</b><br>无法使用共鸣技能。'
    });
  }
  if ((unit.frozenTurns || 0) > 0) {
    out.push({
      key: `fz-${unit.name}`, cls: 'debuff', icon: '❄',
      label: `冻结 ${unit.frozenTurns}回`, dur: unit.frozenTurns,
      tip: '<b>冻结</b><br>无法行动。'
    });
  }
  if ((unit._wallLocked || 0) > 0) {
    out.push({
      key: `wl-${unit.name}`, cls: 'debuff', icon: '⚡',
      label: `雷霆墙锁定 ${unit._wallLocked}回`, dur: unit._wallLocked,
      tip: '<b>雷霆墙锁定</b><br>无法切换角色。'
    });
  }

  // 角色专属资源（忌炎锐意、卡提希娅决意/形态、折枝墨鹤等）
  const charBadges = collectCharacterBadges(unit);
  if (Array.isArray(charBadges)) out.push(...charBadges);

  // 声骸套装效果
  if (unit.echoStats?.setBonuses?.length) {
    for (const sb of unit.echoStats.setBonuses) {
      out.push({
        key: `echo-${unit.name}-${sb.setId}-${sb.tier}`,
        cls: 'field',
        icon: '💠',
        label: `${sb.name} ${sb.tier}件`,
        tip: `<b>${sb.name} ${sb.tier}件套</b><br>${describeEchoSetBonus(sb)}`
      });
    }
  }

  return out;
}

function describeEchoSetBonus(sb) {
  const t = sb.type;
  const v = sb.value;
  const pct = (n) => (n * 100).toFixed(0) + '%';
  switch (t) {
    case 'elem_dmg':       return `${sb.elem}元素伤害 +${pct(v)}。`;
    case 'elem_dmg_cond': return `${sb.elem}元素伤害 +${pct(v)}（触发条件后）。`;
    case 'heal_bonus':    return `治疗加成 +${pct(v)}。`;
    case 'resonance_efficiency':  return `共鸣解放伤害 +${pct(v)}。`;
    case 'atk_pct':       return `攻击力 +${pct(v)}。`;
    case 'atk_pct_stack': return `攻击力 +${pct(v)}（每层，最大 2 层）。`;
    case 'atk_team_flat': return `全队攻击力 +${v}。`;
    case 'normal_atk_dmg':return `普攻伤害 +${pct(v)}。`;
    case 'normal_atk_dmg_cond': return `普攻伤害 +${pct(v)}（触发条件后）。`;
    case 'skill_dmg':     return `共鸣技能伤害 +${pct(v)}。`;
    case 'atk_pct_elem':  return `攻击力 +${pct(v)}（条件元素加成）。`;
    default:              return `${t}：${v}`;
  }
}
