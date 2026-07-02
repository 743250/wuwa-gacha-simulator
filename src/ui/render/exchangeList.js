import { $ } from '../../state.js';

export function renderExchangeList(state, collabActive) {
  $('cAg').textContent = state.afterglow;
  $('cOs').textContent = state.oscillated;
  $('cAgHint').textContent = `可换 ${Math.floor(state.afterglow / 8)} 抽`;
  $('cOsHint').textContent = `可换 ${Math.floor(state.oscillated / 70)} 抽`;

  const tides = [['radiant', '浮金波纹'], ['forging', '铸潮波纹'], ['lustrous', '唤声涡纹']];
  if (collabActive) {
    tides.push(['dream', '捕梦波纹'], ['mirage', '铭影波纹']);
  }

  $('exList').innerHTML = tides.map(([k, n]) => {
    const agMax = Math.floor(state.afterglow / 8);
    const osLeft = 7 - (state.oscBuy[k] || 0);
    const osMax = Math.min(Math.floor(state.oscillated / 70), osLeft);
    return `<div class="exch">
      <div class="n"><span>${n}</span><span class="own">持有 <b>${state[k]||0}</b> 个</span></div>
      <div class="btns">
        <button class="mbtn" onclick="openExchangeModal('${k}','${n}','afterglow')" ${agMax <= 0 ? 'disabled' : ''}>余 波 · 最多 ${agMax}</button>
        <button class="mbtn gold" onclick="openExchangeModal('${k}','${n}','oscillated')" ${osMax <= 0 ? 'disabled' : ''}>残 振 · 剩 ${osLeft}/7</button>
      </div>
    </div>`;
  }).join('');
}
