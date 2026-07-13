// 角色 DoD 测试辅助（Phase D）：减少每角 quickBattle 样板重复
import { resetState, quickBattle, firstEnemy } from '../../helpers.js';

/** 已战斗验收 S 级（与 status.md / Phase C 清单对齐） */
export const ACCEPTED_S_ROLES = [
  '卡提希娅', '弗洛洛', '奥古斯塔', '千咲', '赞妮', '仇远', '尤诺',
  '夏空', '露帕', '嘉贝莉娜', '椿', '长离', '守岸人', '忌炎',
  '吟霖', '今汐', '折枝', '相里要', '珂莱塔', '洛可可', '菲比', '布兰特', '坎特蕾拉',
];

/**
 * 以指定角色为主力开一场 3 人战（填位安可/忌炎）。
 * @param {string} name
 * @param {{ chain?: number, level?: number, fillers?: string[] }} [opts]
 */
export function makeSoloTeam(name, opts = {}) {
  const chain = opts.chain ?? 0;
  const level = opts.level ?? 90;
  const fillers = opts.fillers || ['安可', '忌炎'].filter(n => n !== name);
  if (name === '安可' || name === '忌炎') {
    fillers.length = 0;
    fillers.push(name === '安可' ? '忌炎' : '安可', '守岸人');
  }
  const team = [name, ...fillers.filter(n => n !== name)].slice(0, 3);
  while (team.length < 3) team.push('守岸人');
  const roles = {};
  for (const n of team) {
    roles[n] = { level, chain: n === name ? chain : 0 };
  }
  resetState({ team, roles });
  const battle = quickBattle();
  const active = battle.team.findIndex(t => t.name === name);
  if (active >= 0) battle.active = active;
  return { battle, unit: battle.team.find(t => t.name === name), enemyIdx: firstEnemy(battle) };
}

/** 单位上常驻 typeBonus 快照（链应走状态机时 C0 应接近 0） */
export function permanentTypeBonuses(unit) {
  return {
    normalBonus: unit?.normalBonus || 0,
    skillBonus: unit?.skillBonus || 0,
    heavyBonus: unit?.heavyBonus || 0,
    burstBonus: unit?.burstBonus || 0,
    allDmg: unit?.allDmg || unit?.allDmgBonus || 0,
  };
}

/**
 * C0 不该有大额常驻 typeBonus（防 flat 双算基线）。
 * @param {object} unit
 * @param {number} [eps]
 */
export function expectNoFlatDoubleCount(unit, eps = 1e-6) {
  const b = permanentTypeBonuses(unit);
  for (const [k, v] of Object.entries(b)) {
    if (Math.abs(v) > eps) {
      throw new Error(`C0 flat typeBonus 嫌疑: ${k}=${v}`);
    }
  }
  return true;
}

export function forceEnergy(unit) {
  if (!unit) return;
  unit.energy = unit.energyMax || 125;
}

/** 强制 FORTE 当前值；满则 ready */
export function forceForte(unit, value) {
  if (!unit?.forte) return;
  const max = unit.forte.max || 100;
  unit.forte.current = Math.max(0, Math.min(max, value));
  unit.forte.ready = unit.forte.current >= max;
}

/** 强制 stacks 注册表层数 */
export function forceStack(unit, stackId, n) {
  if (!unit) return;
  if (!unit._stacks) unit._stacks = {};
  unit._stacks[stackId] = Math.max(0, n);
}

/**
 * skillHints customLines 冒烟：返回数组且至少一行含数字。
 * @param {object} entry SKILL_HINTS[name]
 * @param {number} chain
 */
export function skillHintsSmoke(entry, chain = 0) {
  if (!entry || typeof entry.customLines !== 'function') {
    return { ok: false, reason: 'missing customLines' };
  }
  const lines = entry.customLines({ atk: 1000, maxEnergy: 125, hp: 15000 }, { chain });
  if (!Array.isArray(lines) || lines.length < 1) {
    return { ok: false, reason: 'empty lines', lines };
  }
  const hasNum = lines.some(l => {
    if (!l) return false;
    if (typeof l === 'string') return /\d/.test(l);
    return (l.desc && /\d/.test(l.desc)) || (l.name && /\d/.test(String(l.name)));
  });
  if (!hasNum) return { ok: false, reason: 'no numbers in lines', lines };
  return { ok: true, lines };
}
