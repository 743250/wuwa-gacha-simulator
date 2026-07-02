// 渲染主入口
import { S, $ } from '../state.js';
import { activePhase, activeBanners, cur, poolKind, isCollabActive } from '../gacha/core.js';
import { seqText } from '../data/seq.js';
import { openModal, closeModal } from '../modal.js';
import { upgrade } from '../gacha/core.js';
import { saveState } from '../save.js';
import { expToNext, weaponToNext } from '../battle/stats.js';
import { getMeta } from '../battle/template.js';
import { WEAPON_DATA } from '../equip/weapons.js';
import { levelUpRole, levelUpRoleMax, levelUpWeapon, levelUpWeaponMax, unequipWeapon, totalExp } from '../equip/actions.js';
import { equipEcho, unequipSlot, calcTotalCost, levelUpEcho, levelUpEchoMax, recycleEcho, toggleEchoLock, ECHO_COST_CAP, echoToNext } from '../equip/echoActions.js';
import { getSetById, formatEchoStatValue, formatSetBonus } from '../data/echoes.js';
import { attachTermTips, highlightChainTerms } from './terms.js';
import { msg } from '../state.js';
import { escJs } from './render/utils.js';
import { renderBannerArt } from './render/bannerArt.js';
import { renderBannerTabs } from './render/bannerTabs.js';
import { renderTopOverview, renderPullStats } from './render/overview.js';
import { renderWeaponDetail } from './render/weaponDetail.js';
import { renderSkillsBlock } from './render/skillBlock.js';
import { renderLogList } from './render/logList.js';
import { renderPullPanel } from './render/pullPanel.js';
import { renderExchangeList } from './render/exchangeList.js';
import { renderWaveList } from './render/waveList.js';
import { renderShopPanel } from './render/shopPanel.js';
import { makePreviewRole, getRoleForModal, computeRoleStatsForModal, calcRoleBPForModal } from './render/rolePreview.js';
import { renderRoleList } from './render/roleList.js';
import { registerStandardRolePreview } from './render/standardRolePreview.js';
import { renderRoleModalBasicTab } from './render/roleModalBasicTab.js';
import { renderRoleModalShell } from './render/roleModalShell.js';
import { renderRoleModalWeaponTab } from './render/roleModalWeaponTab.js';
import { renderRoleModalLevelupTab } from './render/roleModalLevelupTab.js';
import { renderRoleModalChainTab } from './render/roleModalChainTab.js';
import { renderRoleModalEchoTab } from './render/roleModalEchoTab.js';
import { registerEchoPicker } from './render/echoPicker.js';
import { registerWeaponModal } from './render/weaponModal.js';

export function render() {
  const aps = activePhase(), bs = activeBanners(), b = cur();

  renderTopOverview(aps, bs, S);

  if (bs.length) {
    renderBannerTabs(bs, S.selected, id => {
      S.selected = id;
      render();
    });

    // banner art
    const kind = poolKind(b.pool);
    const bannerArt = renderBannerArt(b, kind, S);
    $('bnArt').className = bannerArt.className;
    $('bnArt').innerHTML = bannerArt.html;
  } else {
    $('bnTabs').innerHTML = '';
    $('bnArt').innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px 0">当前日期没有开放卡池</div>';
  }

  renderPullPanel(b, S);

  renderPullStats(b, S);

  renderExchangeList(S, isCollabActive());

  renderWaveList(S);

  renderShopPanel(S, isCollabActive());

  renderLogList(S.log);

  renderRoleList(S);
  // 每次渲染后自动存档（防抖 1 秒）
  saveState();
}

// 角色面板的当前 tab（每次打开重置；切换 tab 时只更新右侧内容、不重建外框）
let _currentRoleTab = 'basic';
let _currentRoleName = null;
let _currentRolePreview = false;
let _echoSelectedSlot = {};

export function openRoleModal(n) {
  _currentRoleName = n;
  _currentRolePreview = false;
  renderRoleModal(false);
}

export function openRolePreview(n) {
  _currentRoleName = n;
  _currentRolePreview = true;
  renderRoleModal(true);
}

window.openRolePreview = openRolePreview;

registerStandardRolePreview();
registerEchoPicker({
  getCurrentRoleName: () => _currentRoleName,
  reopenRoleModal,
  getEchoSelectedSlot: () => _echoSelectedSlot
});

