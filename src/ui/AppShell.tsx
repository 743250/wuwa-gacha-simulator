// 应用壳 · Phase 2/3
//
// 策略:headless 组件 —— 不渲染面板本体,只负责全局事件副作用:
// 弹窗点击外部关闭 + tooltip 委托。
// 顶部时间线栏(<TimelineBar/>)、顶层视图 tab(<ViewTabs/>)、子 tab(<ATabBar/>/<BTabBar/>)
// 已组件化,不再在此绑定。
//
// 为什么不 conditional render:Preact unmount 会销毁 #viewGacha 内 GachaPanel 等
// 组件的内部 state,切回来时丢状态。保留 style.display 切换语义。
//
// 外部组件要切视图请 import { setView } from './AppShell',不要直接写 signal.value
// (setView 集中处理 display 切换 + signal 赋值)。

import { useEffect } from 'preact/hooks';
import { viewSignal, aTabSignal, bTabSignal } from './signals';
import { isStartSetupNeeded } from './setup/StartSetupModal';
import { openStartSetupModal } from './setup/StartSetupModal';

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
  // .on class 由 <ATabBar/> 根据 aTabSignal 派生
  A_TABS.forEach(p => {
    const el = document.getElementById('pane' + p[0].toUpperCase() + p.slice(1));
    if (el) el.style.display = p === key ? '' : 'none';
  });
}

export function setBTab(key: 'podcast' | 'shop') {
  bTabSignal.value = key;
  // .on class 由 <BTabBar/> 根据 bTabSignal 派生
  B_TABS.forEach(p => {
    const el = document.getElementById('pane' + p[0].toUpperCase() + p.slice(1));
    if (el) el.style.display = p === key ? '' : 'none';
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

const TIP_SEL = '.tip[data-tip], .tip-term[data-tip], .tip-num[data-tip]';
function isFinePointer() {
  return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
}
function findTipTarget(el: EventTarget | null): HTMLElement | null {
  const me = el as HTMLElement | null;
  if (!me || !me.closest) return null;
  return me.closest(TIP_SEL) as HTMLElement | null;
}

function bindTooltip() {
  // 仅真正的鼠标悬停设备走 hover；触屏/混合指针只靠点按，避免“得像长按一样才出”
  document.body.addEventListener('mouseover', (e: Event) => {
    if (!isFinePointer()) return;
    const t = findTipTarget(e.target);
    if (!t) return;
    showTipFrom(t);
  });
  // 点按：pointerup 比 click 更跟手（尤其 Android WebView）；同节点再点关闭
  document.body.addEventListener('pointerup', (e: Event) => {
    const pe = e as PointerEvent;
    // 只处理主触点/主键，避免笔/右键干扰
    if (pe.pointerType === 'mouse' && pe.button !== 0) return;
    const t = findTipTarget(e.target);
    if (t) {
      if (__tipSrc === t && __tipEl && __tipEl.style.display !== 'none') {
        hideTip();
      } else {
        showTipFrom(t);
      }
      return;
    }
    // 点空白关闭（不拦其它按钮）
    if (__tipSrc) hideTip();
  }, true);
  // 滚动时列表底部节点位移，同步重定位，避免气泡留在旧坐标/跑出视口
  document.addEventListener('scroll', () => {
    if (__tipSrc && __tipEl && __tipSrc.isConnected) placeTipPop(__tipSrc);
    else if (__tipEl) hideTip();
  }, true);
  document.body.addEventListener('mouseout', (e: Event) => {
    if (!isFinePointer()) return;
    const t = findTipTarget(e.target);
    if (!t) return;
    // 移入子节点不算离开
    const rel = (e as MouseEvent).relatedTarget as Node | null;
    if (rel && t.contains(rel)) return;
    hideTip();
  });
  // 源节点被卸载(buff 消失/战斗结束/Preact 重渲染)时 mouseout 不触发,用 MutationObserver 兜底
  const obs = new MutationObserver(() => {
    if (__tipSrc && !__tipSrc.isConnected) hideTip();
  });
  obs.observe(document.body, { childList: true, subtree: true });
}

// AppShell 渲染为空 Fragment —— 只负责全局事件副作用（弹窗外部关闭 + tooltip）。
// 顶部时间线栏 / 顶层视图 tab / 子 tab 均已组件化（TimelineBar / ViewTabs / ATabBar / BTabBar）。
export function AppShell() {
  useEffect(() => {
    bindModalOutsideClick();
    bindTooltip();
    // 第一次进游戏时自动弹开局设置(无存档 + 未做过 setup)
    if (isStartSetupNeeded()) {
      setTimeout(() => openStartSetupModal(), 100);
    }
  }, []);
  return null;
}