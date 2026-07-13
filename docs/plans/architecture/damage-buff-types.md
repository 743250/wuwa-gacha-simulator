# calcDamage 已接入 buff / 加成类型

> 审计日：2026-07-13  
> 源：`src/battle/combat/damage.js`

## 攻击侧（attacker.buffs）

| type | 作用 |
|---|---|
| `atkUp` | 面板攻击乘区 |
| `normalDmgUp` / `skillDmgUp` / `heavyDmgUp` / `burstDmgUp` | 对应 dmgType |
| `allDmgUp` | 全伤害（不含 variation） |
| `elemAllUp` | 全元素 |
| `elemAeroUp` / `elemFusionUp` | 气动 / 热熔 |
| `echoElemDmg` | 声骸元素（匹配 attacker.element） |
| `burstWindow` | 解放窗额外乘区 |
| `pierceUp` | 防御穿透 |
| `crateUp` / `cdmgUp` | 暴击 / 暴伤 |

## 单位常驻字段（非 buff）

`normalBonus` / `skillBonus` / `heavyBonus` / `burstBonus` / `allDmg` — 链 **禁止** C0 大额常驻（DoD `expectNoFlatDoubleCount`）。

## 受击侧

| type | 作用 |
|---|---|
| `defense` | 减伤 |
| `allDmgDown` | 承伤加深/降低（按 value 符号） |

## 效应 / debuff

- 审判印等 mark 走独立 `judgeMark` / hook `markedTargetMultiplier`
- `wind_erosion` 等 `type:'effect'` **默认不进** `debuffBonus`（`erosionDebuffBonus` 现返回 0）；角色专属（卡提二次解放）自己读层数

## 未接入 / 勿假设

- 任意新 `buff.type` 字符串挂了不等于生效——必须先改 damage.js
- 旧 `type:'erosion'` 百分比 debuff 已迁出主路径；武器条件兼容双读
