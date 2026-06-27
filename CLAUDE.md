# 鸣潮 · 唤取模拟器

基于 Vite + ES Modules 的网页版鸣潮 Gacha + 养成 + 战斗模拟器。

> ⚠️ **免责声明**：本项目为**鸣潮主题的模拟器**，不是官方战斗复刻。
> - 抽卡概率/海市兑换/月相充值采用官方数据
> - 战斗系统、敌人数值、共鸣链效果为**简化模拟**，不代表游戏内真实战斗
> - 鸣潮真实战斗为动作 ACT，本模拟器为 AP 回合制
> - 鸣潮**无通用元素克制环**，本模拟器仅保留"敌人弱点 ×1.5"机制
> - 部分敌人/副本/深塔奖励数据为**模拟器自定义**，已尽量贴近游戏术语


https://encore.moe/monster/340000291?lang=zh-Hans 敌人数据来源

## 核心玩法闭环

```
抽卡 → 养成（等级/武器/共鸣链）→ 战斗（副本/深渊）→ 星声 → 抽卡 ↑
```

## 快速上手

```bash
# 安装依赖（首次）
npm install

# 启动（浏览器自动打开）
npm run dev

# 或双击开始游戏.bat（自动检测依赖）
```

## 架构

```
index.html     ← HTML 骨架（~222 行）
styles/
  main.css     ← 全部样式（暗色鸣潮主题，~51KB）

src/
  main.js      ← 入口，事件绑定，所有面板联动（218 行）
  state.js     ← 全局状态 S() + 工具函数（$ / msg / fmt / date / pick）
  save.js      ← localStorage 存档 + 导出/导入 JSON
  modal.js     ← 通用弹窗

  data/         ← 纯数据（无逻辑）
    chars.js    ← 角色/武器名、卡池名称
    phases.js   ← 卡池时间表 1.0–3.4
    seq.js      ← 共鸣链文案（seqText，模拟器版）
    chains-extracted.json ← 库街区抓到的 10 个核心角色官方原文备份（历史参考）

  gacha/        ← 抽卡核心
    core.js     ← 概率曲线、保底、卡池/波纹解析、角色/武器初始化
    actions.js  ← 单抽/十连/抽到五星 + 资源补足弹窗
    animation.js← 抽卡翻牌动画

  battle/       ← 战斗系统
    balance.js  ← 平衡常量中心（AP/倍率/削韧/星评/深塔水温）
    stats.js    ← 面板计算（攻击/暴击/元素/生命）
    template.js ← 角色定位模板（4 类）+ 元素映射
    elements.js ← 六元素抗性 + 震动伤害
    chains.js   ← 共鸣链→战斗效果（applyChainBonuses 等）
    chainEffects.js ← CHAIN_BATTLE_EFFECTS 结构化 effect 表（角色专属数值覆写）
    forte.js    ← 奏回路（角色专属资源条）
    weaponTriggers.js ← 武器被动触发
    enemies.js  ← 敌人数据库（含 BOSS 机制）
    enemyMechanics.js ← 敌人机制注册表（周期/阈值触发）
    combat.js   ← AP 回合制战斗引擎（731 行）
    dungeon.js  ← 副本配置
    characters/ ← 角色专属机制文件（S 级专属，1 对 1 文件）
      index.js  ← 注册表/派发（getCharacterMechanic / hasHeavy / fireHook）

  equip/        ← 装备养成
    weapons.js  ← 武器数据库（所有 3/4/5 星武器，678 行）
    actions.js  ← 升级/装备/卸下武器

  daily/        ← 日常系统
    stamina.js  ← 体力（结晶波片）
    commission.js ← 每日委托（4 个）
    abyss.js    ← 逆境深塔（3 区 · 危险区三塔 12 层 + 28 天周期 + 活力系统）
    wastes.js   ← 冥歌海墟（积分制 + 信物选择 + 焚潮）
    weekly.js   ← 周本限制

  podcast/      ← 电台（先约调频）
    core.js     ← 电台逻辑

  shop/         ← 商店
    actions.js  ← 月相充值、礼包、月卡

  exchange/     ← 海市
    coral.js    ← 余波/残振珊瑚、波段兑换、波纹购买

  time/         ← 时间推进
    timeline.js ← +1日/下一期/下版本 + 体力补满/委托重置 + 版本/日期跳转

  ui/           ← UI 渲染
    render.js   ← 主渲染入口（1086 行，待拆分见 Phase 2）
    render/     ← 渲染子模块
      skillHints.js  ← 角色技能 tooltip 定义（SKILL_HINTS）
      skillLines.js  ← 共鸣链文案行渲染 + makeSkillLines 工厂
      utils.js       ← 工具函数
    battleRenderers/
      buffRenderers.js ← Buff 显示注册表
    teambuilder.js ← 编队面板（3 人）
    battle.js   ← 战斗全屏 UI（HP/AP/技能按钮/日志）
    dungeon.js  ← 副本选择面板
    abyss.js    ← 深塔面板（三塔分区 + 活力显示）
    daily.js    ← 日常委托面板
    wastes.js   ← 冥歌海墟面板
    bag.js      ← 仓库面板
    podcast.js  ← 电台面板
    terms.js    ← 术语词典（tooltip 悬停）
```

