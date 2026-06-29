# 文档体系

四类文档:**官方资料 sources/、设计指导 plans/、**分开成角色 / 敌人 / 机制 / 架构四份。

## 数据来源 sources/

官方原文,不掺模拟器自定义。

| 目录/文件 | 内容 |
|---|---|
| [sources/characters/](sources/characters/) | 51 个角色官方技能/共鸣链原文([README](sources/characters/README.md)) |
| [sources/enemies/](sources/enemies/) | 敌方数据(世界 BOSS 机制/完整数据库/[README](sources/enemies/README.md)) |
| [sources/mechanisms/](sources/mechanisms/) | 副本/深塔/海墟/声骸官方数据([dungeons](sources/mechanisms/dungeons.md) · [tower](sources/mechanisms/tower-of-adversity.md) · [wastes](sources/mechanisms/whimpering-wastes.md) · [echo](sources/mechanisms/echo-system.md)) |
| [sources/tier-list.md](sources/tier-list.md) | 强度榜(数值天花板对照) |

## 设计指导 plans/

与用户讨论后定稿,指导改代码。四类分开:

| 目录 | 内容 |
|---|---|
| [plans/characters/README.md](plans/characters/README.md) | **角色设计指导**(模拟器定位 / 移植力度 / 基本思路 / 战斗系数基线) |
| [plans/enemies/README.md](plans/enemies/README.md) | 敌人设计指导(机制类型 / 数值系统 / 17 BOSS 索引) |
| [plans/mechanisms/README.md](plans/mechanisms/README.md) | 机制设计指导(副本 / 深塔 / 海墟 / 声骸) |
| [plans/architecture/README.md](plans/architecture/README.md) | 架构优化计划(与游戏机制无关) |

单角色 / 单敌人 / 单机制计划分别在对应目录下。

## 决策日志 decisions/

ADR 风格的决策记录。记"为什么这么定",不记"是什么"。代码能看出来的不进这里,只留非显而易见的取舍和用户口头拍板。索引见 [decisions/README.md](decisions/README.md)。

## 硬规则

- **设计文档优先**:有角色设计方案时,以 plans/ 的设计文档为准,sources/ 仅作官方数据参考,不作为最终设计依据。
- 改角色/敌人/机制前,先在 sources/ 查官方,再在 plans/ 写模拟器抽象。
- 官方资料、当前实装、UI 文案三者冲突,先问用户,不擅自改。
- 架构优化不顺手改强度。