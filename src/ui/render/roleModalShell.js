// 角色详情模态框外壳 · sidebar + portrait + TABS + body HTML
// 不含 tab 内容，内容由调用方通过 content 传入

export function renderRoleModalShell({ o, meta, currentTab, preview, content }) {
  const stars = '★'.repeat(o.r);

  const elemColor = {
    '热熔': '#ff8c5e', '湮灭': '#c39bff', '气动': '#8de6a6',
    '冷凝': '#7bd6ff', '衍射': '#fff0b0', '导电': '#b58cff'
  }[meta.element] || '#fff';

  const TABS = [
    { id: 'basic',  icon: '🧍', label: '基本属性' },
    { id: 'weapon', icon: '⚔', label: '武器' },
    { id: 'echo',  icon: '💠', label: '声骸' },
    { id: 'chain',  icon: '🔗', label: '共鸣链' },
    { id: 'skill',  icon: '✦', label: '技能介绍' },
    { id: 'levelup',icon: '🎯', label: '突破升级' }
  ];

  const previewTabs = preview ? TABS.filter(t => t.id !== 'levelup') : TABS;

  const sidebar = previewTabs.map(t => `
    <div class="role-tab ${currentTab === t.id ? 'on' : ''}" onclick="window.__switchRoleTab('${t.id}')">
      <span class="rt-icon">${t.icon}</span>
      <span class="rt-lbl">${t.label}</span>
    </div>`).join('');

  const body = `
    <div class="role-modal-wrap">
      <div class="role-sidebar">
        <div class="role-portrait">
          <div style="font-size:28px;font-weight:700;color:${o.r === 5 ? 'var(--gold)' : '#dbc6ff'};letter-spacing:1px">${o.n}</div>
          <div style="font-size:16px;color:${o.r === 5 ? 'var(--gold)' : 'var(--purple)'};letter-spacing:2px;margin-top:7px">${stars}</div>
          <div style="display:flex;gap:7px;justify-content:center;margin-top:10px;flex-wrap:wrap">
            <span style="font-size:14px;padding:3px 10px;border:1px solid ${elemColor};color:${elemColor};border-radius:999px">${meta.element}</span>
            <span style="font-size:14px;padding:3px 10px;border:1px solid var(--line2);color:var(--muted);border-radius:999px">${meta.type}</span>
          </div>
          <div style="font-size:15px;color:var(--muted);margin-top:10px">LV ${o.level} · 链 ${o.chain}/6</div>
        </div>
        ${sidebar}
      </div>
      <div class="role-content" id="roleContent">${content}</div>
    </div>`;

  return body;
}