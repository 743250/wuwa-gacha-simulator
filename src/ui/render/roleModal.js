// roleModal shim — Stage 5.1 Preact migration
// Preact (RoleModalManager + RoleModalContent) has taken over #modalBox content.
// This shim only keeps window.__ handlers that Preact components or old HTML onclick 还调。
//
// 注意(playbook 坑 #10):.js shim 不能 import .ts 文件,rollup 生产构建会拒。
// - roleModal signals 是 .js 文件,可以直接 import
// - bumpStateVersion 在 ui2/signals.ts,不能直接 import → 用 window.__render() 桥
//
// Stage 6.1 清理:删掉了 standardRolePreview/echoPicker/weaponModal/roleActions 4 个老 register
// 它们都是给老 innerHTML 用的,Preact 已接管对应功能。

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

// Shim-only state for stuff that reads via deps
let _currentRoleTab = 'basic';
let _currentRoleName = null;
let _currentRolePreview = false;
let _echoSelectedSlot = {};

// ---------- Public entry points (called from HTML onclick) ----------

function openRoleModal(n) {
  _currentRoleName = n;
  _currentRolePreview = false;
  _currentRoleTab = 'basic';
  _echoSelectedSlot = {};

  roleModalNameSignal.value = n;
  roleModalTabSignal.value = 'basic';
  roleModalPreviewSignal.value = false;
  echoSelectedSlotSignal.value = {};
  roleModalOpenSignal.value = true;
}

function openRolePreview(n) {
  _currentRoleName = n;
  _currentRolePreview = true;
  _currentRoleTab = 'basic';
  _echoSelectedSlot = {};

  roleModalNameSignal.value = n;
  roleModalTabSignal.value = 'basic';
  roleModalPreviewSignal.value = true;
  echoSelectedSlotSignal.value = {};
  roleModalOpenSignal.value = true;
}

function reopenRoleModal() {
  if (roleModalNameSignal.value) {
    roleModalOpenSignal.value = true;
    roleModalRenderTick.value = roleModalRenderTick.value + 1;
  }
}

// __renderRoleTabContent (called by old code that doesn't use signals)
function renderRoleTabContent(tabId, preview) {
  if (tabId) roleModalTabSignal.value = tabId;
  if (preview !== undefined) roleModalPreviewSignal.value = !!preview;
  roleModalRenderTick.value = roleModalRenderTick.value + 1;
  return '';
}

export function initRoleModal({ render }) {
  // Stage 6.1: standardRolePreview/echoPicker/weaponModal/roleActions 的老 register 已删
  // Preact 组件直接处理这些交互
  void render;

  window.openRoleModal = openRoleModal;
  window.openRolePreview = openRolePreview;
  window.__reopenRoleModal = reopenRoleModal;
  window.__renderRoleTabContent = renderRoleTabContent;

  // 安可技能页:共鸣解放文案白咩/黑咩版本切换
  window.__encoreBurstMode = window.__encoreBurstMode || 'white';
  window.__toggleEncoreBurstMode = () => {
    window.__encoreBurstMode = window.__encoreBurstMode === 'black' ? 'white' : 'black';
    roleModalRenderTick.value = roleModalRenderTick.value + 1;
  };

  // 切换 tab
  window.__switchRoleTab = (tabId) => {
    _currentRoleTab = tabId;
    roleModalTabSignal.value = tabId;
    roleModalRenderTick.value = roleModalRenderTick.value + 1;
  };

  // 激活共鸣链
  window.__activateChain = (n) => {
    const o = S.roles[n];
    if (!o || o.spare <= 0 || o.chain >= 6) { msg('无法激活'); return; }
    upgrade(n);
    msg(`激活 ${o.chain} 链`, false);
    roleModalRenderTick.value = roleModalRenderTick.value + 1;
  };

  // __selectEchoSlot
  window.__selectEchoSlot = (roleName, idx) => {
    _echoSelectedSlot[roleName] = idx;
    echoSelectedSlotSignal.value = { ...echoSelectedSlotSignal.value, [roleName]: idx };
    roleModalRenderTick.value = roleModalRenderTick.value + 1;
  };
}
