# 冒险与强度膨胀设计文档

本文档管理副本、周本、深塔、冥歌海墟和版本水温。配置入口优先看 [../../src/battle/balance.js](../../src/battle/balance.js)。

## 内容分层

| 内容 | 定位 | 强度目标 |
|---|---|---|
| 普通资源副本 | 养成循环 | 不应卡死，主要消耗体力换材料 |
| 讨伐强敌 / 周本 | 机制检查 | 比普通副本难，重在机制而不是纯堆血 |
| 逆境深塔 | 星声压力场 | 检查队伍结构、版本强度、环境适配 |
| 冥歌海墟 | 版本常驻挑战 | 与版本节奏绑定，奖励稳定 |

## 当前配置入口

- 基础动作倍率 / AP / 削韧：[../../src/battle/balance.js](../../src/battle/balance.js)
- 副本数据：[../../src/battle/dungeon.js](../../src/battle/dungeon.js)
- 深塔数据：[../../src/daily/abyss.js](../../src/daily/abyss.js)
- 冥歌海墟：[../../src/daily/wastes.js](../../src/daily/wastes.js)
- 敌人数据：[../../src/battle/enemies.js](../../src/battle/enemies.js)
- 敌人机制：[../../src/battle/enemyMechanics.js](../../src/battle/enemyMechanics.js)
- **官方参考数据**：[../official/](../official/)（副本/深塔/海墟/敌人）

## 版本缩放

普通副本使用温和版本缩放：

- `majorBonus`：大版本加成。
- `minorBonus`：小版本加成。

深塔使用单独的 `ABYSS_TEMPERATURE_TABLE`，允许更高水温。不要把普通副本强度直接拉到深塔水平。

## 深塔设计原则

### 楼层分工

1. 低层：检查养成是否基本到位。
2. 中层：检查队伍结构（主 C / 副 C / 生存位）。
3. 高层：检查版本强度、机制应对、环境适配。

### 环境设计建议

后续可以给深塔加入环境词条，而不是只加血量：

```js
environment: {
  favorElement: '导电',
  bonus: { type: 'skillDmg', value: 0.25 },
  enemyMod: { type: 'shieldOnLowHp', value: 0.15 }
}
```

## 调参流程

1. 先确定内容定位：普通副本 / 周本 / 深塔 / 海墟。
2. 修改 [../../src/battle/balance.js](../../src/battle/balance.js) 或对应内容数据。
3. 运行：

```bash
npm run check:balance
npm run smoke
npm run build
```

4. 如果是深塔或高难内容，记录预期队伍：0 链、低链、高链分别应该达到什么星级。

## 注意事项

- 不要为了让新 SS 角色有压力，把普通副本同步抬爆。
- 不要只用 HP 膨胀解决难度问题；优先用机制、环境、目标选择压力。
- 奖励循环要稳定，普通玩家不能因为版本后移而无法刷养成资源。
