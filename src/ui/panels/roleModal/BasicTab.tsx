import { h } from 'preact';

interface BasicTabProps {
  level: number;
  bp: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    maxEnergy?: number;
    crate: number;
    cdmg: number;
    dodge?: number;
    resonanceBonus?: number;
    normalBonus?: number;
    skillBonus?: number;
    heavyBonus?: number;
    burstBonus?: number;
    healBonus?: number;
    elemAllBonus?: number;
    elemBonus?: Record<string, number>;
    element?: string;
    defPierce?: number;
  };
  previewNote: string;
}

function pct(v: number | null | undefined, digits = 1): string {
  if (v == null || !isFinite(v)) return '0.0%';
  return (v * 100).toFixed(digits) + '%';
}

/** 官方共鸣效率面板 = 100% + 加成 */
function resonancePct(bonus: number | null | undefined): string {
  return (100 + (bonus || 0) * 100).toFixed(1) + '%';
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
      <span style={{ color: 'var(--muted)', fontSize: 11, whiteSpace: 'nowrap' }}>{label}</span>
      <b style={{ color: color || 'var(--text)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{value}</b>
    </div>
  );
}

export function BasicTab({ level, bp, stats, previewNote }: BasicTabProps) {
  const elem = stats.element || '';
  const elemBonus =
    (stats.elemAllBonus || 0) +
    (elem && stats.elemBonus ? (stats.elemBonus[elem] || 0) : 0);

  // 与官方共鸣者属性表对齐的两列网格（至少覆盖官方条目）
  const rows: Array<{ label: string; value: string; color?: string }> = [
    { label: '生命', value: (stats.hp || 0).toLocaleString(), color: 'var(--green)' },
    { label: '攻击', value: (stats.atk || 0).toLocaleString(), color: 'var(--red)' },
    { label: '防御', value: (stats.def || 0).toLocaleString(), color: 'var(--blue)' },
    { label: '暴击', value: pct(stats.crate), color: 'var(--gold)' },
    { label: '暴击伤害', value: pct(stats.cdmg), color: 'var(--gold)' },
    { label: '共鸣效率', value: resonancePct(stats.resonanceBonus), color: '#c39bff' },
    // 模拟器暂无独立偏谐值养成，基础 100%（与官方面板一致显示）
    { label: '偏谐值累积效率', value: '100.0%', color: 'var(--text)' },
    { label: '共鸣技能伤害加成', value: pct(stats.skillBonus || 0) },
    { label: '普攻伤害加成', value: pct(stats.normalBonus || 0) },
    { label: '重击伤害加成', value: pct(stats.heavyBonus || 0) },
    { label: '共鸣解放伤害加成', value: pct(stats.burstBonus || 0) },
    { label: elem ? `${elem}伤害加成` : '属性伤害加成', value: pct(elemBonus), color: elemBonus > 0 ? 'var(--accent)' : undefined },
  ];

  // 有治疗加成时追加（治疗位）
  if ((stats.healBonus || 0) > 0) {
    rows.push({ label: '治疗加成', value: pct(stats.healBonus || 0), color: '#8de6a6' });
  }
  // 模拟器扩展：能量上限 / 闪避 / 防御穿透（官方面板没有，但战斗有用）
  if (stats.maxEnergy != null) {
    rows.push({ label: '能量上限', value: String(stats.maxEnergy), color: 'var(--accent)' });
  }
  if ((stats.dodge || 0) > 0) {
    rows.push({ label: '闪避', value: pct(stats.dodge || 0, 0), color: '#8de6a6' });
  }
  if ((stats.defPierce || 0) > 0) {
    rows.push({ label: '防御穿透', value: pct(stats.defPierce || 0), color: 'var(--red)' });
  }

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
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          共 鸣 者 属 性
          <span title="最终值 = 基础 + 武器 + 声骸 + 共鸣链增益" style={{ color: 'var(--accent)', cursor: 'help', fontSize: 11 }}>ⓘ</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
          {rows.map((r) => (
            <StatRow key={r.label} label={r.label} value={r.value} color={r.color} />
          ))}
        </div>
      </div>
    </div>
  );
}
