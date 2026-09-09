# 角色官方资料

本目录只放抓取到的原文，不写模拟器折算。折算见 `docs/plans/characters/`。

| 路径 | 内容 |
|---|---|
| `encore-full-data.json` | encore 角色索引（id / 元素 / 面板 / 技能 / 链）。生成 lore 的输入 |
| `individual/<角色>.json` | 单角色官方技能、共鸣链、Lv90 面板 |
| `skill-multipliers-lv10.md` | 满级技能合计倍率锚 |
| `wiki-skill-mults/` | B 站 wiki 技能表解析结果 |
| `wiki-html-cache/` | 本地 HTML 缓存，**不入库**（`.gitignore`） |

角色条目数量以 `encore-full-data.json` 和 `src/battle/template.js` 的 `ROLE_META` 为准，不要在本 README 手写过期人数。