registerWeaponModal({
  renderRoleModal,
  setRoleTab: t => { _currentRoleTab = t; },
  setRoleName: n => { _currentRoleName = n; },
  getCurrentRoleTab: () => _currentRoleTab
});

// 重新打开角色面板（在弹窗被自动关闭后用，例如激活共鸣链）
function reopenRoleModal() {
  if (_currentRoleName) renderRoleModal();
}
window.__reopenRoleModal = reopenRoleModal;

// 计算当前 tab 的 HTML 片段（不含外框 / sidebar）
function renderRoleTabContent(tabId, preview = false) {
  const n = _currentRoleName;
  const o = getRoleForModal(n); if (!o) return '';
  const base = o.n.split(' / ')[0];
  const meta = getMeta(n);
  const stats = computeRoleStatsForModal(n);
  const bp = calcRoleBPForModal(n);
  const expNext = expToNext(o);
  const wName = preview ? null : o.equipWeapon;
  const wObj = wName ? S.weapons[wName] : null;
  const wInfo = preview ? '未装备武器' : (wObj ? `${wName} · LV${wObj.level} · 精${wObj.refine}` : '未装备');
  const previewNote = preview ? '<div style="margin-bottom:10px;padding:8px 10px;border:1px solid rgba(245,207,107,.35);border-radius:8px;background:rgba(245,207,107,.06);color:var(--gold);font-size:11px;line-height:1.6">角色档案：展示 90 级 / 0 链 / 未装备武器时的参考面板。</div>' : '';

  if (tabId === 'basic') {
    return renderRoleModalBasicTab({ o, stats, bp, previewNote });
  }
  if (tabId === 'weapon') {
    return renderRoleModalWeaponTab({
      n,
      meta,
      wName,
      wInfo,
      wObj,
      preview,
      weaponDetailHtml: wName && WEAPON_DATA[wName] ? renderWeaponDetail(wName, wObj) : '',
      weaponBook: S.materials.weapon_book,
      weaponNextCost: wObj ? weaponToNext(wObj) : 0
    });
  }
  if (tabId === 'echo') {
    if (preview) {
      return renderRoleModalEchoTab({ n, preview, previewNote });
    }
    const slots = Array.isArray(o.equipEchoes) ? o.equipEchoes : [null, null, null, null, null];
    const totalCost = calcTotalCost(n);
    const cap = ECHO_COST_CAP;
    const setCount = {};
    slots.forEach(id => {
      if (id == null) return;
      const e = S.echos.find(x => x.id === id);
      if (!e) return;
      const setId = Array.isArray(e.set) ? e.set[0] : e.set;
      if (setId) setCount[setId] = (setCount[setId] || 0) + 1;
    });
    const activeSets = Object.entries(setCount).filter(([, n]) => n >= 2).map(([setId, n]) => {
      const set = getSetById(setId);
      return set ? { ...set, count: n, tier: n >= 5 ? 5 : 2 } : null;
    }).filter(Boolean);

    // 选中槽位（per-role），缺省选第一个有装备的，否则槽 0
    _echoSelectedSlot = _echoSelectedSlot || {};
    if (_echoSelectedSlot[n] == null) {
      const firstFilled = slots.findIndex(id => id != null);
      _echoSelectedSlot[n] = firstFilled >= 0 ? firstFilled : 0;
    }
    const selIdx = _echoSelectedSlot[n];
    const selId = slots[selIdx];
    const selEcho = selId != null ? S.echos.find(x => x.id === selId) : null;

    return renderRoleModalEchoTab({ n, preview, previewNote, slots, totalCost, cap, activeSets, selIdx, selEcho, echos: S.echos, getSetById, echoToNext, formatEchoStatValue, formatSetBonus });
  }
  if (tabId === 'chain') {
    return renderRoleModalChainTab({
      n,
      o,
      preview,
      previewNote,
      seqLines: (seqText[base] || []).map(s => ({
        name: s[0],
        desc: attachTermTips(highlightChainTerms(s[1]))
      }))
    });
  }
  if (tabId === 'skill') {
    return previewNote + renderSkillsBlock(n, meta, {
      stats,
      roleOverride: o,
      burstMode: window.__encoreBurstMode
    });
  }
  if (tabId === 'levelup') {
    return renderRoleModalLevelupTab({
      n,
      o,
      preview,
      previewNote,
      expNext,
      expTotal: totalExp(),
      materials: S.materials
    });
  }
  return '';
}

