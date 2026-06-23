// 每日委托（简化版）
import { S } from '../state.js';

const POOL = [
  { id: 'd1', name: '击败 3 只幼狼', reward: { astrite: 20, exp_high: 2 } },
  { id: 'd2', name: '采集 10 个声笺', reward: { astrite: 20, exp_high: 2 } },
  { id: 'd3', name: '击败 2 只野猪', reward: { astrite: 20, exp_mid: 3 } },
  { id: 'd4', name: '清剿飞兽集群', reward: { astrite: 20, exp_mid: 3 } },
  { id: 'd5', name: '调查古老幻象', reward: { astrite: 20, exp_high: 2, weapon_book: 1 } },
  { id: 'd6', name: '击败狂战士', reward: { astrite: 20, exp_high: 3 } },
  { id: 'd7', name: '采集潮汐能量', reward: { astrite: 20, exp_mid: 5 } },
  { id: 'd8', name: '击败无相余烬', reward: { astrite: 20, exp_high: 3, weapon_book: 2 } },
];

// 生成今日委托（4 个）
export function generateCommissions(seed) {
  const hash = simpleHash(seed);
  const selected = [];
  for (let i = 0; i < 4; i++) {
    const idx = (hash + i * 7) % POOL.length;
    selected.push({ ...POOL[idx], done: false });
  }
  return selected;
}

function simpleHash(seed) {
  if (typeof seed === 'string') seed = new Date(seed).getTime();
  return Math.abs(((seed * 9301 + 49297) % 233280) | 0);
}

// 完成委托
export function completeCommission(idx) {
  const cs = S.dailyCommissions;
  if (!cs[idx] || cs[idx].done) return 0;
  cs[idx].done = true;
  const r = cs[idx].reward;
  applyReward(r);
  // 4 个全完成额外 +60 星声
  if (cs.every(c => c.done)) {
    S.astrite += 60;
    return 60;
  }
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