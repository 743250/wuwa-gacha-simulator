// 深塔面板
import { S, $ } from '../state.js';
import { ABYSS_FLOORS } from '../daily/abyss.js';
import { parseEnemyStr } from '../battle/dungeon.js';
import { ENEMIES } from '../battle/enemies.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import './battle.js';   // 副作用：注册 window.__startAbyss

function formatEnemies(enemyStrs) {
  return enemyStrs.map(s => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    if (!e) return `${p.name}${p.count > 1 ? '×' + p.count : ''}`;
    const ec = ELEMENT_COLOR[e.element] || '#fff';
    return `<span style="color:${ec}">${p.name}</span>${p.count > 1 ? `<span style="color:var(--muted)">×${p.count}</span>` : ''}`;
  }).join(' · ');
}

export function renderAbyss() {
  const container = $('paneAbyss');
  if (!container) return;
  const teamCount = (S.team || []).filter(Boolean).length;
  const stars = S.abyss?.stars || {};
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);

  let html = '';

  html += `<div style="text-align:center;margin-bottom:14px;padding:12px;border:1px solid rgba(245,207,107,.3);border-radius:10px;background:linear-gradient(135deg,rgba(245,207,107,.06),rgba(195,155,255,.03))">
    <div style="font-size:15px;letter-spacing:4px;color:var(--gold);font-weight:700">逆 境 深 塔</div>
    <div style="font-size:11px;color:var(--muted);margin-top:5px;line-height:1.6">
      10 层逐层挑战 · 每月重置一次（点"下版本"会触发）<br>
      <span style="color:var(--accent)">通关 = ★1</span> ·
      <span style="color:var(--accent)">满血通关 = ★2</span> ·
      <span style="color:var(--gold)">速通 = ★3</span>
    </div>
    <div style="margin-top:8px;font-size:14px;color:var(--gold);letter-spacing:2px">★ ${totalStars} / 30</div>
  </div>`;

  if (teamCount === 0) {
    html += '<div style="color:var(--red);text-align:center;padding:10px;font-size:12px;border:1px dashed var(--red);border-radius:8px;margin-bottom:12px">⚠ 先去【编队】面板组队</div>';
  }

  // 10 层网格
  ABYSS_FLOORS.forEach((f, i) => {
    const floor = i + 1;
    const earned = stars[floor] || 0;
    const isLocked = floor > 1 && (stars[floor - 1] || 0) === 0;
    const isCleared = earned >= 3;
    const starHtml = '★'.repeat(earned) + '☆'.repeat(3 - earned);
    const tag = floor <= 4 ? '初级' : floor <= 7 ? '中级' : '高级';
    const tagColor = floor <= 4 ? 'var(--green)' : floor <= 7 ? 'var(--accent)' : 'var(--red)';
    html += `<div style="border:1px solid ${isCleared ? 'rgba(245,207,107,.5)' : 'var(--line)'};border-radius:10px;padding:11px 13px;margin-bottom:6px;background:${isCleared ? 'rgba(245,207,107,.05)' : 'rgba(255,255,255,.02)'};opacity:${isLocked ? '.4' : '1'};border-bottom:2px solid ${isCleared ? 'rgba(245,207,107,.5)' : 'var(--line)'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:700;letter-spacing:1px">第 ${floor} 层</span>
            <span style="font-size:10px;color:${tagColor};letter-spacing:1px">${tag}</span>
            <span style="font-size:12px;color:var(--gold)">${starHtml}</span>
          </div>
        </div>
        <button class="mbtn gold" onclick="window.__startAbyss(${floor})" ${isLocked || teamCount === 0 ? 'disabled' : ''}>${isLocked ? '🔒 锁定' : '挑 战'}</button>
      </div>
      <div style="font-size:10px;color:var(--muted);line-height:1.6;border-top:1px dashed var(--line);padding-top:5px">
        <div>⚔ <span style="color:var(--dim)">敌人：</span>${formatEnemies(f.enemies)}</div>
        <div style="margin-top:2px">🎯 <span style="color:var(--dim)">★2 条件：</span><span style="color:var(--accent)">${f.turnLimit} 回合内</span> · <span style="color:var(--accent)">队伍 HP ≥ ${(f.hpThreshold*100).toFixed(0)}%</span></div>
        <div style="margin-top:2px">🎁 <span style="color:var(--dim)">奖励：</span><span style="color:var(--gold)">${f.baseReward} 星声</span><span style="color:var(--dim)"> · 满星额外</span><span style="color:var(--gold)">+40 星声</span></div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}