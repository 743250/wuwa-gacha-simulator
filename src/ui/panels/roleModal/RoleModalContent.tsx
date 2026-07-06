// Main Preact component for the role modal content area.
// Renders inside #roleContent (created by old openModal shell).
// State is driven by signals + S; re-render is triggered by explicit
// renderFunction (mountRoleModalContent) from the shim.

import { h } from 'preact';
import { useS } from '../../signals';
import {
  roleModalNameSignal,
  roleModalTabSignal,
  roleModalPreviewSignal,
  echoSelectedSlotSignal,
  ELEMENT_COLORS,
} from './signals';
import { Shell } from './Shell';
import { BasicTab } from './BasicTab';
import { WeaponTab } from './WeaponTab';
import { EchoTab } from './EchoTab';
import { ChainTab } from './ChainTab';
import { SkillTab } from './SkillTab';
import { LevelupTab } from './LevelupTab';
import { getRoleForModal, computeRoleStatsForModal, calcRoleBPForModal } from '../../../ui/render/rolePreview.js';
import { getMeta } from '../../../battle/template.js';
import { expToNext, weaponToNext } from '../../../battle/stats.js';
import { WEAPON_DATA } from '../../../equip/weapons.js';
import { renderWeaponDetail } from '../../../ui/render/weaponDetail.js';
import { totalExp } from '../../../equip/actions.js';
import { calcTotalCost, ECHO_COST_CAP, echoToNext } from '../../../equip/echoActions.js';
import { getSetById, formatEchoStatValue, formatSetBonus } from '../../../data/echoes.js';
import { getChainDef } from '../../../data/chains';
import { attachTermTips } from '../../../ui/terms.js';
import { highlightChainTerms } from '../../../ui/render.js';

export function RoleModalContent() {
  const S = useS();

  // Read signals at render time
  const n = roleModalNameSignal.value;
  const tabId = roleModalTabSignal.value;
  const preview = roleModalPreviewSignal.value;

  if (!n) return null;

  const o = getRoleForModal(n);
  if (!o) return null;

  const base = o.n.split(' / ')[0];
  const meta = getMeta(n);
  const stats = computeRoleStatsForModal(n);
  const bp = calcRoleBPForModal(n);
  const expNext = expToNext(o);

  const previewNoteHtml = preview
    ? '<div style="margin-bottom:10px;padding:8px 10px;border:1px solid rgba(245,207,107,.35);border-radius:8px;background:rgba(245,207,107,.06);color:var(--gold);font-size:11px;line-height:1.6">角色档案：展示 90 级 / 0 链 / 未装备武器时的参考面板。</div>'
    : '';

  const content = renderTabContent(tabId, {
    S, n, o, base, meta, stats, bp, expNext, preview, previewNoteHtml,
  });

  return (
    <Shell
      roleName={n}
      rarity={o.r}
      element={meta.element}
      type={meta.type}
      level={o.level}
      chain={o.chain}
      currentTab={tabId}
      preview={preview}
    >
      {content}
    </Shell>
  );
}

interface TabCtx {
  S: any;
  n: string;
  o: any;
  base: string;
  meta: any;
  stats: any;
  bp: number;
  expNext: number;
  preview: boolean;
  previewNoteHtml: string;
}

function renderTabContent(tabId: string, ctx: TabCtx) {
  const { S, n, o, base, meta, stats, bp, expNext, preview, previewNoteHtml } = ctx;

  if (tabId === 'basic') {
    return <BasicTab level={o.level} bp={bp} stats={stats} previewNote={previewNoteHtml} />;
  }

  if (tabId === 'weapon') {
    const wName = preview ? null : o.equipWeapon;
    const wObj = wName ? S.weapons[wName] : null;
    const wInfo = preview
      ? '未装备武器'
      : (wObj ? `${wName} · LV${wObj.level} · 精${wObj.refine}` : '未装备');
    const weaponDetailHtml = wName && WEAPON_DATA[wName]
      ? renderWeaponDetail(wName, wObj)
      : '';
    return (
      <WeaponTab
        roleName={n}
        weaponType={meta.weaponType}
        wName={wName}
        wInfo={wInfo}
        wObj={wObj}
        preview={preview}
        weaponDetailHtml={weaponDetailHtml}
        weaponBook={S.materials.weapon_book}
        weaponNextCost={wObj ? weaponToNext(wObj) : 0}
      />
    );
  }

  if (tabId === 'echo') {
    if (preview) {
      return (
        <div>
          <div dangerouslySetInnerHTML={{ __html: previewNoteHtml }} />
          <div style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 18, background: 'rgba(255,255,255,.02)', color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
            未持有角色暂不开放声骸配置。
          </div>
        </div>
      );
    }

    const slots = Array.isArray(o.equipEchoes) ? o.equipEchoes : [null, null, null, null, null];
    const totalCost = calcTotalCost(n);
    const cap = ECHO_COST_CAP;

    const setCount: Record<string, number> = {};
    slots.forEach((id: number | null) => {
      if (id == null) return;
      const e = S.echos.find((x: any) => x.id === id);
      if (!e) return;
      const setId = Array.isArray(e.set) ? e.set[0] : e.set;
      if (setId) setCount[setId] = (setCount[setId] || 0) + 1;
    });
    const activeSets = Object.entries(setCount)
      .filter(([, cnt]) => cnt >= 2)
      .map(([setId, cnt]) => {
        const set = getSetById(setId);
        return set ? { ...set, count: cnt, tier: cnt >= 5 ? 5 : 2 } : null;
      })
      .filter(Boolean);

    // Selected slot (per-role)
    const echoSlots = { ...echoSelectedSlotSignal.value };
    if (echoSlots[n] == null) {
      const firstFilled = slots.findIndex((id: number | null) => id != null);
      echoSlots[n] = firstFilled >= 0 ? firstFilled : 0;
      echoSelectedSlotSignal.value = echoSlots;
    }
    const selIdx = echoSlots[n];
    const selId = slots[selIdx];
    const selEcho = selId != null ? S.echos.find((x: any) => x.id === selId) : null;

    return (
      <EchoTab
        roleName={n}
        preview={preview}
        previewNote={previewNoteHtml}
        slots={slots}
        totalCost={totalCost}
        cap={cap}
        activeSets={activeSets}
        selIdx={selIdx}
        selEcho={selEcho}
        echos={S.echos}
        getSetById={getSetById}
        echoToNext={echoToNext}
        formatEchoStatValue={formatEchoStatValue}
        formatSetBonus={formatSetBonus}
      />
    );
  }

  if (tabId === 'chain') {
    const chainDef = getChainDef(base);
    const seqLines = chainDef
      ? chainDef.chains.map(c => ({
          name: c.text.name,
          desc: attachTermTips(highlightChainTerms(c.text.desc)),
        }))
      : [];
    return (
      <ChainTab
        roleName={n}
        chain={o.chain}
        spare={o.spare}
        bought={o.bought}
        preview={preview}
        previewNote={previewNoteHtml}
        seqLines={seqLines}
      />
    );
  }

  if (tabId === 'skill') {
    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: previewNoteHtml }} />
        <SkillTab roleName={n} meta={meta} stats={stats} roleOverride={o} />
      </div>
    );
  }

  if (tabId === 'levelup') {
    return (
      <LevelupTab
        roleName={n}
        level={o.level}
        preview={preview}
        previewNote={previewNoteHtml}
        expNext={expNext}
        expTotal={totalExp()}
        materials={S.materials}
      />
    );
  }

  return null;
}
