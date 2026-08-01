# 工程记录 · log

> git 管「改了什么」，这份记录「为什么这么改、当时怎么取舍」。按日期倒序。
> 只记有意义的决策与判断，不记流水账（流水账进 git commit）。

## 2026-07-31 · 修复 8 个历史失败测试（根因：断言落后于未提交的战斗重构，非领域 bug）

8 个历史失败全部是**测试断言过时**，不是代码 bug——跑全量确认组件行为正确后只改了测试。

- **tests/ui/BattleView.test.tsx ×5**
  - hud chip 重构为 flex `gap:6px` 布局 → DOM `textContent` 无空格：`'AP 4/4'`→`'AP4/4'`、`'回合 3'`→`'回合3'`（视觉间隔靠 CSS，happy-dom 无布局，测试应锁真实 DOM）。
  - 敌人行从 `<div>` 重构为 `<button class="bf-enemy">`，`querySelector('button')` 命中敌人行而非结算按钮 → 改用 `.bf-result-btn`。
  - 目标标记从 emoji `🎯` 改为 `目标` pill（CSS `.bf-target-mark` 是文字徽章）→ 断言改 `'目标'`；可点击判定从 `[style*="cursor: pointer"]`（重构后不再有内联样式）改为 `.bf-enemy` + `.bf-enemy.is-target`。
- **tests/ui/skillHints.test.js ×1**：长离 `makeSkillLines` 配置 `skillMult: 2.0`（角色专属基底），测试却按全局默认 1.8 断言 1800/1980 → 改为 2000/2200。注入 `skillBonus 0.1` 后 tip 含「技能加成 10%」的断言本身有效，只是数字过时。**教训**：工厂公式测试的期望数字必须对配置文件取值，不能写死全局默认倍率。
- **tests/ui/BagPanel.test.tsx ×1**：`resetState()` 默认建 3 人队伍占 `.role` 计数，武器测试期望 3 个得 6 → 传 `resetState({ team: [] })`。
- **tests/podcast/core.test.js ×1**：写死等级/经验被数据推导推翻 → 从 `findTask('p_pull50').exp` / `PODCAST_EXP_PER_LEVEL` 推导（数据是权威，见 CLAUDE.md）。

全量 `923 passed / 85 files`。教训：UI 重构（尤其 DOM 结构/按钮元素变更）后要同步跑组件测试，断言跟 DOM 走而不是跟视觉效果走。

## 2026-07-31 · 角色立绘全量接入（encore API 系统化来源）+ 角色卡立绘卡面

### 系统化立绘来源（重要，以后不用再逐个猜 URL）
- **决定**：portrait(角色立绘) 从 encore.moe 角色 API 全量抓取 —— `api-v2.encore.moe/api/zh-Hans/character/{id}`，返回每个角色的全套图片 URL。
  - `RolePortrait` = `PixActivity/T_ActivityRole{名字}.webp`，**50 个实装角色全部有**（含 4★/常驻/限定），这是角色卡的立绘来源。
  - 名字用官方罗马化且区分大小写、个别带数字后缀（忌炎=`T_ActivityRoleJiyan1`、白芷=`Bailian`、维里奈=`Jueyuan`）——**不要自己拼 pinyin 猜**，走 API 拿精确 URL。
  - 还带 `RoleHeadIcon*`（头像）、`FormationRoleCard`（队形图标）、`Skins.0.PreviewRoleCard`（皮肤预览）、`Card` 等。
  - id→名字：项目内 `docs/sources/characters/encore-full-data.json` 只有 53 个 id 无名字，需逐个打 API 才能拿到中文名。已建立全量映射，`src/ui/assets/art.ts` ROLE_ART 现有 50 个角色（限定位次=项目 roster）。
- **为什么系统化**：此前逐个猜 `T_ActivityRole{pinyin}.webp` 大小写命中率极低（37 个只中 2 个）；GitHub API 限流无 token、jsDelivr 拒 >50MB repo。encore API 一条路全解决。
- **翻牌卡/卡面**：`.role`（角色仓库）与 `.gcard .face`（抽卡翻牌）都接 portrait 做 cover 背景 + 底部蒙层，无美术角色回落纯色渐变。

