// 先约电台 UI · Preact 接管 shim
//
// Preact 已接管 #panePodcast。
// renderPodcast() 保留为 no-op（main.js import 仍指向这里，Stage 6 统一清理）。

export function renderPodcast() {
  // no-op — Preact 组件已接管 #panePodcast
}
