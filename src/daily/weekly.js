// 周度游历（原"千道门扉"，3.4 起合并为"周度游历"）
// 官方口径：每周一次性领取 160 星声 + 养成材料
// 模拟器实现：在每日委托面板下方挂一栏，每周一服务器重置时清空"已领"状态
import { S } from '../state.js';

export const WEEKLY_TOUR_REWARD = {
  astrite: 160,
  exp_high: 4,
  weapon_book: 6,
  lustrous: 1
};

function thisMondayKey(today) {
  const d = new Date(today);
  const dayOfWeek = d.getUTCDay();
  const daysFromMon = (dayOfWeek + 6) % 7;
  const mondayMs = d.getTime() - daysFromMon * 86400000;
  return new Date(mondayMs).toISOString().slice(0, 10);
}

export function isWeeklyTourClaimed() {
  if (!S.weeklyTour) return false;
  return S.weeklyTour.claimedWeek === thisMondayKey(S.today);
}

export function claimWeeklyTour() {
  if (isWeeklyTourClaimed()) return null;
  const r = WEEKLY_TOUR_REWARD;
  S.astrite += r.astrite;
  S.materials.exp_high = (S.materials.exp_high || 0) + r.exp_high;
  S.materials.weapon_book = (S.materials.weapon_book || 0) + r.weapon_book;
  S.lustrous = (S.lustrous || 0) + r.lustrous;
  S.weeklyTour = { claimedWeek: thisMondayKey(S.today) };
  return r;
}

export function resetWeeklyTourIfNeeded(today) {
  // 用 thisMondayKey 自动判定，无需主动清理
  // claimWeeklyTour() 会在新周写入新 key
  return;
}
