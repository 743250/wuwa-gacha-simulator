// 先约电台 UI · Preact 接管 shim
//
// Preact 已接管 #panePodcast。
// renderPodcast() 保留为 no-op（main.js import 仍指向这里，Stage 6 统一清理）。
// window.__podcastClaim / __podcastClaimAll / __podcastBuyLevel 保留以供老 onclick 回退。
//
// Action handler 已被 Preact onClick 内联替代,不再依赖这些包裹函数刷新。
// 但保留它们以防 main.js 或外部 onclick 还有引用。

export function renderPodcast() {
  // no-op — Preact 组件已接管 #panePodcast
}

// 保留 action wrappers（备用,新代码走 Preact onClick 内联）
window.__podcastClaim = (track, lv) => {
  if (track === 'free') window.__podcast.claimFree(lv);
  else window.__podcast.claimPaid(lv);
  window.__rerenderAll && window.__rerenderAll();
};
window.__podcastClaimAll = () => {
  window.__podcast.claimAll();
  window.__rerenderAll && window.__rerenderAll();
};
window.__podcastBuyLevel = (n) => {
  if (window.__podcast.buyLevel(n)) {
    window.__rerenderAll && window.__rerenderAll();
  }
};
