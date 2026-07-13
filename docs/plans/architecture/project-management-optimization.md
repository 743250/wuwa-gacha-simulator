# 项目管理优化计划

> 状态：**本轮完成**（2026-07-13）  
> 性质：工程与交付流程，不改角色数值意图  
> 背景：文档分层与模块边界已够用，但「已实装」定义过宽、验收靠人工记忆、任务板混历史流水，导致公式/AP/变奏类 bug 在声称审核后仍被玩家点穿。

## 1. 问题诊断（只记结论）

| 症状 | 根因 |
|---|---|
| status 全 ✅，玩家仍踩 AP=0 / 假倍率 | 「完成」= 文件齐了，不是战斗+公式过账 |
| 任务板 50+ 已完成项占屏 | 会话 Task 当流水账，没有活看板 |
| 关键词审计绿、tooltip 仍错 | 管了措辞/禁词，没管「展示数 = 代码实算」 |
| 同类 bug 多角色重复出现 | 横切契约（变奏 dmgType、hook 顺序）没立项 |
| 批量塞角色后质量崩 | 无强制角色 DoD，子代理「做完」被盲信 |

## 2. 角色完成定义（DoD）

任一角色在 `status.md` 标「战斗验收 ✅」前，必须全部满足：

1. **核心循环可打通**（含形态/资源进退）
2. **AP 消耗与设计一致**（含 0 费解放等特殊路径）
3. **链 0 与满链**各至少一条关键路径有数（伤害量级或资源变化）
4. **`skillHints` 展示数 = `calcDamage` / hook 实算**（禁止只做禁词扫描）

`status.md` 拆两列：

- **代码落地**：机制文件 / registry / skillHints / terms 已挂上
- **战斗验收**：过 DoD；未过写 `未验收` 或 `部分（说明）`

## 3. 看板规则

- 会话 Task **只放本轮活任务**（目标 ≤ 12 条）
- 历史完成项不进 Task；进度写 `status.md` 日志或 git log
- 优先级固定：
  1. **P0 横切战斗契约**（所有 HP 核 / 所有角色共享路径）
  2. **S 级战斗验收**（按清单逐个）
  3. **文案源归属收口**（文档 + 门禁，不批量改文案除非对账失败）
  4. 架构大 refactor **内容债清完前冻结**（`next-refactor-execution-guide.md` 仍挂起）

## 4. 文案源归属（摘要）

完整规则见 [../copy-ownership.md](../copy-ownership.md)。

| 源 | 职责 | 不是 |
|---|---|---|
| `registry.ts` | 链 effect + 玩家链文案 | 技能 tab 公式 |
| `skillHints.js` | 技能 tab 展示与 tooltip 公式 | 第二份链数值真相 |
| `terms.js` | 术语悬停解释 | 倍率表 |
| `docs/plans/characters/*` | 设计意图；落地后标对齐/有意偏离 | 运行时第三份文案 |

验收：**数字对代码**，不是「没有违禁词」。

## 5. 执行阶段

### Phase A — 流程基建

- [x] 本文档
- [x] `docs/plans/copy-ownership.md`
- [x] `status.md` 增加代码落地 / 战斗验收列；S 级标验收状态
- [x] `CLAUDE.md` 链到本文 + copy-ownership；补交付铁律摘要
- [x] 会话 Task 收口为活任务（历史 completed 可删）

### Phase B — P0 横切

- [x] **HP 核变奏路径**：`doSwitch` 用 `dmgType:'variation'`；HP 核按设计变奏 HP% × (multiplier/0.8)
- [x] 最小回归：`tests/battle/hp-core-variation.test.js`
- [x] 已知共享债登记（§8 本轮已收口或立项）

### Phase C — S 级 + 工厂战斗验收

已验收（完整或最小 DoD）：卡提希娅、弗洛洛、奥古斯塔、千咲、赞妮、仇远、尤诺、夏空、露帕、嘉贝莉娜、椿、长离、守岸人、忌炎、吟霖、今汐、折枝、相里要、珂莱塔、洛可可、菲比、布兰特、坎特蕾拉；3.x 十人最小 smoke。

### Phase D — 门禁

- [x] 统一 smoke：`tests/battle/accepted-s-smoke.test.js` + `charDoD.js`
- [x] lint：`tests/lint/skillHints-no-draft.test.js`
- [x] `charDoD` helpers（forceEnergy/Forte/Stack/expectNoFlatDoubleCount）
- [x] 忌炎/吟霖/今汐/折枝完整单测 + 工厂剩余 + **卡提/弗洛洛补全** + **3.x smoke**

## 6. 本轮明确不做

- 不开 state/gacha 大拆（见 `next-refactor-execution-guide.md`，**仍冻结**）
- 不批量重写 3.x 设计文档
- 不因官方 wiki 擅自改已定数值（冲突只记录）
- 不把「build 通过」当成战斗验收
- 不实现通用 skill charge 运行时（仅立项文档）

## 7. 验收本计划本身

- [x] 活看板可读、status 两列存在、copy-ownership 可链
- [x] HP 核变奏 P0 有代码 + 测试
- [x] 角色验收严格走 DoD（含卡提/弗洛洛从「部分」升全 ✅）
- [x] §8 共享债：可修的已修，不可本轮的有文档立项

## 8. 共享债登记

| 债 | 状态 | 说明 |
|---|---|---|
| hook 签名不一致 | **已文档化** | [character-hook-conventions.md](character-hook-conventions.md)：fire vs query |
| `allDmgUp` 等 buff | **已审计** | [damage-buff-types.md](damage-buff-types.md)；`allDmgUp` 已进 damage.js |
| 角色级 repro 模板 | **已抽** | `tests/battle/helpers/charDoD.js` |
| skillHints 工厂 220% 重击 | **规则固化** | 通用重击 = 220% 合法；**终结/替换重击**必须 `customLines`（尤诺/夏空/卡提等）；工厂 hasHeavy 角色按标准 220% 验收 |
| 敌人/技能旧 `type:'erosion'` | **已迁主路径** | `actions.js` forte erosion → `addErosion`；`enemyMechanics` aero_erosion → wind_erosion；武器条件/UI 兼容双读 |
| 2 充能技能未通用 | **立项** | [skill-charge-system.md](skill-charge-system.md) 脚手架，本轮不接线 |
