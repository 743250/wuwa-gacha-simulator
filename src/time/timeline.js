// 时间推进与版本切换
import { S, DAY, date, fmt } from '../state.js';
import { msg } from '../ui/services/toast.ts';
import { phases } from '../data/phases.js';
import { activePhase, ensureSelectedBanner } from '../gacha/core.js';
import { resetDailyIfNeeded } from '../daily/commission.js';
import { shopCatalog } from '../shop/actions.js';
import { resetWeeklyBossIfNeeded } from '../battle/dungeon.js';
import { resetAbyssIfNeeded } from '../daily/abyss.js';
import { resetWastesIfNeeded } from '../daily/wastes.js';
import { resetPodcastForVersion, resetPodcastDailyIfNeeded, resetPodcastWeeklyIfNeeded, progressTask } from '../podcast/core.js';
import { applyNaturalRecovery } from '../daily/stamina.js';
import { deliverDueMails } from '../mail/mailbox.js';
import { commit } from '../state/commit.ts';
import { maybePromptLoginClaims } from '../daily/loginClaim.js';

function versionAt(t) {
  const p = phases.find(x => t >= x.start && t < x.end);
  return p ? p.v : null;
}

// 当日月卡：仅供兼容/测试；正式入口走 loginClaim 上线补给弹窗
export function claimMonthly() {
  return commit(() => {
    const today = fmt(S.today);
    if (S.lastMonthlyClaim === today) return false;
    if (S.days <= 0) return false;
    S.days--;
    S.astrite += 90;
    S.lastMonthlyClaim = today;
    return true;
  });
}

// 推进日期时：月卡剩余天数按日历扣减（漏登不补星声），当日领取改由上线补给弹窗
function expireMonthlyOnAdvance(target) {
  if (target <= S.today || (S.days || 0) <= 0) return 0;
  const span = Math.floor((target - S.today) / DAY);
  if (span <= 0) return 0;
  const burn = Math.min(span, S.days);
  S.days -= burn;
  return burn;
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
  commit(() => {
    const oldVersion = versionAt(S.today);
    const oldMonth = new Date(S.today).getUTCMonth();
    const oldYear = new Date(S.today).getUTCFullYear();
    const daysPassed = Math.max(0, Math.floor((target - S.today) / DAY));
    expireMonthlyOnAdvance(target);
    S.today = target;
    const newVersion = versionAt(S.today);
    if (newVersion !== oldVersion) {
      refreshVersion(false);
      if (newVersion) resetPodcastForVersion(newVersion);
    }
    // 自然恢复：未满先补到上限，溢出与已满时的恢复量转为结晶单质；超充状态保留不动
    if (daysPassed > 0) {
      applyNaturalRecovery(daysPassed);
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
    // 运营邮箱：按日历投递到期邮件
    const newMails = deliverDueMails(S.today);
    if (newMails.length > 0) {
      msg(`收到 ${newMails.length} 封新邮件`, false);
    }
    // Phase 3 步骤 A:日期/版本切换后,显式回填 S.selected(联动池过期/新手池关闭/新旅池到期)
    ensureSelectedBanner();
    // 跨月重置月度礼包
    const newMonth = new Date(S.today).getUTCMonth();
    const newYear = new Date(S.today).getUTCFullYear();
    if (newYear !== oldYear || newMonth !== oldMonth) {
      resetMonthlyShop();
    }
  });
  // 上线补给弹窗：月卡当日 + 特别感恩回馈等同窗领取
  // 延迟到下一任务，避免与调用方 rerender / 其它 modal 抢焦点
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => { try { maybePromptLoginClaims(); } catch (_) { /* ignore */ } });
  } else {
    setTimeout(() => { try { maybePromptLoginClaims(); } catch (_) { /* ignore */ } }, 0);
  }
  // 注意：不在内部调 __render，由 main.js 的各 caller 统一调 rerenderAll()
}

export function advanceDay() { advanceTo(S.today + DAY); }
/** 不再自动领月卡；改弹上线补给 */
export function dailyTick() {
  return maybePromptLoginClaims({ force: true });
}

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
  commit(() => {
    S.today = date('2026-06-23');
    refreshVersion();
    // Phase 3 步骤 A:跳日期后回填 S.selected(activeBanners 可能变)
    ensureSelectedBanner();
  });
  // 注意：不在内部调 __render，由 main.js caller 统一调 rerenderAll()
}