### 角色卡防叠压（用户报桌面端角色仓库卡片堆叠）
- **根因排查**：静态分析 `.roles` grid（repeat(4,1fr)）+ `.role`(aspect-ratio 4/5, overflow:hidden) 结构上不应叠压，也未发现双渲染（mountPanel 清空后 render、无旧 HTML 字符串残留）。无头环境无浏览器无法复现，做「结构性防叠压」兜底。
- **决定**：`.roles` 改 `repeat(auto-fill, minmax(88px, 1fr))`（桌面宽屏自动加列、手机少列，永不拥挤）；卡面内容（立绘/星级/名字/等级/徽章）**全部 absolute 定位** + `.role` `overflow:hidden` + z-index 分层（art 0 < shade 1 < 文字 2），物理上不可能叠压。
- **测试**：新增 `tests/ui/rolesLayout.test.tsx`（4 例）锁定 DOM 结构 + CSS 契约；`assets.test.ts` 改为验证 50 角色 + 代表性子集 + 未登记 key 兜底。全量 915 通过、8 个历史失败不变（podcast/BagPanel/BattleView×5/skillHints）。

## 2026-07-31 · 卡池大图纠正：= 官方海报立绘，整背景铺图（推翻 BgCgBig）

### 卡池大图到底是什么（用户拍板，推翻上文 BgCgBig 结论）
- **决定**：卡池大图 = **官方海报立绘**（鸣潮 wiki/萌娘百科的海报宣传图），不是游戏内 `BgCgBig/T_LuckdrawBg*`。用户连续纠正：① 之前小图找错了图；② 应该**整个背景**都是卡池大图，不是右侧小块；③ 到 wiki 官网的海报立绘就是卡池大图。
- **证据**：`BgCgBig` 实为单色全屏卡池界面背景（弗洛洛=一片红，实测 avg R=60-165、G/B=27-46 低 luma 范围）；游戏自 2.4 起不再为角色出静态卡池图（弗洛洛 2.5 无 `T_RoleImg`），新角色卡池大图即官方海报立绘。
- **实现**：`GachaBanner` 把 `banner-art` 整块铺 `background-image: url(海报立绘)` + `cover` + 左侧线性蒙层（`.has-art::before`，z-index 0）保证文字可读；`.ba-main`/`.ba-meta` 上浮 z-index 1。删掉右侧小图列（`.ba-right`/`.ba-art-img`）。
- **图片来源**：
  - 萌娘百科 commons（`storage.moegirl.org.cn`）：`鸣潮-弗洛洛-海报.jpg`（2560×1440）、`忌炎宣传图.png`（3840×2160）。实测 HTTP 200 无防盗链，可 `<img>`/background 直链；**无 CORS 头**（展示 OK，画布读取会被污染）。
  - 今汐**无现成海报**（Moegirl 分类无海报文件，立绘全是 1536×1524 近方形）→ 回落 `portrait`。
  - encore.moe 存 `T_RoleImg{Char}_UI` 横版角色大图（仅 2.4 前角色有）。
- **库街区官方 wiki**：`wiki.kurobbs.com` 图片在 `prod-alicdn-community.kurobbs.com`，但 `api.kurobbs.com` 需访问令牌（"访问令牌不能为空"），CLAUDE.md 亦确认需认证 → 不作为公开图源。
- **Biligame 坑**：`wiki.biligame.com/mc`=我的世界；`wuwa/ww/wuthering` 全部跳转通用首页，非鸣潮。
- **测试**：`tests/ui/bannerLayout.test.tsx` 重写为 4 例（bsl-row 换行+chip 禁收缩、定向按钮 flex-wrap、限定池 `.has-art` + Moegirl URL + 无 `.ba-art-img` + cover 蒙层 CSS、文字列可收缩+z-index 契约）。`assets.test.ts` 更新断言：弗洛洛/忌炎 `bannerBg` 走 `storage.moegirl.org.cn`，今汐无 `bannerBg`。全绿；7 个历史失败（BagPanel/BattleView×5/skillHints）与本次无关。
- 待办：今汐海报缺失；海报立绘批量补全（数据集）未做；Moegirl 图偏重（4.5-7MB/张）。

## 2026-07-31 · 资源骨架 + 图片来源调研 + 文档管理

