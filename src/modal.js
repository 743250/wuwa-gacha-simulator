// 通用弹窗 · Stage 6.2 dual-mode
//   · body 为 string → 走 innerHTML（兼容老调用方）
//   · body 为 VNode → 走 Preact render（新调用方，闭包 onclick，无 window 桥）
import { h, render as preactRender } from 'preact';
import { $ } from './ui/services/toast.ts';

let preactRoot = null; // Preact 挂载点（VNode 模式）

function clearBox(box) {
  if (preactRoot) {
    preactRender(null, preactRoot);
    preactRoot.remove();
    preactRoot = null;
  }
  box.innerHTML = '';
}

export function openModal({ title, body, qty = null, actions, className = '', keepScroll = false }) {
  const box = $('modalBox');
  const savedScroll = keepScroll ? box.scrollTop : 0;
  box.className = `modal-box ${className}`.trim();
  clearBox(box);

  const isVNode = body && typeof body === 'object' && 'props' in body;

  if (isVNode) {
    // Preact 渲染：title + body + qty + actions 全部 JSX
    preactRoot = document.createElement('div');
    preactRoot.id = 'modalPreactRoot';
    box.appendChild(preactRoot);
    preactRender(h(ModalContent, { title, body, qty, actions }), preactRoot);
  } else {
    // 老 HTML 字符串模式
    let html = `<h3>${title}</h3><div class="desc">${body}</div>`;
    if (qty) {
      html += `<div class="qty-row">
        <button class="qbtn" data-act="dec">−</button>
        <input class="qty-input" id="qtyInput" type="number" min="${qty.min}" max="${qty.max}" value="${qty.init}">
        <button class="qbtn" data-act="inc">＋</button>
      </div>
      <div class="qty-presets">
        ${qty.presets.map(v => `<button data-preset="${v}">${v}</button>`).join('')}
        <button data-preset="${qty.max}">最大</button>
      </div>`;
    }
    html += `<div class="modal-acts">${actions.map((a, i) => `<button class="${a.cls}" data-i="${i}">${a.label}</button>`).join('')}</div>`;
    box.innerHTML = html;
    box.querySelectorAll('.modal-acts button').forEach((b, i) => {
      b.onclick = () => {
        const v = qty ? Math.max(qty.min, Math.min(qty.max, +($('qtyInput').value) || qty.min)) : null;
        $('modal').classList.remove('on');
        actions[i].fn(v);
      };
    });
    if (qty) {
      const inp = $('qtyInput');
      inp.oninput = () => { const n = +inp.value; if (n > qty.max) inp.value = qty.max; if (n < qty.min) inp.value = qty.min; };
      box.querySelectorAll('.qbtn[data-act]').forEach(b => {
        b.onclick = () => {
          const d = b.dataset.act === 'inc' ? 1 : -1;
          inp.value = Math.max(+inp.min, Math.min(+inp.max, (+inp.value || 0) + d));
        };
      });
      box.querySelectorAll('.qty-presets button[data-preset]').forEach(b => {
        b.onclick = () => {
          inp.value = Math.max(+inp.min, Math.min(+inp.max, +b.dataset.preset));
        };
      });
    }
  }

  $('modal').classList.add('on');
  if (keepScroll) box.scrollTop = savedScroll;
}

// Preact 模式的 modal 内容组件
function ModalContent({ title, body, qty, actions }) {
  const qtyVal = qty ? qty.init : null;
  return h('div', null,
    h('h3', null, title),
    h('div', { class: 'desc' }, body),
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
