# biligame WIKI 技能倍率抓取

- 脚本：`scripts/fetch-wiki-skill-mults.mjs`
- 缓存 HTML：`docs/sources/characters/wiki-html-cache/<名>.html`
- 输出：本目录 `<名>.json` + `_index.json` / `_summary.json`
- 汇总表：[../skill-multipliers-lv10.md](../skill-multipliers-lv10.md)

## 用法

```bash
# 默认批次（见脚本 DEFAULT_BATCH）
node scripts/fetch-wiki-skill-mults.mjs

# 指定角色（限流时建议单角色 + 间隔）
node scripts/fetch-wiki-skill-mults.mjs 相里要 守岸人 珂莱塔
```

命中本地缓存（`wiki-html-cache` 且 >5KB）时不发网。B站常返回 **HTTP 567**，需冷却后重试。

## 字段

| 字段 | 含义 |
|---|---|
| `rows[].label` | 表行标签（如「第五段伤害」「一日花伤害」） |
| `rows[].lvMaxExpr` | 末档表达式 |
| `rows[].lvMaxSum` | 代数和（%） |
| `rows[].levels` | 收集到的等级格数（通常 10） |
| `inlineFixed` | 正文「造成 x% 攻击」固定句 |
| `anchors` | 粗分类（normalish / skillish / …）启发式，**不如 rows 权威** |

同名「技能伤害」可能对应技能/解放/变奏不同表，汇总时以招式名消歧（见 skill-multipliers-lv10.md 备注）。

## 2026-07-15 状态

- 成功有 rows：丹瑾、今汐、凌阳、卡卡罗、卡提希娅、吟霖、嘉贝莉娜、坎特蕾拉、奥古斯塔、守岸人、安可、尤诺、布兰特、弗洛洛、忌炎、折枝、散华、桃祈、椿、洛可可、渊武、炽霞、珂莱塔、白芷、相里要、秋水、秧秧、维里奈、莫特斐、菲比、鉴心、长离、露帕
- **空表（WIKI 未填倍率）**：赞妮、夏空、仇远（wikitext 技能模板字段全空）
- 缓存 HTML 共 36 个
