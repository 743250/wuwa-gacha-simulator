# Phase 1 优化计划

本计划记录本轮对话形成的架构优化方向。详细执行计划也保存于 Claude 计划文件：`C:\Users\WANG HAO\.claude\plans\sorted-splashing-pebble.md`。

## 背景

项目后续会大量增加角色、武器、机制、敌人、副本和深塔内容。当前主要风险：

- [../../src/battle/combat.js](../../src/battle/combat.js) 同时承担战斗流程、角色特判、敌人机制、伤害计算。
- [../../src/ui/render.js](../../src/ui/render.js) 过大，混合主界面、角色弹窗、技能文案、武器详情等。
- 平衡常量分散，不利于调深塔/副本强度。
- 缺少自动回归脚本。

## 已完成

- 新增 [../../src/battle/balance.js](../../src/battle/balance.js)：集中 AP、倍率、削韧、评星、深塔水温、副本版本缩放。
- 新增 [../../src/battle/characters/index.js](../../src/battle/characters/index.js)：角色机制注册表雏形，已迁移重击白名单和忌炎 UI 状态显示。
- 新增 [../../src/battle/enemyMechanics.js](../../src/battle/enemyMechanics.js)：敌人机制执行注册表，已从 combat 的 endTurn 中抽离周期/阈值机制。
- 新增验证脚本：
  - [../../scripts/smoke-combat.mjs](../../scripts/smoke-combat.mjs)
  - [../../scripts/check-balance.mjs](../../scripts/check-balance.mjs)
- 版本/日期选择允许前后跳转。

## 重要约束

- 架构优化不等于角色数值调整。
- 角色/武器/敌人机制变更必须先查官方资料并确认。
- 若官方资料、当前实装、CLAUDE.md 指南冲突，不能直接选一个改；应记录差异并询问用户。

## 下一步建议

1. 继续拆角色机制：忌炎 → 守岸人 → 吟霖 → 安可。
2. 拆 UI：先拆 `makeSkillLines` 和 `SKILL_HINTS`。
3. 建立 [../official/](../official/) 官方资料库，避免再把旧指南当唯一事实来源。
4. 完善冒险强度文档：[../design/adventure-balance.md](../design/adventure-balance.md)。

## 验证命令

```bash
npm run build
npm run smoke
npm run check:balance
```
