export function renderRoleModalBasicTab({ o, stats, bp, previewNote }) {
  return `
    ${previewNote}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
      <div style="border:1px solid var(--line);border-radius:8px;padding:8px;background:rgba(255,255,255,.02);text-align:center">
        <div style="font-size:9px;color:var(--muted);letter-spacing:2px">等级</div>
        <div style="font-size:18px;font-weight:700;margin-top:2px"><b>LV ${o.level}</b> / 90</div>
      </div>
      <div style="border:1px solid var(--line);border-radius:8px;padding:8px;background:rgba(245,207,107,.04);text-align:center">
        <div style="font-size:9px;color:var(--muted);letter-spacing:2px">战力</div>
        <div style="font-size:18px;font-weight:700;margin-top:2px;color:var(--gold)">${bp.toLocaleString()}</div>
      </div>
    </div>
    <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02)">
      <div style="font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:8px">面 板 属 性</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--muted);line-height:1.8">
        <div>💚 生命 <b style="color:var(--green);float:right">${stats.hp.toLocaleString()}</b></div>
        <div>⚔ 攻击 <b style="color:var(--red);float:right">${stats.atk.toLocaleString()}</b></div>
        <div>🛡 防御 <b style="color:var(--blue);float:right">${stats.def.toLocaleString()}</b></div>
        <div>⚡ 能量 <b style="color:var(--accent);float:right">${stats.maxEnergy}</b></div>
        <div>✦ 暴击 <b style="color:var(--gold);float:right">${(stats.crate*100).toFixed(1)}%</b></div>
        <div>✦ 暴伤 <b style="color:var(--gold);float:right">${((stats.cdmg-1)*100).toFixed(0)}%</b></div>
        <div>💨 闪避 <b style="color:#8de6a6;float:right">${((stats.dodge||0)*100).toFixed(0)}%</b></div>
        <div>🎵 共鸣效率 <b style="color:#c39bff;float:right">${(100+(stats.resonanceBonus||0)*100).toFixed(1)}%</b></div>
      </div>
    </div>
    <div style="margin-top:10px;padding:9px 11px;border:1px solid var(--line);border-radius:8px;background:rgba(141,230,166,.03);font-size:11px;color:var(--muted);line-height:1.6">
      <div style="color:var(--accent);font-size:10px;letter-spacing:1px;margin-bottom:3px">💡 闪避率</div>
      敌方攻击时按此概率躲避。主C 18% / 副C 14% / 辅助 10% / 治疗 8%
    </div>`;
}
