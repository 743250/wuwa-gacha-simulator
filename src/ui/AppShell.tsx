// 应用壳 · Phase 2
//
// 策略:headless 组件 —— 不渲染面板本体,只通过 useEffect 接管 index.html 里
// 仍为静态节点的按钮:.a-tab / .b-tab + 顶部时间线 + 存档管理 + 选版本 + 弹窗点击关闭 + tooltip。
// 顶层 .vtab 已迁到 Preact 组件 <ViewTabs/>(AppShell 第二小步),不再在此绑定。
//
// 为什么不 conditional render:Preact unmount 会销毁 #viewGacha 内 GachaPanel 等
// 组件的内部 state,切回来时丢状态。保留 main.js 原来的 style.display 切换语义。
//
// 外部组件要切视图请 import { setView } from './AppShell',不要直接写 signal.value
// (setView 集中处理 display 切换 + class 同步 + signal 赋值三件事)。

import { useEffect } from 'preact/hooks';
import { viewSignal, aTabSignal, bTabSignal } from './signals';
import { S, resetState, date } from '../state.js';
import { msg } from './services/toast.ts';
import { render } from './render.js';
import { bumpStateVersion } from './signals';
import { advanceDay, nextPhase, nextVersion, jumpToday, jumpToVersion, jumpToDate } from '../time/timeline.js';
import { ensureSelectedBanner } from '../gacha/core.js';
import { commit } from '../state/commit.ts';
import { openModal } from '../modal.js';
import { saveState, exportSave, importSave, clearSave, saveStateNow, pickSaveFolder, isFsSaveActive, isFsSupported, hasLocalStorageSave } from '../save.js';
import { phases } from '../data/phases.js';
import { openStartSetupModal, isStartSetupNeeded } from './setup/StartSetupModal';

const VIEWS: Record<string, string> = {
  gacha: 'viewGacha',
  adventure: 'viewAdventure',
  bag: 'viewBag',
  storage: 'viewStorage',
};

const A_TABS = ['team', 'daily', 'dungeon', 'abyss', 'wastes'] as const;
const B_TABS = ['podcast', 'shop'] as const;

