// 冥歌海墟 actions · Phase 5 从 src/ui/wastes.js shim 迁入
// openTokenPicker 用 Preact VNode body,闭包 onClick
import { WASTES_STAGES, WASTES_TOKENS, getPickedTokens, pickToken } from '../../../daily/wastes.js';
import { openModal } from '../../../modal.js';
import { h } from 'preact';
import { startWastesBattle } from '../../../ui/battle.js';

function openTokenPicker(stageId: string, callback: () => void) {
  const picked = getPickedTokens()[stageId] || [];
  const available = WASTES_TOKENS.filter(t => !picked.includes(t.id));
  if (available.length === 0) { callback(); return; }

  const body = h('div', null,
    h('div', { style: 'font-size:11px;color:var(--muted);margin-bottom:10px' },
      '为 ',
      h('b', { style: 'color:var(--gold)' }, WASTES_STAGES.find(s => s.id === stageId)?.name || stageId),
      ` 选择信物（可多选叠加 · 已选 ${picked.length} 个）`
    ),
    h('div', { style: 'display:grid;gap:6px' },
      available.map(t =>
        h('div', {
          style: 'border:1px solid var(--line);border-radius:8px;padding:9px 12px;cursor:pointer;background:rgba(255,255,255,.02)',
          onClick: () => {
            if (pickToken(stageId, t.id)) {
              setTimeout(() => openTokenPicker(stageId, () => startWastesBattle(stageId)), 50);
            }
          }
        },
          h('div', { style: 'font-size:13px;font-weight:600' }, t.icon + ' ' + t.name),
          h('div', { style: 'font-size:10px;color:var(--muted);margin-top:2px' }, t.desc)
        )
      )
    ),
    picked.length > 0 && h('div', { style: 'margin-top:8px;font-size:10px;color:var(--green)' },
      '已选：' + picked.map(id => WASTES_TOKENS.find(t => t.id === id)?.name || id).join(' · ')
    ),
    h('button', {
      class: 'mbtn gold',
      style: 'width:100%;margin-top:8px',
      onClick: () => {
        document.getElementById('modal')?.classList.remove('on');
        startWastesBattle(stageId);
      }
    }, '直接开战（不选信物）')
  );

  openModal({
    title: '选择信物',
    body,
    actions: [{ label: '取消', cls: '', fn: () => {} }]
  });
}

export function startWastesWithTokens(stageId: string) {
  const picked = getPickedTokens()[stageId] || [];
  if (picked.length === 0 && WASTES_TOKENS.length > 0) {
    openTokenPicker(stageId, () => startWastesBattle(stageId));
  } else {
    startWastesBattle(stageId);
  }
}
