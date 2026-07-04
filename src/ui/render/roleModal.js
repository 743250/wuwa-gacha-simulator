// roleModal shim — Stage 5.1 Preact migration
// Preact (RoleModalManager + RoleModalContent) has taken over #modalBox content.
// switchRoleTab / activateChain / selectEchoSlot 已 export 给 ui2 Preact 组件直接 import。
// window.openRoleModal / openRolePreview 保留(被旧 HTML 字符串 onclick 调用)。
// __encoreBurstMode / __toggleEncoreBurstMode 保留(skillBlock.js 旧 HTML 调用)。

import { S, msg } from '../../state.js';
import { upgrade } from '../../gacha/core.js';
import {
  roleModalOpenSignal,
  roleModalNameSignal,
  roleModalTabSignal,
  roleModalPreviewSignal,
  echoSelectedSlotSignal,
  roleModalRenderTick,
} from '../../ui2/panels/roleModal/signals.js';  // eslint-disable-line

// ---------- Public entry points (called from HTML onclick) ----------

function openRoleModal(n) {
  roleModalNameSignal.value = n;
  roleModalTabSignal.value = 'basic';
  roleModalPreviewSignal.value = false;
  echoSelectedSlotSignal.value = {};
  roleModalOpenSignal.value = true;
}

function openRolePreview(n) {
  roleModalNameSignal.value = n;
  roleModalTabSignal.value = 'basic';
  roleModalPreviewSignal.value = true;
  echoSelectedSlotSignal.value = {};
  roleModalOpenSignal.value = true;
}

// Preact 组件直接 import 的纯函数
export function switchRoleTab(tabId) {
  roleModalTabSignal.value = tabId;
  roleModalRenderTick.value = roleModalRenderTick.value + 1;
}

export function activateChain(n) {
  const o = S.roles[n];
  if (!o || o.spare <= 0 || o.chain >= 6) { msg('无法激活'); return; }
  upgrade(n);
  msg(`激活 ${o.chain} 链`, false);
  roleModalRenderTick.value = roleModalRenderTick.value + 1;
}

export function selectEchoSlot(roleName, idx) {
  echoSelectedSlotSignal.value = { ...echoSelectedSlotSignal.value, [roleName]: idx };
  roleModalRenderTick.value = roleModalRenderTick.value + 1;
}

export function initRoleModal({ render }) {
  void render;

  // window.openRoleModal / openRolePreview 被旧 HTML 字符串 onclick 调用,保留
  window.openRoleModal = openRoleModal;
  window.openRolePreview = openRolePreview;

  // 安可技能页:共鸣解放文案白咩/黑咩版本切换(skillBlock.js 旧 HTML 调用,保留 window.__)
  window.__encoreBurstMode = window.__encoreBurstMode || 'white';
  window.__toggleEncoreBurstMode = () => {
    window.__encoreBurstMode = window.__encoreBurstMode === 'black' ? 'white' : 'black';
    roleModalRenderTick.value = roleModalRenderTick.value + 1;
  };
}
