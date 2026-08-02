import { bumpStateVersion } from './ui/signals.ts';

// 全部面板重渲染（Preact 组件订阅 signals 自动重渲染）
export function rerenderAll() {
  bumpStateVersion();
}
