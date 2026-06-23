# AGENTS.md — 项目交接给 AI 助手的关键信息

> 这是给下一个 AI 助手（或 Claude Code、Cursor、Copilot 等）看的项目地图。如果你刚接手这个项目，先读这个。

## 项目概览

**鸣潮抽卡模拟器**，Vite + 原生 ES Modules + 原生 JS（不用 React/Vue/TS）。

- 模拟鸣潮（Wuthering Waves）的抽卡 + 养成 + 战斗系统
- 单仓库静态网页，能 `npm run dev` 起 Vite，也能 `npm run build` 打包到 dist/ 静态部署
- 项目主要语言：**简体中文**（UI 文本、变量命名混合中英文）
- 用户：Windows 11 / Git Bash / 中文偏好

## ⚠️ 编码注意

**所有 `.js` / `.html` / `.css` / `.md` 文件均为 UTF-8 编码。**

在 Windows 默认终端（GBK / 代码页 936）读取时会乱码。如果你看到的中文是乱码（比如「忌炎」变成「忘避瀛」），说明终端编码不对：

```bash
# 解决方法 1：切换 UTF-8 代码页（推荐）
chcp 65001

# 解决方法 2：用 Read 工具而不是 cat/type
# Claude Code 的 Read 工具内置 UTF-8 解码，不会乱码

# 解决方法 3：让 Node 输出
node -e "console.log(require('fs').readFileSync('src/state.js','utf8'))"
```

**不要因为终端显示乱码就以为文件本身坏了。** 浏览器和 Vite 构建用的都是 UTF-8，源文件没问题。

## 用户偏好（必须遵守）

1. **永远说中文回复**（除非用户主动用英文）
2. **不要过度工程化** — 用户多次说"内容超标"。砍掉不必要的复杂度
3. **不上 TypeScript**（用户明确说了）
4. **直接动手实现** — 用户喜欢实施型对话，避免拖沓的规划讨论
5. **保留 v0.1 纯抽卡版本备份** — 在 `git tag v0.1-pure-gacha` 和 `d:\cmd-git\wuwa-gacha-simulator-backups\v0.1-纯抽卡版.zip`

## 核心架构原则

### 1. 全局状态 `S` 是真相之源
- `src/state.js` 的 `state0()` 是初始状态工厂
- `export let S = state0()` — 用 ESM live binding 让其他模块拿到引用
- 重置时用 `Object.assign(S, state0())` 原地清空，**不能** `S = state0()`（会断引用）

### 2. localStorage 自动存档
- `src/save.js` 提供 `saveState()`（防抖 1s）、`loadState()`（启动调用）
- 每次 `render()` 后自动保存
- 旧存档迁移：`Object.assign(state0(), data)` 自动补全新字段

### 3. 模块通过 `window.*` 桥接 onclick
- HTML `onclick="xxx()"` 调用 → 必须 `window.xxx = xxx` 暴露
- 命名约定：`window.__xxx`（双下划线）是私有桥接，`window.openXxx` 是面向用户

### 4. 渲染策略
- 每个 tab 一个 render 函数：`renderTeamBuilder`/`renderDungeon`/`renderAbyss`/`renderDaily`
- 主 `render()`（在 `ui/render.js`）负责顶栏/卡池/抽卡/统计/海市/商店/记录
- tab 切换时只渲染当前面板（main.js 的 tab 切换逻辑）
- 全局重渲染：`window.__rerenderAll()` 或 `window.__render()`

## 核心数据流

```
用户点抽卡按钮
  ↓
tryPull(n) 检查资源 → 弹窗确认（如缺星声补抽）
  ↓
doPullN(n, free) 真正消耗 + 调用 pull()×n
  ↓
pull(pool) 内部
  ├─ 概率 + 保底（rate(), pity[]）
  ├─ five() / four() 决定五星四星
  ├─ addRole() / addWeapon() 更新 S.roles / S.weapons
  └─ 累加余波珊瑚
  ↓
showResult(arr) 翻牌动画
  ↓
render() → saveState()
```

## 战斗流程

```
用户进入副本/深渊
  ↓
createBattle(teamNames, enemyNames, opts)
  ├─ 每个队员 computeBattleStats() 算出最终属性（含武器+共鸣链）
  ├─ applyChainBonuses() 应用自身共鸣链
  ├─ applyTeamAuras() 应用全队 buff（队友光环）
  └─ spawnEnemy() 生成敌人
  ↓
玩家操作 → doAttack/doSkill/doBurst/doDefend/doSwitch
  ↓
endTurn(battle) 敌方 AI 出招 + 触发机制
  ↓
isWin/isLose → 结算奖励 → 关闭战斗界面
```

## 重要数值

- **角色 1→90**：约 42.5 万经验（方案 B，1/4 真实数值）
- **经验书**：白瓢 1000 / 蓝瓢 3000 / 紫瓢 8000
- **武器 1→90**：约 40 本武器石
- **抽卡软保底**：65 抽起开始上涨，80 抽硬保底
- **十连保底**：10 抽必 4 星
- **联动池/武器池**：100% UP，不歪
- **角色池**：50/50，歪了下次必 UP
- **新手池（万象新声）**：50 抽内必出五星，仅一次

## 常见坑

### 不要做的事
- ❌ 在循环 import 中放 `import` 在文件底部（必须顶部）
- ❌ 用 `require()`（这是浏览器 ESM，不是 Node）
- ❌ 用 `Date.now()` / `Math.random()` 在某些 sandbox 环境中（实际本项目可以用，但 agent 工作流里不能）
- ❌ 给 `S` 重新赋值（会断 live binding）

### 容易忽略的事
- ✅ HTML 中 onclick 调用必须 `window.xxx = xxx`
- ✅ ESM `export let X` 是 live binding，重新赋值有效
- ✅ 中文字符串包含 `"` 时要用单引号包裹（seq.js 的坑）
- ✅ `loadState()` 必须在 `render()` 之前调用
- ✅ 添加新 S 字段时，state0() 的默认值要写好（旧存档自动迁移）

## 加新功能的检查清单

如果用户让你加新功能，按这个顺序：

1. **在 `state0()` 加新字段**（默认值不能用现有字段，自包含）
2. **写纯数据**（`src/data/*.js` 或 `src/battle/*.js`）
3. **写逻辑函数**（不依赖 UI，可单独测试）
4. **写 UI 渲染函数**（一个 tab 一个文件）
5. **改 `index.html` 加 tab + pane**
6. **改 `main.js` 接入 tab 切换 + 事件绑定**
7. **跑 `npx vite build` 验证语法**
8. **跑 `npm run dev` 在浏览器验证功能**

## 工具与命令

```bash
# 开发
npm run dev              # 启动 dev server (http://localhost:5173)
npm run build            # 打包到 dist/
npm run preview          # 预览打包产物

# Git
git status               # 看改动
git log --oneline -10    # 最近 10 次提交
git tag                  # 看标签（v0.1-pure-gacha 是纯抽卡版）

# 直接打开（双击）
开始游戏.bat              # 自动检测依赖并启动 dev server
```

## 资料源（外部链接）

详见 `wuwa-refs.md` — 已记录所有数据来源（官方公告、Wiki、社区攻略）和待校准项。

## 用户场景

用户是中文鸣潮玩家，电脑是 Windows 11，想做一个能模拟整个游戏体验的工具。

**关键诉求**：
- 抽卡能保存
- 抽出的角色能用起来（不是看一眼就过去）
- 有日常 → 副本 → 深渊的资源循环
- 能体验数值上涨的爽快感

---

**最后**：如果你不确定，就去问用户。用户喜欢直接的对话，不喜欢猜。