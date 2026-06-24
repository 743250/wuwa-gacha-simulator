// 副本配置（鸣潮 3.4 校准）
//
// 命名对齐官方（核对源：用户提供的 3.4 口径，2026-06-24）：
//   - 模拟战训   (40 波片) — 共鸣经验（角色升级）
//   - 凝素领域   (40 波片) — 武器/技能材料
//   - 无音清剿   (60 波片) — 声骸、密音筒、调谐器
//   - 讨伐强敌   (60 波片) — 角色突破 BOSS 材料
//   - 战歌重奏   (60 波片) — 周本技能升级材料，周限 3 次（共享）
//
// 模拟器抽象（不照搬，保留创作者意图骨架）：
//   - 子系统（声骸/调谐器/密音筒/技能书）统一映射为 exp 系列 + 武器石 + 星声
//   - 单次副本回报 ≥ 玩家在战斗界面 5 分钟的成本，~升 1 级
//   - 80 波片档 = 双倍消耗 / 双倍产出（凝缩波片）
//
// import S 以便后续 helpers 使用
import { S } from '../state.js';

export const DUNGEONS = [
  // ===== 模拟战训（角色经验）=====
  {
    id: 'sim_exp_1', type: 'exp', name: '模拟战训·共鸣经验', cost: 40,
    enemies: ['幼狼×3', '飞兽×1'],
    drops: { exp_high: 6, exp_mid: 6 },                  // ~66k exp，初期 2-3 级
    minLevel: 1, desc: '高级×6 中级×6 · 40 波片'
  },
  {
    id: 'sim_exp_2', type: 'exp', name: '模拟战训·共鸣经验（凝缩）', cost: 80,
    enemies: ['燎照之骑'],
    drops: { exp_super: 4, exp_high: 6 },                // ~128k exp，~升 1 级
    minLevel: 40, enemyScale: 1.5, desc: '特级×4 高级×6 · 80 波片（凝缩）'
  },

  // ===== 凝素领域（武器/技能材料）=====
  {
    id: 'tacet_1', type: 'weapon', name: '凝素领域·武器养成', cost: 40,
    enemies: ['聚械机偶'],
    drops: { weapon_book: 24 },                          // 武器升 ~3 级
    minLevel: 20, enemyScale: 1.3, desc: '武器石×24 · 40 波片'
  },
  {
    id: 'tacet_2', type: 'weapon', name: '凝素领域·武器养成（凝缩）', cost: 80,
    enemies: ['赫卡忒'],
    drops: { weapon_book: 50 },
    minLevel: 40, enemyScale: 1.8, desc: '武器石×50 · 80 波片（凝缩）'
  },

  // ===== 无音清剿（声骸，60 波片）=====
  // 模拟器抽象：声骸 → 星声 + 武器石 + 高级促剂
  // 注：星声产出折半（v0.2 校准），避免主线副本越打越富
  {
    id: 'silent_1', type: 'echo', name: '无音清剿·常规', cost: 60,
    enemies: ['古老幽灵×2', '幻象×1'],
    drops: { astrite: 40, exp_high: 4, weapon_book: 10 },
    minLevel: 1, desc: '星声+40 · 高级×4 · 武器石×10 · 60 波片'
  },
  {
    id: 'silent_2', type: 'echo', name: '无音清剿·高阶', cost: 60,
    enemies: ['无妄者', '飞廉之猩'],
    drops: { astrite: 70, exp_super: 3, weapon_book: 14 },
    minLevel: 40, enemyScale: 1.6, desc: '星声+70 · 特级×3 · 武器石×14 · 60 波片'
  },

  // ===== 讨伐强敌（角色突破 BOSS，60 波片）=====
  {
    id: 'overlord_1', type: 'overlord', name: '讨伐强敌·飞廉之猩', cost: 60,
    enemies: ['飞廉之猩'],
    drops: { exp_super: 3, exp_high: 4, weapon_book: 6 },
    minLevel: 30, enemyScale: 1.6, desc: '特级×3 高级×4 武器石×6 · 60 波片'
  },
  {
    id: 'overlord_2', type: 'overlord', name: '讨伐强敌·鸣钟之龟', cost: 60,
    enemies: ['鸣钟之龟'],
    drops: { exp_super: 3, exp_high: 4, weapon_book: 6 },
    minLevel: 30, enemyScale: 1.6, desc: '特级×3 高级×4 武器石×6 · 60 波片'
  },
  {
    id: 'overlord_3', type: 'overlord', name: '讨伐强敌·罗蕾莱', cost: 60,
    enemies: ['罗蕾莱'],
    drops: { exp_super: 4, exp_high: 4, weapon_book: 8 },
    minLevel: 50, enemyScale: 2.0, desc: '特级×4 高级×4 武器石×8 · 60 波片'
  }
];

