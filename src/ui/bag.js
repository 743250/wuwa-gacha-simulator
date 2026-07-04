// 背包面板 · Stage 2 已迁到 Preact (src/ui2/panels/bag/BagPanel.tsx)
//
// 这个 shim 文件保留:
//   1. main.js 里 `import { renderBag }` / `renderBag()` 调用不挂
//   2. 注册 window.__bagEcho* / __usePotion 等 action handler(action 层未迁,由 Stage 6 处理)
//   3. Stage 6 清理时删掉本文件
//
// UI 渲染由 <BagPanel /> 组件订阅 sSignal 自动响应,rerenderAll() 内的 bumpStateVersion() 驱动重渲染。

import { registerEchoBagActions } from './bag/echoBagActions.js';
import { registerBagMaterialActions } from './bag/bagMaterialActions.js';

// no-op —— Preact 已接管 #paneBag 的渲染
export function renderBag() {}

// action handler 里的 renderBag() 调用走 no-op;它们后面会跟 window.__render() 触发 preact 重渲染。
registerEchoBagActions({ renderBag: () => {} });
registerBagMaterialActions({ renderBag: () => {} });
