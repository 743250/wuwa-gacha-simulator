// 日常面板（4 个委托）
import { S, $, msg } from '../state.js';
import { completeCommission, resetDailyIfNeeded } from '../daily/commission.js';
import { WEEKLY_TOUR_REWARD, isWeeklyTourClaimed, claimWeeklyTour } from '../daily/weekly.js';

export function renderDaily() {
  const container = $('paneDaily');
  if (!container) return;

  // 确保有委托
  resetDailyIfNeeded();
  const cs = S.dailyCommissions || [];
  const doneCount = cs.filter(c => c.done).length;

  let html = '';

  // 概览
  html += `<div style="text-align:center;margin-bottom:14px">
    <div style="font-size:14px;letter-spacing:3px;color:var(--gold);font-weight:700">每 日 委 托</div>
    <div style="font-size:11px;color:var(--muted);margin-top:3px">4 个常规 + 1 个挑战 · 全部完成共 60 星声 · 每日重置</div>
    <div style="margin-top:6px;font-size:12px;color:var(--accent)">进度 ${doneCount} / ${cs.length}</div>
  </div>`;

  // 委托列表
  cs.forEach((c, i) => {
    const done = c.done;
    const r = c.reward;
    const rewardText = [];
    if (r.astrite) rewardText.push(`星声 +${r.astrite}`);
    if (r.exp_super) rewardText.push(`特级促剂 ×${r.exp_super}`);
    if (r.exp_high) rewardText.push(`高级促剂 ×${r.exp_high}`);
    if (r.exp_mid) rewardText.push(`中级促剂 ×${r.exp_mid}`);
    if (r.exp_low) rewardText.push(`初级促剂 ×${r.exp_low}`);
    if (r.weapon_book) rewardText.push(`武器石 ×${r.weapon_book}`);
    html += `<div style="border:1px solid ${done ? 'var(--green)' : 'var(--line)'};border-radius:8px;padding:10px 12px;margin-bottom:5px;background:${done ? 'rgba(141,230,166,.05)' : 'rgba(255,255,255,.02)'}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;color:${done ? 'var(--green)' : 'var(--text)'}">${done ? '✓ ' : ''}${c.name}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px">${rewardText.join(' · ')}</div>
        </div>
        <button class="mbtn ${done ? '' : 'gold'}" onclick="window.__doCommission(${i})" ${done ? 'disabled' : ''}>${done ? '已完成' : '完 成'}</button>
      </div>
    </div>`;
  });

  // 全部完成提示
  if (doneCount === cs.length && cs.length > 0) {
    html += '<div style="text-align:center;color:var(--gold);font-size:11px;margin-top:10px;letter-spacing:1px">🎉 今日全部完成</div>';
  }

  // 周度游历（千道门扉）
  const tourDone = isWeeklyTourClaimed();
  const r = WEEKLY_TOUR_REWARD;
  html += `<div style="margin-top:16px;border:1px solid ${tourDone ? 'var(--green)' : 'rgba(245,207,107,.4)'};border-radius:10px;padding:12px;background:${tourDone ? 'rgba(141,230,166,.05)' : 'linear-gradient(135deg,rgba(245,207,107,.06),rgba(195,155,255,.03))'}">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--gold);letter-spacing:2px">周 度 游 历</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">原千道门扉 · 每周一次性 · 周一重置</div>
      </div>
      <button class="mbtn ${tourDone ? '' : 'gold'}" onclick="window.__claimWeeklyTour()" ${tourDone ? 'disabled' : ''}>${tourDone ? '本周已领' : '一 键 领 取'}</button>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-top:8px;border-top:1px dashed var(--line);padding-top:6px">
      <span style="color:var(--gold)">星声 +${r.astrite}</span> ·
      高级促剂 ×${r.exp_high} ·
      武器石 ×${r.weapon_book} ·
      <span style="color:#9ad0f5">唤声涡纹 ×${r.lustrous}</span>
    </div>
  </div>`;

  container.innerHTML = html;
}

window.__doCommission = (idx) => {
  completeCommission(idx);
  msg('委托完成', false);
  renderDaily();
  window.__render();
};

window.__claimWeeklyTour = () => {
  const r = claimWeeklyTour();
  if (r) {
    msg(`周度游历领取 · 星声 +${r.astrite}`, false);
    renderDaily();
    window.__render();
  } else {
    msg('本周已领取');
  }
};