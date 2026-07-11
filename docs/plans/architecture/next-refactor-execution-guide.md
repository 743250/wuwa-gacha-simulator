# 下一轮架构优化执行任务书

> 状态：待执行  
> 编写日期：2026-07-10  
> 适用对象：负责直接修改代码的 AI / 开发者  
> 核心原则：小步修改、每步可验证、业务行为零变化

## 1. 这份文档解决什么问题

当前项目已经完成第一轮架构迁移：主要 UI 已迁到 Preact，战斗引擎已经拆分，`commit()`、存档迁移、显式初始化和边界测试也已经建立。

下一轮不做“大重写”，只解决以下问题：

1. 工程门禁在 Windows 上不能稳定运行，TypeScript 检查目前不通过。
2. `src/state.js` 同时承担状态、DOM、Toast、日期和随机工具，职责过多。
3. `commit()` 反向依赖 UI Signals，状态层和 UI 层方向倒置。
4. `src/gacha/core.js` 同时做领域计算、修改全局状态和触发 UI 刷新，并参与循环依赖。
5. 战斗角色注册表与伤害模块存在循环依赖。
6. Preact 仍采用“全局版本号通知”，所有订阅组件会一起刷新。
7. 标准构建主包超过 600 KB，但单文件版仍有保留单包的合理需求。

本轮目标不是让目录看起来更漂亮，而是让依赖方向、测试门禁和状态写入规则真正可信。

## 2. 执行前必须遵守的铁律

### 2.1 禁止修改业务行为

本任务是纯架构优化，以下内容一律不得修改：

- 抽卡概率、软保底曲线、硬保底、大小保底规则。
- 卡池内容、角色和武器名单、版本时间表。
- 角色技能倍率、共鸣链效果、战斗公式、敌人数值。
- 商店价格、奖励数量、体力消耗、任务目标。
- 存档字段语义和已有迁移结果。
- 玩家可观察到的按钮流程、提示条件和抽卡动画结果。

如果测试、官方资料和当前代码不一致，只记录差异并报告用户，不得借架构优化之名修数值。

### 2.2 禁止危险操作

- 不得使用 `git reset --hard`、`git checkout -- <file>`、`git clean`。
- 不得覆盖、删除或回滚用户未提交的修改。
- 不得一次性批量格式化整个仓库。
- 不得无理由改文件编码、换行符、中文标点或引号风格。
- 不得把“暂时看不懂”的逻辑删掉。
- 未经用户要求，不要创建 commit、不要 push。

执行开始时，工作区已知可能存在以下未提交修改：

- `src/equip/actions.js`
- `src/gacha/core.js`
- `src/state.js`
- `src/ui/panels/gacha/StatsTab.tsx`
- `src/ui/panels/roleModal/LevelupTab.tsx`
- `.codex-tmp/`

实际执行时必须重新运行 `git status --short`，以当时输出为准。需要修改同一个文件时，先阅读 `git diff -- <file>`，在用户改动之上做最小补丁。

### 2.3 每阶段单独完成

必须严格按 Phase 0 → 1 → 2 → 3 → 4 → 5 的顺序执行。

每完成一个 Phase：

1. 运行该阶段指定的测试。
2. 运行 `git diff --check`。
3. 阅读 `git diff --stat` 和相关文件的完整 diff。
4. 确认没有业务数值变化。
5. 汇报结果后再进入下一阶段。

如果一个阶段无法通过验收，不要用跳过测试、删除测试、扩大白名单或降低 TypeScript 严格度来蒙混过关。

## 3. 目标依赖方向

最终依赖方向必须是：

```text
data / shared
      ↓
domain（gacha / battle / equip / daily）
      ↓
application actions（commit、持久化协调）
      ↓
ui（Preact、DOM、modal、toast、animation）
```

禁止出现以下反向依赖：

```text
state → ui
domain → ui
domain → document/window
domain → rerenderAll/modal/toast
```

允许 UI 调用领域 action；不允许领域核心主动调用 UI。

## 4. Phase 0：建立真实基线

### 4.1 先读这些文件

- `CLAUDE.md`
- `docs/plans/architecture/plan.md`
- `package.json`
- `tsconfig.json`
- `src/state.js`
- `src/state/commit.ts`
- `src/ui/signals.ts`
- `src/gacha/core.js`
- `src/gacha/actions.js`
- `src/save.js`
- `tests/lint/*.test.js`

### 4.2 运行并记录基线

PowerShell：

```powershell
git status --short
git diff --stat
npm test
npm run build
npx tsc --noEmit
$env:LINT_STRICT='1'; npx vitest run tests/lint/
```

