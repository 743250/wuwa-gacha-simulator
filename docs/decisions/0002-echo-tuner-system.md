# 0002 · 声骸调谐器系统

**日期**：2026-06-30

**决策**：引入调谐器（`echo_tuner`）资源，用于重 roll 单个**已解锁**副词条的数值（不换词条类型）。

**背景**：
- 官方声骸系统有调谐器，用于重 roll 副词条数值，是终局核心消耗。
- 旧实现完全没有调谐器，副词条数值一次性随机后无法更改，养成深度不足。
- `docs/sources/mechanisms/echo-system.md:168,204` 明确"可使用调谐器重 roll""分解金色声骸返还 1~3 个调谐器"。

**取舍**：
- 方案 A（采用）：调谐器只重 roll 数值，不换词条类型。匹配官方，玩家锁定想要的词条类型后微调数值。
- 方案 B（弃用）：调谐器可换词条类型。改动太大，破坏"升级时随机解锁词条"的赌性。
- 方案 C（弃用）：不实装调谐器。养成深度不足，且分解返还只剩经验太单薄。

**影响**：
- `src/state.js` `materials.echo_tuner` 默认 5。
- `src/equip/echoActions.js` 新增 `retuneEchoSubStat(echoId, subIdx)`，消耗 1 调谐器，数值在 `SUB_STAT_POOL` 的 min~max 重新随机。
- `recycleEcho` 返还调谐器：COST4=3 / COST3=2 / COST1=1，已升级声骸每 10 级 +1。
- 11 个无音区副本 drops 加 `echo_tuner`（silent_1=1 / silent_2=2 / 角色专属=1）。
- `src/ui/bag.js` 详情 modal 每个已解锁副词条旁加"调谐"按钮。
- **老存档兼容**：`echo_tuner` 字段缺失时 `S.materials.echo_tuner || 0` 兜底为 0。`save.js` MIGRATIONS[0] 不再删除 `echo_tuner`（之前误删，现改为合法资源）。
- **声骸主动技能不做**：用户明确决定（"声骸技能我们不做"）。声骸纯粹作为数据加成工具。
