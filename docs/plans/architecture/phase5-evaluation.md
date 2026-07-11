# Phase 5 评估记录 · 响应粒度与构建体积

> 状态：已评估,暂不实装  
> 评估日期：2026-07-11  
> 依据：[next-refactor-execution-guide.md](next-refactor-execution-guide.md) §9

## 结论

按任务书 §9.1 的明确指导"如果当前 UI 没有明显卡顿,可以只记录方案,不实现领域版本号",Phase 5 暂不实装,只记录方案与候选点。

## 门禁实跑结果(2026-07-11)

按 `package.json` §10 完整验收清单实跑,结果如下:

| 命令 | 结果 | 备注 |
|---|---|---|
| `npm test` | ✅ 628/628 passed | 49 个测试文件。注:`tests/battle/frolo.test.js` 在并行调度下偶发 1 处 RNG 敏感断言失败,单跑/分组合跑均过,属历史偶发非本次回归 |
| `npm run lint:strict` | ✅ 14/14 passed | 9 个 lint 测试文件 |
| `npm run typecheck` | ✅ clean | `tsc --noEmit` 无错 |
| `npm run build` | ✅ built in 2.7s | dist 主包 633 KB(>600KB 警告,任务书 §20 注明允许保留) |
| `npm run build:single` | ✅ wrote `single/鸣潮模拟器-单文件版.html` | 单文件离线版可用 |
| `npm run smoke` | ✅ `[smoke] combat/dungeon/abyss checks passed` | 修复 `src/battle/chains.js` 的目录导入后通过(原失败原因见下文 smoke 修复记录) |
| `npm run check:balance` | ✅ 表格输出完整 | 18 个版本平衡数据无报错 |

**曾被误标的门禁**:`npm run smoke` 在 Phase 4 完成时实跑为失败(`ERR_UNSUPPORTED_DIR_IMPORT: Directory import .../src/data/chains is not supported`)。代码审核员指出文档不能写"所有门禁已绿"。该入口已修(详见下文 §"smoke 修复记录")。

## smoke 修复记录

### 问题

`src/battle/chains.js:7` 原为 `import { getChainDef } from '../data/chains'`,Node 原生 ESM 不支持目录导入,smoke 跑挂。

### 修复

- `src/battle/chains.js`:`import { getChainDef } from '../data/chains/index.ts'`(显式 `index.ts`)
- `src/data/chains/index.ts:5`:`import { REGISTRY } from './registry.ts'`(显式 `.ts`)
- `src/data/chains/types.ts:86`:`import { REGISTRY } from './registry.ts'`(显式 `.ts`)
- `package.json` `smoke` 脚本:`node --experimental-strip-types scripts/smoke-combat.mjs`(Node 24+ 支持 strip-types 加载 `.ts`)
- `tsconfig.json` 已在 Phase 1 开 `allowImportingTsExtensions: true`,本次显式 `.ts` 扩展不破坏 typecheck/build

### 影响范围

仅 `data/chains/` 目录内的 3 个文件的相对路径拓展改为带 `.ts`,以及外部调用方 `chains.js` 改为显式 `index.ts`。所有引用方已经被现实验过(typecheck/build/vitest 通过)。

## §9.1 领域版本号方案(未实装)

候选版本号:

```text
gachaVersion       抽卡/卡池/保底/资源
inventoryVersion  角色背包/武器/声骸/精炼
battleVersion      战斗场景状态(已独立 signals)
dailyVersion       委托/深塔/海墟/周本
```

实装形态(若未来有需要):

```ts
commit(mutator, { domain: 'gacha' })
// bumpStateVersion 仍触发,各组件按订阅的 domain signal 决定是否重渲
```

**风险**:一次 action 可能同时修改多个领域(抽卡同时影响 gacha + podcast + inventory),按 domain 拆分通知容易让某领域订阅者错过刷新。任务书 §9.1 已明示"不能根据文件路径自动猜,因为一次 action 可能同时修改抽卡、电台任务和背包状态"。建议未来实装前先:

