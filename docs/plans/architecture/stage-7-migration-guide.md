# Stage 7 迁移指南 · 共鸣链 + 资源单结构化

> **状态**:框架已建(2026-07-03),数据迁移未做。需要多个会话推进。
>
> 本文档是后续会话执行 Stage 7 数据迁移的操作手册。

## 背景

5 条根问题里的 #3(共鸣链 4 处并写)和 #4(资源 5 种散写)。
plan.md Stage 7 标注"3-4 周",单会话做不完。本指南把工程拆成可分批执行的最小单元。

## 已建框架(2026-07-03)

### 共鸣链单结构

`src/data/chains/types.ts` 定义了:
- `ChainDef` — 单条链的完整结构(effect + text + factoryLines + terms)
- `CharacterChains` — 一个角色 6 链
- `MIGRATED_TO_CHAIN_DEF: string[]` — 迁移状态追踪(当前空)

### 资源统一模型

`src/battle/resources/types.ts` 定义了:
- `ResourceDef` 联合类型(layer/gauge/buff/form 4 种 kind)
- `RESOURCE_REGISTRY` — 注册表(当前空)
- `MIGRATED_RESOURCES: string[]` — 迁移状态追踪(当前空)

## 共鸣链迁移(根问题 #3)

### 现状 4 处并写

| 文件 | 角色/链数 | 内容 |
|---|---|---|
| `src/battle/chainEffects.js` | 84 角色 × 6 链 | 战斗 effect(数值版) |
| `src/data/seq.js` | 84 角色 × 6 链 | 玩家文案(模拟器版) |
| `src/ui/render/skillHints.js` | ~20 角色 customLines | 工厂版技能文案 |
| `src/ui/terms.js` CHAIN_TERM_PATTERNS | 全局 | 术语高亮 |

### 迁移目标

建 `src/data/chains/<角色名>.ts`,每文件导出一个 `CharacterChains`。4 个消费方改读这里:

```ts
// src/data/chains/jiyan.ts
import { CharacterChains } from './types';
export const jiyanChains: CharacterChains = {
  character: '忌炎',
  chains: [
    {
      index: 1,
      effect: { effect: 'jiyanSkillChargeFaster' },
      text: { name: '...', desc: '...' },
      factoryLines: [{ label: '1 链', desc: '...' }],
      terms: [{ pattern: '共鸣技能', termKey: 'skill' }],
    },
    // ... 6 链
  ],
};
```

### 迁移步骤(每角色 1 个会话)

1. **选角色** —— 优先 effect 简单的(A 级,非 S 级状态机角色)。从 `chainEffects.js` 里挑 effect 字段最少的那批。
2. **建 `src/data/chains/<角色>.ts`** —— 从 4 处抄数据,填 ChainDef 结构。
3. **改 chainEffects.js** —— 该角色的 `CHAIN_BATTLE_EFFECTS[角色]` 改成 `getChainEffects(角色)` 读新结构。
4. **改 seq.js** —— 该角色的 `seqText[角色]` 改成 `getChainText(角色)` 读新结构。
5. **改 skillHints.js** —— 该角色 customLines 改读 `factoryLines`(如果有)。
6. **改 terms.js** —— 该角色术语加到 `CHAIN_TERM_PATTERNS`(从 ChainDef.terms 读)。
7. **跑测试** —— `npm test` 必须全绿,特别 `tests/battle/chains.test.js`。
8. **加角色名到 `MIGRATED_TO_CHAIN_DEF`**。

### 不迁的

- `skillHints.js` 1476 行的 customLines 不全迁 —— 只迁有 customLines 的 ~20 角色,其余只有 seqText 的角色 factoryLines 留空。
- `chains-extracted.json`(官方原文备份)不动 —— 它在 `docs/sources/`,不在运行时路径。

### 优先级排序

按 effect 复杂度(从简到繁):
1. **首批 10 角色** —— chainEffects 里只有 1-2 个 effect 字段的(A 级)
2. **第二批 30 角色** —— 3-4 个 effect 字段
3. **第三批 20 角色** —— 5+ effect 字段或带 custom hook
4. **最后 24 角色** —— S 级状态机角色(忌炎/守岸人/弗洛洛等),需要额外核对 combat 路径

## 资源统一模型迁移(根问题 #4)

### 现状 5 种散写

| kind | 实现 | 已注册角色 |
|---|---|---|
| layer | `stacks.js` registerStack | 忌炎锐意 / 卡提希娅决意 / 长离离火 |
| gauge | `forte.current` 散写 | 椿·蕊 / 赞妮焰光 / 今汐韶光 |
| buff | `unit.buffs[]` 散写 | 守岸人星域 / 长离焰羽 |
| form | `forms.js` registerForm | 卡提希娅芙露德莉斯 / 安可黑咩 / 菲比赦罪 |
| side-effect layer | 角色文件散写 | 弗洛洛乐声/余响 |

### 迁移目标

`RESOURCE_REGISTRY` 统一注册,组件用 `getResource(id)` 读。`stacks.js` / `forms.js` 成为 `resources.ts` 的子实现。

### 迁移步骤(每资源 1 个会话)

1. **选资源** —— 从已注册的(stacks/forms)开始,改动最小。
2. **建 `src/battle/resources/<id>.ts`** —— 定义 ResourceDef,调 `registerResource`。
3. **改 stacks.js/forms.js** —— 老 registerStack/registerForm 内部改成调 registerResource。
4. **改消费方** —— 组件从 `getResource(id)` 读,不直接 import stacks/forms。
5. **跑测试** —— 战斗测试 + 面板测试全绿。
6. **加 id 到 `MIGRATED_RESOURCES`**。

### 优先级

1. **已注册的 6 个**(3 stacks + 3 forms)—— 最小风险,验证框架
2. **gauge 型 3 个**(椿/赞妮/今汐)—— 改 forte.current 散写
3. **buff 型 2 个**(守岸人/长离焰羽)—— 改 buffs[] 读取
4. **side-effect layer 1 个**(弗洛洛)—— 最复杂,带 buff 刷新副作用

## 不做的

- **不改资源数值/公式** —— 单结构化是代码组织,不动平衡。
- **不删 stacks.js/forms.js** —— 它们成为 resources.ts 的子实现,保留兼容。
- **不强制 100% 迁完** —— 80% 覆盖即可,剩下的硬骨头(弗洛洛/赞妮)保留散写。

## 验收(全部迁完时)

- `MIGRATED_TO_CHAIN_DEF.length === 84`
- `MIGRATED_RESOURCES.length >= 9`(6 已注册 + 3 gauge)
- `chainEffects.js` / `seq.js` 变成 thin re-export
- `stacks.js` / `forms.js` 内部调 `registerResource`
- CLAUDE.md 铁律 10(共鸣链文案逐字核对)可移除 —— 单结构后自动同步
- 全部测试绿