function renderRoleModal(preview = _currentRolePreview) {
  _currentRolePreview = !!preview;
  const n = _currentRoleName;
  const o = getRoleForModal(n); if (!o) return;
  const meta = getMeta(n);
  const content = renderRoleTabContent(_currentRoleTab, preview);
  const body = renderRoleModalShell({ o, meta, currentTab: _currentRoleTab, preview, content });

  const box = document.getElementById('modalBox');
  const wasRoleModal = box && box.classList.contains('role-modal');
  const savedScroll = wasRoleModal ? box.scrollTop : 0;
  openModal({
    title: '',
    body,
    className: 'role-modal',
    keepScroll: wasRoleModal,
    actions: [
      { cls: 'mbtn', label: '关闭', fn: () => {} }
    ]
  });
  if (wasRoleModal) box.scrollTop = savedScroll;
}

// 安可技能页：共鸣解放文案白咩/黑咩版本切换（只刷新当前角色页）
window.__encoreBurstMode = window.__encoreBurstMode || 'white';
window.__toggleEncoreBurstMode = () => {
  window.__encoreBurstMode = window.__encoreBurstMode === 'black' ? 'white' : 'black';
  const content = document.getElementById('roleContent');
  if (content) content.innerHTML = renderRoleTabContent(_currentRoleTab, _currentRolePreview);
};

// 切换 tab（onclick 调用）· 不重建外框，只刷新右侧内容与左栏激活态
window.__switchRoleTab = (tabId) => {
  _currentRoleTab = tabId;
  const content = document.getElementById('roleContent');
  if (content) {
    content.innerHTML = renderRoleTabContent(tabId, _currentRolePreview);
  }
  document.querySelectorAll('.role-tab').forEach(el => {
    const lbl = el.querySelector('.rt-lbl')?.textContent;
    const isOn = (tabId === 'basic' && lbl === '基本属性') ||
                 (tabId === 'weapon' && lbl === '武器') ||
                 (tabId === 'chain' && lbl === '共鸣链') ||
                 (tabId === 'skill' && lbl === '技能介绍') ||
                 (tabId === 'levelup' && lbl === '突破升级');
    el.classList.toggle('on', isOn);
  });
};

// 激活共鸣链：不退出角色界面，原地刷新
window.__activateChain = (n) => {
  const o = S.roles[n];
  if (!o || o.spare <= 0 || o.chain >= 6) { msg('无法激活'); return; }
  upgrade(n);
  msg(`激活 ${o.chain} 链`, false);
  // 直接刷新当前 tab 内容（不关闭弹窗）
  const content = document.getElementById('roleContent');
  if (content) content.innerHTML = renderRoleTabContent(_currentRoleTab, _currentRolePreview);
};

window.openRoleModal = openRoleModal;

// 角色升级桥接（不重开 modal，只刷新右侧内容）
function refreshRolePane() {
  const content = document.getElementById('roleContent');
  if (content && _currentRoleName) content.innerHTML = renderRoleTabContent(_currentRoleTab, _currentRolePreview);
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
  if (_currentRoleName) renderRoleModal();
  window.__render();
};
window.__unequipEchoSlot = (roleName, slot) => {
  unequipSlot(roleName, slot);
  if (_currentRoleName) renderRoleModal();
  window.__render();
};
window.__selectEchoSlot = (roleName, idx) => {
  _echoSelectedSlot[roleName] = idx;
  refreshRolePane();
  render();
};
// 从子 modal（详情/picker）关闭后回到角色声骸面板
window.__reopenRoleEchoTab = () => {
  if (!_currentRoleName) return;
  _currentRoleTab = 'echo';
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
    if (_currentRoleName) { _currentRoleTab = 'echo'; renderRoleModal(); }
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
    if (_currentRoleName) { _currentRoleTab = 'echo'; renderRoleModal(); }
    else { closeModal(); render(); }
  } else {
    msg(res.err || '分解失败（已装备/已锁定？）');
  }
};
window.__echoToggleLock = (id) => {
  if (typeof window.__bagEchoToggleLock === 'function') return window.__bagEchoToggleLock(id);
  toggleEchoLock(id);
  if (_currentRoleName) { _currentRoleTab = 'echo'; renderRoleModal(); }
  else render();
};


