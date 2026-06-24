// 冥歌海墟面板
import { S, $ } from '../state.js';
import { WASTES_STAGES, STAR_CRITERIA, FULL_CLEAR_BONUS, getWastesStars } from '../daily/wastes.js';
import { parseEnemyStr } from '../battle/dungeon.js';
import { getCombatTeamNames } from '../battle/combat.js';
import { ENEMIES } from '../battle/enemies.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import { activePhase } from '../gacha/core.js';
import './battle.js';   // 副作用：注册 window.__startWastes

function formatEnemies(enemyStrs) {
  return enemyStrs.map(s => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    if (!e) return `${p.name}${p.count > 1 ? '×' + p.count : ''}`;
    const ec = ELEMENT_COLOR[e.element] || '#fff';
    return `<span style="color:${ec}">${p.name}</span>${p.count > 1 ? `<span style="color:var(--muted)">×${p.count}</span>` : ''}`;
  }).join(' · ');
}

export function renderWastes() {
  const container = $('paneWastes');
  if (!container) return;
  const teamCount = getCombatTeamNames().length;
  const stars = getWastesStars();
  const totalStars = WASTES_STAGES.reduce((a, s) => a + (stars[s.id] || 0), 0);
  const maxStars = WASTES_STAGES.length * 3;
  const v = (activePhase()[0] || {}).v || '未知';
  const bonusTaken = S.wastes && S.wastes.fullClearBonusTaken;

  let html = '';

  html += `<div style="text-align:center;margin-bottom:14px;padding:12px;border:1px solid rgba(195,155,255,.3);border-radius:10px;background:linear-gradient(135deg,rgba(195,155,255,.06),rgba(141,230,166,.03))">
    <div style="font-size:15px;letter-spacing:4px;color:#c39bff;font-weight:700">冥 歌 海 墟</div>
    <div style="font-size:11px;color:var(--muted);margin-top:5px;line-height:1.7">
      <span style="color:var(--accent)">★1：${STAR_CRITERIA.oneStar.turn} 回合内通关</span> ·
      <span style="color:var(--accent)">★2：${STAR_CRITERIA.twoStar.turn} 回合内 + HP ≥ ${(STAR_CRITERIA.twoStar.hp*100).toFixed(0)}%</span> ·
      <span style="color:var(--gold)">★3：${STAR_CRITERIA.threeStar.turn} 回合内 + HP ≥ ${(STAR_CRITERIA.threeStar.hp*100).toFixed(0)}%</span>
    </div>
    <div style="margin-top:8px;font-size:12px;color:var(--gold)">★ ${totalStars} / ${maxStars} · 当前版本 ${v}</div>
    <div style="margin-top:4px;font-size:10px;color:var(--muted)">不消耗结晶波片 · 版本切换时重置 · 全清额外奖励 +${FULL_CLEAR_BONUS} 星声${bonusTaken ? '（已领）' : ''}</div>
  </div>`;

  if (teamCount === 0) {
    html += '<div style="color:var(--red);text-align:center;padding:10px;font-size:12px;border:1px dashed var(--red);border-radius:8px;margin-bottom:12px">⚠ 编队为空或队员已失效，先去【编队】面板组队</div>';
  }

  WASTES_STAGES.forEach((s, i) => {
    const earned = stars[s.id] || 0;
    const isLocked = i > 0 && (stars[WASTES_STAGES[i - 1].id] || 0) === 0;
    const isCleared = earned >= 3;
    const starHtml = '★'.repeat(earned) + '☆'.repeat(3 - earned);
    html += `<div style="border:1px solid ${isCleared ? 'rgba(195,155,255,.5)' : 'var(--line)'};border-radius:10px;padding:11px 13px;margin-bottom:6px;background:${isCleared ? 'rgba(195,155,255,.05)' : 'rgba(255,255,255,.02)'};opacity:${isLocked ? '.4' : '1'};border-bottom:2px solid ${isCleared ? 'rgba(195,155,255,.5)' : 'var(--line)'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:700;letter-spacing:1px">${s.name}</span>
            <span style="font-size:12px;color:var(--gold)">${starHtml}</span>
          </div>
        </div>
        <button class="mbtn gold" onclick="window.__startWastes('${s.id}')" ${isLocked || teamCount === 0 ? 'disabled' : ''}>${isLocked ? '🔒 锁定' : '挑 战'}</button>
      </div>
      <div style="font-size:10px;color:var(--muted);line-height:1.6;border-top:1px dashed var(--line);padding-top:5px">
        <div>⚔ <span style="color:var(--dim)">敌人：</span>${formatEnemies(s.enemies)}</div>
        <div style="margin-top:2px">🎁 <span style="color:var(--dim)">满星奖励：</span><span style="color:var(--gold)">${s.baseReward} 星声</span> · <span style="color:var(--muted)">补星只发新增差额</span> · <span style="color:var(--gold)">★3 特级促剂×2 + 武器石×4</span></div>
      </div>
    </div>`;
  });

  container.innerHTML = html;
}
