# 前置 bug 记录:onLethal hook 参数顺序错位

> 状态:已修复  
> 发现日期:2026-07-11  
> 来源:Phase 4 重构后 3 子代理 + 主代理并行 bug 审查  
> 涉及文件:`src/battle/combat/damage.js` / `src/battle/characters/cartethyia.js` / `qianxiao.js` / `zanyan.js`

## 问题描述

`damage.js:127` 在 `dealDamage` 致死分支调用 `onLethal` hook 时传参顺序为:

```js
if (queryHook(target, 'onLethal', _currentBattle, dmg)) {
  return 0;
}
```

`queryHook(self, hookName, ...args)` 会展开为 `fn(self, ...args)`,即 hook 函数收到的实参是:

```
self = target
arg1 = _currentBattle   (battle 对象)
arg2 = dmg              (伤害数值)
```

## 各角色 hook 函数签名

| 角色 | 文件:行 | 函数签名 | 注释 |
|---|---|---|---|
| 卡提希娅 | `cartethyia.js:222` | 修复前:`cartethyiaLethalShield(self, dmg, battle)`；修复后:`cartethyiaLethalShield(self, battle, dmg)` | 已对齐统一 onLethal 契约 |
| 千咲 | `qianxiao.js:333` | `qianxiaoOnLethal(self, battle)` | 只声明 2 参,第 3 个 dmg 参数被 JS 自动忽略 |
| 赞妮 | `zanyan.js:226` | `zanYanOnLethal(self, battle)` | 同上 |

## 影响分析

### 卡提希娅:`battle.log.push` 会抛 TypeError

`cartethyiaLethalShield` 函数体第 233 行:

```js
export function cartethyiaLethalShield(self, dmg, battle) {
  // ...
  self.buffs.push({ type: 'shieldMark', ... });
  battle.log.push({   // ← battle 实际收到的是 dmg 数值(数字),无 .log 属性
    type: 'mechanic', src: self.name,
    msg: `链 5 · 将烈风重塑希望...`
  });
  return true;
}
```

实际调用时:
- `self` = target(正确,卡提希娅本人)
- `dmg` = `_currentBattle`(battle 对象,但函数体内未使用 dmg 变量,所以无害)
- `battle` = `dmg`(伤害数字,如 1500)
- 执行到 `battle.log.push({...})` 时访问 `(1500).log` —— `undefined`,再 `.push(...)` —— **TypeError: Cannot read properties of undefined (reading 'push')**

`damage.js:127` 没有 try-catch 包裹 `queryHook`,异常会向上抛,中断 `dealDamage`,使整个伤害结算返回 undefined 给 `doAttack`/`doSkill`/`doBurst`,战斗日志会缺失本次伤害。

### 千咲 / 赞妮:无影响

两函数只声明 2 个参数 (`self, battle`),JS 自动忽略多余的 dmg 参数:
- `self` = target(正确)
- `battle` = `_currentBattle`(正确,本来就要 battle)
- 函数体内用 `battle.log` 等正常工作

## 为何未被发现

卡提希娅链 5 致死 hook 触发条件:
1. 卡提希娅在场且激活了 5 链
2. 受到致命伤(`hp - dmg <= 0`)
3. `_cartethyiaLethalUsed` 未曾置 true(每场 1 次)

实战中,5 链卡提希娅被一击致死是低概率事件,且现存的 289 个战斗测试可能都没走到这个实战路径(用 `grep` 简单搜 `tests/battle/` 未发现 cartethyia lethal 相关断言)。

## 是否本次重构引入

**否**。Phase 4 改造前 `queryCharacterHook(target, 'onLethal', _currentBattle, dmg)` 与改造后的 `queryHook(target, 'onLethal', _currentBattle, dmg)` 传参顺序完全一样。bug 在引入 cartethyia 5 链时就存在,本次重构只是把 `queryCharacterHook` 替换为注入的 `queryHook` wrapper,语义不变,所以 bug 被完整保留下来。

## 修复方案候选

### 方案 A(改调用方)
`damage.js:127` 改为按各 hook 函数声明的顺序传参:

```js
if (queryHook(target, 'onLethal', dmg, _currentBattle)) {
  return 0;
}
```

但这样会让千咲/赞妮的 hook 收到 `battle = dmg`(数字),`return false` 之类的逻辑虽不抛但 battle.log 类调用会被破坏 → 需同时改千咲/赞妮,且要确认它们各自的 hook 函数体里没有别的依赖参数顺序的逻辑。

### 方案 B(改 cartethyia)
把 `cartethyiaLethalShield` 的签名改成 `(self, battle, dmg)` 与千咲/赞妮一致。调用方传的是 `(self, _currentBattle, dmg)`,所以第二参会正确接到 battle,第三参会正确接到伤害数值。这个方案实际等同于方案 D,是最终采用的修复方向。

### 方案 C(调用方按 hook 名自适应)
`damage.js` 内部对 `onLethal` 特殊处理,按各角色 hook 说明单独调用:

```js
// 调用 onLethal hook。注意:cartethyia 签名是 (self, dmg, battle),
// 千咲/赞妮签名是 (self, battle)。
// 当前调用按 (self, battle, dmg) 传参 —— 与千咲/赞妮匹配,cartethyia 需单独适配。
```

这把"等价接口"破坏了,不推荐。

### 方案 D(已采用 · 统一规范)
**调用方**保持统一传 `(self, battle, dmg)`(已如此);**cartethyia 的 hook 函数**改为签名 `(self, battle, dmg)`(把 `dmg` 和 `battle` 的位置交换),与千咲/赞妮保持一致。这是最小且语义一致的修复:

```js
// cartethyia.js
export function cartethyiaLethalShield(self, battle, dmg) {  // 改: dmg ↔ battle 位置交换
  if (!self || self.name !== '卡提希娅' || !self.cartethyiaLethalShield) return false;
  if (self._cartethyiaLethalUsed) return false;
  // ...函数体不变,battle 与 dmg 变量均使用其新形参...
}
```

本修复不改变角色数值、机制或设计决策,只修正 hook 参数顺序以避免运行时崩溃。

## 修复记录

已按方案 D 修复:

1. `src/battle/characters/cartethyia.js`:将 `cartethyiaLethalShield` 签名从 `(self, dmg, battle)` 改为 `(self, battle, dmg)`,对齐统一 onLethal hook 契约。
2. `tests/battle/damage-hooks.test.js`:新增卡提希娅 5 链致命伤回归测试,覆盖不抛错、锁 1 HP、获得 20% HP 护盾、写入 battle.log、每场只触发一次。

## 复测建议

```bash
npm test -- tests/battle/damage-hooks.test.js
npm run smoke
```

附件:相关源码位置

- `src/battle/combat/damage.js:127` —— 调用点
- `src/battle/characters/cartethyia.js:222-237` —— 抛错的 hook
- `src/battle/characters/qianxiao.js:333` —— 同名 hook(无影响)
- `src/battle/characters/zanyan.js:226` —— 同名 hook(无影响)