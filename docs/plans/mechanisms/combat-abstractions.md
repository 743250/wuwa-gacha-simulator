# 战斗机制抽象重构计划

> 2026-06-27 · 计划阶段，逐步实施中

## 背景

当前战斗引擎里几类高频出现的机制散写在各角色文件 / `combat.js` / `enemyMechanics.js`：

- **破韧**目前只是"多打一点伤害 + 弹反时单独算"——没有官方那样"瘫痪+全静音"的中断效果
- **层数资源**（忌炎锐意、卡提希娅决意、安可失序）——各角色文件 `unit.X = (unit.X||0)+1` 各写一套
- **双形态**（卡提希娅芙露德莉斯、安可黑咩、菲比形态）——`unit.formA` / `unit.furuActive` 等不统一
- **临时属性变化**（狂暴 atk+30%、过渡减伤、弹反易伤 +50%）——`enemy.atk = ...` 散写在各处
- **切人触发**——散写在 `combat.js` 切人段，没有统一钩子

玩家指出破韧应改为"中断"语义；同时战斗中变身应改 UI 名字（卡提希娅 → 芙露德莉斯）。

## 目标

1. **破韧 = 易伤 + 全静音**：敌人进入 suppressed 状态期间，敌人不普攻、敌人周期触发不累加计数 / 不进冷却
2. **统一 Stack 原型**：层数资源从角色文件收口到统一模块
3. **统一 Form 原型**：双形态切换接管 `unit.displayName`，战斗 UI 自动跟随
4. **统一 TempStat 原型**：临时属性变化挂"来源 + 剩余回合"的实例，回合计时器自然清理
5. **SwitchHook**：切人时统一钩子（后续角色按需挂）

非目标：一次性重写已跑得动的角色——只迁样板，剩下的角色扩展时再迁。

## 总体原则

- 每完成一小步立刻跑 `npx vitest run`，避免堆改动
- 旧字段与新字段可短暂并存（如 `enemy._stunned` → `enemy.suppressed` 过渡），迁完后清理
- 命名最终要一致：`suppressed` / `displayName` / `Stack`/`Form`/`TempStat` 注册器名

## 实施步骤

### Step A：破韧改写为 suppressed（中断）状态

**目标**：破韧瞬间进入 `suppressed` 窗口，期间敌人不普攻 + 周期触发静音。`_stunned` / `_vulnerable` / `vibrationBroken` 三者合并为 `suppressed` 一个状态（含易伤率字段）。

**改动点**：

- [x] `combat.js` `reduceVibration()`：破韧后设 `enemy.suppressed = 2`、`enemy.suppressedVuln = 0.3`（×1.3 收敛到 suppressedVuln）
- [x] `combat.js` endTurn 敌方行动段：`if (enemy.suppressed > 0) { skip attack }`
- [x] `combat.js` dealDamage 伤害计算段：`target.suppressed && target.suppressedVuln` 替代旧 `_stunned/_vulnerable`
- [x] `combat.js` endTurn 衰减段：`e._stunned--/_vulnerable--/vibrationBroken--` → 统一 `e.suppressed--`，`_suppressedFresh` 标记首轮不改
- [x] `combat.js` `doDebris()` 残骸投掷：`enemy.suppressed = 1`，`suppressedVuln = 0.5`
- [x] `enemyMechanics.js` `applyEnemyPeriodicMechanic` 统一前置静音
- [x] `enemyMechanics.js` 5 处弹反 `_stunned=1/_vulnerable=1` 替换为 `suppressed=1, suppressedVuln=0.5`
- [x] `enemyMechanics.js` `applyEnemyDefendHook` 顶替旧 `_stunned` 检查
- [x] `elements.js` `vibrationMultiplier` 不再额外乘 1.3（避免双重叠加），永远返回 1.0；易伤率收敛到 `suppressedVuln`
- [x] `enemies.js` 初始化字段：`suppressed: 0, suppressedVuln: 0, _suppressedFresh: false`，删除 `vibrationBroken/_brokenFresh`
- [x] `ui/battle.js` 显示段：UI 走 `e.suppressed`，文案改为「中断 ×1.3 (2回合)」
- [x] `tests/battle/elements.test.js` 更新 vibrationMultiplier 断言
- [x] 跑 `npx vitest run` —— 290 全部通过

