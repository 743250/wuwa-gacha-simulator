// 回合级快照测试 — 覆盖 endTurn 时序 bug（风蚀在压制期间不结算 / 压制多 1 回合 / 声骸掉落 NaN）
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { state0, S } from '../../src/state.js';
import { resetState, quickBattle, firstEnemy } from '../helpers.js';
import { generateEcho } from '../../src/equip/echoActions.js';

describe('combat endTurn snapshots', () => {
  let combat;

  beforeAll(async () => {
    combat = await import('../../src/battle/combat.js');
  });

  beforeEach(() => {
    // 最小初始化，避免角色池缺失导致 createBattle 返回 null
    Object.assign(S, state0());
    S.team = ['忌炎', '安可', '守岸人'];
    // 手动造 role entry（不走 addRole 以避开武器池依赖）
    for (const name of S.team) {
      S.roles[name] = S.roles[name] || { owned: 1, level: 90, chain: 0, equipWeapon: null };
    }
  });

  // ================================================================
  // 测试 1：风蚀每回合结算
  // ================================================================
  it('风蚀每回合结算：HP 单调下降且差值 = atk x stacks x 0.3', () => {
    // 构造战斗，敌方无特殊机制避免干扰
    const battle = combat.createBattle(['忌炎', '安可', '守岸人'], ['幼狼'], { enemyScale: 1.0 });
    const enemy = battle.enemies[0];
    expect(enemy).toBeTruthy();

    // 手动设置风蚀层数（模拟卡提希娅已施加）
    enemy.cartethyiaErosion = 3;
    const expectedDmgPerTurn = Math.round(enemy.atk * 3 * 0.3);

    const hps = [];
    for (let t = 0; t < 3; t++) {
      const hpBefore = enemy.hp;
      combat.endTurn(battle);

      // 风蚀应在每回合敌人阶段开始时触发
      const erosionLog = battle.log.filter(l =>
        l.type === 'mechanic' && l.msg && l.msg.includes('风蚀效应')
      );
      expect(erosionLog.length).toBe(t + 1);

      // HP 应下降
      expect(enemy.hp).toBeLessThan(hpBefore);

      // 差值应精确匹配 atk * stacks * 0.3
      const actualDmg = hpBefore - enemy.hp;
      expect(actualDmg).toBe(expectedDmgPerTurn);

      hps.push(enemy.hp);
    }

    // HP 应单调下降
    for (let i = 1; i < hps.length; i++) {
      expect(hps[i]).toBeLessThan(hps[i - 1]);
    }
  });

  // ================================================================
  // 测试 2：压制持续 2 回合
  // ================================================================
  it('压制持续 2 回合：第 1/2 回合跳过行动，第 3 回合恢复', () => {
    const battle = combat.createBattle(['忌炎', '安可', '守岸人'], ['幼狼'], { enemyScale: 1.0 });
    const enemy = battle.enemies[0];

    // 拉高 HP + 归零 ATK，避免随机暴击导致敌人死亡干扰时序断言
    enemy.hp = 9999999;
    enemy.hpMax = 9999999;
    enemy.atk = 0;

    // 手动设置压制状态（模拟破韧刚发生）
    enemy.suppressed = 2;
    enemy.suppressedVuln = 0.3;

    // 第 1 回合：suppressed=2，应跳过行动
    combat.endTurn(battle);
    const skip1 = battle.log.filter(l =>
      l.type === 'mechanic' && l.msg && l.msg.includes('中断中')
    );
    expect(skip1.length).toBe(1);
    expect(skip1[0].msg).toContain('2 回合');
    expect(enemy.suppressed).toBe(1);

    // 第 2 回合：suppressed=1，应跳过行动
    combat.endTurn(battle);
    const skip2 = battle.log.filter(l =>
      l.type === 'mechanic' && l.msg && l.msg.includes('中断中')
    );
    // 第 2 次 endTurn 应有新的 skip log
    expect(skip2.length).toBe(2);
    expect(skip2[1].msg).toContain('1 回合');
    expect(enemy.suppressed).toBe(0);

    // 第 3 回合：suppressed=0，应恢复行动（不再有"中断中"日志）
    const skipLogsBefore = battle.log.filter(l =>
      l.type === 'mechanic' && l.msg && l.msg.includes('中断中')
    ).length;
    combat.endTurn(battle);
    const skipLogsAfter = battle.log.filter(l =>
      l.type === 'mechanic' && l.msg && l.msg.includes('中断中')
    ).length;
    expect(skipLogsAfter).toBe(skipLogsBefore); // 没有新增中断日志 = 已恢复
    expect(enemy.suppressed).toBe(0);
  });

  // ================================================================
  // 测试 3：压制期间风蚀仍结算（刚修的 bug）
  // ================================================================
  it('压制期间风蚀仍结算：suppressed > 0 时风蚀照样扣血', () => {
    const battle = combat.createBattle(['忌炎', '安可', '守岸人'], ['幼狼'], { enemyScale: 1.0 });
    const enemy = battle.enemies[0];

    // 同时设置压制和风蚀
    enemy.suppressed = 2;
    enemy.suppressedVuln = 0.3;
    enemy.cartethyiaErosion = 5;
    const hpBefore = enemy.hp;

    combat.endTurn(battle);

    // 风蚀应已触发（HP 下降）
    const erosionLog = battle.log.filter(l =>
      l.type === 'mechanic' && l.msg && l.msg.includes('风蚀效应')
    );
    expect(erosionLog.length).toBe(1);
    expect(enemy.hp).toBeLessThan(hpBefore);

    // 验证伤害数值
    const expectedDmg = Math.round(enemy.atk * 5 * 0.3);
    const actualDmg = hpBefore - enemy.hp;
    expect(actualDmg).toBe(expectedDmg);

    // 同时应跳过敌方行动（因为 suppressed > 0）
    const skipLog = battle.log.find(l =>
      l.type === 'mechanic' && l.msg && l.msg.includes('中断中')
    );
    expect(skipLog).toBeTruthy();
  });

  // ================================================================
  // 测试 4：声骸掉落数量
  // ================================================================
  it('声骸掉落数量：generateEcho 后 S.echos 增加 echo_count 条', () => {
    const beforeCount = S.echos.length;
    const echoCount = 3;

    // 使用 dungeon.js 无音区副本的 echo_set 配置（取 wind 套中的飞廉之猩）
    for (let i = 0; i < echoCount; i++) {
      const e = generateEcho('feilian');
      expect(e).toBeTruthy();
      expect(e.name).toBe('飞廉之猩');
      expect(e.cost).toBe(4);
    }

    expect(S.echos.length).toBe(beforeCount + echoCount);

    // 验证生成的声骸确实在 S.echos 中
    const generated = S.echos.slice(beforeCount);
    expect(generated.length).toBe(echoCount);
    generated.forEach(e => {
      expect(e.catalogId).toBe('feilian');
      expect(e.cost).toBe(4);
    });
  });
});
