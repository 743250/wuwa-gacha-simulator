# 架构优化计划

> 状态: 本轮核心改造完成，仍保留明确尾债；**内容债/交付流程优先于下一轮大 refactor**
> 当前计划见 [plan.md](plan.md)
> **项目管理与角色 DoD**见 [project-management-optimization.md](project-management-optimization.md)（2026-07-13 起生效）
> 文案源归属见 [../copy-ownership.md](../copy-ownership.md)

下一轮可直接交给执行型 AI 的详细任务书见 [next-refactor-execution-guide.md](next-refactor-execution-guide.md)。**在 S 级战斗验收与横切契约债清完前，该任务书挂起不执行。**

## 进度总览

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | 状态写入收口 — 高频路径和角色/武器养成已迁，声骸养成仍为尾债 | ◑ 部分完成 |
| Phase 2 | 应用壳组件化 — 顶层 view tab 已组件化，子 tab/时间线仍为尾债 | ◑ 部分完成 |
| Phase 3 | 显式初始化边界 — `init.ts` 收口 4 个 side-effect import | ✅ 完成 |
| Phase 4 | ChainDef 收尾 — 删 `FALLBACK_CHAIN`,简化链路径 | ✅ 完成 |
| Phase 5 | ResourceDef 深化 — 补 4 个查询 API | ✅ 完成 |
| Phase 6 | 边界测试和 lint 分级 — 3 个边界测试 + `npm run lint:strict` | ✅ 完成 |
| 交付流程 | 角色 DoD + 文案归属 + 任务板瘦身 | ✅ 完成（见 project-management-optimization.md） |
| P0 横切 | HP 核变奏 dmgType 契约 | ✅ 完成 |
| §8 共享债 | hook 约定 / buff 审计 / erosion 迁 / charge 立项 | ✅ 文档+主路径；charge 仅立项 |
| 大 refactor | next-refactor-execution-guide | ⏸ 仍冻结 |

此目录不保存角色/敌人/机制的设计计划，仅涉及代码架构优化与工程交付。详细方案见 [plan.md](plan.md)。
