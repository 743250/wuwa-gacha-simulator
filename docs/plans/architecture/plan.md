# 架构优化计划

> 状态: 当前计划
> 更新: 2026-07-08
> 范围: 只优化代码组织、状态流、测试稳定性和构建结构；不改角色数值、战斗公式、抽卡概率、存档字段语义。
>
> 进度快照(2026-07-08): 全量测试通过 · `npm run lint:strict` 通过 · `npm run build` 干净。

## 进度总览

每个 Phase 标注最终落地形态。**完成** = 全部计划项落地;**部分完成** = 计划主目标达成但留有明确尾债;**延后** = 列入计划但本轮未做。

### ◑ 部分完成 · Phase 1 状态写入收口
- `src/state/commit.ts` 作为统一写入入口,30+ 写入点已迁。
- **本轮修正**:默认 `save:true`(安全优先),{save:false} 显式 opt-out;7 个单测覆盖默认保存/不吞异常/不推进版本/不保存 4 个语义。
- 高频写入(gacha/daily/dungeon/wastes/podcast/team)和角色/武器养成主路径已走 `commit()`。声骸养成仍是后续同类尾债。

### ◑ 部分完成 · Phase 2 应用壳组件化(第一小步 + 第二小步起步)
- **第一小步**:`src/ui/AppShell.tsx` headless 模式,useEffect 接管子 tab + 顶部按钮 + 存档管理 + 选版本 + tooltip + 弹窗点击外部关闭。
- **第二小步(本轮落地)**:顶层 `.view-tabs` 从 index.html 静态节点迁到 Preact 组件 `src/ui/panels/ViewTabs.tsx`,onClick 走 JSX、`.on` class 由 viewSignal 派生,AppShell 不再命令式 querySelectorAll('.vtab')。
- `main.js` 收敛到 22 行启动序列。GlobalLayer 合并 RoleModalManager + AppShell 到同一 Preact 树。
- **延后**:子 tab(.a-tab / .b-tab)、顶部时间线按钮、存档管理弹窗内容仍是 headless 接管的静态节点;后续小步逐个迁移。conditional render 全层面板本体不在计划内(style.display 切换避免 unmount 丢 state)。

### ✅ 完成 · Phase 3 显式初始化边界
- `src/init.ts` 收口 4 个 side-effect import。
- **本轮修正**:WEEKLY_BOSS 合入 DUNGEONS 的副作用从 `src/ui/panels/dungeon/actions.ts` 移到 `src/battle/dungeon.js` 的 `initDungeonMerge()`,init.ts 不再 import UI 层。battle 领域自包含。

### ✅ 完成 · Phase 4 ChainDef 收尾
- 删 `FALLBACK_CHAIN`(死代码,registry 覆盖 50 角色不可达),简化 `parseChainLine` 只走 ChainDef 路径。
- `FORTE_BOOST` 保留(非角色专属数值,搬家会触发铁律 2 MD5,不动)。

### ✅ 完成 · Phase 5 ResourceDef 深化(收口版)
- 补 4 个查询 API:`getRoleResources` / `getVisibleResources` / `formatResourceValue` / `getResourceTooltip`,9 个单测。
- **本轮修正**:`getResourceTooltip` 从返 HTML 字符串改为返结构化数据 `ResourceTooltipData`(name/kind/desc/effectType/effectMult),CSS `var(--muted)` 不再渗入 battle 层;UI 层负责渲染。
- 决策:不迁现有 UI 读取路径(unit.forte 已含定义,强行迁是重复信息)。

### ✅ 完成 · Phase 6 边界测试和 lint 分级
- 3 个边界测试(battle→ui / gacha→DOM / panels→save),`npm run lint:strict`(LINT_STRICT=1)用于 CI 阻断。
- **本轮修正**:补 commit 默认 save 行为的单测、tooltip 结构化数据的单测。

## 收尾修复(2026-07-08,基于两轮外部评审反馈)

