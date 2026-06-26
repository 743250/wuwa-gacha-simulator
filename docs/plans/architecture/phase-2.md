# Phase 2 优化计划

> 基于 2026-06-25 架构健康度评估。Phase 1 已完成了注册表雏形和平衡配置集中化，Phase 2 聚焦**测试安全网**和**大文件拆分**。

## Phase 1 回顾（已完成 ✅）

| 项目 | 文件 | 状态 |
|---|---|---|
| 平衡常量集中 | [src/battle/balance.js](../../src/battle/balance.js) | ✅ |
| 角色机制注册表 | [src/battle/characters/index.js](../../src/battle/characters/index.js) | ✅ 4 个 S 级角色已提取 |
| 敌人机制注册表 | [src/battle/enemyMechanics.js](../../src/battle/enemyMechanics.js) | ✅ |
| 技能文案拆分 | [src/ui/render/skillHints.js](../../src/ui/render/skillHints.js) | ✅ 已从 render.js 拆出 |
| 技能行渲染拆分 | [src/ui/render/skillLines.js](../../src/ui/render/skillLines.js) | ✅ |
| Buff 渲染注册表 | [src/ui/battleRenderers/buffRenderers.js](../../src/ui/battleRenderers/buffRenderers.js) | ✅ |
| Smoke 测试 | [scripts/smoke-combat.mjs](../../scripts/smoke-combat.mjs) | ✅ |
| 平衡检查脚本 | [scripts/check-balance.mjs](../../scripts/check-balance.mjs) | ✅ |
| 版本/日期前后跳转 | [src/time/timeline.js](../../src/time/timeline.js) + [src/main.js](../../src/main.js) | ✅ |

## Phase 2 目标

```
建立测试安全网 → 拆分大文件 → 解耦 → 清理
```

---

## 第 1 步：建立测试框架（优先级最高）

> **当前风险**：10500+ 行代码，零自动测试。每次改 combat.js / chains.js / gacha/core.js 都靠手工点。

### 1.1 安装 Vitest

```bash
npm install -D vitest
```

无需额外配置——Vitest 和 Vite 共享 `vite.config.js`，原生支持 ESM。

### 1.2 添加 npm scripts

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

### 1.3 首批测试文件（按风险排序）

| 优先级 | 测试文件 | 被测模块 | 测什么 |
|---|---|---|---|
| P0 | `tests/gacha/core.test.js` | [src/gacha/core.js](../../src/gacha/core.js) | 概率曲线正确性、保底计数、五星率收敛（抽 10000 次统计） |
| P0 | `tests/battle/combat.test.js` | [src/battle/combat.js](../../src/battle/combat.js) | 伤害公式、AP 消耗、技能 CD、能量累积、切换、死亡判断 |
| P0 | `tests/battle/chains.test.js` | [src/battle/chains.js](../../src/battle/chains.js) | 每条链的 effect 是否正确挂载、数值是否与预期一致 |
| P1 | `tests/battle/stats.test.js` | [src/battle/stats.js](../../src/battle/stats.js) | 面板计算（攻击/暴击/元素加成）、共鸣链对面板的影响 |
| P1 | `tests/battle/balance.test.js` | [src/battle/balance.js](../../src/battle/balance.js) | 版本缩放、深塔水温表的边界值 |
| P1 | `tests/equip/weapons.test.js` | [src/equip/weapons.js](../../src/equip/weapons.js) | 武器升级消耗曲线、精炼叠加 |
| P2 | `tests/time/timeline.test.js` | [src/time/timeline.js](../../src/time/timeline.js) | 日期推进、版本切换、月卡结算 |
| P2 | `tests/exchange/coral.test.js` | [src/exchange/coral.js](../../src/exchange/coral.js) | 余波/残振兑换计算 |

### 1.4 测试基础设施

需要写一个 `tests/helpers.js`：

```js
// 构造最小化的 S 状态、mock window/document、提供便捷的 createTestTeam()
export function mockState(overrides) { ... }
export function mockBattle(team, enemies) { ... }
```

已有的 `scripts/smoke-combat.mjs` 的 stub 逻辑可以直接搬进 `tests/helpers.js`。

### 1.5 目标

- **覆盖率不要求高**（UI 渲染层不需要测），但核心逻辑层（gacha/battle/equip/time）应该 **≥70% 行覆盖**
- 以后每次改 combat.js / chains.js / balance.js，跑 `npm test` 应该在 3 秒内给出 pass/fail

---

## 第 2 步：拆分 `render.js`（1086 行 → 6 文件）

> **当前问题**：render.js 是"万能渲染器"，import 了 16 个模块，负责顶栏、卡池区、抽卡区、统计、海市、商店、记录、角色方块、收藏详情。改任何一个 UI 都要碰它。

### 2.1 拆分方案

