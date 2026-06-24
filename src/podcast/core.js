// 先约电台核心：经验/任务/领奖/版本重置
import { S, msg, fmt } from '../state.js';
import { PODCAST_TASKS, findTask } from '../data/podcast-tasks.js';
import {
  PODCAST_REWARDS,
  PODCAST_MAX_LEVEL,
  PODCAST_EXP_PER_LEVEL,
  PODCAST_BUY_LEVEL_COST,
  WEAPON_BOX_OPTIONS
} from '../data/podcast-rewards.js';
import { activePhase } from '../gacha/core.js';
import { openModal } from '../modal.js';

// 确保 S.podcast 存在（旧存档兼容）
export function ensurePodcast() {
  if (!S.podcast) {
    S.podcast = {
      version: (activePhase()[0] || {}).v || '1.0',
      exp: 0,
      level: 0,
      paid: false,
      premium: false,
      claimedFree: [],
      claimedPaid: [],
      tasks: { daily: {}, weekly: {}, period: {} },
      lastDailyReset: '',
      lastWeeklyReset: ''
    };
  }
  // 字段兜底
  if (!S.podcast.tasks) S.podcast.tasks = { daily: {}, weekly: {}, period: {} };
  ['daily','weekly','period'].forEach(b => {
    if (!S.podcast.tasks[b]) S.podcast.tasks[b] = {};
  });
  if (!S.podcast.claimedFree) S.podcast.claimedFree = [];
  if (!S.podcast.claimedPaid) S.podcast.claimedPaid = [];
}

// ============ 经验/等级 ============

// 加经验，自动升级（不自动领奖，领奖由玩家点击）
export function addExp(amount) {
  ensurePodcast();
  if (S.podcast.level >= PODCAST_MAX_LEVEL) return;
  S.podcast.exp += amount;
  while (S.podcast.level < PODCAST_MAX_LEVEL && S.podcast.exp >= PODCAST_EXP_PER_LEVEL) {
    S.podcast.exp -= PODCAST_EXP_PER_LEVEL;
    S.podcast.level++;
  }
  if (S.podcast.level >= PODCAST_MAX_LEVEL) {
    S.podcast.level = PODCAST_MAX_LEVEL;
    S.podcast.exp = 0;
  }
}

// 100 星声买 1 级
export function buyLevel(n = 1) {
  ensurePodcast();
  if (S.podcast.level >= PODCAST_MAX_LEVEL) {
    msg('已满级');
    return false;
  }
  const maxBuyable = Math.min(n, PODCAST_MAX_LEVEL - S.podcast.level);
  const cost = maxBuyable * PODCAST_BUY_LEVEL_COST;
  if (S.astrite < cost) {
    msg(`星声不足（需 ${cost}）`);
    return false;
  }
  S.astrite -= cost;
  S.podcast.level += maxBuyable;
  S.podcast.exp = 0;
  msg(`+${maxBuyable} 级 · 消耗 ${cost} 星声`, false);
  return true;
}

// ============ 任务 ============

// 记录任务计数；满足 target 时给经验（只发放一次）
// kind: 'inc'（默认，累计 +n）/ 'set'（直接置为 target，单次型）
export function progressTask(id, n = 1) {
  ensurePodcast();
  const def = findTask(id);
  if (!def) return;
  const bucket = S.podcast.tasks[def.bucket];
  const cur = bucket[id];
  // cur 可能是数字 progress，或 true 表示已完成
  if (cur === true) return;
  const next = (typeof cur === 'number' ? cur : 0) + n;
  if (next >= def.target) {
    bucket[id] = true;
    addExp(def.exp);
  } else {
    bucket[id] = next;
  }
}

// 检查任务进度（UI 用）
export function taskState(id) {
  ensurePodcast();
  const def = findTask(id);
  if (!def) return null;
  const v = S.podcast.tasks[def.bucket][id];
  if (v === true) return { done: true, progress: def.target, target: def.target, ...def };
  return { done: false, progress: typeof v === 'number' ? v : 0, target: def.target, ...def };
}

// 每日重置（每天首次进入时调用）
export function resetPodcastDailyIfNeeded() {
  ensurePodcast();
  const today = fmt(S.today);
  if (S.podcast.lastDailyReset !== today) {
    S.podcast.tasks.daily = {};
    S.podcast.lastDailyReset = today;
  }
}

