// 冥歌海墟（Whimpering Wastes）
// 鸣潮 v2.1 起永久玩法 · 不消耗结晶波片
//
// 官方口径：
//   - 12 层（1-6 一次性，7-12 周期性）
//   - 上半区 + 下半区双队轮换
//   - 信物系统（buff 选择）
//   - 焚潮状态（全场增伤 + 爆发窗口）
//   - 累计积分制（6400/8000/9600 分档位）
//   - 每版本 ~800 星声
//
// 模拟器实现（2026-06-25 重构）：
//   - 5 关渐进难度（简化自 12 层）
//   - 信物选择：每关开战前从 6 种信物中选 1 个
//   - 焚潮机制：每 3 回合触发一次焚潮，全场 +30% 伤害 2 回合
//   - 积分制：基础分 + 回合奖励 + 血量奖励
//   - 累计积分档位：4000/6000/8000 分 → 合计 800 星声
//   - 版本切换时重置

import { S } from '../state.js';
import { createBattle, getCombatTeamNames } from '../battle/combat.js';
import { flattenEnemies } from '../battle/dungeon.js';
import { activePhase } from '../gacha/core.js';
import { STAR_CRITERIA } from '../battle/balance.js';
import { msg } from '../state.js';

// ===== 信物系统（Tokens）=====
// 每关开战前从以下 6 种选 1 个；同一种可重复选（效果叠加）
export const WASTES_TOKENS = [
  { id: 'atk',       name: '强袭之印', icon: '⚔', desc: '全队攻击力 +25%',              effect: { atkMul: 1.25 } },
  { id: 'def',       name: '坚壁之印', icon: '🛡', desc: '全队 HP +30% · 防御 +20%',      effect: { hpMul: 1.30, defMul: 1.20 } },
  { id: 'ap',        name: '迅捷之印', icon: '⚡', desc: '每回合 +1 AP',                  effect: { apBonus: 1 } },
  { id: 'burn',      name: '焚潮之印', icon: '🔥', desc: '焚潮积蓄速度 +50%',             effect: { burnFaster: true } },
  { id: 'crit',      name: '会心之印', icon: '💥', desc: '暴击率 +15% · 暴击伤害 +20%',    effect: { crate: 0.15, cdmg: 0.20 } },
  { id: 'heal',      name: '愈合之印', icon: '💚', desc: '每回合结束恢复 8% HP',          effect: { healPerTurn: 0.08 } }
];

// ===== 关卡配置（5 关渐进）=====
const STAGES = [
  {
    id: 'w1', name: '冥歌海墟·浅滩', enemies: ['幼狼×3', '飞兽×1'],
    baseScore: 1000, enemyScale: 1.3,
    desc: '残象浅滩 · 入门积分'
  },
  {
    id: 'w2', name: '冥歌海墟·暗流', enemies: ['古老幽灵×2', '幻象×1'],
    baseScore: 1200, enemyScale: 1.5,
    desc: '幽影涌动 · 需要一定练度'
  },
  {
    id: 'w3', name: '冥歌海墟·漩涡', enemies: ['燎照之骑', '聚械机偶'],
    baseScore: 1500, enemyScale: 1.8,
    desc: '双强敌 · 检验队伍结构'
  },
  {
    id: 'w4', name: '冥歌海墟·深渊', enemies: ['无妄者', '飞廉之猩'],
    baseScore: 1800, enemyScale: 2.1,
    desc: '高层压制 · 主力队挑战'
  },
  {
    id: 'w5', name: '冥歌海墟·终渊', enemies: ['赫卡忒', '无冠者'],
    baseScore: 2200, enemyScale: 2.5,
    desc: '最强的敌人 · 冲击满分'
  }
];

// 积分档位（累计）
export const SCORE_TIERS = [
  { score: 4000, reward: 200, name: '青铜积分' },
  { score: 6000, reward: 250, name: '白银积分' },
  { score: 8000, reward: 350, name: '黄金积分' }
];
// 合计 200+250+350 = 800 星声

// 满分计算：1000+1200+1500+1800+2200 = 7700，加上回合/血量奖励可超 8000

STAGES.forEach(s => {
  s.turnLimit = STAR_CRITERIA.threeStar.turn;
  s.hpThreshold = STAR_CRITERIA.threeStar.hp;
  s.starCriteria = STAR_CRITERIA;
});

export { STAGES as WASTES_STAGES, STAR_CRITERIA };

function currentVersionKey() {
  const aps = activePhase();
  return (aps[0] && aps[0].v) || 'unknown';
}

export function resetWastesIfNeeded() {
  if (!S.wastes) S.wastes = { scores: {}, tokensPicked: {}, lastVersion: '', cumulativeScore: 0, tiersClaimed: [] };
  const v = currentVersionKey();
  if (S.wastes.lastVersion !== v) {
    S.wastes.scores = {};
    S.wastes.tokensPicked = {};
    S.wastes.lastVersion = v;
    S.wastes.cumulativeScore = 0;
    S.wastes.tiersClaimed = [];
  }
}

