// 时间推进与版本切换
import { S, DAY, date, fmt, msg } from '../state.js';
import { phases } from '../data/phases.js';
import { activePhase } from '../gacha/core.js';
import { resetDailyIfNeeded } from '../daily/commission.js';
import { shopCatalog } from '../shop/actions.js';

function versionAt(t) {
  const p = phases.find(x => t >= x.start && t < x.end);
  return p ? p.v : null;
}

function settleDays(target) {
  const days = Math.max(0, Math.floor((target - S.today) / DAY));
  if (days <= 0) return;
  // 起算日：上次领取后的下一天（lastMonthlyClaim 为今天则跳过 1 天）
  const today = fmt(S.today);
  const startOffset = S.lastMonthlyClaim === today ? 1 : 0;
  const claimable = Math.max(0, days - startOffset);
  const paid = Math.min(claimable, S.days);
  S.days -= paid;
  S.astrite += paid * 90;
  // 推进结束后，目标日已自动领取过
  if (paid > 0) S.lastMonthlyClaim = fmt(target);
}

export function claimMonthly() {
  const today = fmt(S.today);
  if (S.lastMonthlyClaim === today) return false;
  if (S.days <= 0) return false;
  S.days--;
  S.astrite += 90;
  S.lastMonthlyClaim = today;
  return true;
}

// 重置月度限购礼包（跨月时调用）
function resetMonthlyShop() {
  if (!S.shopBuyCount) return;
  shopCatalog.bundle.forEach(it => {
    if (it.period === 'month' && S.shopBuyCount[it.id]) {
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
  resetVersionShop();
  if (toast) msg('版本周期已刷新', false);
}

export function advanceTo(target) {
  const oldVersion = versionAt(S.today);
  const oldMonth = new Date(S.today).getUTCMonth();
  const oldYear = new Date(S.today).getUTCFullYear();
  const daysPassed = Math.max(1, Math.floor((target - S.today) / DAY));
  settleDays(target);
  S.today = target;
  // 每过一天补满体力
  S.stamina = Math.min(S.staminaMax, S.stamina + daysPassed * 240);
  if (S.stamina > S.staminaMax) S.stamina = S.staminaMax;
  // 重置每日委托
  resetDailyIfNeeded();
  // 跨月重置月度礼包
  const newMonth = new Date(S.today).getUTCMonth();
  const newYear = new Date(S.today).getUTCFullYear();
  if (newYear !== oldYear || newMonth !== oldMonth) {
    resetMonthlyShop();
  }
  if (versionAt(S.today) !== oldVersion) refreshVersion(false);
  window.__render();
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

export function jumpToday() {
  S.today = date('2026-06-23');
  refreshVersion();
  window.__render();
}