// 编队面板 · Stage 6.1a 已迁到 Preact (src/ui2/panels/team/TeamBuilderPanel.tsx)
//
// 这个 shim 文件保留:
//   1. main.js 里 `import { renderTeamBuilder }` / `renderTeamBuilder()` 调用不挂
//   2. 注册 window.__openTeamPicker / __setTeamMember / __toggleTeamMember action handler
//   3. Stage 6 清理时删掉本文件
//
// UI 渲染由 <TeamBuilderPanel /> 组件订阅 sSignal 自动响应,rerenderAll() 内的 bumpStateVersion() 驱动重渲染。

import { S, msg } from '../state.js';
import { getMeta } from '../battle/template.js';
import { calcBP } from '../battle/stats.js';
import { openModal } from '../modal.js';

export const TEAM_SIZE = 3;

// no-op —— Preact 已接管 #paneTeam 的渲染
export function renderTeamBuilder() {}

// 队伍角色选择器弹窗
window.__openTeamPicker = (slotIdx) => {
  const roles = Object.values(S.roles).filter(r => r.owned > 0).sort((a, b) => calcBP(b.n) - calcBP(a.n));
  const body = roles.map(r => {
    const bp = calcBP(r.n);
    return `<div style="display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin-bottom:4px;cursor:pointer"
      onclick="window.__setTeamMember(${slotIdx},'${r.n.replace(/'/g, "\\'")}')">
      <div style="flex:1"><b>${r.n}</b> <span style="font-size:10px;color:var(--muted)">${getMeta(r.n).element}</span></div>
      <span style="color:var(--gold);font-size:11px">${bp.toLocaleString()}</span>
      <span style="font-size:10px;color:var(--muted)">LV${r.level || 1} · +${r.chain || 0}链</span>
    </div>`;
  }).join('');
  openModal({
    title: `选择编队成员（第 ${slotIdx + 1} 位）`,
    body: body || '<div style="color:var(--muted);text-align:center">还没有角色</div>',
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
};

window.__setTeamMember = (slotIdx, name) => {
  const team = S.team || [null, null, null];
  const existingIdx = team.indexOf(name);
  if (existingIdx >= 0) team[existingIdx] = null;
  team[slotIdx] = name;
  S.team = team;
  msg(`编入 ${name}`, false);
  window.__render();
};

window.__toggleTeamMember = (name) => {
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
  window.__render();
};
