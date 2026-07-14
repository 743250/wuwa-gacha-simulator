// 背包面板：药剂/体力/武器箱/精炼石 handler 组
// Stage 6.2: modal body 改为 Preact VNode，闭包 onClick 代替 window.__ 桥
// 注:core 写入函数已通过 commit() 自带 bump,wrapper 层不再额外调 bumpStateVersion()
import { S } from '../../state.js';
import { msg } from '../services/toast.ts';
import { usePotion as usePotionCore, useAllPotions as useAllPotionsCore, buyStaminaWithAstrite } from '../../daily/stamina.js';
import { WEAPON_BOX_OPTIONS } from '../../data/podcast-rewards.js';
import { openModal } from '../../modal.js';
import { h } from 'preact';
import { radioPickWeapon } from '../../podcast/core.js';
import { commit } from '../../state/commit.ts';

export function usePotion(id, count) {
  const r = usePotionCore(id, count);
  if (!r.ok) { msg(r.err); return; }
  if (r.kind === 'crystal') msg(`兑换 ${r.gained} 结晶波片`, false);
  else msg(`回复 ${r.gained} 结晶波片`, false);
}

export function useAllPotions() {
  const gained = useAllPotionsCore();
  if (gained === 0) { msg('没有可兑换/可使用的体力道具'); return; }
  msg(`补充 ${gained} 结晶波片`, false);
}

export function buyStamina() {
  const r = buyStaminaWithAstrite();
  if (!r.ok) { msg(r.err); return; }
  msg(`60 星声 → +${r.gained} 波片`, false);
}

// 精炼武器内部函数（闭包，替代 window.__bagUseRefineStoneOn）
function bagUseRefineStoneOn(target) {
  if (!S.podcast?.pendingRefine) return msg('没有精炼石');
  const w = S.weapons[target];
  if (!w) return msg('没有这把武器');
  commit(() => {
    S.podcast.pendingRefine--;
    if ((w.refine || 1) < 5) {
      w.refine = (w.refine || 1) + 1;
      msg(`${target} 精炼 +1（现 R${w.refine}）`, false);
    } else {
      S.materials.exp_super = (S.materials.exp_super || 0) + 2;
      msg(`${target} 已 5 精 · 补偿特级促剂 ×2`, false);
    }
  });
}

// 打开待领武器箱
export function bagOpenWeaponBox() {
  if (!S.podcast?.pendingWeaponBox) return msg('没有待开的武器箱');
  S.podcast.pendingWeaponBox--;
  const buttons = WEAPON_BOX_OPTIONS.map(n =>
    h('button', { class: 'mbtn', style: 'margin:4px;min-width:90px', onClick: () => radioPickWeapon(n) }, n)
  );
  openModal({
    title: '4★ 武器自选箱',
    body: h('div', null,
      h('div', { style: 'color:var(--muted);font-size:12px;margin-bottom:10px' }, '从下面 5 把 4 星武器中任选 1 把；已持有的武器会转为可精炼次数。'),
      h('div', { style: 'text-align:center' }, buttons)
    ),
    actions: [{ label: '稍后再选', cls: '', fn: () => {
      commit(() => { S.podcast.pendingWeaponBox++; }); // 退回
    }}]
  });
}

export function bagUseRefineStone() {
  if (!S.podcast?.pendingRefine) return msg('没有精炼石');
  const owned = WEAPON_BOX_OPTIONS.filter(n => S.weapons[n]);
  if (owned.length === 0) {
    msg('需先领取 4★ 自选武器才能使用精炼石');
    return;
  }
  const buttons = owned.map(n => {
    const w = S.weapons[n];
    const disabled = (w.refine || 1) >= 5;
    return h('button', {
      class: 'mbtn ' + (disabled ? '' : 'gold'),
      style: 'margin:4px;min-width:100px',
      disabled: disabled || undefined,
      onClick: () => bagUseRefineStoneOn(n)
    },
      n,
      h('br'),
      h('span', { style: 'font-size:9px;color:var(--muted)' }, `R${w.refine || 1}/5`)
    );
  });
  openModal({
    title: '选择精炼武器',
    body: h('div', null,
      h('div', { style: 'color:var(--muted);font-size:12px;margin-bottom:10px' }, '消耗 1 个烙金银杏，为一把电台 4★ 武器精炼 +1。'),
      h('div', { style: 'text-align:center' }, buttons)
    ),
    actions: [{ label: '取消', cls: '', fn: () => {} }]
  });
}

