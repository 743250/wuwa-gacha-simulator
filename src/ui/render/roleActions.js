// 角色面板操作按钮的 window handler 注册
import { S, msg } from '../../state.js';
import { openModal, closeModal } from '../../modal.js';
import { levelUpRole, levelUpRoleMax, levelUpWeapon, levelUpWeaponMax, unequipWeapon } from '../../equip/actions.js';
import { equipEcho, unequipSlot, levelUpEcho, recycleEcho, toggleEchoLock, echoToNext } from '../../equip/echoActions.js';
import { getSetById, formatEchoStatValue, formatSetBonus } from '../../data/echoes.js';

export function registerRoleActions(deps) {
  const {
    renderRoleModal,
    render,
    renderRoleTabContent,
    getCurrentRoleName,
    getCurrentRoleTab,
    getCurrentRolePreview,
    setRoleTab,
    getEchoSelectedSlot,
  } = deps;

  // 角色升级桥接（不重开 modal，只刷新右侧内容）
  function refreshRolePane() {
    const content = document.getElementById('roleContent');
    const n = getCurrentRoleName();
    if (content && n) content.innerHTML = renderRoleTabContent(getCurrentRoleTab(), getCurrentRolePreview());
  }
  window.__levelUpRole = (n) => {
    if (levelUpRole(n)) { msg('升级成功', false); refreshRolePane(); render(); }
  };
  window.__levelUpRoleMax = (n) => {
    const c = levelUpRoleMax(n);
    if (c > 0) { msg(`+${c} 级`, false); refreshRolePane(); render(); }
    else msg('经验书不足');
  };
  window.__levelUpWeapon = (wn) => {
    if (levelUpWeapon(wn)) {
      msg('武器升级', false);
      refreshRolePane();
      render();
    }
  };
  window.__levelUpWeaponMax = (wn) => {
    const c = levelUpWeaponMax(wn);
    if (c > 0) {
      msg(`武器 +${c} 级`, false);
      refreshRolePane();
      render();
    }
  };
  window.__doUnequip = (n) => {
    unequipWeapon(n);
    refreshRolePane();
    render();
  };

  window.__doEquipEcho = (roleName, slot, echoId) => {
    const r = equipEcho(roleName, slot, echoId);
    if (!r.ok) { msg(r.err); return; }
    // 装备后回到角色声骸面板（不关闭 modal），方便继续装其他槽位
    if (getCurrentRoleName()) renderRoleModal();
    render();
  };
  window.__unequipEchoSlot = (roleName, slot) => {
    unequipSlot(roleName, slot);
    if (getCurrentRoleName()) renderRoleModal();
    render();
  };
  window.__selectEchoSlot = (roleName, idx) => {
    getEchoSelectedSlot()[roleName] = idx;
    refreshRolePane();
    render();
  };
  // 从子 modal（详情/picker）关闭后回到角色声骸面板
  window.__reopenRoleEchoTab = () => {
    if (!getCurrentRoleName()) return;
    setRoleTab('echo');
    renderRoleModal();
  };
  window.__echoDetail = (id) => {
    // 委托给背包详情（统一带升级/升满按钮的 modal）
    if (typeof window.__bagEchoDetail === 'function') return window.__bagEchoDetail(id, true);
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    const set = getSetById(Array.isArray(e.set) ? e.set[0] : e.set);
    openModal({
      title: `${e.name} · LV ${e.level} · COST ${e.cost}`,
      body: `<div style="font-size:12px;color:var(--muted);line-height:1.7">
        <div>套装：<b style="color:var(--gold)">${set?.name || '未知'}</b>${set?.element ? ` · ${set.element}` : ''}</div>
        <div>元素：<b>${e.element || '—'}</b></div>
        <div>主词条：<b style="color:var(--gold)">${e.mainStat?.label} ${formatEchoStatValue(e.mainStat?.key, e.mainStat?.value)}</b></div>
        <div style="margin-top:6px">副词条（${(e.subStats||[]).filter(s=>s.unlocked!==false).length}/${(e.subStats||[]).length}）：</div>
        <div style="margin-left:10px">${(e.subStats||[]).map(s => s.unlocked === false ? `<div style="opacity:.5">· ??? · 未解锁</div>` : `<div>· ${s.label} ${formatEchoStatValue(s.key, s.value)}</div>`).join('')}</div>
        ${set ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--line)">
          <div style="color:var(--gold);font-size:11px;margin-bottom:3px">套装效果</div>
          <div style="margin-left:10px">
            <div>· <b>2 件</b>：${formatSetBonus(set.bonus2) || '—'}</div>
            <div>· <b>5 件</b>：${formatSetBonus(set.bonus5) || '—'}</div>
          </div>
        </div>` : ''}
      </div>`,
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
  };
  window.__echoLevelUp = (id) => {
    if (typeof window.__bagEchoLevelUp === 'function') return window.__bagEchoLevelUp(id);
    const e = S.echos.find(x => x.id === id);
    if (!e) return;
    if (e.level >= 25) { msg('已满级'); return; }
    const cost = echoToNext(e);
    if (levelUpEcho(id)) {
      msg(`声骸 +1 级（消耗 ${cost.toLocaleString()} exp）`, false);
      if (getCurrentRoleName()) { setRoleTab('echo'); renderRoleModal(); }
      else render();
    } else {
      msg(`经验不足（需 ${cost.toLocaleString()}）`);
    }
  };
  window.__echoLevelUpMax = (id) => {
    if (typeof window.__bagEchoLevelUpMax === 'function') return window.__bagEchoLevelUpMax(id);
  };
  window.__echoRecycle = (id) => {
    if (typeof window.__bagEchoConfirmRecycle === 'function') return window.__bagEchoConfirmRecycle(id);
    if (typeof window.__bagEchoRecycle === 'function') return window.__bagEchoRecycle(id);
    const res = recycleEcho(id);
    if (res.ok) {
      if (getCurrentRoleName()) { setRoleTab('echo'); renderRoleModal(); }
      else { closeModal(); render(); }
    } else {
      msg(res.err || '分解失败（已装备/已锁定？）');
    }
  };
  window.__echoToggleLock = (id) => {
    if (typeof window.__bagEchoToggleLock === 'function') return window.__bagEchoToggleLock(id);
    toggleEchoLock(id);
    if (getCurrentRoleName()) { setRoleTab('echo'); renderRoleModal(); }
    else render();
  };
}