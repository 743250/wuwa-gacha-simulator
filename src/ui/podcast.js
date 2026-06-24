// 先约电台 UI 面板
import { S, DAY, fmt } from '../state.js';
import {
  ensurePodcast,
  resetPodcastDailyIfNeeded,
  resetPodcastWeeklyIfNeeded,
  taskState,
  PODCAST_REWARDS,
  PODCAST_MAX_LEVEL,
  PODCAST_EXP_PER_LEVEL,
  PODCAST_BUY_LEVEL_COST
} from '../podcast/core.js';
import { PODCAST_TASKS } from '../data/podcast-tasks.js';
import { phases } from '../data/phases.js';

// 把奖励对象转成紧凑图标 + 数量（每个 cell 放 1-2 个）
function rewardChips(r) {
  if (!r) return '';
  const out = [];
  if (r.astrite)             out.push(`<span class="rc rc-astrite">✦${r.astrite}</span>`);
  if (r.lunite)              out.push(`<span class="rc rc-lunite">月${r.lunite}</span>`);
  if (r.radiant)             out.push(`<span class="rc rc-radiant">浮${r.radiant}</span>`);
  if (r.forging)             out.push(`<span class="rc rc-forging">铸${r.forging}</span>`);
  if (r.lustrous)            out.push(`<span class="rc rc-lustrous">唤${r.lustrous}</span>`);
  if (r.exp_low)             out.push(`<span class="rc">初${r.exp_low}</span>`);
  if (r.exp_mid)             out.push(`<span class="rc">中${r.exp_mid}</span>`);
  if (r.exp_high)            out.push(`<span class="rc">高${r.exp_high}</span>`);
  if (r.exp_super)           out.push(`<span class="rc rc-super">特${r.exp_super}</span>`);
  if (r.weapon_book)         out.push(`<span class="rc">石${r.weapon_book}</span>`);
  if (r.crystal_solvent)     out.push(`<span class="rc">溶${r.crystal_solvent}</span>`);
  if (r.condensed_waveplate) out.push(`<span class="rc">波${r.condensed_waveplate}</span>`);
  if (r.weaponBox)           out.push(`<span class="rc rc-box">★箱</span>`);
  if (r.refineStone)         out.push(`<span class="rc">银${r.refineStone}</span>`);
  if (r.cosmetic)            out.push(`<span class="rc rc-cos">头像</span>`);
  return out.join('');
}

// 给整个 cell 生成 tooltip 文本（完整名 + 数量）
function rewardTipText(r) {
  if (!r) return '无奖励';
  const out = [];
  if (r.astrite)             out.push(`星声 ×${r.astrite}`);
  if (r.lunite)              out.push(`月相 ×${r.lunite}`);
  if (r.radiant)             out.push(`浮金波纹 ×${r.radiant}`);
  if (r.forging)             out.push(`铸潮波纹 ×${r.forging}`);
  if (r.lustrous)            out.push(`唤声涡纹 ×${r.lustrous}`);
  if (r.exp_low)             out.push(`初级共鸣促剂 ×${r.exp_low}`);
  if (r.exp_mid)             out.push(`中级共鸣促剂 ×${r.exp_mid}`);
  if (r.exp_high)            out.push(`高级共鸣促剂 ×${r.exp_high}`);
  if (r.exp_super)           out.push(`特级共鸣促剂 ×${r.exp_super}`);
  if (r.weapon_book)         out.push(`武器突破石 ×${r.weapon_book}`);
  if (r.crystal_solvent)     out.push(`结晶溶剂 ×${r.crystal_solvent}`);
  if (r.condensed_waveplate) out.push(`凝缩波片 ×${r.condensed_waveplate}`);
  if (r.weaponBox)           out.push(`4★ 武器自选箱`);
  if (r.refineStone)         out.push(`烙金银杏 ×${r.refineStone}`);
  if (r.cosmetic)            out.push(r.cosmetic);
  return out.join(' · ');
}

