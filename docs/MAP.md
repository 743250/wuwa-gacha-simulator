# 仓库地图 · 从哪读起

文件很多，按「人要看什么」分四层。不要把官方原文、设计方案、运行代码混在一起改。

```
wuwa-gacha-simulator/
├── README.md   怎么跑
├── SPEC.md     做成什么样
├── log.md      为什么这么改
├── index.html / src/ / styles/ / tests/   正在跑的模拟器
├── docs/sources/     官方原文（输入，不是目标）
├── docs/plans/       模拟器怎么做（改代码的依据）
├── docs/decisions/   为什么这么定
└── scripts/          构建、抓取、一次性工具（不是运行时）
```

根目录不再放 AGENTS.md / CLAUDE.md。

## 先读哪份

| 你想… | 打开 |
|---|---|
| 怎么跑起来 | `README.md` |
| 项目要做成什么样 | `SPEC.md` |
| 最近为什么改 | `log.md` |
| 目录怎么分 | 本文件 |
| 资料 / 设计索引 | `docs/README.md` |
| 角色做没做完 | `docs/plans/characters/status.md` |
| 纯抽卡 APK 下一轮做什么 | `docs/plans/architecture/gacha-only-apk.md` |

## 运行时代码（src/）

按玩法分包，不要跨包抄逻辑。

| 目录 | 职责 |
|---|---|
| `src/main.js` `src/init.ts` | 启动 |
| `src/state.js` `src/save.js` | 全局状态与存档 |
| `src/data/` | 角色名、卡池时间表、共鸣链文案 |
| `src/gacha/` | 抽卡概率、抽卡动作、翻牌 |
| `src/ui/` | 页面。面板在 `ui/panels/` |
| `src/shop/` `src/exchange/` | 商店、海市 |
| `src/equip/` | 武器、声骸养成 |
| `src/battle/` | 战斗（纯抽卡入口将来不加载） |
| `src/daily/` | 日常、深塔、海墟 |
| `scripts/` | 不进网页包。抓数据、打包、体检 |

`src/ui/panels/` 一个玩法一个文件夹：`gacha/` `roleModal/` `shop/` `bag/` …  
样式入口只有 `styles/main.css`，规则写在 `styles/modules/`。

## 文档（docs/）

| 目录 | 放什么 | 不放什么 |
|---|---|---|
| `docs/sources/` | 从 encore / wiki 抓来的原文、表 | 模拟器折算、任务清单 |
| `docs/plans/` | 讨论后定稿的设计 | 官方长文复制、一次性脚本 |
| `docs/plans/characters/` | 单角色设计 + `status.md` | `.cjs` / `.py` |
| `docs/plans/mechanisms/` | 声骸、召唤物、倍率校准等机制 | 官方原文 |
| `docs/plans/architecture/` | 工程计划、APK 计划、文案归属 | 角色数值 |
| `docs/plans/architecture/_generated/` | 审计 JSON 等生成物 | 给人读的正文 |
| `docs/decisions/` | ADR：为什么这么定 | 流水账（流水账进 `log.md`） |

官方机制原文现在统一在 `docs/sources/mechanisms/`（以前还有一份 `sources/mechanics/`，已合并）。

## 脚本（scripts/）

| 位置 | 用途 |
|---|---|
| `scripts/*.mjs` `scripts/*.cjs` | 日常：打包、lore、体检、E2E |
| `scripts/headless/` | 无头浏览器抓灰机 wiki |
| `scripts/oneoff/` | 用过一次的批处理，不要当日常命令 |

## 明确不整理的

- 不把 `src/battle/` 拆进另一个仓库。
- 不改角色数值、抽卡概率、共鸣链 effect。
- 不把 `docs/sources/` 的 JSON 大快照挪出 git（那是可复现的官方输入）。
- `wiki-html-cache/` 已在 `.gitignore`，保持本地缓存即可。
