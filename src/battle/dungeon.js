// 副本配置（鸣潮 3.4 校准）
//
// 命名对齐官方（核对源：用户提供的 3.4 口径，2026-06-24）：
//   - 模拟战训   (40 波片) — 共鸣经验（角色升级）
//   - 凝素领域   (40 波片) — 武器/技能材料
//   - 无音清剿   (60 波片) — 声骸养成（模拟器折算为共鸣促剂/武器石）
//   - 讨伐强敌   (60 波片) — 角色突破（模拟器折算为经验/武器石）
//   - 战歌重奏   (60 波片) — 高阶技能材料（模拟器折算为经验/武器石），周限 3 次（共享）
//
// 模拟器抽象（不照搬，保留创作者意图骨架）：
//   - 被模拟器去除的子系统（声骸/调谐器/密音筒/技能书/突破素材）统一折算为 exp 系列 + 武器石
//   - 单次副本回报 ≥ 玩家在战斗界面 5 分钟的成本，~升 1 级
//   - 80 波片档 = 双倍消耗 / 双倍产出（凝缩波片）
//
// import S 以便后续 helpers 使用
import { S } from '../state.js';
import { phases } from '../data/phases.js';

export const DUNGEONS = [
  // ===== 模拟战训（角色经验）=====
  {
    id: 'sim_exp_1', type: 'exp', name: '模拟战训·共鸣经验', cost: 40,
    enemies: ['幼狼×3', '飞兽×1'],
    encounterPool: [
      { enemies: ['幼狼×3', '飞兽×1'], enemyScale: 1.0, weight: 4, tag: '残象群' },
      { enemies: ['古老幽灵×2'], enemyScale: 1.1, weight: 3, tag: '幽影残响' },
      { enemies: ['聚械机偶'], enemyScale: 1.15, weight: 2, tag: '机械训练靶' },
      { enemies: ['辉萤军势'], enemyScale: 0.9, weight: 1, tag: '冷凝精英' }
    ],
    drops: { exp_high: 5, exp_mid: 5 },                  // 55k exp，基础经验本
    minLevel: 1, desc: '高级×5 中级×5 · 40 波片'
  },
  {
    id: 'sim_exp_2', type: 'exp', name: '模拟战训·共鸣经验（凝缩）', cost: 80,
    enemies: ['燎照之骑'],
    encounterPool: [
      { enemies: ['燎照之骑'], enemyScale: 1.5, weight: 3, tag: '热熔骑士' },
      { enemies: ['飞廉之猩'], enemyScale: 1.6, weight: 3, tag: '气动强敌' },
      { enemies: ['朔雷之鳞'], enemyScale: 1.55, weight: 2, tag: '导电强敌' },
      { enemies: ['无常凶鹭'], enemyScale: 1.45, weight: 2, tag: '湮灭飞行' },
      { enemies: ['无妄者'], enemyScale: 1.55, weight: 1, tag: '护盾强敌' }
    ],
    drops: { exp_super: 4, exp_high: 4 },                // 112k exp，凝缩双倍档
    minLevel: 40, enemyScale: 1.5, desc: '特级×4 高级×4 · 80 波片（凝缩）'
  },

  // ===== 凝素领域（武器/技能材料）=====
  {
    id: 'tacet_1', type: 'weapon', name: '凝素领域·武器养成', cost: 40,
    enemies: ['聚械机偶'],
    encounterPool: [
      { enemies: ['聚械机偶'], enemyScale: 1.3, weight: 4, tag: '机械核心' },
      { enemies: ['异构武装'], enemyScale: 1.15, weight: 3, tag: '构造体护盾' },
      { enemies: ['云闪之鳞'], enemyScale: 1.2, weight: 2, tag: '导电突进' },
      { enemies: ['古老幽灵×2', '飞兽×1'], enemyScale: 1.25, weight: 2, tag: '混编残响' }
    ],
    drops: { weapon_book: 24 },
    minLevel: 20, enemyScale: 1.3, desc: '武器石×24 · 40 波片'
  },
  {
    id: 'tacet_2', type: 'weapon', name: '凝素领域·武器养成（凝缩）', cost: 80,
    enemies: ['赫卡忒'],
    encounterPool: [
      { enemies: ['赫卡忒'], enemyScale: 1.8, weight: 3, tag: '湮灭周本影' },
      { enemies: ['无归的谬误'], enemyScale: 1.7, weight: 3, tag: '数据封锁' },
      { enemies: ['异构武装'], enemyScale: 1.9, weight: 2, tag: '冷凝护盾' },
      { enemies: ['鸣式·利维亚坦'], enemyScale: 1.55, weight: 1, tag: '鸣式残响' }
    ],
    drops: { weapon_book: 50 },
    minLevel: 40, enemyScale: 1.8, desc: '武器石×50 · 80 波片（凝缩）'
  },

  // ===== 无音清剿（声骸，60 波片）=====
  // 模拟器抽象：声骸 → 星声 + 武器石 + 高级促剂
  // 注：星声产出折半（v0.2 校准），避免主线副本越打越富
  {
    id: 'silent_1', type: 'echo', name: '无音清剿·常规', cost: 60,
    enemies: ['古老幽灵×2', '幻象×1'],
    encounterPool: [
      { enemies: ['古老幽灵×2', '幻象×1'], enemyScale: 1.0, weight: 4, tag: '声骸残响' },
      { enemies: ['飞兽×2', '幼狼×2'], enemyScale: 1.1, weight: 3, tag: '野外残象群' },
      { enemies: ['哀声鸷'], enemyScale: 1.0, weight: 2, tag: '衍射飞行' },
      { enemies: ['辉萤军势'], enemyScale: 1.05, weight: 2, tag: '冷凝群体' }
    ],
    drops: { exp_high: 4, weapon_book: 10 },
    minLevel: 1, desc: '高级×4 · 武器石×10 · 60 波片'
  },
  {
    id: 'silent_2', type: 'echo', name: '无音清剿·高阶', cost: 60,
    enemies: ['无妄者', '飞廉之猩'],
    encounterPool: [
      { enemies: ['无妄者', '飞廉之猩'], enemyScale: 1.6, weight: 3, tag: '双强敌' },
      { enemies: ['无常凶鹭'], enemyScale: 1.75, weight: 3, tag: '湮灭压制' },
      { enemies: ['海之女'], enemyScale: 1.65, weight: 2, tag: '反弹潮汐' },
      { enemies: ['叹息古龙'], enemyScale: 1.6, weight: 2, tag: '热熔龙息' },
      { enemies: ['梦魇亚当·重锤'], enemyScale: 1.25, weight: 1, tag: '联动重锤' }
    ],
    drops: { exp_super: 3, weapon_book: 14 },
    minLevel: 40, enemyScale: 1.6, desc: '特级×3 · 武器石×14 · 60 波片'
  },

  // ===== 讨伐强敌（角色突破 BOSS，60 波片）=====
  {
    id: 'overlord_1', type: 'overlord', name: '讨伐强敌·飞廉之猩', cost: 60,
    enemies: ['飞廉之猩'],
    encounterPool: [
      { enemies: ['飞廉之猩'], enemyScale: 1.6, weight: 3, tag: '气动强敌' },
      { enemies: ['朔雷之鳞'], enemyScale: 1.55, weight: 2, tag: '导电强敌' },
      { enemies: ['云闪之鳞'], enemyScale: 1.55, weight: 2, tag: '导电突进' },
      { enemies: ['哀声鸷'], enemyScale: 1.55, weight: 2, tag: '衍射飞行' }
    ],
    drops: { exp_super: 3, exp_high: 4, weapon_book: 6 },
    minLevel: 30, enemyScale: 1.6, desc: '特级×3 · 高级×4 · 武器石×6 · 60 波片'
  },
  {
    id: 'overlord_2', type: 'overlord', name: '讨伐强敌·鸣钟之龟', cost: 60,
    enemies: ['鸣钟之龟'],
    encounterPool: [
      { enemies: ['鸣钟之龟'], enemyScale: 1.6, weight: 3, tag: '高防反伤' },
      { enemies: ['荣耀狮像'], enemyScale: 1.55, weight: 2, tag: '热熔护盾' },
      { enemies: ['异构武装'], enemyScale: 1.6, weight: 2, tag: '冷凝护盾' },
      { enemies: ['辉萤军势'], enemyScale: 1.65, weight: 2, tag: '冷凝军势' }
    ],
    drops: { exp_super: 3, exp_high: 4, weapon_book: 6 },
    minLevel: 30, enemyScale: 1.6, desc: '特级×3 · 高级×4 · 武器石×6 · 60 波片'
  },
  {
    id: 'overlord_3', type: 'overlord', name: '讨伐强敌·罗蕾莱', cost: 60,
    enemies: ['罗蕾莱'],
    encounterPool: [
      { enemies: ['罗蕾莱'], enemyScale: 2.0, weight: 3, tag: '导电护盾' },
      { enemies: ['无归的谬误'], enemyScale: 1.9, weight: 2, tag: '黑海岸数据' },
      { enemies: ['海之女'], enemyScale: 1.95, weight: 2, tag: '反弹潮汐' },
      { enemies: ['叹息古龙'], enemyScale: 1.85, weight: 2, tag: '热熔龙息' },
      { enemies: ['梦魇亚当·重锤'], enemyScale: 1.5, weight: 1, tag: '重锤狂暴' }
    ],
    drops: { exp_super: 4, exp_high: 4, weapon_book: 8 },
    minLevel: 50, enemyScale: 2.0, desc: '特级×4 · 高级×4 · 武器石×8 · 60 波片'
  }
];

