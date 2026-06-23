// 副本配置
// 数据校准（2026-06）：敌人引用已改为真实鸣潮 BOSS
export const DUNGEONS = [
  // ===== 经验本（3 档） =====
  {
    id: 'exp_1', type: 'exp', name: '模拟领域·初级', cost: 10,
    enemies: ['幼狼×3', '飞兽×1'],
    drops: { exp_low: 5, exp_mid: 2 },                   // 11000 经验
    minLevel: 1, desc: '初级 ×5 中级 ×2 · 体力 10'
  },
  {
    id: 'exp_2', type: 'exp', name: '模拟领域·中级', cost: 20,
    enemies: ['古老幽灵×2', '幻象×1'],
    drops: { exp_mid: 4, exp_high: 2 },                  // 28000 经验
    minLevel: 20, enemyScale: 1.5, desc: '中级 ×4 高级 ×2 · 体力 20'
  },
  {
    id: 'exp_3', type: 'exp', name: '模拟领域·高级', cost: 30,
    enemies: ['燎照之骑'],
    drops: { exp_high: 6 },                              // 48000 经验
    minLevel: 40, enemyScale: 2.0, desc: '高级 ×6 · 体力 30'
  },

  // ===== 武器突破石本（2 档） =====
  {
    id: 'weapon_1', type: 'weapon', name: '凝素领域·中级', cost: 20,
    enemies: ['聚械机偶'],
    drops: { weapon_book: 8 },
    minLevel: 20, enemyScale: 1.3, desc: '武器石 ×8 · 体力 20'
  },
  {
    id: 'weapon_2', type: 'weapon', name: '凝素领域·高级', cost: 30,
    enemies: ['赫卡忒'],
    drops: { weapon_book: 14 },
    minLevel: 40, enemyScale: 1.8, desc: '武器石 ×14 · 体力 30'
  }
];

// 周常 BOSS（战歌重奏）
export const WEEKLY_BOSS = [
  {
    id: 'boss_loulou', type: 'weekly', name: '战歌重奏 · 罗蕾莱', cost: 30,
    enemies: ['罗蕾莱'],
    drops: { exp_high: 4, weapon_book: 6, astrite: 80 },
    minLevel: 40, enemyScale: 2.5, desc: '高级×4 武器石×6 星声+80 · 周限 3 次'
  },
  {
    id: 'boss_imperator', type: 'weekly', name: '战歌重奏 · 无冠者', cost: 30,
    enemies: ['无冠者'],
    drops: { exp_high: 4, weapon_book: 6, astrite: 80 },
    minLevel: 40, enemyScale: 2.5, desc: '高级×4 武器石×6 星声+80 · 周限 3 次'
  },
  {
    id: 'boss_hecate', type: 'weekly', name: '战歌重奏 · 赫卡忒', cost: 30,
    enemies: ['赫卡忒'],
    drops: { exp_high: 4, weapon_book: 6, astrite: 80 },
    minLevel: 60, enemyScale: 2.8, desc: '高级×4 武器石×6 星声+80 · 周限 3 次'
  }
];

// 解析敌人字符串 "幼狼×3" → { name, count }
export function parseEnemyStr(str) {
  const m = str.match(/^(.+?)(?:×(\d+))?$/);
  if (!m) return { name: str, count: 1 };
  return { name: m[1], count: parseInt(m[2] || '1') };
}

// 展平敌人列表
export function flattenEnemies(enemyStrs) {
  const result = [];
  enemyStrs.forEach(s => {
    const parsed = parseEnemyStr(s);
    for (let i = 0; i < parsed.count; i++) {
      result.push(parsed.name);
    }
  });
  return result;
}
