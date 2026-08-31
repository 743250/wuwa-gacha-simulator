# 鸣潮 · 唤取模拟器（AGENTS.md）

给 codex 等 AI 工具的协作说明，自包含。

## 一句话定位

基于 Vite + ES Modules 的网页版鸣潮 Gacha + 养成 + 战斗模拟器。抽卡/养成/战斗闭环：抽卡 → 养成 → 战斗 → 星声 → 抽卡。

> ⚠️ 免责声明：本项目为鸣潮主题的模拟器，不是官方战斗复刻。
> 抽卡概率/海市兑换/月相充值采用官方数据；战斗系统、敌人数值、共鸣链效果为
> 简化模拟；鸣潮真实战斗为动作 ACT，本模拟器为 AP 回合制；鸣潮无通用元素克制环，
> 本模拟器仅保留"敌人弱点 ×1.5"机制。

## 工具使用约定

### skill

- 完成一次改动后，运行 `/simplify` 审查本次改动（注意别动角色数值，见工作纪律）。
- 涉及提交/PR 前，运行 `/security-review` 检查安全问题（需在 git 仓库内）。

### 子代理

- **派出去**：跨文件搜证（如查某角色机制在战斗/UI/文案的所有引用）、
  按既定规则批量改文案/数值、跑 build / 测试并汇总、对照 `status.md` 验收标准核对。
- **自己做**：角色设计、机制取舍、数值平衡、文案措辞。
- 子代理回来**必须核验**：读 diff、跑 build / 测试，不盲信"已完成"。

### MCP

- 抓官方面板/技能/共鸣链数据时用 Playwright MCP 走无头浏览器
  （灰机 wiki / 库街区流程，见 `scripts/headless/README.md`）。

## 项目防坑（重要）

1. **git 对象库易碎**：`.git/objects` 的 packfile/loose object 是指向 `.l2s` 临时目录的符号链接，该目录被清空则 `git log/diff` 报 "Could not read"。**`git fetch` 修不了**。修复法：`git clone --no-checkout` 到临时目录 → 备份坏 `.git` → 拷新 `.git` → `git reset --mixed HEAD`。
2. **NODE_OPTIONS 是坏的**：跑 npm 前 `env -u NODE_OPTIONS`。
3. **banner 武器图构图**：用 `background-size:auto 100%; background-position:100% 40%`，别用宽度放大（会垂直裁武器）。
4. **改角色数值要谨慎**：工作纪律要求数值改动需按设计文档走，不随手调。

## 快速命令

```bash
env -u NODE_OPTIONS npm install
npm run dev        # 启动
npm run build      # 构建
```

## 核心文件

- `src/main.js` 入口 · `src/state.js` 全局状态 · `src/save.js` 存档
- `docs/status.md` 验收标准
- 数据采集用灰机 wiki / 库街区（`scripts/headless/README.md`）

## 文档分层（重要 · 不要混用事实来源）

四层文档，从上到下优先级递减。冲突时按这个顺序查证，**先查先问，不要擅自改**：

1. **设计层** · [docs/plans/](docs/plans/) — 模拟器抽象方案，是改代码的最终依据。
2. **官方资料层** · [docs/sources/](docs/sources/) — 角色面板/技能/共鸣链原文。
   **这是输入，不是目标**。
3. **当前实装** — 读了代码地图再改，看看现有 `src/battle/characters/*.js`
   怎么做的，照着做。
4. **本文件** — 工程向导，可能过时，**不是事实来源**。和上面三层冲突时先查证再问用户。

## 工作纪律（AI 必须遵守 · 优先级最高）

1. **每次提交必须署名**：commit message 末尾必须含
   `Co-Authored-By: Claude <noreply@anthropic.com>`。
2. **已实装角色的设计决策不可擅自修改**：角色机制/数值/公式/共鸣链效果一律不动，
   **无论看到什么官方数据**。看到官方数据和代码不一致时，**记录差异，报告用户**，
   等待决定。已发生过的越权：看官方 HP 公式就提议改 ATK、看某链不加治疗倍率就
   提议删自定义系数、重构时顺手改角色数值。
3. **设计文档 > 官方数据**：优先级是 ① 用户口头指示 → ② [docs/plans/](docs/plans/)
   设计文档 → ③ 当前实装代码 → ④ [docs/sources/](docs/sources/) 官方数据。
4. **子代理省额度**：繁琐/机械/纯查证类任务交给子代理；主代理是设计脑 + 监督者，
   **trust but verify**——读了 diff/测试结果才算数。
5. **角色「战斗验收」≠「代码落地」**：`status.md` 的战斗验收必须过 DoD
   （核心循环 / AP / 关键路径有数 / skillHints 数字=代码实算）。禁词扫描 + build
   通过不算验收。
6. **文案数字必须对代码**：链文案以 `registry.ts` effect 为准；技能 tab 以
   `skillHints` 对 `calcDamage`/hook 对账。禁止在 tooltip 写代码不存在的假倍率。
7. **横切契约优先于逐角文案批改**：变奏 dmgType、hook 参数顺序、HP 核倍率表等
   共享路径的 bug 先立项修，再扫角色。
8. **会话任务板只放活任务**：历史完成写 status 日志 / git，不堆在 Task 列表里。

