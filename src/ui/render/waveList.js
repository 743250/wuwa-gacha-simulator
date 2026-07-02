import { $ } from '../../state.js';
import { standard5, fourAll, bannerNames } from '../../data/chars.js';

export function renderWaveList(state) {
  const allFiveStars = [...new Set([...standard5, ...Object.keys(bannerNames).filter(n => !standard5.includes(n) && !fourAll.includes(n))])];
  const waveCandidates = [];
  for (const name of allFiveStars) {
    const realName = Object.keys(state.roles).find(x => x === name || x.includes(name)) || name;
    const owned = state.roles[realName];
    if (!owned || owned.owned <= 0) continue;
    if (owned.chain >= 6) continue;
    const isStd = standard5.includes(name);
    const cost = isStd ? 270 : 360;
    const used = state.waveBuy[name] || 0;
    const can = Math.min(2 - used, Math.floor(state.afterglow / cost));
    waveCandidates.push({ name, realName, cost, used, can, isStd });
  }
  if (waveCandidates.length > 0) {
    $('waveList').innerHTML = waveCandidates.map(c => `<div class="exch">
      <div class="n"><span>${c.name}的回音频段</span><span class="own">已购 <b>${c.used}</b> / 2</span></div>
      <div class="btns">
        <button class="mbtn gold" onclick="openWaveModal()" ${c.can <= 0 ? 'disabled' : ''}>余波 ${c.cost} / 个 · 可换 ${c.can}</button>
      </div>
    </div>`).join('');
  } else {
    $('waveList').innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:12px;letter-spacing:1px">无可兑换回音频段的五星角色（已满链或未拥有）</div>';
  }
}
