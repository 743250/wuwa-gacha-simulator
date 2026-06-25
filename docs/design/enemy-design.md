# 敌人设计文档

本文档用于管理敌人和 BOSS 机制的 AP 回合制抽象。官方原始资料应放在 [../official/enemies/](../official/enemies/)。

## 设计目标

敌人不只是血量木桩，而是让不同角色机制有用武之地：

- 护盾：鼓励削韧、重击、爆发窗口。
- 召唤：鼓励 AOE / 多目标。
- 反伤：鼓励治疗 / 护盾 / 控制输出节奏。
- 冻结 / 封锁：制造换人和技能循环压力。
- 侵蚀 / 易伤：鼓励元素或机制克制。

## 当前机制注册位置

- 敌人数据：[../../src/battle/enemies.js](../../src/battle/enemies.js)
- 机制执行：[../../src/battle/enemyMechanics.js](../../src/battle/enemyMechanics.js)
- 战斗流程：[../../src/battle/combat.js](../../src/battle/combat.js)

## 机制新增流程

1. 在 [../official/enemies/](../official/enemies/) 记录官方机制表现。
2. 在本文件写 AP 回合制折算方案。
3. 在 [../../src/battle/enemyMechanics.js](../../src/battle/enemyMechanics.js) 添加机制执行。
4. 在 [../../src/battle/enemies.js](../../src/battle/enemies.js) 给敌人挂 `mechanic: { type, ... }`。
5. 用 `npm run smoke` 确认战斗流程不报错。

## 当前机制类型

| type | 作用 | 设计用途 |
|---|---|---|
| `none` | 无机制 | 小怪 / 低层副本 |
| `burn_team` | 周期性全队扣血 | 治疗压力 |
| `freeze` | 周期性冻结单人 | 控制压力 |
| `shield` | 血量阈值生成护盾 | 爆发 / 削韧检查 |
| `enrage` | 血量阈值攻击提升 | 斩杀压力 |
| `reflect` | 周期性反弹伤害 | 输出节奏 / 生存压力 |
| `minion` | 周期性召唤小怪 | AOE / 清场压力 |
| `thunder_chain` | 多段攻击 | 高压单体/随机点名 |
| `dive` | 高倍率单次攻击 | 坦度 / 治疗检查 |
| `aoe_freeze` | 全队伤害 + 冻结 | 高层控制压力 |
| `data_lock` | 封锁技能 | 普攻/解放循环压力 |
| `aero_erosion` | 施加气动侵蚀 | 元素机制压力 |

## 平衡原则

- 普通副本：机制提示为主，不应卡死养成循环。
- 周本 / 强敌：机制比纯血量更重要。
- 深塔：允许数值压力，但应通过环境和机制轮换，而不是只堆 HP。
