# 技能充能系统（共享债 · 立项）

> 状态：2026-07-13 登记脚手架，**本轮不实现运行时**  
> 背景：设计文档多处写「越限 2 次充能 / 技能可充能」，当前实现仅 CD 归零，无独立 charge 计数。

## 目标语义（设计意图）

- 部分角色技能有 **充能次数** `charges`（如 cap=2），每次施放消耗 1，回满 CD 时 +1（不超过 cap）。
- 与单纯「CD 结束可再放」不同：满充能时可连放两次再进入长 CD。

## 建议数据位（未接线）

```js
// unit.cd 旁或 unit.skillCharges
{
  skill: { current: 1, max: 1 }, // 默认 max=1 ≡ 今日行为
}
// FORTE / 角色机制可覆写 max，或 ChainDef effect: { type:'skillChargeCap', value:2 }
```

## 接入点（将来）

1. `canSkill`：`charges.current > 0` 或 `cd.skill===0`（二选一策略需设计拍板）
2. `doSkill`：成功后 `current--`；`current===0` 时启动 CD
3. `endTurn` / CD tick：CD 归零时 `current = min(max, current+1)`
4. UI ActionBar：显示 `技能 2/2` 而非仅 CD 数字
5. skillHints：`cost: '1 AP · 充能 2'` 与代码对账

## 本轮明确不做

- 不改 `actions.js` CD 语义
- 不批量改设计文档「2 次充能」措辞（避免假承诺；玩家文案已按真实 effect 收口处保持）
- 单角色若必须「连放两次」，用现有 CD 重置 / 专属 hook 特例，不假装通用 charge 已上线

## 验收（未来立项）

- 有 charge 的角色：C0 测连放 cap 次后进入 CD；CD 回满 +1
- 无 charge 角色回归：行为与今日一致
- skillHints 数字/次数 = 代码
