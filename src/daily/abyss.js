// 逆境深塔系统（按官方对齐 · 3.4 校准）
//
// 3 区结构（按用户给的官方口径）：
//   - 稳定区：一次性奖励，4 关合计 800 星声
//   - 实验区：一次性奖励，5 关合计 1000 星声
//   - 危险区：双周重置，10 层满星 800 星声（核心循环）
// （旧版"超载区"已删除，与官方不符）
//
// 评星条件（用户需求 · 全层统一）：
//   ★1：20 回合内通关
//   ★2：18 回合内 + 队伍均血 ≥ 70%
//   ★3：15 回合内 + 队伍均血 ≥ 70%
import { S, DAY } from '../state.js';
import { createBattle, getCombatTeamNames } from '../battle/combat.js';
import { flattenEnemies, currentVersion } from '../battle/dungeon.js';

const STAR_CRITERIA = {
  oneStar:   { turn: 20, hp: 0    },
  twoStar:   { turn: 18, hp: 0.70 },
  threeStar: { turn: 15, hp: 0.70 }
};

// 稳定区 4 关：满星合计 800 星声 → 4 × 200
const STABLE_FLOORS = [
  { id: 's1', zone: 'stable', name: '稳定区·第 1 关', enemies: ['幼狼×3','飞兽×1'],       baseReward: 200, oneShot: true },
  { id: 's2', zone: 'stable', name: '稳定区·第 2 关', enemies: ['古老幽灵×2'],            baseReward: 200, oneShot: true },
  { id: 's3', zone: 'stable', name: '稳定区·第 3 关', enemies: ['飞廉之猩'],              baseReward: 200, oneShot: true },
  { id: 's4', zone: 'stable', name: '稳定区·第 4 关', enemies: ['鸣钟之龟'],              baseReward: 200, oneShot: true }
];

// 实验区 5 关：满星合计 1000 星声 → 5 × 200
const EXPERIMENT_FLOORS = [
  { id: 'e1', zone: 'experiment', name: '实验区·第 1 关', enemies: ['燎照之骑','聚械机偶'], baseReward: 200, oneShot: true },
  { id: 'e2', zone: 'experiment', name: '实验区·第 2 关', enemies: ['无冠者'],              baseReward: 200, oneShot: true },
  { id: 'e3', zone: 'experiment', name: '实验区·第 3 关', enemies: ['罗蕾莱'],              baseReward: 200, oneShot: true },
  { id: 'e4', zone: 'experiment', name: '实验区·第 4 关', enemies: ['无妄者','飞廉之猩'],   baseReward: 200, oneShot: true },
  { id: 'e5', zone: 'experiment', name: '实验区·第 5 关', enemies: ['赫卡忒','燎照之骑'],   baseReward: 200, oneShot: true }
];

// 危险区 10 层（双周重置）：满星合计 800 星声 → 10 × 80
const HAZARD_FLOORS = [
  { id: 'h1',  floor: 1,  zone: 'hazard', name: '危险区·第 1 层',  enemies: ['幼狼×3', '飞兽×1'],     baseReward: 80 },
  { id: 'h2',  floor: 2,  zone: 'hazard', name: '危险区·第 2 层',  enemies: ['古老幽灵×2'],          baseReward: 80 },
  { id: 'h3',  floor: 3,  zone: 'hazard', name: '危险区·第 3 层',  enemies: ['飞廉之猩'],            baseReward: 80 },
  { id: 'h4',  floor: 4,  zone: 'hazard', name: '危险区·第 4 层',  enemies: ['鸣钟之龟'],            baseReward: 80 },
  { id: 'h5',  floor: 5,  zone: 'hazard', name: '危险区·第 5 层',  enemies: ['燎照之骑', '聚械机偶'], baseReward: 80 },
  { id: 'h6',  floor: 6,  zone: 'hazard', name: '危险区·第 6 层',  enemies: ['无冠者'],              baseReward: 80 },
  { id: 'h7',  floor: 7,  zone: 'hazard', name: '危险区·第 7 层',  enemies: ['罗蕾莱'],              baseReward: 80 },
  { id: 'h8',  floor: 8,  zone: 'hazard', name: '危险区·第 8 层',  enemies: ['无妄者', '飞廉之猩'],  baseReward: 80 },
  { id: 'h9',  floor: 9,  zone: 'hazard', name: '危险区·第 9 层',  enemies: ['赫卡忒', '燎照之骑'],  baseReward: 80 },
  { id: 'h10', floor: 10, zone: 'hazard', name: '危险区·第 10 层', enemies: ['赫卡忒', '无冠者'],   baseReward: 80 }
];

