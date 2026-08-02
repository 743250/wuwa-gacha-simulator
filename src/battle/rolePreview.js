import { S } from '../state.js';
import { standard5, fourAll, weapons as characterWeapons } from '../data/chars.js';
import { computeBattleStats, calcBP } from './stats.js';
import { applyChainBonuses } from './chains.js';
import { initForte } from './forte.js';
import { fireCharacterHook, hasHeavyAttack } from './characters/index.js';

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

/**
 * 技能 tab 公式用角色上下文：与入战 unit 同口径的 typeBonus。
 * 存档角色没有 skillBonus 等字段；若不注入，makeSkillLines 链加成恒为 0。
 * 含 applyChainBonuses + battleStart 常驻加成（如长离 1 链技能/重击 +10%）。
 * 不含战斗中临时 buff（含苞/星域/焰羽等窗口）。
 */
export function getSkillHintRoleContext(n) {
  return withPreviewRole(n, () => {
    const s = computeBattleStats(n);
    const o = S.roles[n];
    if (!s || !o) {
      return { chain: o?.chain || 0, name: n };
    }
    const unit = {
      name: n,
      chain: s.chain,
      level: s.level,
      hp: s.hp,
      hpMax: s.hp,
      atk: s.atk,
      def: s.def,
      crate: s.crate,
      cdmg: s.cdmg,
      dodge: s.dodge || 0,
      energy: 0,
      energyMax: s.maxEnergy,
      element: s.element,
      type: s.type,
      cd: { skill: 0, heavy: 0 },
      buffs: [],
      elemBonus: { ...(s.elemBonus || {}) },
      elemAllBonus: s.elemAllBonus || 0,
      normalBonus: s.normalBonus || 0,
      skillBonus: s.skillBonus || 0,
      burstBonus: s.burstBonus || 0,
      heavyBonus: s.heavyBonus || 0,
      healBonus: s.healBonus || 0,
      pierceDef: s.defPierce || 0,
      skillCdReduce: s.skillCdReduce || 0,
      resonanceBonus: s.resonanceBonus || 0,
      alive: true,
      hasHeavy: hasHeavyAttack(n),
      _isPlayerUnit: true,
    };
    initForte(unit);
    applyChainBonuses(unit);
    fireCharacterHook(unit, 'battleStart', { battle: null });
    return unit;
  });
}
