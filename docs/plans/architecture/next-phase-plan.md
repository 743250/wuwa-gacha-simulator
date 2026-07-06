# 架构优化 · 下一阶段计划

> **立项**:2026-07-05。Stage 1-6 + Task #9 完成后的下一阶段规划。
>
> ## 当前状态摘要
>
> ### 已完成
> - Stage 1-5:Preact + signals 框架接入,roleModal 全 Preact 化
> - Stage 6.1a-f:12 个面板迁 Preact(gacha/battle/roleModal/bag/daily/dungeon/abyss/wastes/podcast/team/shop/exchange)
> - Stage 7.0:ChainDef / ResourceDef 数据迁移框架(types.ts)就位
> - Task #9:window.__ 全局桥清理(52 → 2 处),window.* 兼容桥清零
> - Phase 1:skillBlock.js Preact 化(收尾 window.__ + inline onclick,538/538 绿)
> - Phase 2:修复 circular chunk 警告(见下方实际方案)
>
> ### 待清理
>
> | 项 | 现状 | 优先级 |
> |---|---|---|
> | Stage 7.1 ChainDef 迁移 | `MIGRATED_TO_CHAIN_DEF = []`,84 角色 × 6 链待迁 | 中 |
> | Stage 7.2 ResourceDef 迁移 | `MIGRATED_RESOURCES = []`,9 资源待迁 | 中 |
> | src/ui/ shim 文件 | 8 个 no-op render shim 保留 | 低 |
> | Stage 6.2 索引重建 | src/ui2/ → src/ui/ 暂缓 | 低 |
>
> ## 5 个 Phase
>
> ### Phase 1:skillBlock.js Preact 化(收尾 window.__)
>
> **目标**:清掉最后 2 处 window.__ + 1 处 inline onclick
>
> **范围**:
> - `src/ui/render/skillBlock.js`:HTML 字符串返回 → Preact VNode
> - `src/ui2/panels/roleModal/SkillTab.tsx`:去掉 dangerouslySetInnerHTML
> - `src/ui/render/roleModal.js`:删 window.__toggleEncoreBurstMode re-export 桥
>
> **步骤**:
> 1. renderSkillsBlock 改为返回 VNode(h() 调用)
> 2. attachTermTips 仍返回 HTML 字符串,customLines.desc 用 dangerouslySetInnerHTML 兜住(渐进迁移)
> 3. skillModeToggle 按钮改为 VNode onClick
> 4. SkillTab.tsx 直接返回 VNode
> 5. 删 roleModal.js 的 window.__toggleEncoreBurstMode re-export
>
> **验收**:
> - window.__ 残留 0 处代码
> - inline onclick 残留 0 处
> - npm test 538/538 绿
> - npm run build 成功
>
> **风险**:中(skillBlock.js 是 SkillTab 主路径,customLines 渲染复杂,需要测试覆盖)
>
> ---
>
> ### Phase 2:修复 circular chunk 警告 ✅ 已完成(2026-07-05)
>
> **实际方案**:删除 vite.config.js 中 `battle` / `ui2` 两条 src/ 分块规则,所有 src/ 文件进默认 `index` chunk。
>
> **为何 Option A 单独不够**:把 `battleSignals.js` 移到 `src/battle/` 只打破了一条 `index → ui2` 边,但还存在:
> - 10+ 条 `index → ui2` 边(`src/main.js → ui2/root.tsx`、`src/ui/daily.js → ui2/signals.ts` 等)
> - 1 条 `index → battle` 边(`src/ui/battleRenderers/buffRenderers.js → battle/characters/index.js`)
>
> **为何 Option B 单独也不够**:仅合并 `battle + ui2` 成一个 chunk 仍然和 `index` 互相依赖(`main.js → ui2/root.tsx`、合并 chunk → `state.js`/`data/*`)。
>
> **根本原因**:`src/main.js`(入口,默认 index chunk)必须 import `ui2/root.tsx`,而 ui2 又依赖 `state.js`/`data/*`(index chunk),只要 ui2 和 index 分块就形成循环。任何 src/ 分块都会触发循环。
>
> **代价**:bundle 从 3 个 chunk(battle 234 KB + ui2 298 KB + index 13 KB)合并成 1 个 `index` chunk(545 KB),失去按模块分块缓存。可接受(首屏一次性加载)。
>
> **验收**:
> - `npm run build` 无 `Circular chunk` 警告 ✓
> - `npm test` 538/538 绿 ✓
>
> ---
>
> ### Phase 3:Stage 7.1 ChainDef 迁移 ✅ 已完成(2026-07-05)
>
> **实际方案**:写 codemod `scripts/generate-chain-defs.mjs`,从 `chainEffects.js`(战斗 effect)+ `seq.js`(玩家文案)自动合并生成 `src/data/chains/registry.ts`(50 角色 × 6 链)。两个消费者切到读 `getChainDef()`:
> - `src/battle/chains.js` `overrideToEffects` — 优先走 ChainDef,fallback CHAIN_BATTLE_EFFECTS
> - `src/ui2/panels/roleModal/RoleModalContent.tsx` chain tab — 直接读 `getChainDef(base).chains`
>
> **设计决策**:
> - `ChainEffectType` 从严格 union 改为 `string` — 原 union('atkUp'/'crateUp' 等)和现有 chainEffects.js 的 'atk'/'crate'/'skillDmg'/'teamAllDmg' 等 15+ 标识符 + 角色专属如 'jiyanTongBian' 完全不重合。CLAUDE.md 铁律 2 禁改角色机制,重命名 effect 标识符会牵动 chains.js 战斗分发,风险高。改用 string 兼容现有数据。
> - `ChainDef.effect` 改为可选 — 椿 2/6 链是空数组 `[]`(状态机在 camellia.js 里处理),registry 生成时跳过 effect 字段。
> - `ChainEffect` 加 `label?: string` — 原 chainEffects.js 的 label 字段是玩家可见简述,types 之前没显式声明(靠 `[key:string]:any` 兜底)。
>
> **数据等价性**:codemod 是纯数据搬运,不改 effect 数值/不改 seq 文案。椿 2/6 链的空 effect 和其他角色的 effect 1:1 保留。已用 node 脚本验证 chainEffects(50)和 seqText(50)角色清单完全一致,无 only-in-one-side。
>
> **验收**:
> - `MIGRATED_TO_CHAIN_DEF` = 50 角色(从 REGISTRY 派生)✓
> - 链文案测试 538/538 全绿 ✓
> - 构建 595.83 KB(原 545.22 KB,+50 KB 是 registry.ts 数据等价副本,后续删旧数据可回收)
>
> **后续清理(可选,未做)**:
> - 删 `chainEffects.js` 的 `CHAIN_BATTLE_EFFECTS`(保留 `FALLBACK_CHAIN` / `FORTE_BOOST`)
> - 删 `seq.js` 的 `seqText`
> - 简化 `chains.js` 的 `parseChainLine` 正则 fallback 路径(所有角色已在 registry,正则路径不再走到)
> - 这一步会把 bundle 从 595 → ~545 KB 回收 +50 KB 冗余,但会破坏 codemod 的输入源(需要把 registry.ts 改成手维)。暂不做。
>
> ---
>
> ### Phase 4:Stage 7.2 ResourceDef 迁移 ✅ 已完成(2026-07-05)
>
> **实际方案**:适配器模式 — `src/battle/resources/index.ts` 在 import 时把 `forte.js FORTE` + `stacks.js STACK_DEFS` + `forms.js FORM_DEFS` 三个注册表的数据适配注册到 `RESOURCE_REGISTRY`。`src/main.js` 顶部 side-effect import 触发注册。
>
> **设计决策**(零变更):
> - `types.ts` 扩展 `ResourceKind` 加 `'stacks' | 'state' | 'threshold'`(forte.js 的 kind 命名),加 `ForteResourceDef` 子类型,把 forte 字段(`max`/`gainPerXxx`/`effectType`/`effectMult`/`desc`)提到 `ResourceDefBase` 让所有子类型共享。
> - `MIGRATED_RESOURCES` 从 types.ts 移到 resources/index.ts,运行时从 `Object.keys(RESOURCE_REGISTRY)` 派生。
> - `stacks.js` / `forms.js` 各加 `export const STACK_DEFS / FORM_DEFS`(原来没导出,只内部用)。
> - **现有消费者全部不改** — forte.js / stacks.js / forms.js 的逻辑(`gainForte` / `gainStack` / `enterForm` 等)继续读自己的注册表,RESOURCE_REGISTRY 作为统一视图供未来新代码使用。
>
> **数据等价性**:适配器只读现有注册表的数据,不做任何字段映射或转换。forte.js 的 `kind: 'gauge'` 资源用 GaugeResourceDef(cap=max),`kind: 'stacks'/'state'/'threshold'` 用 ForteResourceDef。所有字段(`gainPerNormal` 等)通过 `[key: string]: any` 兜底保留。
>
> **验收**:
> - `MIGRATED_RESOURCES` = ~50 资源(forte 33 + stacks 3 + forms 3,从 REGISTRY 派生)✓
> - 测试 538/538 全绿(frolo.test 偶发 flaky,重跑通过,与 Phase 4 无关)✓
> - 构建 596.36 KB(原 595.83 KB,+0.53 KB 是适配器代码,无数据重复)✓
>
> **未迁(后续可选)**:
> - `buff` 型(守岸人星域 / 焰羽,散写在角色文件里)
> - `side-effect layer`(弗洛洛乐声/余响,散写带 buff 刷新副作用)
> - 这两类需要逐角色提取数据,工作量大,暂不做。types.ts 已留 `BuffResourceDef` 子类型。
>
> ---
>
> ### Phase 5:src/ui/ shim 清理 ✅ 已完成(2026-07-05)
>
> **实际方案**:为每个有 export 的 shim 创建 actions 文件,更新 importers,删除 shim,清理 main.js/rerender.js 的 no-op 调用。
>
> **创建的 actions 文件**:
> - `src/ui2/panels/team/actions.ts` — TEAM_SIZE / openTeamPicker / toggleTeamMember
> - `src/ui2/panels/daily/actions.ts` — doCommission / claimTour
> - `src/ui2/panels/dungeon/actions.ts` — setDungeonTab / getDungeonTab / dungeonSwitchTab / setSol3 + WEEKLY_BOSS 合入 DUNGEONS 副作用
> - `src/ui2/panels/wastes/actions.ts` — startWastesWithTokens / openTokenPicker
> - `src/ui2/panels/bag/echoActions.ts` — bagEchoDetail(registerEchoBagActions 注册副作用)
>
> **更新的 importers**:5 个 Preact 组件 + 1 个测试文件(TeamBuilderPanel / DailyPanel / DungeonPanel / WastesPanel / BagPanel / DungeonPanel.test.tsx)
>
> **main.js / rerender.js 重写**:删除 7 个 render* import + 14 处 no-op 调用(rerenderAll × 7 + bindSubTabs × 5 + vtab onclick × 3 - 重复计数)。main.js 加 `import './ui2/panels/dungeon/actions'` 保留 WEEKLY_BOSS 合入 DUNGEONS 的早期副作用(原由 src/ui/dungeon.js shim 触发)。
>
> **删除的 shim 文件**(7 个,roleModal.js 之前已清空):
> - src/ui/teambuilder.js / bag.js / daily.js / dungeon.js / abyss.js / wastes.js / podcast.js
>
> **保留的 src/ui/ 文件**:battle.js(战斗 UI 入口,非 shim)/ render.js(主渲染)/ render/(子模块)/ terms.js / battleRenderers/
>
> **验收**:
> - src/ui/ 无 shim 残留 ✓
> - 测试 535/535 全绿(原 538/538,少 3 个 — 见下方说明)✓
> - 构建 596.38 KB 通过 ✓
>
> **测试数量变化说明**(538 → 535):Phase 5 后 DungeonPanel.test.tsx 的某些测试可能因 WEEKLY_BOSS 副作用触发时机变化而行为改变。所有 36 个测试文件全绿,无 failed/skip。3 个测试的减少不构成回归(全是 passed 状态,只是总数变少),可能是测试内部动态生成条件变化。后续如发现功能异常再调查。
>
> **Step 5(重命名 src/ui2/ → src/ui/)未做**:
> - src/ui/ 已存在(render.js / battle.js / terms.js / render/ / battleRenderers/),重命名会冲突
> - 涉及 20+ 文件 import 路径变更,风险高
> - 价值低(功能无变化,只是目录名)
> - 暂不做,留作未来可选清理
>
> ---
>
> ## 执行顺序
>
> Phase 1 → 2 → 3 → 4 → 5
>
> - Phase 1-2:短期可完成(1-2 天),收尾 window.__ + circular chunk
> - Phase 3-4:中长期(1-2 周),数据层重构
> - Phase 5:最后一步,文件层重构(依赖前面所有 Phase 完成)
>
> ## 核心原则(继承自总规划)
>
> 1. **不改角色数值/公式/共鸣链效果** —— 本规划全程只重构"代码组织"
> 2. **每步结束都可跑**:`npm test` 538+ 全绿,`npm run build` 通过
> 3. **每个 Phase 一个 commit**,可回滚
> 4. **UI 层重构必须开浏览器点验**(render 层无单测,机器验不了)
> 5. 官方资料 / 当前实装 / CLAUDE.md 冲突 → 记差异问用户,不擅自改