## 战斗系统

> ⚠️ 本战斗系统**不复刻鸣潮真实玩法**，是回合制简化版

- **AP 回合制**：每回合 4 AP，普攻 1 / 技能 1（CD3）/ 重击 2（CD1，opt-in）/ 解放 3 / 切换 0
- **编队**：3 人一队
- **解放双倍率**：主目标 400% / 副目标 200%（主目标 = UI 选中的敌人）。修正了旧版"300% / 3AP"实际收益不如 3 普攻的问题
- **敌人弱点**：命中弱点 ×1.5（无通用元素克制环）
- **共鸣链**：每链给战斗数值加成（暴击/攻击/技能倍率/全队 buff 等）
- **敌人机制**：点燃全队/冻结/狂暴/护盾/召唤小弟/反弹
- **战斗指令**：普攻 / 共鸣技能（CD 3 回 · 180%）/ 重击（CD 1 回 · 220% · opt-in）/ 共鸣解放（满能量 · 主 400% / 副 200%）/ 切换角色

## 养成系统

| 维度 | 上限 | 消耗资源 | 说明 |
|---|---|---|---|
| 角色等级 | 1→90 | 共鸣促剂（初/中/高/特四档） | 模拟器简化为 42.5 万经验 |
| 武器等级 | 1→90 | 武器突破石 | ~40 本/5 星武器 |
| 武器精炼 | 1→5 | 重复抽武器自动 +1 | - |
| 共鸣链 | 0→6 | 重复抽角色或用余波换 | 每链给战斗加成 |

## 资源产出

| 活动 | 主要产出 | 体力 |
|---|---|---|
| 日常委托（4 个）| ~80 星声 + 共鸣促剂 | 0 |
| 经验副本 | 高级共鸣促剂×6（30 体力档）| 10-30 |
| 武器副本 | 武器石×14（30 体力档）| 20-30 |
| 周 BOSS | 共鸣促剂+武器石+星声 | 30（周限 3）|
| 逆境深塔 10 层 | ~1700 星声（月重置）| 0 |

## 存档

- 自动保存到 localStorage（每次操作后）
- 商店 tab 底部有导出/导入按钮
- `npm run build` 后 dist/ 目录可直接部署

## 鸣谢

- 所有角色/武器/共鸣链数据来自鸣潮官方
- 战斗系统为模拟器原创简化版，非官方

## 文档分层（重要 · 不要混用事实来源）

四层文档，从上到下优先级递减。冲突时按这个顺序查证，**先查先问，不要擅自改**：

1. **设计层** · [docs/plans/](docs/plans/) — 模拟器抽象方案，是改代码的最终依据。角色在 [docs/plans/characters/](docs/plans/characters/)，敌人/机制/架构同理。
2. **官方资料层** · [docs/sources/](docs/sources/) — 角色面板/技能/共鸣链原文在 [docs/sources/characters/individual/](docs/sources/characters/individual/)。强度榜在 [docs/sources/tier-list.md](docs/sources/tier-list.md)。**这是输入，不是目标**。
3. **当前实装** — 读了下面”代码地图”再改。看看现有 `src/battle/characters/*.js` 怎么做的，照着做。
4. **本 CLAUDE.md** — 工程向导。可能过时，**不是事实来源**。如果它和上面三层冲突，先查证再问用户。