// 每周重置（周一）
export function resetPodcastWeeklyIfNeeded() {
  ensurePodcast();
  const d = new Date(S.today);
  const dayOfWeek = d.getUTCDay();
  const daysFromMon = (dayOfWeek + 6) % 7;
  const mondayMs = d.getTime() - daysFromMon * 86400000;
  const mondayKey = new Date(mondayMs).toISOString().slice(0, 10);
  if (S.podcast.lastWeeklyReset !== mondayKey) {
    S.podcast.tasks.weekly = {};
    S.podcast.lastWeeklyReset = mondayKey;
  }
}

// 版本切换：清空一切
export function resetPodcastForVersion(newVersion) {
  ensurePodcast();
  S.podcast.version = newVersion;
  S.podcast.exp = 0;
  S.podcast.level = 0;
  S.podcast.paid = false;
  S.podcast.premium = false;
  S.podcast.claimedFree = [];
  S.podcast.claimedPaid = [];
  S.podcast.tasks = { daily: {}, weekly: {}, period: {} };
  // 不重置 lastDailyReset/lastWeeklyReset，让今日/本周日常仍可完成
}

// ============ 领奖 ============

// 把奖励物品发到背包/资源里
function applyReward(r) {
  if (r.astrite)             S.astrite += r.astrite;
  if (r.lunite)              S.lunite += r.lunite;
  if (r.radiant)             S.radiant += r.radiant;
  if (r.forging)             S.forging += r.forging;
  if (r.lustrous)            S.lustrous += r.lustrous;
  if (r.dream)               S.dream = (S.dream || 0) + r.dream;
  if (r.mirage)              S.mirage = (S.mirage || 0) + r.mirage;
  if (r.exp_low)             S.materials.exp_low  = (S.materials.exp_low  || 0) + r.exp_low;
  if (r.exp_mid)             S.materials.exp_mid  = (S.materials.exp_mid  || 0) + r.exp_mid;
  if (r.exp_high)            S.materials.exp_high = (S.materials.exp_high || 0) + r.exp_high;
  if (r.exp_super)           S.materials.exp_super= (S.materials.exp_super|| 0) + r.exp_super;
  if (r.weapon_book)         S.materials.weapon_book = (S.materials.weapon_book || 0) + r.weapon_book;
  if (r.crystal_solvent)     S.materials.crystal_solvent = (S.materials.crystal_solvent || 0) + r.crystal_solvent;
  if (r.condensed_waveplate) {
    const cur = S.materials.condensed_waveplate || 0;
    S.materials.condensed_waveplate = Math.min(5, cur + r.condensed_waveplate);
  }
  if (r.weaponBox)           openWeaponBox();
  if (r.refineStone)         openRefineStonePicker(r.refineStone);
  // cosmetic 仅作展示，无数值
}

// 领取免费轨 lv 级奖励
export function claimFree(lv) {
  ensurePodcast();
  if (lv > S.podcast.level) { msg('等级未达'); return false; }
  if (S.podcast.claimedFree.includes(lv)) { msg('已领取'); return false; }
  const r = PODCAST_REWARDS[lv - 1]?.free;
  if (!r) return false;
  applyReward(r);
  S.podcast.claimedFree.push(lv);
  return true;
}

// 领取付费轨 lv 级奖励
export function claimPaid(lv) {
  ensurePodcast();
  if (!S.podcast.paid) { msg('需要购买内幕频道'); return false; }
  if (lv > S.podcast.level) { msg('等级未达'); return false; }
  if (S.podcast.claimedPaid.includes(lv)) { msg('已领取'); return false; }
  const r = PODCAST_REWARDS[lv - 1]?.paid;
  if (!r) return false;
  applyReward(r);
  S.podcast.claimedPaid.push(lv);
  return true;
}

// 一键领取已达成的全部奖励
export function claimAll() {
  ensurePodcast();
  let count = 0;
  for (let lv = 1; lv <= S.podcast.level; lv++) {
    if (!S.podcast.claimedFree.includes(lv)) {
      applyReward(PODCAST_REWARDS[lv - 1].free);
      S.podcast.claimedFree.push(lv);
      count++;
    }
    if (S.podcast.paid && !S.podcast.claimedPaid.includes(lv)) {
      applyReward(PODCAST_REWARDS[lv - 1].paid);
      S.podcast.claimedPaid.push(lv);
      count++;
    }
  }
  if (count > 0) msg(`一键领取 ${count} 项奖励`, false);
  else msg('没有可领取的奖励');
  return count;
}

