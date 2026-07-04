# 面板迁移 Playbook

> 从 innerHTML + `onclick="window.__x()"` 迁到 Preact + signals 的固定流程。
> Stage 2 首迁 bag 时归纳,后续 Stage 3-5 所有面板都照这个走。

## 前提

Stage 1 已完成:
- `src/ui2/root.tsx` 有 `mountPreactRoot()` 入口
- `src/ui2/signals.ts` 有 `sSignal` computed + `bumpStateVersion()`
- `main.js` 里 `rerenderAll()` 尾部会调 `bumpStateVersion()`,老 UI 触发的所有变更都会驱动 Preact 组件重渲染
- vitest 用 `// @vitest-environment happy-dom` docblock 切 DOM 环境

## 7 步走

### 1. 建组件目录

```
src/ui2/panels/<面板名>/
  <PanelName>.tsx    ← 主入口
  <Sub>.tsx          ← 子组件(可选)
  actions.ts         ← 副作用(Stage 6 才拆,当前直接调 window.__)
```

### 2. 摸清老渲染路径

- 老 `renderXxx()` 写的目标 DOM 是哪个 `#panelId`?
- `main.js` 的 `rerenderAll()` 里有没有调 `renderXxx()`?
- 面板切换 tab 里有没有触发 `renderXxx()`?
- action handlers(挂 `window.__` 的地方)哪些调 `renderXxx()`?

### 3. 写 Preact 组件

**规则**:
- **只搬 UI 层**,业务逻辑函数继续 `import`(或者暂时调 `window.__x()`,后期清)
- 组件根从 `sSignal.value` 拿 `S`,不直接 `import { S }` —— 这样才建立订阅
- style 用 inline object(和现有代码风格保持一致,styles/main.css 不动)
- **不改角色数值/公式/共鸣链效果**(继承铁律)
- className 写作 `class`(preact 支持,和 HTML 一致)
- 按钮 `onClick={() => window.__xxx()}` —— 老 handler 继续跑,渲染逻辑改 Preact

### 4. 挂载到老 DOM 节点

`src/ui2/root.tsx` 里加:

```tsx
const container = document.getElementById('paneXxx');
if (container && !xxxMounted) {
  preactRender(h(XxxPanel, null), container);
  xxxMounted = true;
}
```

**关键**:直接 render 到 `#paneXxx`,不需要另挂新根。老 `renderXxx()` 变成 no-op 后不会再 write innerHTML,冲突不存在。

### 5. 老 renderXxx 变 no-op

`src/ui/<panel>.js` 保留一个 shim:

```js
// Preact 已接管 #paneXxx,这里只保留 action handler 注册和空 export
import { registerXxxActions } from './xxx/actions.js';

export function renderXxx() {}  // no-op

registerXxxActions({ renderXxx: () => {} });  // action 里的 renderXxx() 变空
```

**别删原文件** —— main.js 的 import 还指向它,Stage 6 才统一清。

### 6. 浏览器点验 checklist(至少)

- [ ] 面板打开时布局与迁移前一致(视觉对齐)
- [ ] 每个按钮点了有反应 · 相应 state 正确变化
- [ ] modal 打开/关闭正常
- [ ] 切到别的 tab 再切回来,状态保留
- [ ] 存档 → 刷新页面 → 状态一致
- [ ] 触发 `rerenderAll()` 的操作(如 `+1 日`)后,面板刷新

### 7. 组件单测(happy-dom)

`tests/ui2/<PanelName>.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { XxxPanel } from '../../src/ui2/panels/xxx/XxxPanel';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui2/signals';

let container: HTMLDivElement | null = null;
function mount(node) {
  container = document.createElement('div');
  document.body.appendChild(container);
  render(node, container);
  return container;
}
afterEach(() => { if (container) { render(null, container); container.remove(); container = null; } });

describe('XxxPanel', () => {
  it('renders empty state', () => {
    resetState();
    const el = mount(h(XxxPanel, null));
    expect(el.textContent).toContain('...');
  });

  it('reacts to state changes', async () => {
    resetState();
    const el = mount(h(XxxPanel, null));
    S.some = 42;
    bumpStateVersion();
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    expect(el.textContent).toContain('42');
  });
});
```

至少 5 个 case:空状态、有数据、signal 响应、多字段渲染、边界(null/undefined 字段)。

## 常见坑

1. **preact 不认 `className`,要写 `class`** —— 属性冲突时可以两个都写。
2. **`@testing-library/preact` 3.2.4 与 preact 10.29 的 test-utils 冲突** —— 用 preact 原生 `render`。
3. **signals 更新是异步的**,`await Promise.resolve()` + `setTimeout 0` 一次刷新到位。
4. **老 renderXxx 变 no-op 时不要删 registerXxxActions 调用** —— 它挂 `window.__` handler,别的模块会调。
5. **组件里读 S 一定要走 `sSignal.value`**,不能直接 `import { S }`,否则不建立订阅。
6. **inline style 里的 CSS variable 写字符串**:`color: 'var(--gold)'`,不要写成 CSS 属性对象。
7. **DOM 节点复用**:老 renderXxx 变 no-op 后,还得清一次 innerHTML 吗?不用。Preact 首次 render 时会接管容器内子节点。但如果老代码在 mount 之前先写了 innerHTML,Preact hydrate 会失败 —— 目前测试没触发这种情况,遇到再说。
8. **组件内不做副作用**:老 renderDaily 里有 `resetDailyIfNeeded()`—— 组件里调它会重置测试的 mock 状态。副作用应该在 mount 前(main.js 启动流程 / 时间推进按钮 rerenderAll 之前)触发,组件只读渲染,不写状态。
9. **rolldown 需要 preact preset**:`vitest.config.js` 里必须挂 `@preact/preset-vite` plugin,否则 rolldown 不认 JSX。这个 Stage 2 已经加了,Stage 3 直接用。
10. **shim 不要 import ui2/*.ts**:`.js` shim 不能 import `.ts` 文件,rollup 生产构建会报 `Could not resolve`。替代方案:shim 里调 `window.__render()`(main.js 已挂到 window),或把状态(如 tab)放在 shim 自身里、Preact 组件反过来 import shim。
11. **组件 dom 查询要精确**:多 card + buttons 的组件里 `el.querySelector('button')` 可能拿到第一个(体力按钮),用 `el.querySelectorAll('.dng-card .mbtn.gold')` 定位到具体卡片内的按钮。
12. **tab 标签在侧栏固定出现**:tab 切换测试不能断言 `not.toContain(g.label)` 因为侧栏标签永远显示,应断言具体卡片名(如 `模拟战训·共鸣经验`)不出现。

## 已迁面板清单

| 面板 | Stage | 状态 |
|---|---|---|
| bag | 2 | ✅ |
| daily | 3.1 | ✅ |
| dungeon | 3.2 | ✅ |
| abyss | 3.3 | ✅ |
| wastes | 3.4 | ✅ |
| podcast | 3.5 | ✅ |
| roleModal | 5.1 | ✅ |
| battle UI | 5.2 | ✅ |
| teambuilder | 6.1a | ✅ |
| 共鸣唤取主面板 | 6.1b | ✅ |
| shop | 6.1b | ✅(并入主面板) |
| exchange | 6.1b | ✅(并入主面板) |
