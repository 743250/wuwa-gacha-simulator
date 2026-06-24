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

- **AP 回合制**：每回合 3 AP，普攻 1 / 技能 2 / 解放 3 / 防御 1 / 切换 0
- **编队**：3 人一队
- **敌人弱点**：命中弱点 ×1.5（无通用元素克制环）
- **共鸣链**：每链给战斗数值加成（暴击/攻击/技能倍率/全队 buff 等）
- **敌人机制**：点燃全队/冻结/狂暴/护盾/召唤小弟/反弹
- **战斗指令**：普攻 / 共鸣技能（CD 2 回）/ 共鸣解放（满能量 AOE）/ 防御 / 切换角色

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

- **守岸人** —「星域」展开（治疗 + 增益）· 无重击
- **忌炎** —「锐意之势」攒势解放 · 6 链锐意上限 2→3，每层 +120%

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