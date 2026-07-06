// Global mocks for browser APIs used by src/ modules.
// Runs before every test file.
//
// 2026-07-03 Stage 1:tests/ui/** 用 happy-dom 环境,已提供真实 window/document/localStorage。
// 只有在没有 DOM 的 node 环境(其余 464 测试)才注入 mock,避免覆盖真实 DOM 导致 preact render 挂载失败。

// happy-dom / jsdom 都提供 createElementNS(SVG 支持),而我们下面注入的 mock 没有 —— 用它区分。
const hasRealDom = typeof globalThis.document !== 'undefined'
  && typeof globalThis.document.createElementNS === 'function';

if (!hasRealDom) {
  // Node 环境:注入最小 mock,只覆盖 src/ 用到的少数 API。
  globalThis.window = {
    __render() {},
    __rerenderAll() {},
    __pickVer() {},
    __pickDate() {},
    selectTarget() {},
    upgrade() {},
    exportSave() {},
    importSaveFile() {},
    animating: false,
  };

  globalThis.document = {
    getElementById() {
      return {
        classList: { add() {}, remove() {}, toggle() {}, contains() {} },
        style: {},
        onclick: null,
        textContent: '',
        innerHTML: '',
      };
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return {
        classList: { add() {}, remove() {} },
        style: {},
        appendChild() {},
      };
    },
    body: {
      appendChild() {},
      addEventListener() {},
      removeEventListener() {},
    },
  };

  const store = {};
  globalThis.localStorage = {
    getItem(k) { return store[k] || null; },
    setItem(k, v) { store[k] = v; },
    removeItem(k) { delete store[k]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); },
  };
}
