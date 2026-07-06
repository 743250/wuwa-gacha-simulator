import { render } from './ui/render.js';
import { bumpStateVersion } from './ui/signals.ts';

// 全部面板重渲染（旧 render + Preact signals）
// Phase 5:8 个 render* no-op 调用已删,Preact 组件订阅 signals 自动重渲染
export function rerenderAll() {
  render();
  bumpStateVersion();
}