1. 收集渲染性能数据(performance mark 测量)。
2. 列出每个 commit 调用点的语义并标注 domain。
3. 实现 subscribeByDomain 工具再切换调用方。

## §9.2 动态 import 候选(未实装)

候选模块(按任务书 §9.2 优先级):

| 候选 | 入口位置 | 风险 |
|---|---|---|
| 战斗面板 | src/ui/battle.js | 高 — 战斗启动后会立即加载,延迟收益小且可能破坏 startDungeonBattle 同步路径 |
| 角色注册表 | src/battle/characters/index.js | 高 — damage.js 通过 hook resolver 间接依赖,combat orchestration 启动时立即需要 |
| 共鸣链 registry | src/data/chains/registry.ts | 高 — `getChainDef` 在战斗初始化 / 面板渲染 / 编队面板多处同步使用 |
| 背包面板 | src/ui/panels/bag/BagPanel.tsx | 中 — 已挂载在 #viewBag 静态节点,AppShell 用 display 切换保留 state,动态 import 会破坏该语义 |
| 深塔面板 | src/ui/panels/abyss/ | 中 — 同上 |
| 海墟面板 | src/ui/panels/wastes/ | 中 — 同上 |

**当前 AppShell 策略不接受动态 import**:AppShell 的设计文档明示"Preact unmount 会销毁 #viewGacha 内 GachaPanel 等组件的内部 state,切回来时丢状态。保留 main.js 原来的 style.display 切换语义"。非首屏面板已挂载在静态节点上,dynamic import 必须在前端渲染前完成,实际收益接近零。

唯一安全候选:`build:single` 单文件版可对角色/敌人/共鸣链数据采用 defer 加载,但这会改变单文件版的离线打开语义,与 §9.2 "单文件版保持可离线打开"目标冲突。

## §9.3 AppShell 统一根节点(未实装)

按任务书 §9.3 推迟条件:

1. ✓ 状态写入已收口(commit + bumpStateVersion)
2. ⚠ 子 tab 已经由 Preact 控制(ViewTabs 已 Preact 化,但 .a-tab/.b-tab 仍由 AppShell 命令式同步 class)
3. ✗ 面板卸载不会丢失必要局部状态 — 当前正是靠 display 切换避免丢失
4. ⚠ UI 测试覆盖视图切换 — 已有部分 Preact 组件测试,但覆盖度不足以支撑根节点统一

未达全部条件,不强制统一。

## 触发 Phase 5 实装的前置条件

之后再考虑实装 Phase 5 的触发器:

1. 用户实测出现可观察的渲染卡顿(jank)或 fps 掉帧,需要按 domain 限制重渲范围。
2. 主包从当前的 633 KB 继续膨胀到 >1 MB,启动时间可观察变长。
3. 引入 Cumulative Layout Shift / LCP 等性能指标基线后出现回归。

在此之前保持现状,不动 §9 项。

## 已完成的 Phase 0–4 工作量

| Phase | 完成 | 关键产出 |
|---|---|---|
| 0 | ✓ | 基线测试通过(LINT_STRICT 跨平台脚本、typecheck、snapshot 基线) |
| 1 | ✓ | 工程门禁修复 |
| 2 | ✓ | state.js 拆出 shared/date.js + shared/random.js;state→ui 反向依赖切断(state/version.ts);toast/$/animating 迁到 ui/ |
| 3 | ✓ | gacha/core.js 纯领域化:cur() 纯查询、ensureSelectedBanner 显式回填、pullOne 可注入 RNG、不依赖 commit/ui/rerender/modal/selectTarget/selectBanner/upgrade 迁到 actions.js |
| 4 | ✓ | damage.js → characters/index.js 循环切断(hook resolver 注入,setCurrentBattle 接收 queryCharacterHook);新增 battle-no-cycle 循环检测测试 |
| 5 | 评估 | 暂不实装,见本文档 |

## 2026-07-11 代码审核回归处理