**验证**：
- 现存弹反眩晕行为：弹反时设 `enemy.suppressed = 1 + suppressedVuln = 0.5`，等价替代原 `_stunned=1, _vulnerable=1`
- 残骸投掷眩晕同上
- 破韧的 +2 AP / 卡提希娅 1 链触发等保留不动

**遗留**：
- `applyEnemyDefendHook` 函数定义未被调用——之前就没接上，移到 Step D 一起接（TempStat 注册器接进 dealDamage 时统一切入）
- `combat.js` 开头部分仍有 inline 的冰翼盾/风壁/过渡减伤/飞空无敌，与 `applyEnemyDefendHook` 语义重叠 —— Step D 统一抽取

---

### Step B：Stack 原型（层数资源收口）

**目标**：忌炎锐意、卡提希娅决意、安可失序改为统一 `Stack` 表。

**改动点**：

- [x] 新建 `src/battle/stacks.js`，导出 `Stack` 注册器：`registerStack` / `gainStack` / `consumeStack` / `tickStacks` / `getStack` / `getStackCap` / `renderStacks`
- [x] 忌炎迁过来：`jiyanRuiyi` → Stack `jiyan_ruiyi`（cap 默认 2、6 链 3，无衰减，解放时 consume）
- [x] 卡提希娅决意 → Stack `cartethyia_resolve`（cap 3，`decayCooldown=1` 表现"每 2 回合减 1 层"，到点 `onDecay`/`onExhaust` 回调）
- [x] 安可失序值（0-100）—— 大数与小层数语义不同，**不迁**，留作专属 `unit.encoreDisorder`（决策记录见下）
- [x] UI 渲染：角色 `renderBattleStatus(unit)` 统一调 `renderStacks(unit)`，丢掉各角色文件里 `getJiyanStatusHtml` 之类散写
- [x] `combat.js` endTurn 接入 `tickStacks(battle, t)`（行 ~1166）
- [x] 跑 `npx vitest run` —— 290 全部通过（2026-06-27）

---

### Step C：Form 原型（双形态 + 改 displayName）

**目标**：卡提希娅芙露德莉斯、安可黑咩、菲比形态套同一原型；战斗中名字自动跟随形态切换。

**改动点**：

- [x] 新建 `src/battle/forms.js`：`registerForm` / `enterForm` / `exitForm` / `hasForm` / `getActiveForm` / `onUnitSwitchOut`
- [x] 所有角色显示名走 `unit.displayName ?? unit.name` —— `src/ui/battle.js` 引入 `displayName(u)` 工具，覆盖：顶部"当前 X"、buff stripe label、敌人卡名字、队员卡名字、操作面板大名字、禁用提示、灼伤叠加显示
- [x] 卡提希娅：`cartethyiaEnterFurForm` 改用 `enterForm(unit, 'cartethyia_furu', battle, { right, turns: 4 })`，进/退 hook 处理 right 计时与 buff 清理；`cartethyiaBurstErosion` / `cartethyiaTurnCleanup` 改用 `exitForm`；`onExit` 统一清 `链3/人权/神权/链2/链4` buff
- [x] 安可黑咩：`encoreStartBlackSheep` 改用 `enterForm(unit, 'encore_black', battle)`，`encoreTurnCleanup` 改用 `exitForm`；`enterName='黑咩'` 自动改 displayName
- [x] 菲比形态：迁过来 `phoebe_absolution` form（`enterName=null`，赦罪不修改 displayName；现有 `phoebeToggleForm` 与 `formBonus` 接入 enterForm/exitForm）。`phoebeToggleForm` 在 combat.js 当前未接 dispatch，史遗留待后续接 forte effectType='toggleForm' 触发（不在 Step C 范围）
- [x] 战斗 UI 渲染段：敌人/队员 card 名字、buff label 全部走 `displayName(u)`
- [x] 数据层不变：`unit.name` 仍作为 key、log 源、save 备份；`unit.displayName` 仅 UI 显示
- [x] 跑 `npx vitest run` —— 290 全部通过（2026-06-27）

