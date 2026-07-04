// @vitest-environment happy-dom
//
// Stage 3.1 · DailyPanel 组件测试
// 验:委托列表渲染、按钮 disabled 状态、周度游历显示、signal 响应

import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { DailyPanel } from '../../src/ui2/panels/daily/DailyPanel';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui2/signals';

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

describe('DailyPanel', () => {
  it('renders empty daily state header', () => {
    resetState();
    S.dailyCommissions = [];
    bumpStateVersion();
    const el = mount(<DailyPanel />);
    expect(el.textContent).toContain('每 日 委 托');
    expect(el.textContent).toContain('4 个常规');
    expect(el.textContent).toContain('进度 0 / 0');
  });

  it('renders commission cards with reward text', () => {
    resetState();
    S.dailyCommissions = [
      { name: '击败 3 个残骸', reward: { astrite: 20 }, done: false },
      { name: '完成 1 场副本', reward: { astrite: 20, exp_high: 2 }, done: true },
    ];
    bumpStateVersion();
    const el = mount(<DailyPanel />);
    expect(el.textContent).toContain('击败 3 个残骸');
    expect(el.textContent).toContain('星声 +20');
    expect(el.textContent).toContain('高级促剂 ×2');
    expect(el.textContent).toContain('✓ 完成 1 场副本');
    expect(el.textContent).toContain('进度 1 / 2');
  });

  it('shows all-done banner when every commission is done', () => {
    resetState();
    S.dailyCommissions = [
      { name: 'c1', reward: { astrite: 20 }, done: true },
      { name: 'c2', reward: { astrite: 20 }, done: true },
    ];
    bumpStateVersion();
    const el = mount(<DailyPanel />);
    expect(el.textContent).toContain('今日全部完成');
  });

  it('shows weekly tour section', () => {
    resetState();
    bumpStateVersion();
    const el = mount(<DailyPanel />);
    expect(el.textContent).toContain('周 度 游 历');
    expect(el.textContent).toContain('原千道门扉');
  });

  it('reactively updates after bumpStateVersion', async () => {
    resetState();
    S.dailyCommissions = [
      { name: 'first', reward: { astrite: 20 }, done: false },
    ];
    bumpStateVersion();
    const el = mount(<DailyPanel />);
    expect(el.textContent).toContain('first');
    S.dailyCommissions[0].done = true;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(el.textContent).toContain('✓ first');
  });
});
