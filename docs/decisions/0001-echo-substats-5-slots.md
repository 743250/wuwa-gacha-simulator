# 0001 · 声骸副词条 5 槽解锁制

**日期**：2026-06-29

**决策**：金色声骸共 5 个副词条槽位，+0 时全部锁定（不可见），每升 5 级（LV5/10/15/20/25）解锁 1 个，到 LV25 全部解锁。

**背景**：
- 旧实现是"8 条副词条全可见"，与鸣潮官方不符。用户质问"你确定有 8 条这么词条吗？"后查证 `docs/sources/mechanisms/echo-system.md`，确认金色声骸为 5 槽位、解锁制。
- 同时旧的 `generateEcho` 没区分"已解锁/未解锁"，所有副词条直接计入面板，相当于白嫖全部属性。

**取舍**：
- 方案 A（采用）：5 槽 + `unlocked` 字段 + 每 5 级解锁 1 个。匹配官方，养成有节奏。
- 方案 B（弃用）：5 槽全可见，不搞解锁。简单，但和官方行为不符，且失去"升级有意义"的反馈。
- 方案 C（弃用）：保留 8 槽但调小数值。改动最小但与官方数据冲突，违反 CLAUDE.md "设计文档 > 官方数据"的反向：此处无设计文档，官方数据优先。

**影响**：
- `src/equip/echoActions.js` `generateEcho` 改为 5 槽 + 全锁；`levelUpEcho` 每 5 级解锁下一个 `!unlocked` 槽位。
- `src/battle/stats.js` `echoContrib` 跳过 `unlocked === false` 的副词条。
- `src/ui/bag.js` / `src/ui/render.js` 未解锁槽位显示 `??? · 未解锁（LV X）`。
- **老存档兼容**：旧声骸无 `unlocked` 字段，`echoContrib` 用 `s.unlocked === false` 判定（undefined 不等于 false），默认按已解锁处理——老存档不崩、不缩水。新 `generateEcho` 才会生成 `unlocked: false`。
- **不能随便改**：5 槽解锁节点（5/10/15/20/25）已写入测试 `tests/equip/echoActions.test.js`，改动需同步测试。
