# 架构优化计划

代码架构与性能优化,与游戏机制无关。

## 当前计划

**[plan.md](plan.md)** —— 结构性重构总规划(2026-07-03 立项)

覆盖 5 条结构性问题:
1. combat.js 引擎-角色查询方向反转
2. UI 框架接入(Preact + signals)+ 从 innerHTML 迁走
3. 共鸣链 4 处并写 → 单结构化
4. 角色资源统一模型(gauge/layer/buff/form)
5. CLAUDE.md 铁律落到机器验证

策略:layer by layer(每周一个面板)+ 顺带 TypeScript。历时 4-6 个月。

## 已完成的历史 Phase(简报)

Phase 1-5(2026-06 至 2026-07-03)已全部收尾,详细文档已删除以避免混淆。核心成果:

- **Phase 1**:平衡常量集中(`balance.js`)+ 角色机制注册表(`characters/index.js`)+ 敌人机制注册表(`enemyMechanics.js`)+ smoke/balance 脚本
- **Phase 2**:Vitest 测试框架 + chains.js 数据/逻辑分离 + scripts/ 归档
- **Phase 3**:combat.js hook 收口(顶部 0 角色 import,`fireCharacterHook`/`queryCharacterHook` 全面派发)+ render.js 拆分(1349 → 57 行,27 个子模块)+ `startEncounter` 统一入口
- **Phase 4**:P0 死代码清理 + `chains-extracted.json` 迁 docs + `CHAIN_TERM_PATTERNS` 归位 + switchHooks 全员贯彻
- **Phase 5**:测试补齐(464/464)+ `rateConfig.js` 常量外提 + `types.js` JSDoc typedef + vitest `pool: 'forks'` 修单例污染

**当前基线**(2026-07-03):
- 464 tests · 22 files · all green
- combat.js 1403 行(hook 派发已收口,但引擎本身待瘦身 — 见 plan.md Stage 4)
- src/ui/render.js 57 行 · render/ 27 子模块(待迁 Preact — 见 plan.md Stage 2 / 3 / 5)
- 246 处 `window.__xxx` + 93 处内联 onclick(待清 — 由 Stage 2-6 分批消解)
- SAVE_VERSION = 2,存档命名统一独立于本规划(用户要求"存档不动")
