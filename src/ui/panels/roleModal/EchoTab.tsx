import { h } from 'preact';
import { selectEchoSlot } from '../../../ui/render/roleModal.js';
import { bagEchoDetail, bagEchoLevelUp, bagEchoUnequip, bagEchoOpenPicker } from '../bag/echoActions';

const ELEM_COLORS: Record<string, string> = {
  '热熔': '#ff8c5e', '冷凝': '#7bd6ff', '导电': '#b58cff',
  '气动': '#8de6a6', '衍射': '#fff0b0', '湮灭': '#c39bff',
};

interface EchoTabProps {
  roleName: string;
  preview: boolean;
  previewNote: string;
  slots: (number | null)[];
  totalCost: number;
  cap: number;
  activeSets: any[];
  selIdx: number;
  selEcho: any | null;
  echos: any[];
  getSetById: (id: string) => any;
  echoToNext: (e: any) => number;
  formatEchoStatValue: (k: string, v: number) => string;
  formatSetBonus: (b: any) => string;
}

function EchoSlot({ id, idx, isSel, roleName, echos, getSetById }: any) {
  const e = id != null ? echos.find((x: any) => x.id === id) : null;
  const setObj = e ? getSetById(Array.isArray(e.set) ? e.set[0] : e.set) : null;
  const elemColor = e && setObj?.element
    ? (ELEM_COLORS[setObj.element] || '#fff')
    : '#999';
  const borderColor = e ? elemColor : 'var(--line2)';
  const isSelStyle = isSel ? 'var(--gold)' : borderColor;

  function handleClick() {
    selectEchoSlot(roleName, idx);
    if (e) {
      bagEchoDetail(e.id, true);
    } else {
      bagEchoOpenPicker(roleName, idx);
    }
  }

  return (
    <div class={`echo-slot ${isSel ? 'selected' : ''}`}
      onClick={handleClick}
      style={{
        border: `${isSel ? 2 : 1}px solid ${isSelStyle}`,
        borderRadius: 8, padding: '7px 4px', textAlign: 'center',
        borderStyle: e ? 'solid' : 'dashed', cursor: 'pointer',
        minHeight: 78, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        background: isSel ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)',
        position: 'relative',
      }}>
      {e ? (
        <>
          <div style={{ fontSize: 9, color: 'var(--gold)', position: 'absolute', top: 2, left: 4 }}>C{e.cost}</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', position: 'absolute', top: 2, right: 4 }}>+{e.level}</div>
          <div style={{ fontSize: 10, fontWeight: 700, marginTop: 10, color: elemColor, lineHeight: 1.1, wordBreak: 'break-all' }}>{e.name}</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 18, color: 'var(--dim)' }}>＋</div>
          <div style={{ fontSize: 9, color: 'var(--dim)', marginTop: 3 }}>槽位 {idx + 1}</div>
        </>
      )}
    </div>
  );
}

export function EchoTab({ roleName, preview, previewNote, slots, totalCost, cap, activeSets, selIdx, selEcho, echos, getSetById, echoToNext, formatEchoStatValue, formatSetBonus }: EchoTabProps) {
  if (preview) {
    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: previewNote }} />
        <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 18, background: 'rgba(255,255,255,.02)', color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
          未持有角色暂不开放声骸配置。
        </div>
      </div>
    );
  }

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: previewNote }} />

      {/* Echo slot grid */}
      <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '11px 13px', background: 'rgba(255,255,255,.02)', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>声 骸 槽 位</span>
          <span style={{ fontSize: 10, color: totalCost > cap ? 'var(--red)' : 'var(--gold)' }}>COST {totalCost} / {cap}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
          {slots.map((id, i) => (
            <EchoSlot key={i} id={id} idx={i} isSel={i === selIdx}
              roleName={roleName} echos={echos} getSetById={getSetById} />
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>
          点击已装备槽位查看详情 · 点击空槽位装备 · COST 上限 {cap} · 持有 {echos.length} 个
        </div>
      </div>

      {/* Selected echo detail */}
      {selEcho ? <SelectedEchoDetail echo={selEcho} selIdx={selIdx} roleName={roleName}
        getSetById={getSetById} echoToNext={echoToNext}
        formatEchoStatValue={formatEchoStatValue} />
        : (
          <div style={{ border: '1px dashed var(--line2)', borderRadius: 8, padding: 14, textAlign: 'center', color: 'var(--dim)', fontSize: 11, marginBottom: 10 }}>
            槽位 {selIdx + 1} 未装备声骸 · <a style={{ color: 'var(--gold)', cursor: 'pointer' }}
              onClick={() => bagEchoOpenPicker(roleName, selIdx)}>点击装备</a>
          </div>
        )}

      {/* Active sets */}
      <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '11px 13px', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 8 }}>已 激 活 套 装</div>
        {activeSets.length > 0 ? activeSets.map((s: any, i: number) => (
          <SetCard key={i} set={s} getSetById={getSetById} formatSetBonus={formatSetBonus} />
        )) : (
          <div style={{ fontSize: 10, color: 'var(--dim)', textAlign: 'center', padding: 8 }}>未激活任何套装（2 件起激活）</div>
        )}
      </div>
    </div>
  );
}

function SelectedEchoDetail({ echo: e, selIdx, roleName, getSetById, echoToNext, formatEchoStatValue }: any) {
  const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
  const setColor = set?.element ? (ELEM_COLORS[set.element] || '#fff') : '#999';
  const canLevel = e.level < 25;
  const nextCost = canLevel ? echoToNext(e) : 0;

  return (
    <div style={{ border: `1px solid ${setColor}`, borderRadius: 8, padding: '8px 13px', background: 'rgba(255,255,255,.02)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 140 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: setColor }}>{e.name}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>
          LV {e.level} · COST {e.cost} · {e.mainStat?.label || ''} {e.mainStat ? formatEchoStatValue(e.mainStat.key, e.mainStat.value) : ''}{set ? ' · ' + set.name : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <button class="mbtn" onClick={() => bagEchoOpenPicker(roleName, selIdx)}>换装</button>
        {canLevel ? <button class="mbtn gold" onClick={() => bagEchoLevelUp(e.id, false)}>升级 ({nextCost.toLocaleString()} exp)</button> : null}
        <button class="mbtn" onClick={() => bagEchoDetail(e.id, true)}>详情</button>
        <button class="mbtn" onClick={() => bagEchoUnequip(e.id)}>卸下</button>
      </div>
    </div>
  );
}

function SetCard({ set: s, formatSetBonus }: any) {
  const color = s.element ? (ELEM_COLORS[s.element] || 'var(--gold)') : 'var(--gold)';
  const bonus = s.tier === 2 ? s.bonus2 : s.bonus5;
  return (
    <div style={{ border: `1px solid ${color}`, borderRadius: 6, padding: '7px 9px', marginBottom: 6, background: 'rgba(255,255,255,.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{s.name}</span>
        <span style={{ fontSize: 10, color: 'var(--gold)' }}>{s.tier}/5 ✦</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{formatSetBonus(bonus)}</div>
    </div>
  );
}