**验证**：卡提希娅变身后战斗 UI 显示"芙露德莉斯"，退出后回到"卡提希娅"；安可解放后显示"黑咩"，3 回合后回"安可"

---

### Step D：TempStat 原型（临时属性变化）

**目标**：临时属性倍率（狂暴 +30% atk、过渡减伤 50%、飞空无敌、卡提希娅 5 链护盾）收口到统一注册器。

**改动点**：

- [x] 新建 `src/battle/tempStats.js`：
  ```js
  // 临时属性变更是"乘子在 float 上的多层叠加"
  // model: { unit, stat:'atk'|'dmgReduc'|' dmgImmune', mult, turns, source }
  applyTempStat(unit, stat, mult, turns, source)
  removeTempStat(unit, source)  // 按 source 一次性清除
  computeStat(unit, stat, baseVal) // 乘上所有 active 的 mult
  tickTempStats(unit)  // endTurn 衰减
  ```
- [x] 迁移：
  - 敌人狂暴 `enemy.atk = atk * 1.3` → `applyTempStat(enemy, 'atk', 1.3, Infinity, 'enrage')`
  - 无妄者过渡减伤 → `applyTempStat(enemy, 'dmgReduc', 0.5, 1, 'phase_transition')`
  - 海之女飞空无敌 → `applyTempStat(enemy, 'dmgImmune', '∞', enemy._flightTurns, 'flight')`
  - 弹反易伤 +50% → 合入 suppressed 状态自身携带（不需单独）
  - Overclock 过载 `enemy.atk = atk * (1+0.5)` → `applyTempStat(enemy, 'atk', 1.5, Infinity, 'overclock')`，配合 `_overclockTurns` 衰减后 `removeTempStat('overclock')`
- [x] 计算段：`dealDamage` 统一调 `applyEnemyDefendHook`，后者内部调 `computeStat(target, 'dmgReduc', dmg)` / `dmgImmune` 短路
- [x] endTurn 接入 `tickTempStats(e)`，清理旧字段 `_transition / _windWallTurns / _iceShieldDmgReduc` 衰减段
- [x] `enemyMechanics.js` 5 处 inline 减伤字段挂载迁移完成
- [x] `ui/battle.js` 减伤/无敌显示改读 `getTempStatInstances` / `hasTempStat`
- [x] 跑 `npx vitest run` —— 290 全部通过（2026-06-27）

**额外收尾**（史遗留）：

- [x] 菲比 `effectType:'toggleForm'` dispatch 接线：`forte.js` 把 toggleForm 从 `enhancedNormal` 路径移除；`combat.js doSkill` 末尾在 forte 满 + toggleForm 时调 `fireCharacterHook(self, 'toggleForm', battle)` + `consumeForte`
- [x] `onUnitSwitchOut` 接入 `doSwitch`：`combat.js` 切人时调 `onUnitSwitchOut(prev, battle)`，三个已迁 form 都是 `carryOnSwitch=true` 场地态，当前为 noop；为后续 `carryOnSwitch=false` 的角色态形态铺路

---

### Step E：SwitchHook（最后再做）

**目标**：切人时统一钩子。赞妮 / 露帕扩展时无需再改 `combat.js`。

**改动点**：

