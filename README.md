# 鸣潮 · 唤取模拟器

网页版鸣潮主题模拟器：抽卡 → 养成 →（可选）战斗。不是官方战斗复刻。抽卡概率、海市、月相用官方数据；战斗是 AP 回合制简化。

还没做完的事：[TODO.md](TODO.md)。做成什么样：[SPEC.md](SPEC.md)。为什么改：[log.md](log.md)。

## 怎么跑

```bash
env -u NODE_OPTIONS npm install
env -u NODE_OPTIONS npm run dev      # 浏览器打开
env -u NODE_OPTIONS npm run build
```

提交前：`env -u NODE_OPTIONS npm test`。单文件包：`npm run build:single`。

本机是 Termux / proot 时必须 `env -u NODE_OPTIONS`。`NODE_OPTIONS` 指向不存在的 patch，npm 会直接挂。`node_modules` 在哪一层装的，原生绑定就得是那一层的 linux-arm64，否则 vite / vitest 起不来。

## 改代码先看这些文件

| 要动 | 文件 |
|---|---|
| 启动 | `src/main.js` `src/init.ts` |
| 存档 / 全局状态 | `src/save.js` `src/state.js` `src/state/commit.ts` |
| 卡池时间表、角色名、专武名 | `src/data/phases.js` `src/data/chars.js` |
| 抽卡概率、保底、单抽十连 | `src/gacha/core.js` `src/gacha/actions.js` `src/gacha/rateConfig.js` |
| 抽卡分析 | `src/gacha/analysis.js` `src/ui/panels/gacha/StatsTab.tsx` |
| 翻牌 | `src/ui/gacha/animation.js` |
| 唤取界面 | `src/ui/panels/gacha/` |
| 角色详情（属性 / 链 / 技能 / 故事） | `src/ui/panels/roleModal/` |
| 立绘 / 卡池图 | `src/ui/assets/art.ts` |
| 共鸣链文案 + 战斗 effect | `src/data/chains/registry.ts` |
| 技能 tab 文案 | `src/ui/panels/roleModal/skillHints/` |
| 术语悬停 | `src/ui/panels/roleModal/terms.js` |
| 角色 90 级面板、元素、武器类型 | `src/battle/template.js` |
| 角色故事 / 语音 | `src/data/character-lore.json` |
| 商店 / 海市 | `src/shop/` `src/exchange/` `src/ui/panels/gacha/ShopPanel.tsx` |
| 武器 | `src/equip/weapons.js` |
| 战斗引擎（纯抽卡线将来不加载） | `src/battle/combat/` `src/battle/characters/` |
| 角色是否做完 | `docs/plans/characters/status.md` |
| 做新角色怎么取舍 | `docs/plans/角色设计指南.md` |
| 官方技能 / 链原文 | `docs/sources/characters/` |

一个角色通常要碰：`template.js`、`registry.ts`、`skillHints`、`art.ts`、`character-lore.json`、`chars.js` / `phases.js`。S 级才写 `src/battle/characters/<名>.js`。

## 文档别混着用

冲突时按这个顺序，先查再问，不要擅自改：

1. 你口头说的
2. `docs/plans/` 里这个角色 / 机制的设计
3. 当前代码
4. `docs/sources/` 官方原文（输入，不是目标）

`README.md` 会过时，和上面冲突时以设计文档和代码为准。

## 不许擅自做的事

- **已实装角色的机制、数值、公式、共鸣链 effect 一律不动。** 官方数据和代码不一致：记下来问，等决定。禁止「贴近官方」顺手改 ATK/HP/链倍率。
- 链文案对着 `registry.ts` 的 effect 写。技能 tab 数字要对 `calcDamage` / hook。禁止 tooltip 写代码里没有的假倍率。
- 模拟器没有「声骸技能」这种伤害类型。`dmgType` 只有 `normal / skill / heavy / burst`。
- 玩家能看见的文案禁止 `buff` `debuff` `core` `→` 这种速记。
- 提交说明末尾带：`Co-Authored-By: Claude <noreply@anthropic.com>`。
- git 对象库曾经是指向 `.l2s` 的符号链接，目录被清 `git log` 会坏，**`git fetch` 修不了**。全量 `git diff --stat` 在 proot 里可能超过一分钟，按文件 diff。
- 武器卡池图：`background-size:auto 100%; background-position:100% 40%`，不要按宽度放大。

做新角色：默认 A 级（registry + `makeSkillLines`）。只有核心机制工厂写不下才升 S 级。B 级是暂时不懂，不是凑数。

拉官方面板优先 encore：`https://api-v2.encore.moe/api/zh-Hans`（必须带 `/api/`）。灰机 wiki 要无头浏览器过 Cloudflare。B 站 wiki API 会 567。库街区要 token。

## 存档

每次操作写 localStorage。商店 tab 底部可导出 / 导入 JSON。
