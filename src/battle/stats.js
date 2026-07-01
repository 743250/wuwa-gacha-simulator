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
    weaponTriggers: [],
    // 攻击% / 固定攻击 累加器：所有来源先加总，最后统一应用一次
    // 官方公式：攻击 = (角色基础+武器基础) × (1+攻击%总和) + 固定攻击
    // （修复旧版逐条 atk*=(1+v) 连乘导致的数值虚高）
    _atkPctSum: 0,
    _atkFlatSum: 0
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

  // 统一应用攻击% / 固定攻击（此时 stats.atk = 角色基础 + 武器基础攻击）
  // 攻击% 全部相加后乘一次（不再逐条连乘），再加固定攻击
  stats.atk = Math.round(stats.atk * (1 + stats._atkPctSum) + stats._atkFlatSum);

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

  // 副词条：仅统计已解锁（unlocked !== false）的槽位；旧档无此字段默认解锁
  for (const e of equipped) {
    for (const s of (e.subStats || [])) {
      if (s.unlocked === false) continue;
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
    // 3 件套结构（如 cantarella_void）：set.tier=3 时 n>=3 激活 bonus5
    if (set.tier === 3 && n >= 3 && set.bonus5) setBonuses.push({ setId, name: set.name, tier: 3, ...set.bonus5 });
    // 1 件套结构（ghost_nightmare 碎梦亡鬼之魇）：set.tier=1 时 n>=1 激活 bonus5
    if (set.tier === 1 && n >= 1 && set.bonus5) setBonuses.push({ setId, name: set.name, tier: 1, ...set.bonus5 });
  }
  // 套装 bonus 转 panel bonus（部分套装一条效果映射多个面板字段 → 返回数组）
  for (const sb of setBonuses) {
    const b = setBonusToBonus(sb);
    if (!b) continue;
    if (Array.isArray(b)) bonuses.push(...b);
    else bonuses.push(b);
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
    resonance_efficiency: { type: 'resonance_efficiency', key: 'resonance_efficiency' },
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
  if (s.key === 'resonance_efficiency') return { type: 'resonance_efficiency', value: s.value, source: '声骸副词条', key: 'resonance_efficiency' };
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
    resonance_efficiency: () => ({ type: 'resonance_efficiency', value: sb.value, key: 'resonance_efficiency', source: `声骸套装·${sb.name}` }),
    atk_pct: () => ({ type: 'atk_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    atk_pct_stack: () => ({ type: 'atk_pct', value: sb.value * 2, source: `声骸套装·${sb.name}(预估2层)` }),
    atk_team_flat: () => ({ type: 'team_atk', value: sb.value, source: `声骸套装·${sb.name}` }),
    atk_next_flat: () => null, // 延奏后下一角色才加成，不计入本人面板
    normal_atk_dmg: () => ({ type: 'normal_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    normal_atk_dmg_cond: () => ({ type: 'normal_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    skill_dmg: () => ({ type: 'skill_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    coord_dmg: () => null, // 协同攻击伤害+30%，无对应面板字段，战斗侧处理
    atk_pct_elem: () => ({ type: 'atk_pct', value: sb.value, source: `声骸套装·${sb.name}` }),
    cartethyia_wind_team: () => null,  // 触发型：添加风蚀时全队+15% / 自身额外+15%，运行时处理
    cartethyia_glory_self: () => null, // 触发型：命中风蚀目标时自身暴击+10% / 气动+30%，运行时处理
    carlotta_skill_cond: () => null,  // 触发型：共鸣技能 → 冷凝+22.5%；解放 → 技能+18%×2 (运行时)
    phoebe_lightnoise_cond: () => null, // 触发型：添加光噪→暴击+20%；10层光噪命中 → 衍射+15% (运行时)
    brant_burst_cond: () => null,     // 触发型：解放 → 全队热熔+15% / 自身解放+20% (运行时)
    cantarella_void_cond: () => null, // 触发型：添加虚湮 → 攻击+20% / 解放+30% (运行时)
    brant_path_cond: () => null,      // 触发型：添加聚爆/震谐偏移 → 暴击+20% / 热熔+20% (运行时)
    brant_mottle_cond: () => null,    // 触发型：添加聚爆 → 热熔+10% + 延奏接力25% (运行时)
    feixue_snow_cond: () => null,     // 触发型：霜渐→落雪→爆发/接力 (运行时)
    lumera_chord_cond: () => null,    // 触发型：震谐/集谐偏移 → 全队谐度破坏+20点 (运行时)

    // ===== 2.6 九套：模拟器无护盾/声骸技能/谐度/偏谐值触发系统，
    //       沿用 elem_dmg_cond 的静态折半(×0.5)口径计入面板。
    //       能映射到面板字段的按满效果×0.5 给；纯声骸技能伤害/暴击、谐度点数无对应字段，诚实忽略。=====
    // 失序彼岸之梦：能量为0时 暴击+20% / 声骸技能伤害+35%（暴击折半入面板，声骸技能无字段忽略）
    lost_dream_cond: () => ({ type: 'crate', value: sb.value * 0.5, source: `声骸套装·${sb.name}(预估)` }),
    // 荣斗铸锋之冠：获盾时 攻击+6%/暴伤+4% 可叠5层（无护盾系统，按满5层×0.5 折半入面板）
    glory_forge_cond: () => [
      { type: 'atk_pct', value: sb.value * (sb.stacks || 5) * 0.5, source: `声骸套装·${sb.name}(预估)` },
      { type: 'cdmg', value: (sb.cdmg || 0) * (sb.stacks || 5) * 0.5, source: `声骸套装·${sb.name}(预估)` },
    ],
    // 息界同调之律：声骸技能时 重击+30% / 全队声骸技能+4%叠4层（重击折半入面板，声骸技能无字段忽略）
    sync_law_cond: () => ({ type: 'heavy_pct', value: sb.value * 0.5, source: `声骸套装·${sb.name}(预估)` }),
    // 焚羽猎魔之影：双效果时 热熔+16%（重击/声骸技能暴击无字段忽略，热熔折半入面板）
    hunt_shadow_cond: () => ({ type: 'elem_dmg', element: sb.elem, value: (sb.valueAlt || 0) * 0.5, source: `声骸套装·${sb.name}(预估)` }),
    // 逆光跃彩之约：延奏后下一变奏角色攻击+15%（接力型，不计入本人面板，类比 atk_next_flat）
    backlight_vow_cond: () => null,
    // 星构寻辉之环：治疗时按偏谐值全队攻击+，上限25%（无治疗/偏谐触发系统，忽略）
    star_ring_cond: () => null,
    // 流金溯真之式：普攻时衍射+10%叠3层（按满3层×0.5 折半入面板）
    gold_truth_cond: () => ({ type: 'elem_dmg', element: sb.elem, value: sb.value * (sb.stacks || 3) * 0.5, source: `声骸套装·${sb.name}(预估)` }),
    // 听唤语义之愿：声骸技能时 声骸技能暴击+20% / 自身气动+15%（暴击无字段忽略，气动折半入面板）
    echo_wish_cond: () => ({ type: 'elem_dmg', element: sb.elem, value: (sb.valueAlt || 0) * 0.5, source: `声骸套装·${sb.name}(预估)` }),
    // 碎梦亡鬼之魇(1件套)：骇破偏移时 普攻+35%/重击+35%（无骇破系统，折半入面板）
    ghost_nightmare_cond: () => [
      { type: 'normal_pct', value: sb.value * 0.5, source: `声骸套装·${sb.name}(预估)` },
      { type: 'heavy_pct', value: sb.value * 0.5, source: `声骸套装·${sb.name}(预估)` },
    ],
  };
  const fn = map[sb.type];
  return fn ? fn() : null;
}

function applyBonus(stats, b) {
  switch (b.type) {
    case 'atk':
    case 'atk_pct':       stats._atkPctSum += b.value; break;   // 累加,最后统一乘
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
    case 'atk_flat':     stats._atkFlatSum += b.value; break;   // 累加,最后统一加
    case 'hp_flat':       stats.hp += b.value; break;
    case 'def_flat':      stats.def += b.value; break;
    case 'resonance_efficiency':  stats.resonanceEfficiency = (stats.resonanceEfficiency || 0) + b.value; break;
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
