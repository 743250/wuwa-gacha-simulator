# 纯抽卡 APK · 工程备忘

**活任务在根目录 [TODO.md](../../../TODO.md)，不要只看这一页。**

下面是分阶段拆分，给开工时对照。参考图：`gacha-analysis-reference/screen-1.jpg` … `screen-6.jpg`。

## 分阶段

### P0 · 识图后复刻抽卡分析

- 对照 6 张参考图逐块标注再改 UI。
- 扩展 `src/gacha/analysis.js`：分池、总消耗、生涯评分、出金时间线。不改抽卡概率。
- 新建分析页，不要把现有 StatsTab 硬改到面目全非。
- 补计算测试。验收：并排对照参考图，不允许「差不多」。

### P1 · 同仓库纯抽卡入口

- `index.gacha.html` + `src/gacha-app/main.js`
- `npm run dev:gacha` / `npm run build:gacha`
- 只挂：时间线、唤取、角色、海市、商店、分析、存档
- 不挂：冒险、编队、日常、副本、深塔、海墟、战斗
- `initGachaApp()` 不调用战斗 / 副本初始化

### P2 · 3.5 / 3.6 静态角色（战斗仍不做）

见 TODO.md 缺口表。禁止为清宵 / 景燃编造倍率或 chain effect。

### P3 · 商店体验

去掉依赖体力 / 副本的死链。

### P4 · APK

只打包 `build:gacha`。竖屏，分析页长滚动。
