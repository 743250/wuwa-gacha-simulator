// 逆境深塔（结构对齐官方 · 强度按模拟器定位）
//
// 分区定位：
//   - 稳定区：练手领奖 · 4 关一次性 · 800 星声（永久）
//   - 实验区：过渡练手 · 5 关一次性 · 1000 星声（永久，官方 8 关简化）
//   - 危险区：月常星声 · 三塔 12 关 · 28 天重置 · 满星 800
//
// 强度原则：
//   - 稳定/实验固定低 scale，不跟版本涨
//   - 危险区只抬生命（相对水温 × ABYSS_HP_ABS_ANCHOR），攻防不跟版本
//   - 塔/层相对档位保留；绝对锚把中一对齐官方 160→550 万
//
// 活力：每角色 10 点；第 N 层耗 N；失败不扣；满星约需 3 队
// 评星：★1 20 回合 / ★2 18 回合+均血70% / ★3 15 回合+均血70%
import { S, DAY } from '../state.js';
import { startEncounter, getCombatTeamNames } from '../battle/combat.js';
import { flattenEnemies, currentVersion } from '../battle/dungeon.js';
import { STAR_CRITERIA, getAbyssTemperatureForVersion, getAbyssEnvironment, ABYSS_HP_ABS_ANCHOR } from '../battle/balance.js';

// 稳定区 4 关：满星合计 800 星声 → 4 × 200
const STABLE_FLOORS = [
  { id: 's1', zone: 'stable', name: '稳定区·第 1 关', enemies: ['火鬃狼×3','惊蛰猎手×1'],       baseReward: 200, oneShot: true },
  { id: 's2', zone: 'stable', name: '稳定区·第 2 关', enemies: ['幽翎火×2'],            baseReward: 200, oneShot: true },
  { id: 's3', zone: 'stable', name: '稳定区·第 3 关', enemies: ['飞廉之猩'],              baseReward: 200, oneShot: true },
  { id: 's4', zone: 'stable', name: '稳定区·第 4 关', enemies: ['聚械机偶'],              baseReward: 200, oneShot: true }
];

// 实验区 5 关：满星合计 1000 星声 → 5 × 200
const EXPERIMENT_FLOORS = [
  { id: 'e1', zone: 'experiment', name: '实验区·第 1 关', enemies: ['燎照之骑','聚械机偶'], baseReward: 200, oneShot: true },
  { id: 'e2', zone: 'experiment', name: '实验区·第 2 关', enemies: ['无冠者'],              baseReward: 200, oneShot: true },
  { id: 'e3', zone: 'experiment', name: '实验区·第 3 关', enemies: ['伤痕'],                baseReward: 200, oneShot: true },
  { id: 'e4', zone: 'experiment', name: '实验区·第 4 关', enemies: ['罗蕾莱','哀声鸷'],     baseReward: 200, oneShot: true },
  { id: 'e5', zone: 'experiment', name: '实验区·第 5 关', enemies: ['赫卡忒','鸣钟之龟'],   baseReward: 200, oneShot: true }
];

// ===== 危险区 · 三塔结构（官方对齐 · v2.6+ 每塔 4 层）=====
//
// 左塔 · 回音之塔 — 较易，适合副队/养成中队伍
// 右塔 · 残响之塔 — 中等，适合二队
// 中塔 · 深境之塔 — 最难关卡，需要最强主力队
//
// 满星合计 800 星声：
//   左塔 55×4=220 · 右塔 60×4=240 · 中塔 85×4=340 = 800

// towerScale：萌新可清左/右拿星声；中塔略高但仍远低于旧版高压
// scaleBias：补偿「基值过薄」的层（如 hl2 仅双小怪），避免层间倒挂
const HAZARD_LEFT = [
  { id: 'hl1', floor: 1, tower: 'left',  towerName: '回音之塔', zone: 'hazard', name: '回音之塔·第 1 层', enemies: ['火鬃狼×3'],               baseReward: 55, towerScale: 0.42 },
  { id: 'hl2', floor: 2, tower: 'left',  towerName: '回音之塔', zone: 'hazard', name: '回音之塔·第 2 层', enemies: ['幽翎火×2'],            baseReward: 55, towerScale: 0.42, scaleBias: 1.55 },
  { id: 'hl3', floor: 3, tower: 'left',  towerName: '回音之塔', zone: 'hazard', name: '回音之塔·第 3 层', enemies: ['惊蛰猎手×2','火鬃狼×2'],        baseReward: 55, towerScale: 0.42 },
  { id: 'hl4', floor: 4, tower: 'left',  towerName: '回音之塔', zone: 'hazard', name: '回音之塔·第 4 层', enemies: ['海之女'],                baseReward: 55, towerScale: 0.42 }
];

