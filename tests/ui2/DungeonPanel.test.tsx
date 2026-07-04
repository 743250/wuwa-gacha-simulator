// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui2/signals.js';
import { DungeonPanel } from '../../src/ui2/panels/dungeon/DungeonPanel';
import { setDungeonTab, getDungeonTab } from '../../src/ui/dungeon.js';

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

describe('DungeonPanel', () => {
  it('shows stamina bar and SOL3 selector in empty state', () => {
    resetState();
    bumpStateVersion();
    const el = mount(<DungeonPanel />);
    // stamina bar present
    expect(el.textContent).toContain('结晶波片');
    expect(el.textContent).toContain('240 / 240');
    // SOL3 selector present
    expect(el.textContent).toContain('世界等级');
    expect(el.textContent).toContain('世界等级 1');
  });

  it('renders dungeon card grid for "exp" tab', () => {
    resetState();
    setDungeonTab('exp');
    bumpStateVersion();
    const el = mount(<DungeonPanel />);
    // Should show at least one dungeon card
    const cards = el.querySelectorAll('.dng-card');
    expect(cards.length).toBeGreaterThan(0);
    expect(el.textContent).toContain('模拟战训');
    // Cards should have a 挑战 button
    const challengeBtns = el.querySelectorAll('.dng-card .mbtn.gold');
    expect(challengeBtns.length).toBeGreaterThan(0);
  });

  it('switches content when tab changes', () => {
    resetState();
    setDungeonTab('exp');
    bumpStateVersion();
    // Mount first on exp tab
    const el = mount(<DungeonPanel />);
    expect(el.textContent).toContain('模拟战训·共鸣经验');

    // Switch to weapon tab - remount to reflect new tab
    setDungeonTab('weapon');
    bumpStateVersion();
    render(<DungeonPanel />, container!);
    // Weapon tab dungeon cards should appear
    expect(el.textContent).toContain('锻造挑战');
    // Tab sidebar still shows "模拟战训" as a group label — check that no EXP cards appear
    expect(el.textContent).not.toContain('模拟战训·共鸣经验');
  });

  it('reactively rerenders when S changes and bumpStateVersion fires', async () => {
    resetState();
    // Set stamina low to show "缺体力" state
    S.stamina = 5;
    bumpStateVersion();
    const el = mount(<DungeonPanel />);
    // Should show low stamina alert
    expect(el.textContent).toContain('波片不足');

    // Restore stamina
    S.stamina = 240;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    // Alert should disappear
    expect(el.textContent).not.toContain('波片不足');
    // Challenge button should be available
    expect(el.textContent).toContain('挑战');
  });
});