- [x] 新建 `src/battle/switchHooks.js`：`registerSwitchHook(name, fn)` / `fireSwitchHook({ from, to, battle, ctx })`，按角色名路由；`ctx` 携带 `variationTarget`（变奏主目标，可能为 null）
- [x] `combat.js doSwitch` 切人入场后统一调 `fireSwitchHook({ from, to, battle, ctx })`，删除 4 处 inline 调用
- [x] 迁移 4 个角色挂件：忌炎（锐意 + 通变/明断/观势）、今汐（3 链谪仙 + 韶光 +2）、卡提希娅（2 链变奏 +1 层风蚀，需 `ctx.variationTarget`）、安可（变奏 +30 失序）
- [x] `combat.js` 清理不再使用的 import（`jiyanSwitchIn / jinhsiSwitchIn / cartethyiaErosionOnSwitchIn`）
- [x] 跑 `npx vitest run` —— 290 全部通过（2026-06-27）

---

### Step F：文档与机制注册表 README 同步

- [x] `enemyMechanics.js` 顶部加注释：说明 `suppressed` 是强制静音；新机制只在 `periodic/threshold/onHit` 三个 hook 内实现，不要自己起 hook；减伤/无敌走 `applyEnemyDefendHook`
- [x] `src/battle/stacks.js` `forms.js` `tempStats.js` `switchHooks.js` 顶部已有 JSDoc 说明对外接口，复核通过
- [x] 本文档每完成一步把对应 [ ] 改成 [x] 并写完成日期

## 进度日志

| Step | 状态 | 日期 | 备注 |
|---|---|---|---|
| A 破韧 suppressed | ✅ 完成 | 2026-06-27 | 290 测试通过；遗留 applyEnemyDefendHook 未接线 + dealDamage 内 inline 减伤，留 Step D |
| B Stack 原型 | ✅ 完成 | 2026-06-27 | 290 测试通过；stacks.js 实装 register/gain/consume/tick/render；忌炎锐意、卡提希娅决意已迁；安可失序按决策不迁 |
| C Form 原型 + 改名 | ✅ 完成 | 2026-06-27 | 290 测试通过；forms.js 实装 register/enter/exit/hasForm/onUnitSwitchOut；卡提希娅芙露德莉斯、安可黑咩迁过来；菲比 form 注册但 toggle 未接 dispatch（史遗留）；UI 走 displayName |
| D TempStat 原型 | ✅ 完成 | 2026-06-27 | 290 测试通过；tempStats.js 实装 apply/remove/compute/tick/has；enrage/ice_shield/wind_wall/flight/phase_transition/overclock 全部迁过来；dealDamage 走 applyEnemyDefendHook；UI 改读 TempStat 实例；菲比 toggleForm dispatch 接通；onUnitSwitchOut 接入 doSwitch |
| E SwitchHook | ✅ 完成 | 2026-06-27 | 290 测试通过；switchHooks.js 实装 register/fire；4 个角色挂件迁过来（忌炎/今汐/卡提希娅/安可）；doSwitch 删除 4 处 inline 调用，统一走 fireSwitchHook；ctx 携带 variationTarget |
| F 文档同步 | ✅ 完成 | 2026-06-27 | enemyMechanics.js 顶部补 suppressed 静音 + hook 收口说明；stacks/forms/tempStats/switchHooks JSDoc 复核 |

## 决策记录

- 2026-06-27：安可失序值（0-100）**不迁**到 Stack，需要的是"百分比累积到指定阈值再触发"，与"层数到 cap 触发"语义不同，强行收口会丢精度
- 2026-06-27：`_stunned` / `_vulnerable` / `vibrationBroken` 三者合并为 `suppressed` 一个状态，附 `suppressedVuln` 字段携带易伤率 —— 避免状态字段的语义重叠
- 2026-06-27：displayName 与 name 分层，防止单元测试和 log 字段因改名而失配

## 风险与回退

- 每步都跑 `npx vitest run` —— 失败立刻回退该步
- 旧字段保留一个过渡版本（如 `_stunned` 同时存在），所有迁移完成后统一清理
- `chains.before-port.js` `forte.before-port.js` 已是这种翻新风格的样板，参考同样手法