```
src/ui/render.js          → 保留为入口路由（~50 行），只做 render() 函数分发
src/ui/render/
  topbar.js               ← renderTopbar()        资源栏 + 时间线 + 视图切换
  gachaArea.js            ← renderGachaArea()     卡池选择 + 抽卡按钮区
  stats.js                ← renderStats()         抽卡统计（五星数/保底/欧非）
  exchange.js             ← renderExchange()      海市兑换面板
  shop.js                 ← renderShop()          商店面板
  log.js                  ← renderLog()           抽卡记录
  charBlocks.js           ← renderCharBlocks()    角色方块网
  charDetail.js           ← renderCharDetail()    角色详情弹窗（技能/共鸣链/武器）
  podcast.js              ← renderPodcast()       电台面板
  utils.js                ← （已存在）escJs 等
  skillHints.js           ← （已存在）SKILL_HINTS
  skillLines.js           ← （已存在）makeSkillLines
```

### 2.2 执行方式

**不需要一次全拆**。按以下顺序逐个迁移：

1. `renderCharDetail()` — 最大最独立的函数（~300 行），拆到 `render/charDetail.js`
2. `renderGachaArea()` — 卡池 + 抽卡按钮区（~150 行），拆到 `render/gachaArea.js`
3. `renderCharBlocks()` + `renderStats()` — 角色方块 + 统计（~200 行），拆到 `render/charBlocks.js` + `render/stats.js`
4. `renderExchange()` / `renderShop()` / `renderLog()` — 剩余小块

每拆一个，从 `render.js` 删掉对应函数体，改成调用新文件的导出函数。

### 2.3 约束

- render.js 现有的函数签名不变，只是搬家
- import 路径更新即可，不碰函数内部逻辑
- **不顺手改角色数值或 UI 样式**

---

## 第 3 步：拆分 `chains.js`（851 行 → 数据 + 逻辑分离）

> **当前问题**：`CHAIN_BATTLE_EFFECTS`（数据）和 `applyChainBonuses`（逻辑）在同一个文件里。每新增一个角色，这个文件就膨胀 30-50 行。

### 3.1 拆分方案

```
src/battle/chains.js           → 保留 applyChainBonuses / applyTeamAuras / getEnergyRefund 等逻辑
src/battle/chainEffects.js     → 纯数据：CHAIN_BATTLE_EFFECTS 对象（~700 行数据）
```

### 3.2 执行

1. 新建 `src/battle/chainEffects.js`
2. 把 `CHAIN_BATTLE_EFFECTS` 完整搬过去，`export const CHAIN_BATTLE_EFFECTS = { ... }`
3. `chains.js` 加一行 `import { CHAIN_BATTLE_EFFECTS } from './chainEffects.js';`
4. 验证 `npm run smoke` 通过

### 3.3 后续可做（不强求）

将 `chainEffects.js` 进一步拆成 `chainEffects/jiyan.js`、`chainEffects/shorekeeper.js` 等单文件，`index.js` 做合并导出。但优先级不高——当前 851 行拆成数据+逻辑两块已经足够。

---

## 第 4 步：解耦战斗引擎和日常系统

> **当前问题**：`ui/battle.js` → `daily/abyss.js` → `battle/combat.js` ← `ui/battle.js` 形成隐式双向依赖。

### 4.1 方案：统一战斗入口函数

在 [src/battle/combat.js](../../src/battle/combat.js) 中新增一个统一的工厂函数：

```js
// combat.js 新增导出
export function startEncounter(config) {
  // config: { team, enemies, dungeon, onWin, onLose, onRetreat, mode }
  return createBattle(config.team, config.enemies, { ... });
}
```

然后：

- `ui/battle.js` 不直接 import `createBattle`，改为 import `startEncounter`
- `daily/abyss.js` 的 `startAbyssFloor()` 不直接调 `createBattle`，改为调 `startEncounter`
- `daily/wastes.js` 同理

`startEncounter` 成为外部调用战斗的**唯一入口**，内部再调用 `createBattle`。

### 4.2 收益

- 改 `createBattle` 签名时不再需要改 3 个调用方
- 战斗入口可以统一加日志/结算/统计 hook

---

## 第 5 步：清理 window 全局桥接

> **当前问题**：`main.js` 把 `render`、`rerenderAll`、`pickVer`、`pickDate`、`exportSave`、`importSaveFile` 挂到 `window`。HTML 里有 `onclick="exportSave()"` 等内联事件。

### 5.1 方案

每处 `onclick` 改成 `addEventListener`：

| 当前 (HTML onclick) | 改为 (JS addEventListener) |
|---|---|
| `onclick="exportSave()"` | `document.getElementById('exportSaveBtn').onclick = exportSave` 在 main.js |
| `onclick="importSaveFile()"` | 同上 |
| `window.__pickVer(v)` | modal 内按钮用 `data-ver` + 事件委托 |
| `window.__pickDate()` | modal 内按钮直接 `onclick` 绑定到闭包（modal 是 JS 生成的） |
| `window.__render` | 只被 `exportSave` / `importSave` 触发，打包时内联 |

