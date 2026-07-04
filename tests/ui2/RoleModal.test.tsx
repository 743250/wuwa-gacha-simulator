// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui2/signals.js';
import { addRole, addWeapon } from '../../src/gacha/core.js';
import { RoleModalManager } from '../../src/ui2/panels/roleModal/RoleModal';
import {
  roleModalOpenSignal,
  roleModalNameSignal,
  roleModalTabSignal,
  roleModalPreviewSignal,
  roleModalRenderTick,
} from '../../src/ui2/panels/roleModal/signals.js';

let container: HTMLDivElement | null = null;

function mount(node: any): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  render(node, container);
  return container;
}

afterEach(() => {
  if (container) {
    render(null, container);
    container.remove();
    container = null;
  }
  // Clean up modal DOM state
  const modalBox = document.getElementById('modalBox');
  const modal = document.getElementById('modal');
  if (modalBox) { modalBox.innerHTML = ''; modalBox.className = 'modal-box'; }
  if (modal) modal.classList.remove('on');
  roleModalOpenSignal.value = false;
  roleModalNameSignal.value = null;
  roleModalTabSignal.value = 'basic';
  roleModalPreviewSignal.value = false;
});

/**
 * Helper: set up modal DOM elements that index.html normally has.
 */
function setupModalDom() {
  if (!document.getElementById('modal')) {
    const overlay = document.createElement('div');
    overlay.id = 'modal';
    overlay.className = 'modal';
    overlay.innerHTML = '<div class="modal-box" id="modalBox"></div>';
    document.body.appendChild(overlay);
  }
}

describe('RoleModalManager', () => {
  it('renders nothing when closed', () => {
    setupModalDom();
    mount(h(RoleModalManager, null));
    const modalBox = document.getElementById('modalBox')!;
    expect(modalBox.innerHTML).toBe('');
    expect(document.getElementById('modal')!.classList.contains('on')).toBe(false);
  });

  it('renders role modal when opened with a role name', async () => {
    resetState();
    setupModalDom();
    mount(h(RoleModalManager, null));

    // Open modal
    roleModalNameSignal.value = '忌炎';
    roleModalTabSignal.value = 'basic';
    roleModalPreviewSignal.value = false;
    roleModalOpenSignal.value = true;
    bumpStateVersion();

    // Effect fires asynchronously; need multiple microtask/macrotask rounds
    // for signal batch + useEffect to flush
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    const modalBox = document.getElementById('modalBox')!;
    expect(modalBox.textContent).toContain('忌炎');
    expect(modalBox.textContent).toContain('基本属性');
  });

  it('shows basic tab stats', async () => {
    resetState();
    setupModalDom();
    mount(h(RoleModalManager, null));

    roleModalNameSignal.value = '忌炎';
    roleModalTabSignal.value = 'basic';
    roleModalPreviewSignal.value = false;
    roleModalOpenSignal.value = true;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    const modalBox = document.getElementById('modalBox')!;
    expect(modalBox.textContent).toContain('LV 90');
    expect(modalBox.textContent).toContain('暴击');
    expect(modalBox.textContent).toContain('生命');
    expect(modalBox.textContent).toContain('攻击');
  });

  it('switches tab content when signal changes', async () => {
    resetState();
    setupModalDom();
    mount(h(RoleModalManager, null));

    roleModalNameSignal.value = '忌炎';
    roleModalTabSignal.value = 'basic';
    roleModalPreviewSignal.value = false;
    roleModalOpenSignal.value = true;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    // Switch to chain tab
    roleModalTabSignal.value = 'chain';
    roleModalRenderTick.value = roleModalRenderTick.value + 1;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    const modalBox = document.getElementById('modalBox')!;
    expect(modalBox.textContent).toContain('共鸣链');
    expect(modalBox.textContent).toContain('0/6');
  });

  it('shows preview mode without levelup tab', async () => {
    resetState({ roles: {} }); // no roles = preview mode triggered
    setupModalDom();
    mount(h(RoleModalManager, null));

    // Create a test role for preview
    addRole('忌炎', 5);
    S.roles['忌炎'].chain = 0;

    roleModalNameSignal.value = '忌炎';
    roleModalTabSignal.value = 'basic';
    roleModalPreviewSignal.value = true;
    roleModalOpenSignal.value = true;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    const modalBox = document.getElementById('modalBox')!;
    expect(modalBox.textContent).toContain('角色档案');
    expect(modalBox.textContent).not.toContain('突破升级');
  });

  it('renders chain activate button', async () => {
    resetState();
    setupModalDom();
    mount(h(RoleModalManager, null));

    // Give some spare sequences
    S.roles['忌炎'].spare = 2;
    S.roles['忌炎'].chain = 0;

    roleModalNameSignal.value = '忌炎';
    roleModalTabSignal.value = 'chain';
    roleModalPreviewSignal.value = false;
    roleModalOpenSignal.value = true;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    const modalBox = document.getElementById('modalBox')!;
    // The chain section shows chain count
    expect(modalBox.textContent).toContain('0/6');
    // Button should mention activating chain
    const buttons = modalBox.querySelectorAll('button');
    const activateBtn = Array.from(buttons).find(b => b.textContent!.includes('激活'));
    expect(activateBtn).toBeTruthy();
  });

  it('echo selected slot syncs with signal', async () => {
    resetState();
    setupModalDom();
    mount(h(RoleModalManager, null));

    // Create an echo and equip it
    S.echos.push({
      id: 1001,
      name: '鸣钟之龟',
      cost: 4,
      set: 'moonlit',
      element: '衍射',
      level: 1,
      mainStat: { key: 'hp', label: '生命', value: 2280 },
      subStats: [],
      lock: false,
      equippedBy: '忌炎',
      equipSlot: 0,
    });
    S.roles['忌炎'].equipEchoes = [1001, null, null, null, null];

    roleModalNameSignal.value = '忌炎';
    roleModalTabSignal.value = 'echo';
    roleModalPreviewSignal.value = false;
    roleModalOpenSignal.value = true;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    const modalBox = document.getElementById('modalBox')!;
    expect(modalBox.textContent).toContain('COST');
    expect(modalBox.textContent).toContain('声 骸 槽 位');
  });
});
