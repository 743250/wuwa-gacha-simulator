// roleModal shim — Stage 5.1 Preact migration
// Preact (RoleModalManager + RoleModalContent) has taken over #modalBox content.
// switchRoleTab / activateChain / selectEchoSlot / openRoleModal / openRolePreview 已 export 给 src/ui/panels/roleModal/ Preact 组件直接 import。
// skillBlock.js 已 Preact 化,直接 import toggleEncoreBurstMode,不再需要 window.__ re-export 桥。

import { S } from '../../state.js';
import { msg } from '../services/toast.ts';
import { upgrade } from '../../gacha/actions.js';
import {
  roleModalOpenSignal,
  roleModalNameSignal,
  roleModalTabSignal,
  roleModalPreviewSignal,
  echoSelectedSlotSignal,
  roleModalRenderTick,
} from '../../ui/panels/roleModal/signals.js';  // eslint-disable-line

// ---------- Public entry points ----------

export function openRoleModal(n) {
  roleModalNameSignal.value = n;
  roleModalTabSignal.value = 'basic';
  roleModalPreviewSignal.value = false;
  echoSelectedSlotSignal.value = {};
  roleModalOpenSignal.value = true;
}

export function openRolePreview(n) {
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
}
