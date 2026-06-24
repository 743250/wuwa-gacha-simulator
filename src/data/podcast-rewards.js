// 先约电台 70 级奖励表（每级一项 · 双线）
//
// 免费轨：始终可领
// 付费轨：S.podcast.paid 为 true（购买内幕频道）后可领，
//        购买当下自动追领所有已达成的付费级
//
// 字段（reward 对象内）：
//   astrite / radiant / forging / lustrous / dream / mirage
//   exp_low / exp_mid / exp_high / exp_super / weapon_book / crystal_solvent / condensed_waveplate
//   lunite
//   weaponBox: true  → 4★ 武器自选箱（5 选 1，弹窗）
//   refineStone: N   → 烙金银杏 ×N（用于精炼 4★ 自选武器；模拟器折算为对该武器 +N 精炼）
//   cosmetic: '...'  → 名片/头像（纯展示文案）
//
// 数据校准：
//   官方 70 级满级（内幕频道）≈ 680 星声 + 浮金 ×5 + 唤声 ×2 + 结晶溶剂 ×7
//                            + 武器自选箱 + 大量贝币/经验/声骸（模拟器折算）
//   免费轨满级 ≈ 唤声 ×5 + 结晶溶剂 ×5 + 一堆养成料

// 帮手：构造每级条目
const F = (free, paid) => ({ free, paid });
const R = (o) => o;

// 免费轨各级别奖励
const FREE_TRACK = [
  // Lv 1-10
  R({ exp_low: 4 }),         // 1
  R({ astrite: 20 }),        // 2
  R({ exp_mid: 2 }),         // 3
  R({ weapon_book: 3 }),     // 4
  R({ lustrous: 1 }),        // 5  ★ 唤声涡纹
  R({ exp_low: 4 }),         // 6
  R({ exp_mid: 2 }),         // 7
  R({ astrite: 20 }),        // 8
  R({ weapon_book: 3 }),     // 9
  R({ exp_high: 1, crystal_solvent: 1 }),  // 10 ★ 结晶溶剂
  // Lv 11-20
  R({ exp_low: 4 }),         // 11
  R({ astrite: 20 }),        // 12
  R({ exp_mid: 2 }),         // 13
  R({ weapon_book: 4 }),     // 14
  R({ lustrous: 1 }),        // 15 ★
  R({ exp_low: 4 }),         // 16
  R({ exp_mid: 2 }),         // 17
  R({ astrite: 20 }),        // 18
  R({ weapon_book: 4 }),     // 19
  R({ exp_high: 2, crystal_solvent: 1 }),  // 20 ★
  // Lv 21-30
  R({ exp_low: 5 }),         // 21
  R({ astrite: 20 }),        // 22
  R({ exp_mid: 3 }),         // 23
  R({ weapon_book: 4 }),     // 24
  R({ lustrous: 1 }),        // 25 ★
  R({ exp_low: 5 }),         // 26
  R({ exp_mid: 3 }),         // 27
  R({ astrite: 20 }),        // 28
  R({ weapon_book: 4 }),     // 29
  R({ exp_high: 2, crystal_solvent: 1 }),  // 30 ★
  // Lv 31-40
  R({ exp_low: 5 }),         // 31
  R({ astrite: 25 }),        // 32
  R({ exp_mid: 3 }),         // 33
  R({ weapon_book: 5 }),     // 34
  R({ lustrous: 1 }),        // 35 ★
  R({ exp_low: 5 }),         // 36
  R({ exp_mid: 3 }),         // 37
  R({ astrite: 25 }),        // 38
  R({ weapon_book: 5 }),     // 39
  R({ exp_high: 3, crystal_solvent: 1 }),  // 40 ★
  // Lv 41-50
  R({ exp_low: 5 }),         // 41
  R({ astrite: 25 }),        // 42
  R({ exp_high: 1 }),        // 43
  R({ weapon_book: 5 }),     // 44
  R({ lustrous: 1 }),        // 45 ★
  R({ exp_mid: 4 }),         // 46
  R({ exp_high: 1 }),        // 47
  R({ astrite: 25 }),        // 48
  R({ weapon_book: 5 }),     // 49
  R({ exp_super: 1, crystal_solvent: 1 }), // 50 ★
  // Lv 51-60
  R({ exp_mid: 4 }),         // 51
  R({ astrite: 25 }),        // 52
  R({ exp_high: 2 }),        // 53
  R({ weapon_book: 5 }),     // 54
  R({ exp_super: 1 }),       // 55
  R({ exp_mid: 4 }),         // 56
  R({ exp_high: 2 }),        // 57
  R({ astrite: 30 }),        // 58
  R({ weapon_book: 6 }),     // 59
  R({ exp_super: 1, condensed_waveplate: 1 }), // 60 ★ 凝缩波片
  // Lv 61-70
  R({ exp_high: 2 }),        // 61
  R({ astrite: 30 }),        // 62
  R({ exp_high: 2 }),        // 63
  R({ weapon_book: 6 }),     // 64
  R({ exp_super: 1 }),       // 65
  R({ exp_high: 2 }),        // 66
  R({ astrite: 30 }),        // 67
  R({ weapon_book: 6 }),     // 68
  R({ exp_super: 1 }),       // 69
  R({ exp_super: 1, condensed_waveplate: 1 }) // 70 ★ 完结奖励
];