export function setView(key: 'gacha' | 'adventure' | 'bag' | 'storage') {
  viewSignal.value = key;
  // .vtab 的 .on class 现由 <ViewTabs/> 组件渲染时根据 viewSignal.value 决定,不再命令式同步。
  Object.entries(VIEWS).forEach(([v, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = v === key ? '' : 'none';
  });
}

export function setATab(key: 'team' | 'daily' | 'dungeon' | 'abyss' | 'wastes') {
  aTabSignal.value = key;
  document.querySelectorAll('.a-tab').forEach(x => {
    x.classList.toggle('on', (x as HTMLElement).dataset.a === key);
  });
  A_TABS.forEach(p => {
    const el = document.getElementById('pane' + p[0].toUpperCase() + p.slice(1));
    if (el) el.style.display = p === key ? '' : 'none';
  });
}

export function setBTab(key: 'podcast' | 'shop') {
  bTabSignal.value = key;
  document.querySelectorAll('.b-tab').forEach(x => {
    x.classList.toggle('on', (x as HTMLElement).dataset.b === key);
  });
  B_TABS.forEach(p => {
    const el = document.getElementById('pane' + p[0].toUpperCase() + p.slice(1));
    if (el) el.style.display = p === key ? '' : 'none';
  });
}

function rerenderAll() {
  render();
  bumpStateVersion();
}

// ============ 顶部时间线按钮 ============
function bindTimelineButtons() {
  const nextDay = document.getElementById('nextDay');
  if (nextDay) nextDay.onclick = () => { advanceDay(); rerenderAll(); };
  const todayBtn = document.getElementById('todayBtn');
  if (todayBtn) todayBtn.onclick = () => { jumpToday(); rerenderAll(); };
  const nextPhase = document.getElementById('nextPhase');
  if (nextPhase) nextPhase.onclick = () => { nextPhase_fn(); rerenderAll(); };
  const nextVersion = document.getElementById('nextVersion');
  if (nextVersion) nextVersion.onclick = () => { nextVersion_fn(); rerenderAll(); };
}

// nextPhase/nextVersion 是 timeline 导出名,但在本文件顶部 import 时与下面 setView 同名冲突,
// 用 alias 避免遮蔽。
function nextPhase_fn() { nextPhase(); }
function nextVersion_fn() { nextVersion(); }

// ============ 重置按钮 ============
function bindResetButton() {
  const reset = document.getElementById('reset');
  if (!reset) return;
  reset.onclick = () => {
    openModal({
      title: '重置全部进度',
      body: '此操作将清空所有抽卡记录、资源、共鸣链、充值记录。<br><b class="r">不可恢复</b>。',
      actions: [
        { label: '取消', cls: '', fn: () => {} },
        { label: '确认重置', cls: 'warn', fn: () => {
          resetState();
          clearSave();
          // S.selected 已被 resetState 归零,但 active 集合变化后显式回填首个 banner,
          // 维持 cur()/banner tab 一致性(防 reset 后 selected=null 让 cur() fallback 但状态写不一致)。
          commit(() => { ensureSelectedBanner(); });
          rerenderAll();
          msg('已重置,请重新设置开局', false);
          // 重置后弹开局设置,让玩家重新选择入坑方式
          openStartSetupModal();
        } }
      ]
    });
  };
}

// ============ 存档管理 ============
function bindSaveMgmtButton() {
  const btn = document.getElementById('saveMgmt');
  if (!btn) return;
  btn.onclick = async () => {
    const supported = isFsSupported();
    const active = isFsSaveActive();
    const body = `<div style="font-size:11px;color:var(--muted);line-height:1.6;margin-bottom:10px">
      <b style="color:var(--gold)">本地文件存档</b>（File System Access API）<br>
      授权一个文件夹后,存档直接写到本地真实文件,不再受浏览器隔离限制。<br>
      可在资源管理器看到、可云盘同步、可手动备份。
    </div>
    <div style="font-size:11px;margin-bottom:8px">
      状态:${supported
        ? (active ? '<b style="color:var(--green)">已授权本地文件夹</b>' : '<b style="color:var(--gold)">未授权</b>(仅 localStorage)')
        : '<b style="color:var(--red)">当前浏览器不支持</b>(将仅用 localStorage)'}
    </div>`;
    const actions = [
      { label: '关闭', cls: '', fn: () => {} }
    ];
    if (supported) {
      actions.unshift({ label: active ? '重新选择文件夹' : '授权本地文件夹', cls: 'gold', fn: async () => {
        const ok = await pickSaveFolder();
        if (ok) {
          await saveStateNow();
          msg('已授权并保存到本地', false);
        }
        rerenderAll();
      }});
    }
    actions.unshift({ label: '导入存档', cls: '', fn: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        importSave(file, (ok: boolean, err?: string) => {
          if (ok) {
            // 导入存档可能让 S.selected 指向已失效 banner(例如旧存档 selected='beginner' 但 beginnerDone=true),
            // 显式回填首个可用 banner,避免 banner tab 无高亮。
            commit(() => { ensureSelectedBanner(); });
            rerenderAll();
            msg('存档导入成功', false);
          }
          else msg('导入失败:' + (err || '格式错误'));
        });
      };
      input.click();
    }});
    actions.unshift({ label: '导出存档', cls: '', fn: () => exportSave() });
    openModal({ title: '存档管理', body, actions });
  };
}

