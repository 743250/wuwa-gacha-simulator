# 声骸系统集成计划

> 2026-06-25 · 计划阶段，待实施

## 背景

目前模拟器有抽卡→养成→战斗→星声的闭环，但缺少声骸这个核心养成维度。当前角色的 50%-70% 面板来自声骸（攻击/暴击/暴伤/属性伤害），没有声骸意味着面板数值远低于真实水平。

目标：加入声骸系统但不含声骸技能（主动技能），保留套装效果、主词条/副词条、装备/卸下、升级调谐、数据坞等级。

前置文档：[声骸系统官方数据](../official/echo-system.md)

## 架构总览

与武器系统平行：

```
    weapons: {}        (旧)     echos: []          (新)
    role.equipWeapon   (旧)     role.equipEchoes[]  (新, 5 格)
    weaponContrib()    (旧)     echoContrib()       (新)
    applyBonus()       (共用)   applyBonus()        (共用)
    fireTrigger()      (共用)   fireTrigger()       (共用)
```

## 实施步骤

### Step 1: 数据定义 — `src/data/echoSets.js` + `src/data/echoes.js`

**`src/data/echoSets.js`** — 套装定义（16 套）

```js
export const ECHO_SETS = [
  { id: 'frost', name: '凝夜白霜',
    bonus2: [{ type: 'elem_dmg', element: '冷凝', value: 0.10 }],
    bonus5: [{ type: 'elem_dmg', element: '冷凝', condition: 'normalOrHeavyHit', value: 0.10 }] },
  // ... 熔山裂谷、彻空冥雷、啸谷长风、沉日劫明、浮星祛暗、不绝余音、隐世回光、轻云出月、出谷黄莺
  // 新套：深渊暗流、永辉圣域、凛冽寒渊、雷音贯宇、岚息流转、焚焰灼天
];
```

**`src/data/echoes.js`** — 声骸目录（~30 只重要声骸，不收录全部 100+）

```js
export const ECHO_CATALOG = [
  { id: 'feilian', name: '飞廉之猩', cost: 4, set: 'wind', element: '气动',
    mainStatPool: ['crate','cdmg','atk_pct','hp_pct','def_pct','heal_bonus'] },
  // ... COST 4: 无常凶鹭、燎照之骑、朔雷之鳞、鸣钟之龟、哀声鸷、云闪之鳞、无冠者、赫卡忒、角、辉萤军势、凯尔匹、梦魇系列
  // COST 3: 紫/绿/红/冰/衍射/湮灭 羽鹭、石像守门人等 (每元素 1-2 只)
  // COST 1: 幼狼、遁地者、奏者、小蘑菇等 (每元素 1 只)
];
```

### Step 2: 状态扩展 — `src/state.js`

在 `state0()` 的 `roles: {}, weapons: {}, log: [],` 后追加：

```js
echos: [],                           // [{ id, name, cost, set, level, mainStat:{type,value}, subStats:[{type,value}], lock, equippedBy, equipSlot }]
echoNextId: 1,                       // 自增 ID
dataBankLevel: 8,                    // 数据坞等级（默认 8 = 金 100%，COST 上限 11）
```

在 `addRole()` 函数中追加：

```js
equipEchoes: [null, null, null, null, null],  // 5 个声骸槽，存 echo.id
```

### Step 3: 声骸逻辑 — `src/equip/echoActions.js`

| 函数 | 作用 |
|------|------|
| `generateEcho(name)` | 创建新声骸：随机主词条 + 4 个随机副词条（固定中值），加入 `S.echos` |
| `equipEcho(roleName, slot, echoId)` | 装备到角色第 slot 格（0-4），自动算总 COST，超限拒绝 |
| `unequipEcho(echoId)` | 从角色卸下 |
| `getEquippableEchoes(roleName)` | 返回未装备的声骸 |
| `calcTotalCost(roleName)` | 计算角色已装备总 COST |
| `levelUpEcho(echoId, count)` | 升级（消耗经验书），每 5 级解锁一个副词条 |
| `recycleEcho(echoId)` | 分解回收经验+调谐器 |

核心原则：**不实现声骸技能**（取消主动释放）。COST 上限由数据坞等级决定（默认 11，最大 12）。

### Step 4: 战斗统计集成 — 修改 `src/battle/stats.js`

新增 `echoContrib(roleName)`，返回 `{ bonuses, setActive, triggers }` 结构。

在 `computeBattleStats()` 的武器块之后插入声骸加成，所有 bonus 走现有的 `applyBonus()` 函数。

新增返回值字段：`stats.echoStats`（声骸贡献明细）、`stats.echoSetBonuses`（已激活套装）。

### Step 5: 战斗伤害集成 — 修改 `src/battle/combat.js`

在 `calcDamage()` 的 `collectWeaponBonus` 旁边加入 `collectEchoBonus()`，将结果合并到同一 `wb` 变量。不需要改伤害公式结构。

