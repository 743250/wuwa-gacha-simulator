// 背包面板：药剂/体力/武器箱/精炼石 handler 组
import { S, msg } from '../../state.js';
import { usePotion, useAllPotions, buyStaminaWithAstrite } from '../../daily/stamina.js';
import { WEAPON_BOX_OPTIONS } from '../../data/podcast-rewards.js';
import { openModal } from '../../modal.js';

export function registerBagMaterialActions({ renderBag }) {
  window.__usePotion = (id, count) => {
    const r = usePotion(id, count);
    if (!r.ok) { msg(r.err); return; }
    msg(`回复 ${r.gained} 体力`, false);
    renderBag();
    window.__render();
  };

  window.__useAllPotions = () => {
    const gained = useAllPotions();
    if (gained === 0) { msg('没有药剂可用'); return; }
    msg(`回复 ${gained} 体力`, false);
    renderBag();
    window.__render();
  };

  window.__buyStamina = () => {
    const r = buyStaminaWithAstrite();
    if (!r.ok) { msg(r.err); return; }
    msg(`60 星声 → +${r.gained} 波片`, false);
    renderBag();
    window.__render();
  };

  // 打开待领武器箱
  window.__bagOpenWeaponBox = () => {
    if (!S.podcast?.pendingWeaponBox) return msg('没有待开的武器箱');
    S.podcast.pendingWeaponBox--;
    const buttons = WEAPON_BOX_OPTIONS.map(n =>
      `<button class="mbtn" style="margin:4px;min-width:90px" onclick="window.__radioPickWeapon('${n}')">${n}</button>`
    ).join('');
    openModal({
      title: '4★ 武器自选箱',
      body: `<div style="color:var(--muted);font-size:12px;margin-bottom:10px">从下面 5 把 4 星武器中任选 1 把；已持有的武器会转为可精炼次数。</div>
<div style="text-align:center">${buttons}</div>`,
      actions: [{ label: '稍后再选', cls: '', fn: () => {
        S.podcast.pendingWeaponBox++; // 退回
        renderBag();
      }}]
    });
  };

  window.__bagUseRefineStone = () => {
    if (!S.podcast?.pendingRefine) return msg('没有精炼石');
    const owned = WEAPON_BOX_OPTIONS.filter(n => S.weapons[n]);
    if (owned.length === 0) {
      msg('需先领取 4★ 自选武器才能使用精炼石');
      return;
    }
    const buttons = owned.map(n => {
      const w = S.weapons[n];
      const disabled = (w.refine || 1) >= 5;
      return `<button class="mbtn ${disabled ? '' : 'gold'}" style="margin:4px;min-width:100px" onclick="window.__bagUseRefineStoneOn('${n.replace(/'/g, "\\'")}')" ${disabled ? 'disabled' : ''}>${n}<br><span style="font-size:9px;color:var(--muted)">R${w.refine || 1}/5</span></button>`;
    }).join('');
    openModal({
      title: '选择精炼武器',
      body: `<div style="color:var(--muted);font-size:12px;margin-bottom:10px">消耗 1 个烙金银杏，为一把电台 4★ 武器精炼 +1。</div><div style="text-align:center">${buttons}</div>`,
      actions: [{ label: '取消', cls: '', fn: () => {} }]
    });
  };

  window.__bagUseRefineStoneOn = (target) => {
    if (!S.podcast?.pendingRefine) return msg('没有精炼石');
    const w = S.weapons[target];
    if (!w) return msg('没有这把武器');
    S.podcast.pendingRefine--;
    if ((w.refine || 1) < 5) {
      w.refine = (w.refine || 1) + 1;
      msg(`${target} 精炼 +1（现 R${w.refine}）`, false);
    } else {
      S.materials.exp_super = (S.materials.exp_super || 0) + 2;
      msg(`${target} 已 5 精 · 补偿特级促剂 ×2`, false);
    }
    renderBag();
    window.__render();
  };
}