### 第一轮评审 · 修复 7 项
- **测试稳定性**:`tests/battle/combat.integration.test.js` 的 "burst hits all enemies with split damage" 因 `Math.random()` 暴击判定不稳定(忌炎副目标暴击 200%×1.986≈397% 接近主目标未暴击 400%)。用 `vi.spyOn(Math,'random').mockReturnValue(0.5)` 固定种子。10 次跑 0 失败(基线 20-30% 失败率)。
- **lint:strict 违规**:`BasicTab.tsx:38` `buff`→`增益`、`BagPanel.tsx:55` `→`→` 到 `。
- **文档断链**:重建 `docs/plans/architecture/README.md` 作为入口。
- **root.tsx 重复 render**:新建 `src/ui/GlobalLayer.tsx` 合并 RoleModalManager + AppShell。
- **team/actions.ts 纳入 commit**:3 处裸写改走 `commit()`。
- **单文件 dist 恢复**:`dist/鸣潮模拟器-单文件版.html` 被 emptyOutDir 清掉,重跑 `npm run build:single` 恢复。
- **plan.md 状态表述**:Phase 2 标注为"第一小步"。

### 第二轮评审 · 修复 3 项核心质量问题
- **commit() 默认不保存 → 改默认 save(安全优先)**:`commit(mutator)` 默认触发 `saveState()`,需要批量/频繁写入时显式 `{save:false}` opt-out。避免"改了状态忘保存"的回归路径。
- **AppShell 用 headless + DOM 操作伪装组件化 → 第二小步真组件化**:迁顶层 `.view-tabs` 到 `<ViewTabs/>`,JSX onClick 取代 querySelectorAll。子 tab 仍 headless(待后续小步),但 Phase 2 不再是"完全没真组件"。
- **ResourceDef 在 battle 层返回 HTML tooltip → 改返结构化数据**:battle 层不产 HTML/CSS,UI 层渲染。消除 `var(--muted)` 主题变量渗入领域层。

### 第二轮评审 · 收口剩余裸写 S
- `GachaBanner.tsx` 切卡池:`S_RAW.selected = x.id; bumpStateVersion()` → `selectBanner(x.id)`(新 action,走 commit)。
- `LogTab.tsx` 清空记录:`S_RAW.log = []; bumpStateVersion()` → `clearLog()`(新 action,走 commit)。

## 待办尾债(本轮不在范围内,后续单独立项)

- **声骸养成写入收口**:`src/equip/echoActions.js` 仍有直接写 `S` 的对外动作，后续应按角色/武器 action 模式接入 `commit()`。
- **子 tab 真组件化**:`.a-tab` / `.b-tab` 仍 headless 接管。模式参考顶层 ViewTabs 迁移。
- **顶部时间线 + 存档管理 + 选版本弹窗内容** 真组件化:目前按钮本体已 Preact 可控,但弹窗内容仍是字符串 HTML。
- **buff / side-effect 资源统一注册**:守岸人星域、长离焰羽、弗洛洛乐声/余响未进 RESOURCE_REGISTRY。
- **dist git 跟踪(本轮已修复)**:`npm run build:single` 输出从 `dist/` 改到 `single/` 目录,`npm run build` 的 emptyOutDir 不再碰单文件版。`single/鸣潮模拟器-单文件版.html` 在 git tracked,`single/index.html` + `single/assets/` 通过 `single/*` + 白名单规则忽略。

## 当前基线

项目已经完成上一轮大迁移:

- UI 已从 `innerHTML + window.__` 主路径迁到 Preact,组件集中在 `src/ui/panels/`。
- `src/ui2/` 已不存在,旧 UI shim 大多已删除。
- `src/battle/combat.js` 已变成 26 行门面,真实逻辑拆到 `src/battle/combat/`。
- 共鸣链已集中到 `src/data/chains/registry.ts`,战斗和角色弹窗都通过 `getChainDef()` 读取。
- 资源统一视图已建立在 `src/battle/resources/`,新增 API 提供结构化查询入口(现有 UI 读取路径暂不迁,避免重复信息)。
- 仍保留全局可变状态 `S`,Preact 靠 `stateVersion` 粗粒度刷新;所有写入走 `commit()` 统一入口。

## 原则

1. 每个阶段都必须可单独合并、可回滚。
2. 架构改动不得顺手改角色强度、链效果、抽卡概率或存档结构。
3. 新代码优先 TypeScript,但不为改名而批量重写稳定 JS 文件。
4. 领域层不得依赖 DOM: `src/battle` / `src/gacha` / `src/equip` / `src/daily` 不应 import `src/ui` 或直接访问 `document/window`。
5. UI 只调用领域 action,不直接拼复杂业务状态。
6. 每步结束至少跑 `npm test`、`npm run build`;涉及 UI 壳或交互时再跑 dev server 点验。

