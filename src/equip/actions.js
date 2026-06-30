// 角色养成动作：升级、装备武器
import { S, msg } from '../state.js';
import { expToNext, weaponToNext, EXP_VALUES } from '../battle/stats.js';
import { isFiveStarWeapon, isFourStarWeapon, WEAPON_DATA, weaponType } from '../equip/weapons.js';
import { getMeta } from '../battle/template.js';
import { progressTask } from '../podcast/core.js';

// 玩家总持有经验值
export function totalExp() {
  const m = S.materials;
  return (m.exp_super || 0) * EXP_VALUES.exp_super
       + (m.exp_high || 0) * EXP_VALUES.exp_high
       + (m.exp_mid || 0) * EXP_VALUES.exp_mid
       + (m.exp_low || 0) * EXP_VALUES.exp_low;
}

// 消耗 amount 经验，优先用高档
export function consumeExp(amount) {
  const m = S.materials;
  let need = amount;
  // 先消耗特级
  const useSuper = Math.min(m.exp_super || 0, Math.ceil(need / EXP_VALUES.exp_super));
  let provided = useSuper * EXP_VALUES.exp_super;
  // 高级
  const useHigh = provided >= need ? 0 : Math.min(m.exp_high || 0, Math.ceil((need - provided) / EXP_VALUES.exp_high));
  provided += useHigh * EXP_VALUES.exp_high;
  // 中级
  const useMid = provided >= need ? 0 : Math.min(m.exp_mid || 0, Math.ceil((need - provided) / EXP_VALUES.exp_mid));
  provided += useMid * EXP_VALUES.exp_mid;
  // 初级
  const useLow = provided >= need ? 0 : Math.min(m.exp_low || 0, Math.ceil((need - provided) / EXP_VALUES.exp_low));
  provided += useLow * EXP_VALUES.exp_low;
  if (provided < need) return false;
  m.exp_super -= useSuper;
  m.exp_high -= useHigh;
  m.exp_mid -= useMid;
  m.exp_low -= useLow;
  return true;
}

// 升级角色一级
export function levelUpRole(roleName) {
  const o = S.roles[roleName];
  if (!o) return false;
  if (o.level >= 90) { msg('已满级'); return false; }
  const cost = expToNext(o);
  if (totalExp() < cost) {
    msg(`经验不足（需 ${cost.toLocaleString()}）`);
    return false;
  }
  consumeExp(cost);
  o.level++;
  progressTask('d_upgrade', 1);
  progressTask('w_levelup', 1);
  if (o.level >= 90) progressTask('p_char90', 1);
  return true;
}

// 一键升满（消耗到没材料为止）
export function levelUpRoleMax(roleName) {
  const o = S.roles[roleName];
  if (!o) return 0;
  let count = 0;
  while (o.level < 90) {
    const cost = expToNext(o);
    if (totalExp() < cost) break;
    consumeExp(cost);
    o.level++;
    count++;
  }
  if (count > 0) {
    progressTask('d_upgrade', 1);
    progressTask('w_levelup', count);
    if (o.level >= 90) progressTask('p_char90', 1);
  }
  return count;
}

// 升级武器
export function levelUpWeapon(weaponName) {
  const w = S.weapons[weaponName];
  if (!w) return false;
  if (w.level >= 90) { msg('已满级'); return false; }
  const cost = weaponToNext(w);
  if (S.materials.weapon_book < cost) {
    msg(`武器突破石不足（需 ${cost}）`);
    return false;
  }
  S.materials.weapon_book -= cost;
  w.level++;
  progressTask('d_upgrade', 1);
  if (w.level >= 90) progressTask('p_weapon90', 1);
  return true;
}

export function levelUpWeaponMax(weaponName) {
  const w = S.weapons[weaponName];
  if (!w) return 0;
  let count = 0;
  while (w.level < 90) {
    const cost = weaponToNext(w);
    if (S.materials.weapon_book < cost) break;
    S.materials.weapon_book -= cost;
    w.level++;
    count++;
  }
  if (count > 0) {
    progressTask('d_upgrade', 1);
    if (w.level >= 90) progressTask('p_weapon90', 1);
  }
  return count;
}