截至本文编写时，已知基线为：

- `npm test`：42 个测试文件、567 个测试通过。
- `npm run build`：成功，但主业务 chunk 约 626 KB，有体积警告。
- `npx tsc --noEmit`：失败，当前有 9 个诊断。
- `npm run lint:strict`：Windows 上因为 POSIX 环境变量写法无法启动。
- 手动设置 `LINT_STRICT=1` 后，严格 lint 当前有 3 项失败。

实际数字可能随用户正在进行的修改变化，以执行时结果为准。

### 4.3 Phase 0 产出

不改代码，只提交一份基线报告，格式如下：

```text
工作区修改：...
普通测试：通过/失败，数量...
构建：通过/失败，警告...
TypeScript：错误数量和文件...
严格 lint：错误数量和文件...
本次将触碰的脏文件：...
```

## 5. Phase 1：修复工程门禁

本阶段只修测试、脚本和类型问题，不调整状态架构。

### 5.1 让 `lint:strict` 跨平台

问题：`package.json` 当前使用：

```json
"lint:strict": "LINT_STRICT=1 vitest run tests/lint/"
```

该语法不能在 Windows `cmd.exe` 中运行。

推荐实现：

1. 新建 `scripts/run-lint-strict.mjs`。
2. 使用 `node:child_process` 的 `spawnSync`。
3. 通过 `env: { ...process.env, LINT_STRICT: '1' }` 设置环境变量。
4. 用 `process.execPath` 执行 `node_modules/vitest/vitest.mjs`，避免 `npx.cmd` 与 shell 差异。
5. 子进程退出码必须原样返回。
6. 把 `package.json` 改成：

```json
"lint:strict": "node scripts/run-lint-strict.mjs"
```

不要为了一个环境变量额外引入体积无关的运行时依赖。若选择 `cross-env`，只能放在 `devDependencies`，并说明理由。

### 5.2 增加正式 TypeScript 检查命令

在 `package.json` 增加：

```json
"typecheck": "tsc --noEmit"
```

不要开启 `checkJs`，不要一次性开启 `strict`，本阶段只让当前配置真正通过。

对于 `.ts` 扩展名导入导致的 TS5097，优先在 `tsconfig.json` 增加：

```json
"allowImportingTsExtensions": true
```

因为项目已经是 `noEmit: true` 且由 Vite 负责打包，这是低风险修复。不要顺手批量改全仓 import 后缀。

### 5.3 修复剩余 TypeScript 错误

逐项修复，禁止使用以下逃避方式：

- `// @ts-ignore`
- `// @ts-nocheck`
- 把业务对象全部改成 `any`
- 把 `strict` 或其他现有检查关掉

已知错误区域：

- `src/ui/panels/bag/BagPanel.tsx`：联合返回值没有正确收窄。
- `src/ui/panels/dungeon/DungeonPanel.tsx`：算术操作数类型不明确。
- `src/ui/panels/gacha/RoleGrid.tsx`：排序值类型不明确。
- `src/ui/panels/podcast/PodcastPanel.tsx`：`buyShop` 未定义。

修复规则：

1. 先找到函数真实返回结构。
2. 为返回值补最小必要类型或用明确的属性判断收窄。
3. `buyShop` 必须确认正确 action 来源后再 import/替换，不能声明一个空函数骗过编译。
4. 每修一类错误运行对应 UI 测试。

### 5.4 修复严格 lint 自身的 Windows 路径问题

`tests/lint/boundary-gacha-no-dom.test.js` 的白名单使用正斜杠，但 Windows 文件路径是反斜杠。

