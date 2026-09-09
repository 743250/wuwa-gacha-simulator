# 鸣潮 · 唤取模拟器

网页版鸣潮主题抽卡模拟器（Vite + Preact）。不是官方战斗复刻。

**先看两份活文件：**

- [TODO.md](TODO.md) — 未完成事项，就在根目录，不藏
- 下面「仓库怎么放」— 打开就能找目录

根目录给人看的文档：本文件、`SPEC.md`（做成什么样）、`log.md`（为什么这么改）、`TODO.md`（还没做完）。

## 未完成（摘要）

正在做：**纯抽卡 APK**（抽卡 / 分析 / 角色信息 / 商店 / 存档）。战斗和副本先不做。

现在卡住：分析页有用户截图，必须识图后才能 100% 复刻，看不清不许猜。完整清单在 [TODO.md](TODO.md)。

## 怎么跑

```bash
env -u NODE_OPTIONS npm install
env -u NODE_OPTIONS npm run dev
env -u NODE_OPTIONS npm run build
```

## 仓库怎么放

```
README.md / SPEC.md / log.md / TODO.md   给人看，不藏
index.html / src/ / styles/ / tests/     正在跑的程序
docs/sources/                            官方原文
docs/plans/                              单角色、机制等设计细节
docs/decisions/                          某次拍板为什么
scripts/                                 打包、抓数据，不进网页
```

| 想找 | 去哪 |
|---|---|
| 怎么跑、目录 | 本文件 |
| 做成什么样 | `SPEC.md` |
| 为什么改 | `log.md` |
| 还没做完 | `TODO.md` |
| 角色做没做完 | `docs/plans/characters/status.md` |
| 官方技能 / 链原文 | `docs/sources/` |
| 抽卡代码 | `src/gacha/` |
| 页面 | `src/ui/panels/` |
| 战斗（纯抽卡线将来不加载） | `src/battle/` |

`docs/` 只放资料和设计细节，不再放「从哪读起」或「下一步做什么」。那两件在根目录。

## 重要边界

- 已实装角色的数值和设计决策不能擅自改。
- 设计文档优先于官方资料和临时推测。
- 未提交改动属于活跃开发，清理前必须先确认。
