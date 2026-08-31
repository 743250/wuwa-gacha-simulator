// 周度游历（原"千道门扉"，3.4 起合并为"周度游历"）
// 官方口径：每周一次性领取 160 星声 + 养成材料
// 模拟器实现：在每日委托面板下方挂一栏，每周一服务器重置时清空"已领"状态
import { S } from '../state.js';
import { commit } from '../state/commit.ts';
import { thisMondayKey } from '../shared/date.js';

export const WEEKLY_TOUR_REWARD = {
  astrite: 160,
  exp_high: 4,
  weapon_book: 6,
  lustrous: 1
};

export function isWeeklyTourClaimed() {
  if (!S.weeklyTour) return false;
  return S.weeklyTour.claimedWeek === thisMondayKey(S.today);
}

export function claimWeeklyTour() {
  return commit(() => {
    if (isWeeklyTourClaimed()) return null;
    const r = WEEKLY_TOUR_REWARD;
    S.astrite += r.astrite;
    S.materials.exp_high = (S.materials.exp_high || 0) + r.exp_high;
    S.materials.weapon_book = (S.materials.weapon_book || 0) + r.weapon_book;
    S.lustrous = (S.lustrous || 0) + r.lustrous;
    S.weeklyTour = { claimedWeek: thisMondayKey(S.today) };
    return r;
  });
}