export function getWastesStars() {
  // 兼容旧存档：stars → scores 迁移
  if (!S.wastes) return {};
  if (S.wastes.stars && !S.wastes.scores) {
    S.wastes.scores = {};
    Object.entries(S.wastes.stars).forEach(([id, stars]) => {
      S.wastes.scores[id] = (stars || 0) * 500; // 粗略迁移
    });
    delete S.wastes.stars;
  }
  return S.wastes.scores || {};
}

// 当前已选 token（本轮有效）
export function getPickedTokens() {
  return S.wastes?.tokensPicked || {};
}

export function pickToken(stageId, tokenId) {
  if (!S.wastes) S.wastes = { scores: {}, tokensPicked: {}, lastVersion: currentVersionKey(), cumulativeScore: 0, tiersClaimed: [] };
  if (!S.wastes.tokensPicked) S.wastes.tokensPicked = {};
  if (!S.wastes.tokensPicked[stageId]) S.wastes.tokensPicked[stageId] = [];
  if (S.wastes.tokensPicked[stageId].includes(tokenId)) return false;
  S.wastes.tokensPicked[stageId].push(tokenId);
  return true;
}

export function startWastesStage(id) {
  const info = STAGES.find(s => s.id === id);
  if (!info) return null;
  const names = getCombatTeamNames();
  if (names.length === 0) return null;
  const enemyNames = flattenEnemies(info.enemies);

  // 收集该关已选 token 效果
  const tokens = (S.wastes?.tokensPicked?.[id] || []).map(tid => WASTES_TOKENS.find(t => t.id === tid)).filter(Boolean);
  const tokenEffects = {};
  tokens.forEach(t => {
    Object.entries(t.effect).forEach(([k, v]) => {
      if (k === 'burnFaster') tokenEffects.burnFaster = true;
      else if (k === 'apBonus') tokenEffects.apBonus = (tokenEffects.apBonus || 0) + v;
      else if (k === 'crate') tokenEffects.crate = (tokenEffects.crate || 0) + v;
      else if (k === 'cdmg') tokenEffects.cdmg = (tokenEffects.cdmg || 0) + v;
      else tokenEffects[k] = Math.max(tokenEffects[k] || 0, v); // atkMul/hpMul/defMul 取最大
    });
  });

  const battle = createBattle(names, enemyNames, {
    enemyScale: info.enemyScale,
    wastesTokens: tokenEffects  // 传给 combat.js 处理
  });
  if (battle) battle._wastesStage = id;
  return battle;
}

// 计分：基础分 + 回合奖励 + 血量奖励
function evaluateScore(battle) {
  if (battle.result !== 'win') return 0;
  const info = STAGES.find(s => s.id === battle._wastesStage);
  if (!info) return 0;

  const hpPct = battle.team.reduce((a, t) => a + t.hp / t.hpMax, 0) / battle.team.length;
  const turn = battle.turn;

  // 回合奖励：20 回合基准，每少用 1 回合 +50 分（最多 +500）
  const turnBonus = Math.max(0, Math.min(500, (STAR_CRITERIA.oneStar.turn - turn) * 50));

  // 血量奖励：HP% × 300（最多 +300）
  const hpBonus = Math.round(hpPct * 300);

  return info.baseScore + turnBonus + hpBonus;
}

export function settleWastes(battle) {
  const id = battle._wastesStage;
  const info = STAGES.find(s => s.id === id);
  if (!info || battle.result !== 'win') return null;

  const newScore = evaluateScore(battle);
  if (!S.wastes) S.wastes = { scores: {}, tokensPicked: {}, lastVersion: currentVersionKey(), cumulativeScore: 0, tiersClaimed: [] };
  if (!S.wastes.scores) S.wastes.scores = {};
  const prevScore = S.wastes.scores[id] || 0;

  if (newScore > prevScore) {
    S.wastes.scores[id] = newScore;
    // 重算累计积分
    S.wastes.cumulativeScore = Object.values(S.wastes.scores).reduce((a, b) => a + b, 0);
  }

  // 检查积分档位
  if (!S.wastes.tiersClaimed) S.wastes.tiersClaimed = [];
  let tierReward = 0;
  SCORE_TIERS.forEach(tier => {
    if (S.wastes.cumulativeScore >= tier.score && !S.wastes.tiersClaimed.includes(tier.score)) {
      S.wastes.tiersClaimed.push(tier.score);
      S.astrite += tier.reward;
      tierReward += tier.reward;
    }
  });

  return {
    score: newScore,
    prevScore,
    cumulative: S.wastes.cumulativeScore,
    tierReward,
    name: info.name,
    repeated: newScore <= prevScore
  };
}

// 获取本版本最高积分（UI 用）
export function getWastesMaxScore() {
  return S.wastes?.cumulativeScore || 0;
}

// 海墟下次重置日期（当前版本阶段结束日）
export function nextWastesResetDate() {
  const aps = activePhase();
  if (!aps.length) return null;
  return aps[0].end;
}

