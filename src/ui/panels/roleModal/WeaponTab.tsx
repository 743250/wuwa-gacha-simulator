import { h } from 'preact';
import { S } from '../../../state.js';
import { msg } from '../../services/toast.ts';
import { openModal, closeModal } from '../../../modal.js';
import { levelUpWeapon, levelUpWeaponMax, unequipWeapon, getEquippableWeapons, equipWeapon, refineWeapon } from '../../../equip/actions.js';
import { bumpStateVersion } from '../../signals';
import { getWeaponArt } from '../../assets/index.ts';

interface WeaponTabProps {
  roleName: string;
  weaponType: string;
  wName: string | null;
  wInfo: string;
  wObj: { level: number; refine?: number; spareRefine?: number } | null;
  preview: boolean;
  weaponDetailHtml: string;
  weaponBook: number;
  weaponNextCost: number;
}

function openWeaponPickerModal(roleName: string) {
  const list = getEquippableWeapons(roleName);
  if (list.length === 0) {
    openModal({
      title: `装备武器 · ${roleName}`,
      body: '没有可装备的武器。',
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
    return;
  }
  const rows = list.map((w: any) => h('div', {
    key: w.n,
    style: 'display:flex;align-items:center;gap:8px;padding:6px;border:1px solid var(--border);border-radius:6px;margin-bottom:4px;cursor:pointer',
    onClick: () => {
      if (equipWeapon(roleName, w.n)) {
        msg(`已装备 ${w.n} 到 ${roleName}`, false);
        bumpStateVersion();
        closeModal();
      } else {
        msg('装备失败');
      }
    }
  },
    h('div', { style: 'flex:1' },
      h('div', { style: 'font-weight:600;font-size:12px' }, w.n,
        h('span', { style: 'color:var(--muted);font-weight:400' }, ` ★${w.r || 0}·Lv${w.level || 1}`))
    ),
    h('div', { style: 'font-size:10px;color:var(--gold)' }, '点击装备')
  ));
  openModal({
    title: `装备武器 · ${roleName}`,
    body: h('div', null, ...rows),
    className: 'role-modal',
    actions: [{ label: '取消', cls: '', fn: () => {} }]
  });
}

function doUnequipWeapon(roleName: string) {
  if (unequipWeapon(roleName)) {
    msg(`已卸下 ${roleName} 的武器`, false);
    bumpStateVersion();
  } else {
    msg('卸下失败');
  }
}

function doLevelUpWeapon(wName: string) {
  if (levelUpWeapon(wName)) {
    msg(`${wName} 升至 Lv ${S.weapons[wName].level}`, false);
    bumpStateVersion();
  }
}

function doLevelUpWeaponMax(wName: string) {
  const n = levelUpWeaponMax(wName);
  if (n > 0) {
    msg(`${wName} 一键升至 Lv ${S.weapons[wName].level}（升 ${n} 级）`, false);
    bumpStateVersion();
  } else if (S.weapons[wName]?.level >= 90) {
    msg('武器已满级');
  } else {
    msg('武器石不足，无法升级');
  }
}

function doRefineWeapon(wName: string) {
  const r = refineWeapon(wName);
  if (r && 'refine' in r && r.ok !== false && (r as any).refine != null) {
    msg(`${wName} 精炼 +1（现 R${(r as any).refine}）`, false);
    bumpStateVersion();
  } else {
    msg((r as any)?.err || '无法精炼');
  }
}

export function WeaponTab({ roleName, weaponType, wName, wInfo, wObj, preview, weaponDetailHtml, weaponBook, weaponNextCost }: WeaponTabProps) {
  // 以存档实时字段为准（精炼/升级后 wObj 可能滞后一帧）
  const live = wName ? S.weapons[wName] : null;
  const level = live?.level ?? wObj?.level ?? 1;
  const refine = live?.refine ?? wObj?.refine ?? 1;
  const spare = live?.spareRefine ?? wObj?.spareRefine ?? 0;
  const canRefine = !preview && !!wName && spare > 0 && refine < 5;
  const canLevel = !preview && !!wName && level < 90;

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '11px 13px', background: 'rgba(255,255,255,.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>装 备 武 器</span>
        <span style={{ fontSize: 10, padding: '2px 8px', border: '1px solid var(--line2)', color: 'var(--muted)', borderRadius: 999 }}>{weaponType}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
        {wName && getWeaponArt(wName) ? (
          <img class="weapon-icon-img" src={getWeaponArt(wName)} alt={wName} loading="lazy" />
        ) : null}
        <div style={{ fontSize: 13, fontWeight: 700, color: wName ? 'var(--gold)' : 'var(--dim)' }}>{wInfo}</div>
      </div>
      {wName && !preview && (
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
          Lv {level}/90 · 精炼 R{refine}/5
          {spare > 0 ? <span style={{ color: 'var(--accent)' }}> · 可精炼 +{spare}</span> : null}
        </div>
      )}
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
        <button class="mbtn" onClick={() => openWeaponPickerModal(roleName)} disabled={preview}
          style={preview ? { opacity: 0.5 } : {}}>
          {preview ? '未持有' : (wName ? '换装' : '装备')}
        </button>
        {!preview && wName && (
          <button class="mbtn" onClick={() => doUnequipWeapon(roleName)}>卸下</button>
        )}
        {canLevel && (
          <>
            <button class="mbtn gold" onClick={() => doLevelUpWeapon(wName!)}>
              升级 ({weaponNextCost} 石)
            </button>
            <button class="mbtn" onClick={() => doLevelUpWeaponMax(wName!)}>升满</button>
          </>
        )}
        {canRefine && (
          <button class="mbtn gold" onClick={() => doRefineWeapon(wName!)}>
            精炼 +1（R{refine}→R{refine + 1}）
          </button>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
        武器石库存 <b style={{ color: 'var(--gold)' }}>{weaponBook}</b>
        {wName && spare > 0 ? <> · 备用精炼 <b style={{ color: 'var(--accent)' }}>{spare}</b></> : null}
      </div>
    </div>
  );
}
