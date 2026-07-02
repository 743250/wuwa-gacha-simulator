import { $ } from '../../state.js';

export function renderRoleList(state) {
  const arr = Object.values(state.roles).sort((a, b) => b.r - a.r || (b.level || 1) - (a.level || 1) || a.n.localeCompare(b.n, 'zh'));
  $('roles').innerHTML = arr.length ? arr.map(o => {
    const stars = '★'.repeat(o.r);
    const chainCls = o.chain >= 6 ? 'full' : (o.chain > 0 ? 'has' : '');
    const lv = o.level || 1;
    return `<div class="role r${o.r}" onclick="openRoleModal('${o.n.replace(/'/g, "\\'")}')">
      <div class="chain-badge ${chainCls}">+${o.chain}/6</div>
      ${o.spare > 0 ? `<div class="spare-dot">频段 ${o.spare}</div>` : ''}
      <div class="stars">${stars}</div>
      <div class="rname">${o.n}</div>
      <div style="font-size:9px;color:var(--muted);text-align:center;margin-top:3px;letter-spacing:.5px">LV ${lv}${o.equipWeapon ? ' · 已装备' : ''}</div>
    </div>`;
  }).join('') : '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:30px;font-size:12px;letter-spacing:1px">还没有角色 / 武器</div>';
}