正确修复：统一用 `node:path.relative(ROOT, f)` 得到相对路径，再把 `\` 规范化为 `/`。其他边界测试中同类 `replace(ROOT + '/', '')` 也应一起改成共享 helper，但不要扩大白名单。

建议在 `tests/lint/helpers.js` 增加：

```js
export function relativeSourcePath(root, file) {
  return relative(root, file).split(sep).join('/');
}
```

实际实现需要从 `node:path` 导入 `relative` 和 `sep`。三个边界测试统一调用它。

### 5.5 处理另外两项严格 lint

玩家文案中的 `→` 可以按现有铁律改为中文逗号、破折号或拆句。只改文案连接符，不改升级计算。

`src/data/chains/registry.ts` MD5 不一致属于高风险项：

1. 先确认 `git diff -- src/data/chains/registry.ts` 是否为空。
2. 查看最近修改该文件的提交，确认是已经获准的角色改动还是意外变化。
3. 不得直接修改角色数据来迎合旧 MD5。
4. 不得在来源不明时直接更新快照 MD5。
5. 无法确认时停止这一项并报告用户，由用户决定是否接受当前 registry 作为新基线。

这是本计划中唯一允许因缺少用户决定而暂停的门禁项。

### 5.6 Phase 1 验收

```powershell
npm test
npm run lint:strict
npm run typecheck
npm run build
git diff --check
```

验收标准：除共鸣链 MD5 等待用户确认的情况外，所有命令退出码必须为 0。

## 6. Phase 2：拆分状态基础设施，纠正依赖方向

本阶段不改变 `S` 的字段结构，不改变存档 JSON。

### 6.1 目标文件结构

```text
src/
  state.js                 # 只保留 state0、S、resetState
  state/
    commit.ts              # 写入入口
    version.ts             # stateVersion、bumpStateVersion
  shared/
    date.js                # DAY、fmt、date
    random.js              # pick
  ui/
    services/
      toast.ts             # msg 与 DOM toast 操作
    signals.ts             # useS 和 UI tab signals
