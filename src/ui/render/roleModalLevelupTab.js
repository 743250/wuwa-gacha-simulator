export function renderRoleModalLevelupTab({ n, o, preview, previewNote, expNext, expTotal, materials }) {
  if (preview) {
    return `${previewNote}<div style="border:1px solid var(--line);border-radius:8px;padding:18px;background:rgba(255,255,255,.02);color:var(--muted);font-size:12px;text-align:center">未持有角色暂不开放培养。</div>`;
  }
  return `
    ${previewNote}
    <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02);margin-bottom:10px">
      <div style="font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:6px">角 色 等 级</div>
      <div style="font-size:20px;font-weight:700;text-align:center;margin-bottom:8px">LV <b style="color:var(--gold)">${o.level}</b> <span style="color:var(--muted);font-size:14px">/ 90</span></div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="mbtn ${expTotal >= expNext && o.level < 90 ? 'gold' : ''}" onclick="window.__levelUpRole('${n.replace(/'/g, "\\'")}')" ${o.level >= 90 ? 'disabled' : ''} style="flex:1">升 1 级 (${expNext.toLocaleString()} exp)</button>
        <button class="mbtn" onclick="window.__levelUpRoleMax('${n.replace(/'/g, "\\'")}')" ${o.level >= 90 ? 'disabled' : ''} style="flex:1">一键升满</button>
      </div>
    </div>
    <div style="font-size:10px;color:var(--muted);text-align:center;letter-spacing:.5px;line-height:1.8;padding:8px;background:rgba(255,255,255,.02);border-radius:8px">
      <div>共鸣促剂库存</div>
      <div><b style="color:var(--gold)">特</b> ${materials.exp_super || 0} · <b style="color:#fff">高</b> ${materials.exp_high} · <b style="color:var(--accent)">中</b> ${materials.exp_mid} · <b style="color:var(--green)">初</b> ${materials.exp_low}</div>
      <div>合计 <b style="color:var(--gold)">${expTotal.toLocaleString()}</b> 经验</div>
    </div>`;
}
