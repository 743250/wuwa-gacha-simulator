import { S } from '../../state.js';
import { standard5, fourAll, weapons as characterWeapons } from '../../data/chars.js';
import { computeBattleStats, calcBP } from '../../battle/stats.js';

function roleRarity(n) {
  return standard5.includes(n) || Object.prototype.hasOwnProperty.call(characterWeapons, n) ? 5 : (fourAll.includes(n) ? 4 : 5);
}

export function makePreviewRole(n) {
  return {
    n,
    r: roleRarity(n),
    owned: 0,
    chain: 0,
    spare: 0,
    bought: 0,
    pulled: 0,
    level: 90,
    exp: 0,
    equipWeapon: null,
    skillLevels: { 普攻: 1, 技能: 1, 解放: 1, 回路: 1 },
    preview: true
  };
}

export function getRoleForModal(n) {
  return S.roles[n] || makePreviewRole(n);
}

function withPreviewRole(n, fn) {
  if (S.roles[n]) return fn();
  S.roles[n] = makePreviewRole(n);
  try { return fn(); }
  finally { delete S.roles[n]; }
}

export function computeRoleStatsForModal(n) {
  return withPreviewRole(n, () => computeBattleStats(n));
}

export function calcRoleBPForModal(n) {
  return withPreviewRole(n, () => calcBP(n));
}
