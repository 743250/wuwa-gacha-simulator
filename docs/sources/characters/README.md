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

## ⚠️ `individual/` 部分是人工整理过的，别直接重跑拆分脚本

`scripts/split-encore-data.py` 会**整目录重写**。但 `individual/` 里有几个文件不只是快照的机械拆分，
而是事后人工加料过的，重跑会把它们覆盖掉（2026-09-11 踩过一次，已还原）：

- 带 `_source` 块（记录 B站 wiki 来源、`wiki-html-cache`、倍率口径、与 encore 的差异说明）——目前见 `弗洛洛.json`。
- 技能 `desc` **保留段落换行**（`\n\n`）；快照/拆分脚本的清洗规则是删 `<br>` 后把空白折叠成空格，跑一遍就把换行压平了——目前见 `秧秧·玄翎.json`、`穗穗.json`。

要加新角色时，别整目录重跑；只针对缺的那个文件生成：

```bash
python3 - <<'PY'
import json
SNAP='docs/sources/characters/encore-full-data.json'
name='景燃'  # 换成要补的角色
chars=json.load(open(SNAP,encoding='utf-8'))['results']
json.dump(chars[name], open(f'docs/sources/characters/individual/{name}.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
PY
```
