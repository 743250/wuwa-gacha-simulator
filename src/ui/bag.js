// 背包面板 · Stage 2 已迁到 Preact (src/ui2/panels/bag/BagPanel.tsx)
//
// 这个 shim 文件保留:
//   1. main.js 里 `import { renderBag }` / `renderBag()` 调用不挂
//   2. 注册 window.__bagEcho* action handler
//   3. bagMaterialActions 已迁 dual-mode（直接 export 纯函数），不再需要 register
//   4. Stage 6 清理时删掉本文件
//
// UI 渲染由 <BagPanel /> 组件订阅 sSignal 自动响应,rerenderAll() 内的 bumpStateVersion() 驱动重渲染。

import { registerEchoBagActions } from './bag/echoBagActions.js';

// no-op —— Preact 已接管 #paneBag 的渲染
export function renderBag() {}

// echoBagActions 仍用 register 模式(内部有 renderBag 调用走 no-op)
const { bagEchoDetail } = registerEchoBagActions({ renderBag: () => {} });

// Stage 6 dual-mode: 暴露 bagEchoDetail 供 Preact 直接 import 调用
export { bagEchoDetail };
