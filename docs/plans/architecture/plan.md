# 架构优化总规划

> **立项**:2026-07-03。基于全项目健康度评估,5 条**结构性问题**(不是战术债)被用户全部采纳,合并为一份可持续执行的总规划。
>
> ## 要解决的 5 个根问题
> 1. **combat.js 引擎-角色查询方向反了** —— 引擎问角色 20 个 gate,`queryCharacterHook` 30+ 处,combat.js 会随角色数线性膨胀
> 2. **项目已到框架规模但仍用 innerHTML + `onclick="window.__x()"`** —— 246 处 `window.__` + 93 处内联 onclick
> 3. **共鸣链在 4 处并写**(chainEffects / seq / skillHints / terms)—— CLAUDE.md 铁律 10 "逐字核对" 就是这个问题的补丁
> 4. **角色资源无统一模型** —— gauge / layer / buff / form / side-effect 5 种散写,forms/stacks 只覆盖 3/16
> 5. **约束靠 AI 记忆** —— CLAUDE.md 11 条铁律,换个会话就漂,未落到机器验证
>
> ## 关键决策(用户已选)
> - **UI 框架 = Preact + @preact/signals**(3KB + 1KB,React 心智,signals 解决跨渲染 UI 态)
> - **迁移策略 = Layer by layer**(每周一个面板,不停业务,可回滚)
> - **顺带 TypeScript**(JSDoc → .ts,一次到位)
> - **5 条根问题全采纳**,分 7 个 Stage 逐步解决,历时 4-6 个月

## 核心原则

1. **不改角色数值/公式/共鸣链效果** —— 本规划全程只重构"代码组织"
2. **每步结束都可跑**:`npm test` 464+ 全绿,`npm run build` 通过,dev server 能起
3. **每个 Stage 一个 commit** 或 一个 branch,可回滚
4. **UI 层重构必须开浏览器点验**(render 层无单测,机器验不了)
5. 官方资料 / 当前实装 / CLAUDE.md 冲突 → 记差异问用户,不擅自改

---

## Stage 1:UI 框架接入 + 双 mount(1 周 · 零风险)

### 目标

装 Preact + signals + TS + jsx-runtime,建立"新旧 UI 共存"骨架。**旧代码一行不动,只在旁边挂一个空的 Preact 根**。

### 步骤

1. **1.1 装依赖**
   ```bash
   npm i preact @preact/signals
   npm i -D typescript @preact/preset-vite vite-tsconfig-paths
   ```
   `preset-vite` 处理 JSX,不用 babel。

2. **1.2 配置 vite + tsconfig**
   - `vite.config.js` 加 `preset-vite`
   - `tsconfig.json` 建立(target ES2022,`allowJs: true`,strict off 起步)
   - `include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js"]`
   - `paths` 建立 `@/*` 别名指向 `src/*`(为将来重命名铺路)

3. **1.3 新建 preact 根挂载点**
   - `index.html` 在 `#app` 里加 `<div id="preact-root"></div>`
   - `src/ui2/root.tsx` 新建(`ui2/` 为新 UI 命名空间,旧 `ui/` 完全不动)
   - `src/main.js` 在旧 render 之后调 `mountPreactRoot()`——空组件占位
   - 打开浏览器:旧 UI 完全正常,Preact 根挂载但不渲染任何内容

4. **1.4 signals 桥**
   - `src/ui2/signals.ts` —— 暴露 `stateSignal`(用 `signal(S)`)。
   - 关键难题:`S` 是 mutable 全局单例,signals 需要不可变引用。
   - 方案:`src/save.js` 的 `saveState()` 触发一个 `stateVersion.value++`,组件读 `stateVersion`,间接订阅"整棵 S 变了"—— 粒度粗但零改动旧代码。
   - 后续 Stage 2/3 迁具体面板时,逐个建立细粒度 signal(如 `bagEchoCount = computed(() => S.echos.length)`)。

5. **1.5 测试基础设施**
   - `tests/ui2/` 目录建立,`@testing-library/preact` 装上
   - 一个 smoke test:`renders <root /> without error`

