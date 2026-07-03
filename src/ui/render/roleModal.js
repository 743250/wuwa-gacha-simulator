// 角色面板弹窗编排（tab 切换 / 弹窗 / 激活链 / 安可双形态）
import { S, msg } from '../../state.js';
import { seqText } from '../../data/seq.js';
import { openModal } from '../../modal.js';
import { upgrade } from '../../gacha/core.js';
import { expToNext, weaponToNext } from '../../battle/stats.js';
import { getMeta } from '../../battle/template.js';
import { WEAPON_DATA } from '../../equip/weapons.js';
import { totalExp } from '../../equip/actions.js';
import { calcTotalCost, ECHO_COST_CAP, echoToNext } from '../../equip/echoActions.js';
import { getSetById, formatEchoStatValue, formatSetBonus } from '../../data/echoes.js';
import { attachTermTips, highlightChainTerms } from '../terms.js';
import { renderWeaponDetail } from './weaponDetail.js';
import { renderSkillsBlock } from './skillBlock.js';
import { getRoleForModal, computeRoleStatsForModal, calcRoleBPForModal } from './rolePreview.js';
import { renderRoleModalBasicTab } from './roleModalBasicTab.js';
import { renderRoleModalShell } from './roleModalShell.js';
import { renderRoleModalWeaponTab } from './roleModalWeaponTab.js';
import { renderRoleModalLevelupTab } from './roleModalLevelupTab.js';
import { renderRoleModalChainTab } from './roleModalChainTab.js';
import { renderRoleModalEchoTab } from './roleModalEchoTab.js';
import { registerStandardRolePreview } from './standardRolePreview.js';
import { registerEchoPicker } from './echoPicker.js';
import { registerWeaponModal } from './weaponModal.js';
import { registerRoleActions } from './roleActions.js';

// 角色面板的当前 tab（每次打开重置；切换 tab 时只更新右侧内容、不重建外框）
let _currentRoleTab = 'basic';
let _currentRoleName = null;
let _currentRolePreview = false;
let _echoSelectedSlot = {};

function openRoleModal(n) {
  _currentRoleName = n;
  _currentRolePreview = false;
  renderRoleModal(false);
}

function openRolePreview(n) {
  _currentRoleName = n;
  _currentRolePreview = true;
  renderRoleModal(true);
}

// 重新打开角色面板（在弹窗被自动关闭后用，例如激活共鸣链）
function reopenRoleModal() {
  if (_currentRoleName) renderRoleModal();
}

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

export function initRoleModal({ render }) {
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
  registerRoleActions({
    renderRoleModal,
    render,
    renderRoleTabContent,
    getCurrentRoleName: () => _currentRoleName,
    getCurrentRoleTab: () => _currentRoleTab,
    getCurrentRolePreview: () => _currentRolePreview,
    setRoleTab: t => { _currentRoleTab = t; },
    getEchoSelectedSlot: () => _echoSelectedSlot,
  });

  window.openRoleModal = openRoleModal;
  window.openRolePreview = openRolePreview;
  window.__reopenRoleModal = reopenRoleModal;

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
}