// 深塔"水温"：模拟版本推进后危险区血量、抗压和定向环境逐步抬高。
// 参考口径：官方 2.6 后深境区增加第 3/4 层，社区长期用"水温"描述深塔血量与配队压力上涨。
// 这里不把普通副本拉到同一强度，只让危险区承担星声压力。
const ABYSS_TEMPERATURE_TABLE = [
  { v: '1.0', hp: 1.00, atk: 1.00, def: 1.00, label: '开服基准' },
  { v: '1.1', hp: 1.08, atk: 1.03, def: 1.02, label: '初次升温' },
  { v: '1.2', hp: 1.16, atk: 1.06, def: 1.04, label: '练度筛选' },
  { v: '1.3', hp: 1.25, atk: 1.09, def: 1.06, label: '环境定向' },
  { v: '1.4', hp: 1.34, atk: 1.12, def: 1.08, label: '一代末期' },
  { v: '2.0', hp: 1.50, atk: 1.18, def: 1.12, label: '大版本跃迁' },
  { v: '2.1', hp: 1.62, atk: 1.22, def: 1.14, label: '新体系抬压' },
  { v: '2.2', hp: 1.75, atk: 1.26, def: 1.16, label: '双队压力' },
  { v: '2.3', hp: 1.90, atk: 1.30, def: 1.18, label: '中塔升温' },
  { v: '2.4', hp: 2.06, atk: 1.34, def: 1.20, label: '输出门槛' },
  { v: '2.5', hp: 2.23, atk: 1.38, def: 1.22, label: '末期膨胀' },
  { v: '2.6', hp: 2.45, atk: 1.44, def: 1.25, label: '深境扩层' },
  { v: '2.7', hp: 2.63, atk: 1.49, def: 1.28, label: '高层加压' },
  { v: '2.8', hp: 2.82, atk: 1.54, def: 1.31, label: '二代末期' },
  { v: '3.0', hp: 3.10, atk: 1.62, def: 1.36, label: '三代跃迁' },
  { v: '3.1', hp: 3.32, atk: 1.68, def: 1.39, label: '环境筛卡' },
  { v: '3.2', hp: 3.55, atk: 1.74, def: 1.42, label: '高压轮替' },
  { v: '3.3', hp: 3.80, atk: 1.80, def: 1.45, label: '末端追赶' },
  { v: '3.4', hp: 4.05, atk: 1.86, def: 1.48, label: '当前高水温' }
];

// 注入评星条件，供 UI 显示
[...STABLE_FLOORS, ...EXPERIMENT_FLOORS, ...HAZARD_FLOORS].forEach(f => {
  f.turnLimit = STAR_CRITERIA.threeStar.turn;
  f.hpThreshold = STAR_CRITERIA.threeStar.hp;
  f.starCriteria = STAR_CRITERIA;
});

const ALL_FLOORS = [...STABLE_FLOORS, ...EXPERIMENT_FLOORS, ...HAZARD_FLOORS];

export const ABYSS_ZONES = {
  stable:     { name: '稳定区',  desc: '一次性 4 关 · 满星合计 800 星声（永久保留）',   floors: STABLE_FLOORS,     oneShot: true  },
  experiment: { name: '实验区',  desc: '一次性 5 关 · 满星合计 1000 星声（永久保留）',  floors: EXPERIMENT_FLOORS, oneShot: true  },
  hazard:     { name: '危险区',  desc: '双周重置 · 10 层满星 800 星声（核心循环）',     floors: HAZARD_FLOORS,     oneShot: false }
};

export const ABYSS_FLOORS = HAZARD_FLOORS;
export { STAR_CRITERIA };

// 危险区"双周锚点"：以 2024-05-27 (Mon) 为基准
const ABYSS_EPOCH = Date.UTC(2024, 4, 27);
function abyssCycleKey(today) {
  const diff = today - ABYSS_EPOCH;
  const cycle = Math.floor(diff / (14 * DAY));
  return String(cycle);
}

export function resetAbyssIfNeeded(today) {
  if (!S.abyss) S.abyss = { stars: {}, lastReset: '' };
  if (!S.abyss.stars) S.abyss.stars = {};
  const key = abyssCycleKey(today);
  if (S.abyss.lastReset !== key) {
    HAZARD_FLOORS.forEach(f => { delete S.abyss.stars[f.id]; });
    for (let i = 1; i <= 10; i++) delete S.abyss.stars[i]; // 旧存档残留
    S.abyss.lastReset = key;
  }
}

export function getAbyssStars() {
  return S.abyss?.stars || {};
}

export function getHazardProgress() {
  const stars = getAbyssStars();
  let max = 0;
  for (let i = 0; i < HAZARD_FLOORS.length; i++) {
    if ((stars[HAZARD_FLOORS[i].id] || 0) > 0) max = i + 1;
  }
  return Math.min(max + 1, HAZARD_FLOORS.length);
}
export function getAbyssProgress() { return getHazardProgress(); }

function findFloor(id) {
  return ALL_FLOORS.find(f => f.id === id);
}