### 验收

- `npm test` 464+ 仍全绿
- `npm run build` 通过
- 浏览器打开:旧 UI 完全正常
- 新增文件:`src/ui2/root.tsx` / `src/ui2/signals.ts` / `tsconfig.json`
- 修改文件:`vite.config.js` / `index.html` / `src/main.js`(3 处)

### 不做

- 不迁任何面板(留给 Stage 2)
- 不删任何 window.__(留给 Stage 2-5)
- 不改 combat.js / chains.js 一个字节

---

## Stage 2:低耦合面板首迁 · bag 样板(1-2 周 · 中等风险)

### 目标

选一个**最独立、外部零依赖**的面板作为迁移样板,验证整套工作流,建立"迁移一个面板"的可复现流程。

### 候选面板(按迁移难度排序)

| 面板 | 迁移难度 | 侵入面 |
|---|---|---|
| **bag(仓库)** | ⭐ 低 | 只读 S.echos / S.materials,只写 S(升级/分解) |
| daily(委托) | ⭐ 低 | 只读 S.dailyCommissions,写 S(领取)|
| dungeon(副本) | ⭐⭐ 中 | 触发战斗 startEncounter |
| shop / exchange | ⭐⭐ 中 | 弹窗多,modal 生命周期 |
| podcast | ⭐⭐ 中 | `window.__podcast` 整对象挂载 |
| abyss / wastes | ⭐⭐⭐ 高 | 战斗 + 复杂状态 |
| roleModal | ⭐⭐⭐⭐ 高 | 27 render 子模块的最大子集 |
| battle UI | ⭐⭐⭐⭐ 高 | 生命周期 + setTimeout 异步 |

**决定:先迁 bag**。它是最独立的读写循环,不触发战斗,只碰声骸系统。做完后有完整"迁一个面板"的样板。

### 步骤(样板,后续 Stage 复用)

1. **2.1 建组件目录**
   ```
   src/ui2/panels/bag/
     index.tsx            ← 面板入口
     EchoGrid.tsx         ← 声骸网格
     EchoDetail.tsx       ← 声骸详情 modal
     MaterialList.tsx     ← 材料列表
     actions.ts           ← 副作用函数(升级/分解/装备)
   ```

2. **2.2 抽 actions.ts**
   - 从 `src/ui/bag/echoBagActions.js` 和 `bagMaterialActions.js` 提取**副作用函数**
   - 只保留业务逻辑(`upgradeEcho(id)`, `recycleEcho(id)` 等),不再挂 `window.__x`
   - 直接 export TS 函数,让新组件 import 用
   - **不删旧 js 文件**——旧 render/ 还在用,双系统并行

3. **2.3 写组件**
   - JSX 版本,读 signals,调 actions
   - modal 用 `preact/portals` 挂到 `#modal-root`(index.html 加一个)

4. **2.4 路由切换**
   - `src/main.js` 的 view 切换逻辑:当 view === 'bag' 时,清空旧 `#bag-container` innerHTML,在 preact-root 里渲染 `<BagPanel />`;切走时反过来
   - **关键**:允许两套 UI 在切换时共存但不同屏,不是同时渲染

5. **2.5 浏览器点验 checklist**
   - [ ] 声骸列表显示正确(count / 排序 / 筛选)
   - [ ] 装备/卸下声骸,角色面板同步
   - [ ] 升级 → 经验消耗正确,新副词条解锁
   - [ ] 分解 → 材料返还
   - [ ] 锁定/解锁
   - [ ] 喂料流程
   - [ ] 调谐(retune)
   - [ ] 从角色声骸 tab 打开 → 关闭后回到角色 tab
   - [ ] 存档后重新加载,状态一致

6. **2.6 记录样板**
   - 写 `docs/plans/architecture/migration-playbook.md`
   - "迁一个面板"的 7 步走 checklist
   - 后续 Stage 3-5 全部按这个 playbook 做

### 验收

