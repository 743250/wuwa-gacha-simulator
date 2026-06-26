# 敌人/世界 BOSS 移植计划

每个敌人一份移植计划。先查 [sources/enemies/](../../sources/enemies/) 的官方资料,再在本目录写模拟器抽象。

## 敌人设计目标

敌人不只是血量木桩,而是让不同角色机制有用武之地:

- 护盾:鼓励削韧、重击、爆发窗口。
- 召唤:鼓励 AOE / 多目标。
- 反伤:鼓励治疗 / 护盾 / 控制输出节奏。
- 冻结 / 封锁:制造换人和技能循环压力。
- 侵蚀 / 易伤:鼓励元素或机制克制。

## 机制注册位置

- 敌人数据: [src/battle/enemies.js](../../../src/battle/enemies.js)
- 机制执行: [src/battle/enemyMechanics.js](../../../src/battle/enemyMechanics.js)
- 战斗流程: [src/battle/combat.js](../../../src/battle/combat.js)

## 现有机制类型

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

## 数值系统

### 基准数值(Lv90)

采用官方 wuthering.wiki Lv90 数据。每只 BOSS 的 HP/ATK/DEF 见对应单文件。

### 世界等级缩放

SOL3 世界等级决定取 Lv90 基准的百分比:

| 世界等级 | 倍率 | 说明 |
|---|---|---|
| 索拉Ⅰ | ×0.60 | 新手期,HP≈280k-350k |
| 索拉Ⅱ | ×0.70 | 中期,HP≈320k-410k |
| 索拉Ⅲ | ×0.80 | 后期,HP≈370k-470k |

### BOSS 个人等级系统

每个世界 BOSS 有独立的讨伐等级:

- 初始 Lv40,每次被击败 +10 级(上限 Lv90)
- 每次挑战失败 -20 级(下限 Lv40)
- 公式: `实际 HP = Lv90基准HP × 世界倍率 × (当前等级/90)`

## 17 BOSS 索引

| # | BOSS | mechanic type | 复杂度 | 计划文件 |
|---|---|---|---|---|
| 01 | 燎照之骑 | `inferno_marks` | 中 | [燎照之骑.md](燎照之骑.md) |
| 02 | 飞廉之猩 | `baringal_grab` | 中 | [飞廉之猩.md](飞廉之猩.md) |
| 03 | 朔雷之鳞 | `thunder_wall` | 低 | [朔雷之鳞.md](朔雷之鳞.md) |
| 04 | 云闪之鳞 | `tempest_laser` | 中 | [云闪之鳞.md](云闪之鳞.md) |
| 05 | 哀声鸷 | `aix_dive` | 中 | [哀声鸷.md](哀声鸷.md) |
| 06 | 无常凶鹭 | `havoc_erosion` | 中 | [无常凶鹭.md](无常凶鹭.md) |
| 07 | 辉萤军势 | `ice_wing_shield` | 中 | [辉萤军势.md](辉萤军势.md) |
| 08 | 异构武装 | `sentry_dual_phase` | 高 | [异构武装.md](异构武装.md) |
| 09 | 无归的谬误 | `fallacy_dual_form` | 高 | [无归的谬误.md](无归的谬误.md) |
| 10 | 叹息古龙 | `dragon_skill_pool` | 高 | [叹息古龙.md](叹息古龙.md) |
| 11 | 鸣钟之龟 | `turtle_reflect` | 中 | [鸣钟之龟.md](鸣钟之龟.md) |
| 12 | 聚械机偶 | `mech_debris` | 中 | [聚械机偶.md](聚械机偶.md) |
| 13 | 罗蕾莱 | `lorelei_bubbles` | 高 | [罗蕾莱.md](罗蕾莱.md) |
| 14 | 无妄者 | `dreamless_phases` | 极高 | [无妄者.md](无妄者.md) |
| 15 | 海之女 | `sea_flight_puddles` | 高 | [海之女.md](海之女.md) |
| 16 | 荣耀狮像 | `lioness_blades` | 中 | [荣耀狮像.md](荣耀狮像.md) |
| 17 | 梦魇亚当·重锤 | `adam_splash_defdown` | 低 | [梦魇亚当·重锤.md](梦魇亚当·重锤.md) |

## 实施顺序

按复杂度从低到高、BOSS 在副本中出现频率排序:

| 批次 | BOSS | 复杂度 |
|---|---|---|
| 第 1 批 | 梦魇亚当、聚械机偶、朔雷之鳞 | 低 |
| 第 2 批 | 燎照之骑、飞廉之猩、云闪之鳞、哀声鸷 | 中 |
| 第 3 批 | 无常凶鹭、辉萤军势、鸣钟之龟、荣耀狮像 | 中 |
| 第 4 批 | 异构武装、无归的谬误、叹息古龙 | 高 |
| 第 5 批 | 罗蕾莱、海之女、无妄者 | 高-极高 |

## 文件改动清单

| 文件 | 改动 |
|---|---|
| `src/battle/enemies.js` | 替换 17 BOSS 的 mechanic + 更新 HP/ATK/DEF 为 Lv90 基准 + spawnEnemy 支持世界等级/讨伐等级 |
| `src/battle/enemyMechanics.js` | 新增 17 个 mechanic type 执行逻辑 |
| `src/battle/combat.js` | 新机制 hook 点(弹反判定/叠层/dot/飞空无敌等) |
| `src/battle/dungeon.js` | 世界 BOSS 副本用世界等级替代 enemyScale;BOSS 等级持久化 |
| `src/ui/dungeon.js` | 世界 BOSS 面板显示讨伐等级和机制说明 |
| `src/ui/battle.js` | 新机制战斗 UI(层数/状态图标等) |
| `src/state.js` | 新增 `S.bossLevels` 字段 |

## 平衡原则

- 普通副本:机制提示为主,不应卡死养成循环。
- 周本 / 强敌:机制比纯血量更重要。
- 深塔:允许数值压力,但应通过环境和机制轮换,而不是只堆 HP。
