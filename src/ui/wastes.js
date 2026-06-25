// 冥歌海墟面板（积分制 + 信物选择 + 焚潮）
import { S, $ } from '../state.js';
import { WASTES_STAGES, STAR_CRITERIA, SCORE_TIERS, WASTES_TOKENS, getWastesStars, getWastesMaxScore, pickToken, getPickedTokens, nextWastesResetDate, resetWastesIfNeeded } from '../daily/wastes.js';
import { parseEnemyStr } from '../battle/dungeon.js';
import { getCombatTeamNames } from '../battle/combat.js';
import { ENEMIES } from '../battle/enemies.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import { activePhase } from '../gacha/core.js';
import { openModal } from '../modal.js';
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

// 信物选择弹窗
function openTokenPicker(stageId, callback) {
  const picked = getPickedTokens()[stageId] || [];
  const available = WASTES_TOKENS.filter(t => !picked.includes(t.id));
  if (available.length === 0) { callback(); return; }

  const body = `<div style="font-size:11px;color:var(--muted);margin-bottom:10px">为 <b style="color:var(--gold)">${WASTES_STAGES.find(s => s.id === stageId)?.name || stageId}</b> 选择信物（可多选叠加 · 已选 ${picked.length} 个）</div>
    <div style="display:grid;gap:6px">${available.map(t => `
      <div style="border:1px solid var(--line);border-radius:8px;padding:9px 12px;cursor:pointer;background:rgba(255,255,255,.02)"
        onclick="window.__wastesPickToken('${stageId}','${t.id}')">
        <div style="font-size:13px;font-weight:600">${t.icon} ${t.name}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${t.desc}</div>
      </div>`).join('')}
    </div>
    ${picked.length > 0 ? `<div style="margin-top:8px;font-size:10px;color:var(--green)">已选：${picked.map(id => WASTES_TOKENS.find(t => t.id === id)?.name || id).join(' · ')}</div>` : ''}
    <button class="mbtn gold" style="width:100%;margin-top:8px" onclick="window.__wastesSkipToken('${stageId}')">直接开战（不选信物）</button>`;

  openModal({
    title: '选择信物',
    body,
    actions: [{ label: '取消', cls: '', fn: () => {} }]
  });
}

// 信物选择回调
window.__wastesPickToken = (stageId, tokenId) => {
  if (pickToken(stageId, tokenId)) {
    // 重新打开选择器（可能还有未选信物）
    setTimeout(() => openTokenPicker(stageId, () => window.__startWastes(stageId)), 50);
  }
};
window.__wastesSkipToken = (stageId) => {
  document.getElementById('modal').classList.remove('on');
  window.__startWastes(stageId);
};

// 包装 __startWastes，先弹信物选择
const _origStartWastes = window.__startWastes;
window.__startWastesWithTokens = (stageId) => {
  const picked = getPickedTokens()[stageId] || [];
  if (picked.length === 0 && WASTES_TOKENS.length > 0) {
    openTokenPicker(stageId, () => _origStartWastes(stageId));
  } else {
    _origStartWastes(stageId);
  }
};

