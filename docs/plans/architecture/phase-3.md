# Phase 3 优化计划

> 基于 2026-06-29 架构复查。Phase 2 已完成测试安全网（290 个测试全绿）、chains 数据/逻辑分离、scripts 归档。
> Phase 3 聚焦 **Phase 2 未落地的三项** + **一个 Phase 2 没识别的新问题：combat.js 的角色 hook 霰弹耦合**。

## Phase 2 现状盘点（2026-06-29 复查）

| Phase 2 步骤 | 状态 | 说明 |
|---|---|---|
| 1. 测试框架 | ✅ 已完成 | `vitest`，15 个测试文件，290 个测试通过 |
| 2. 拆分 render.js | ❌ **未做** | render.js 不降反升：1086 → **1349 行** |
| 3. 拆分 chains.js | ✅ 已完成 | `chainEffects.js`（565 行）已独立 |
| 4. startEncounter 统一入口 | ❌ **未做** | `createBattle` 仍被 4 个文件直接调用 |
| 5. 清理 window 桥接 | ❌ **未做** | 仍有 174 处 `window.x=`、92 处内联 onclick |
| 6. 清理 scripts/ | ✅ 已完成 | `scripts/_archive/` 已建，11 个一次性脚本归档 |

**结论**：Phase 2 完成了"加测试 + 拆数据 + 清脚本"这三件低风险的，留下了三件需要动调用方的（render 拆分、统一入口、window 清理）。Phase 3 把这三件接上，并新增最高优先级的 combat.js 解耦。

---

## 第 0 步：combat.js 角色 hook 收口（优先级最高 · Phase 2 漏识别）

> **这是当前架构最大的债，也是收益最高的一步。**

### 0.1 问题

[src/battle/combat.js](../../src/battle/combat.js)（1274 行）顶部硬编码了 **14 个角色模块的 30+ 个具名 import**（combat.js:26-35），并在 `doAttack` / `doSkill` / `doBurst` / `endTurn` 里**无条件逐个调用**每个角色的专属函数：

```js
// doBurst 内现状（combat.js:815-820 节选）
encoreStartBlackSheep(self, battle);
shorekeeperStarfield(self, battle);
kakaroEnterDeathblade(self, battle);
brantFlameDirge(self, battle);
zhezhiSummonField(self, battle);
```

每个函数内部第一行都在自问"我是不是这个角色"（`if (self.name !== '安可') return`）。结果：

- **加一个 S 级角色 = 改引擎三处**（import + 各 do* 里加一行调用），违反开闭原则。
- 引擎对角色数量**线性膨胀**，combat.js 注定越来越长。
- 与 CLAUDE.md「架构优化不动角色行为」纪律相冲突——因为引擎和角色绑死，每次碰引擎都有误伤角色的风险。

### 0.2 已有的正确基础设施（只差接线）

[src/battle/characters/index.js](../../src/battle/characters/index.js) 早已建好派发器，注释白纸黑字写着"避免 combat.js 直接 import 各角色模块"：

```js
export function fireCharacterHook(self, hookName, ctx) {
  const fn = getCharacterMechanic(self.name)?.[hookName];
  if (typeof fn === 'function') fn(self, ctx);
}
```

各角色 default export 也已暴露 hook 键（[yinlin.js](../../src/battle/characters/yinlin.js) 末尾）：

```js
export default {
  name: '吟霖', hasHeavy: false,
  onHit: yinlinOnHit, burst: yinlinBurst, turnCleanup: yinlinTurnCleanup
};
```

**迁移是接线，不是重写。** combat.js 已经 import 了 `fireCharacterHook`（combat.js:24），却几乎没用它。

### 0.3 迁移配方（一次迁一类 hook，每次都跑 `npm test`）

**最先迁 `turnCleanup`——5 行整齐排列，零分支，是最安全的练手样板。**

当前（combat.js:1190-1194，已在 `team.forEach(t => ...)` 内）：

```js
yinlinTurnCleanup(t, battle);
encoreTurnCleanup(t, battle);
cartethyiaTurnCleanup(t, battle);
kakaroTurnCleanup(t, battle);
zhezhiTurnCleanup(t, battle);
```

改为一行：

```js
fireCharacterHook(t, 'turnCleanup', { battle });
```

**关键前提**：上面 5 个角色的 default export 必须都用 `turnCleanup` 键，且函数签名统一为 `(self, ctx)`，内部从 `ctx.battle` 取 battle。逐个核对：

1. 打开 `characters/<角色>.js`，确认 default export 里有 `turnCleanup: xxxTurnCleanup`。缺的补上。
2. 把函数签名从 `(self, battle)` 改成 `(self, ctx)`，函数体内 `battle` → `ctx.battle`。**只改签名取值方式，不改任何逻辑/数值。**
3. combat.js 删掉那 5 行具名调用 + 顶部对应 import。
4. `npm test` —— 必须仍然 290 全绿。combat.test.js / chains.test.js 就是这一步的安全网。

迁完 `turnCleanup` 后，按同样配方推进其余 hook，**每类一个 commit**：

| hook 名 | combat.js 调用点 | 涉及角色 |
|---|---|---|
| `turnCleanup` | endTurn 循环 (1190-1194) | 吟霖/安可/卡提希娅/卡卡罗/折枝 |
| `onAttack` | doAttack (620-633) | 折枝/卡提希娅/安可/吟霖 |
| `onSkill` | doSkill (661-702) | 守岸人/卡提希娅/忌炎/安可/吟霖/珂莱塔/折枝 |
| `onBurst` | doBurst (722-836) | 忌炎/卡提希娅/安可/守岸人/卡卡罗/布兰特/折枝/坎特蕾拉 |

