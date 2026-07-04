// Preact 已接管 #paneWastes, renderWastes 变 no-op。
// 保留 action handler 注册和 modal 相关函数（openTokenPicker 及其回调）。
// Stage 6 再统一清理 window.__ 和此行。

import { S, $ } from '../state.js';
import { WASTES_STAGES, WASTES_TOKENS, getPickedTokens, pickToken } from '../daily/wastes.js';
import { openModal } from '../modal.js';
import './battle.js';   // 副作用：注册 window.__startWastes

// 信物选择弹窗（modal 逻辑保留）
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

export function renderWastes() {}  // no-op
