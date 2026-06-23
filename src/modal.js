// 通用弹窗
import { $ } from './state.js';

export function openModal({ title, body, qty, actions, className = '' }) {
  const box = $('modalBox');
  box.className = `modal-box ${className}`.trim();
  let html = `<h3>${title}</h3><div class="desc">${body}</div>`;
  if (qty) {
    html += `<div class="qty-row">
      <button class="qbtn" onclick="adjustQty(-1)">−</button>
      <input class="qty-input" id="qtyInput" type="number" min="${qty.min}" max="${qty.max}" value="${qty.init}">
      <button class="qbtn" onclick="adjustQty(1)">＋</button>
    </div>
    <div class="qty-presets">
      ${qty.presets.map(v => `<button onclick="setQty(${v})">${v}</button>`).join('')}
      <button onclick="setQty(${qty.max})">最大</button>
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
  }
  $('modal').classList.add('on');
}

export function adjustQty(d) { const i = $('qtyInput'); if (!i) return; i.value = Math.max(+i.min, Math.min(+i.max, (+i.value || 0) + d)); }
export function setQty(v) { const i = $('qtyInput'); if (!i) return; i.value = Math.max(+i.min, Math.min(+i.max, v)); }

// onclick 兼容
window.adjustQty = adjustQty;
window.setQty = setQty;