> ⚠️ **不要一次全迁。** `doBurst` 里有 `cartethyiaBurstErosion` 这种**返回值参与后续倍率计算**的 hook（combat.js:729），不能简单塞进 `fireCharacterHook`（它丢弃返回值）。这类"有返回值/影响控制流"的 hook **保留具名调用**，或给 `fireCharacterHook` 加一个返回值变体 `queryCharacterHook(self, name, ctx)`。先迁纯副作用的（turnCleanup / onAttack / 大部分 onSkill），有返回值的最后单独处理。

### 0.4 验收标准

- combat.js 顶部 14 行角色 import 显著减少（有返回值的少数保留）。
- 加一个**纯副作用**新角色时，combat.js **零改动**——只在 `characters/index.js` 的 `FULL` 注册 + 写角色文件。
- `npm test` 290 全绿；`npm run smoke` 通过。

---

## 第 1 步：拆分 render.js（1349 行，Phase 2 第 2 步顺延）

Phase 2 写过详细方案（见 [phase-2.md](phase-2.md) 第 2 步），但未执行，且文件还长了。方案不变，仍按"一次拆一个函数、签名不变只搬家"推进：

1. `renderCharDetail()`（最大最独立，~300 行）→ `render/charDetail.js`
2. `renderGachaArea()` → `render/gachaArea.js`
3. `renderCharBlocks()` + `renderStats()` → `render/charBlocks.js` + `render/stats.js`
4. 剩余 `renderExchange` / `renderShop` / `renderLog` 小块

每拆一个：从 render.js 删函数体 → 改成 import 调用新文件 → 手动开浏览器点一遍对应面板（render 层无单测，必须人工验）。

---

## 第 2 步：统一战斗入口 startEncounter（Phase 2 第 4 步顺延）

`createBattle` 现被 4 个文件直接调用（combat.js 自身 / abyss.js / wastes.js / ui/battle.js）。方案见 [phase-2.md](phase-2.md) 第 4 步，不变：

在 combat.js 新增 `startEncounter(config)` 作为唯一对外入口，abyss / wastes / ui/battle 改调它。收益：以后改 `createBattle` 签名只改一处；战斗入口可统一挂结算/统计 hook。

> 这一步可以和第 0 步配合：统一入口后，"战斗开始时触发各角色 onBattleStart hook"也能用 `fireCharacterHook` 统一派发。

---

## 第 3 步：window 桥接清理（Phase 2 第 5 步顺延 · 增量推进）

174 处 `window.x=` 一次清完风险高、收益散。**改为增量策略**：

- **存量不动**：现有内联 onclick 先留着，能跑。
- **增量收紧**：从今往后**新写的 UI 一律用事件委托**——在根容器挂一个监听器，按钮用 `data-action="xxx"`，禁止再新增 `window.x=` 和内联 `onclick`。
- 把这条写进 CLAUDE.md「移植铁律」，让它成为默认规范，存量随重构（如第 1 步拆 render）时顺带迁移。

---

## 第 4 步：小清理（低风险 · 随手做）

1. **`addRole`/`addWeapon` 的 undefined 兜底已冗余**（[core.js](../../src/gacha/core.js):243-247、263-266）。save.js 的 `deepMerge(state0(), data)` 已保证老存档字段补全，这串 `if (o.x === undefined)` 是历史遗留。删除前先确认 save.js 的 migrate 路径覆盖了所有这些字段，再清。
2. **`rate()` 曲线常量外提**（[core.js](../../src/gacha/core.js):59-65）。65/70/75 拐点和 .04/.08/.10 斜率是硬编码魔数。挪进 [balance.js](../../src/battle/balance.js) 或新建 `gacha/rateConfig.js`，做单一调参点。**注意**：core.test.js:19-54 锁了这条曲线的精确值，改完这些测试必须仍绿——它们就是这步的安全网。

---

## 优先级总结

| 步骤 | 预估工时 | 影响 | 风险 |
|---|---|---|---|
| 0. combat.js hook 收口 | 2-3h | 🔴 关键——根治引擎随角色膨胀 | 中（有 290 测试兜底，按 hook 分批可控） |
| 1. 拆分 render.js | 2-3h | 🟡 重要——1349 行拆 6 块 | 中（render 无单测，靠人工点） |
| 2. startEncounter | 0.5h | 🟢 改善——统一战斗入口 | 低 |
| 3. window 增量清理 | 持续 | 🟢 改善——止血为主 | 低 |
| 4. 小清理 | 0.5h | 🔵 整洁 | 极低（测试锁定） |

**建议顺序**：0 → 4 →（2 与 1 任选）→ 3。
第 0 步先行，因为它收益最高、且 Phase 2 的测试安全网正是为这种重构准备的。第 4 步顺手清，给后续腾干净空间。

---

## 重要约束（继承 Phase 1/2，不变）

- 架构优化**不等于**角色数值调整。本计划全程**不改任何角色的伤害/倍率/公式/共鸣链效果**。
- hook 迁移时**只改函数取参方式**（`(self, battle)` → `(self, ctx)`），函数体逻辑一字不动。
- 拆文件**只搬家 + 改 import**，不动内部逻辑、不动 UI 样式。
- 重构中发现疑似 bug → 记录到 issue 列表，**不顺手修**（违反 CLAUDE.md 工作纪律）。
- 官方资料 / 当前实装 / CLAUDE.md 冲突 → 记录差异，问用户。

## 验证命令

```bash
npm test              # 290 测试必须全绿——重构的硬门槛
npm run build         # 构建不挂
npm run smoke         # 战斗 smoke
npm run check:balance # 数值基准
```
