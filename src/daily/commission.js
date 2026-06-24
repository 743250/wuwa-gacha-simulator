// 每日委托
// 按官方"100 活跃 = 60 星声/日"口径：拆 4 个小委托 + 1 个挑战委托
//   小委托：10 星声 + 小材料  ×4
//   挑战委托：20 星声 + 中型材料
//   合计：4×10 + 20 = 60 星声/日（不再加"全完成额外 60"）
import { S } from '../state.js';
import { progressTask } from '../podcast/core.js';

const SMALL_POOL = [
  { id: 's1', name: '击败 3 只幼狼',  reward: { astrite: 10, exp_mid: 2 } },
  { id: 's2', name: '采集 10 个声笺', reward: { astrite: 10, exp_mid: 2 } },
  { id: 's3', name: '清剿飞兽集群',   reward: { astrite: 10, exp_low: 4 } },
  { id: 's4', name: '调查古老幻象',   reward: { astrite: 10, exp_mid: 2, weapon_book: 1 } },
  { id: 's5', name: '击败 2 只野猪',  reward: { astrite: 10, exp_low: 4 } },
  { id: 's6', name: '采集潮汐能量',   reward: { astrite: 10, exp_mid: 3 } }
];

const CHALLENGE_POOL = [
  { id: 'c1', name: '挑战 · 击败狂战士',  reward: { astrite: 20, exp_high: 3, weapon_book: 2 } },
  { id: 'c2', name: '挑战 · 无相余烬',    reward: { astrite: 20, exp_high: 3, weapon_book: 2 } },
  { id: 'c3', name: '挑战 · 古老灾厄痕迹', reward: { astrite: 20, exp_high: 3, weapon_book: 2 } }
];

// 生成今日委托（5 个：4 小 + 1 挑战）
export function generateCommissions(seed) {
  const hash = simpleHash(seed);
  const selected = [];
  for (let i = 0; i < 4; i++) {
    const idx = (hash + i * 7) % SMALL_POOL.length;
    selected.push({ ...SMALL_POOL[idx], done: false });
  }
  // 第 5 个：挑战委托
  const cIdx = hash % CHALLENGE_POOL.length;
  selected.push({ ...CHALLENGE_POOL[cIdx], done: false });
  return selected;
}

function simpleHash(seed) {
  if (typeof seed === 'string') seed = new Date(seed).getTime();
  return Math.abs(((seed * 9301 + 49297) % 233280) | 0);
}

// 完成委托（不再额外送 60，已分摊到每个委托）
export function completeCommission(idx) {
  const cs = S.dailyCommissions;
  if (!cs[idx] || cs[idx].done) return 0;
  cs[idx].done = true;
  applyReward(cs[idx].reward);
  // 电台任务进度：daily / weekly
  // 前 4 个是小委托，第 5 个是挑战委托
  if (idx === 4 || cs[idx].id?.startsWith('c')) {
    progressTask('d_challenge', 1);
  } else {
    progressTask('d_commission', 1);
  }
  progressTask('w_commission', 1);
  return 0;
}

function applyReward(r) {
  if (r.astrite) S.astrite += r.astrite;
  if (r.exp_super) S.materials.exp_super += r.exp_super;
  if (r.exp_high) S.materials.exp_high += r.exp_high;
  if (r.exp_mid) S.materials.exp_mid += r.exp_mid;
  if (r.exp_low) S.materials.exp_low += r.exp_low;
  if (r.weapon_book) S.materials.weapon_book += r.weapon_book;
}

// 每日重置
export function resetDailyIfNeeded() {
  const today = S.today;
  if (String(today) !== S.lastDailyReset) {
    S.dailyCommissions = generateCommissions(today);
    S.lastDailyReset = String(today);
    return true;
  }
  return false;
}