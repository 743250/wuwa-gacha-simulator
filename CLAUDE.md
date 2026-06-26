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
    seq.js      ← 共鸣链文案（40 角色）
    chains-extracted.json ← 官方共鸣链原文（95KB）

  gacha/        ← 抽卡核心
    core.js     ← 概率曲线、保底、卡池/波纹解析、角色/武器初始化
    actions.js  ← 单抽/十连/抽到五星 + 资源补足弹窗
    animation.js← 抽卡翻牌动画

  battle/       ← 战斗系统
    balance.js  ← 平衡常量中心（AP/倍率/削韧/星评/深塔水温）
    stats.js    ← 面板计算（攻击/暴击/元素/生命）
    template.js ← 角色定位模板（4 类）+ 元素映射
    elements.js ← 六元素抗性 + 震动伤害
    chains.js   ← 共鸣链→战斗效果（数值版，851 行）
    forte.js    ← 奏回路（角色专属资源条）
    weaponTriggers.js ← 武器被动触发
    enemies.js  ← 敌人数据库（含 BOSS 机制）
    enemyMechanics.js ← 敌人机制注册表（周期/阈值触发）
    combat.js   ← AP 回合制战斗引擎（731 行）
    dungeon.js  ← 副本配置
    characters/ ← 角色专属机制（S 级角色）
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
      skillHints.js  ← 角色技能 tooltip 定义（695 行）
      skillLines.js  ← 共鸣链文案行渲染
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

项目文档索引见 [docs/README.md](docs/README.md)。后续做角色/武器/敌人/副本时按以下来源优先级处理：

1. **官方资料层**：[docs/sources/](docs/sources/) 记录库街区/游戏内/官方公告的原文要点。
   - 角色官方资料：[docs/sources/characters/](docs/sources/characters/)
   - 官方角色索引：[docs/sources/characters/README.md](docs/sources/characters/README.md)
2. **强度榜层**：[docs/sources/tier-list.md](docs/sources/tier-list.md) 只用于数值天花板和 meta 强度，不替代官方技能文本。
3. **设计层**：[docs/plans/](docs/plans/) 记录模拟器 AP 回合制抽象（角色/敌人/机制/架构实施方案）。
   - 角色移植：[docs/plans/characters/](docs/plans/characters/)
   - 敌人移植：[docs/plans/enemies/](docs/plans/enemies/)
   - 游戏机制移植：[docs/plans/mechanisms/](docs/plans/mechanisms/)
4. **实现指南层**：本 CLAUDE.md 说明怎么工作、怎么改代码、tooltip 标准和移植路径。
5. **优化计划层**：[docs/plans/architecture/phase-2.md](docs/plans/architecture/phase-2.md) 记录架构/性能/模块化优化计划（Phase 1 已完成，Phase 2 当前）。

**硬规则**：
- CLAUDE.md 不是官方事实来源；它可能过时。
- 如果官方资料、当前实装、设计文档、CLAUDE.md 之间冲突，先查证并问用户，不要擅自改角色/武器/敌人机制和数值。
- 架构优化不能顺手改角色强度；数值/机制变更必须单独提出。

## 角色移植思路（重要 · 制作单个角色时按这个走）

详细的移植思路/研究流程/分级策略见 [docs/plans/README.md](docs/plans/README.md)（与用户讨论后定稿的实施计划）。此处只保留要点：

- 每个角色一个核心机制，6 条共鸣链都围绕加强这一个核心
- 文案 = 具体数值，tooltip = 计算公式（凡是出现数字的地方都要有 tooltip 公式）
- 专有名词加术语 tooltip（[src/ui/terms.js](src/ui/terms.js) `TERM_DICT`）
- 数值先查 [docs/sources/](docs/sources/) 官方资料，再看 [docs/plans/](docs/plans/) 模拟器抽象
- 重击是 opt-in（[src/battle/characters/index.js](src/battle/characters/index.js) `HAS_HEAVY_ROLES`）
- 官方/实装/文案冲突时先记录差异再问用户，不擅自改

每个角色的具体设计方案见 [docs/plans/characters/](docs/plans/characters/)。

### 技能/形态文案标准（别把核心机制藏进 tooltip）

1. **技能介绍本体必须说清核心机制**
   - 形态怎么进入、持续多久、怎么退出，要写在 `forteDesc` 和对应技能行里
   - tooltip 只做补充解释，不承担“唯一说明”
   - 反例：只在 `terms.js` 里解释安可黑咩，技能行不写持续多久 → 玩家看不懂

