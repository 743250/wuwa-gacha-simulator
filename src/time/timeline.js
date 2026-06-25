// 时间推进与版本切换
import { S, DAY, date, fmt, msg } from '../state.js';
import { phases } from '../data/phases.js';
import { activePhase } from '../gacha/core.js';
import { resetDailyIfNeeded } from '../daily/commission.js';
import { shopCatalog } from '../shop/actions.js';
import { resetWeeklyBossIfNeeded } from '../battle/dungeon.js';
import { resetAbyssIfNeeded } from '../daily/abyss.js';
import { resetWastesIfNeeded } from '../daily/wastes.js';
import { resetPodcastForVersion, resetPodcastDailyIfNeeded, resetPodcastWeeklyIfNeeded, progressTask } from '../podcast/core.js';

function versionAt(t) {
  const p = phases.find(x => t >= x.start && t < x.end);
  return p ? p.v : null;
}

// 把当天的月卡领取一份（如果有月卡 且 今天没领过）
// 返回是否真的领了
export function claimMonthly() {
  const today = fmt(S.today);
  if (S.lastMonthlyClaim === today) return false;
  if (S.days <= 0) return false;
  S.days--;
  S.astrite += 90;
  S.lastMonthlyClaim = today;
  return true;
}

// 推进日期时：
// 1) 今天如果还没领，先把今天补领一份
// 2) 然后中间经过的每一天（直到目标日，含目标日）都按月卡剩余天数自动领
function settleDays(target) {
  if (target <= S.today) return 0;
  const span = Math.floor((target - S.today) / DAY);    // 经过的天数（不含起点）
  const todayStr = fmt(S.today);
  // 今天还没领 + 有月卡 → 今天先领一份
  let want = 0;
  if (S.lastMonthlyClaim !== todayStr && S.days > 0) want++;
  // 经过的天数每天都想领
  want += span;
  // 实际能领 = min(想领, 剩余天数)
  const paid = Math.min(want, S.days);
  S.days -= paid;
  S.astrite += paid * 90;
  if (paid > 0) S.lastMonthlyClaim = fmt(target);
  return paid;
}

// 重置月度限购礼包（跨月时调用）
function resetMonthlyShop() {
  if (!S.shopBuyCount) return;
  shopCatalog.bundle.forEach(it => {
    if (it.period === 'month' && S.shopBuyCount[it.id]) {
      delete S.shopBuyCount[it.id];
    }
  });
  // 常驻礼包也按月刷新（新需求 #8）
  shopCatalog.bundle.forEach(it => {
    if (it.regular && S.shopBuyCount[it.id]) {
      delete S.shopBuyCount[it.id];
    }
  });
}

// 重置版本限购礼包
function resetVersionShop() {
  if (!S.shopBuyCount) return;
  shopCatalog.bundle.forEach(it => {
    if (it.period === 'version' && S.shopBuyCount[it.id]) {
      delete S.shopBuyCount[it.id];
    }
  });
  // 战令也按版本刷新
  shopCatalog.pass.forEach(it => {
    if (S.shopBuyCount[it.id]) delete S.shopBuyCount[it.id];
  });
}

function refreshVersion(toast) {
  S.oscBuy = { radiant: 0, forging: 0, lustrous: 0 };
  S.waveBuy = {}; // 角色波段每版本限购 2 个，随版本重置
  resetVersionShop();
  resetWastesIfNeeded(); // 冥歌海墟随版本重置
  if (toast) msg('版本周期已刷新', false);
}

export function advanceTo(target) {
  const oldVersion = versionAt(S.today);
  const oldMonth = new Date(S.today).getUTCMonth();
  const oldYear = new Date(S.today).getUTCFullYear();
  const daysPassed = Math.max(0, Math.floor((target - S.today) / DAY));
  const claimed = settleDays(target);
  if (claimed > 0) msg(`月卡自动领取 ${claimed} 天 · +${claimed * 90} 星声`, false);
  S.today = target;
  // 每过一天补满体力：仅当低于上限时往上补到上限；超过上限（嗑药剂状态）保留不动
  if (S.stamina < S.staminaMax) {
    S.stamina = Math.min(S.staminaMax, S.stamina + daysPassed * 240);
  }
  // 重置每日委托
  resetDailyIfNeeded();
  // 重置电台每日/每周任务（按日期判定）
  resetPodcastDailyIfNeeded();
  resetPodcastWeeklyIfNeeded();
  // 每过 1 天，自动完成签到任务
  progressTask('d_signin', 1);
  // 周一重置周本计数
  resetWeeklyBossIfNeeded(S.today);
  // 双周深塔危险区重置（每 14 天）
  resetAbyssIfNeeded(S.today);
  // 跨月重置月度礼包
  const newMonth = new Date(S.today).getUTCMonth();
  const newYear = new Date(S.today).getUTCFullYear();
  if (newYear !== oldYear || newMonth !== oldMonth) {
    resetMonthlyShop();
  }
  const newVersion = versionAt(S.today);
  if (newVersion !== oldVersion) {
    refreshVersion(false);
    if (newVersion) resetPodcastForVersion(newVersion);
  }
  // 注意：不在内部调 __render，由 main.js 的各 caller 统一调 rerenderAll()
}

export function advanceDay() { advanceTo(S.today + DAY); }
export function dailyTick() { return claimMonthly(); }

export function nextPhase() {
  const n = phases.map(p => p.start).filter(t => t > S.today).sort((a, b) => a - b)[0];
  if (n) advanceTo(n);
}

export function nextVersion() {
  const curV = (activePhase()[0] || {}).v;
  const n = phases.find(p => p.start > S.today && p.v !== curV);
  if (n) advanceTo(n.start);
}

// 跳到某个版本（按版本名 "3.4"）
export function jumpToVersion(versionId) {
  const p = phases.find(x => x.v === versionId);
  if (!p) return false;
  advanceTo(p.start);
  return true;
}

// 跳到任意日期
export function jumpToDate(timestamp) {
  if (!Number.isFinite(timestamp)) return false;
  advanceTo(timestamp);
  return true;
}

export function jumpToday() {
  S.today = date('2026-06-23');
  refreshVersion();
  // 注意：不在内部调 __render，由 main.js caller 统一调 rerenderAll()
}