总索引见 [docs/README.md](docs/README.md)。

## 工作纪律（AI 必须遵守 · 优先级最高）

违反任意一条都是严重错误，不是小疏漏。

1. **每次提交必须署名**：commit message 末尾必须含 `Co-Authored-By: Claude <noreply@anthropic.com>`。

2. **已实装角色的设计决策不可擅自修改**：角色机制/数值/公式/共鸣链效果一律不动，**无论看到什么官方数据**。看到官方数据和代码不一致时，**记录差异，报告用户**，等待决定。严禁因”贴近官方”擅自改数值公式；架构优化时严禁顺手改角色行为和数值。已发生过的越权：
   - ❌ 看官方说 HP 公式就提议把 ATK 改成 HP
   - ❌ 看官方说某链不加治疗倍率就提议删自定义系数
   - ❌ 重构时顺手改角色数值

3. **设计文档 > 官方数据**：冲突时优先级是 ① 用户口头指示 → ② [docs/plans/](docs/plans/) 设计文档 → ③ 当前实装代码 → ④ [docs/sources/](docs/sources/) 官方数据。官方是”官方怎么做的”，设计文档是”模拟器决定怎么做”。

## 角色移植入口

**做新角色前必读** [docs/plans/角色设计指南.md](docs/plans/角色设计指南.md)（覆盖五层移植流程 / 分级策略 / 前端文案规范 / 设计文档怎么写）。下面只留代码层索引，规范以指南为准。

各角色的具体设计方案见 [docs/plans/characters/](docs/plans/characters/)，状态进度见 [docs/plans/characters/status.md](docs/plans/characters/status.md)。

### 代码地图 · 一个角色要碰的文件

| 文件 | 用途 |
|---|---|
| [src/battle/characters/](src/battle/characters/) `<角色名>.js` | S 级专属机制（状态机/双形态）；A 级工厂一般不需要这个文件 |
| [src/battle/characters/index.js](src/battle/characters/index.js) `getCharacterMechanic` / `HAS_HEAVY_ROLES` | 注册表 / 重击开关 |
| [src/battle/chainEffects.js](src/battle/chainEffects.js) `CHAIN_BATTLE_EFFECTS[角色名]` | 6 链的结构化战斗 effect（数值版） |
| [src/battle/chains.js](src/battle/chains.js) `applyChainBonuses` | 按 effect 类型分发到 unit；未列在 chainEffects 的角色走文案正则兜底 |
| [src/battle/combat.js](src/battle/combat.js) | AP 回合制引擎，挂钩 doAttack/doSkill/doHeavy/doBurst/doSwitch |
| [src/battle/forte.js](src/battle/forte.js) `FORTE[角色名]` | FORTE 资源条配置 |
| [src/data/seq.js](src/data/seq.js) `seqText[角色名]` | 共鸣链 6 条文案（模拟器版） |
| [src/ui/render/skillHints.js](src/ui/render/skillHints.js) `SKILL_HINTS[角色名]` | 技能 tab 文案（工厂版用 `makeSkillLines` 见 [src/ui/render/skillLines.js](src/ui/render/skillLines.js)） |
| [src/ui/render.js](src/ui/render.js) `CHAIN_TERM_PATTERNS` | 让术语在共鸣链里也能悬停 |
| [src/ui/terms.js](src/ui/terms.js) `TERM_DICT` | 术语词典（资源/状态/招式名） |

### 移植铁律（违反 = 严重错误）

下面是规范要点，完整版见上面”角色设计指南”第 4 节。

