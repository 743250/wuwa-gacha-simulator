// @vitest-environment happy-dom
//
// Stage 1 smoke test:证明 preact + signals + happy-dom + tsx 全链路打通。
// 用 preact 原生 render,不走 @testing-library/preact —— 后者的 3.2.4 与 preact 10.29 的
// test-utils act API 存在兼容性 bug(TypeError: Cannot read properties of undefined 读 '__k')。
// 组件规模变大时再回来评估要不要引 testing-library;当前手写 assertion 足够。

import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { signal } from '@preact/signals';

let container: HTMLDivElement | null = null;

function mount(node: preact.ComponentChild): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  render(node as any, container);
  return container;
}

afterEach(() => {
  if (container) {
    render(null, container);
    container.remove();
    container = null;
  }
});

describe('ui2 smoke · preact + signals + happy-dom', () => {
  it('renders a plain component into a container', () => {
    function Hello() {
      return h('div', { 'data-testid': 'hello' }, 'preact 打通');
    }
    const el = mount(h(Hello, null));
    expect(el.querySelector('[data-testid="hello"]')?.textContent).toBe('preact 打通');
  });

  it('reactively renders a signal-driven component', async () => {
    const count = signal(0);
    function Counter() {
      return h('div', { 'data-testid': 'count' }, String(count.value));
    }
    const el = mount(h(Counter, null));
    expect(el.querySelector('[data-testid="count"]')?.textContent).toBe('0');
    count.value = 42;
    // preact + @preact/signals 用 microtask 调度重渲染,等一次 flush
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(el.querySelector('[data-testid="count"]')?.textContent).toBe('42');
  });
});
