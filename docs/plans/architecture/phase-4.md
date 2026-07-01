# Phase 4 优化计划

> 基于 2026-07-01 架构复查。Phase 3 计划（combat.js hook 收口 / render.js 拆分 / startEncounter / window 清理）仍然有效，本文件**只补 Phase 3 没识别的问题**。
> 优先级：先做 Phase 4 的 P0（零风险清理），再回到 Phase 3 第 0 步（combat hook 收口），二者配合。

## 复查发现（Phase 3 漏识别的 5 项）

| # | 问题 | 证据 | 影响 |
|---|---|---|---|
| 1 | **死代码 610 行滞留 src/** | `chains.before-port.js`(143) + `forte.before-port.js`(145) + `seq.original.js`(322) | `seq.original.js` 含"声骸技能伤害"违规文案，易被误 import |
| 2 | **`chains-extracted.json` 边界模糊** | `src/data/` 下，被 `chains.js:13` import 作 label 兜底 | 官方原文与模拟器数据混在 src/，本次弗洛洛文案 bug 的根因之一 |
| 3 | **`CHAIN_TERM_PATTERNS` 错位** | 共鸣链术语高亮逻辑放在 `src/ui/render/weaponDetail.js:193` | 新增术语要在武器文件里改，归属感混乱 |
| 4 | **存档字段命名混用** | `state.js` 里 `pity.eventChar`(驼峰) 与 `exp_low`/`weapon_book`/`echo_tuner`/`crystal_solvent`(下划线) 并存 | 字段搜索/迁移认知负担 |
| 5 | **forms/stacks/switchHooks 注册表未贯彻** | 2026-06-27 引入三个注册表，但只有 4 个角色用了 forms/stacks，6 个角色用了 switchHooks；其余 12 个角色仍在 combat.js 硬编码 `self.name === 'X'` | 半完成重构，新旧模式并存 |

**核心矛盾**：项目不是"没有抽象"，是"抽象做到一半停了"。已有的 `fireCharacterHook` / `forms` / `stacks` / `switchHooks` / `tempStats` 五个注册表就是事件总线雏形——Phase 3 子代理建议"推倒建 EventBus"会毁掉已有进度。Phase 4 的任务是**完成这次中断的重构**。

---

## P0：零风险清理（先做）

### P0.1 删 3 个死代码文件

```
src/battle/chains.before-port.js   # 旧版 chains 逻辑
src/battle/forte.before-port.js    # 旧版 forte 逻辑
src/data/seq.original.js           # 旧版共鸣链文案，含违规术语
```

验证：删后 `npm run build` 必须不挂（这 3 个文件不被任何模块 import）。

### P0.2 `chains-extracted.json` 移出 src/

它本质是**官方原始数据备份**，不是模拟器运行态数据。处理方式：

1. 移到 `docs/sources/chains/chains-extracted.json`（与 `docs/sources/characters/` 同级，归类为官方资料）
2. `chains.js:13` 删掉 `import OFFICIAL_CHAINS`
3. `chains.js:18-27` 的 `overrideToEffects` 函数——`label` 兜底改为读 `seq.js` 的链文案去标签，不再依赖官方 summary
4. 删除 `scripts/extract-chains.cjs`（库街区 API 已拒公开访问，脚本失效，仅留作历史参考移到 `scripts/_archive/`）

**收益**：消除"同一份数据两个 source of truth"——共鸣链文案唯一来源是 `seq.js`，官方原文不在代码路径上。

### P0.3 `CHAIN_TERM_PATTERNS` 移回 `terms.js`

`src/ui/render/weaponDetail.js:193-240` 的 `CHAIN_TERM_PATTERNS` + `highlightChainTerms` 是**共鸣链术语高亮逻辑**，与武器详情无关。搬回 `src/ui/terms.js`，与 `TERM_DICT` / `attachTermTips` 同文件。

`weaponDetail.js` 仅保留 `renderWeaponDetail` 一个 export。

### P0 验收

- `npm run build` 通过
- `npm test` 290 全绿
- 浏览器手动点开：共鸣链 tab（术语 tooltip 仍工作）、武器详情、弗洛洛 5 链文案（确认仍是模拟器版）

---

## P1：完成 forms/stacks/switchHooks 注册表贯彻

> 这是 Phase 3 第 0 步的**扩展**。Phase 3 只规划了 `fireCharacterHook` 的迁移（onAttack/onSkill/onBurst/turnCleanup），Phase 4 补三件事：

### P1.1 `switchHooks` 全员贯彻

当前已注册：忌炎、今汐、卡提希娅、安可、椿、赞妮（6 个）。
未注册但 combat.js 有硬编码 `if (self.name === 'X')` 切人逻辑的：检查 `combat.js` 的 `doSwitch` 函数，把所有 `self.name ===` 分支迁到 `registerSwitchHook`。

### P1.2 `forms` 注册表贯彻

当前已注册：卡提希娅（芙露德莉斯）、安可（黑咩）、菲比（赦罪/告解）。
未注册但有形态切换的角色：长离（心眼/宴御）、椿（含苞）、弗洛洛（指挥状态）、赞妮（灼焰）。
核对每个角色的形态切换逻辑，能迁到 `registerForm` 的就迁。**返回值型 hook 保留具名调用**（如 `chunHanbaoMult` / `zanYanHpMult`），按 Phase 3 第 0.3 节注释处理。

### P1.3 `stacks` 注册表贯彻

当前已注册：忌炎锐意、卡提希娅决意。
未注册但有叠层资源的角色：长离离火、椿含苞、弗洛洛余响、赞妮焰光、守岸人星域层数等。逐个核对，迁到 `registerStack`。

### P1 执行纪律

- **一次迁一个角色**，每次都跑 `npm test`
- 函数体逻辑**一字不动**，只改"取参方式"和"注册方式"
- 返回值型 hook（参与倍率/控制流）保留具名调用，或在 `characters/index.js` 加 `queryCharacterHook(self, name, ctx)` 直查模式
- 每迁一个角色 = 一个 commit

### P1 验收

- `combat.js` 顶部 14 个角色具名 import 减到 ≤5 个（仅保留返回值型）
- `combat.js` 里 `self.name ===` 硬编码 0 处
- 加一个新角色时，`combat.js` 零改动（只在 `characters/index.js` 注册 + 写角色文件）

---

## P2：拆分 render.js（继承 Phase 3 第 1 步）

按 Phase 3 第 1 步方案推进，无补充。优先级排在 P1 之后，因为 P1 完成后 combat.js 干净了，render.js 才是最大的剩余债。

---

## P3：存档字段命名统一（低优先级）

`state.js` 的 `materials` 子对象用下划线（`exp_low` / `weapon_book` / `echo_tuner` / `crystal_solvent` / `condensed_waveplate`），其他字段用驼峰。统一为驼峰。

### 执行方式

1. `state.js` 改字段名为驼峰（`expLow` / `weaponBook` / `echoTuner` / `crystalSolvent` / `condensedWaveplate`）
2. `save.js` 加一次 migration（`SAVE_VERSION` 2→3），旧存档读入时自动转换字段名
3. 全局 grep 替换所有引用（`S.materials.exp_low` → `S.materials.expLow` 等）

**风险**：存档迁移错一个字段就丢用户数据。必须有 migration 测试（save.test.js 加一条：v2 存档读入后 `materials.expLow` 正确）。

---

## 执行顺序

| 阶段 | 内容 | 预估工时 | 风险 |
|---|---|---|---|
| **P0** | 删死代码 + 移 chains-extracted.json + 移 CHAIN_TERM_PATTERNS | 1h | 极低 |
| **P1** | forms/stacks/switchHooks 全员贯彻 | 4-6h | 中（每角色一个 commit，测试兜底） |
| **P2** | 拆 render.js（Phase 3 第 1 步） | 2-3h | 中（人工验） |
| **P3** | 存档字段命名统一 | 1h | 中（需 migration 测试） |

**先做 P0**，立竿见影消除"半完成重构"留下的旧源干扰。然后 P1 是核心收益。P2/P3 可延后。

---

## 重要约束（继承 Phase 1/2/3，不变）

- 架构优化**不动角色数值/公式/共鸣链效果**——本计划全程只改"代码组织方式"
- hook 迁移只改"取参方式 + 注册方式"，函数体一字不动
- 重构中发现疑似 bug → 记录到 issue，**不顺手修**
- 官方资料 / 当前实装 / CLAUDE.md 冲突 → 记录差异，问用户

## 验证命令

```bash
npm test              # 290 测试必须全绿
npm run build         # 构建不挂
npm run smoke         # 战斗 smoke
npm run check:balance # 数值基准
```