// 付费轨（内幕频道）各级别奖励
const PAID_TRACK = [
  // Lv 1-10
  R({ astrite: 40 }),                          // 1
  R({ exp_high: 1 }),                          // 2
  R({ astrite: 40 }),                          // 3
  R({ weapon_book: 4 }),                       // 4
  R({ radiant: 1 }),                           // 5 ★ 浮金波纹
  R({ astrite: 40 }),                          // 6
  R({ exp_high: 1 }),                          // 7
  R({ weapon_book: 4 }),                       // 8
  R({ astrite: 40 }),                          // 9
  R({ exp_super: 1, crystal_solvent: 1 }),     // 10 ★
  // Lv 11-20
  R({ astrite: 40 }),                          // 11
  R({ exp_high: 1 }),                          // 12
  R({ weapon_book: 4 }),                       // 13
  R({ astrite: 40 }),                          // 14
  R({ radiant: 1 }),                           // 15 ★
  R({ astrite: 40 }),                          // 16
  R({ exp_high: 1 }),                          // 17
  R({ weapon_book: 4 }),                       // 18
  R({ lustrous: 1 }),                          // 19 ★ 唤声
  R({ exp_super: 1, crystal_solvent: 1 }),     // 20 ★
  // Lv 21-30
  R({ astrite: 40 }),                          // 21
  R({ exp_high: 1 }),                          // 22
  R({ weapon_book: 4 }),                       // 23
  R({ astrite: 40 }),                          // 24
  R({ radiant: 1 }),                           // 25 ★
  R({ astrite: 40 }),                          // 26
  R({ exp_high: 1 }),                          // 27
  R({ weapon_book: 4 }),                       // 28
  R({ astrite: 40 }),                          // 29
  R({ exp_super: 1, crystal_solvent: 1 }),     // 30 ★
  // Lv 31-40
  R({ astrite: 40 }),                          // 31
  R({ weaponBox: true }),                      // 32 ★★ 4★ 武器自选箱
  R({ weapon_book: 4 }),                       // 33
  R({ astrite: 40 }),                          // 34
  R({ radiant: 1 }),                           // 35 ★
  R({ astrite: 40 }),                          // 36
  R({ exp_high: 1 }),                          // 37
  R({ refineStone: 1 }),                       // 38 ★ 烙金银杏（精炼+1）
  R({ astrite: 40 }),                          // 39
  R({ exp_super: 1, crystal_solvent: 1 }),     // 40 ★
  // Lv 41-50
  R({ astrite: 40 }),                          // 41
  R({ refineStone: 1 }),                       // 42 ★
  R({ weapon_book: 5 }),                       // 43
  R({ astrite: 40 }),                          // 44
  R({ lustrous: 1 }),                          // 45 ★ 唤声
  R({ astrite: 40 }),                          // 46
  R({ refineStone: 1 }),                       // 47 ★
  R({ weapon_book: 5 }),                       // 48
  R({ astrite: 40 }),                          // 49
  R({ exp_super: 1, crystal_solvent: 1 }),     // 50 ★
  // Lv 51-60
  R({ astrite: 40 }),                          // 51
  R({ refineStone: 1 }),                       // 52
  R({ weapon_book: 5 }),                       // 53
  R({ astrite: 40 }),                          // 54
  R({ exp_super: 1 }),                         // 55
  R({ astrite: 40 }),                          // 56
  R({ exp_super: 1 }),                         // 57
  R({ weapon_book: 5 }),                       // 58
  R({ astrite: 40 }),                          // 59
  R({ exp_super: 1, crystal_solvent: 1 }),     // 60 ★
  // Lv 61-70
  R({ astrite: 40 }),                          // 61
  R({ exp_super: 1 }),                         // 62
  R({ weapon_book: 5 }),                       // 63
  R({ astrite: 40 }),                          // 64
  R({ exp_super: 1 }),                         // 65
  R({ astrite: 40 }),                          // 66
  R({ weapon_book: 5 }),                       // 67
  R({ astrite: 40 }),                          // 68
  R({ exp_super: 1 }),                         // 69
  R({ exp_super: 1, crystal_solvent: 1, cosmetic: '电台主播 · 头像挂件' }) // 70 ★★ 完结
];

// 校验：70 项
if (FREE_TRACK.length !== 70 || PAID_TRACK.length !== 70) {
  console.error('[podcast] 奖励轨长度不为 70', FREE_TRACK.length, PAID_TRACK.length);
}

// 导出：rewards[level-1] = { free, paid }
export const PODCAST_REWARDS = FREE_TRACK.map((free, i) => F(free, PAID_TRACK[i]));

export const PODCAST_MAX_LEVEL = 70;
export const PODCAST_EXP_PER_LEVEL = 700;    // v0.2 校准：1000 → 700（-30%），整体经验需求下调
export const PODCAST_BUY_LEVEL_COST = 100;   // 100 星声买 1 级（按官方）

// 4★ 武器自选箱选项（鸣潮真实定档：纹秋 / 飞景 / 奔雷 / 金掌 / 清音）
// 模拟器映射：从 weapons.js 已有 4★ 武器里挑同类风格的 5 把
export const WEAPON_BOX_OPTIONS = [
  '飞景',         // 迅刀
  '骇行',         // 长刃
  '呼啸重音',     // 佩枪
  '钢影拳',       // 臂铠
  '奇幻变奏'      // 音感仪
];
