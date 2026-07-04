// 编队面板 · Stage 6.1a 已迁到 Preact (src/ui2/panels/team/TeamBuilderPanel.tsx)
//
// 这个 shim 文件保留:
//   1. main.js 里 `import { renderTeamBuilder }` / `renderTeamBuilder()` 调用不挂
//   2. openTeamPicker / toggleTeamMember export 给 TeamBuilderPanel.tsx import
//   3. Stage 6.2: modal body 改为 Preact VNode，闭包 onClick 代替 window.__setTeamMember

import { S, msg } from '../state.js';
import { getMeta } from '../battle/template.js';
import { calcBP } from '../battle/stats.js';
import { openModal } from '../modal.js';
import { h } from 'preact';
import { bumpStateVersion } from '../ui2/signals.ts';

export const TEAM_SIZE = 3;

// no-op —— Preact 已接管 #paneTeam 的渲染
export function renderTeamBuilder() {}

// 设置编队成员（闭包内，替代 window.__setTeamMember）
function setTeamMember(slotIdx, name) {
  const team = S.team || [null, null, null];
  const existingIdx = team.indexOf(name);
  if (existingIdx >= 0) team[existingIdx] = null;
  team[slotIdx] = name;
  S.team = team;
  msg(`编入 ${name}`, false);
  bumpStateVersion();
}

// 队伍角色选择器弹窗
export function openTeamPicker(slotIdx) {
  const roles = Object.values(S.roles).filter(r => r.owned > 0).sort((a, b) => calcBP(b.n) - calcBP(a.n));
  const body = roles.length > 0
    ? h('div', null, roles.map(r => {
        const bp = calcBP(r.n);
        return h('div', {
          style: 'display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin-bottom:4px;cursor:pointer',
          onClick: () => setTeamMember(slotIdx, r.n)
        },
          h('div', { style: 'flex:1' },
            h('b', null, r.n),
            h('span', { style: 'font-size:10px;color:var(--muted)' }, ' ' + getMeta(r.n).element)
          ),
          h('span', { style: 'color:var(--gold);font-size:11px' }, bp.toLocaleString()),
          h('span', { style: 'font-size:10px;color:var(--muted)' }, `LV${r.level || 1} · +${r.chain || 0}链`)
        );
      }))
    : h('div', { style: 'color:var(--muted);text-align:center' }, '还没有角色');
  openModal({
    title: `选择编队成员（第 ${slotIdx + 1} 位）`,
    body,
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
}

export function toggleTeamMember(name) {
  const team = S.team || [null, null, null];
  const existingIdx = team.indexOf(name);
  if (existingIdx >= 0) {
    team[existingIdx] = null;
    msg(`移出 ${name}`, false);
  } else {
    const empty = team.indexOf(null);
    if (empty >= 0) team[empty] = name;
    else { msg('编队已满，先移出再添加'); return; }
  }
  S.team = team;
  bumpStateVersion();
}