// 渲染单个等级方块
function renderLevelCell(lv) {
  const cur = S.podcast.level;
  const isCurrent = lv === cur + 1;
  const reached = lv <= cur;
  const lockedPaid = !S.podcast.paid;
  const r = PODCAST_REWARDS[lv - 1];
  const freeClaimed = S.podcast.claimedFree.includes(lv);
  const paidClaimed = S.podcast.claimedPaid.includes(lv);

  // 免费轨格
  let freeCls = 'pc-cell-free tip';
  let freeHTML = rewardChips(r.free);
  if (freeClaimed) freeCls += ' claimed';
  else if (reached) freeCls += ' canclaim';
  const freeClick = (reached && !freeClaimed) ? `onclick="window.__podcastClaim('free', ${lv})"` : '';
  const freeTip = `data-tip="<b>Lv ${lv} · 免费轨</b><br>${rewardTipText(r.free)}"`;

  // 付费轨格
  let paidCls = 'pc-cell-paid tip';
  let paidHTML = rewardChips(r.paid);
  if (paidClaimed) paidCls += ' claimed';
  else if (reached && !lockedPaid) paidCls += ' canclaim';
  else if (lockedPaid) paidCls += ' locked';
  const paidClick = (reached && !paidClaimed && !lockedPaid) ? `onclick="window.__podcastClaim('paid', ${lv})"` : '';
  const paidTipText = lockedPaid
    ? `<b>Lv ${lv} · 付费轨 🔒</b><br>${rewardTipText(r.paid)}<br><span style="color:var(--gold)">购买内幕频道后可领取</span>`
    : `<b>Lv ${lv} · 付费轨</b><br>${rewardTipText(r.paid)}`;
  const paidTip = `data-tip="${paidTipText}"`;

  return `<div class="pc-col ${isCurrent ? 'pc-cur' : ''} ${reached ? 'pc-reached' : ''}">
    <div class="${freeCls}" ${freeClick} ${freeTip}>
      <div class="rw">${freeHTML || '<span class="dim">—</span>'}</div>
    </div>
    <div class="pc-lv">${lv}</div>
    <div class="${paidCls}" ${paidClick} ${paidTip}>
      <div class="rw">${paidHTML || '<span class="dim">—</span>'}</div>
      ${lockedPaid ? '<div class="lock-icon">🔒</div>' : ''}
    </div>
  </div>`;
}

// 任务区
function renderTasks() {
  const buckets = [
    { key: 'daily',  title: '每日任务',  list: PODCAST_TASKS.daily  },
    { key: 'weekly', title: '每周任务',  list: PODCAST_TASKS.weekly },
    { key: 'period', title: '本期任务',  list: PODCAST_TASKS.period }
  ];
  return buckets.map(b => {
    const items = b.list.map(t => {
      const st = taskState(t.id);
      const pct = Math.min(100, Math.round(st.progress / st.target * 100));
      const cls = st.done ? 'pct-done' : '';
      return `<div class="pct ${cls}">
        <div class="pct-name">${t.name}</div>
        <div class="pct-bar"><div class="pct-fill" style="width:${pct}%"></div></div>
        <div class="pct-info">${Math.min(st.progress, st.target)}/${st.target} · +${t.exp} EXP ${st.done ? '✓' : ''}</div>
      </div>`;
    }).join('');
    const doneCount = b.list.filter(t => taskState(t.id).done).length;
    return `<div class="pct-bucket">
      <div class="pct-bucket-head">${b.title} <span class="dim">(${doneCount}/${b.list.length})</span></div>
      <div class="pct-list">${items}</div>
    </div>`;
  }).join('');
}

