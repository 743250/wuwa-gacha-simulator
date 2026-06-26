# 数据来源

本目录只放从官方/半官方来源采集的**原文**,不掺模拟器抽象或自定义折算。模拟器抽象见 [../plans/](../plans/)。

## 资料优先级

1. **库街区官方共建 Wiki API**:优先记录技能组、共鸣链、武器文案、敌人机制原文。
2. **游戏内文本 / 官方公告**:用于核验 Wiki 缺失或更新滞后的信息。
3. **玩家强度榜 / 社区评价**:只用于判断数值天花板与玩法记忆点,不替代官方技能文本。

## 目录

### 角色(51)
- [characters/](characters/) — 库街区 API 抓取的 51 个角色官方技能组 + 6 链原文
- [characters/README.md](characters/README.md) — 角色索引
- [characters/shorekeeper.md](characters/shorekeeper.md) — 守岸人完整官方条目(`entryId=1286814658335739904`)

### 敌人
- [enemies/README.md](enemies/README.md) — 17 世界 BOSS 英中名对照 + 元素核验 + 深塔血量参考
- [enemies/complete-database.md](enemies/complete-database.md) — 198 个敌人 · 7 元素 · 5 职业(2026-06-25 采集)
- [enemies/world-boss-mechanics.md](enemies/world-boss-mechanics.md) — 17 世界 BOSS 官方机制 + 模拟器差距

### 机制(副本 / 深塔 / 海墟 / 声骸)
- [mechanisms/dungeons.md](mechanisms/dungeons.md) — 锻造挑战 15 / 模拟战训 / 无音区 20 / 世界 BOSS 17 / 周本 9 + 波片消耗 + 奖励表(2026-06-25)
- [mechanisms/tower-of-adversity.md](mechanisms/tower-of-adversity.md) — 逆境深塔:三区结构 / 活力系统 / 环境轮换 / 血量膨胀 / 敌人轮换
- [mechanisms/whimpering-wastes.md](mechanisms/whimpering-wastes.md) — 冥歌海墟:12 层双队制 / 信物 30+ / 焚烬 / 积分 / 奖励
- [mechanisms/echo-system.md](mechanisms/echo-system.md) — 声骸系统:数据坞 / COST / 套装 / 主副词条 / 调谐 / 声骸图鉴

### 强度榜
- [tier-list.md](tier-list.md) — pockettactics 2026-06-18 · 3.0 patch · 0 链评分;模拟器数值天花板的官方依据

## 使用规则

- 修改角色/敌人/机制数值前,先查本目录对应条目;没有条目就先补资料,别凭空写。
- 官方文本与当前模拟器实现不一致时,先在 [../plans/](../plans/) 对应移植计划里记录差异并问用户,**不要直接改实现**。
- 强度/Tier 天花板查 [tier-list.md](tier-list.md),不要凭印象。
- 本目录文件只记录"官方原文 / API 来源 / 抓取日期 / 关键数值",不写模拟器抽象。模拟器抽象写 [../plans/](../plans/) 对应文件。

## 武器
- 待补:建议按武器名一文件,记录官方被动、90 级面板、副词条。