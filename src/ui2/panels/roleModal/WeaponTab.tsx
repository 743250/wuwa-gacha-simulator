import { h } from 'preact';

interface WeaponTabProps {
  roleName: string;
  weaponType: string;
  wName: string | null;
  wInfo: string;
  wObj: { level: number } | null;
  preview: boolean;
  weaponDetailHtml: string;
  weaponBook: number;
  weaponNextCost: number;
}

export function WeaponTab({ roleName, weaponType, wName, wInfo, wObj, preview, weaponDetailHtml, weaponBook, weaponNextCost }: WeaponTabProps) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '11px 13px', background: 'rgba(255,255,255,.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>装 备 武 器</span>
        <span style={{ fontSize: 10, padding: '2px 8px', border: '1px solid var(--line2)', color: 'var(--muted)', borderRadius: 999 }}>{weaponType}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: wName ? 'var(--gold)' : 'var(--dim)' }}>{wInfo}</div>
      {preview ? (
        <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 8 }}>未持有时仅显示适配武器类型。</div>
      ) : (
        weaponDetailHtml ? (
          <div dangerouslySetInnerHTML={{ __html: weaponDetailHtml }} />
        ) : (
          <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 8 }}>点击下方"装备"选择匹配的武器</div>
        )
      )}
      <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
        <button class="mbtn" onClick={() => (window as any).openWeaponPicker?.(roleName)} disabled={preview}
          style={preview ? { opacity: 0.5 } : {}}>
          {preview ? '未持有' : (wName ? '换装' : '装备')}
        </button>
        {!preview && wName && (
          <button class="mbtn" onClick={() => (window as any).__doUnequip?.(roleName)}>卸下</button>
        )}
        {!preview && wName && wObj && wObj.level < 90 && (
          <>
            <button class="mbtn gold" onClick={() => (window as any).__levelUpWeapon?.(wName)}>
              武器升级 ({weaponNextCost} 石)
            </button>
            <button class="mbtn" onClick={() => (window as any).__levelUpWeaponMax?.(wName)}>升满</button>
          </>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
        武器石库存 <b style={{ color: 'var(--gold)' }}>{weaponBook}</b>
      </div>
    </div>
  );
}
