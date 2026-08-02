// 冒险视图子 tab · AppShell 去 headless（Phase 3）
// 替代 index.html 的 .a-tab 静态节点 + AppShell querySelectorAll 绑定。
// .on class 由 aTabSignal 派生，display 切换由 setATab 处理。

import { h } from 'preact';
import { useS, aTabSignal } from '../signals';
import { setATab } from '../AppShell';

const A_TABS: Array<{ key: 'team' | 'daily' | 'dungeon' | 'abyss' | 'wastes'; zh: string }> = [
  { key: 'team', zh: '编 队' },
  { key: 'daily', zh: '日 常' },
  { key: 'dungeon', zh: '副 本' },
  { key: 'abyss', zh: '深 塔' },
  { key: 'wastes', zh: '海 墟' },
];

export function ATabBar() {
  useS();
  const cur = aTabSignal.value;
  return (
    <div class="side-tabs">
      {A_TABS.map(t => (
        <div class={`a-tab${t.key === cur ? ' on' : ''}`} data-a={t.key} onClick={() => setATab(t.key)}>
          {t.zh}
        </div>
      ))}
    </div>
  );
}