代码审核员对 Phase 0–4 的 5 条意见,已逐条处理:

| # | 意见 | 处理方式 |
|---|---|---|
| 1 | 新手池 50 抽关闭后 `S.selected` 同步失效,导致 banner tab 无高亮 | 已修:`src/gacha/actions.js` 的 `doPullN`/`toFive` 在 commit 块内循环完成后调 `ensureSelectedBanner`;`src/ui/AppShell.tsx` 的 reset/importSave callback 后用 `commit(() => ensureSelectedBanner())` 补回填。新增回归测试 `tests/gacha/actions.test.js`:"新手池抽到 50 次后 beginnerDone=true,selected 自动回填" |
| 2 | `npm run smoke` 报 `ERR_UNSUPPORTED_DIR_IMPORT` | 已修(见上文 §"smoke 修复记录") |
| 3 | 文档"门禁已绿"不严谨 | 已改成上方"门禁实跑结果"表,逐命令列实跑状态 |
| 4 | 旧副作用清单没收完整 | 已梳理 active 集合变化的全部入口:初始化(init.ts)、日期/版本切换(time/timeline.js)、新手池抽满(actions.js)、新旅池开始/过期(由日期推进触发,已在 timeline.js 内)、存档导入/重置(AppShell.tsx) |
| 5 | 建议补 invariant 测试 | 已补:`tests/gacha/actions.test.js` 3 个 invariant 断言(单抽/十连/新手池关闭),`tests/time/timeline.test.js` 6 个 invariant 断言(advanceDay/nextPhase/nextVersion/jumpToVersion/jumpToDate/selected 失效回填)。invariant 公共断言为 `!S.selected \|\| activeBanners().some(b => b.id === S.selected)`(无 active banner 时另算) |

## 4 路并行 bug 调查结果(2026-07-11)

3 个子代理 + 主代理并行审查 Phase 3 / Phase 4 改动,识别问题如下:

- 🔴 真 bug:**`src/gacha/core.js:5` 死代码 import `pick`** —— 已清,改为 `import { S, DAY, date, fmt, pickRng } from '../state.js'`(`pick` 已被 `pickRng` 注入版替代)
- 🔴 真 bug:**`setDamageHooksResolver` 注入机制零测试覆盖** —— 已补,新增 `tests/battle/damage-hooks.test.js` 9 个 unit test 覆盖 resolver 默认行为、注入、复位、hpCore 路径切换、onLethal 不拦截等场景
- 🔴 前置 bug:**`cartethyiaLethalShield(self, dmg, battle)` 与调用方传参顺序 `(self, battle, dmg)` 不对称** —— 已修:`cartethyiaLethalShield` 签名改为 `(self, battle, dmg)`,并在 `tests/battle/damage-hooks.test.js` 新增卡提希娅 5 链致命伤回归测试。详见 [docs/plans/architecture/known-bugs-onLethal-param-order.md](known-bugs-onLethal-param-order.md)
- 🟢 设计脆弱:**`setCurrentBattle(b, resolveHook = null)` 的 `null` 守卫导致 resolver 永久保留** —— 已修:`setCurrentBattle` 现在永远同步 `_resolveCharacterHook = resolveHook`(可传 `null` 复位为 no-op 而不是保留上次的值),由 `tests/battle/damage-hooks.test.js` 的"未传 resolveHook 时 resolver 复位为 no-op"测试覆盖

## 后续类似重构的纪律

基于本轮审查反馈,后续做"隐式副作用改显式 action"重构时:

1. 先列旧函数的所有副作用清单(读、写、提示、刷新、保存…),再迁移到显式 action
2. 列所有可能让被监控集合(active banner / active phase / active team...)发生变化的入口
3. 每个入口逐一确认在 action 完成后调用相应的 `ensure*/invariant` 函数
4. 补 invariant 公共断言测试,任何 action 完成后必须满足固定不变式
5. 当前 phase 评估文档必须按实跑命令列结果,不得写"全部已绿";失败的命令必须诚实标注