export function renderRoleModalChainTab({ n, o, preview, previewNote, seqLines }) {
  const canUp = !preview && o.spare > 0 && o.chain < 6;
  return `
    ${previewNote}
    <div style="font-size:11px;color:var(--muted);letter-spacing:.5px;text-align:center;margin:0 0 8px">
      共鸣链 <b style="color:var(--gold)">${o.chain}/6</b> · 回音频段 <b style="color:var(--accent)">${o.spare}</b>${o.bought ? ' · 海市兑换 ' + o.bought + '/2' : ''}
    </div>
    <div class="chain">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i <= o.chain ? 'on' : ''}">${i}链</i>`).join('')}</div>
    <div style="margin:10px 0;text-align:center">
      <button class="mbtn ${canUp ? 'gold' : ''}" onclick="window.__activateChain('${n.replace(/'/g, "\\'")}')" ${canUp ? '' : 'disabled'}>${preview ? '0 链基础效果' : (o.chain >= 6 ? '已满 6 链' : (canUp ? `✦ 激活 ${o.chain + 1} 链（消耗 1 回音频段）` : '无回音频段'))}</button>
    </div>
    ${seqLines.length ? `<div class="seq-detail">
      ${seqLines.map((L, i) => `<div class="seq-line ${i < o.chain ? 'owned' : ''}">
        <b class="seq-name ${i < o.chain ? 'owned' : ''}">${i + 1}链 · ${L.name}</b>
        <div class="seq-desc">${L.desc}</div>
      </div>`).join('')}
    </div>` : '<div style="font-size:11px;color:var(--dim);text-align:center;padding:10px">暂无共鸣链文案</div>'}`;
}
