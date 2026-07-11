// Preact signals 桥 · Phase 2 步骤 C 后
//
// stateVersion / bumpStateVersion 已下沉到 src/state/version.ts(消除 state→ui 反向依赖)。
// 这里 re-export 保持调用方兼容:pointer-in signal 由 UI 域从这里拿仍可,迁移中。
//
// useS() 是 UI 订阅助手:组件根部读 stateVersion.value 建立订阅,返回 S 本身。
// Stage 2 教训:不要写成 `computed(() => S)` —— Object.is 判断抑制通知(S 同引用字段变)。
// 正确:bool 从 stateVersion 取(已迁到 state/version.ts),无脑读以建立订阅关系。

import { signal } from '@preact/signals';
import { S } from '../state.js';
import { stateVersion } from '../state/version.ts';

// 兼容 re-export —— 各模块仍可从 signals.ts 取,迁移中。
export { stateVersion };
export { bumpStateVersion } from '../state/version.ts';

// 供组件根部调用 —— 建立对 stateVersion 的订阅,返回 S 本身。
// preact 组件里的 `const s = useS()` 相当于每次 stateVersion 变都重取一次 S(引用不变,字段变)。
export function useS(): typeof S {
  // 触碰 stateVersion 建立订阅关系(哪怕不用它的值)
  void stateVersion.value;
  return S;
}

// 顶层视图与子 tab 状态(Phase 2:AppShell 接管 view/tab 切换)
// 三个 signal 都是 '当前激活 key' 的单一真相源;DOM 上的 .on class 由 AppShell 同步。
// 外部组件要切视图请调 src/ui/appShell.ts 的 setView/setATab/setBTab,不要直接写 signal.value(让 setView 集中处理 display 切换副作用)。
export const viewSignal = signal<'gacha' | 'adventure' | 'bag' | 'storage'>('gacha');
export const aTabSignal = signal<'team' | 'daily' | 'dungeon' | 'abyss' | 'wastes'>('team');
export const bTabSignal = signal<'podcast' | 'shop'>('podcast');