## Phase 1:状态写入收口

目标: 保留现有 `S` 对象和存档格式,但让新增和高频写入都经过统一入口,避免"改了状态但忘记刷新/保存"。

### 具体做法

1. 新建 `src/state/commit.ts`:
   - 导出 `commit(mutator, options?)`。
   - `mutator` 接收当前 `S`,内部允许原地修改。
   - `commit` 统一调用 `bumpStateVersion()`。
   - 默认立即保存;批量/频繁写入路径用 `commit(..., { save: false })` opt-out。

2. 先迁 3 类低风险写入:
   - 顶部时间推进和版本切换。
   - gacha 抽卡资源扣减和日志追加。
   - daily / dungeon / wastes / podcast 的领取、消耗、计数写入。

3. 为 `commit` 加轻量测试:
   - mutator 会改变 `S`。
   - 每次 commit 都推进 `stateVersion`。
   - mutator 抛错时不吞异常。
   - 默认调用 saveState;{save:false} 不保存。

4. 加一条提醒型 lint:
   - 在 `src/ui/panels/**` 中直接写 `S.xxx =`、`S.xxx.push`、`S.xxx.splice` 时提示迁到 action/commit。
   - 初期只警告,不阻断。

### 验收

- `npm test` 通过。
- `npm run build` 通过。
- 至少 gacha、daily、dungeon 三条路径不再由组件直接写复杂状态。
- 存档 JSON 字段不变化。

## Phase 2:应用壳组件化

目标: 把 `main.js` 从"半个应用"瘦成 bootstrap,视图切换、顶部按钮、存档管理入口和 tooltip 交给 Preact 管。

### 具体做法

1. 新建 `src/ui/AppShell.tsx`:
   - 负责顶层 view 切换: gacha / adventure / bag / storage。
   - 负责 adventure 子 tab: team / daily / dungeon / abyss / wastes。
   - 负责 bag 子 tab: podcast / shop。
   - 负责顶部日期、资源入口、重置、存档管理按钮。

2. 调整 `src/ui/root.tsx`:
   - 从多个 `mountPanel(id, Component)` 逐步收敛为挂一个 `AppShell`。
   - 第一小步只把 tab 状态迁进 AppShell,面板仍挂旧 DOM 节点。
   - 第二小步把静态 tab DOM 迁到真 Preact 组件(顶层 ViewTabs 已完成,子 tab 待续)。

3. 拆出 UI services:
   - `src/ui/services/modal.tsx`: 统一 `openModal` 的 string body / VNode body 行为。
   - `src/ui/services/tooltip.tsx`: 取代 `main.js` 里的 body mouseover 逻辑。
   - `src/ui/services/saveDialog.tsx`: 存档管理弹窗从 `main.js` 移出。

4. `main.js` 最终只保留:
   - import 必要初始化模块。
   - `await loadState()`。
   - `resetDailyIfNeeded()`。
   - `mountPreactRoot()`。

### 验收

- `main.js` 控制在 60 行以内。
- `main.js` 不再直接 `querySelectorAll('.vtab')`、`querySelectorAll('.a-tab')`、`querySelectorAll('.b-tab')`。
- 顶层视图切换、子 tab 切换、重置、存档管理都有 UI 测试或明确手测 checklist。
- `npm test`、`npm run build` 通过。

## Phase 3:显式初始化边界

目标: 把"导入即注册"改成可读的初始化流程,让模块依赖更容易查。

### 具体做法

1. 建 `src/init.ts`:
   - `initBattleResources()` 注册资源统一视图。
   - `initDungeonMerge()` 合入 weekly boss 数据(放在 battle 领域,不靠 UI 层 side-effect)。
   - `initBattleUiBridge()` 注册战斗 overlay 所需桥接。
   - `initExchange()` 注册海市兑换弹窗能力。

2. 把当前 side-effect import 改成显式函数:
   - `import './battle/resources/index'` 改为 `initBattleResources()`。
   - `import './ui/panels/dungeon/actions'` 改为 `initDungeonMerge()`(数据合入移到领域层)。
   - `import './ui/battle.js'` 评估是否只剩 bridge,能删则删,不能删就显式初始化。
   - `import './exchange/coral.js'` 若只是提供函数,改成正常 export。

3. 在测试里直接调用需要的 init,避免靠入口副作用污染所有测试。

### 验收

