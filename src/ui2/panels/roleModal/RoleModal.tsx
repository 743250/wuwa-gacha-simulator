// RoleModal lifecycle — signal.subscribe approach.
// Mounts/unmounts RoleModalContent into #modalBox when signal changes,
// using direct DOM subscription (not Preact hooks) for synchronous reaction.

import { h, render as preactRender } from 'preact';
import { roleModalOpenSignal, roleModalRenderTick } from './signals';
import { RoleModalContent } from './RoleModalContent';

// Cache the mount node reference
let mountNode: HTMLDivElement | null = null;
let subscribed = false;

function getBox() { return document.getElementById('modalBox'); }
function getModal() { return document.getElementById('modal'); }

function ensureMount(): HTMLDivElement | null {
  const box = getBox();
  if (!box) return null;
  if (mountNode && document.getElementById('roleModalPreactRoot')) return mountNode;
  box.innerHTML = '';
  mountNode = document.createElement('div');
  mountNode.id = 'roleModalPreactRoot';
  box.appendChild(mountNode);
  return mountNode;
}

function renderContent() {
  const m = ensureMount();
  if (m) preactRender(h(RoleModalContent, null), m);
}

function cleanContent() {
  const modal = getModal();
  const box = getBox();
  if (mountNode) {
    preactRender(null, mountNode);
    mountNode.remove();
    mountNode = null;
  }
  if (box) box.innerHTML = '';
  if (modal) modal.classList.remove('on');
}

function onSignalChange() {
  const open = roleModalOpenSignal.value;
  const modal = getModal();
  const box = getBox();
  if (!modal || !box) return;

  if (open) {
    box.className = 'modal-box role-modal';
    renderContent();
    modal.classList.add('on');
  } else {
    cleanContent();
  }
}

/**
 * Initialize the signal subscription. Idempotent.
 * Subscribes synchronously and calls handler immediately.
 */
export function initRoleModalSubscription(): void {
  if (subscribed) return;
  subscribed = true;

  // Synchronous handler for open/close + render tick
  const handler = () => {
    onSignalChange();
  };

  // Subscribe to both signals. The callback fires on every change.
  // We use a combined handler that reads both signals.
  let lastOpen = roleModalOpenSignal.value;
  let lastTick = roleModalRenderTick.value;

  roleModalOpenSignal.subscribe((open) => {
    lastOpen = open;
    // When opening, also re-render content
    if (open) {
      const box = getBox();
      const modal = getModal();
      if (box && modal) {
        box.className = 'modal-box role-modal';
        renderContent();
        modal.classList.add('on');
      }
    } else {
      cleanContent();
    }
  });

  roleModalRenderTick.subscribe(() => {
    lastTick = roleModalRenderTick.value;
    // Only re-render if open
    if (roleModalOpenSignal.value) {
      renderContent();
    }
  });

  // Initial state sync
  if (roleModalOpenSignal.value) {
    onSignalChange();
  }
}

/**
 * RoleModalManager — triggers init once.
 */
export function RoleModalManager() {
  initRoleModalSubscription();
  return null;
}

/**
 * Install modal background click handler.
 */
export function installModalCloseHandler() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.addEventListener('click', (e: MouseEvent) => {
    if (e.target === modal && roleModalOpenSignal.value) {
      roleModalOpenSignal.value = false;
    }
  });
}