2. **共鸣链效果只在激活后显示**
   - `makeSkillLines` 的 followUp 文案使用 `N 链：效果` 格式
   - 未达到 N 链时隐藏；达到后显示金色 `[N链]`
   - 不要把 1 链效果当基础技能说明写给 0 链玩家看（曾经安可共鸣技能错误显示“普攻命中热熔 +3%/层”）

3. **时间统一用回合，不用秒**
   - 原版“持续 6/10/20/30 秒”要转成回合制表达
   - 大致映射：6-12 秒 ≈ 2 回合；14-24 秒 ≈ 3 回合；25-30 秒 ≈ 4 回合
   - 特殊长 CD（如 10 分钟）写成“每场战斗 1 次”

4. **术语必须可悬停**
   - 资源 / 状态 / 召唤物 / debuff / 派生技能 都要进入 `TERM_DICT`
   - 文案里必须用 `<b class="term-resource">术语</b>` 或同类 class 包起来，否则 `attachTermTips` 不会生效
   - 例：牵引、停滞、嘲讽、协同攻击、空中攻击、闪避反击、焕彩、迷失羔羊、冰绽 等

### 实现路径（按这个顺序做）

每个角色按 4-5 个文件改：

1. **[src/battle/chains.js](src/battle/chains.js) `CHAIN_BATTLE_EFFECTS[角色名]`**
   - 6 条链各一条 effect，effect 字段挂角色专属前缀（如 `jiyanXxx`）
   - 在 `applyChainBonuses` 末尾加对应 case，把参数挂到 `unit` 上

2. **[src/battle/combat.js](src/battle/combat.js) 战斗循环里**
   - 加角色专属 helper（如 `jiyanGainRuiyi`）和状态字段（如 `unit.ruiyi`）
   - 在 doAttack / doSkill / doHeavy / doBurst / doSwitch 相应位置挂钩
   - 如角色**有**重击，加进 `HAS_HEAVY_ROLES` 集合

3. **[src/data/chains-extracted.json](src/data/chains-extracted.json) 6 条链文案**
   - 保留官方 title，重写 summary + desc 为模拟器版本
   - 全部用 `<b class="term-xxx">` 染色

4. **[src/ui/render.js](src/ui/render.js) `SKILL_HINTS[角色名]`**
   - 用 `customLines: (stats, role) => [...]` 函数式输出 4-5 段技能
   - 文案直接写实际数值，tooltip 放公式
   - 如有重击，`hasHeavy: true`
   - `forteDesc` 写明角色循环节奏（"切人 → 技能 → 重击 → 满层解放"）

5. **[src/ui/terms.js](src/ui/terms.js) `TERM_DICT`**
   - 给该角色的专有名词加解释（资源 / 状态 / 标志性招式）

### 完成标准

- 角色界面打开，技能 tab 显示真实伤害数字，悬停看公式
- 共鸣链 tab 6 条文案都是模拟器版本，专有名词带虚线下划线
- 战斗中按钮 / buff 显示符合该角色机制（如守岸人没有重击按钮）
- 6 链满和 0 链时数值会变（动态算）
- 文案里出现的所有数字都有公式 tooltip，**没有"裸数"**

### 已完成

- **守岸人** —「星域」展开（治疗 + 增益）· 无重击 · **S 级 / SS-Tier**
- **忌炎** —「锐意之势」攒势解放 · 6 链锐意上限 2→3，每层 +120% · **S 级 / A-Tier**
- **吟霖** —「审判印记」标记型副C · 全队蹭印记目标 · 无重击 · **S 级 / B-Tier**（按 2026.6.18 实际强度榜下调）
- **2026-06-24 批量**：今汐 / 长离 / 折枝 / 相里要 / 椿 / 珂莱塔 / 洛可可 / 菲比 / 布兰特 / 坎特蕾拉 + 嘉贝莉娜 / 卡卡罗 共 12 个限定角色 · A 级（工厂版 customLines）· 1.1 → 2.2 限定全部完成
- **卡提希娅** —「标记 / 芙露德莉斯 / 风蚀」双形态主C · HP 核 · 双阶段解放 · **S 级 / SS-Tier** · 专属 237 行状态机
- **2026-06-24 第二批**：常驻 5★ 维里奈 / 安可 / 凌阳 / 鉴心 + 12 个 4★ 角色（莫特斐/散华/卜灵/丹瑾/白芷/秋水/炽霞/秧秧/桃祈/渊武/釉瑚/灯灯）共 **16 个**角色 · 全部用工厂版 customLines + chains.js CHAIN_BATTLE_EFFECTS · **2.2 前所有角色完成**
- **剩余**：2.3+ 角色（赞妮/夏空/露帕/弗洛洛/奥古斯塔/尤诺/仇远/千咲 等 8 个）+ 3.0+ 角色（琳奈/莫宁/爱弥斯/陆·赫斯/绯雪/达妮娅 等 12 个）

