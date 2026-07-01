# 无音区与声骸系统翻新 · 实施计划

> 立项日期：2026-07-01
> 状态：计划已确认，等子代理核实关卡配置后实施
> 关联文档：[echo-system.md](echo-system.md) · [敌人数值统一缩放方案.md](敌人数值统一缩放方案.md) · [../../sources/mechanics/tacet-field-mechanics.md](../../sources/mechanics/tacet-field-mechanics.md)

---

## 一、结论（已与用户对齐）

### 1. 数据坞系统 → 取消

- **决策**：删除 `S.dataBankLevel` 字段、`dataBankCostCap()` 函数及全部 4 处使用点
- **COST 上限**：固定为 12（满配 4+4+3+1）
- **金声骸掉率**：固定 100%（模拟器本就是终局向，不做数据坞进度曲线）
- **影响文件**：`src/equip/echoActions.js` / `src/ui/bag.js` / `src/ui/render.js` / `src/state.js` / `tests/equip/echoActions.test.js` / `tests/battle/stats.test.js`

### 2. SOL3 世界等级 → 真正联动副本怪物等级

- **当前问题**：`src/ui/battle.js:45` 拿了 `sol3` 变量但非世界 BOSS 分支完全没用，副本 `enemyLevel` 直接吃关卡固定值
- **决策**：所有副本（无音区/经验本/武器本）的敌人等级 = `关卡基础等级 × SOL3 档位系数`
- **SOL3 档位保留现有 3 档**：索拉Ⅰ ×0.30 / 索拉Ⅱ ×0.40 / 索拉Ⅲ ×0.50
- **世界 BOSS** 已有 `getWorldBossSpawnOpts` 走 tierMult，保留不动
- **影响文件**：`src/ui/battle.js` / `src/battle/dungeon.js`

### 3. 无音区 → 按版本解锁 + 补全到 31 套

- **官方核实**：encore.moe `/echo` API 确认官方 31 套声骸，模拟器 `ECHO_SETS` 已 1:1 对齐，0 差异
- **版本解锁机制**：每个无音区关卡挂 `version` 字段，跟 `phases.js` 版本时间表联动
  - 1.0 上线 = 9 套基础无音区（凝夜白霜/熔山裂谷/彻空冥雷/啸谷长风/浮星祛暗/沉日劫明/隐世回光/轻云出月/不绝余音）
  - 2.0 上线 = +6 套 = 15 套
  - 2.x 后续 = +16 套 = 31 套（含角色专属套，跟角色上线版本走）
- **关卡结构**：删 `encounterPool` 轮换池（非官方设计），每关固定 BOSS + 固定套装
- **关卡数量目标**：31 套 → 31 个关卡（1.0 基础 9 套可能合并为更少关卡，等子代理核实）
- **影响文件**：`src/battle/dungeon.js` / `src/ui/dungeon.js`

### 4. 自造敌人名 → 替换为官方 269 怪物名

- **问题**：17 个模拟器自造名（飞兽/幼狼/拂拂/吞吞/咔嚓/鼓手/滴答/碧焰蜥/自走傀儡斥候/石壁护腕/坚岩守护者/剑齿野猪/导电掠食者/折折/古老幽灵/幻象 等）
- **替换源**：`docs/sources/enemies/encore-enemies-compact.json`（269 个官方怪物）
- **影响文件**：`src/battle/enemies.js` / `src/battle/dungeon.js`

### 5. 敌人缩放 → 改用 GrowthRates 非线性曲线

- **当前**：`lvRatio = level/90` 线性（`src/battle/combat.js:83-85`）
- **目标**：`HP@LvN = 基础HP × GrowthRates[N].LifeMaxRatio / 10000`（非线性）
- **数据源**：encore.moe `/monster/{id}` 已暴露 GrowthRates（1-120 级）
- **影响文件**：`src/battle/combat.js` / `src/battle/enemies.js`

---

## 二、子代理任务（已派）

**任务**：用 WebSearch 搜索每套声骸对应的官方无音区关卡配置
- 关卡中文名 / 推荐等级 / 掉落套装 / BOSS / 杂兵组合
- 难度档位数
- 1.0 基础 9 套是合并关卡还是独立关卡
- 归档到 `docs/sources/mechanics/tacet-fields-official.md`
- 子代理 ID：`ac78246a29d52cf3c`，后台运行中

**不用 encore.moe API**：用户指示"不要太依赖 fetch"，用 WebSearch 查社区资料。

---

## 三、实施顺序（等子代理回来后一次性提交）

| 步骤 | 任务 | 依赖 |
|---|---|---|
| 1 | 删数据坞（#14） | 无 |
| 2 | SOL3 联动副本 enemyLevel（#13） | 无 |
| 3 | 接入 GrowthRates 非线性缩放（#17） | 无 |
| 4 | 替换自造敌人名（#16） | 无 |
| 5 | 补全无音区 31 关卡 + 版本解锁（#18） | 子代理结果 + 步骤 4 |

步骤 1-4 互不冲突，可并行；步骤 5 依赖步骤 4 的敌人名替换完。

---

## 四、验收标准

- `vitest run` 全绿（含调整后的 `echoActions.test.js` / `stats.test.js`）
- 进游戏：
  - 声骸面板不再显示数据坞等级，COST 上限固定 12
  - 切 SOL3 档位，无音区/经验本/武器本敌人等级和血量跟着变
  - 1.0 版本状态下只有 9 个无音区可打；切到 2.0+ 解锁更多
  - 无音区关卡不再有"每日轮换敌人组合"，每关固定 BOSS
  - 敌人名全是官方名（飞兽→惊蛰猎手/巡徊猎手 等）
  - 同敌人 Lv80→Lv90 血量涨幅 > Lv1→Lv10（GrowthRates 非线性生效）

---

## 五、不做的事

- **数据坞升级机制**：取消，不做"首杀+经验"那条养成线
- **encounterPool 轮换池**：删除，不保留
- **多难度档**：暂不做 Lv40/60/80/90 四档，靠 SOL3 档位联动替代
- **凝缩波片双倍档**：不在本次翻新范围

---

## 六、关键文件清单

| 文件 | 改动类型 |
|---|---|
| `src/state.js` | 删 `dataBankLevel` 字段 |
| `src/equip/echoActions.js` | 删 `dataBankCostCap` + COST 上限改固定 12 |
| `src/ui/bag.js` / `src/ui/render.js` | 删 `dataBankCostCap` 调用 |
| `src/ui/battle.js` | SOL3 联动 enemyLevel |
| `src/battle/dungeon.js` | SOL3 联动 + 无音区 31 关卡 + 版本解锁 + 删 encounterPool |
| `src/battle/enemies.js` | 替换 17 自造名 + 接入 GrowthRates |
| `src/battle/combat.js` | 改 enemyLevel 缩放为 GrowthRates |
| `tests/equip/echoActions.test.js` | 删 dataBankCostCap 用例 |
| `tests/battle/stats.test.js` | 删 dataBankLevel 设置 |
| `docs/sources/mechanics/tacet-fields-official.md` | 子代理归档 |
| `docs/sources/mechanics/tacet-field-mechanics.md` | 已存，本次翻新依据 |
