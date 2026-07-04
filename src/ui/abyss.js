// Preact 已接管 #paneAbyss,这里只保留 zone switch handler 和空 export。
// main.js import 还指向这里,Stage 6 统一清。

let abyssZone = 'hazard';

export function renderAbyss() {
  // no-op: Preact AbyssPanel 已接管渲染
}

window.__abyssSwitchZone = (key) => {
  abyssZone = key;
  // Preact 组件用内部 state 管理 tab,不影响老 render
};