```

### 6.2 拆分顺序

#### 步骤 A：移动纯工具

- 把 `DAY`、`fmt`、`date` 移到 `src/shared/date.js`。
- 把 `pick` 移到 `src/shared/random.js`。
- 更新所有调用方 import。
- 暂时允许 `state.js` re-export 这些纯工具作为兼容层，但新代码不得再从 `state.js` 导入它们。

完成后用 `rg` 检查：

```powershell
rg "DAY|fmt|date|pick" src
```

逐条确认 import 来源。不要对普通变量名做盲目全局替换。

#### 步骤 B：移动 UI 工具

- 把 `$` 和 `msg` 移出 `state.js`。
- `$` 如果调用点很少，直接在 UI 内用 `document.getElementById`，无需保留全局缩写。
- `msg` 移到 `src/ui/services/toast.ts`。
- 领域核心不得 import Toast。领域 action 应返回错误代码或结果，由 UI 决定显示什么文案。

不要让 `state.js` re-export `msg`，否则会形成 `state → ui` 反向依赖。

#### 步骤 C：移动状态版本 Signal

- 新建 `src/state/version.ts`。
- 将 `stateVersion` 与 `bumpStateVersion()` 从 `src/ui/signals.ts` 移到这里。
- `src/state/commit.ts` 改为依赖 `./version.ts`。
- `src/ui/signals.ts` 从 `state/version.ts` 导入版本 signal，并继续提供 `useS()`。
- `viewSignal / aTabSignal / bTabSignal` 仍留在 UI，因为它们是 UI 导航状态。

完成后必须满足：

```text
state/commit.ts 不 import src/ui/**
state.js 不 import src/ui/**
```

#### 步骤 D：处理动画状态

`animating / setAnimating` 属于抽卡 UI 交互状态，不属于可持久化游戏状态。将其移动到抽卡 UI controller 或独立 UI signal。

要求：

- 不写入存档。
- 不挂到 `window`。
- `tryPull / doPullN / toFive` 的防重复点击行为不变。

### 6.3 `commit()` 的语义边界

本阶段保留现有“原地修改 S”的方式，不实现不可变 Store，也不引入 Redux。

但要补充文档说明：当前 `commit()` 不是数据库事务。mutator 如果先修改状态再抛错，已经发生的原地修改不会自动回滚。

禁止声称它具有原子回滚能力。可以增加对应测试记录真实语义，但本阶段不要用深拷贝重写所有 commit。

### 6.4 Phase 2 新增边界测试

新增或扩展 lint 测试：

1. `src/state/**` 不得 import `src/ui/**`。
2. `src/state.js` 不得出现 `document`、`window`。
3. `src/shared/**` 不得 import `state`、`ui` 或访问 DOM。

错误信息必须像现有 lint 一样说明“为什么不允许”和“如何修复”。

### 6.5 Phase 2 验收

除完整门禁外，还要运行：

```powershell
rg -n "document\.|window\." src/state.js src/state src/shared
rg -n "from ['\"].*ui" src/state.js src/state
```

两条搜索应无有效违规。

存档回归要求：

- `state0()` 返回字段不减少。
- `SAVE_VERSION` 不变。
- 本阶段不新增 migration。
- 旧存档测试全部通过。

## 7. Phase 3：收纯抽卡领域层

这是本轮最重要、风险最高的阶段。必须拆成 3 个小步骤，禁止一次重写整个 `gacha/core.js`。

### 7.1 最终职责划分

```text
src/gacha/rateConfig.js       # 概率常量
src/gacha/core.js             # 纯计算/领域状态转换，无 UI
src/gacha/actions.js          # commit、资源扣除、批量抽取的应用动作
src/ui/panels/gacha/          # modal、toast、动画、用户交互
```

`src/gacha/core.js` 最终不得依赖：

- `rerender.js`
- `modal.js`
- `ui/**`
- `document` / `window`
- Toast `msg`
- `commit()`

### 7.2 步骤 A：消除查询函数的隐式写入

当前 `cur()` 在没有有效选择时会直接写 `S.selected`。改成以下规则：

- 查询函数只返回当前 banner 或 fallback banner，不修改状态。
- “修正 selected”由显式 action 完成，例如 `ensureSelectedBanner()`。
- 应用初始化、日期切换和卡池切换后调用该 action。

必须补测试：调用查询函数前后，传入状态完全不变。

### 7.3 步骤 B：移走 UI 副作用

- `selectTarget()` 和 `upgrade()` 不得在 core 内调用 `rerenderAll()`。
- action 完成 `commit()` 后，Signal 自己通知 Preact。
- 若旧字符串 UI 仍需要 `render()`，只允许 UI/controller 暂时调用兼容刷新函数，并写明待迁移原因。
- 抽卡动画 `animation.js` 移到 `src/ui/panels/gacha/` 或 `src/ui/gacha/`。

移动文件后必须更新边界测试，删除历史白名单，不能保留两个 animation 实现。

### 7.4 步骤 C：显式传入状态和随机源

把单次抽卡的核心转换为可测试接口。推荐形态：

```js
export function pullOne(state, banner, pool, rng = Math.random) {
  // 允许原地修改传入的 state
  // 不读取全局 S
  // 不保存、不刷新、不弹窗
  // 返回抽卡结果或明确失败结果
}
```

重要要求：

- 不要求本阶段返回全新不可变 state；允许修改调用方传入对象。
- 所有随机判断必须来自传入的 `rng`。
- `pick()` 必须能使用同一个随机源，不能一部分用注入 RNG、一部分继续 `Math.random()`。
- 十连应由 action 在一次 `commit()` 中循环调用 `pullOne()`。
- 一次十连只触发一次状态通知和一次保存调度。
- 资源不足时不得产生部分状态修改，除非现有行为明确允许部分抽取。

不要改变随机调用顺序。随机调用次数或顺序变化会使固定随机序列测试结果改变，即使表面概率相同，也属于行为变化。

### 7.5 抽卡测试要求

必须覆盖：

- 65 抽前基础概率。
- 软保底各拐点。
- 80 抽硬保底。
- 角色池小保底失败后大保底。
- 武器池规则。
- 四星十抽保底。
- 新手池十连八折与 50 抽关闭。
- 新旅池第一次抽取后启动 30 天计时。
- 波纹优先、星声补足、资源不足。
- 单抽和十连的 `total/pity/p4/log/珊瑚` 状态变化。
- 注入固定 RNG 后结果完全可重复。
- 查询 banner 不修改 state。

### 7.6 Phase 3 边界测试

把现有 “gacha 不访问 DOM” 加强为：

- `src/gacha/core.js` 不得 import `state.js`、`commit`、`rerender`、`modal`、`ui`。
- 整个 `src/gacha/**` 不得访问 DOM。
- 如果 `actions.js` 暂时仍依赖 modal，先把交互协调器移到 UI，再启用严格规则，不得永久白名单。

## 8. Phase 4：解除战斗循环依赖

已知重点循环：

```text
battle/characters/aogusita.js
→ battle/combat/damage.js
→ battle/characters/index.js
→ battle/characters/aogusita.js
```

### 8.1 先查清责任，不要直接搬文件

执行者必须先列出三条边分别因哪个 import 产生、调用了什么函数，再决定切断哪一条。

推荐方向：

- `damage.js` 只计算/结算通用伤害。
- 角色专属 hook 由更上层的 combat orchestration 在伤害结算前后调用。
- 通用底层模块不反向 import 角色总注册表。
- 角色模块可以使用稳定的通用伤害 helper，但 helper 不得再 import 角色模块。

换句话说，优先切断 `damage.js → characters/index.js`，通过上层调用、callback 或 battle context 注入 hook。

### 8.2 禁止的“修复”方式

- 不得把 import 改成运行时 `await import()` 来隐藏循环。
- 不得把函数复制两份。
- 不得把所有东西合并回 `combat.js`。
- 不得用全局 `window` 注册 hook。
- 不得改变任何角色触发时机、伤害次数或日志顺序。

### 8.3 战斗验收重点

```powershell
npx vitest run tests/battle/
npm run smoke
npm run check:balance
```

同时比较战斗快照。任何快照变化都必须先解释原因；架构重构默认不接受数值快照变化。

建议新增一个轻量依赖环检测脚本或测试，只覆盖 `src/battle` 和 `src/gacha` 的运行时 import。`import type` 形成的类型环可以单独报告，不与运行时环混为一谈。

## 9. Phase 5：响应粒度与构建体积

本阶段优先级最低。Phase 1–4 没有全部稳定前不得开始。

### 9.1 不要立刻引入大型状态库

暂不引入 Redux、MobX、Zustand。先在现有 Signals 上按领域增加版本号：

```text
gachaVersion
inventoryVersion
battleVersion
dailyVersion
```

`commit()` 增加可选的领域标识，但默认行为仍兼容旧调用方。例如：

```ts
commit(mutator, { domain: 'gacha' })
```

注意：只有在调用点逐一确认后才添加 domain。不能根据文件路径自动猜，因为一次 action 可能同时修改抽卡、电台任务和背包状态。

更稳妥的第一步是先收集渲染性能数据；如果当前 UI 没有明显卡顿，可以只记录方案，不实现领域版本号。

### 9.2 标准版懒加载，单文件版保持兼容

构建优化目标：

- 普通 `npm run build` 对战斗、角色详情等重模块使用动态 import。
- `npm run build:single` 仍能生成可离线打开的单文件版。
- 不为了消除 600 KB 警告随意提高 `chunkSizeWarningLimit`。

优先候选：

- 战斗面板及战斗角色注册表。
- 大型角色共鸣链 registry。
- 非首屏的背包、深塔、海墟面板。

动态 import 前必须确认初始化顺序和 Preact 挂载点。不要同时做 UI 根节点大迁移。

### 9.3 AppShell 后续策略

当前多个 Preact 根挂载在静态 HTML 节点上，属于可接受的迁移中间态。本轮不强制统一为单根应用。

只有同时满足以下条件时才继续统一根节点：

- 状态写入已经收口。
- 子 tab 已经由 Preact 控制。
- 面板卸载不会丢失必要的局部状态。
- 有 UI 测试覆盖视图切换、弹窗和存档管理。

## 10. 完整验收清单

每个 Phase 完成后跑相关子集；全部完成后必须运行：

```powershell
npm test
npm run lint:strict
npm run typecheck
npm run build
npm run build:single
npm run smoke
npm run check:balance
git diff --check
git status --short
```

人工检查：

- [ ] 单抽、十连、抽到五星可用。
- [ ] 保底计数和抽卡日志正常。
- [ ] 卡池切换、日期推进、版本跳转正常。
- [ ] 角色升级、武器升级、声骸操作正常。
- [ ] 编队后可进入战斗并完成结算。
- [ ] 存档可保存、刷新后恢复、导入和导出正常。
- [ ] 普通构建和单文件构建都能打开。
- [ ] 没有角色数值、抽卡概率或奖励变化。
- [ ] 没有新增 `window.xxx` 桥接。
- [ ] 没有新增领域层到 UI 层的 import。
- [ ] 没有通过扩大白名单隐藏违规。

## 11. 执行者每阶段汇报模板

```markdown
## Phase N 完成报告

### 修改内容
- 文件：...
- 原因：...
- 行为是否变化：否

### 依赖变化
- 删除：A → B
- 新增：C → D
- 剩余临时兼容：...

### 验证
- npm test：...
- npm run lint:strict：...
- npm run typecheck：...
- npm run build：...
- 阶段专项测试：...

### 风险与未完成项
- ...

### 用户现有修改保护
- 修改前已阅读哪些 git diff：...
- 是否与用户改动重叠：...
```

## 12. 最终完成定义

只有同时满足以下条件，才能声称“本轮架构优化完成”：

1. 所有工程门禁可以在 Windows 直接运行并通过。
2. TypeScript 检查不再是仓库外的手工命令，而是正式 npm script。
3. 状态层不依赖 UI，`state.js` 不访问 DOM。
4. 抽卡核心不负责 Toast、弹窗、动画或重渲染。
5. 抽卡随机源可以注入，固定随机序列结果可重复。
6. 已知 gacha 和 battle 运行时循环依赖解除。
7. 存档结构、抽卡概率和战斗数值没有变化。
8. 普通版和单文件版构建都通过。
9. 所有修改都经过 diff 审查，没有覆盖用户未提交内容。

如果只完成部分 Phase，必须明确写“完成 Phase 1–N”，不能笼统声称整个架构优化已经完成。
