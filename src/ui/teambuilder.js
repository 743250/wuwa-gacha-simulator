// 编队界面
import { S, $, msg } from '../state.js';
import { getMeta } from '../battle/template.js';
import { calcBP } from '../battle/stats.js';
import { openModal } from '../modal.js';

export const TEAM_SIZE = 3;

export function renderTeamBuilder() {
  const container = $('paneTeam');
  const team = S.team || [null, null, null];
  const allRoles = Object.values(S.roles).filter(r => r.owned > 0).sort((a, b) => calcBP(b.n) - calcBP(a.n));

  let html = '<h2 class="col-head" style="margin-top:0">编 队（3 人）</h2>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">';

  for (let i = 0; i < TEAM_SIZE; i++) {
    const name = team[i];
    const role = name ? S.roles[name] : null;
    const bpHtml = name ? `<span style="color:var(--gold);font-size:11px">BP ${calcBP(name).toLocaleString()}</span>` : '';
    const elemHtml = name ? `<span style="font-size:10px;color:var(--muted)">${getMeta(name).element} · ${getMeta(name).type}</span>` : '';

    html += `<div style="border:1px solid var(--line);border-radius:10px;padding:12px;text-align:center;min-height:120px;
      background:${role ? 'rgba(245,207,107,.05)' : 'rgba(255,255,255,.02)'}">
      <div style="font-size:13px;font-weight:600;color:${name ? 'var(--gold)' : 'var(--dim)'}">${name || '空位'}</div>
      ${name ? `<div style="margin:4px 0">${elemHtml}</div>
      <div>${bpHtml}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:4px">Lv${role?.level || 1} · +${role?.chain || 0}链</div>` : ''}
      <button class="mbtn" style="margin-top:6px" onclick="window.__openTeamPicker(${i})">${name ? '更换' : '选择'}</button>
    </div>`;
  }

  html += '</div>';

  // 已编队成员列表卡片（快速点击）
  html += '<div style="max-height:300px;overflow-y:auto">';
  allRoles.forEach(r => {
    const inTeam = team.includes(r.n);
    const active = inTeam ? 'background:rgba(245,207,107,.06);border-color:var(--gold)' : '';
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;
      border:1px solid ${inTeam ? 'var(--gold)' : 'var(--line)'};border-radius:8px;margin-bottom:4px;
      cursor:pointer;${active}"
      onclick="window.__toggleTeamMember('${r.n.replace(/'/g, "\\'")}')">
      <div style="flex:1"><span style="font-weight:600">${r.n}</span>
        <span style="font-size:10px;color:var(--muted);margin-left:6px">${getMeta(r.n).element}</span></div>
      <span style="font-size:10px;color:${inTeam ? 'var(--gold)' : 'var(--dim)'}">${inTeam ? '已编入' : '点击加入'}</span>
    </div>`;
  });
  html += '</div>';

  container.innerHTML = html;
}

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
  // 检查是否已在其他位
  const team = S.team || [null, null, null];
  const existingIdx = team.indexOf(name);
  if (existingIdx >= 0) team[existingIdx] = null; // 原位移除
  team[slotIdx] = name;
  S.team = team;
  msg(`编入 ${name}`, false);
  renderTeamBuilder();
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
  renderTeamBuilder();
  window.__render();
};