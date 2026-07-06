// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui/signals.js';
import { addRole, addWeapon } from '../../src/gacha/core.js';
import { RoleModalManager } from '../../src/ui/panels/roleModal/RoleModal';
import {
  roleModalOpenSignal,
  roleModalNameSignal,
  roleModalTabSignal,
  roleModalPreviewSignal,
  roleModalRenderTick,
} from '../../src/ui/panels/roleModal/signals.js';

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
  // Clean up both modal DOMs (RoleModal uses #roleModal/#roleModalBox, independent from #modal/#modalBox)
  const modalBox = document.getElementById('modalBox');
  const modal = document.getElementById('modal');
  if (modalBox) { modalBox.innerHTML = ''; modalBox.className = 'modal-box'; }
  if (modal) modal.classList.remove('on');
  const roleModalBox = document.getElementById('roleModalBox');
  const roleModal = document.getElementById('roleModal');
  if (roleModalBox) { roleModalBox.innerHTML = ''; roleModalBox.className = 'modal-box role-modal'; }
  if (roleModal) roleModal.classList.remove('on');
  roleModalOpenSignal.value = false;
  roleModalNameSignal.value = null;
  roleModalTabSignal.value = 'basic';
  roleModalPreviewSignal.value = false;
});

/**
 * Helper: set up modal DOM elements that index.html normally has.
 * RoleModal renders into #roleModalBox (independent from #modalBox used by openModal).
 */
function setupModalDom() {
  if (!document.getElementById('modal')) {
    const overlay = document.createElement('div');
    overlay.id = 'modal';
    overlay.className = 'modal';
    overlay.innerHTML = '<div class="modal-box" id="modalBox"></div>';
    document.body.appendChild(overlay);
  }
  if (!document.getElementById('roleModal')) {
    const overlay = document.createElement('div');
    overlay.id = 'roleModal';
    overlay.className = 'modal';
    overlay.innerHTML = '<div class="modal-box role-modal" id="roleModalBox"></div>';
    document.body.appendChild(overlay);
  }
}

describe('RoleModalManager', () => {
  it('renders nothing when closed', () => {
    setupModalDom();
    mount(h(RoleModalManager, null));
    const roleModalBox = document.getElementById('roleModalBox')!;
    expect(roleModalBox.innerHTML).toBe('');
    expect(document.getElementById('roleModal')!.classList.contains('on')).toBe(false);
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

    const roleModalBox = document.getElementById('roleModalBox')!;
    expect(roleModalBox.textContent).toContain('忌炎');
    expect(roleModalBox.textContent).toContain('基本属性');
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

    const roleModalBox = document.getElementById('roleModalBox')!;
    expect(roleModalBox.textContent).toContain('LV 90');
    expect(roleModalBox.textContent).toContain('暴击');
    expect(roleModalBox.textContent).toContain('生命');
    expect(roleModalBox.textContent).toContain('攻击');
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

    const roleModalBox = document.getElementById('roleModalBox')!;
    expect(roleModalBox.textContent).toContain('共鸣链');
    expect(roleModalBox.textContent).toContain('0/6');
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

    const roleModalBox = document.getElementById('roleModalBox')!;
    expect(roleModalBox.textContent).toContain('角色档案');
    expect(roleModalBox.textContent).not.toContain('突破升级');
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

    const roleModalBox = document.getElementById('roleModalBox')!;
    // The chain section shows chain count
    expect(roleModalBox.textContent).toContain('0/6');
    // Button should mention activating chain
    const buttons = roleModalBox.querySelectorAll('button');
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

    const roleModalBox = document.getElementById('roleModalBox')!;
    expect(roleModalBox.textContent).toContain('COST');
    expect(roleModalBox.textContent).toContain('声 骸 槽 位');
  });
});