function parseVersion(v) {
  const [majorRaw, minorRaw] = String(v).split('.');
  return { major: Number(majorRaw) || 1, minor: Number(minorRaw) || 0 };
}

function versionOrder(v) {
  const x = parseVersion(v);
  return x.major * 100 + x.minor;
}

export function getAbyssTemperature(today = S.today) {
  const version = currentVersion(today);
  const key = versionOrder(version);
  const picked = ABYSS_TEMPERATURE_TABLE
    .slice()
    .reverse()
    .find(x => versionOrder(x.v) <= key) || ABYSS_TEMPERATURE_TABLE[0];
  return { version, ...picked };
}

export function getAbyssFloorScale(info, today = S.today) {
  const base = info.zone === 'hazard' ? 1 + info.floor * 0.15
    : info.zone === 'experiment' ? 1.6 : 1.2;
  if (info.zone !== 'hazard') {
    return { hp: base, atk: base, def: base, base, temp: null, topPressure: 1 };
  }
  const temp = getAbyssTemperature(today);
  const topPressure = info.floor >= 9 ? 1.18 : info.floor >= 7 ? 1.10 : info.floor >= 5 ? 1.04 : 1;
  return {
    hp: +(base * temp.hp * topPressure).toFixed(3),
    atk: +(base * temp.atk * (1 + (topPressure - 1) * 0.45)).toFixed(3),
    def: +(base * temp.def * (1 + (topPressure - 1) * 0.35)).toFixed(3),
    base,
    temp,
    topPressure
  };
}

export function startAbyssFloor(idOrFloor) {
  let info;
  if (typeof idOrFloor === 'number') info = HAZARD_FLOORS[idOrFloor - 1];
  else info = findFloor(idOrFloor);
  if (!info) return null;
  const earned = S.abyss?.stars?.[info.id] || 0;
  if ((info.oneShot && earned > 0) || (!info.oneShot && earned >= 3)) return null;
  const names = getCombatTeamNames();
  if (names.length === 0) return null;
  const enemyNames = flattenEnemies(info.enemies);
  const scale = getAbyssFloorScale(info, S.today);
  const battle = createBattle(names, enemyNames, { enemyStatScale: scale });
  if (battle) battle._abyssFloor = info.id;
  return battle;
}

function evaluateAbyssStars(battle) {
  if (battle.result !== 'win') return 0;
  const hpPct = battle.team.reduce((a, t) => a + t.hp / t.hpMax, 0) / battle.team.length;
  const turn = battle.turn;
  if (turn <= STAR_CRITERIA.threeStar.turn && hpPct >= STAR_CRITERIA.threeStar.hp) return 3;
  if (turn <= STAR_CRITERIA.twoStar.turn   && hpPct >= STAR_CRITERIA.twoStar.hp)   return 2;
  if (turn <= STAR_CRITERIA.oneStar.turn) return 1;
  return 0;
}

function rewardForStars(info, stars) {
  if (stars <= 0) return 0;
  if (info.oneShot) return info.baseReward;
  return Math.round(info.baseReward * Math.min(stars, 3) / 3);
}

export function settleAbyss(battle) {
  const id = battle._abyssFloor;
  const info = typeof id === 'number' ? HAZARD_FLOORS[id - 1] : findFloor(id);
  if (!info || battle.result !== 'win') return 0;
  const newStars = evaluateAbyssStars(battle);
  S.abyss = S.abyss || { stars: {}, lastReset: '' };
  S.abyss.stars = S.abyss.stars || {};
  const prevStars = S.abyss.stars[info.id] || 0;
  if (newStars <= prevStars || (info.oneShot && prevStars > 0)) {
    return { stars: prevStars, reward: 0, floor: info.id, name: info.name, repeated: true };
  }
  S.abyss.stars[info.id] = Math.max(prevStars, newStars);
  // 只发本次新增评星对应的差额，避免同层重复结算刷资源。
  const reward = rewardForStars(info, newStars) - rewardForStars(info, prevStars);
  S.astrite += reward;
  if (newStars >= 3 && prevStars < 3) {
    S.materials.exp_super = (S.materials.exp_super || 0) + 2;
    S.materials.weapon_book = (S.materials.weapon_book || 0) + 4;
  } else if (newStars >= 2 && prevStars < 2) {
    S.materials.exp_high = (S.materials.exp_high || 0) + 3;
    S.materials.weapon_book = (S.materials.weapon_book || 0) + 2;
  }
  return { stars: newStars, reward, floor: info.id, name: info.name };
}

export function nextHazardResetDate(today) {
  const diff = today - ABYSS_EPOCH;
  const cycle = Math.floor(diff / (14 * DAY));
  return ABYSS_EPOCH + (cycle + 1) * 14 * DAY;
}

export function getAbyssVersionInfo(today = S.today) {
  return getAbyssTemperature(today);
}
