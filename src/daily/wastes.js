// 冥歌海墟（Whimpering Wastes）
// 鸣潮 3.4 起永久玩法 · 不消耗结晶波片
//
// 官方口径：
//   - 每版本 2 个 cycle，每 cycle 最多 800 星声
//   - 每版本合计 1600 星声
//   - 双队伍轮换通关多组限时挑战
//
// 模拟器实现：
//   - 与版本（phases.js）同步：每次"版本切换"重置一次（一个版本算 2 cycle 太复杂，简化为 1 期/版本=800 星声）
//   - ⚠ 如想严格还原 1600/版本，可在版本中点再加一次 reset（P4 可选）
//   - 不消耗波片
//   - 单关结构：3 关（首关/中关/终关），每关满星合计 800 星声
import { S } from '../state.js';
import { createBattle, getCombatTeamNames } from '../battle/combat.js';
import { flattenEnemies } from '../battle/dungeon.js';
import { activePhase } from '../gacha/core.js';

const STAR_CRITERIA = {
  oneStar:   { turn: 20, hp: 0    },
  twoStar:   { turn: 18, hp: 0.70 },
  threeStar: { turn: 15, hp: 0.70 }
};

// 3 关 × 满星 + 全清额外 = 800 星声/期
const STAGES = [
  { id: 'w1', name: '冥歌海墟·首关', enemies: ['古老幽灵×2', '幻象×1'],         baseReward: 200, enemyScale: 1.5 },
  { id: 'w2', name: '冥歌海墟·中关', enemies: ['燎照之骑', '聚械机偶'],          baseReward: 250, enemyScale: 1.8 },
  { id: 'w3', name: '冥歌海墟·终关', enemies: ['赫卡忒', '无冠者'],              baseReward: 300, enemyScale: 2.2 }
];
// 三关满星合计：200+250+300 = 750；剩 50 由全清 bonus 补到 800
const FULL_CLEAR_BONUS = 50;

STAGES.forEach(s => {
  s.turnLimit = STAR_CRITERIA.threeStar.turn;
  s.hpThreshold = STAR_CRITERIA.threeStar.hp;
  s.starCriteria = STAR_CRITERIA;
});

export { STAGES as WASTES_STAGES, STAR_CRITERIA, FULL_CLEAR_BONUS };

function currentVersionKey() {
  const aps = activePhase();
  return (aps[0] && aps[0].v) || 'unknown';
}

export function resetWastesIfNeeded() {
  if (!S.wastes) S.wastes = { stars: {}, lastVersion: '', fullClearBonusTaken: false };
  const v = currentVersionKey();
  if (S.wastes.lastVersion !== v) {
    S.wastes.stars = {};
    S.wastes.lastVersion = v;
    S.wastes.fullClearBonusTaken = false;
  }
}

export function getWastesStars() {
  if (!S.wastes) return {};
  return S.wastes.stars || {};
}

export function startWastesStage(id) {
  const info = STAGES.find(s => s.id === id);
  if (!info) return null;
  const names = getCombatTeamNames();
  if (names.length === 0) return null;
  const enemyNames = flattenEnemies(info.enemies);
  const battle = createBattle(names, enemyNames, { enemyScale: info.enemyScale });
  if (battle) battle._wastesStage = id;
  return battle;
}

function evaluateStars(battle) {
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
  return Math.round(info.baseReward * Math.min(stars, 3) / 3);
}

export function settleWastes(battle) {
  const id = battle._wastesStage;
  const info = STAGES.find(s => s.id === id);
  if (!info || battle.result !== 'win') return null;
  const newStars = evaluateStars(battle);
  if (!S.wastes) S.wastes = { stars: {}, lastVersion: currentVersionKey(), fullClearBonusTaken: false };
  if (!S.wastes.stars) S.wastes.stars = {};
  const prev = S.wastes.stars[id] || 0;
  if (prev >= newStars) {
    return { stars: prev, reward: 0, name: info.name, repeated: true };
  }
  S.wastes.stars[id] = Math.max(prev, newStars);
  const reward = rewardForStars(info, newStars) - rewardForStars(info, prev);
  S.astrite += reward;
  // 满星额外材料
  if (newStars >= 3) {
    S.materials.exp_super = (S.materials.exp_super || 0) + 2;
    S.materials.weapon_book = (S.materials.weapon_book || 0) + 4;
  }
  // 全清 bonus（3 关全满星且未领过）
  let bonus = 0;
  if (!S.wastes.fullClearBonusTaken) {
    const allFull = STAGES.every(s => (S.wastes.stars[s.id] || 0) >= 3);
    if (allFull) {
      S.astrite += FULL_CLEAR_BONUS;
      S.wastes.fullClearBonusTaken = true;
      bonus = FULL_CLEAR_BONUS;
    }
  }
  return { stars: newStars, reward, name: info.name, bonus };
}
