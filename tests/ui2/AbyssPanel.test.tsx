// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui2/signals.js';
import { AbyssPanel } from '../../src/ui2/panels/abyss/AbyssPanel';

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

describe('AbyssPanel', () => {
  it('shows empty team warning when no team is set', () => {
    resetState();
    S.team = [null, null, null];
    bumpStateVersion();
    const el = mount(<AbyssPanel />);
    expect(el.textContent).toContain('编队为空');
    expect(el.textContent).toContain('逆 境 深 塔');
  });

  it('renders three hazard towers (回音/残响/深境)', () => {
    resetState();
    bumpStateVersion();
    const el = mount(<AbyssPanel />);
    expect(el.textContent).toContain('回音之塔');
    expect(el.textContent).toContain('残响之塔');
    expect(el.textContent).toContain('深境之塔');
    // 检查三大区 tab
    expect(el.textContent).toContain('稳定区');
    expect(el.textContent).toContain('实验区');
    expect(el.textContent).toContain('危险区');
  });

  it('displays vigor info for hazard zone with team', () => {
    resetState();
    // 给编队角色手动设置活力
    if (!S.abyss) S.abyss = { stars: {}, lastReset: '', vigor: {} };
    if (!S.abyss.vigor) S.abyss.vigor = {};
    S.abyss.vigor['忌炎'] = 8;
    S.abyss.vigor['守岸人'] = 6;
    S.abyss.vigor['安可'] = 10;
    bumpStateVersion();
    const el = mount(<AbyssPanel />);
    expect(el.textContent).toContain('活力');
    expect(el.textContent).toContain('8/10');
    expect(el.textContent).toContain('10/10');
  });

  it('reacts to state changes via bumpStateVersion (star earned changes)', async () => {
    resetState();
    // 设置初始无星
    if (!S.abyss) S.abyss = { stars: {}, lastReset: '', vigor: {} };
    S.abyss.stars = {};
    bumpStateVersion();
    const el = mount(<AbyssPanel />);
    expect(el.textContent).toContain('★ 0/12');

    // 给危险区一些星
    if (!S.abyss) S.abyss = { stars: {}, lastReset: '', vigor: {} };
    S.abyss.stars['hl1'] = 3;
    S.abyss.stars['hl2'] = 3;
    S.abyss.stars['hl3'] = 3;
    S.abyss.stars['hl4'] = 3;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(el.textContent).toContain('★ 12/');
  });
});
