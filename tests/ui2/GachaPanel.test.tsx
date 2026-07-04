// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui2/signals.js';
import { GachaBanner } from '../../src/ui2/panels/gacha/GachaBanner';
import { PullPanel } from '../../src/ui2/panels/gacha/PullPanel';
import { RoleGrid } from '../../src/ui2/panels/gacha/RoleGrid';
import { SidePanel, gachaTabSignal } from '../../src/ui2/panels/gacha/SidePanel';
import { StatsTab } from '../../src/ui2/panels/gacha/StatsTab';
import { LogTab } from '../../src/ui2/panels/gacha/LogTab';
import { ExchangeTab } from '../../src/ui2/panels/gacha/ExchangeTab';

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

describe('GachaBanner', () => {
  it('renders banner tabs with permanent banners', () => {
    resetState();
    bumpStateVersion();
    const el = mount(<GachaBanner />);
    // Permanent banners always present: beginner, standard char
    expect(el.textContent).toContain('新手');
    expect(el.textContent).toContain('常驻');
  });
});

describe('PullPanel', () => {
  it('shows cost panel when a banner is active', () => {
    resetState();
    bumpStateVersion();
    const el = mount(<PullPanel />);
    expect(el.textContent).toContain('浮金波纹');
    expect(el.textContent).toContain('星 声');
  });

  it('displays pity bar with correct numbers', () => {
    resetState();
    S.pity.eventChar = 42;
    bumpStateVersion();
    const el = mount(<PullPanel />);
    expect(el.textContent).toContain('42');
    expect(el.textContent).toContain('80');
  });

  it('shows correct tide key for beginner pool', () => {
    resetState();
    S.selected = 'beginner';
    bumpStateVersion();
    const el = mount(<PullPanel />);
    // beginner pool uses lustrous (唤声涡纹)
    expect(el.textContent).toContain('唤声涡纹');
  });
});

describe('RoleGrid', () => {
  it('shows empty state when no roles exist', () => {
    resetState();
    S.roles = {};
    bumpStateVersion();
    const el = mount(<RoleGrid />);
    expect(el.textContent).toContain('还没有角色');
  });

  it('renders role cards when roles exist', () => {
    resetState();
    S.roles = {
      '忌炎': { n: '忌炎', r: 5, owned: 1, chain: 0, level: 90, equipWeapon: null },
      '秧秧': { n: '秧秧', r: 4, owned: 1, chain: 3, level: 80, spare: 2, equipWeapon: null },
    };
    bumpStateVersion();
    const el = mount(<RoleGrid />);
    expect(el.textContent).toContain('忌炎');
    expect(el.textContent).toContain('秧秧');
    expect(el.textContent).toContain('+3/6');
  });
});

describe('SidePanel tab switching', () => {
  it('defaults to stat tab', () => {
    resetState();
    bumpStateVersion();
    gachaTabSignal.value = 'stat';
    const el = mount(<SidePanel />);
    expect(el.textContent).toContain('总抽数');
  });

  it('switches to exchange tab', () => {
    resetState();
    bumpStateVersion();
    gachaTabSignal.value = 'ex';
    const el = mount(<SidePanel />);
    expect(el.textContent).toContain('余 波 珊 瑚');
  });

  it('switches to log tab', () => {
    resetState();
    bumpStateVersion();
    gachaTabSignal.value = 'log';
    const el = mount(<SidePanel />);
    expect(el.textContent).toContain('暂无记录');
  });
});

describe('StatsTab', () => {
  it('displays correct stats', () => {
    resetState();
    S.total = 100;
    S.five = 5;
    S.four = 25;
    S.upHits = 3;
    bumpStateVersion();
    const el = mount(<StatsTab />);
    expect(el.textContent).toContain('100');
    expect(el.textContent).toContain('5');
    expect(el.textContent).toContain('25');
    expect(el.textContent).toContain('20.0'); // avg = 100/5
    expect(el.textContent).toContain('3');
  });

  it('shows collection detail with role/weapon counts', () => {
    resetState();
    S.roles = {
      '忌炎': { n: '忌炎', r: 5, owned: 1, chain: 0, level: 90 },
      '秧秧': { n: '秧秧', r: 4, owned: 1, chain: 0, level: 80 },
    };
    bumpStateVersion();
    const el = mount(<StatsTab />);
    expect(el.textContent).toContain('角色 ★5 × 1');
    expect(el.textContent).toContain('★4 × 1');
  });
});

describe('LogTab', () => {
  it('shows empty state when log is empty', () => {
    resetState();
    S.log = [];
    bumpStateVersion();
    const el = mount(<LogTab />);
    expect(el.textContent).toContain('暂无记录');
  });

  it('renders log entries', () => {
    resetState();
    S.log = [
      { r: 5, n: '忌炎', up: true, date: '2024-05-23', no: 42 },
      { r: 4, n: '秧秧', up: false, date: '2024-05-23', no: 41 },
      { r: 3, n: '三星武器', up: false, date: '2024-05-23', no: 40 },
    ];
    bumpStateVersion();
    const el = mount(<LogTab />);
    expect(el.textContent).toContain('忌炎');
    expect(el.textContent).toContain('秧秧');
    expect(el.textContent).toContain('5★');
    expect(el.textContent).toContain('4★');
    expect(el.textContent).toContain('3★');
    expect(el.textContent).toContain('#42');
  });
});
