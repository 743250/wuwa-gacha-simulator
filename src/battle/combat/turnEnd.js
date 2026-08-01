// 回合切换 · 从 combat.js 拆出(Stage 4)
//
// endTurn 是最复杂的单函数(~250 行):
//   1. 敌方出招循环(BOSS 机制 pre-attack / 普攻 / on-hit / 双段/双动)
//   2. 敌方 periodic 机制
//   3. 队伍 buff 衰减 / CD 递减 / turnCleanup hook / stacks tick / weaponTriggers tick
//   4. 敌方 debuff / 特殊状态衰减 / tempStats tick / 绿泡自疗 / 冰翼盾
//   5. 回合切换(active 指针 / summons duration / turn 超时)

import { spawnEnemy } from '../enemies.js';
import { tickStacks } from '../stacks.js';
import { tickTempStats } from '../tempStats.js';
import { tickWeaponTriggers } from '../weaponTriggers.js';
import { applyEnemyPeriodicMechanic, applyEnemyThresholdMechanic, applyEnemyOnHitMechanic } from '../enemyMechanics.js';
import { queryCharacterHook, getCharacterMechanic } from '../characters/index.js';
import { VIBRATION_DAMAGE } from '../balance.js';
import { calcDamage, dealDamage, setCurrentBattle, tickSummons, tickSummonsDuration } from './damage.js';
import { tickAllEffects, decayEffectDurations } from './effects.js';
import {
  enemyAttack, spawnSaws, tickSaws, randomTeamTarget2,
  handleDelayedBlast, handleOverclock,
  handleBaringalGrab, handleLaser, fireLaser, handleAirStars,
} from './enemyAI.js';
import {
  reduceVibration, finishIfBattleEnded,
  pickTeamTarget, inflictFreeze, lockSkill,
} from './helpers.js';

