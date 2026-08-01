# 外部数据源与可借鉴项目

> 入库日期：2026-07-25  
> 用途：标明「借数据 / 对照公式 / 不整仓接入」的边界，避免重复造轮子时误接半成品。

## 1. 本项目已用数据源

| 源 | 用途 | 落点 |
|----|------|------|
| 库街区 / encore.moe API | 角色技能文案、敌人、声骸、武器面板 | `characters/` `enemies/` `echoes/` `weapons/` |
| biligame 鸣潮 WIKI | 技能满级倍率表 | `characters/wiki-skill-mults/` + `scripts/fetch-wiki-skill-mults.mjs` |
| WutheringData 系表导出 | 声骸成长/主副词条/角色成长比率 | `.tmp_research/` → 精炼入 `game-tables/` |
| 玩家强度榜 | 数值天花板参考 | `tier-list.md` |

## 2. 鸣潮相关开源（数据可借，架构不接）

| 项目 | 类型 | 可借什么 | 不建议 |
|------|------|----------|--------|
| [michael21910/wuthering-waves-summon-simulator](https://github.com/michael21910/wuthering-waves-summon-simulator) | 抽卡概率实验 | pity 曲线对照 | 替换 `src/gacha/`（你方更完整） |
| [Yapper689/Wuthering-Waves-Damage-Calculator](https://github.com/Yapper689/Wuthering-Waves-Damage-Calculator) | 简易伤害页 | UI/公式思路 | 无模块化数据可抄 |
| [ZetsuBouKyo/WutheringWaves](https://github.com/ZetsuBouKyo/WutheringWaves) | 伤害+规划+记录 | 资源规划/伤害拆分思路 | 不合并仓库 |
| [ningnao/wuthering-waves-gacha-record](https://github.com/ningnao/wuthering-waves-gacha-record) | 抽卡记录 | 日志解析思路 | 与模拟存档无关 |
| [thexeondev/Shorekeeper](https://github.com/thexeondev/Shorekeeper) | 私服模拟 | 协议/表结构研究 | 法律与体量；非网页模拟 |

## 3. 其它二游「完整向」参考（非鸣潮）

**几乎没有**与本项目同定位的「网页：抽卡+养成+关卡战斗闭环」开源二游模拟器。常见分层：

| 层级 | 代表 | 说明 |
|------|------|------|
| 纯抽卡模拟 | [Mantan21/Genshin-Impact-Wish-Simulator](https://github.com/Mantan21/Genshin-Impact-Wish-Simulator)、[Mantan21/HSR-Warp-Simulator](https://github.com/Mantan21/HSR-Warp-Simulator) | 卡池/保底/仓库很完整，**无战斗养成闭环** |
| 战斗 DPS 模拟 | [genshinsim/gcsim](https://github.com/genshinsim/gcsim)、HSR 系 SRSim | 帧级/旋转模拟，**不是日常+抽卡生活模拟** |
| 配装优化 | [frzyc/genshin-optimizer](https://github.com/frzyc/genshin-optimizer)、[fribbels/hsr-optimizer](https://github.com/fribbels/hsr-optimizer) | 圣遗物/遗器优化与伤害，**不是完整游戏循环** |
| 私服全量 | [Grasscutters/Grasscutter](https://github.com/Grasscutters/Grasscutter) 等 | 需客户端，非纯网页，合规风险高 |

结论：本仓库的「唤取 → 养成 → 副本/深塔 → 资源」闭环在公开开源里仍是少数路径；外部项目优先当**数据与公式校验源**，不当依赖。

## 4. 整合原则（硬规则）

1. **只进 `docs/sources/` 的原文/表**；模拟器抽象仍写 `docs/plans/`。
2. **不把外部仓库当 npm 依赖**；技术栈与玩法模型不兼容。
3. 改 `src/battle` / 角色倍率前：sources 有锚 → plans 有设计 → 再改代码（见 `skill-multiplier-calibration.md`）。
4. 无 License 或仅研究用的表：**对照数值可以，整段贴代码要谨慎**。
5. `BaseProperty.json` 当前截断损坏，PropId 全量中文映射待重新导出后再补。

## 5. 当前缺口（按优先级）

| 优先级 | 缺口 | 建议动作 |
|--------|------|----------|
| P0 | 部分 3.x / 联动角色 WIKI 倍率空或未抓 | `node scripts/fetch-wiki-skill-mults.mjs <名>`（注意 bilibili 567） |
| P0 | 敌人 API 269 vs 模拟器 ~43 | 按副本/深塔需要从 `encore-enemies-compact.json` 扩 |
| P1 | 声骸 PropId 中文映射 | 修好 BaseProperty 或手维护映射表 |
| P1 | 武器被动完整数值进 runtime | sources 已有 `weapons/official-list.md`，对齐 `src/equip/weapons.js` |
| P2 | 抽卡记录导入 | 可选参考记录器，非核心闭环 |