## 数据采集：从库街区抓官方共鸣链 / 技能（重要工具说明）

**库街区** (`wiki.kurobbs.com`) 是国服官方共建 wiki，**所有角色技能、共鸣链文案都在这里**。但它是 SPA（前端 JS 渲染），直接 `curl` 拿到的只是空壳 HTML，必须打它的 API：

```
POST https://api.kurobbs.com/wiki/core/catalogue/item/getEntryDetail
Headers:
  Content-Type: application/x-www-form-urlencoded
  wiki_type: 9            ← 鸣潮 wiki id（必填，不带它会 220 报错）
Body:
  id=<entryId>            ← 例如守岸人是 1286814658335739904
```

返回 JSON 里 `data.content.modules[1].components[0/1].content` 就是技能 / 共鸣链的官方 HTML（含 `<span class="Highlight">` 染色标记，可直接拿来做高亮）。

### entryId 怎么找

每个角色页 URL 形如 `wiki.kurobbs.com/mc/item/<entryId>`，直接抄即可。或批量拉列表：

```bash
curl -sL -X POST "https://api.kurobbs.com/wiki/core/catalogue/item/getPage" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "wiki_type: 9" \
  -d "catalogueId=1105&page=1&limit=200"
# catalogueId=1105 = 共鸣者目录
# 每条记录的 content.linkId 就是 entryId（长整型字符串）
```

### 已抓到的 10 个核心角色（位于 [src/data/chains-extracted.json](src/data/chains-extracted.json)）

| 角色 | entryId | 角色 | entryId |
|---|---|---|---|
| 忌炎 | 1240073643014045696 | 卡提希娅 | 1370471621924728832 |
| 今汐 | 1249040336606580736 | 菲比 | 1309523456688947200 |
| 长离 | 1262882649069621248 | 嘉贝莉娜 | 1415137052791296000 |
| 椿 | 1302065018502307840 | 卡卡罗 | 1242295483584421888 |
| 守岸人 | 1286814658335739904 | 珂莱塔 | 1321977849344999424 |

### 重新批量抓取（如官方更新文案后）

```bash
mkdir -p ~/char-data
# 对每个角色 entryId 做：
curl -sL -X POST "https://api.kurobbs.com/wiki/core/catalogue/item/getEntryDetail" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "wiki_type: 9" \
  -d "id=<entryId>" -o ~/char-data/<角色名>.json

# 然后用提取脚本生成可直接被 chains.js import 的 JSON：
node scripts/extract-chains.cjs ~/char-data
cp ~/char-data/chains-extracted.json src/data/chains-extracted.json
```

`scripts/extract-chains.cjs` 会：
1. 解析每个角色 JSON 的 `data.content.modules[1].components[1].content`（共鸣链表格 HTML）
2. 按 `<tr>` 切分 6 链
3. 把官方 `<span class="Highlight">` 标记转成模拟器自己的 `<b class="term-xxx">` 染色（共鸣技能/解放/变奏/重击/普攻/资源条名 各一色）
4. 输出 `chains-extracted.json`：`{ "角色名": [{title, summary, desc}, ...] }`

### 战斗折算 vs 文案显示

- **文案显示**（角色界面 → 共鸣链 tab）：10 个角色都用官方原文（chains-extracted.json）
- **战斗折算**（attack/skill/burst 真实加 buff）：目前只有**守岸人**做了结构化覆写（在 [src/battle/chains.js](src/battle/chains.js) 的 `CHAIN_BATTLE_EFFECTS`）；其他 9 个角色文案虽然是官方原文，但战斗中仍走文案正则的简化折算
- 想给其他角色也做结构化战斗机制：参考守岸人的 `CHAIN_BATTLE_EFFECTS['守岸人']`，列出 6 条 `[{effect, value, ...}]` 即可，combat.js 会按 effect 类型读取

## 版本

- `v0.1-pure-gacha` — 纯抽卡版（git tag + zip 备在 `backups/`）
- `v0.2` — 当前版（含养成+战斗）