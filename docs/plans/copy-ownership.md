# 文案与数值源归属

> 状态：生效（2026-07-13）  
> 目的：消灭「registry / skillHints / 设计文档 / 代码」四套数字各写各的。

## 1. 单一事实源

| 内容 | 权威源 | 消费者 |
|---|---|---|
| 共鸣链战斗效果 | `src/data/chains/registry.ts` 的 `effect` | `chains.js` → unit 加成 / 角色 hook |
| 共鸣链玩家文案 | 同上 `text`（title/desc） | 角色详情 Chain  tab |
| 招式实际倍率/状态机 | `src/battle/characters/*.js` + `combat/*` | 战斗结算 |
| 技能 tab 展示与公式 tooltip | `src/ui/render/skillHints.js`（可经 `skillLines.js` 工厂） | RoleModal Skill tab |
| 术语解释 | `src/ui/terms.js` `TERM_DICT` | 悬停 |
| 设计意图与取舍 | `docs/plans/characters/<角色>.md` | 人读；**不直接驱动运行时** |
| 官方原文 | `docs/sources/**` | 输入参考，不是目标 |

冲突优先级（与 CLAUDE 一致）：

1. 用户口头指示  
2. `docs/plans/` 设计文档  
3. 当前实装代码  
4. `docs/sources/` 官方资料  

发现 2 与 3 不一致：**记录差异，报告用户**，禁止为「贴近官方」擅自改已实装数值。

## 2. 禁止事项

- 在 `skillHints` 手写与 hook 不一致的「满层 ×3」「约等于」假倍率
- 在链 `text.desc` 写 effect 未实现的机制（假承诺）
- 用禁词扫描（秒/buff/【】）代替公式对账
- 设计文档 §4/§5 与代码分叉后仍把两边都当「当前真理」而不标注

## 3. 改一处要动哪些

| 改动 | 必碰 | 建议同步 |
|---|---|---|
| 改链数值/效果 | `registry.ts` effect + `chains.js` 分发（若新类型） | `text.desc`、设计 §5、角色测试 |
| 改招式倍率 | `characters/<id>.js`（或工厂配置） | `skillHints` 公式、设计 §4 |
| 改术语名 | `terms.js` + 文案里的 term class | `CHAIN_TERM_PATTERNS`（若链文案用） |
| 仅改措辞 | 对应 text/skillHints | 不改 effect |

## 4. 验收清单（文案相关）

对每个验收中的角色：

1. 打开技能 tab：每个带数字的 tip 能说出对应代码路径  
2. 链 0/满链：desc 只描述**已激活且代码存在**的效果  
3. 变奏/普攻/技能/重击/解放：展示量级与 `calcDamage` 抽样一致（允许暴击与随机，比倍率不比最终随机戳）  
4. 设计文档若有意偏离官方：§ 内保留「模拟器自定义」字样；若已对齐：§ 可写「与代码一致」一行，避免第三套散文数值

## 5. 与项目管理的关系

角色 **战斗验收 ✅** 必须包含第 4 节，不只 build/关键词。  
见 [architecture/project-management-optimization.md](architecture/project-management-optimization.md)。