// 战歌重奏（周本技能升级材料，60 波片，周限 3 次共享）
// 模拟器抽象：技能升级材料 → 高级促剂 + 武器石 + 星声
export const WEEKLY_BOSS = [
  {
    id: 'boss_loulou', type: 'weekly', name: '战歌重奏·罗蕾莱', cost: 60, weeklyLimit: true,
    enemies: ['罗蕾莱'],
    drops: { exp_high: 8, weapon_book: 14, astrite: 80 },
    minLevel: 40, enemyScale: 2.5, desc: '高级×8 武器石×14 星声+80 · 周限 3 次（共享）'
  },
  {
    id: 'boss_imperator', type: 'weekly', name: '战歌重奏·无冠者', cost: 60, weeklyLimit: true,
    enemies: ['无冠者'],
    drops: { exp_high: 8, weapon_book: 14, astrite: 80 },
    minLevel: 40, enemyScale: 2.5, desc: '高级×8 武器石×14 星声+80 · 周限 3 次（共享）'
  },
  {
    id: 'boss_hecate', type: 'weekly', name: '战歌重奏·赫卡忒', cost: 60, weeklyLimit: true,
    enemies: ['赫卡忒'],
    drops: { exp_super: 4, exp_high: 6, weapon_book: 16, astrite: 100 },
    minLevel: 60, enemyScale: 2.8, desc: '特级×4 高级×6 武器石×16 星声+100 · 周限 3 次（共享）'
  }
];

// 解析敌人字符串 "幼狼×3" → { name, count }
export function parseEnemyStr(str) {
  const m = str.match(/^(.+?)(?:×(\d+))?$/);
  if (!m) return { name: str, count: 1 };
  return { name: m[1], count: parseInt(m[2] || '1') };
}

export function flattenEnemies(enemyStrs) {
  const result = [];
  enemyStrs.forEach(s => {
    const parsed = parseEnemyStr(s);
    for (let i = 0; i < parsed.count; i++) result.push(parsed.name);
  });
  return result;
}

// ===== 周本周限 3 次（共享计数）=====
export const WEEKLY_BOSS_LIMIT = 3;

export function getWeeklyBossUsed() {
  return (S.weeklyBoss && S.weeklyBoss.used && S.weeklyBoss.used.shared) || 0;
}
export function canUseWeeklyBoss() {
  return getWeeklyBossUsed() < WEEKLY_BOSS_LIMIT;
}
export function consumeWeeklyBoss() {
  if (!S.weeklyBoss) S.weeklyBoss = { used: {}, lastReset: '' };
  if (!S.weeklyBoss.used) S.weeklyBoss.used = {};
  S.weeklyBoss.used.shared = (S.weeklyBoss.used.shared || 0) + 1;
}
export function resetWeeklyBossIfNeeded(today) {
  if (!S.weeklyBoss) S.weeklyBoss = { used: {}, lastReset: '' };
  const d = new Date(today);
  const dayOfWeek = d.getUTCDay();
  const daysFromMon = (dayOfWeek + 6) % 7;
  const mondayMs = d.getTime() - daysFromMon * 86400000;
  const mondayKey = new Date(mondayMs).toISOString().slice(0, 10);
  if (S.weeklyBoss.lastReset !== mondayKey) {
    S.weeklyBoss.used = {};
    S.weeklyBoss.lastReset = mondayKey;
  }
}
