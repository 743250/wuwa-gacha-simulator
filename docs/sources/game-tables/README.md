# 游戏表精炼（game-tables）

从 `.tmp_research/`（WutheringData 系导出）抽出、可进版控的小表。

## 已入库

| 文件 | 内容 |
|------|------|
| `RolePropertyGrowth.json` + `role-property-growth.md` | 角色等级成长比率（万分比） |
| `PhantomSubProperty.json` + `echo-substats-raw.md` | 声骸副词条标准值 |
| `PhantomMainProperty.json` + `echo-mainstat-groups.md` | 主词条随机组 |
| `PhantomLevel.json` / `PhantomGrowth.json` + `echo-level-growth.md` | 声骸升级曲线 |
| `PhantomFetter.json` + `echo-sets-crosscheck.md` | 套装原始表 vs encore 中文套装 |
| `PhantomQuality.json` / `PhantomRarity.json` / `PhantomExpItem.json` | 品质/稀有度/经验道具 |
| `c_*.json` | 调谐/品质/共鸣等相关配置碎片 |
| `INVENTORY.md` | research 目录全文件处理状态 |

## 使用

- **套装中文与 2/5 件效果**：优先 `../echoes/encore-sets.json` 与 `src/data/echoes.js`。
- **副词条槽位数**：以 ADR `docs/decisions/0001-echo-substats-5-slots.md` 为准（5 槽解锁），不要被旧实现误导。
- **改 runtime 数值前**先在 plans 记差异，勿直接把表内原始整数当面板百分比。

## 未入库（见 INVENTORY）

- `BaseProperty.json`：截断损坏
- `PhantomItem.json` / `PhantomSkill.json`：大体量 + 本地化 key，声骸精炼已在 `../echoes/`
- `char_*.json`：角色原始包，精炼在 `../characters/individual/`