export function renderPodcast() {
  const el = document.getElementById('panePodcast');
  if (!el) return;

  ensurePodcast();
  resetPodcastDailyIfNeeded();
  resetPodcastWeeklyIfNeeded();

  const p = S.podcast;
  const expPct = p.level >= PODCAST_MAX_LEVEL ? 100 : Math.round(p.exp / PODCAST_EXP_PER_LEVEL * 100);

  // 计算当前期到期时间：取「版本号匹配 + 包含今天」的 phase 的 end；如果今天不在某 phase 区间，
  // 取版本号匹配的所有 phase 中最晚的 end。剩余天数 = ceil((end - today)/DAY)
  const matched = phases.filter(ph => ph.v === p.version);
  let endTs = 0;
  const inOne = matched.find(ph => S.today >= ph.start && S.today < ph.end);
  if (inOne) endTs = matched.filter(ph => ph.end >= inOne.end).reduce((m, ph) => Math.max(m, ph.end), 0);
  else if (matched.length) endTs = matched.reduce((m, ph) => Math.max(m, ph.end), 0);
  const daysLeft = endTs ? Math.max(0, Math.ceil((endTs - S.today) / DAY)) : 0;
  const expireHtml = endTs
    ? `<span class="pc-expire" title="本期电台剩余天数">${daysLeft > 0
        ? `剩余 <b>${daysLeft}</b> 天`
        : `<span style="color:var(--red)">本期已结束 · 等待版本切换</span>`}</span>`
    : '';

  const cells = [];
  for (let lv = 1; lv <= PODCAST_MAX_LEVEL; lv++) cells.push(renderLevelCell(lv));

  el.innerHTML = `
    <div class="pc-head">
      <div class="pc-title">📻 先约电台 · 第 ${p.version} 期 ${expireHtml}</div>
      <div class="pc-purchase">
        ${p.paid
          ? `<span class="tag-on">已订阅内幕频道</span>`
          : `<button class="mbtn gold" onclick="window.buyShop('bp_basic')">¥68 解锁内幕频道</button>`}
        ${p.premium
          ? `<span class="tag-on">寰宇频道</span>`
          : `<button class="mbtn" onclick="window.buyShop('bp_premium')">¥128 寰宇频道</button>`}
      </div>
    </div>

    <div class="pc-progress">
      <div class="pc-lv-big">Lv <b>${p.level}</b> / ${PODCAST_MAX_LEVEL}</div>
      <div class="pc-exp-bar"><div class="pc-exp-fill" style="width:${expPct}%"></div></div>
      <div class="pc-exp-num">${p.exp.toLocaleString()} / ${PODCAST_EXP_PER_LEVEL.toLocaleString()} EXP</div>
      <div class="pc-actions">
        <button class="mbtn" onclick="window.__podcastBuyLevel(1)">买 1 级 (¥声 ${PODCAST_BUY_LEVEL_COST})</button>
        <button class="mbtn" onclick="window.__podcastBuyLevel(5)">买 5 级 (¥声 ${PODCAST_BUY_LEVEL_COST*5})</button>
        <button class="mbtn gold" onclick="window.__podcastClaimAll()">一键领取已达成</button>
      </div>
    </div>

    <div class="pc-track-label">
      <div class="pc-label-free">免费 · 大众频道</div>
      <div class="pc-label-paid">付费 · 内幕频道 ${p.paid ? '' : '🔒'}</div>
    </div>
    <div class="pc-track-scroll">
      <div class="pc-track-inner">${cells.join('')}</div>
    </div>

    <div class="pc-tasks">
      ${renderTasks()}
    </div>
  `;

  // 滚动到当前等级附近
  requestAnimationFrame(() => {
    const inner = el.querySelector('.pc-track-inner');
    const curCell = el.querySelector('.pc-col.pc-cur');
    if (inner && curCell) {
      const scroll = el.querySelector('.pc-track-scroll');
      const offset = curCell.offsetLeft - scroll.clientWidth / 2 + curCell.clientWidth / 2;
      scroll.scrollLeft = Math.max(0, offset);
    }
  });
}

// 暴露给 onclick
window.__podcastClaim = (track, lv) => {
  if (track === 'free') window.__podcast.claimFree(lv);
  else window.__podcast.claimPaid(lv);
  renderPodcast();
  window.__render && window.__render();
};
window.__podcastClaimAll = () => {
  window.__podcast.claimAll();
  renderPodcast();
  window.__render && window.__render();
};
window.__podcastBuyLevel = (n) => {
  if (window.__podcast.buyLevel(n)) {
    renderPodcast();
    window.__render && window.__render();
  }
};
