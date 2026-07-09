// 顶层视图切换 tab · AppShell 第二小步真组件化
// 把 index.html 的 .view-tabs 静态节点迁到 Preact 组件,onClick 走 JSX,不再 querySelectorAll。
import { h } from 'preact';
import { useS, viewSignal } from '../signals';
import { setView } from '../AppShell';

const TABS: Array<{ v: 'gacha' | 'adventure' | 'bag' | 'storage'; zh: string; sub: string }> = [
  { v: 'gacha', zh: '唤 取', sub: '🎲 卡池 · 角色 · 海市' },
  { v: 'adventure', zh: '冒 险', sub: '⚔ 编队 · 日常 · 副本 · 深塔' },
  { v: 'bag', zh: '背 包', sub: '🎒 材料 · 武器 · 药剂' },
  { v: 'storage', zh: '商 店', sub: '📻 充值 · 月卡 · 电台' },
];

export function ViewTabs() {
  useS();
  const cur = viewSignal.value;
  return (
    <div class="view-tabs">
      {TABS.map(t => (
        <button class={`vtab${t.v === cur ? ' on' : ''}`} data-v={t.v} onClick={() => setView(t.v)}>
          <span class="vt-zh">{t.zh}</span>
          <span class="vt-sub">{t.sub}</span>
        </button>
      ))}
    </div>
  );
}
