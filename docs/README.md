# 文档体系说明

本项目文档按“事实来源 / 设计决策 / 实现指南 / 优化计划”分层，避免把官方原文、模拟器抽象、强度调参和 Claude 操作指南混在一起。

## 1. 官方资料层

目录：[official/](official/)

用途：记录官方/半官方资料原文要点，包括角色、武器、敌人、机制。

建议结构：

```text
docs/official/
  README.md
  characters/
    shorekeeper.md
  weapons/
  enemies/
```

规则：

- 只记录“官方文本 / API 来源 / 抓取日期 / 关键数值”。
- 可以写“与当前模拟器抽象的关系”，但不要把模拟器自定义说成官方。
- 修改角色/武器/敌人机制前，先查这里；没有资料就先补。

## 2. 强度榜层

文件：[tier-list.md](tier-list.md)

用途：决定模拟器数值天花板。

规则：

- 强度榜只决定“数值上限 / 资源投入回报 / 深塔适配强度”。
- 不能替代官方技能文本。
- 每次移植新角色前，需要重新确认榜单是否过时。

## 3. 角色设计层

文件：[character-design.md](character-design.md)

用途：把官方技能组折算为模拟器 AP 回合制设计。

规则：

- 这里写“模拟器要怎么做”。
- 必须引用或对应 [official/](official/) 的官方资料。
- 明确区分：官方机制、模拟器保留、模拟器舍弃、自定义折算。
- 不确定的数值要标注“待确认”，不能伪装成官方。

## 4. 敌人与冒险设计层

建议文件：

- [design/enemy-design.md](design/enemy-design.md)
- [design/adventure-balance.md](design/adventure-balance.md)

用途：管理敌人、机制、副本、深塔、冥歌海墟、版本水温和强度膨胀。

规则：

- 敌人机制优先记录官方表现，再折算为 AP 回合制。
- 普通副本、周本、深塔应有不同强度目标。
- 深塔水温 / 副本版本缩放的配置入口是 [../src/battle/balance.js](../src/battle/balance.js)。

## 5. Claude / 实现指南层

文件：[../CLAUDE.md](../CLAUDE.md)

用途：给 Claude Code 的执行规则、项目架构、移植流程、注意事项。

规则：

- CLAUDE.md 是“怎么工作”的指南，不应该单独作为角色官方事实来源。
- 如果 CLAUDE.md 与 [official/](official/) 或代码实装冲突，先查证并询问用户，不要擅自改角色数值。
- 角色机制/数值变更必须和用户确认，架构优化不应顺手改角色平衡。

## 6. 优化计划层

建议目录：[plans/](plans/)

用途：记录架构优化、模块化、性能优化、验证脚本等计划。

当前计划：

- [plans/phase-1-optimization.md](plans/phase-1-optimization.md)：Phase 1（已完成 ✅）—— 注册表模式 + 平衡配置集中化
- [plans/phase-2-optimization.md](plans/phase-2-optimization.md)：Phase 2（当前）—— 测试安全网 + 大文件拆分 + 解耦

规则：

- 优化计划只描述代码组织、性能、验证、边界拆分。
- 不把角色数值改动混进“优化”。
- 如果优化过程中发现角色数据疑似问题，先记录到对应官方资料或角色设计文档，再问用户。
