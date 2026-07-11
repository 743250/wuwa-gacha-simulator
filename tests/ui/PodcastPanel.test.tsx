// @vitest-environment happy-dom

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render } from 'preact';
import { resetState } from '../../tests/helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui/signals.js';

vi.mock('../../src/shop/actions.js', () => ({ buyShop: vi.fn() }));

import { PodcastPanel } from '../../src/ui/panels/podcast/PodcastPanel';
import { PODCAST_REWARDS, PODCAST_MAX_LEVEL } from '../../src/podcast/core.js';
import { buyShop } from '../../src/shop/actions.js';

let container: HTMLDivElement | null = null;

function mount(node: any): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  render(node, container);
  return container;
}

afterEach(() => {
  vi.clearAllMocks();
  if (container) {
    render(null, container);
    container.remove();
    container = null;
  }
});

// Reset to a known podcast state: Lv 10, free rewards claimed up to 10, paid unclaimed
function setupPodcastState(overrides: any = {}) {
  resetState();
  S.podcast.level = overrides.level ?? 10;
  S.podcast.exp = overrides.exp ?? 350;
  S.podcast.paid = overrides.paid ?? false;
  S.podcast.premium = overrides.premium ?? false;
  S.podcast.claimedFree = overrides.claimedFree ?? [];
  S.podcast.claimedPaid = overrides.claimedPaid ?? [];
  S.podcast.version = overrides.version ?? '1.0';
  bumpStateVersion();
}

describe('PodcastPanel', () => {
  it('renders title with version number', () => {
    setupPodcastState({ version: '2.3' });
    const el = mount(<PodcastPanel />);
    expect(el.textContent).toContain('先约电台');
    expect(el.textContent).toContain('第 2.3 期');
  });

  it('shows level and exp in progress section', () => {
    setupPodcastState({ level: 15, exp: 200 });
    const el = mount(<PodcastPanel />);
    expect(el.textContent).toContain('Lv');
    expect(el.textContent).toContain('15');
    expect(el.textContent).toContain('/ 70');
    expect(el.textContent).toContain('200');
    expect(el.textContent).toContain('700');
  });

  it('shows "已订阅内幕频道" when paid is true', () => {
    setupPodcastState({ paid: true });
    const el = mount(<PodcastPanel />);
    expect(el.textContent).toContain('已订阅内幕频道');
    expect(el.textContent).not.toContain('解锁内幕频道');
  });

  it('shows buy button when paid is false', () => {
    setupPodcastState({ paid: false });
    const el = mount(<PodcastPanel />);
    expect(el.textContent).toContain('解锁内幕频道');
    expect(el.textContent).not.toContain('已订阅内幕频道');
  });

  it('内幕频道购买按钮会购买正确商品', () => {
    setupPodcastState({ paid: false, premium: false });
    const el = mount(<PodcastPanel />);
    const button = Array.from(el.querySelectorAll<HTMLButtonElement>('.pc-purchase button'))
      .find(x => x.textContent?.includes('¥68'));

    expect(button).toBeDefined();
    button!.click();
    expect(buyShop).toHaveBeenCalledWith('bp_basic');
  });

  it('寰宇频道购买按钮会购买正确商品', () => {
    setupPodcastState({ paid: false, premium: false });
    const el = mount(<PodcastPanel />);
    const button = Array.from(el.querySelectorAll<HTMLButtonElement>('.pc-purchase button'))
      .find(x => x.textContent?.includes('¥128'));

    expect(button).toBeDefined();
    button!.click();
    expect(buyShop).toHaveBeenCalledWith('bp_premium');
  });

  it('renders all 70 level cells in the track', () => {
    setupPodcastState();
    const el = mount(<PodcastPanel />);
    const cols = el.querySelectorAll('.pc-col');
    // All 70 levels should render as .pc-col divs
    expect(cols.length).toBe(70);
    // First cell should show "1", last should show "70"
    expect(cols[0].textContent).toContain('1');
    expect(cols[69].textContent).toContain('70');
  });

  it('marks claimed free cells with .claimed class', () => {
    // Claim first 3 free levels; also set level >= 3 so they are reachable
    setupPodcastState({ level: 5, claimedFree: [1, 2, 3] });
    const el = mount(<PodcastPanel />);
    const freeCells = el.querySelectorAll('.pc-cell-free.claimed');
    expect(freeCells.length).toBeGreaterThanOrEqual(3);
  });

  it('signals reactivity: textContent updates after state change and bump', async () => {
    setupPodcastState({ level: 5 });
    const el = mount(<PodcastPanel />);
    expect(el.textContent).toContain('Lv');
    expect(el.textContent).toContain('5');

    // Change level via S mutation + bump
    S.podcast.level = 42;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));

    expect(el.textContent).toContain('42');
    expect(el.textContent).not.toContain('Lv 5');
  });
});