// ============ 内幕/寰宇频道购买入口 ============

// 在商店购买后调用：解锁付费轨
export function unlockPaid() {
  ensurePodcast();
  S.podcast.paid = true;
}

// 寰宇频道：内幕 + 立即 +10 级
export function unlockPremium() {
  ensurePodcast();
  S.podcast.paid = true;
  S.podcast.premium = true;
  const before = S.podcast.level;
  S.podcast.level = Math.min(PODCAST_MAX_LEVEL, S.podcast.level + 10);
  // 额外材料：+8 浮金 +4 唤声 +4 特级促剂（贴近官方寰宇频道附赠）
  S.radiant += 8;
  S.lustrous += 4;
  S.materials.exp_super = (S.materials.exp_super || 0) + 4;
  msg(`寰宇频道激活 · Lv ${before} → ${S.podcast.level}`, false);
}

// ============ 4★ 武器自选箱 ============

function openWeaponBox() {
  const buttons = WEAPON_BOX_OPTIONS.map(name =>
    `<button class="mbtn" style="margin:4px;min-width:90px" onclick="window.__radioPickWeapon('${name}')">${name}</button>`
  ).join('');
  openModal({
    title: '先约电台 · 4★ 武器自选箱',
    body: `<div style="color:var(--muted);font-size:12px;margin-bottom:10px">从下面 5 把 4 星武器中任选 1 把（精炼直接 +1，若已 5 精则转化为养成料补偿）</div>
<div style="text-align:center">${buttons}</div>`,
    actions: [{ label: '稍后再选（保留入口）', cls: '', fn: () => {
      // 用户暂不选择 → 把"待领"标记存进 state，UI 里给个红点
      if (!S.podcast.pendingWeaponBox) S.podcast.pendingWeaponBox = 0;
      S.podcast.pendingWeaponBox++;
    }}]
  });
}

window.__radioPickWeapon = (name) => {
  // 给一把该武器：若已有则精炼 +1，否则新建 lv1 r1
  if (!S.weapons[name]) {
    S.weapons[name] = { level: 1, refine: 1, equipped: null };
    msg(`获得 ${name} ×1`, false);
  } else {
    if (S.weapons[name].refine < 5) {
      S.weapons[name].refine++;
      msg(`${name} 精炼 +1（现 R${S.weapons[name].refine}）`, false);
    } else {
      // 已 5 精，补偿 8 万经验等价物 → 2 个特级促剂
      S.materials.exp_super = (S.materials.exp_super || 0) + 2;
      msg(`${name} 已 5 精 · 补偿特级促剂 ×2`, false);
    }
  }
  document.getElementById('modal').classList.remove('on');
  window.__render && window.__render();
  window.__rerenderAll && window.__rerenderAll();
};

// ============ 烙金银杏（精炼石）====
// 用法：当玩家持有"先约电台 4★ 自选武器"中的某把时，可点击精炼石给那把武器 +1 精
// 简化为：弹窗让玩家从已持有的自选武器中挑一把
function openRefineStonePicker(count) {
  const owned = WEAPON_BOX_OPTIONS.filter(n => S.weapons[n]);
  if (owned.length === 0) {
    // 还没买武器箱 → 暂存
    if (!S.podcast.pendingRefine) S.podcast.pendingRefine = 0;
    S.podcast.pendingRefine += count;
    msg(`烙金银杏 +${count} 暂存（需先领 4★ 自选武器）`, false);
    return;
  }
  // 默认直接给第一把武器精炼 +count（简化）
  const target = owned[0];
  const w = S.weapons[target];
  const add = Math.min(count, 5 - (w.refine || 1));
  if (add > 0) {
    w.refine = (w.refine || 1) + add;
    msg(`${target} 精炼 +${add}（现 R${w.refine}）`, false);
  } else {
    S.materials.exp_super = (S.materials.exp_super || 0) + count * 2;
    msg(`${target} 已 5 精 · 补偿特级促剂 ×${count * 2}`, false);
  }
}

// 暴露到 window 供 onclick 使用
window.__podcast = {
  claimFree, claimPaid, claimAll, buyLevel
};

export { PODCAST_REWARDS, PODCAST_MAX_LEVEL, PODCAST_EXP_PER_LEVEL, PODCAST_BUY_LEVEL_COST };
