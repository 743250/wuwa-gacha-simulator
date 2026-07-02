import { standard5 } from '../../data/chars.js';
import { openModal } from '../../modal.js';
import { escJs } from './utils.js';

export function registerStandardRolePreview() {
  window.__openStandardRolePreview = () => {
    const buttons = standard5.map(n => `<button class="mbtn gold" style="margin:4px;min-width:90px" onclick="window.openRolePreview('${escJs(n)}')">${n}</button>`).join('');
    openModal({
      title: '常驻五星角色预览',
      body: `<div style="color:var(--muted);font-size:12px;margin-bottom:10px">这些角色都可能从当前角色池抽到，可先查看技能与共鸣链。</div><div style="text-align:center">${buttons}</div>`,
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
  };
}