const HAZARD_RIGHT = [
  { id: 'hr1', floor: 1, tower: 'right', towerName: '残响之塔', zone: 'hazard', name: '残响之塔·第 1 层', enemies: ['幻象×1','火鬃狼×2'],        baseReward: 60, towerScale: 0.55, scaleBias: 1.25 },
  { id: 'hr2', floor: 2, tower: 'right', towerName: '残响之塔', zone: 'hazard', name: '残响之塔·第 2 层', enemies: ['云闪之鳞'],              baseReward: 60, towerScale: 0.55 },
  { id: 'hr3', floor: 3, tower: 'right', towerName: '残响之塔', zone: 'hazard', name: '残响之塔·第 3 层', enemies: ['荣耀狮像'],              baseReward: 60, towerScale: 0.55 },
  { id: 'hr4', floor: 4, tower: 'right', towerName: '残响之塔', zone: 'hazard', name: '残响之塔·第 4 层', enemies: ['梦魇亚当·重锤'],        baseReward: 60, towerScale: 0.55 }
];

const HAZARD_CENTER = [
  { id: 'hc1', floor: 1, tower: 'center', towerName: '深境之塔', zone: 'hazard', name: '深境之塔·第 1 层', enemies: ['燎照之骑'],              baseReward: 85, towerScale: 0.68 },
  { id: 'hc2', floor: 2, tower: 'center', towerName: '深境之塔', zone: 'hazard', name: '深境之塔·第 2 层', enemies: ['无常凶鹭','辉萤军势'],   baseReward: 85, towerScale: 0.68 },
  { id: 'hc3', floor: 3, tower: 'center', towerName: '深境之塔', zone: 'hazard', name: '深境之塔·第 3 层', enemies: ['无归的谬误','异构武装'], baseReward: 85, towerScale: 0.68 },
  { id: 'hc4', floor: 4, tower: 'center', towerName: '深境之塔', zone: 'hazard', name: '深境之塔·第 4 层', enemies: ['叹息古龙','赫卡忒'],     baseReward: 85, towerScale: 0.68 }
];

const HAZARD_FLOORS = [...HAZARD_LEFT, ...HAZARD_RIGHT, ...HAZARD_CENTER];

// 三塔元数据（UI 渲染用）
export const HAZARD_TOWERS = [
  { key: 'left',   name: '回音之塔', desc: '副队可清 · 星声 220', floors: HAZARD_LEFT,   color: 'var(--accent)' },
  { key: 'right',  name: '残响之塔', desc: '二队挑战 · 星声 240', floors: HAZARD_RIGHT,  color: '#69b8ff' },
  { key: 'center', name: '深境之塔', desc: '主力攻坚 · 星声 340', floors: HAZARD_CENTER, color: 'var(--gold)' }
];

// 注入评星条件，供 UI 显示
[...STABLE_FLOORS, ...EXPERIMENT_FLOORS, ...HAZARD_FLOORS].forEach(f => {
  f.turnLimit = STAR_CRITERIA.threeStar.turn;
  f.hpThreshold = STAR_CRITERIA.threeStar.hp;
  f.starCriteria = STAR_CRITERIA;
});

const ALL_FLOORS = [...STABLE_FLOORS, ...EXPERIMENT_FLOORS, ...HAZARD_FLOORS];

export const ABYSS_ZONES = {
  stable:     { name: '稳定区',  desc: '练手领奖 · 4 关一次性 · 满星 800 星声（永久）',   floors: STABLE_FLOORS,     oneShot: true  },
  experiment: { name: '实验区',  desc: '过渡练手 · 5 关一次性 · 满星 1000 星声（永久）', floors: EXPERIMENT_FLOORS, oneShot: true  },
  hazard:     { name: '危险区',  desc: '月常星声 · 三塔 12 关 · 28 天重置 · 满星 800', floors: HAZARD_FLOORS,     oneShot: false }
};

export const ABYSS_FLOORS = HAZARD_FLOORS;
export { STAR_CRITERIA };

// ===== 危险区周期：28 天（官方口径）=====
const ABYSS_EPOCH = Date.UTC(2024, 4, 27); // 2024-05-27 (Mon) 基准锚点
function abyssCycleKey(today) {
  const diff = today - ABYSS_EPOCH;
  const cycle = Math.floor(diff / (28 * DAY));
  return String(cycle);
}
export function getCurrentAbyssEnvironment(today = S.today) {
  return getAbyssEnvironment(abyssCycleKey(today));
}

