// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { WastesPanel } from '../../src/ui/panels/wastes/WastesPanel';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui/signals';
import { activePhase } from '../../src/gacha/core';

/** Return the current phase version string so resetWastesIfNeeded won't wipe test data. */
function phaseVersion() {
  return ((activePhase() as any)[0] || {}).v || 'unknown';
}

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

describe('WastesPanel', () => {
  it('renders header and all 5 stages in empty state', () => {
    resetState();
    bumpStateVersion();
    const el = mount(h(WastesPanel, null));
    expect(el.textContent).toContain('冥 歌 海 墟');
    expect(el.textContent).toContain('浅滩');
    expect(el.textContent).toContain('暗流');
    expect(el.textContent).toContain('漩涡');
    expect(el.textContent).toContain('深渊');
    expect(el.textContent).toContain('终渊');
  });

  it('shows score tier cards with unclaimed state', () => {
    resetState();
    bumpStateVersion();
    const el = mount(h(WastesPanel, null));
    expect(el.textContent).toContain('青铜积分');
    expect(el.textContent).toContain('白银积分');
    expect(el.textContent).toContain('黄金积分');
    expect(el.textContent).toContain('4,000 分');
    expect(el.textContent).toContain('6,000 分');
    expect(el.textContent).toContain('8,000 分');
    expect(el.textContent).toContain('200 星声');
    expect(el.textContent).toContain('250 星声');
    expect(el.textContent).toContain('350 星声');
  });

  it('marks tiers as claimed when S.wastes.tiersClaimed is set', () => {
    resetState();
    const ver = phaseVersion();
    S.wastes = { scores: { w1: 2000, w2: 2500, w3: 3000, w4: 1000, w5: 500 }, tokensPicked: {}, lastVersion: ver, cumulativeScore: 9000, tiersClaimed: [4000, 6000] };
    bumpStateVersion();
    const el = mount(h(WastesPanel, null));
    expect(el.textContent).toContain('✓ 已领');
    expect(el.textContent).toContain('350 星声');
  });

  it('displays stage scores and cumulative total', () => {
    resetState();
    const ver = phaseVersion();
    S.wastes = { scores: { w1: 1500, w2: 0, w3: 0, w4: 0, w5: 0 }, tokensPicked: {}, lastVersion: ver, cumulativeScore: 1500, tiersClaimed: [] };
    bumpStateVersion();
    const el = mount(h(WastesPanel, null));
    expect(el.textContent).toContain('1,500');
    expect(el.textContent).toContain('累计积分');
  });

  it('reactively rerenders when S changes and bumpStateVersion fires', async () => {
    resetState();
    const ver = phaseVersion();
    S.wastes = { scores: {}, tokensPicked: {}, lastVersion: ver, cumulativeScore: 0, tiersClaimed: [] };
    bumpStateVersion();
    const el = mount(h(WastesPanel, null));
    expect(el.textContent).toContain('0');
    S.wastes.cumulativeScore = 4500;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(el.textContent).toContain('4,500');
  });
});