- 用户在浏览器完整用一遍 bag 面板,所有 checklist 项通过
- `npm test` 464+ 全绿,再加 3-5 个 bag 组件的 preact-testing-library 测试
- 老 `src/ui/bag.js` 依然存在但**不再被 render.js import**,标注 `@deprecated`(Stage 6 统一删)

### 不做

- 不迁其他面板
- 不删任何旧 window.__
- 不动 combat / chains

---

## Stage 3:中等耦合面板批量迁(✅ 2026-07-03 完成)

**5 个独立面板一次并行迁完**(4 个子代理 + 主代理 daily):

1. **3.1 daily** ✅ —— 主代理做,验证 playbook
2. **3.2 dungeon** ✅ —— 子代理,含 `startEncounter` 触发
3. **3.3 abyss** ✅ —— 子代理,三塔 + 活力
4. **3.4 wastes** ✅ —— 子代理,积分制 + 信物
5. **3.5 podcast** ✅ —— 子代理,BP 双线

**shop + exchange 延到 Stage 4** —— 它们不是独立 `#paneXxx`,是 `src/ui/render.js` 的子模块(`renderShopPanel` / `renderExchangeList` 挂在共鸣视图内),迁法不同,需要先动 render.js。

### 落地数据

- `src/ui2/panels/` 6 个面板(bag + 5 新)
- 498 tests / 29 files / all green(比 Stage 2 的 473 多 25 个新 case)
- `npm run build` 通过,`npx tsc --noEmit` 零错
- Playbook 累积 12 条常见坑(shim 不能 import .ts / 组件不做副作用 / rolldown 需要 preact preset 等)

---

## Stage 4:combat.js 拆分(✅ 2026-07-03 完成)

**方向决策改变**:侦查(见 `2026-07-03 hook 分析`)后确认原"引擎方向反转 = ActionResolution 合并 hook"方案的收益/风险比不足 —— 迁 42.5% hook 只减 195 行,风险中高。用户拍板改为**纯拆文件**:行为不变,只切模块。

### 落地结果

**combat.js: 1403 → 26 行(纯 re-export 门面)** —— 拆成 7 个模块:

| 模块 | 行数 | 职责 |
|---|---|---|
| `combat/setup.js` | 148 | createBattle / startEncounter / getCombatTeamNames |
| `combat/damage.js` | 206 | calcDamage / dealDamage / 召唤物 + setCurrentBattle |
| `combat/helpers.js` | 105 | resolveActionCost / gainConcerto / reduceVibration / finishIfBattleEnded 等 |
| `combat/enemyAI.js` | 196 | enemyAttack / BOSS 机制 handlers(saws/laser/blast/grab/airstars) |
| `combat/actions.js` | 463 | canAttack/Skill/Heavy/Burst + doAttack/Skill/Heavy/Burst/Debris/Switch |
| `combat/turnEnd.js` | 280 | endTurn(敌方回合 + 清理 + 回合切换) |
| `combat/results.js` | 18 | evaluateStars / isWin / isLose |

### 验收结果

- combat.js 从 1403 → 26 行 ✅ 远超 <900 目标
- 每个子模块 <500 行 ✅
- 498/498 tests / npm run build ✓ / npx tsc --noEmit 零错
- 外部契约(daily/abyss/wastes/ui/battle/tests import from './combat.js')完全不变
- **角色数值/公式/共鸣链效果**一字未动(继承 CLAUDE.md 铁律)

### 未做:ActionResolution 合并(留 Stage 7 或未来)

侦查报告里 R 组 14 处 hook 的 ActionResolution 合并**未做**。理由:
1. 硬门槛(战斗测试 300+)风险高
2. 收益/风险不对称:14 处 hook 合并只减 80 行引擎代码
3. 现在 combat.js 已经 26 行,引擎/角色接触面已经清晰(通过 fireCharacterHook/queryCharacterHook)
4. Stage 7 做资源统一模型时会自然收敛部分 R 组 hook

### 拆文件学到的 3 个坑