### 5.2 执行

1. HTML 里去掉 `onclick`，给按钮加 `id`
2. `main.js` 里对应位置加 `onclick` 绑定
3. `window.__xxx` 全部删除
4. `modal` 生成 HTML 里的 `onclick="window.__pickVer(...)"` 改为闭包绑定

### 5.3 收益

- `window` 不再被污染，模块边界清晰
- 为后续 TypeScript 迁移铺路（TS 不允许随意挂 `window`）

---

## 第 6 步：清理 scripts/ 目录

> **当前问题**：`scripts/` 有 20+ 个文件，其中很多是一次性数据清洗脚本。

### 6.1 分类

| 保留（有价值） | 归档（一次性但保留参考） | 可删除 |
|---|---|---|
| `smoke-combat.mjs` | `extract-chains.cjs` | `fix-titles-and-mechanics.cjs`（v2 已替代） |
| `check-balance.mjs` | `seconds-to-turns-v2.cjs` | `seconds-to-turns.cjs`（v2 已替代） |
| `build-single-html.mjs` | `strip-meta-notes-v2.cjs` | `strip-meta-notes.cjs`（v2 已替代） |
| `push.mjs` | `validate-titles-v2.cjs` | `validate-titles.cjs`（v2 已替代） |
| | `rewrite-clean-chains.cjs` | `fix-followup-syntax.cjs`（已合并入 rewrite） |
| | | `dedupe-terms.cjs`（一次性，已完成） |
| | | `patch-chains-effects.cjs`（一次性，已完成） |
| | | `add-missing-chains.cjs`（一次性，已完成） |
| | | `add-standard-chains.cjs`（一次性，已完成） |
| | | `add-visible-mechanics.cjs`（一次性，已完成） |
| | | `rewrite-followups.cjs`（已合并入 rewrite-clean-chains） |
| | | `wrap-followup-terms.cjs`（已合并入 rewrite-clean-chains） |

### 6.2 执行

```bash
mkdir -p scripts/_archive
# 把一次性脚本移进去（不删，保留参考价值）
git mv scripts/fix-titles-and-mechanics.cjs scripts/_archive/
# ... 依此类推
```

---

## 第 7 步：可选增强（不影响架构健康度，但提升开发体验）

### 7.1 添加 lint-staged + simple-git-hooks（可选）

```bash
npm install -D lint-staged simple-git-hooks
```

配置：提交前自动跑 `npm test`。不做代码格式化（项目没有 formatter），只跑测试。

### 7.2 添加 JSDoc 类型注释（可选）

不需要装 TypeScript。在关键函数上加 JSDoc 就能让 VSCode 提供类型提示：

```js
/**
 * @param {{ name: string, atk: number, chain: number }[]} team
 * @param {{ hp: number, def: number, weakness: string }[]} enemies
 * @returns {import('../types.js').BattleState}
 */
export function createBattle(team, enemies) { ... }
```

定义一个 `src/types.js` 作为纯粹的 JSDoc typedef 文件，不参与运行时。

---

## 优先级总结

| 步骤 | 预估工时 | 影响 | 风险 |
|---|---|---|---|
| 1. 测试框架 | 2-3h | 🔴 关键——没有测试就没有重构信心 | 低（加依赖，不改源码） |
| 2. 拆分 render.js | 2-3h | 🟡 重要——1086 行拆成 6 个 100-200 行文件 | 低（纯搬家） |
| 3. 拆分 chains.js | 0.5h | 🟡 重要——数据/逻辑分离 | 极低 |
| 4. 解耦战斗入口 | 0.5h | 🟢 改善——消除隐式双向依赖 | 低 |
| 5. 清理 window 桥接 | 0.5h | 🟢 改善——消除全局污染 | 低 |
| 6. 清理 scripts/ | 0.5h | 🟢 整洁——减少认知负担 | 极低 |
| 7. JSDoc / lint | 1-2h | 🔵 锦上添花——提升 DX | 极低 |

**建议执行顺序**：1 → 3 → 2 → 4 → 5 → 6（7 可选）

第 1 步（测试）先行，因为有了测试安全网，第 2-5 步的重构才能放心做。

---

## 验证命令

```bash
npm test              # 新增：跑全部测试
npm run build         # 确保构建不挂
npm run smoke         # 手工 smoke
npm run check:balance # 数值基准检查
```

## 重要约束（不变）

- 架构优化**不等于**角色数值调整
- 角色/武器/敌人机制变更必须先查 [docs/sources/](../../sources/) 并确认
- 拆分文件时不改函数内部逻辑，只搬家 + 更新 import 路径
- 如果拆分过程中发现疑似 bug，记录到 issue 列表，不顺手修