export function renderWastes() {
  const container = $('paneWastes');
  if (!container) return;
  const teamCount = getCombatTeamNames().length;
  const scores = getWastesStars();
  const cumulative = getWastesMaxScore();
  const v = (activePhase()[0] || {}).v || '未知';
  const pickedAll = getPickedTokens();

  // 重置倒计时
  resetWastesIfNeeded();
  const resetDate = nextWastesResetDate();
  let resetLine = '';
  if (resetDate) {
    const daysLeft = Math.max(0, Math.ceil((resetDate - S.today) / 86400000));
    const dateStr = new Date(resetDate).toISOString().slice(0, 10);
    resetLine = `<div style="font-size:10px;color:var(--gold);margin-top:3px">⏳ 海墟下次重置：${dateStr}${daysLeft > 0 ? `（剩余 ${daysLeft} 天）` : '（即将重置）'}</div>`;
  }

  let html = '';

  html += `<div style="text-align:center;margin-bottom:14px;padding:12px;border:1px solid rgba(195,155,255,.3);border-radius:10px;background:linear-gradient(135deg,rgba(195,155,255,.06),rgba(141,230,166,.03))">
    <div style="font-size:15px;letter-spacing:4px;color:#c39bff;font-weight:700">冥 歌 海 墟</div>
    <div style="font-size:11px;color:var(--muted);margin-top:4px;line-height:1.7">
      🔥 焚潮：每 3 回合触发 · 全场 +30% 伤害 2 回合 · 选「焚潮之印」可加速
    </div>
    <div style="margin-top:6px;font-size:12px;">
      <span style="color:#c39bff">累计积分 <b style="font-size:16px">${cumulative.toLocaleString()}</b></span>
      <span style="color:var(--muted);margin-left:8px">版本 ${v} · 不消耗波片 · 档位领星声</span>
    </div>
    ${resetLine}
  </div>`;

  // 积分档位条
  html += '<div style="display:flex;gap:8px;margin-bottom:14px">';
  SCORE_TIERS.forEach(tier => {
    const reached = cumulative >= tier.score;
    const claimed = S.wastes?.tiersClaimed?.includes(tier.score);
    html += `<div style="flex:1;border:1px solid ${claimed ? 'var(--green)' : reached ? 'var(--gold)' : 'var(--line)'};border-radius:8px;padding:8px;text-align:center;background:${claimed ? 'rgba(141,230,166,.08)' : reached ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)'};font-size:10px">
      <div style="color:${reached ? 'var(--gold)' : 'var(--dim)'};font-weight:700">${tier.name}</div>
      <div style="color:var(--muted);margin-top:2px">${tier.score.toLocaleString()} 分</div>
      <div style="color:${claimed ? 'var(--green)' : 'var(--gold)'};font-weight:700;margin-top:2px">${claimed ? '✓ 已领' : '🎁 ' + tier.reward + ' 星声'}</div>
    </div>`;
  });
  html += '</div>';

  if (teamCount === 0) {
    html += '<div style="color:var(--red);text-align:center;padding:10px;font-size:12px;border:1px dashed var(--red);border-radius:8px;margin-bottom:12px">⚠ 编队为空或队员已失效，先去【编队】面板组队</div>';
  }

  WASTES_STAGES.forEach((s, i) => {
    const score = scores[s.id] || 0;
    const isLocked = i > 0 && (scores[WASTES_STAGES[i - 1].id] || 0) === 0;
    const maxScore = s.baseScore + 500 + 300; // 理论满分
    const scorePct = maxScore > 0 ? Math.min(100, score / maxScore * 100) : 0;
    const picked = pickedAll[s.id] || [];

    html += `<div style="border:1px solid ${score > 0 ? 'rgba(195,155,255,.5)' : 'var(--line)'};border-radius:10px;padding:11px 13px;margin-bottom:6px;background:${score > 0 ? 'rgba(195,155,255,.05)' : 'rgba(255,255,255,.02)'};opacity:${isLocked ? '.4' : '1'};border-bottom:2px solid ${score > 0 ? 'rgba(195,155,255,.5)' : 'var(--line)'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
            <span style="font-size:13px;font-weight:700;letter-spacing:1px">${s.name}</span>
            <span style="font-size:10px;color:var(--muted)">${s.desc}</span>
          </div>
          <div style="font-size:11px;color:var(--gold);margin-top:3px">
            得分 <b>${score.toLocaleString()}</b> / ${maxScore.toLocaleString()} · 基础 ${s.baseScore} + 回合 + 血量
          </div>
        </div>
        <button class="mbtn gold" onclick="window.__startWastesWithTokens('${s.id}')" ${isLocked || teamCount === 0 ? 'disabled' : ''}>${isLocked ? '🔒 锁定' : (score > 0 ? '刷 分' : '挑 战')}</button>
      </div>
      <div style="font-size:11px;color:var(--muted);line-height:1.6;border-top:1px dashed var(--line);padding-top:5px">
        <div>⚔ <span style="color:var(--dim)">敌人：</span>${formatEnemies(s.enemies)} · 敌强 ×${s.enemyScale.toFixed(1)}</div>
        ${picked.length > 0 ? `<div>📿 <span style="color:var(--dim)">信物：</span>${picked.map(id => {
          const t = WASTES_TOKENS.find(x => x.id === id);
          return t ? `${t.icon} ${t.name}` : id;
        }).join(' · ')}</div>` : '<div style="color:var(--dim)">📿 未选信物（开战前可选）</div>'}
      </div>
    </div>`;
  });

  container.innerHTML = html;
}
