import { h } from 'preact';

interface BasicTabProps {
  level: number;
  bp: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    maxEnergy: number;
    crate: number;
    cdmg: number;
    dodge?: number;
    resonanceBonus?: number;
  };
  previewNote: string;
}

export function BasicTab({ level, bp, stats, previewNote }: BasicTabProps) {
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: previewNote }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 8, background: 'rgba(255,255,255,.02)', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>等级</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}><b>LV {level}</b> / 90</div>
        </div>
        <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 8, background: 'rgba(245,207,107,.04)', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>战力</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: 'var(--gold)' }}>{bp.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '11px 13px', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 8 }}>面 板 属 性</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
          <div>💚 生命 <b style={{ color: 'var(--green)', float: 'right' }}>{stats.hp.toLocaleString()}</b></div>
          <div>⚔ 攻击 <b style={{ color: 'var(--red)', float: 'right' }}>{stats.atk.toLocaleString()}</b></div>
          <div>🛡 防御 <b style={{ color: 'var(--blue)', float: 'right' }}>{stats.def.toLocaleString()}</b></div>
          <div>⚡ 能量 <b style={{ color: 'var(--accent)', float: 'right' }}>{stats.maxEnergy}</b></div>
          <div>✦ 暴击 <b style={{ color: 'var(--gold)', float: 'right' }}>{(stats.crate * 100).toFixed(1)}%</b></div>
          <div>✦ 暴伤 <b style={{ color: 'var(--gold)', float: 'right' }}>{((stats.cdmg - 1) * 100).toFixed(0)}%</b></div>
          <div>💨 闪避 <b style={{ color: '#8de6a6', float: 'right' }}>{((stats.dodge || 0) * 100).toFixed(0)}%</b></div>
          <div>🎵 共鸣效率 <b style={{ color: '#c39bff', float: 'right' }}>{(100 + (stats.resonanceBonus || 0) * 100).toFixed(1)}%</b></div>
        </div>
      </div>

      <div style={{ marginTop: 10, padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 8, background: 'rgba(141,230,166,.03)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
        <div style={{ color: 'var(--accent)', fontSize: 10, letterSpacing: 1, marginBottom: 3 }}>💡 闪避率</div>
        敌方攻击时按此概率躲避。主C 18% / 副C 14% / 辅助 10% / 治疗 8%
      </div>
    </div>
  );
}
