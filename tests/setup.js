// Global mocks for browser APIs used by src/ modules.
// Runs before every test file.

// Mock window
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

// Mock document
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

// Mock localStorage
const store = {};
globalThis.localStorage = {
  getItem(k) { return store[k] || null; },
  setItem(k, v) { store[k] = v; },
  removeItem(k) { delete store[k]; },
  clear() { Object.keys(store).forEach(k => delete store[k]); },
};
