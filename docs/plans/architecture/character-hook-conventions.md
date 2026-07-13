# 角色 Hook 约定

> 状态：2026-07-13 固化  
> 目的：消灭 `fireCharacterHook` / `queryCharacterHook` 签名混用导致的丢参与 silent no-op

## 两种派发

| API | 签名 | 用途 | 返回值 |
|---|---|---|---|
| `fireCharacterHook(self, name, ctx)` | 固定 `(self, ctx)` | 副作用钩子：`onAttack` / `onSkill` / `onHeavy` / `turnCleanup` / `toggleForm` 等 | **忽略**返回值 |
| `queryCharacterHook(self, name, ...args)` | 透传 `fn(self, ...args)` | 查询/改写：`canBurst` / `resolveBurstCost` / `resolveBurstDamage` / `hpCore` / `crateBonus` / `inMindEye` / `finishSkill` 等 | **使用**返回值；未定义时 `undefined` 表示回落通用逻辑 |

实现见 `src/battle/characters/index.js`。

## 写角色机制时

1. **副作用**挂 default export 的函数必须是 `(self, ctx) => void`，`ctx` 至少含 `battle`，命中类再加 `target` / `enemyIdx`。
2. **查询型**可以是 `(self, battle, helpers)` 或角色自定义参数表，但**只能**通过 `queryCharacterHook` 调用；禁止 `fireCharacterHook` 调返回值型入口。
3. 状态机入口（如 `enterFurForm` / `enterCommand`）若需要单测直调，用 `getCharacterMechanic(name).enterXxx(self, battle)`，不要 fire。
4. 新增 hook 名时：副作用走 fire，有返回值走 query；同名禁止两种语义。

## 常见坑

- `enterX(self, battle)` 被 `fireCharacterHook(self, 'enterX', ctx)` 调用 → `battle` 实参变成 `ctx` 对象，形态进不去。
- `canBurst` / `resolveBurstCost` 用 fire → 返回值丢失，AP/门槛回落错误默认。
- 角色测试里优先 `getCharacterMechanic` 直调 + `doAttack/doSkill/...` 集成，少 mock hook 表。

## 与 DoD 的关系

角色战斗验收不要求扫完全部 hook 名，但关键路径（解放 AP、形态进出、crateBonus 等）必须经 `doXxx` 集成测到，防止 fire/query 用错在运行时静默失败。
