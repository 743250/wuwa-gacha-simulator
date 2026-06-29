// 战斗属性 + 战力 BP 计算
import { S } from '../state.js';
import { getStats } from './template.js';
import { weaponContrib } from '../equip/weapons.js';
import { getSetById } from '../data/echoes.js';

// 计算角色当前完整战斗属性（已含武器、共鸣链）
// 不含战斗中的临时 buff
export function computeBattleStats(roleName) {
  const o = S.roles[roleName];
  if (!o) return null;
  const base = getStats(roleName, o.level || 1, o.chain || 0);
  const stats = {
    name: roleName,
    chain: o.chain || 0,
    level: o.level || 1,
    hp: base.hp,
    atk: base.atk,
    def: base.def,
    crate: base.crate,
    cdmg: base.cdmg,
    dodge: base.dodge || 0,
    maxEnergy: base.maxEnergy,
    element: base.element,
    type: base.type,
    weaponType: base.weaponType,
    elemBonus: {},
    normalBonus: 0,
    skillBonus: 0,
    burstBonus: 0,
    heavyBonus: 0,
    healBonus: 0,
    teamAtkBonus: 0,
    resonanceBonus: 0,
    defPierce: 0,
    elemAllBonus: 0,
    weapon: null,
    weaponTriggers: []
  };

  // 真实数值角色的突破加成（守岸人：治疗 +21.6%）
  if (base.healBonus)   stats.healBonus  += base.healBonus;
  if (base.atkBonusFixed)   stats.atk       = Math.round(stats.atk * (1 + base.atkBonusFixed));
  if (base.cdmgBonusFixed)  stats.cdmg     += base.cdmgBonusFixed;
  if (base.crateBonusFixed) stats.crate    += base.crateBonusFixed;
  if (base.elemBonusFixed)  stats.elemAllBonus += base.elemBonusFixed;
  if (base.forteStart)      stats.forteStart   = base.forteStart;

  // ★ 当期角色加成（#12）：已取消（用户决定）

  // 应用武器
  if (o.equipWeapon && S.weapons[o.equipWeapon]) {
    const wObj = S.weapons[o.equipWeapon];
    const w = weaponContrib(o.equipWeapon, wObj.level || 1, wObj.refine || 1);
    stats.weapon = { name: o.equipWeapon, ...w };
    stats.atk += w.atk;
    w.bonuses.forEach(b => applyBonus(stats, b));
    stats.weaponTriggers = w.triggers || [];

    // ★ 当期武器加成（#12）：已取消（用户决定）
  }

  // 应用声骸（5 格）
  const ec = echoContrib(roleName);
  if (ec) {
    stats.atk += ec.atkFlat;
    ec.bonuses.forEach(b => applyBonus(stats, b));
    stats.echoStats = { setBonuses: ec.setBonuses, mainStats: ec.mainStats, subStats: ec.subStats };
  }

  return stats;
}

// 声骸贡献：聚合 5 格声骸的主词条 + 副词条 + 套装效果
// 返回 { atkFlat, bonuses, setBonuses, mainStats, subStats }
// 套装只激活 2 件/5 件 → bonuses 中；条件类（_cond / _stack / _next）先按静态值折半计入面板
export function echoContrib(roleName) {
  const r = S.roles[roleName];
  if (!r || !Array.isArray(r.equipEchoes)) return null;
  const equipped = r.equipEchoes
    .map(id => id != null ? S.echos.find(e => e.id === id) : null)
    .filter(Boolean);
  if (!equipped.length) return null;

  const bonuses = [];
  const mainStats = [];
  const subStats = [];

  // 主词条：按 key 转为 bonus
  for (const e of equipped) {
    if (!e.mainStat) continue;
    const m = e.mainStat;
    mainStats.push({ name: e.name, ...m });
    const b = mainStatToBonus(m);
    if (b) bonuses.push(b);
  }

  // 副词条：直接转 bonus（固定值已是百分比小数或 flat）
  for (const e of equipped) {
    for (const s of (e.subStats || [])) {
      subStats.push({ name: e.name, ...s });
      const b = subStatToBonus(s);
      if (b) bonuses.push(b);
    }
  }

  // 套装效果：按 set id 计数，2 件激活 bonus2，5 件激活 bonus5
  const setCount = {};
  for (const e of equipped) {
    const setId = Array.isArray(e.set) ? e.set[0] : e.set;
    if (setId) setCount[setId] = (setCount[setId] || 0) + 1;
  }
  const setBonuses = [];
  for (const [setId, n] of Object.entries(setCount)) {
    const set = getSetById(setId);
    if (!set) continue;
    if (n >= 2 && set.bonus2) setBonuses.push({ setId, name: set.name, tier: 2, ...set.bonus2 });
    if (n >= 5 && set.bonus5) setBonuses.push({ setId, name: set.name, tier: 5, ...set.bonus5 });
  }
  // 套装 bonus 转 panel bonus
  for (const sb of setBonuses) {
    const b = setBonusToBonus(sb);
    if (b) bonuses.push(b);
  }

  return { atkFlat: 0, bonuses, setBonuses, mainStats, subStats };
}

