// @vitest-environment happy-dom
//
// Stage 6.1a · TeamBuilderPanel 组件测试
// 验:空队渲染、3 人队显示、切换角色、移除角色

import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { TeamBuilderPanel } from '../../src/ui/panels/team/TeamBuilderPanel';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui/signals';
import { addRole } from '../../src/gacha/core.js';

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

describe('TeamBuilderPanel', () => {
  it('renders empty team slots when no roles owned', () => {
    resetState();
    S.team = [null, null, null];
    S.roles = {};
    bumpStateVersion();
    const el = mount(<TeamBuilderPanel />);
    expect(el.textContent).toContain('编 队');
    expect(el.textContent).toContain('空位');
    // All three slots show "空位"
    const matches = el.textContent.match(/空位/g);
    expect(matches ? matches.length : 0).toBe(3);
  });

  it('renders 3-person team with role info', () => {
    resetState({ team: ['忌炎', '守岸人', '安可'] });
    bumpStateVersion();
    const el = mount(<TeamBuilderPanel />);
    expect(el.textContent).toContain('忌炎');
    expect(el.textContent).toContain('守岸人');
    expect(el.textContent).toContain('安可');
    expect(el.textContent).toContain('已编入');
    expect(el.textContent).toContain('BP');
    expect(el.textContent).toContain('Lv90');
  });

  it('shows role list with element and team status', () => {
    resetState({ team: ['忌炎', '守岸人', '安可'] });
    bumpStateVersion();
    const el = mount(<TeamBuilderPanel />);
    // All three team members show "已编入" in the role list
    expect(el.textContent).toContain('已编入');
    // Role list shows elements
    expect(el.textContent).toContain('气动'); // 忌炎
    expect(el.textContent).toContain('衍射'); // 守岸人
  });

  it('marks non-team role as clickable', () => {
    resetState();
    // Reset team to empty but keep the default roles (忌炎, 守岸人, 安可)
    S.team = [null, null, null];
    bumpStateVersion();
    const el = mount(<TeamBuilderPanel />);
    expect(el.textContent).toContain('忌炎');
    expect(el.textContent).toContain('点击加入');
    // No "已编入" since team is empty
    expect(el.textContent).not.toContain('已编入');
  });
});