## 战斗系统（要点）

- **AP 回合制**：每回合 4 AP，普攻 1 / 技能 1（CD3）/ 重击 2（CD1，opt-in）/
  解放 3 / 切换 0。编队 3 人一队。
- **解放双倍率**：主目标 700% / 副目标 350%（主目标 = UI 选中的敌人）；
  角色专属基底（如忌炎后动 715%）覆盖全局默认。
- **敌人弱点**：命中弱点 ×1.5（无通用元素克制环）。
- **共鸣链**：每链给战斗数值加成。

## 养成系统（上限）

| 维度 | 上限 | 消耗资源 |
|------|------|----------|
| 角色等级 | 1→90 | 共鸣促剂（简化 42.5 万经验） |
| 武器等级 | 1→90 | 武器突破石（~40 本/5 星） |
| 武器精炼 | 1→5 | 重复抽武器自动 +1 |
| 共鸣链 | 0→6 | 重复抽角色或用余波换 |

## 存档

- 自动保存到 localStorage（每次操作后）；商店 tab 底部有导出/导入按钮。
- `npm run build` 后 dist/ 目录可直接部署。

## 角色移植入口

**做新角色前必读** [docs/plans/角色设计指南.md](docs/plans/角色设计指南.md)
（覆盖五层移植流程 / 分级策略 / 前端文案规范 / 设计文档怎么写）。
各角色设计方案见 [docs/plans/characters/](docs/plans/characters/)，
状态进度见 [docs/plans/characters/status.md](docs/plans/characters/status.md)。

### 移植铁律（违反 = 严重错误）

1. **核心一个**：每角色一个核心机制，6 链都围绕这一个核心。
2. **文案 = 具体数值，tooltip = 公式**：凡是出现数字的地方都要有 tooltip 公式，
   没有"裸数"。
3. **时间统一用回合**：6-12 秒 ≈ 2 回合 / 14-24 秒 ≈ 3 回合 /
   25-30 秒 ≈ 4 回合 / 10 分钟 ≡ 每场战斗 1 次。
4. **术语必须可悬停**：资源/状态/召唤物/debuff/派生技能都进 `TERM_DICT`；
   新术语同时进 `CHAIN_TERM_PATTERNS`。
5. **不把核心机制藏进 tooltip**：技能介绍本体要说清形态怎么进/持续多久/怎么退出。
6. **共鸣链只在激活后显示**：`makeSkillLines` 的 followUp 用 `N 链：效果` 格式。
7. **重击 opt-in**：缺省无重击，需要才加 `hasHeavy: true`。
8. **玩家空间文案 ≠ 工作笔记**：禁用 `→` `+` `buff` `debuff` `core` 等速记。
9. **HP 核倍率校准**：HP 核角色普攻/技能/重击倍率必须按 HP/ATK 倍数比下调
   （基线 HP/ATK ≈ 8.7×）。
10. **共鸣链文案对着 chainEffects.js 实际效果逐字核对**，不编造不存在的机制。
11. **模拟器无声骸技能作为独立伤害类型**：`dmgType` 只有
    `normal/skill/heavy/burst` 四类；禁止出现"声骸技能伤害"表述。

### 分级实装深度

| 级别 | 文件改动 | 适用 |
|------|----------|------|
| **S 级** | characters/<角色>.js + combat.js + registry.ts 结构化 effect + customLines | 独特机制无法用工厂表达者 |
| **A 级** | registry.ts 标准 effect + makeSkillLines 配置 + 链文案 | 默认级别，大多数角色 |
| **B 级** | 简化 customLines + 链染色 | 4★ 边缘 / 不熟角色 |
| **C 级** | 仅 registry.ts fallback | 资料不足 / 低强度 |

**默认 A 级，不要动不动升 S**；B 级不是凑数，是承认暂时不懂这个角色。

## 数据采集源

| 源 | 可用性 | 用途 |
|----|--------|------|
| encore.moe API | ✅ 首选 | `https://api-v2.encore.moe/api/zh-Hans`，无认证。踩坑：根路径返空 HTML，必须加 `/api/`；武器键名大写、角色键名小写 |
| 灰机wiki | ✅ 无头浏览器 | `wuwa.huijiwiki.com`，CF 挡 curl，需无头 Chromium 过挑战；图片 CDN `huiji-public.huijistatic.com` 直连无防盗链 |
| B站 wiki API | ⚠️ 限速 | 2-3 次后 HTTP 567 封禁数小时，不可作校准源 |
| 库街区 API | ⚠️ 需 token | `api.kurobbs.com/wiki/core/*`，item 内容要 token |
| Fandom wiki | ❌ | 403 |

历史抓到的 10 个核心角色官方共鸣链 HTML 备份在
[docs/sources/chains/chains-extracted.json](docs/sources/chains/chains-extracted.json)。

## 版本

- `v0.1-pure-gacha` — 纯抽卡版（git tag + zip 备在 `backups/`）
- `v0.2` — 当前版（含养成+战斗）

- **自己做**：角色设计、机制取舍、数值平衡、文案措辞
- **派出去**：跨文件搜证、批量改文案、跑 build/test 汇总
- 子代理回来必须核验（读 diff、跑 build），不盲信"已完成"