- `main.js` 顶部没有业务 side-effect import。
- `src/init.ts` 是唯一应用级初始化清单,且不 import UI 层。
- 单测仍能按需 import 领域模块,不强制拉起 UI。

## Phase 4:ChainDef 收尾

目标: 让共鸣链单结构成为唯一运行时来源,清掉旧 fallback 和重复数据。

### 具体做法

1. 确认 `src/data/chains/registry.ts` 覆盖当前所有可抽角色。
2. 把 `src/battle/chainEffects.js` 缩到只保留真正通用的 fallback 常量;如果 fallback 已无运行时入口,删除。
3. 简化 `src/battle/chains.js`:
   - `overrideToEffects()` 只从 `getChainDef()` 提取 effect。
   - 未找到角色时走明确错误或空数组,不要再隐式解析旧数据。
4. 把链数据生成脚本标注为维护工具:
   - 如果仍需要 codemod,放在 `scripts/` 并写清输入输出。
   - 如果 registry 改为手维,删掉对旧源的依赖说明。
5. 更新 lint 快照:
   - 锁 `registry.ts`,不再锁过时 `chainEffects.js`。

### 验收

- 角色链文案和战斗 effect 只需查 `src/data/chains/registry.ts`。
- `tests/battle/chains.test.js` 和链快照测试通过。
- bundle 不再因为保留旧链数据而重复增加。

## Phase 5:ResourceDef 从统一视图变成统一入口

目标: `RESOURCE_REGISTRY` 不只给未来用,而是成为角色资源显示、tooltip 和资源查询的标准 API。

### 具体做法

1. 给 `src/battle/resources/index.ts` 补 API:
   - `getRoleResources(roleName)`。
   - `getVisibleResources(unit)`。
   - `formatResourceValue(unit, resourceId)`。
   - `getResourceTooltip(resourceId)` —— 返回结构化数据,UI 层负责渲染 HTML。

2. 先迁 UI 读取:
   - `RoleModalContent` / `SkillTab` / `BattleView` 中展示 forte、stack、form 的地方改读 resource API。
   - 不改战斗计算,只改展示来源。

3. 再迁战斗辅助查询:
   - 对已经在 `forte.js` / `stacks.js` / `forms.js` 注册的资源,新增代码只读 resource API。
   - 旧 `gainForte` / `gainStack` / `enterForm` 暂时保留,避免一次改动战斗状态机。

4. 最后补 buff / side-effect 资源:
   - 守岸人星域、长离焰羽、弗洛洛乐声/余响先只注册展示信息。
   - 确认 UI 正常后,再考虑是否把战斗状态读写迁入统一实现。

### 验收

- 一个角色资源在 UI 中的名称、当前值、上限、tooltip 都来自 ResourceDef。
- 新增角色资源时不需要同时改多个 UI 文件。
- 战斗测试不因展示迁移发生数值变化。
- battle 层不返回 HTML/CSS 字符串,UI 层负责渲染。

## Phase 6:测试稳定性和 CI 约束

目标: 让架构优化有可靠反馈,避免"全量测试偶发失败"拖慢后续迁移。

### 具体做法

1. 加架构边界测试:
   - `src/battle/**` 不得 import `src/ui/**`。
   - `src/gacha/**` 不得访问 DOM。
   - `src/ui/panels/**` 不得直接 import `save.js`。

2. 把现有提醒型 lint 分级:
   - 默认仍提醒。
   - `LINT_STRICT=1 npm run lint` 在 CI 或发布前阻断。

3. 建立标准验证命令:
   - `npm test`
   - `npm run lint`
   - `npm run build`
   - UI 壳改动再手动跑 `npm run dev` 点验。

### 验收

- 全量 `npm test` 稳定通过。
- 架构边界违规能在测试中直接定位到文件。
- 后续新增领域模块不会意外依赖 UI。

## 推荐执行顺序

1. Phase 1 状态写入收口,为后续 UI 壳重构打地基。
2. Phase 2 应用壳组件化,清理 `main.js`。
3. Phase 3 显式初始化,让启动流程可读。
4. Phase 4 ChainDef 收尾,回收旧链数据。
5. Phase 5 ResourceDef 深化,减少新角色资源接入成本。
6. Phase 6 边界测试和 lint 分级持续补齐。

每个 Phase 拆成 1-3 个小 PR/commit。不要跨 Phase 大批量改文件名,除非当前阶段已经有测试保护。
