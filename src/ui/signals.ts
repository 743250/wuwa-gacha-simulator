// 全局 signals 桥 · Stage 1 骨架 + Stage 2 修正。
//
// 现状:src/state.js 的 S 是 mutable 单例,遍布代码。要让 preact 组件响应它的变化,
// 又不能一次改所有 writer,采取"版本号"策略:
//   · 任何写入 S 之后,调用 bumpStateVersion() 触发 stateVersion.value++
//   · main.js 的 rerenderAll() 尾部会调 bumpStateVersion(),旧 UI 触发的变更都能被 Preact 捕捉
//
// **Stage 2 学到的坑**:不要写成 `computed(() => S)`—— computed 的 Object.is 相等判断会
// 抑制订阅通知(因为 S 是同一个引用,只是内部字段变了),组件收不到重渲染信号。
//
// **正确用法**:组件根部读 `useS()`,它内部读 `stateVersion.value` 建立订阅、返回 `S` 本身。
// 版本号变了 → 组件重渲染 → 重新从 S 拿最新字段。

import { signal } from '@preact/signals';
import { S } from '../state.js';

// 全局版本号:任何 S 变更后自增。
export const stateVersion = signal(0);

export function bumpStateVersion(): void {
  stateVersion.value = stateVersion.value + 1;
}

// 供组件根部调用 —— 建立对 stateVersion 的订阅,返回 S 本身。
// preact 组件里的 `const s = useS()` 相当于每次 stateVersion 变都重取一次 S(引用不变,字段变)。
export function useS(): typeof S {
  // 触碰 stateVersion 建立订阅关系(哪怕不用它的值)
  void stateVersion.value;
  return S;
}