// 主词条（COST4 暴击/暴伤/攻击%/生命%/防御%/治疗；COST3 元素伤/攻击%等；COST1 攻击%/生命%/防御%）
function mainStatToBonus(m) {
  const map = {
    crate: { type: 'crate' },
    cdmg: { type: 'cdmg' },
    atk_pct: { type: 'atk_pct' },
    hp_pct: { type: 'hp' },
    def_pct: { type: 'def_pct' },
    heal_bonus: { type: 'heal' },
    energy_regen: { type: 'energy_regen', key: 'energy_regen' },
  };
  const elemMap = {
    elem_dmg_fire: '热熔', elem_dmg_thunder: '导电', elem_dmg_frost: '冷凝',
    elem_dmg_wind: '气动', elem_dmg_spectro: '衍射', elem_dmg_havoc: '湮灭'
  };
  if (elemMap[m.key]) return { type: 'elem_dmg', element: elemMap[m.key], value: m.value, source: '声骸主词条' };
  const def = map[m.key];
  if (!def) return null;
  return { ...def, value: m.value, source: '声骸主词条' };
}

// 副词条 → bonus（固定值累加到 atk/hp/def_flat，百分比走 applyBonus）
function subStatToBonus(s) {
  const elemMap = {
    elem_dmg_fire: '热熔', elem_dmg_thunder: '导电', elem_dmg_frost: '冷凝',
    elem_dmg_wind: '气动', elem_dmg_spectro: '衍射', elem_dmg_havoc: '湮灭'
  };
  if (s.key === 'atk_flat') return { type: 'atk_flat', value: s.value, source: '声骸副词条' };
  if (s.key === 'hp_flat') return { type: 'hp_flat', value: s.value, source: '声骸副词条' };
  if (s.key === 'def_flat') return { type: 'def_flat', value: s.value, source: '声骸副词条' };
  if (s.key === 'crate') return { type: 'crate', value: s.value, source: '声骸副词条' };
  if (s.key === 'cdmg') return { type: 'cdmg', value: s.value, source: '声骸副词条' };
  if (s.key === 'atk_pct') return { type: 'atk_pct', value: s.value, source: '声骸副词条' };
  if (s.key === 'hp_pct') return { type: 'hp', value: s.value, source: '声骸副词条' };
  if (s.key === 'def_pct') return { type: 'def_pct', value: s.value, source: '声骸副词条' };
  if (s.key === 'energy_regen') return { type: 'energy_regen', value: s.value, source: '声骸副词条', key: 'energy_regen' };
  if (s.key === 'normal_atk_dmg') return { type: 'normal_pct', value: s.value, source: '声骸副词条' };
  if (s.key === 'skill_dmg') return { type: 'skill_pct', value: s.value, source: '声骸副词条' };
  if (s.key === 'burst_dmg') return { type: 'burst_pct', value: s.value, source: '声骸副词条' };
  if (s.key === 'heavy_dmg') return { type: 'heavy_pct', value: s.value, source: '声骸副词条' };
  if (elemMap[s.key]) return { type: 'elem_dmg', element: elemMap[s.key], value: s.value, source: '声骸副词条' };
  return null;
}

