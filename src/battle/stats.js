// 战斗属性 + 战力 BP 计算
import { S } from '../state.js';
import { getStats } from './template.js';
import { weaponContrib } from '../equip/weapons.js';

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
  return stats;
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
    // 副词条用 stat 字段（兼容）：
    case 'resonance':     stats.resonanceBonus += b.value; break;
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

// 角色升到下一级所需的经验数（按官方真实数值）
// 累加 1→90 总约 170 万经验，对应官方
// 公式拟合：lv² × 7 + 300 → 累加约 171 万
//   1→2: 307     · 42→43: 12,648  · 70→71: 34,600  · 89→90: 55,747
export function expToNext(role) {
  const lv = role.level || 1;
  if (lv >= 90) return Infinity;
  return lv * lv * 7 + 300;
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