// ============ 选版本/选日期 ============
function bindPickVersionButton() {
  const btn = document.getElementById('pickVersion');
  if (!btn) return;
  btn.onclick = () => {
    const versionMap = new Map();
    phases.forEach(p => { if (!versionMap.has(p.v)) versionMap.set(p.v, p.start); });
    const allVersions = [...versionMap.entries()];
    const today = S.today;
    const fmtDate = (t: number) => new Date(t).toISOString().slice(0, 10);
    const grid = allVersions.map(([v, t]: [string, number]) => {
      const isCur = t <= today && phases.some(p => p.v === v && today >= p.start && today < p.end);
      const cls = isCur ? 'gold' : '';
      return `<button class="mbtn pick-ver-btn ${cls}" style="margin:3px" data-ver="${v}">${v}<br><span style="font-size:9px;opacity:.7">${fmtDate(t)}</span></button>`;
    }).join('');
    openModal({
      title: '选择版本 / 日期',
      body: `<div style="font-size:11px;color:var(--muted);line-height:1.6;margin-bottom:8px">
        点击版本号跳到该版本起始日；或在下面输入具体日期跳转。<br>
        <b style="color:var(--gold)">可前后切换时间</b>；向后推进会自动结算月卡 / 体力 / 礼包刷新，向前切换只改变当前日期与版本环境。
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;margin-bottom:10px">${grid}</div>
      <div style="text-align:center;font-size:11px;color:var(--muted)">
        跳到日期：<input type="date" id="pvDate" value="${fmtDate(today)}" style="background:rgba(255,255,255,.06);color:var(--text);border:1px solid var(--line2);border-radius:6px;padding:4px 8px;font:inherit"/>
        <button class="mbtn gold pick-date-btn" style="margin-left:6px">跳转</button>
      </div>`,
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
  };
}

function bindPickVersionModalDelegation() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.addEventListener('click', (e: Event) => {
    const me = e.target as HTMLElement;
    const pickVer = me.closest?.('.pick-ver-btn');
    if (pickVer) {
      const v = (pickVer as HTMLElement).dataset.ver;
      if (v && jumpToVersion(v)) { rerenderAll(); msg(`跳到版本 ${v}`, false); document.getElementById('modal')?.classList.remove('on'); }
      return;
    }
    const pickDate = me.closest?.('.pick-date-btn');
    if (pickDate) {
      const inp = document.getElementById('pvDate') as HTMLInputElement | null;
      if (inp?.value) {
        const t = new Date(inp.value + 'T00:00:00Z').getTime();
        if (jumpToDate(t)) { rerenderAll(); msg(`跳到 ${inp.value}`, false); document.getElementById('modal')?.classList.remove('on'); }
      }
    }
  });
}

// ============ 弹窗点击外部关闭 + tooltip ============
function bindModalOutsideClick() {
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.onclick = (e: MouseEvent) => {
    if (e.target === modal) modal.classList.remove('on');
  };
}

let __tipEl: HTMLElement | null = null;
let __tipSrc: HTMLElement | null = null;
function placeTipPop(src: HTMLElement) {
  if (!__tipEl) return;
  const r = src.getBoundingClientRect();
  const margin = 8;
  const gap = 6;
  // 先放到视口内可测尺寸，再按可用空间决定上下
  __tipEl.style.display = 'block';
  __tipEl.style.visibility = 'hidden';
  __tipEl.style.top = '0px';
  __tipEl.style.left = '0px';
  const popH = __tipEl.offsetHeight || 0;
  const popW = __tipEl.offsetWidth || 0;
  const spaceBelow = window.innerHeight - r.bottom - margin;
  const spaceAbove = r.top - margin;
  let top: number;
  if (spaceBelow >= popH + gap || spaceBelow >= spaceAbove) {
    top = r.bottom + gap;
  } else {
    top = r.top - popH - gap;
  }
  // 列表最后一项翻到上方时，旧逻辑可能 top < 0，看起来像「点不出」
  top = Math.max(margin, Math.min(top, window.innerHeight - popH - margin));
  let left = r.left;
  left = Math.max(margin, Math.min(left, window.innerWidth - popW - margin));
  __tipEl.style.top = top + 'px';
  __tipEl.style.left = left + 'px';
  __tipEl.style.visibility = 'visible';
}

function ensureTipEl() {
  if (!__tipEl) {
    __tipEl = document.createElement('div');
    __tipEl.className = 'tip-pop';
    document.body.appendChild(__tipEl);
  }
  return __tipEl;
}

function showTipFrom(src: HTMLElement) {
  ensureTipEl();
  __tipSrc = src;
  __tipEl!.innerHTML = src.dataset.tip || '';
  placeTipPop(src);
}

function hideTip() {
  if (__tipEl) __tipEl.style.display = 'none';
  __tipSrc = null;
}

function bindTooltip() {
  document.body.addEventListener('mouseover', (e: Event) => {
    const me = e.target as HTMLElement;
    const t = me.closest && me.closest('.tip[data-tip], .tip-term[data-tip]');
    if (!t) return;
    showTipFrom(t as HTMLElement);
  });
  // 手机/触摸：无稳定 hover，点一次打开、再点同节点或空白关闭
  document.body.addEventListener('click', (e: Event) => {
    const me = e.target as HTMLElement;
    const t = me.closest && me.closest('.tip[data-tip], .tip-term[data-tip]');
    if (t) {
      if (__tipSrc === t && __tipEl && __tipEl.style.display !== 'none') {
        hideTip();
      } else {
        showTipFrom(t as HTMLElement);
      }
      return;
    }
    if (__tipSrc) hideTip();
  }, true);
  // 滚动时列表底部节点位移，同步重定位，避免气泡留在旧坐标/跑出视口
  document.addEventListener('scroll', () => {
    if (__tipSrc && __tipEl && __tipSrc.isConnected) placeTipPop(__tipSrc);
    else if (__tipEl) hideTip();
  }, true);
  document.body.addEventListener('mouseout', (e: Event) => {
    const me = e.target as HTMLElement;
    if (!me.closest) return;
    const t = me.closest('.tip[data-tip], .tip-term[data-tip]');
    if (!t) return;
    // 移入子节点不算离开
    const rel = (e as MouseEvent).relatedTarget as Node | null;
    if (rel && t.contains(rel)) return;
    // 触摸设备上 mouseout 会立刻清掉 click 打开的 tip，只在指针设备上跟随离开关闭
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      hideTip();
    }
  });
  // 源节点被卸载(buff 消失/战斗结束/Preact 重渲染)时 mouseout 不触发,用 MutationObserver 兜底
  const obs = new MutationObserver(() => {
    if (__tipSrc && !__tipSrc.isConnected) hideTip();
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

// AppShell 渲染为空 Fragment —— 它只负责接管 DOM 事件,不渲染任何可见 UI。
// 后续 Phase 2 第二小步可改成渲染顶部按钮区 + tab 控件,届时再把 index.html 的
// .timeline / .view-tabs 静态节点删掉由 AppShell 渲染。
export function AppShell() {
  useEffect(() => {
    // 子 tab 切换(顶层 .vtab 已迁到 <ViewTabs/>)
    document.querySelectorAll<HTMLElement>('.a-tab').forEach(t => {
      t.onclick = () => {
        const key = t.dataset.a as 'team' | 'daily' | 'dungeon' | 'abyss' | 'wastes' | undefined;
        if (key) setATab(key);
      };
    });
    document.querySelectorAll<HTMLElement>('.b-tab').forEach(t => {
      t.onclick = () => {
        const key = t.dataset.b as 'podcast' | 'shop' | undefined;
        if (key) setBTab(key);
      };
    });
    // 顶部时间线 + 重置 + 存档 + 选版本
    bindTimelineButtons();
    bindResetButton();
    bindSaveMgmtButton();
    bindPickVersionButton();
    bindPickVersionModalDelegation();
    // 弹窗点击外部关闭 + 全局 tooltip
    bindModalOutsideClick();
    bindTooltip();
    // 第一次进游戏时自动弹开局设置(无存档 + 未做过 setup)
    if (isStartSetupNeeded()) {
      setTimeout(() => openStartSetupModal(), 100);
    }
  }, []);
  return null;
}