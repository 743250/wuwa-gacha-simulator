// 逆境深塔系统（按官方对齐 · 3.4 校准 · 2026-06 重构）
//
// 官方 3 区结构：
//   - 稳定区：一次性奖励，1 塔 4 关合计 800 星声（送免费渊武）
//   - 实验区：一次性奖励，2 塔各 4 关合计 1000 星声
//   - 危险区：28 天重置，3 塔各 4 关 = 12 关满星 800 星声（核心循环）
//
// 活力系统（Vigor · 模拟器抽象）：
//   - 每个角色 10 点活力，跨塔共享
//   - 第 N 层消耗 N 点活力（1→2→3→4）
//   - 单塔通刷消耗 10 点/角色 → 刚好耗尽一队
//   - 满星 3 塔需要 3 支不同队伍（≈9 名角色）→ 逼氪多队养成
//   - 失败不扣活力（可无限重试）
//   - 活力随危险区重置恢复
//
// 评星条件（全层统一）：
//   ★1：20 回合内通关
//   ★2：18 回合内 + 队伍均血 ≥ 70%
//   ★3：15 回合内 + 队伍均血 ≥ 70%
import { S, DAY } from '../state.js';
import { startEncounter, getCombatTeamNames } from '../battle/combat.js';
import { flattenEnemies, currentVersion } from '../battle/dungeon.js';
import { STAR_CRITERIA, getAbyssTemperatureForVersion, getAbyssEnvironment } from '../battle/balance.js';