// ===== 活力系统（Vigor）=====
export const VIGOR_MAX = 10;
export const VIGOR_PER_FLOOR = (floor) => floor; // 第 N 层消耗 N 点

export function getVigor(name) {
  if (!S.abyss?.vigor) return VIGOR_MAX;
  return S.abyss.vigor[name] ?? VIGOR_MAX;
}

export function getTeamVigor() {
  const names = getCombatTeamNames();
  if (names.length === 0) return [];
  return names.map(n => ({ name: n, vigor: getVigor(n) }));
}

// 检查当前编队能否挑战某层（活力够 + 不重复满星）
export function canChallengeFloor(info) {
  const names = getCombatTeamNames();
  if (names.length === 0) return { ok: false, reason: '编队为空' };
  const earned = S.abyss?.stars?.[info.id] || 0;
  if (info.oneShot && earned > 0) return { ok: false, reason: '已通关（一次性）' };
  if (!info.oneShot && earned >= 3) return { ok: false, reason: '已满星' };
  const cost = VIGOR_PER_FLOOR(info.floor || 1);
  const lowVigor = names.filter(n => getVigor(n) < cost);
  if (lowVigor.length > 0) {
    return { ok: false, reason: `${lowVigor.join('、')} 活力不足（需 ${cost}）` };
  }
  return { ok: true };
}

// 扣除活力（战斗胜利后调用）
export function consumeVigor(teamNames, floor) {
  if (!S.abyss) S.abyss = { stars: {}, lastReset: '', vigor: {} };
  if (!S.abyss.vigor) S.abyss.vigor = {};
  const cost = VIGOR_PER_FLOOR(floor);
  teamNames.forEach(n => {
    const cur = getVigor(n);
    S.abyss.vigor[n] = Math.max(0, cur - cost);
  });
}

