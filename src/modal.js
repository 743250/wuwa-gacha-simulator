// 通用弹窗
// 标题 / 数量选择 / 按钮一律 Preact 渲染（闭包 onclick，无 window 桥）。
// body 仍允许 HTML 字符串（海市/抽卡补足等调用方带 <b>/<br>），只在 .desc 内注入。
import { h, render as preactRender } from 'preact';
import { $ } from './ui/services/toast.ts';

let preactRoot = null;

function clearBox(box) {
  if (preactRoot) {
    preactRender(null, preactRoot);
    preactRoot.remove();
    preactRoot = null;
  }
  box.innerHTML = '';
}

function isVNode(body) {
  return !!(body && typeof body === 'object' && 'props' in body);
}

export function openModal({ title, body, qty = null, actions, className = '', keepScroll = false }) {
  const box = $('modalBox');
  const savedScroll = keepScroll ? box.scrollTop : 0;
  box.className = `modal-box ${className}`.trim();
  clearBox(box);

  preactRoot = document.createElement('div');
  preactRoot.id = 'modalPreactRoot';
  box.appendChild(preactRoot);
  preactRender(h(ModalContent, { title, body, qty, actions }), preactRoot);

  $('modal').classList.add('on');
  if (keepScroll) box.scrollTop = savedScroll;
}

function ModalContent({ title, body, qty, actions }) {
  const qtyVal = qty ? qty.init : null;
  const bodyNode = isVNode(body)
    ? body
    : h('div', { dangerouslySetInnerHTML: { __html: body || '' } });
  return h('div', null,
    h('h3', null, title),
    h('div', { class: 'desc' }, bodyNode),
    qty && h(QtyRow, { qty, value: qtyVal }),
    h('div', { class: 'modal-acts' },
      actions.map((a, i) => h('button', {
        class: a.cls,
        key: i,
        onClick: () => {
          let v = null;
          if (qty) {
            const inp = document.getElementById('qtyInput');
            v = Math.max(qty.min, Math.min(qty.max, +(inp?.value || qty.min)));
          }
          document.getElementById('modal').classList.remove('on');
          a.fn(v);
        }
      }, a.label))
    )
  );
}

function QtyRow({ qty, value }) {
  let cur = value;
  return h('div', null,
    h('div', { class: 'qty-row' },
      h('button', { class: 'qbtn', onClick: () => { cur = Math.max(qty.min, Math.min(qty.max, cur - 1)); const inp = document.getElementById('qtyInput'); if (inp) inp.value = cur; } }, '−'),
      h('input', { class: 'qty-input', id: 'qtyInput', type: 'number', min: qty.min, max: qty.max, value: qty.init, onInput: (e) => { const n = +e.target.value; if (n > qty.max) e.target.value = qty.max; if (n < qty.min) e.target.value = qty.min; } }),
      h('button', { class: 'qbtn', onClick: () => { cur = Math.max(qty.min, Math.min(qty.max, cur + 1)); const inp = document.getElementById('qtyInput'); if (inp) inp.value = cur; } }, '＋')
    ),
    h('div', { class: 'qty-presets' },
      qty.presets.map(v => h('button', { onClick: () => { const inp = document.getElementById('qtyInput'); if (inp) inp.value = v; } }, v)),
      h('button', { onClick: () => { const inp = document.getElementById('qtyInput'); if (inp) inp.value = qty.max; } }, '最大')
    )
  );
}

export function closeModal() {
  const m = $('modal');
  if (m) m.classList.remove('on');
  const box = $('modalBox');
  if (box) clearBox(box);
}

export function adjustQty(d) { const i = $('qtyInput'); if (!i) return; i.value = Math.max(+i.min, Math.min(+i.max, (+i.value || 0) + d)); }
export function setQty(v) { const i = $('qtyInput'); if (!i) return; i.value = Math.max(+i.min, Math.min(+i.max, v)); }
