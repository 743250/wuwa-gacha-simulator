# 鸣潮 · 唤取模拟器 — SPEC(项目愿景)

> 这份文档回答「我们要把项目做成什么样子」。
> 工程事实（结构/索引/纪律）见 CLAUDE.md；改动决策记录见 log.md。

## 一句话愿景

一个跑在浏览器里的鸣潮主题「抽卡 + 养成 + 回合制战斗」模拟器：
数据贴近官方、玩法为简化模拟、可打成单个 HTML 分享给朋友点开就玩。

## 核心定位（不变的三条）

1. **网页单机模拟器**：Vite + Preact + DOM/CSS，免安装，存档在 localStorage。
2. **数据驱动**：卡池/角色/敌人/文案全进数据层，领域逻辑（gacha/battle/data）与 UI 严格分离，由边界测试保障。
3. **玩法是简化模拟，不是复刻**：战斗是 AP 回合制（官方是 ACT）；无元素克制环，只保留弱点×1.5。数据改动遵守「设计文档 > 官方数据」优先级。

## 目标形态

### 现在（v0.2 · 已达成）
- 抽卡：概率/保底/卡池时间表 1.0–3.4 / 海市换抽
- 养成：角色等级 / 武器 / 共鸣链（数据/战斗效果/文案三源合一）
- 战斗：AP 回合制 + 副本 / 逆境深塔 / 冥歌海墟 + 敌人机制
- 系统：商店/月卡/电台/邮件/存档导出导入

### 近期（下一批）
- **美术**：卡池大图（encore.moe `RolePortrait`）+ 版本宣传图（官方 Kuro CDN）→ 填进 `src/ui/assets/art.ts`
- **音频**：出货音效 / BGM → 填进 `src/ui/assets/audio.ts`，翻牌动画已接好 hook
- 排掉 8 个历史失败测试（podcast 日志校准 / skillHints / BattleView×5 / BagPanel）

### 理想形态（远期）
- 完整角色库：4.x 全角色分级实装（A 级为主，S 级只给独特机制）
- 更丰富的战斗表现：粒子/转场按需加 PixiJS 画布层（只渲染特定屏，UI 仍归 Preact）
- 多存档 / 成就 / 图鉴 / 分享码

## 明确不做（边界，防止膨胀）

- 不做真实 ACT 战斗，保持 AP 回合制
- **不引入完整游戏引擎**（Godot / Unity / Phaser 全量迁移都不做）——本项目是数据驱动模拟器，DOM/CSS + Preact 就是这个类型的正确工具；换引擎是"为了轮子而造轮子"
- 不改官方数值（官方是输入，模拟器决定怎么做以设计文档为准）

## 技术债务（已知，排期处理）

- `styles/main.css` 已拆成 `styles/modules/` 16 个模块，入口只做 `@import` 编排（2026-08-31）
- 弹窗已统一 Preact；翻牌动画已改 `createElement`。残留 `innerHTML` 仅用于 tooltip / 技能文案（含 `<b>` 公式）和容器清空
- JS/TS 混用：允许，新代码优先 TS。battle 层 54 个 js / 2 个 ts，**不批量改名**（会误伤角色数值路径）
- 单文件构建（`build:single`）与图片/音频内联的体积权衡
- 主 chunk 836 kB：`vite.config.js` 已写明 src 交叉依赖，硬拆会引入 circular chunk。`character-lore` 已动态 import。等 AppShell / init 边界再收口后再评估
- `docs/sources/enemies/encore-enemies.json` 6.1MB 是官方原文快照（269 条），运行时走 `src/battle/enemies.js`（84KB）。属资料层，保留入库