### 美术/音频接入方式（决定）
- **决定**：新增 `src/ui/assets/`（`art.ts` 图片注册表 + `audio.ts` 音频管理器 + `index.ts` 统一出口），三个接入点：
  - `GachaBanner.tsx` — 卡池背景大图（`getBannerArt`，未登记走 CSS 渐变兜底）
  - `src/ui/gacha/animation.js` — 出货 `sfx('reveal')` / 关闭 `sfx('reveal_close')`
  - `src/main.js` — 首次用户手势 `unlock()`（浏览器自动播放策略）
- **为什么**：项目是数据驱动模拟器，图片/音效是纯增量，放 UI 层不碰领域逻辑与边界测试；SOUNDS/BANNER_ART 全空时静默降级，行为零变化。
- **配套**：`tests/ui/assets.test.ts`（6 例，空配置 no-op 不抛错）。

### 图片来源调研（子代理实测 + 主代理复核）
- **版本宣传图** → 官方 Kuro CDN：`wutheringwaves.kurogames.com/website-preface/assets/`（1920×1080，CORS `*`，无防盗链；文件名带哈希需爬列表）
- **卡池大图** → encore.moe 角色详情 `GachaViewInfo[].UnderBgTexturePath`（`BgCgBig/T_LuckdrawBg*`，2400×1080，image/webp 可直链）——**实抓后纠正两点**：① 初版子代理结论把 `RolePortrait`/`Card` 误当卡池大图，`RolePortrait` 实为角色立绘、`Card` 只是 175px 头像；② `BgCgBig` 是游戏全屏卡池界面背景，单色+烘角色轮廓，做窄高 banner 背景会被裁成"色墙"（桌面端尤其明显，手机端因纵向布局裁切少所以看着正常）。
- **banner 图展示方式（决定，用户拍板）**：卡池大图是横版大图、与角色立绘是**两张不同的图**。`GachaBanner` 重构为左侧文字列 + 右侧独立图片列（`.ba-right` + `.ba-art-img`），横版卡池大图完整展示在右，不再做背景图。角色池用 `bannerBg`（缺省回落 `portrait`），武器池用 pool 级 `art.bg`。`ba-art-img` 用真实 `<img>`（`height:auto` 保持横版原比例，不裁切）——`cover` 背景会把 2400×1080 裁成一条"色墙"。同时给 `.ba-main` 加 `flex:1;min-width:0`，修桌面端文字列不收缩导致的方块重叠。
- **桌面端方块重叠 + 测试**：happy-dom 不做真实 CSS 布局（已实测：导入 CSS 后 computedStyle 仍为空），**无法用视觉测试**。改走「DOM 结构 + main.css 规则」契约测试 `tests/ui/bannerLayout.test.tsx`（4 例）：bsl-row 换行 + bsl-chip `flex:0 0 auto` 禁收缩（不收缩+可换行=整行铺开不叠压）、定向按钮 flex-wrap、横版图是 `<img>`、ba-main 可收缩。若要真实像素级重叠检测需浏览器端 E2E（超出当前测试栈）。
- **角色立绘** → encore.moe `RolePortrait`（已填 3 例试水）。
- **备选**：B站 wiki（patchwiki.biligame.com）大图、Fandom MediaWiki API
- 待填：确认后按角色名批量补全 `art.ts`；单文件 build 体积待评估（2400×1080 webp ≈ 100-170KB/张）。

### 发现的问题
- 全量测试 **8 个历史失败**（podcast 抽卡日志校准 / skillHints 赫羽 / BattleView×5 / BagPanel×1），与资源骨架无关（已查证失败测试不依赖本次改动文件），疑似与工作区未提交的 battle/daily/equip 改动相关，待排查。
- 本机 `npm run build` 失败：esbuild 原生二进制 `Permission denied`（环境限制，非代码问题），换正常环境跑。
- 工作区有一批未提交改动 + 一个损坏 git 对象（`docs/sources/enemies/README.md` 缺对象），`git stash` 不可用，建议尽快修复仓库状态。

### 清理
- 删除临时/垃圾文件约 43MB（`.tmp_research/`、`.tmp_hp_compare*.txt`、`.tmp_gh/`、`correct`、无名 jpg）——待用户确认后执行。
