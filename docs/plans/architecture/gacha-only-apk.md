# 抽卡 APK · 工程备忘

**活任务在根目录 [TODO.md](../../../TODO.md)。**

完整模拟器（含战斗、副本）继续留在本仓库，启动路径不要拆掉。这里只追加一条给玩家的抽卡包。

参考图：`gacha-analysis-reference/screen-1.jpg` … `screen-6.jpg`。

## 分阶段

### P0 · 识图后复刻抽卡分析 ✅ 已完成（2026-09-11）

对照 6 张参考图改 UI。扩展 `src/gacha/analysis.js`。新建分析页，不把现有 StatsTab 硬改没。不改抽卡概率。

落点：

- 数据层 `src/gacha/analysis.js` 新增 `detailedHistory`（逐金明细 + 同池窗口四星陪跑，单遍 O(n)）、`computePoolGroups`（限定 / 专武 / 常驻 / 联动四组汇总）、`historyTier`（抽数分档）。
- 素材 `src/ui/assets/roleHead.ts` —— 仓库原本只有立绘没有头像；从 encore `api/zh-Hans/character` 的 `RoleHeadIcon` 生成，快照存 `docs/sources/characters/encore-rolelist.json`。
- UI `src/ui/panels/gacha/AnalysisTab.tsx`，挂到唤取页侧栏第 4 个 tab「分 析」。
- **待校准**：`HISTORY_TIERS`（超欧/欧/中/超非 的抽数线）与头部文案是按参考图目测定的近似值，社区工具的真实口径待用户确认。

### P1 · 同仓库抽卡入口（额外一条，不是替换）

- 目录 `gacha-apk/`（仓内子目录，**共享 `src/`，不复制源码**）
- `npm run dev:gacha` / `npm run build:gacha`
- `npm run dev` 仍是完整版（抽卡 + 战斗 + 副本）
- 抽卡入口只挂：时间线、唤取、角色、海市、商店、分析、存档
- 抽卡入口不挂冒险 / 战斗；源码仍保留给完整版

### P2 · 抽卡版角色静态资料

见 TODO 缺口表。禁止为清宵 / 景燃编造倍率和 chain effect。

### P3 · 抽卡版商店文案

抽卡包里不要「去副本」死链。完整版背包可以继续指向副本。

### P4 · APK

只打包 `build:gacha`。