1. **核心一个**：每角色一个核心机制，6 链都围绕这一个核心。
2. **文案 = 具体数值，tooltip = 公式**：凡是出现数字的地方都要有 tooltip 公式，没有”裸数”。例”对目标造成 309 点衍射伤害”，悬停 309 看 `= 攻击 309 × 100%`。
3. **时间统一用回合**：6-12 秒 ≈ 2 回合 / 14-24 秒 ≈ 3 回合 / 25-30 秒 ≈ 4 回合 / 10 分钟 ≡ 每场战斗 1 次。
4. **术语必须可悬停**：资源/状态/召唤物/debuff/派生技能都进 `TERM_DICT`，文案用 `<b class=”term-xxx”>术语</b>` 包起来；新术语同时进 `CHAIN_TERM_PATTERNS`。
5. **不把核心机制藏进 tooltip**：技能介绍本体要说清形态怎么进/持续多久/怎么退出。
6. **共鸣链只在激活后显示**：`makeSkillLines` 的 followUp 用 `N 链：效果` 格式，未达 N 链隐藏。
7. **重击 opt-in**：缺省无重击，需要才加 `hasHeavy: true`，战斗 UI 按 `cur.hasHeavy` 动态布局。
8. **玩家空间文案 ≠ 工作笔记**：禁用 `→` `+` `buff` `debuff` `core` `叠层` `爆发解放机` 等速记。intro 只写身份（`元素 · 武器 · 定位 · 「核心机制名」`），不替玩家分析强度。通用机制（如风蚀效应）不标角色专属。
9. **HP 核倍率校准**（卡提希娅范式）：HP 核角色的普攻/技能/重击倍率必须按 HP/ATK 倍数比下调（基线 HP/ATK ≈ 8.7×），否则”普攻反超大招”。详见角色设计指南第 3 层。
10. **共鸣链文案对着 chainEffects.js 实际效果逐字核对**，不编造代码中不存在的机制。

### 分级实装深度

| 级别 | 文件改动 | 适用 |
|---|---|---|
| **S 级**（专属状态机）| characters/<角色>.js + combat.js + chainEffects.js 结构化 effect + customLines 手写 + 链文案 | 真正的 SS/S 级、独特机制无法用工厂表达者，≈ 8~10 人 |
| **A 级**（工厂完整）| chainEffects.js 标准 effect + `makeSkillLines` 配置 + seq.js 链文案 | 默认级别，大多数限定/常驻强角 |
| **B 级**（最小化）| 简化 customLines + 链染色 | 4★ 边缘 / 不熟 / 3.x 后期暂不深入 |
| **C 级**（只收录）| 仅 seq.js fallback | 资料不足 / 明显低强度 |

**默认 A 级，不要动不动升 S**：A→S 仅在”核心决策无法用 makeSkillLines + 标准 effect 表达”时升。S 级奖励机制必要性，不奖励强度。B 级不是凑数，是承认暂时不懂这个角色 —— **瞎编 customLines 比裸数文案+染色更糟**。已实装角色见 [status.md](docs/plans/characters/status.md)。

## 数据采集源（拉官方面板/技能/共鸣链）

| 源 | 可用性 | 用途 |
|----|--------|------|
| **encore.moe API** | ✅ 首选 | 完整角色/武器/敌人数据，无认证。`Base URL: https://api-v2.encore.moe/api/zh-Hans`。<br>踩坑：根路径返 Nuxt 空 HTML，必须加 `/api/`；武器键名大写 `Level/Value`、角色键名小写 `level/value`。已抓存档见 `docs/sources/characters/encore-full-data.json`、`docs/sources/weapons/encore-full-data.json` |
| B站 wiki 渲染页 | ⚠️ 备选 | 单条查证 |
| B站 wiki API | ⚠️ 限速 | 2-3 次后 HTTP 567 封禁数小时；武器索引页约 20 把类型错误，不可作校准源 |
| 库街区 API | ❌ | 需认证，2026-06 起 `getEntryDetail`/`getPage` 都拒公开访问 |
| Fandom wiki | ❌ | 403 |

历史抓到的 10 个核心角色的官方共鸣链 HTML 备份在 [src/data/chains-extracted.json](src/data/chains-extracted.json)；提取脚本 [scripts/extract-chains.cjs](scripts/extract-chains.cjs) 用来解析库街区返回 HTML→染色 JSON。encore.moe 是新数据源首选；库街区脚本仅留作历史参考。

## 版本

- `v0.1-pure-gacha` — 纯抽卡版（git tag + zip 备在 `backups/`）
- `v0.2` — 当前版（含养成+战斗）