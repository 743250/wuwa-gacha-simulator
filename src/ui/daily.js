// 日常面板（4 个委托）
import { S, $, msg } from '../state.js';
import { completeCommission, resetDailyIfNeeded } from '../daily/commission.js';

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
    <div style="font-size:11px;color:var(--muted);margin-top:3px">点击完成 · 每日重置 · 全部完成额外 +60 星声</div>
    <div style="margin-top:6px;font-size:12px;color:var(--accent)">进度 ${doneCount} / 4</div>
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
  if (doneCount === 4) {
    html += '<div style="text-align:center;color:var(--gold);font-size:11px;margin-top:10px;letter-spacing:1px">🎉 今日全部完成，已领取额外奖励</div>';
  }

  container.innerHTML = html;
}

window.__doCommission = (idx) => {
  const extra = completeCommission(idx);
  if (extra) msg(`额外奖励 +${extra} 星声`, false);
  else msg('委托完成', false);
  renderDaily();
  window.__render();
};