// 套装效果 → bonus（条件类按静态值折半计入面板，运行时 trigger 由战斗侧另行处理）
function setBonusToBonus(sb) {
  const map = {
    elem_dmg: () => ({ type: 'elem_dmg', element: sb.elem, value: sb.value, source: `声骸套装·${sb.name}` }),
    elem_dmg_cond: () => ({ type: 'elem_dmg', element: sb.elem, value: sb.value * 0.5, source: `声骸套装·${sb.name}(预估)` }),
    heal_bonus: () => ({ type: 'heal', value: sb.value, source: `声骸套装·${sb.name}` }),
    energy_regen: () => ({ type: 'energy_regen', value: sb.value, key: 'energy_regen', source: `声骸套装·${sb.name}` }),
    atk_pct: () => ({ type: 'atk_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    atk_pct_stack: () => ({ type: 'atk_pct', value: sb.value * 2, source: `声骸套装·${sb.name}(预估2层)` }),
    atk_team_flat: () => ({ type: 'team_atk', value: sb.value, source: `声骸套装·${sb.name}` }),
    atk_next_flat: () => null, // 延奏后下一角色才加成，不计入本人面板
    normal_atk_dmg: () => ({ type: 'normal_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    normal_atk_dmg_cond: () => ({ type: 'normal_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    skill_dmg: () => ({ type: 'skill_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    coord_dmg: () => null, // 协同攻击伤害+30%，无对应面板字段，战斗侧处理
    atk_pct_elem: () => ({ type: 'atk_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
  };
  const fn = map[sb.type];
  return fn ? fn() : null;
}

function applyBonus(stats, b) {
  switch (b.type) {
    case 'atk':
    case 'atk_pct':       stats.atk = Math.round(stats.atk * (1 + b.value)); break;
    case 'hp':            stats.hp = Math.round(stats.hp * (1 + b.value)); break;
    case 'def':
    case 'def_pct':       stats.def = Math.round(stats.def * (1 + b.value)); break;
    case 'crate':         stats.crate += b.value; break;
    case 'cdmg':          stats.cdmg += b.value; break;
    case 'elem':
    case 'elem_dmg':      stats.elemBonus[b.element] = (stats.elemBonus[b.element] || 0) + b.value; break;
    case 'elem_all':      stats.elemAllBonus += b.value; break;
    case 'normal':
    case 'normal_pct':    stats.normalBonus += b.value; break;
    case 'skill':
    case 'skill_pct':     stats.skillBonus += b.value; break;
    case 'burst':
    case 'burst_pct':     stats.burstBonus += b.value; break;
    case 'heavy':
    case 'heavy_pct':     stats.heavyBonus += b.value; break;
    case 'heal':          stats.healBonus += b.value; break;
    case 'teamAtk':
    case 'team_atk':      stats.teamAtkBonus += b.value; break;
    case 'resonance':     stats.resonanceBonus += b.value; break;
    case 'def_pierce':    stats.defPierce += b.value; break;
    case 'atk_flat':     stats.atk += b.value; break;
    case 'hp_flat':       stats.hp += b.value; break;
    case 'def_flat':      stats.def += b.value; break;
    case 'energy_regen':  stats.energyRegen = (stats.energyRegen || 0) + b.value; break;
  }
}

// 战力 BP（综合战力评分，用于UI显示与排序）
export function calcBP(roleName) {
  const o = S.roles[roleName];
  if (!o) return 0;
  const s = computeBattleStats(roleName);
  if (!s) return 0;
  const skillSum = Object.values(o.skillLevels || {}).reduce((a, b) => a + b, 0) || 4;
  const elemBonusSum = Object.values(s.elemBonus).reduce((a, b) => a + b, 0);
  return Math.round(
    s.hp * 0.1 +
    s.atk * 2 +
    s.def * 0.5 +
    s.crate * 2000 +
    (s.cdmg - 1.0) * 1000 +
    elemBonusSum * 500 +
    (s.normalBonus + s.skillBonus + s.burstBonus) * 300 +
    skillSum * 60 +
    (o.chain || 0) * 600 +
    (o.level || 1) * 20
  );
}

// 角色升到下一级所需的经验数（模拟器自定义 · 快速养成节奏）
// 累加 1→90 总约 42.5 万经验
// 公式拟合：lv² × 1.75 + 75 → 累加约 42.5 万
//   1→2: 77      · 42→43: 3,162   · 70→71: 8,650   · 89→90: 13,947
export function expToNext(role) {
  const lv = role.level || 1;
  if (lv >= 90) return Infinity;
  return lv * lv * 1.75 + 75;
}

// 武器升到下一级所需武器突破石（按官方真实数值）
// 5 星武器 1→90 累加约 150 本（按密音筒折算口径）
// 公式：max(1, floor((lv+5)/25))
//   1→19: 1 本/级 · 20→44: 1 本/级 · 45→69: 2 本/级 · 70→89: 3 本/级
//   累加约 154 本
export function weaponToNext(weapon) {
  const lv = weapon.level || 1;
  if (lv >= 90) return Infinity;
  return Math.max(1, Math.floor((lv + 5) / 25));
}

// 经验书提供经验值（鸣潮真实数值）
// 数据校准（2026-06）：官方名为「共鸣促剂」，分初/中/高/特四档
export const EXP_VALUES = {
  exp_low:  1000,
  exp_mid:  3000,
  exp_high: 8000,
  exp_super: 20000   // 特级共鸣促剂
};