1. **模块级单例状态(如 `_currentBattle`)必须由持有它的模块自己 setter/getter** —— 拆出去后其他模块通过 `setCurrentBattle(b)` 而不是直接赋值。忘了替换直接会 `ReferenceError`。
2. **`export {a} from './x'` + `import {a} from './x'` 双方都写** —— 让内部代码继续用 `a` 又保持外部 re-export 契约。别用 `_a` 别名。
3. **拆分前先跑一次基线** —— 我碰到一次 flaky frolo hecate 测试,不是拆分引起的,是 pool: forks 下的 race。二次跑就绿了。

---

## Stage 5:剩余 UI 迁移(✅ 2026-07-03 完成)

迁完最后两个大面板 —— roleModal + battle UI,整个 UI 层全部 Preact 化。

### 5.1 roleModal ✅

**11 个文件 · 855 行 tsx/js**:
- `RoleModal.tsx`(126) — lifecycle manager,用 `@preact/signals` 的 `effect()` 监听 `roleModalOpenSignal` 同步渲染到 `#modalBox`
- `RoleModalContent.tsx`(225) — 主入口,根据 `roleModalTabSignal` 派发到 6 个 tab
- `Shell.tsx`(62) — sidebar + 内容区外框
- 6 个 tab:`BasicTab` / `WeaponTab` / `EchoTab`(164 最大)/ `ChainTab` / `SkillTab` / `LevelupTab`
- `signals.js`(48) — 6 个 signal(open/name/tab/preview/echoSlot/renderTick) + ELEMENT_COLORS + TABS
- `renderBridge.js`(6) — 给老 .js 调用的桥

**关键设计**:用 `effect()` 而不是 `useEffect` —— effect 在���块加载时创建,signals 变化同步触发,绕开 preact render 异步时序问题。

### 5.2 battle UI ✅

**10 个文件 · 783 行 tsx/js/ts**:
- `BattleView.tsx`(59) — 主入口,通过 `battleVisibleSignal` 控制渲染
- `Header.tsx`(38) / `BuffStripe.tsx`(73) / `EnemyRow.tsx`(79) / `TeamRow.tsx`(196) / `ActionBar.tsx`(225) / `LogView.tsx`(24) / `ToastStack.tsx`(49)
- `battleSignals.js`(18) — 5 个 signal(currentBattle/visible/version/toasts/buffSnapshot)
- `helpers.ts`(22) — displayName + formatLogLine