// 喂料升级：把另一把武器当作经验包，喂给目标武器
// 被喂武器按累计突破石的 60% 折成 weapon_book 入账（模拟器占位公式），目标武器随后逐级消耗升级
// 不装、自己不能喂自己；满级目标武器拒绝；被喂武器已装备/已精炼存在则拒绝
// 返回 { ok, err, target, feed, books_gained, levels_gained, final_level }
export function levelUpWeaponWithFeed(targetName, feedName) {
  const target = S.weapons[targetName];
  const feed = S.weapons[feedName];
  if (!target || !feed) return { ok: false, err: '武器不存在' };
  if (targetName === feedName) return { ok: false, err: '不能把武器喂给自己' };
  if (target.level >= 90) return { ok: false, err: '目标武器已满级' };
  if (feed.equippedBy) return { ok: false, err: '被喂武器已装备，无法作为材料' };
  if ((feed.spareRefine || 0) > 0) return { ok: false, err: '被喂武器含精炼次数，无法作为材料（请先精炼或拆解）' };

  // 累计突破石：sum(weaponToNext(w) for w in 1..feed.level)
  let cumulative = 0;
  for (let lv = 1; lv <= feed.level; lv++) {
    cumulative += Math.max(1, Math.floor((lv + 5) / 25));
  }
  const bookRefund = Math.max(1, Math.round(cumulative * 0.6));
  S.materials.weapon_book = (S.materials.weapon_book || 0) + bookRefund;
  delete S.weapons[feedName];

  let levelsGained = 0;
  while (target.level < 90) {
    const cost = weaponToNext(target);
    if (S.materials.weapon_book < cost) break;
    S.materials.weapon_book -= cost;
    target.level++;
    levelsGained++;
  }
  if (levelsGained > 0) {
    progressTask('d_upgrade', 1);
    if (target.level >= 90) progressTask('p_weapon90', 1);
  }
  return {
    ok: true,
    target: targetName,
    feed: feedName,
    books_gained: bookRefund,
    levels_gained: levelsGained,
    final_level: target.level
  };
}

export function previewWeaponFeed(targetName, feedName) {
  const target = S.weapons[targetName];
  const feed = S.weapons[feedName];
  if (!target || !feed) return { ok: false, err: '武器不存在' };
  if (targetName === feedName) return { ok: false, err: '不能把武器喂给自己' };
  if (target.level >= 90) return { ok: false, err: '目标武器已满级' };
  if (feed.equippedBy) return { ok: false, err: '被喂武器已装备，无法作为材料' };
  if ((feed.spareRefine || 0) > 0) return { ok: false, err: '被喂武器含精炼次数，无法作为材料' };

  let cumulative = 0;
  for (let lv = 1; lv <= feed.level; lv++) {
    cumulative += Math.max(1, Math.floor((lv + 5) / 25));
  }
  const bookRefund = Math.max(1, Math.round(cumulative * 0.6));
  // 估算能升几级
  let lvl = target.level;
  let books = bookRefund;
  let est = 0;
  while (lvl < 90) {
    const cost = Math.max(1, Math.floor((lvl + 5) / 25));
    if (books < cost) break;
    books -= cost;
    lvl++;
    est++;
  }
  return { ok: true, target: targetName, feed: feedName, books_gained: bookRefund, est_levels: est, final_level: lvl };
}

export function refineWeapon(weaponName, count = 1) {
  const w = S.weapons[weaponName];
  if (!w) return { ok: false, err: '没有这把武器' };
  const spare = w.spareRefine || 0;
  if (spare <= 0) return { ok: false, err: '暂无可精炼次数' };
  if ((w.refine || 1) >= 5) return { ok: false, err: '已满精炼' };
  const use = Math.min(count, spare, 5 - (w.refine || 1));
  w.spareRefine = spare - use;
  w.refine = (w.refine || 1) + use;
  return { ok: true, used: use, refine: w.refine, spare: w.spareRefine };
}

export function equipWeapon(roleName, weaponName) {
  const role = S.roles[roleName];
  const weapon = S.weapons[weaponName];
  if (!role || !weapon) return false;
  if (role.equipWeapon && S.weapons[role.equipWeapon]) {
    S.weapons[role.equipWeapon].equippedBy = null;
  }
  if (weapon.equippedBy && S.roles[weapon.equippedBy]) {
    S.roles[weapon.equippedBy].equipWeapon = null;
  }
  role.equipWeapon = weaponName;
  weapon.equippedBy = roleName;
  return true;
}

export function unequipWeapon(roleName) {
  const role = S.roles[roleName];
  if (!role || !role.equipWeapon) return false;
  const weapon = S.weapons[role.equipWeapon];
  if (weapon) weapon.equippedBy = null;
  role.equipWeapon = null;
  return true;
}

// 获取该角色可装备的武器列表（按武器类型过滤）
// 武器类型来自 weapons.js 的 type 字段（单一事实源）
export function getEquippableWeapons(roleName) {
  const meta = getMeta(roleName);
  const wantType = meta.weaponType;
  return Object.values(S.weapons).filter(w => {
    const data = WEAPON_DATA[w.n];
    if (!data) return false;
    if (!data.type) return true;     // 未标 type 的兜底放行
    return data.type === wantType;
  });
}
