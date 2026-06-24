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
function consumeExp(amount) {
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

// 装备武器：如果该武器已装备给别人，先卸下；如果角色已有武器，也先卸下
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
