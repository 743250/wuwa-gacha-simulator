export function renderRoleModalWeaponTab({ n, meta, wName, wInfo, wObj, preview, weaponDetailHtml, weaponBook, weaponNextCost }) {
  return `
    <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02)">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
        <span style="font-size:9px;color:var(--muted);letter-spacing:2px">装 备 武 器</span>
        <span style="font-size:10px;padding:2px 8px;border:1px solid var(--line2);color:var(--muted);border-radius:999px">${meta.weaponType}</span>
      </div>
      <div style="font-size:13px;font-weight:700;color:${wName ? 'var(--gold)' : 'var(--dim)'}">${wInfo}</div>
      ${preview ? '<div style="font-size:10px;color:var(--gold);margin-top:8px">未持有时仅显示适配武器类型。</div>' : (weaponDetailHtml || '<div style="font-size:10px;color:var(--dim);margin-top:8px">点击下方"装备"选择匹配的武器</div>')}
      <div style="display:flex;gap:5px;margin-top:10px;flex-wrap:wrap">
        <button class="mbtn" onclick="openWeaponPicker('${n.replace(/'/g, "\\'")}')" ${preview ? 'disabled' : ''}>${preview ? '未持有' : (wName ? '换装' : '装备')}</button>
        ${!preview && wName ? `<button class="mbtn" onclick="window.__doUnequip('${n.replace(/'/g, "\\'")}')">卸下</button>` : ''}
        ${!preview && wName && wObj.level < 90 ? `<button class="mbtn gold" onclick="window.__levelUpWeapon('${wName.replace(/'/g, "\\'")}')">武器升级 (${weaponNextCost} 石)</button>` : ''}
        ${!preview && wName && wObj.level < 90 ? `<button class="mbtn" onclick="window.__levelUpWeaponMax('${wName.replace(/'/g, "\\'")}')">升满</button>` : ''}
      </div>
      <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:10px">武器石库存 <b style="color:var(--gold)">${weaponBook}</b></div>
    </div>`;
}
