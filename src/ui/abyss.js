// Preact 已接管 #paneAbyss,这里只保留 no-op render 给 main.js import。
// Stage 6 统一清理时连 main.js 一起删。

export function renderAbyss() {
  // no-op: Preact AbyssPanel 已接管渲染
}
