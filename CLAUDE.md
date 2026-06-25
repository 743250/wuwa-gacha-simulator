# 鸣潮 · 唤取模拟器

基于 Vite + ES Modules 的网页版鸣潮 Gacha + 养成 + 战斗模拟器。

> ⚠️ **免责声明**：本项目为**鸣潮主题的模拟器**，不是官方战斗复刻。
> - 抽卡概率/海市兑换/月相充值采用官方数据
> - 战斗系统、敌人数值、共鸣链效果为**简化模拟**，不代表游戏内真实战斗
> - 鸣潮真实战斗为动作 ACT，本模拟器为 AP 回合制
> - 鸣潮**无通用元素克制环**，本模拟器仅保留"敌人弱点 ×1.5"机制
> - 部分敌人/副本/深塔奖励数据为**模拟器自定义**，已尽量贴近游戏术语

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
index.html     ← HTML 骨架（~130 行）
styles/
  main.css     ← 全部样式（暗色鸣潮主题）

src/
  main.js      ← 入口，事件绑定，所有面板联动
  state.js     ← 全局状态 S() + 工具函数（$ / msg / fmt / date / pick）
  save.js      ← localStorage 存档 + 导出/导入 JSON
  modal.js     ← 通用弹窗

  data/         ← 纯数据（无逻辑）
    chars.js    ← 角色/武器名、卡池名称
    phases.js   ← 卡池时间表 1.0–3.4
    seq.js      ← 共鸣链文案（40 角色）

  gacha/        ← 抽卡核心
    core.js     ← 概率曲线、保底、卡池/波纹解析、角色/武器初始化
    actions.js  ← 单抽/十连/抽到五星 + 资源补足弹窗
    animation.js← 抽卡翻牌动画

  battle/       ← 战斗养成
    template.js ← 角色定位模板（4 类）+ 元素映射
    elements.js ← 六元素克制环
    chains.js   ← 共鸣链→战斗效果（数值版）
    enemies.js  ← 敌人数据库（含 BOSS 机制）
    combat.js   ← AP 回合制战斗引擎
    dungeon.js  ← 副本配置

  equip/        ← 装备养成
    weapons.js  ← 武器数据库（所有 3/4/5 星武器）
    actions.js  ← 升级/装备/卸下武器

  daily/        ← 日常系统
    stamina.js  ← 体力（结晶波片）
    commission.js ← 每日委托（4 个）
    abyss.js    ← 逆境深渊（10 层）

  shop/         ← 商店
    actions.js  ← 月相充值、礼包、月卡

  exchange/     ← 海市
    coral.js    ← 余波/残振珊瑚、波段兑换、波纹购买

  time/         ← 时间推进
    timeline.js ← +1日/下一期/下版本 + 体力补满/委托重置

  ui/           ← UI 渲染
    render.js   ← 主渲染（顶栏/卡池/抽卡区/统计/海市/商店/记录/角色方块）
    teambuilder.js ← 编队面板（3 人）
    battle.js   ← 战斗全屏 UI（HP/AP/技能按钮/日志）
    dungeon.js  ← 副本选择面板
    abyss.js    ← 深渊 10 层面板
    daily.js    ← 日常委托面板
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

## 角色移植思路（重要 · 制作单个角色时按这个走）

> 守岸人是第一个**完整移植**的范例，忌炎是第二个。后续每个角色都按这个套路。

### 设计原则

1. **每个角色一个核心机制**，不要用通用模板，这个核心思路一般参照鸣潮原作者思路
   - 守岸人 → 「星域」展开（治疗 + 增益）
   - 忌炎 → 「锐意之势」攒势-解放终结
   - 所有 6 条共鸣链都围绕**加强这一个核心机制**，不是堆数值

2. **文案 = 具体数值，tooltip = 计算公式**（铁律）
   - ❌ 错："对目标造成 100% 攻击力的衍射伤害"
   - ✅ 对："对目标造成 309 点衍射伤害"，悬停 309 看公式 `= 攻击 309 × 100%`
   - 数值随角色面板 / 共鸣链动态计算，文案动态生成
   - tooltip 用 `<span class="tip" data-tip='公式'>`（虚线下划线）
   - **凡是出现数字的地方都要有 tooltip 公式**，否则会"露出来"显得没做完

3. **专有名词加术语 tooltip**
   - 「锐意之势」「破阵值」「星域」「协奏」「变奏」等
   - 在 [src/ui/terms.js](src/ui/terms.js) `TERM_DICT` 加一条解释
   - 文案用 `<b class="term-resource">锐意之势</b>` 染色后会**自动**被包成 `.tip-term` 触发悬停

4. **共鸣链文案要重写**（chains-extracted.json）
   - 库街区抓来的官方文案太长太啰嗦，且常引用模拟器没实装的复杂状态
   - 仿守岸人 / 忌炎在 chains-extracted.json 里**用模拟器版本重写**
   - 保留 6 个官方标题（"济世 / 通变 / 观势 …"），描述按模拟器实装写
   - 数值要和 chains.js 的 effect、combat.js 的实装**三处对齐**

5. **数值要对照鸣潮原版，不要凭空发挥**
   - 反例：曾经凭空给守岸人 1 链加了"增益强度 ×2.5"——是错的
   - 1 链官方只是"时长延长 + 切人不消散"，**没有放大数值**
   - 不确定的写法宁可保守，**不要瞎加倍率**

