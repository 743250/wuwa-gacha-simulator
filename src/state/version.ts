// 状态版本号 signal · Phase 2 步骤 C
//
// 历史责任:原本 stateVersion / bumpStateVersion 定义在 src/ui/signals.ts,
// 但 src/state/commit.ts 为了在写入后通知 UI 刷新而 import signals.ts,
// 形成了 state → ui 反向依赖(违反架构目标方向:data → domain → application → ui)。
//
// 把版本号下移到 state 层后:
//   · commit.ts → state/version.ts(允许,同层)
//   · signals.ts → state/version.ts(UI 依赖 application/state,允许)
// state 层不再反向 import UI。
//
// useS() 仍由 signals.ts 提供(它是 UI 的订阅助手)。

import { signal } from '@preact/signals';

export const stateVersion = signal(0);

export function bumpStateVersion(): void {
  stateVersion.value = stateVersion.value + 1;
}