// 我方结束回合,敌方出手
export function endTurn(battle) {
  setCurrentBattle(battle, queryCharacterHook);
  if (battle.finished) return;
  const enemyHelpers = { dealDamage, enemyAttack, inflictFreeze, lockSkill, pickTeamTarget, spawnEnemy };

  // ===== 敌方出招 =====
  battle.enemies.forEach(enemy => {
    if (!enemy.alive) return;

    // 通用元素异常效应 tick（敌人回合开始时触发 DoT/满层爆发）
    tickAllEffects(enemy, battle);

    // 破韧/残骸/弹反中断中跳过
    if (enemy.suppressed > 0) {
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `中断中（${enemy.suppressed} 回合），跳过行动` });
      return;
    }

    // 飞空无敌中跳过
    if (enemy._flightTurns >= 2) {
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '飞空中' });
      return;
    }

    // 反击姿态中不主动攻击(鸣钟之龟)
    if (enemy._deflectActive) {
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '处于反击姿态' });
      return;
    }

    // ---- 特殊 pre-attack 效果 ----

    // 叹息古龙:电锯召唤 & 电锯攻击
    if (enemy.mechanic?.type === 'burn_team' && enemy.mechanic?.sawCycle) {
      if (battle.turn % enemy.mechanic.sawCycle === 0) spawnSaws(battle, enemy);
      tickSaws(battle, enemy, enemyHelpers);
    }

    // 无归的谬误:延迟爆破 & Overclock
    if (enemy.mechanic?.type === 'data_lock' && enemy.mechanic?.delayedBlastCycle) {
      handleDelayedBlast(battle, enemy, enemyHelpers);
      handleOverclock(battle, enemy);
    }

    // 云闪之鳞:激光(先蓄力再发射)
    fireLaser(battle, enemy, enemyHelpers);

    // 异构武装:空中弹幕
    handleAirStars(battle, enemy, enemyHelpers);

    // 阈值机制(阶段切换等,在攻击前检查——可能影响本回合攻击模式)
    applyEnemyThresholdMechanic({ battle, enemy, helpers: enemyHelpers });

    // ---- 普攻 ----
    const target = pickTeamTarget(battle);
    if (!target) return;

    // 双段攻击(云闪之鳞)
    const dualStrike = enemy.mechanic?.type === 'thunder_chain' && enemy.mechanic?.dualStrike;
    // 过载/狂暴双动(无归的谬误 Overclock / 梦魇亚当 狂暴)
    const frenzyDouble = (enemy._overclockTurns > 0 || enemy._frenzyDouble);
    const totalStrikes = dualStrike ? 2 : (frenzyDouble ? 2 : 1);

    for (let s = 0; s < totalStrikes; s++) {
      const strikeTarget = (s > 0 && dualStrike && !frenzyDouble)
        ? (randomTeamTarget2(battle) || target)
        : target;
      if (!strikeTarget?.alive) continue;

      enemyAttack(battle, enemy, strikeTarget, { action: s > 0 ? (dualStrike ? '二段斩击' : '双动') : '攻击' });

      // On-hit mechanics(标记 / 侵蚀 / 溅射 / 降防 / 冰冻追踪)
      applyEnemyOnHitMechanic({ battle, enemy, target: strikeTarget, helpers: enemyHelpers });

      // 溅射(梦魇亚当)
      if (enemy.mechanic?.splash && strikeTarget.alive) {
        const splashPct = enemy.mechanic.splashPct || 0.5;
        battle.team.forEach(tm => {
          if (tm !== strikeTarget && tm.alive) {
            const splashDmg = Math.round(enemy.atk * 0.5 * splashPct);
            const real = dealDamage(tm, splashDmg);
            if (real > 0) battle.log.push({ type: 'mechanic', src: enemy.name, tgt: tm.name, dmg: real, msg: '溅射' });
          }
        });
      }

      // 降防(梦魇亚当)
      if (enemy.mechanic?.defDown && strikeTarget.alive) {
        strikeTarget.debuffs = strikeTarget.debuffs || [];
        let dd = strikeTarget.debuffs.find(d => d.type === 'defDown');
        if (!dd) {
          dd = { type: 'defDown', stacks: 0, value: enemy.mechanic.defDownPct || 0.10, duration: enemy.mechanic.defDownDuration || 2 };
          strikeTarget.debuffs.push(dd);
        } else {
          dd.duration = Math.max(dd.duration, enemy.mechanic.defDownDuration || 2);
        }
        dd.stacks = Math.min((dd.stacks || 0) + 1, enemy.mechanic.defDownMax || 3);
        if (dd.stacks > 1) battle.log.push({ type: 'mechanic', src: enemy.name, tgt: strikeTarget.name, msg: `防御 ↓ ${dd.stacks}层` });
      }

      // 冰冻累积追踪(辉萤军势 / 异构武装)
      if ((enemy.mechanic?.type === 'aoe_freeze' || enemy.mechanic?.airPhase) && strikeTarget.alive) {
        enemy._hitTracker = enemy._hitTracker || {};
        enemy._hitTracker[strikeTarget.idx] = (enemy._hitTracker[strikeTarget.idx] || 0) + 1;
        if (enemy._hitTracker[strikeTarget.idx] >= 3) {
          enemyHelpers.inflictFreeze(strikeTarget, 1);
          enemy._hitTracker[strikeTarget.idx] = 0;
          battle.log.push({ type: 'freeze', src: enemy.name, tgt: strikeTarget.name, msg: '冰冻累积触发！' });
        }
      }
    }

    // 云闪之鳞:本回合蓄力(下回合发射)
    handleLaser(battle, enemy, enemyHelpers);

    // 飞廉之猩:抓投(弹反判定)
    if (enemy.mechanic?.grabCycle) {
      handleBaringalGrab(battle, enemy, enemyHelpers);
    }
  });

  if (finishIfBattleEnded(battle, 'lose')) return;

  // ===== 触发持续机制(periodic) =====
  battle.enemies.forEach(enemy => {
    if (!enemy.alive) return;
    applyEnemyPeriodicMechanic({ battle, enemy, helpers: enemyHelpers });
  });

  if (finishIfBattleEnded(battle, 'lose')) return;

  // ===== 清理 buff/CD/状态 =====
  battle.team.forEach(t => {
    // 浅析星域:healOverTime 持续治疗
    // 冥歌海墟:愈合之印 每回合恢复 HP
    (t.buffs || []).forEach(b => {
      if ((b.type === 'healOverTime' || b.type === 'wastes_heal') && t.alive && b.value > 0) {
        const healUp = (t.buffs || []).reduce((a, x) => x.type === 'healUp' ? a + x.value : a, 0);
        const rawHeal = b.type === 'wastes_heal' ? b.value * t.hpMax : b.value;
        const realHeal = Math.round(rawHeal * (1 + healUp));
        const healed = Math.min(t.hpMax - t.hp, realHeal);
        t.hp += healed;
        if (healed > 0) battle.log.push({ type: 'heal', src: b.src || '愈合', tgt: t.name, dmg: healed });
      }
    });
    t.buffs = (t.buffs || []).filter(b => --b.duration > 0);
    if (t.cd.skill > 0) {
      t.cd.skill--;
      if (t.cd.skill === 0) {
        const maxCh = t.skillChargesMax || 1;
        t.skillCharges = Math.min(maxCh, (t.skillCharges != null ? t.skillCharges : 0) + 1);
        // 仍未满则继续下一轮充能
        if (t.skillCharges < maxCh) {
          t.cd.skill = Math.max(1, 3 - (t.skillCdReduce || 0));
        }
      }
    }
    if (t.cd.heavy > 0) t.cd.heavy--;
    if (t.frozenTurns > 0) t.frozenTurns--;
    if (t.skillLockedTurns > 0) t.skillLockedTurns--;
    t.debuffs = (t.debuffs || []).filter(d => --d.duration > 0);
    if (t._burstRefundCdLeft > 0) t._burstRefundCdLeft--;
    // 雷霆墙锁定衰减
    if (t._wallLocked > 0) t._wallLocked--;
    const cleanupResult = queryCharacterHook(t, 'turnCleanup', { battle });
    if (cleanupResult?.pendingFinal && t.alive) {
      const primary = battle.enemies.find(e => e.alive);
      if (primary) {
        const aliveEnemies = battle.enemies.filter(e => e.alive);
        const results = aliveEnemies.map(e => {
          const isMain = (e === primary);
          const m = isMain ? cleanupResult.mult : cleanupResult.mult * 0.5;
          // pendingFinal mult 为生命%（赞妮终绝等），须 explicitHpMult
          const { dmg, crit } = calcDamage(t, e, m, 'burst', { explicitHpMult: true });
          const real = dealDamage(e, dmg);
          reduceVibration(e, VIBRATION_DAMAGE.burst, battle, t);
          return { tgt: e.name, dmg: real, crit, primary: isMain };
        });
        battle.log.push({
          type: 'burst', src: t.name, results,
          action: cleanupResult.action
        });
        finishIfBattleEnded(battle, 'win');
      }
    }
    tickStacks(battle, t);
    tickWeaponTriggers(t);
  });

  // 敌人 suppressed / debuff / 特殊状态衰减
  battle.enemies.forEach(e => {
    if (e.suppressed > 0) {
      e.suppressed--;
      if (e.suppressed <= 0) e.suppressedVuln = 0;
    }
    delete e._suppressedFresh;
    // 中断窗口期间(含刚结束的那回合):韧性保持满
    if (e.suppressed >= 0 && (e.vibration ?? 100) < (e.vibrationMax || 100) && (e._wasSuppressedLastTurn || e.suppressed > 0)) {
      e.vibration = e.vibrationMax || 100;
    }
    e._wasSuppressedLastTurn = e.suppressed > 0;
    e.debuffs = (e.debuffs || []).filter(d => --d.duration > 0);
    if (e.judgeMark) {
      e.judgeMark.remaining--;
      if (e.judgeMark.remaining <= 0) delete e.judgeMark;
    }
    // Boss 状态衰减
    if (e._flightTurns > 0) e._flightTurns--;
    if (e._overclockTurns > 0) e._overclockTurns--;
    if (e._spinTired) e._spinTired = false;
    // 反击姿态衰减
    if (e._deflectActive) e._deflectActive = false;
    // 残骸过期
    if (e._debrisReady && battle.turn % 5 === 0 && !e._debrisReady) { /* debris stays 1 turn */ }
    // TempStat 统一衰减(过渡减伤 / 风壁 / 飞空无敌 等)
    tickTempStats(e);
    // 绿泡回合末治疗(若未被击破)
    if (e._bubbleHp > 0 && e._bubbleHealAmt > 0 && e.alive) {
      e.hp = Math.min(e.hpMax, e.hp + e._bubbleHealAmt);
      battle.log.push({ type: 'heal', src: e.name, tgt: e.name, dmg: e._bubbleHealAmt, msg: '绿泡自疗' });
      e._bubbleHp = 0;
      e._bubbleHealAmt = 0;
    }
    // 冰翼盾:若被击破则清除标记
    if (e._iceShielded && e.shield <= 0) {
      e._iceShielded = false;
      e._hitTracker = {};
      battle.log.push({ type: 'mechanic', src: e.name, msg: '冰翼盾被击破！减伤解除' });
    }
  });

  // 下一回合
  battle.turn++;
  battle.ap = battle.apMax;
  battle._heavyUsedThisTurn = false;
  battle.burstUsedThisTurn = false;
  battle.switchUsedThisTurn = false;
  // active 指针
  let nextActive = battle.active;
  for (let i = 0; i < battle.team.length; i++) {
    const idx = (battle.active + i + 1) % battle.team.length;
    if (battle.team[idx].alive && battle.team[idx].frozenTurns === 0) {
      nextActive = idx;
      break;
    }
  }
  if (!(battle.team[battle.active].alive && battle.team[battle.active].frozenTurns === 0)) {
    battle.active = nextActive;
  }
  // 召唤物 duration 递减(所有召唤物 -1 回合,归零则消失)
  tickSummonsDuration(battle);
  battle.log.push({ type: 'system', msg: `—— 回合 ${battle.turn} —— 当前出手：${battle.team[battle.active].name}` });
  // 新回合开始:当前出场角色的召唤物自动行动(赫卡忒等)
  if (battle.summons?.length) tickSummons(battle, battle.active);

  // 安全上限：须高于 STAR_CRITERIA.oneStar.turn（26），否则慢通会被硬判负
  // 2026-08-01 随星评回合条上浮（20/18/15→26/24/20），25→30
  if (battle.turn > 30) {
    battle.finished = true;
    battle.result = 'lose';
    battle.log.push({ type: 'system', msg: '战斗超时（>30 回合）。' });
  }
}