在 `createTeamUnit()` 中注入 `unit.echoTriggers`，在 `doAttack/doSkill/doBurst/endTurn` 等钩子中同步触发套装条件效果。复用 `weaponTriggers.js` 的 `fireTrigger`/`collectWeaponBonus`/`tickWeaponTriggers`。

### Step 6: UI — 角色面板声骸 Tab

在 `src/ui/render.js` 的 `TABS` 数组追加 `{ id: 'echo', icon: '💠', label: '声骸' }`。

5 格声骸槽布局：每格显示声骸名、COST、主词条、套装名。点击空格→弹声骸选择器，点击已装备→详情+卸下/升级。底部汇总：总 COST / 上限、已激活套装效果。

### Step 7: UI — 声骸仓库面板

在 `src/ui/bag.js` 的武器区块后追加声骸仓库区。每张卡片：名称、COST、等级、主词条、副词条、套装色标、装备角色名。操作按钮：卸下、升级、分解、锁定。

### Step 8: UI — 战斗套装提示

在 `src/ui/battle.js` 的 `renderBuffStripe()` 中追加套装 buff 标签，格式："凝夜白霜 2/5" 或 "凝夜白霜 5/5 ✦"。

### Step 9: 测试

| 测试文件 | 覆盖内容 |
|---------|---------|
| `tests/equip/echoActions.test.js` | 生成、主词条池合法性、装备/卸下、COST 计费、升级 |
| `tests/data/echoSets.test.js` | 套装数据完整性、声骸目录引用完整性 |
| `tests/battle/stats.test.js` 追加 | echo 加成通过 computeBattleStats 生效 |
| `tests/battle/combat.test.js` 追加 | 套装效果在战斗中生效 |

### Step 10: CLAUDE.md 更新

在项目文档索引中加一条声骸系统说明。

---

## 对模拟器的影响分析

### 正面

- **养成深度**：新增"赌词条"的长期目标，填补终局内容
- **面板真实度**：角色面板更接近真实水平，平衡性更可控
- **资源消耗**：星声→体力→刷声骸→升级/调谐，增加资源循环节点
- **战斗策略**：套装效果的触发条件让配队有更多维度

### 风险

| 风险 | 程度 | 对策 |
|------|------|------|
| **面板膨胀** | 高 | 声骸提供 50-70% 面板 → 同步提升敌人数值（+1.5-2x HP） |
| **代码复杂度** | 中 | ~800 行 JS，架构已通过武器系统验证，风险可控 |
| **存档体积** | 低 | 每个声骸 ~200B，100 个仅 20KB |
| **数据平衡** | 高 | 先上简化版（固定词条值），稳定后再开随机 |

### 数值推演

90 级五星角色预估：

| 属性 | 目前 | +5★武器 | +声骸 | 备注 |
|------|------|---------|-------|------|
| 攻击 | ~400 | ~1000 | ~1600-1800 | 声骸约 +60% |
| 暴击率 | 5% | 5-24% | 30-50% | COST4 头 22% |
| 暴击伤害 | 150% | 150% | 200-240% | COST4 头 44% + 副词条 |
| 属性伤害 | 0% | 0-30% | 30-60% | COST3 杯 30% + 套装 10-15% |

角色伤害约为当前 **2-3 倍**，深塔/敌人数值需对应上调。

---

## 关键文件清单

| 文件 | 操作 |
|------|------|
| `src/data/echoSets.js` | **新建** — 套装数据库 |
| `src/data/echoes.js` | **新建** — 声骸目录 |
| `src/equip/echoActions.js` | **新建** — 声骸动作逻辑 |
| `src/state.js` | 追加状态字段 |
| `src/battle/stats.js` | 追加 `echoContrib()` |
| `src/battle/combat.js` | calcDamage 集成 echo 加成 |
| `src/battle/weaponTriggers.js` | 复用 |
| `src/ui/render.js` | 追加声骸 modal tab |
| `src/ui/bag.js` | 追加声骸仓库区 |
| `src/ui/battle.js` | renderBuffStripe 追加套装提示 |
| `src/gacha/core.js` | addRole 加 equipEchoes |
| `tests/equip/echoActions.test.js` | **新建** |
| `tests/data/echoSets.test.js` | **新建** |
| `tests/battle/stats.test.js` | 追加 |
| `tests/battle/combat.test.js` | 追加 |
| `docs/official/echo-system.md` | 已有 |

## 分阶段建议

**Phase 1 — 核心可用**（~800 行）：数据定义 → 状态/动作 → 统计集成 → UI role tab → 测试

**Phase 2 — 增强**（按需）：仓库完整筛选、词条随机浮动、战斗套装动画、数据坞经验、无音区产出

## 验证方案

1. `npm test` — 全部测试通过
2. 角色面板 → 声骸 tab → 装备/卸下 → 重开确认持久化
3. 进入战斗 → buff 区显示套装效果
4. 旧存档加载 → 自动获得 `echos:[]`（deepMerge），不报错不丢数据
