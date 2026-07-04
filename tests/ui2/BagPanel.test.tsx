// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui2/signals.js';
import { addWeapon } from '../../src/gacha/core.js';
import { BagPanel } from '../../src/ui2/panels/bag/BagPanel';

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
});

describe('BagPanel', () => {
  it('empty state shows "暂无声骸" hint', () => {
    resetState();
    bumpStateVersion();
    const el = mount(<BagPanel />);
    expect(el.textContent).toContain('暂无声骸');
  });

  it('displays 5 resource group titles', () => {
    resetState();
    bumpStateVersion();
    const el = mount(<BagPanel />);
    expect(el.textContent).toContain('货 币');
    expect(el.textContent).toContain('抽 卡 资 源');
    expect(el.textContent).toContain('海 市 珊 瑚');
    expect(el.textContent).toContain('养 成 材 料');
    expect(el.textContent).toContain('体 力');
  });

  it('displays astrite with thousands separator', () => {
    resetState();
    S.astrite = 12345;
    bumpStateVersion();
    const el = mount(<BagPanel />);
    expect(el.textContent).toContain('12,345');
  });

  it('shows weapon grid with 3 weapons', () => {
    resetState();
    addWeapon('千古洑流', 5);
    addWeapon('星序协响', 5);
    addWeapon('赫奕流明', 5);
    bumpStateVersion();
    const el = mount(<BagPanel />);
    expect(el.textContent).toContain('已 拥 有 武 器');
    expect(el.textContent).toContain('千古洑流');
    expect(el.textContent).toContain('星序协响');
    expect(el.textContent).toContain('赫奕流明');
    const roles = el.querySelectorAll('.role');
    expect(roles.length).toBe(3);
  });

  it('renders echo card after pushing one echo', () => {
    resetState();
    S.echos.push({
      id: 99,
      name: '测试声骸',
      cost: 4,
      set: 'frost',
      element: '冷凝',
      level: 1,
      mainStat: { key: 'hp', label: '生命', value: 2280 },
      subStats: [],
      lock: false,
      equippedBy: null,
      equipSlot: null,
    });
    bumpStateVersion();
    const el = mount(<BagPanel />);
    const cards = el.querySelectorAll('.echo-card');
    expect(cards.length).toBe(1);
    expect(el.textContent).toContain('测试声骸');
  });

  it('reactively rerenders when S changes and bumpStateVersion fires', async () => {
    // useS() 里读 stateVersion.value 建立订阅,值真的自增 → @preact/signals 自动重渲染。
    // 之前用 computed(() => S) 会被 Object.is 抑制,已改为直接读 stateVersion。
    resetState();
    S.astrite = 500;
    bumpStateVersion();
    const el = mount(<BagPanel />);
    expect(el.textContent).toContain('500');
    S.astrite = 9999;
    bumpStateVersion();
    // 等一次 microtask + macrotask 让 preact/signals 冲刷
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(el.textContent).toContain('9,999');
    expect(el.textContent).not.toContain('500抽卡'); // 老值不残留
  });

  it('shows pending weapon box when S.podcast.pendingWeaponBox is set', () => {
    resetState();
    S.podcast.pendingWeaponBox = 2;
    bumpStateVersion();
    const el = mount(<BagPanel />);
    expect(el.textContent).toContain('4★ 武器自选箱');
    expect(el.textContent).toContain('×2');
  });
});