6. **重击是 opt-in，不是 opt-out**
   - **需要重击的角色**才加 `hasHeavy: true` flag
   - 默认所有角色都没有重击，避免误伤
   - **战斗 UI 同步**：[src/ui/battle.js](src/ui/battle.js) 技能按钮区根据 `cur.hasHeavy` 动态布局 —— 有重击 4 列、无重击 3 列（重击按钮整列移除，**不留灰按钮**）；面板顶部 banner 的"重击 2AP/CD1"也按 hasHeavy 动态显隐

### 移植前研究流程（重要 · 先理解再抽象）

> 角色移植不是把每个技能逐字复刻。先理解原版设计意图，再决定模拟器保留哪一个核心。

每个角色开工前按这个顺序查：

1. **先看完整技能组**（不是只看共鸣链）
   - 库街区 `getEntryDetail` 里 `modules[1].components[0]` 是技能介绍，`components[1]` 是共鸣链
   - 必须确认：资源怎么攒、形态怎么进入、持续多久、怎么退出、哪些按钮会被替换
   - 反例：安可不能只看 5/6 链；她的核心其实是「失序值 + 黑咩大暴走替换普攻/技能/重击」，不是单纯“解放 AOE”

2. **再看 6 条共鸣链**
   - 共鸣链标题和数值必须来自 `src/data/seq.js` 或库街区官方文案
   - 禁止编标题、编倍率、编机制（曾经把安可 5/6 链写成不存在的“万圣？开 party！”/“约定？指头钩！”——这是错误）

3. **最后看玩家评价 / 强度榜**
   - 用 [docs/tier-list.md](docs/tier-list.md) 确定数值天花板
   - 可参考玩家常见评价判断“这个角色最有记忆点的玩法是什么”（如安可是黑咩爆发窗口，莫特斐是协同，维里奈是后台治疗）
   - 评价只用于理解手感，不可替代官方技能文本

4. **决定模拟器抽象层级**
   - 问题不是“原版有几个动作”，而是“模拟器要保留哪个核心决策”
   - ACT 里的闪避、空中段、二段技能、0.5 秒窗口，通常要折成 AP 回合制里的 1 个资源 / 1 个状态 / 1 个按钮派生
   - 不要为了“完整还原”给每个角色写专属状态机；游戏会撑不住

### 移植分级策略（重要 · 不要所有角色都按守岸人级别做）

> 38 个角色都按守岸人级别（5 文件 + customLines + CHAIN_BATTLE_EFFECTS）会有两个问题：
> 1. 工作量爆炸（~8000 行新代码），错率高（凭空 ×2.5 那种）
> 2. 我们对部分次要角色的机制不熟，硬写 customLines 就是瞎编

按重要程度分三级，**逐级降级是诚实，不是偷懒**：

| 级别 | 文件改动 | 完成度 | 适用角色 |
|---|---|---|---|
| **S 级**（守岸人 / 忌炎）| chains.js + combat.js + chains-extracted.json + render.js customLines + terms.js | 结构化战斗 effect + 公式 tooltip + 重写 6 链 + 专属 helper | 真 SS/S 级核心角色 / 独特机制不可用工厂表达者，≈ **8~10 人** |
| **A 级**（工厂完整）| chains-extracted.json + chains.js 标准 effect + render.js `makeSkillLines` 配置 + terms.js | 公式 tooltip + 官方口吻链文案 + 标准 effect；不写专属 combat helper | 大多数限定 / 常驻强角 / 玩法能用通用 AP 模型表达者，≈ **20+ 人** |
| **B 级**（最小化）| chains-extracted.json（官方标题 + 简洁染色）+ SKILL_HINTS 简单 intro/normal/skill/burst | 文案染色 + 术语 tooltip；技能区只有简介 | 4★边缘角色 / 不熟的新角色 / 3.x 后期暂不深入者 |
| **C 级**（只收录）| 不新增机制，只保留 seq.js 原文或 fallback | 可以抽到和升级，但不承诺真实机制 | 明显低强度或资料不足角色 |

**升降级原则**：
- 先默认 A 级工厂完整，不要动不动升 S
- A→S 是可以升级的：只有当“这个角色的核心决策无法用 makeSkillLines + 标准 effect 表达”时才升
- S 级不是奖励强度，而是奖励“机制必要性”：守岸人星域、忌炎锐意这种才值得专属 helper
- B 级**不是凑数**，是承认我们暂时不懂这个角色的真实玩法。瞎编 customLines 比"裸数文案+染色"更糟
- 数值不熟就保守 → "宁可保守，不要瞎加倍率"

详细的每个角色设计稿（核心机制 / 6 链作用 / 数值表）见 [docs/character-design.md](docs/character-design.md)。
真实游戏强度榜（SS/S/A/B/C 分档 · 数值天花板对照表）见 [docs/tier-list.md](docs/tier-list.md) —— **每次设计新角色前先查这表**，不要凭印象排 tier（曾经把吟霖排 T1.5 实际只是 B-Tier）。

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
- **2026-06-24 批量**：今汐 / 长离 / 折枝 / 相里要 / 椿 / 珂莱塔 / 洛可可 / 菲比 / 布兰特 / 坎特蕾拉 + 重做卡提希娅 / 嘉贝莉娜 / 卡卡罗 共 13 个限定角色 · A 级（工厂版 customLines）· 1.1 → 2.2 限定全部完成
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