// 战歌重奏（周本技能升级材料，60 波片，周限 3 次共享）
// 模拟器抽象：技能升级材料 → 高级促剂 + 武器石 + 星声
export const WEEKLY_BOSS = [
  {
    id: 'boss_loulou', type: 'weekly', name: '战歌重奏·罗蕾莱', cost: 60, weeklyLimit: true,
    enemies: ['罗蕾莱'],
    encounterPool: [
      { enemies: ['罗蕾莱'], enemyScale: 2.5, weight: 1, tag: '导电护盾' }
    ],
    drops: { exp_high: 8, weapon_book: 14 },
    minLevel: 40, enemyScale: 2.5, desc: '高级×8 · 武器石×14 · 周限 3 次'
  },
  {
    id: 'boss_imperator', type: 'weekly', name: '战歌重奏·无冠者', cost: 60, weeklyLimit: true,
    enemies: ['无冠者'],
    encounterPool: [
      { enemies: ['无冠者'], enemyScale: 2.5, weight: 1, tag: '湮灭狂暴' }
    ],
    drops: { exp_high: 8, weapon_book: 14 },
    minLevel: 40, enemyScale: 2.5, desc: '高级×8 · 武器石×14 · 周限 3 次'
  },
  {
    id: 'boss_hecate', type: 'weekly', name: '战歌重奏·赫卡忒', cost: 60, weeklyLimit: true,
    enemies: ['赫卡忒'],
    encounterPool: [
      { enemies: ['赫卡忒'], enemyScale: 2.8, weight: 1, tag: '幻象召唤' }
    ],
    drops: { exp_super: 4, exp_high: 6, weapon_book: 16 },
    minLevel: 60, enemyScale: 2.8, desc: '特级×4 · 高级×6 · 武器石×16 · 周限 3 次'
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

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickWeighted(pool, seed) {
  const total = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
  let roll = seed % total;
  for (const item of pool) {
    roll -= item.weight || 1;
    if (roll < 0) return item;
  }
  return pool[0];
}

export function currentVersion(today = S.today) {
  const p = phases.find(x => today >= x.start && today < x.end)
    || phases.slice().reverse().find(x => today >= x.start)
    || phases[0];
  return p?.v || '1.0';
}

export function versionEnemyScale(today = S.today) {
  const v = currentVersion(today);
  const [majorRaw, minorRaw] = String(v).split('.');
  const major = Number(majorRaw) || 1;
  const minor = Number(minorRaw) || 0;
  const eraBonus = Math.max(0, major - 1) * 0.18;      // 2.x +18%, 3.x +36%
  const patchBonus = minor * 0.025;                    // 每个小版本 +2.5%
  return +(1 + eraBonus + patchBonus).toFixed(3);
}

export function getDungeonEncounter(d, today = S.today) {
  const pool = d.encounterPool && d.encounterPool.length
    ? d.encounterPool
    : [{ enemies: d.enemies || [], enemyScale: d.enemyScale || 1.0, tag: '固定敌情' }];
  const dayKey = new Date(today).toISOString().slice(0, 10);
  const picked = pickWeighted(pool, hashString(`${d.id}|${dayKey}`));
  return {
    enemies: picked.enemies || d.enemies || [],
    enemyScale: +((picked.enemyScale || d.enemyScale || 1.0) * versionEnemyScale(today)).toFixed(3),
    baseEnemyScale: picked.enemyScale || d.enemyScale || 1.0,
    versionScale: versionEnemyScale(today),
    version: currentVersion(today),
    tag: picked.tag || '今日敌情'
  };
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
