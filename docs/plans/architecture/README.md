# 架构优化计划

> 状态: 本轮核心改造完成，仍保留明确尾债
> 当前计划见 [plan.md](plan.md)

## 进度总览

| Phase | 内容 | 状态 |
|-------|------|------|
| Phase 1 | 状态写入收口 — 高频路径和角色/武器养成已迁，声骸养成仍为尾债 | ◑ 部分完成 |
| Phase 2 | 应用壳组件化 — 顶层 view tab 已组件化，子 tab/时间线仍为尾债 | ◑ 部分完成 |
| Phase 3 | 显式初始化边界 — `init.ts` 收口 4 个 side-effect import | ✅ 完成 |
| Phase 4 | ChainDef 收尾 — 删 `FALLBACK_CHAIN`,简化链路径 | ✅ 完成 |
| Phase 5 | ResourceDef 深化 — 补 4 个查询 API | ✅ 完成 |
| Phase 6 | 边界测试和 lint 分级 — 3 个边界测试 + `npm run lint:strict` | ✅ 完成 |

此目录不保存角色/敌人/机制的设计计划，仅涉及代码架构优化。详细方案见 [plan.md](plan.md)。