**关键坑**:
- `currentBattleSignal` 的 Object.is 抑制 —— 单独用 `battleVersionSignal` bump 触发订阅
- signals 放 `.js` 文件让 shim 能 import(playbook 坑 #10)
- Preact `onClick` 不序列化为 HTML `onclick`,测试不能用 `[onclick]` 查询

### 落地数据

- 513/513 tests · 31 files · all green(比 Stage 4 多 15 个新 case)
- `npm run build` 通过 · `tsc --noEmit` 零错
- 274 战斗测试 0 受影响 —— 引擎层不动,只包 UI 壳
- JS bundle 585KB(比 Stage 4 微增 4KB)

---

## Stage 6:落约束到机器(✅ 2026-07-03 部分完成)

### 6.1 删旧 UI — ✅ 部分完成(2026-07-03)

**共鸣唤取主面板 + teambuilder + shop/exchange 已迁 Preact**(Stage 6.1a/b),render.js 变 no-op。
**删了 20 个死代码文件**:
- 9 个 render/ 子模块(bannerArt/bannerTabs/exchangeList/logList/overview/pullPanel/shopBanner/shopPanel/waveList)
- 11 个 roleModal 链路(roleModalShell/roleModalBasicTab/roleModalEchoTab/roleModalChainTab/roleModalWeaponTab/roleModalLevelupTab/roleActions/roleList/standardRolePreview/echoPicker/weaponModal)

**保留的旧 UI shim**(挂 window.__ handler 给 Preact 用,不能删):
- `src/ui/bag.js` / `daily.js` / `dungeon.js` / `abyss.js` / `wastes.js` / `podcast.js` / `teambuilder.js` / `battle.js` —— action handler 注册
- `src/ui/render/roleModal.js` —— openRoleModal / __switchRoleTab / __activateChain 等
- `src/ui/render/` 7 个有业务函数的:rolePreview / skillBlock / skillHints / skillLines / weaponDetail / utils / roleModal

### 6.2 索引重建 — 未做

`src/ui2/` → `src/ui/` 改名依赖 shim 全删,留作后续。

### 6.3 落约束到机器 — ✅ 完成(提醒模式)

`tests/lint/` 4 个文件 · 5 个 case · `npm run lint`:

| 文件 | 铁律 | 验证方式 |
|---|---|---|
| `no-echo-skill-type.test.js` | #11 无声骸技能作为伤害类型 | grep `battle/`+`ui2/` 守卫范围;`dmgType` 字面量只允许 normal/skill/heavy/burst |
| `chain-effects-snapshot.test.js` | #2 已实装角色数值不动 | `chainEffects.js` MD5 锁定(`9d1f5d71...`),改动需更新快照 |
| `no-shorthand.test.js` | #8 玩家文案禁速记 | `ui2/` 字符串字面量里禁 `→`/`buff`/`debuff`/`core`/`叠层`/`爆发解放机`(战斗日志 helpers.ts 豁免) |
| `helpers.js` | — | `lintWarn()` 共用:违规打印理由 + 处理建议,**不阻断**;`LINT_STRICT=1` 变硬错(CI 用) |

**设计哲学**:lint 是**带理由的提醒**,不是阻断。
- 违规时打印"为什么不允许"+"如何处理",新任务看了提醒仍要做就做(在 commit/PR 说明原因)
- 默认 pass,不阻塞开发
- `LINT_STRICT=1 npm run lint` 变硬错,用于 CI 或主动严格检查

**附带清理**:`src/battle/stats.js` 注释里的"声骸技能伤害"改成"声骸套装伤害"(铁律 11 用词规范化)。
**附带修复**:`ActionBar.tsx` 玩家提示里的 `→` 改成中文逗号(铁律 8 真违规)。

### 落地数据

- 518/518 tests · 34 files · all green(比 Stage 5 多 5 个 lint case)
- `npm run lint` 单独可跑 · 0.5s
- `npm run build` ✓ · `tsc --noEmit` 零错

---

## Stage 7:共鸣链 + 资源单结构化(框架已建 2026-07-03 · 数据迁移需多会话)

**放在 Stage 6 后**,因为需要新 UI 稳定后再动数据结构。

### 7.0 框架已建 ✅

- `src/data/chains/types.ts` — `ChainDef` / `CharacterChains` 类型 + `MIGRATED_TO_CHAIN_DEF` 状态追踪
- `src/battle/resources/types.ts` — `ResourceDef` 联合类型(layer/gauge/buff/form)+ `RESOURCE_REGISTRY` + `MIGRATED_RESOURCES`
- `docs/plans/architecture/stage-7-migration-guide.md` — 逐角色迁移操作手册

**当前状态**:框架就位,数据迁移未开始(`MIGRATED_TO_CHAIN_DEF = []` / `MIGRATED_RESOURCES = []`)。

### 7.1 共鸣链单结构(根问题 #3)— 待做

现状:每条链在 4 处写(chainEffects/seq/skillHints/terms),CLAUDE.md 铁律 10 是"逐字核对"—— 证明这里易失同步。

**迁移规模**:84 角色 × 6 链 = 504 个 ChainDef 要填。按 [stage-7-migration-guide.md](stage-7-migration-guide.md) 分批:
1. 首批 10 角色(A 级,effect 字段最少)
2. 二批 30 角色(3-4 effect 字段)
3. 三批 20 角色(5+ effect 字段或 custom hook)
4. 末批 24 角色(S 级状态机,需核对 combat 路径)

**每角色 1 会话**,共需 ~4-6 个会话。

### 7.2 资源统一模型(根问题 #4)— 待做

现状:5 种散写(layer/gauge/buff/form/side-effect),forms/stacks 只覆盖 6/16 角色。

**迁移规模**:9 个核心资源(6 已注册 + 3 gauge + 1 side-effect 弗洛洛)。按 guide 分批:
1. 6 个已注册(最小风险,验证框架)
2. 3 个 gauge(椿/赞妮/今汐)
3. 2 个 buff(守岸人/长离焰羽)
4. 1 个 side-effect(弗洛洛,最复杂)

**每资源 1 会话**,共需 ~4 个会话。

### 7.3 验收(全部迁完时)

- `MIGRATED_TO_CHAIN_DEF.length === 84`
- `MIGRATED_RESOURCES.length >= 9`
- `chainEffects.js` / `seq.js` 变成 thin re-export
- `stacks.js` / `forms.js` 内部调 `registerResource`
- CLAUDE.md 铁律 10 可移除(单结构后自动同步)
- 全部测试绿

---

## 总体时间线

| Stage | 内容 | 工时 | 累计 | 风险 |
|---|---|---|---|---|
| 1 | UI 框架接入 + 双 mount | 1 周 | 1w | 极低 |
| 2 | 首迁 bag(样板) | 1-2 周 | 3w | 中 |
| 3 | 中等面板批量(5-6 个) | 2-3 周 | 5-6w | 中 |
| 4 | 引擎方向反转 | 2 周 | 7-8w | **高** |
| 5 | roleModal + battle UI | 2 周 | 9-10w | 高 |
| 6 | 清理旧 UI + 约束机器化 | 1 周 | 10-11w | 极低 |
| 7 | 共鸣链 + 资源单结构 | 3-4 周 | 13-15w | 中 |

**乐观 3-4 个月,现实 4-6 个月**。中途每周都可以停下来,项目始终可跑。

---

## 关键决策记录

| # | 决策 | 用户选择 | 备注 |
|---|---|---|---|
| 1 | UI 框架 | Preact + @preact/signals | 3KB,React 心智,signals 完美解决 UI 跨渲染态 |
| 2 | 迁移策略 | Layer by layer | 每周一面板,不停业务,可回滚 |
| 3 | TypeScript | 顺带迁 | 组件重写时天然要写类型,src/types.js JSDoc 一步到 .ts |
| 4 | 5 条结构性问题 | 全部采纳 | 覆盖 UI(#2)+ 引擎(#1)+ 数据(#3 #4)+ CI(#5) |

## 与既有代码的关系

历史 Phase 1-5 的**测试基础设施、hook 派发架构、注册表(characters/forms/stacks/switchHooks)、`startEncounter` 统一入口**都是本规划的地基,**不推倒**。存档字段命名统一独立于本规划(用户要求"存档不动",已搁置)。

## 起点基线(2026-07-03)

- 464 tests / 22 files / all green
- `vitest.config.js` 已 `pool: 'forks'`(模块单例隔离)
- combat.js 顶部 0 角色 import,`fireCharacterHook` 10 处 / `queryCharacterHook` 30+ 处
- `src/ui/render.js` 57 行 + `render/` 27 子模块
- 246 处 `window.__` + 93 处内联 onclick
- `src/gacha/rateConfig.js` / `src/types.js`(JSDoc)已建

---

## 重要约束(强化)

1. 架构优化**不改角色数值/公式/共鸣链效果** —— 全程只重构代码组织
2. 每个 Stage 结束都要:测试全绿 + build 通过 + 浏览器点验一遍
3. 每个组件重写只是"搬 JSX",不改业务逻辑或数值
4. **UI 迁移时严禁顺手改角色/战斗/存档** —— 发现 bug 记 issue,不修
5. 官方资料 / 当前实装 / CLAUDE.md 冲突 → 记差异问用户

## 验证命令(全 Stage 通用)

```bash
npm test              # 464+ 测试全绿
npm run build         # 构建不挂
npm run dev           # dev server 起来,浏览器点验
npm run smoke         # 战斗 smoke
npm run check:balance # 数值基准
```
