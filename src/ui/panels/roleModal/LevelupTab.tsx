import { h } from 'preact';
import { useState } from 'preact/hooks';
import { msg } from '../../../state.js';
import { levelUpRoleWith, previewExpCost } from '../../../equip/actions.js';
import { EXP_VALUES } from '../../../battle/stats.js';
import { bumpStateVersion } from '../../signals';

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
  const [useLow, setUseLow] = useState(0);
  const [useMid, setUseMid] = useState(0);
  const [useHigh, setUseHigh] = useState(0);
  const [useSuper, setUseSuper] = useState(0);

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

  const provided = useLow * EXP_VALUES.exp_low + useMid * EXP_VALUES.exp_mid +
                   useHigh * EXP_VALUES.exp_high + useSuper * EXP_VALUES.exp_super;
  const overflow = Math.max(0, provided - expNext);
  const short = Math.max(0, expNext - provided);
  const canLevel = provided >= expNext && level < 90;

  function clamp(n: number, max: number): number {
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(Math.floor(n), max);
  }

  function pickExp(v: number, key: 'useLow'|'useMid'|'useHigh'|'useSuper') {
    const setter = { useLow: setUseLow, useMid: setUseMid, useHigh: setUseHigh, useSuper: setUseSuper }[key];
    const max = { useLow: materials.exp_low||0, useMid: materials.exp_mid||0, useHigh: materials.exp_high||0, useSuper: materials.exp_super||0 }[key];
    setter(clamp(v, max));
  }

  function pickAdd(v: number, key: 'useLow'|'useMid'|'useHigh'|'useSuper') {
    const cur = { useLow, useMid, useHigh, useSuper }[key];
    pickExp(cur + v, key);
  }

  // 自动:跑 previewExpCost 把推荐本数填进输入框
  function autoFill() {
    const p = previewExpCost(expNext);
    if (!p.ok) {
      msg(`经验不足 · 持有 ${expTotal.toLocaleString()} / 需 ${expNext.toLocaleString()}`);
      return;
    }
    setUseLow(p.useLow);
    setUseMid(p.useMid);
    setUseHigh(p.useHigh);
    setUseSuper(p.useSuper);
  }

  function clearAll() {
    setUseLow(0); setUseMid(0); setUseHigh(0); setUseSuper(0);
  }

  function doLevelUp() {
    if (level >= 90) { msg('已满级'); return; }
    if (provided < expNext) {
      msg(`所选经验不足 · 差 ${short.toLocaleString()}`);
      return;
    }
    if (levelUpRoleWith(roleName, useLow, useMid, useHigh, useSuper)) {
      msg(`${roleName} 升级成功${overflow > 0 ? ` · 溢出 ${overflow.toLocaleString()}` : ''}`, false);
      setUseLow(0); setUseMid(0); setUseHigh(0); setUseSuper(0);
      bumpStateVersion();
    }
  }

  // 单本可点 +1 / -1,输入框直接输数字
  const row = (key: 'useLow'|'useMid'|'useHigh'|'useSuper', label: string, labelColor: string, pool: number, useVal: number) => (
    <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 6, alignItems: 'center' }}>
      <span style={{ color: labelColor, fontSize: 11, fontWeight: 700, letterSpacing: 1, textAlign: 'center' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button class="mbtn" style={{ fontSize: 11, padding: '2px 6px', minWidth: 22 }} onClick={() => pickAdd(-1, key)} disabled={useVal <= 0}>−</button>
        <input type="number" min={0} max={pool} value={useVal}
          onInput={(e: any) => pickExp(+e.target.value, key)}
          style={{
            width: 50, textAlign: 'center', fontSize: 12, color: 'var(--text)',
            background: 'rgba(255,255,255,.05)', border: '1px solid var(--line2)',
            borderRadius: 5, padding: '3px 4px', font: 'inherit',
          }} />
        <button class="mbtn" style={{ fontSize: 11, padding: '2px 6px', minWidth: 22 }} onClick={() => pickAdd(1, key)} disabled={useVal >= pool}>+</button>
      </div>
      <span style={{ fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap' }}>持有 ×{pool}{pool > 0 ? '' : ''}</span>
    </div>
  );

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: previewNote }} />

      <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '11px 13px', background: 'rgba(255,255,255,.02)', marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2, marginBottom: 6 }}>角 色 等 级</div>
        <div style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>
          LV <b style={{ color: 'var(--gold)' }}>{level}</b> <span style={{ color: 'var(--muted)', fontSize: 14 }}>/ 90</span>
        </div>
        <div style={{ fontSize: 11, textAlign: 'center', marginBottom: 8, lineHeight: 1.6 }}>
          <div>升 1 级需 <b style={{ color: 'var(--gold)' }}>{expNext.toLocaleString()}</b> 经验</div>
          <div style={{ color: provided >= expNext ? 'var(--green)' : 'var(--red)', fontSize: 11 }}>
            已选 <b>{provided.toLocaleString()}</b>{provided >= expNext
              ? ` · 溢出 ${overflow.toLocaleString()}`
              : ` · 差 ${short.toLocaleString()}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button class="mbtn" style={{ flex: 1, fontSize: 10 }} onClick={autoFill} disabled={level >= 90 || expTotal < expNext}>自动选择</button>
          <button class="mbtn" style={{ flex: 1, fontSize: 10 }} onClick={clearAll} disabled={useLow+useMid+useHigh+useSuper === 0}>清空</button>
        </div>
      </div>

      <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '11px 13px', background: 'rgba(255,255,255,.02)', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>手 动 选 择 促 剂</div>
        {row('useSuper', '特级', 'var(--gold)', materials.exp_super||0, useSuper)}
        {row('useHigh',  '高级', '#fff', materials.exp_high, useHigh)}
        {row('useMid',   '中级', 'var(--accent)', materials.exp_mid, useMid)}
        {row('useLow',   '初级', 'var(--green)', materials.exp_low, useLow)}
      </div>

      <button class={`mbtn ${canLevel ? 'gold' : ''}`}
        onClick={doLevelUp}
        disabled={!canLevel}
        style={{ width: '100%', padding: '11px', fontSize: 12, letterSpacing: 3 }}>
        {level >= 90 ? '已 满 级' : canLevel ? `升 1 级 (消耗 ${provided.toLocaleString()})` : `选够经验升级 (差 ${short.toLocaleString()})`}
      </button>

      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', letterSpacing: 0.5, lineHeight: 1.8, padding: 8, marginTop: 8, background: 'rgba(255,255,255,.02)', borderRadius: 8 }}>
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