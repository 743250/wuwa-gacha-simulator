import { h } from 'preact';

interface LevelupTabProps {
  roleName: string;
  level: number;
  preview: boolean;
  previewNote: string;
  expNext: number;
  expTotal: number;
  materials: {
    exp_super?: number;
    exp_high: number;
    exp_mid: number;
    exp_low: number;
  };
}

export function LevelupTab({ roleName, level, preview, previewNote, expNext, expTotal, materials }: LevelupTabProps) {
  if (preview) {
    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: previewNote }} />
        <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 18, background: 'rgba(255,255,255,.02)', color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
          未持有角色暂不开放培养。
        </div>
      </div>
    );
  }

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: previewNote }} />

      <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '11px 13px', background: 'rgba(255,255,255,.02)', marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 6 }}>角 色 等 级</div>
        <div style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          LV <b style={{ color: 'var(--gold)' }}>{level}</b> <span style={{ color: 'var(--muted)', fontSize: 14 }}>/ 90</span>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button class={`mbtn ${expTotal >= expNext && level < 90 ? 'gold' : ''}`}
            onClick={() => (window as any).__levelUpRole?.(roleName)}
            disabled={level >= 90}
            style={{ flex: 1 }}>
            升 1 级 ({expNext.toLocaleString()} exp)
          </button>
          <button class="mbtn"
            onClick={() => (window as any).__levelUpRoleMax?.(roleName)}
            disabled={level >= 90}
            style={{ flex: 1 }}>
            一键升满
          </button>
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', letterSpacing: 0.5, lineHeight: 1.8, padding: 8, background: 'rgba(255,255,255,.02)', borderRadius: 8 }}>
        <div>共鸣促剂库存</div>
        <div>
          <b style={{ color: 'var(--gold)' }}>特</b> {materials.exp_super || 0} ·
          <b style={{ color: '#fff' }}> 高</b> {materials.exp_high} ·
          <b style={{ color: 'var(--accent)' }}> 中</b> {materials.exp_mid} ·
          <b style={{ color: 'var(--green)' }}> 初</b> {materials.exp_low}
        </div>
        <div>合计 <b style={{ color: 'var(--gold)' }}>{expTotal.toLocaleString()}</b> 经验</div>
      </div>
    </div>
  );
}
