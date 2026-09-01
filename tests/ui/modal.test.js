// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { h } from 'preact';

function mountModal() {
  document.body.innerHTML = `
    <div id="modal">
      <div id="modalBox"></div>
    </div>
  `;
}

describe('openModal 统一走 Preact', () => {
  beforeEach(() => {
    mountModal();
  });

  it('字符串 body 只注入 .desc，按钮用 Preact onClick 而不是 data-i', async () => {
    const { openModal } = await import('../../src/modal.js');
    const fn = vi.fn();
    openModal({
      title: '使用星声补足十连',
      body: '完成 <b>10</b> 连',
      actions: [
        { label: '取消', cls: '', fn: () => {} },
        { label: '确认十连', cls: 'primary', fn },
      ],
    });
    const box = document.getElementById('modalBox');
    expect(box.querySelector('h3').textContent).toBe('使用星声补足十连');
    expect(box.querySelector('.desc b').textContent).toBe('10');
    expect(box.querySelectorAll('[data-i]')).toHaveLength(0);
    const confirm = [...box.querySelectorAll('.modal-acts button')].find(b => b.textContent === '确认十连');
    confirm.click();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(document.getElementById('modal').classList.contains('on')).toBe(false);
  });

  it('VNode body 直接作为子节点渲染', async () => {
    const { openModal } = await import('../../src/modal.js');
    openModal({
      title: '选择版本',
      body: h('div', { class: 'pick' }, '跳到该版本'),
      actions: [{ label: '关闭', cls: '', fn: () => {} }],
    });
    expect(document.querySelector('#modalBox .pick').textContent).toBe('跳到该版本');
  });
});
