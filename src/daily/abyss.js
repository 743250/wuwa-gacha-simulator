// 逆境深塔系统（鸣潮真实名为「逆境深塔」Tower of Adversity）
// 数据校准（2026-06）：原"逆境深渊"是错误叫法；实际游戏结构为四区域 + 印记奖励
// 本模拟器采用简化的 10 层线性结构作为可玩抽象，仅作模拟体验，非官方数值
import { S } from '../state.js';
import { createBattle, evaluateStars } from '../battle/combat.js';
import { parseEnemyStr, flattenEnemies } from '../battle/dungeon.js';

const ABYSS_FLOORS = [
  { floor: 1, enemies: ['幼狼×3', '飞兽×1'],            turnLimit: 4, hpThreshold: 0.7, baseReward: 60 },
  { floor: 2, enemies: ['古老幽灵×2'],                   turnLimit: 4, hpThreshold: 0.7, baseReward: 60 },
  { floor: 3, enemies: ['飞廉之猩'],                     turnLimit: 3, hpThreshold: 0.6, baseReward: 80 },
  { floor: 4, enemies: ['鸣钟之龟'],                     turnLimit: 3, hpThreshold: 0.6, baseReward: 80 },
  { floor: 5, enemies: ['燎照之骑', '聚械机偶'],         turnLimit: 3, hpThreshold: 0.6, baseReward: 100 },
  { floor: 6, enemies: ['无冠者'],                        turnLimit: 3, hpThreshold: 0.6, baseReward: 100 },
  { floor: 7, enemies: ['罗蕾莱'],                        turnLimit: 2, hpThreshold: 0.5, baseReward: 150 },
  { floor: 8, enemies: ['无妄者', '飞廉之猩'],           turnLimit: 2, hpThreshold: 0.5, baseReward: 150 },
  { floor: 9, enemies: ['赫卡忒', '燎照之骑'],           turnLimit: 2, hpThreshold: 0.5, baseReward: 200 },
  { floor: 10,enemies: ['赫卡忒', '无冠者'],             turnLimit: 2, hpThreshold: 0.5, baseReward: 200 }
];

export { ABYSS_FLOORS };

// 获取当前已解锁的最大层数
export function getAbyssProgress() {
  const stars = S.abyss?.stars || {};
  let max = 0;
  for (let i = 1; i <= 10; i++) {
    if (stars[i] && stars[i] > 0) max = i;
  }
  return Math.min(max + 1, 10);
}

export function getAbyssStars() {
  return S.abyss?.stars || {};
}

// 进入该层战斗
export function startAbyssFloor(floor) {
  const info = ABYSS_FLOORS[floor - 1];
  if (!info) return null;
  const names = S.team.filter(Boolean);
  if (names.length === 0) return null;
  const enemyNames = flattenEnemies(info.enemies);
  const battle = createBattle(names, enemyNames, { enemyScale: 1 + floor * 0.15 });
  if (battle) battle._abyssFloor = floor;
  return battle;
}

// 结算奖励
export function settleAbyss(battle) {
  const floor = battle._abyssFloor;
  const info = ABYSS_FLOORS[floor - 1];
  if (!info || battle.result !== 'win') return 0;
  const stars = evaluateStars(battle, info.turnLimit, info.hpThreshold);
  S.abyss = S.abyss || { stars: {}, lastReset: '' };
  S.abyss.stars[floor] = Math.max(S.abyss.stars[floor] || 0, stars);
  const reward = info.baseReward + (stars >= 3 ? 40 : 0);
  S.astrite += reward;
  return { stars, reward, floor };
}