// 稳定区 4 关：满星合计 800 星声 → 4 × 200
const STABLE_FLOORS = [
  { id: 's1', zone: 'stable', name: '稳定区·第 1 关', enemies: ['幼狼×3','飞兽×1'],       baseReward: 200, oneShot: true },
  { id: 's2', zone: 'stable', name: '稳定区·第 2 关', enemies: ['古老幽灵×2'],            baseReward: 200, oneShot: true },
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

const HAZARD_LEFT = [
  { id: 'hl1', floor: 1, tower: 'left',  towerName: '回音之塔', zone: 'hazard', name: '回音之塔·第 1 层', enemies: ['幼狼×3'],               baseReward: 55, towerScale: 0.90 },
  { id: 'hl2', floor: 2, tower: 'left',  towerName: '回音之塔', zone: 'hazard', name: '回音之塔·第 2 层', enemies: ['古老幽灵×2'],            baseReward: 55, towerScale: 0.90 },
  { id: 'hl3', floor: 3, tower: 'left',  towerName: '回音之塔', zone: 'hazard', name: '回音之塔·第 3 层', enemies: ['飞兽×2','幼狼×2'],        baseReward: 55, towerScale: 0.90 },
  { id: 'hl4', floor: 4, tower: 'left',  towerName: '回音之塔', zone: 'hazard', name: '回音之塔·第 4 层', enemies: ['海之女'],                baseReward: 55, towerScale: 0.90 }
];

const HAZARD_RIGHT = [
  { id: 'hr1', floor: 1, tower: 'right', towerName: '残响之塔', zone: 'hazard', name: '残响之塔·第 1 层', enemies: ['幻象×1','幼狼×2'],        baseReward: 60, towerScale: 1.00 },
  { id: 'hr2', floor: 2, tower: 'right', towerName: '残响之塔', zone: 'hazard', name: '残响之塔·第 2 层', enemies: ['云闪之鳞'],              baseReward: 60, towerScale: 1.00 },
  { id: 'hr3', floor: 3, tower: 'right', towerName: '残响之塔', zone: 'hazard', name: '残响之塔·第 3 层', enemies: ['荣耀狮像'],              baseReward: 60, towerScale: 1.00 },
  { id: 'hr4', floor: 4, tower: 'right', towerName: '残响之塔', zone: 'hazard', name: '残响之塔·第 4 层', enemies: ['梦魇亚当·重锤'],        baseReward: 60, towerScale: 1.00 }
];

const HAZARD_CENTER = [
  { id: 'hc1', floor: 1, tower: 'center', towerName: '深境之塔', zone: 'hazard', name: '深境之塔·第 1 层', enemies: ['燎照之骑'],              baseReward: 85, towerScale: 1.15 },
  { id: 'hc2', floor: 2, tower: 'center', towerName: '深境之塔', zone: 'hazard', name: '深境之塔·第 2 层', enemies: ['无常凶鹭','辉萤军势'],   baseReward: 85, towerScale: 1.15 },
  { id: 'hc3', floor: 3, tower: 'center', towerName: '深境之塔', zone: 'hazard', name: '深境之塔·第 3 层', enemies: ['无归的谬误','异构武装'], baseReward: 85, towerScale: 1.15 },
  { id: 'hc4', floor: 4, tower: 'center', towerName: '深境之塔', zone: 'hazard', name: '深境之塔·第 4 层', enemies: ['叹息古龙','赫卡忒'],     baseReward: 85, towerScale: 1.15 }
];

const HAZARD_FLOORS = [...HAZARD_LEFT, ...HAZARD_RIGHT, ...HAZARD_CENTER];

// 三塔元数据（UI 渲染用）
export const HAZARD_TOWERS = [
  { key: 'left',   name: '回音之塔', desc: '较易 · 副队可通',         floors: HAZARD_LEFT,   color: 'var(--accent)' },
  { key: 'right',  name: '残响之塔', desc: '中等 · 二队挑战',         floors: HAZARD_RIGHT,  color: '#69b8ff' },
  { key: 'center', name: '深境之塔', desc: '最难关卡 · 主力队攻坚',   floors: HAZARD_CENTER, color: 'var(--gold)' }
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
  hazard:     { name: '危险区',  desc: '28 天重置 · 三塔 12 关满星 800 星声（核心循环）', floors: HAZARD_FLOORS,     oneShot: false }
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

export function getAbyssFloorScale(info, today = S.today) {
  // 层基数：第 1 层 1.0，每层 +8%（温和递增）
  const floorBase = 1 + ((info.floor || 1) - 1) * 0.08;
  // 塔倍率：左塔 0.85 / 右塔 1.0 / 中塔 1.2
  const towerMult = info.towerScale || 1.0;

  if (info.zone !== 'hazard') {
    const base = info.zone === 'experiment' ? 1.6 : 1.2;
    return { hp: base, atk: base, def: base, base, temp: null };
  }

  // 水温：唯一的版本膨胀因子，已包含官方各版本中一血量增长
  const temp = getAbyssTemperature(today);
  // 危险区 HP = 层基数 × 塔倍率 × 版本水温
  //   例：3.4 中塔 4 层 = 1.24 × 1.20 × 3.44 = 5.12×（官方 550/160≈3.44，中塔上层偏高合理）
  return {
    hp: +(floorBase * towerMult * temp.hp).toFixed(3),
    atk: +(floorBase * towerMult * temp.atk).toFixed(3),
    def: +(floorBase * towerMult * temp.def).toFixed(3),
    base: +(floorBase * towerMult).toFixed(3),
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
  S.abyss = S.abyss || { stars: {}, lastReset: '', vigor: {} };
  S.abyss.stars = S.abyss.stars || {};
  const prevStars = S.abyss.stars[info.id] || 0;
  if (newStars <= prevStars || (info.oneShot && prevStars > 0)) {
    return { stars: prevStars, reward: 0, floor: info.id, name: info.name, repeated: true };
  }
  S.abyss.stars[info.id] = Math.max(prevStars, newStars);
  // 扣活力（仅危险区，胜利后扣）
  if (info.zone === 'hazard') {
    consumeVigor(battle.team.map(t => t.name), info.floor || 1);
  }
  // 只发本次新增评星对应的差额
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
  const cycle = Math.floor(diff / (28 * DAY));
  return ABYSS_EPOCH + (cycle + 1) * 28 * DAY;
}

export function getAbyssVersionInfo(today = S.today) {
  return getAbyssTemperature(today);
}