export function resetAbyssIfNeeded(today) {
  if (!S.abyss) S.abyss = { stars: {}, lastReset: '', vigor: {} };
  if (!S.abyss.stars) S.abyss.stars = {};
  const key = abyssCycleKey(today);
  if (S.abyss.lastReset !== key) {
    // 清空危险区评星
    HAZARD_FLOORS.forEach(f => { delete S.abyss.stars[f.id]; });
    for (let i = 1; i <= 10; i++) delete S.abyss.stars[i]; // 旧存档残留
    // 重置活力
    S.abyss.vigor = {};
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

export function getAbyssTemperature(today = S.today) {
  const version = currentVersion(today);
  const picked = getAbyssTemperatureForVersion(version);
  return { version, ...picked };
}

// 稳定区：萌新教学领奖，按关递增（补偿 s2 基值偏薄）
const STABLE_ZONE_SCALE = {
  s1: 0.28, // ~11 万总血
  s2: 0.62, // ~13 万
  s3: 0.34, // ~27 万 BOSS
  s4: 0.40  // ~33 万 BOSS
};
// 实验区：过渡内容，整体轻压（仍高于稳定区）
const EXPERIMENT_ZONE_SCALE = {
  e1: 0.55, e2: 0.70, e3: 0.65, e4: 0.58, e5: 0.60
};

export function getAbyssFloorScale(info, today = S.today) {
  // 层基数：第 1 层 1.0，每层 +5%
  const floorBase = 1 + ((info.floor || 1) - 1) * 0.05;
  // 塔倍率：左 0.42 / 右 0.55 / 中 0.68（见 HAZARD_*）
  const towerMult = info.towerScale || 1.0;
  const bias = info.scaleBias || 1.0;

  if (info.zone === 'stable') {
    const base = STABLE_ZONE_SCALE[info.id] ?? 0.32;
    return { hp: base, atk: base, def: base, base, temp: null };
  }
  if (info.zone === 'experiment') {
    const base = EXPERIMENT_ZONE_SCALE[info.id] ?? 0.60;
    return { hp: base, atk: base, def: base, base, temp: null };
  }

  // 危险区设计：
  //   - 攻/防不跟版本涨（避免越打越肉又越痛）
  //   - 只抬生命：相对水温 temp.hp × 绝对锚 ABYSS_HP_ABS_ANCHOR
  //     （锚把 encore×塔压 对齐官方中一 160→550 万，见 balance.js）
  //   - 塔/层相对档位保留：左 < 右 < 中；层间 +5%
  const temp = getAbyssTemperature(today);
  const core = floorBase * towerMult * bias;
  const hpScale = core * temp.hp * ABYSS_HP_ABS_ANCHOR;
  return {
    hp:  +hpScale.toFixed(3),
    atk: +core.toFixed(3),
    def: +core.toFixed(3),
    base: +core.toFixed(3),
    temp
  };
}

export function startAbyssFloor(idOrFloor) {
  let info;
  if (typeof idOrFloor === 'number') info = HAZARD_FLOORS[idOrFloor - 1];
  else info = findFloor(idOrFloor);
  if (!info) return null;

  // 检查是否已完成
  const earned = S.abyss?.stars?.[info.id] || 0;
  if ((info.oneShot && earned > 0) || (!info.oneShot && earned >= 3)) return null;

  // 检查活力（仅危险区）
  if (info.zone === 'hazard') {
    const check = canChallengeFloor(info);
    if (!check.ok) return null;
  }

  const names = getCombatTeamNames();
  if (names.length === 0) return null;
  const enemyNames = flattenEnemies(info.enemies);
  const scale = getAbyssFloorScale(info, S.today);
  const battle = startEncounter({ team: names, enemies: enemyNames, options: { enemyStatScale: scale } });
  if (battle) battle._abyssFloor = info.id;
  return battle;
}

// 评星：任意胜利至少 ★1（超时仍算通关，避免「赢了 0 星 → 0 星声 + 文案像已打过」）
// ★2/★3 仍要求回合与均血门槛
function evaluateAbyssStars(battle) {
  if (battle.result !== 'win') return 0;
  const alive = battle.team.filter(t => t.alive);
  const pool = alive.length ? alive : battle.team;
  const hpPct = pool.length
    ? pool.reduce((a, t) => a + (t.hpMax > 0 ? t.hp / t.hpMax : 0), 0) / pool.length
    : 0;
  const turn = battle.turn || 0;
  if (turn <= STAR_CRITERIA.threeStar.turn && hpPct >= STAR_CRITERIA.threeStar.hp) return 3;
  if (turn <= STAR_CRITERIA.twoStar.turn && hpPct >= STAR_CRITERIA.twoStar.hp) return 2;
  // 胜利即至少 1 星（含超过 oneStar.turn 的慢通）
  return 1;
}

function rewardForStars(info, stars) {
  if (stars <= 0) return 0;
  // 稳定/实验：首通一次发满额（不按星数打折）
  if (info.oneShot) return info.baseReward;
  return Math.round(info.baseReward * Math.min(stars, 3) / 3);
}

export function settleAbyss(battle) {
  const id = battle._abyssFloor;
  const info = typeof id === 'number' ? HAZARD_FLOORS[id - 1] : findFloor(id);
  if (!info || battle.result !== 'win') return 0;
  const newStars = evaluateAbyssStars(battle);
  S.abyss = S.abyss || { stars: {}, lastReset: '', vigor: {} };
  S.abyss.stars = S.abyss.stars || {};
  const prevStars = S.abyss.stars[info.id] || 0;

  // 0 星不应出现在胜利路径；若出现则不写档、不锁 oneShot，可重试
  if (newStars <= 0) {
    return { stars: 0, reward: 0, floor: info.id, name: info.name, noStar: true };
  }
  // oneShot 已领过 / 危险区未刷新星数
  if (newStars <= prevStars || (info.oneShot && prevStars > 0)) {
    return { stars: prevStars, reward: 0, floor: info.id, name: info.name, repeated: true };
  }

  S.abyss.stars[info.id] = Math.max(prevStars, newStars);
  if (info.zone === 'hazard') {
    consumeVigor(battle.team.map(t => t.name), info.floor || 1);
  }
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

/**
 * 一次性补偿：超时通关曾按 0 星结算 → 0 星声，或误显示已打过。
 * 每位存档只发一次 200 星声（稳定区一关首通额）。
 */
export function grantStableZoneMissedRewardOnce() {
  S.abyss = S.abyss || { stars: {}, lastReset: '', vigor: {} };
  if (S.abyss._stableMissComp200) return { ok: false, reason: 'already' };
  S.abyss._stableMissComp200 = true;
  S.astrite = (S.astrite || 0) + 200;
  return { ok: true, reward: 200 };
}

export function nextHazardResetDate(today) {
  const diff = today - ABYSS_EPOCH;
  const cycle = Math.floor(diff / (28 * DAY));
  return ABYSS_EPOCH + (cycle + 1) * 28 * DAY;
}

export function getAbyssVersionInfo(today = S.today) {
  return getAbyssTemperature(today);
}
