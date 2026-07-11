// Phase 4 验收 · damage.js 注入机制 unit test
//
// Phase 4 切断 damage.js → characters/index.js 循环依赖,改为 hook resolver 注入。
// 旧版直接 `import { queryCharacterHook } from '../characters/index.js'`,
// 新版通过模块级 `_resolveCharacterHook` 和 `setCurrentBattle(b, resolveHook)` 注入。
// 本测试覆盖注入机制的运行时行为(集成测试不直接覆盖这些边界)。

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cartethyiaLethalShield } from '../../src/battle/characters/cartethyia.js';

let damage;
let originalResolver;

beforeEach(async () => {
  // 用 fresh import 拿到模块单例
  damage = await import('../../src/battle/combat/damage.js');
  // 备份当前 resolver(其它测试可能注入了真实 queryCharacterHook)
  originalResolver = damage.getDamageHooksResolver();
  // 复位到"未调用 setCurrentBattle"的初始态
  damage.setDamageHooksResolver(null);
});

afterEach(() => {
  // 还原 resolver 避免影响后续测试
  damage.setDamageHooksResolver(originalResolver);
  damage.setCurrentBattle(null, null);
});

describe('Phase 4 · damage.js hook 注入机制', () => {
  describe('setDamageHooksResolver', () => {
    it('默认 resolver 是 () => undefined(模块加载后未注入时)', () => {
      // getDamageHooksResolver 返回当前 resolver;初始化时是默认 no-op
      // 但理论上"模块加载时"未注入,实际是 () => undefined
      // 这里测 setDamageHooksResolver(null) 行为:回退到 no-op
      damage.setDamageHooksResolver(null);
      const resolver = damage.getDamageHooksResolver();
      expect(typeof resolver).toBe('function');
      expect(resolver({}, 'anyHook', 'arg')).toBeUndefined();
    });

    it('注入自定义 resolver 后 getDamageHooksResolver 返回该函数', () => {
      const custom = (self, hook, ...args) => 'injected';
      damage.setDamageHooksResolver(custom);
      expect(damage.getDamageHooksResolver()).toBe(custom);
    });

    it('resolver 真的被 calcDamage 调用(注入返回 hpCore 走 HP 分支)', () => {
      damage.setDamageHooksResolver((self, hook) => {
        if (hook === 'hpCore') {
          return { baseStat: 'hp', baseMultiplier: 1, hpMultOverride: 2 };
        }
        return undefined;
      });
      const attacker = {
        name: '测试', atk: 1000, level: 90, element: '衍射',
        buffs: [], elemBonus: {}, hp: 50000,
      };
      const defender = {
        name: '敌人', hp: 100000, def: 1000, level: 90,
      };
      // 计算:走 hpCore 分支,baseStat = computeStat(attacker,'hp',50000)*1 = 50000
      // hpMultOverride=2,multiplier 由 dmgType 决定:injects 默认 multiplier 传 1? calcDamage 第 3 参
      // 注:calcDamage 第 3 参是 multiplier,我们传 1.0
      const result = damage.calcDamage(attacker, defender, 1.0, 'normal', {});
      expect(result.dmg).toBeGreaterThan(0);
      // 走 HP 核分支应该比走 atk=1000 分支伤害更高
      // (因为 50000 * 2 ≫ 1000 * (1+0))
      // 简单断言:damage 远大于 atk 直接做基数的下限
      expect(result.dmg).toBeGreaterThan(1000);
    });

    it('注入返回 undefined 的 resolver 时 hpCore 走 ATK 分支(旧行为)', () => {
      damage.setDamageHooksResolver(() => undefined);
      const attacker = {
        name: '测试', atk: 1000, level: 90, element: '衍射',
        buffs: [], elemBonus: {},
      };
      const defender = { name: '敌人', hp: 100000, def: 1000, level: 90 };
      const result = damage.calcDamage(attacker, defender, 1.0, 'normal', {});
      expect(result.dmg).toBeGreaterThan(0);
      // baseStat = atk * (1+0+0) = 1000,伤害基于 1000 + 50,经过 def/resist 后远小于 50000 基数
      expect(result.dmg).toBeLessThan(2000);
    });
  });

  describe('setCurrentBattle(b, resolveHook)', () => {
    it('未传 resolveHook 时 resolver 复位为 no-op(避免状态泄露)', () => {
      // 先注入真实 resolver
      const custom = () => 'leak';
      damage.setCurrentBattle({ name: 'battle1' }, custom);
      expect(damage.getDamageHooksResolver()).toBe(custom);
      // 切换战斗时只传 battle,不传 resolver
      damage.setCurrentBattle({ name: 'battle2' });
      // 复位为 no-op,不保留上次的 custom
      expect(damage.getDamageHooksResolver()).not.toBe(custom);
      expect(damage.getDamageHooksResolver()({}, 'anyHook')).toBeUndefined();
    });

    it('传入 resolveHook 时同时更新 _currentBattle 与 resolver', () => {
      const custom = () => 'injected';
      const battle = { name: 'battle3' };
      damage.setCurrentBattle(battle, custom);
      expect(damage.getCurrentBattle()).toBe(battle);
      expect(damage.getCurrentResolveHook()).toBe(custom);
      expect(damage.getDamageHooksResolver()).toBe(custom);
    });

    it('setCurrentBattle(null, null) 清空战斗与 resolver', () => {
      damage.setCurrentBattle({ name: 'temp' }, () => 'temp');
      damage.setCurrentBattle(null, null);
      expect(damage.getCurrentBattle()).toBe(null);
      expect(damage.getCurrentResolveHook()).toBe(null);
      // getDamageHooksResolver 返回的是 setDamageHooksResolver 处理后的 no-op 函数,不是 null
      // (因为 setDamageHooksResolver 把 null/undefined 转为 () => undefined)
      const resolver = damage.getDamageHooksResolver();
      expect(typeof resolver).toBe('function');
      expect(resolver({}, 'hook')).toBeUndefined();
    });
  });

  describe('queryHook 默认行为(无角色机制)', () => {
    it('未注入 resolver 时 calcDamage 不报错,走 ATK 分支', () => {
      // 默认 resolver 是 no-op
      damage.setDamageHooksResolver(null);
      const attacker = {
        name: '普通角色', atk: 800, level: 70, element: '气动',
        buffs: [], elemBonus: {},
      };
      const defender = { name: '敌人', hp: 50000, def: 800, level: 70 };
      // 不应抛任何错
      const result = damage.calcDamage(attacker, defender, 1.0, 'skill', {});
      expect(result.dmg).toBeGreaterThan(0);
      expect(result).toHaveProperty('crit');
      expect(result).toHaveProperty('resistMult');
      expect(result).toHaveProperty('vibrMult');
    });

    it('未注入 resolver 时 dealDamage 中 onLethal hook 不拦截(直接扣血)', () => {
      damage.setDamageHooksResolver(null);
      // 创建一个会致死的 target
      const target = { name: '脆皮敌人', hp: 100, def: 100, level: 50, alive: true };
      damage.setCurrentBattle({ summons: [], log: [], team: [] }, null);
      // dealDamage 返回传入的 dmg 值(扣完护盾/防御 buff 后的剩余);
      // 致死场景下 hp 100 → 0,函数返回 dmg(=200)而不是实际扣血量
      const dealt = damage.dealDamage(target, 200);
      expect(dealt).toBe(200);
      expect(target.hp).toBe(0);
      expect(target.alive).toBe(false);
    });
  });

  describe('cartethyia onLethal 回归', () => {
    it('卡提希娅 5 链致命伤不倒不抛错,锁 1 血并写入日志', () => {
      const resolveCartethyiaHook = (self, hookName, ...args) => {
        if (hookName === 'onLethal') return cartethyiaLethalShield(self, ...args);
        return undefined;
      };
      const target = {
        name: '卡提希娅',
        hp: 100,
        hpMax: 1000,
        shield: 0,
        buffs: [],
        alive: true,
        cartethyiaLethalShield: 0.2,
        cartethyiaLethalShieldDur: 2,
      };
      const battle = { summons: [], log: [], team: [target] };
      damage.setCurrentBattle(battle, resolveCartethyiaHook);

      expect(() => damage.dealDamage(target, 150)).not.toThrow();
      expect(target.hp).toBe(1);
      expect(target.alive).toBe(true);
      expect(target.shield).toBe(200);
      expect(target._cartethyiaLethalUsed).toBe(true);
      expect(target.buffs.some(b => b.type === 'shieldMark' && b.value === 200 && b.duration === 2)).toBe(true);
      expect(battle.log.some(l => l.type === 'mechanic' && l.src === '卡提希娅' && l.msg.includes('链 5'))).toBe(true);

      const dealt = damage.dealDamage(target, 999);
      expect(dealt).toBeGreaterThan(0);
      expect(target.hp).toBe(0);
      expect(target.alive).toBe(false);
      expect(battle.log.filter(l => l.type === 'mechanic' && l.src === '卡提希娅' && l.msg.includes('链 5')).length).toBe(1);
    });
  });
});