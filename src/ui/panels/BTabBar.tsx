// 商店视图子 tab · AppShell 去 headless（Phase 3）
// 替代 index.html 的 .b-tab 静态节点 + AppShell querySelectorAll 绑定。

import { h } from 'preact';
import { useS, bTabSignal } from '../signals';
import { setBTab } from '../AppShell';

const B_TABS: Array<{ key: 'podcast' | 'shop'; zh: string }> = [
  { key: 'podcast', zh: '电 台' },
  { key: 'shop', zh: '商 店' },
];

export function BTabBar() {
  useS();
  const cur = bTabSignal.value;
  return (
    <div class="side-tabs">
      {B_TABS.map(t => (
        <div class={`b-tab${t.key === cur ? ' on' : ''}`} data-b={t.key} onClick={() => setBTab(t.key)}>
          {t.zh}
        </div>
      ))}
    </div>
  );
}
