export function renderRoleModalEchoTab({ n, preview, previewNote, slots, totalCost, cap, activeSets, selIdx, selEcho, echos, getSetById, echoToNext, formatEchoStatValue, formatSetBonus }) {
  if (preview) {
    return `${previewNote}<div style="border:1px solid var(--line);border-radius:8px;padding:18px;background:rgba(255,255,255,.02);color:var(--muted);font-size:12px;text-align:center">未持有角色暂不开放声骸配置。</div>`;
  }
  return `
    ${previewNote}
    <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02);margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
        <span style="font-size:9px;color:var(--muted);letter-spacing:2px">声 骸 槽 位</span>
        <span style="font-size:10px;color:${totalCost > cap ? 'var(--red)' : 'var(--gold)'}">COST ${totalCost} / ${cap}</span>
      </div>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
        ${slots.map((id, i) => {
          const e = id != null ? echos.find(x => x.id === id) : null;
          const isSel = i === selIdx;
          const setObj = e ? getSetById(Array.isArray(e.set) ? e.set[0] : e.set) : null;
          const borderColor = e ? (setObj?.element ? ({'热熔':'#ff8c5e','冷凝':'#7bd6ff','导电':'#b58cff','气动':'#8de6a6','衍射':'#fff0b0','湮灭':'#c39bff'}[setObj.element] || '#fff') : '#999') : 'var(--line2)';
          const clickHandler = e
            ? `window.__selectEchoSlot('${n.replace(/'/g, "\\'")}',${i}); window.__bagEchoDetail(${e.id}, true)`
            : `window.__selectEchoSlot('${n.replace(/'/g, "\\'")}',${i}); window.__openEchoPicker('${n.replace(/'/g, "\\'")}',${i})`;
          return `<div class="echo-slot ${isSel ? 'selected' : ''}" onclick="${clickHandler}" style="border:${isSel ? '2' : '1'}px solid ${isSel ? 'var(--gold)' : borderColor};border-radius:8px;padding:7px 4px;text-align:center;${e ? '' : 'border-style:dashed;'}cursor:pointer;min-height:78px;display:flex;flex-direction:column;justify-content:center;align-items:center;background:${isSel ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)'};position:relative">
            ${e ? `<div style="font-size:9px;color:var(--gold);position:absolute;top:2px;left:4px">C${e.cost}</div>
              <div style="font-size:9px;color:var(--muted);position:absolute;top:2px;right:4px">+${e.level}</div>
              <div style="font-size:10px;font-weight:700;margin-top:10px;color:${borderColor};line-height:1.1;word-break:break-all">${e.name}</div>` : `<div style="font-size:18px;color:var(--dim)">＋</div><div style="font-size:9px;color:var(--dim);margin-top:3px">槽位 ${i+1}</div>`}
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:10px">点击已装备槽位查看详情 · 点击空槽位装备 · COST 上限 ${cap} · 持有 ${echos.length} 个</div>
    </div>
    ${selEcho ? (() => {
      const e = selEcho;
      const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
      const setColor = set?.element ? ({'热熔':'#ff8c5e','冷凝':'#7bd6ff','导电':'#b58cff','气动':'#8de6a6','衍射':'#fff0b0','湮灭':'#c39bff'}[set.element] || '#fff') : '#999';
      const canLevel = e.level < 25;
      const nextCost = canLevel ? echoToNext(e) : 0;
      return `<div style="border:1px solid ${setColor};border-radius:8px;padding:8px 13px;background:rgba(255,255,255,.02);margin-bottom:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <div style="font-size:12px;font-weight:700;color:${setColor}">${e.name}</div>
          <div style="font-size:10px;color:var(--muted)">LV ${e.level} · COST ${e.cost} · ${e.mainStat?.label || ''} ${e.mainStat ? formatEchoStatValue(e.mainStat.key, e.mainStat.value) : ''}${set ? ' · ' + set.name : ''}</div>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <button class="mbtn" onclick="window.__openEchoPicker('${n.replace(/'/g, "\\'")}',${selIdx})">换装</button>
          ${canLevel ? `<button class="mbtn gold" onclick="window.__echoLevelUp(${e.id})">升级 (${nextCost.toLocaleString()} exp)</button>` : ''}
          <button class="mbtn" onclick="window.__bagEchoDetail(${e.id}, true)">详情</button>
          <button class="mbtn" onclick="window.__unequipEchoSlot('${n.replace(/'/g, "\\'")}',${selIdx})">卸下</button>
        </div>
      </div>`;
    })() : `<div style="border:1px dashed var(--line2);border-radius:8px;padding:14px;text-align:center;color:var(--dim);font-size:11px;margin-bottom:10px">
      槽位 ${selIdx+1} 未装备声骸 · <a style="color:var(--gold);cursor:pointer" onclick="window.__openEchoPicker('${n.replace(/'/g, "\\'")}',${selIdx})">点击装备</a>
    </div>`}
    <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02)">
      <div style="font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:8px">已 激 活 套 装</div>
      ${activeSets.length ? activeSets.map(s => {
        const color = s.element ? ({'热熔':'#ff8c5e','冷凝':'#7bd6ff','导电':'#b58cff','气动':'#8de6a6','衍射':'#fff0b0','湮灭':'#c39bff'}[s.element] || '#fff') : 'var(--gold)';
        const bonus = s.tier === 2 ? s.bonus2 : s.bonus5;
        return `<div style="border:1px solid ${color};border-radius:6px;padding:7px 9px;margin-bottom:6px;background:rgba(255,255,255,.02)">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <span style="font-size:11px;font-weight:700;color:${color}">${s.name}</span>
            <span style="font-size:10px;color:var(--gold)">${s.tier}/5 ✦</span>
          </div>
          <div style="font-size:10px;color:var(--muted);margin-top:3px;line-height:1.5">${formatSetBonus(bonus)}</div>
        </div>`;
      }).join('') : '<div style="font-size:10px;color:var(--dim);text-align:center;padding:8px">未激活任何套装（2 件起激活）</div>'}
    </div>`;
}