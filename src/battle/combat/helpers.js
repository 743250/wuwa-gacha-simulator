// 战斗核心 helper · 从 combat.js 拆出(Stage 4)
//
// 内容:
//   · resolveActionCost - 计算 AP 消耗(挂 resolveCost hook 的角色如长离走 lihuo 抵)
//   · fireCraneAssist   - 折枝鹤助战触发
//   · gainConcerto / consumeConcerto - 协奏值管理
//   · reduceVibration   - 削韧 + 破韧爆发窗口
//   · finishIfBattleEnded - 胜负判定 + battle.result 写入
//   · pickTeamTarget    - 敌方 AI 选目标
//   · inflictFreeze / lockSkill - 状态控制

import { fireTrigger } from '../weaponTriggers.js';
import { queryCharacterHook, getCharacterMechanic } from '../characters/index.js';
import { pick } from '../../shared/random.js';

export function resolveActionCost(self, actionType, baseApCost) {
  const cost = queryCharacterHook(self, 'resolveCost', actionType, baseApCost);
  if (cost) return cost;
  return { apCost: baseApCost, lihuoCost: 0 };
}

export function fireCraneAssist(battle, target) {
  const zhezhi = battle.team.find(t => t.alive && t.name === '折枝');
  if (!zhezhi) return;
  const fn = getCharacterMechanic('折枝')?.craneAssist;
  if (typeof fn === 'function') fn(battle, target);
}

// 协奏值:满 100 切人时触发变奏/延奏(暂未实装变奏,只显示)
export function gainConcerto(unit, amount) {
  unit.concerto = Math.min(100, (unit.concerto || 0) + amount);
}

// 协奏值消耗(变奏/延奏触发,触发武器被动)
export function consumeConcerto(unit, battle) {
  if ((unit.concerto || 0) < 100) return false;
  unit.concerto = 0;
  fireTrigger(unit, 'concerto_consume', { battle });
  battle.log.push({ type: 'mechanic', src: unit.name, msg: '协奏满 → 触发变奏 / 延奏' });
  return true;
}

// 削减敌人破韧值,归零进入易伤 2 回合(破韧瞬间不算)
// battle 传入用于:破韧瞬间 +2 AP(爆发窗口)
// attacker(可选):造成本次破韧的角色;用于卡提希娅 1 链"破韧瞬间 +1 风蚀"
export function reduceVibration(enemy, amount, battle, attacker) {
  if (!enemy || !enemy.alive) return;
  if (enemy.suppressed > 0) return;
  enemy.vibration = Math.max(0, (enemy.vibration ?? 100) - amount);
  if (enemy.vibration <= 0) {
    enemy.suppressed = 2;
    enemy.suppressedVuln = 0.3;
    enemy._suppressedFresh = true;
    enemy.vibration = enemy.vibrationMax || 100;
    if (battle) {
      battle.ap = Math.min((battle.apMax || 4) + 2, battle.ap + 2);
      battle.log.push({ type: 'system', msg: `💥 ${enemy.name} 被击破！+2 AP 爆发窗口 · 中断 2 回合` });
      queryCharacterHook(attacker, 'erosionOnBreak', enemy, battle);
    }
  }
}

export function finishIfBattleEnded(battle, priority = 'lose') {
  if (!battle || battle.finished) return !!battle?.finished;
  const won = battle.enemies.length > 0 && battle.enemies.every(e => !e.alive);
  const lost = battle.team.length > 0 && battle.team.every(t => !t.alive);
  if (priority === 'win' && won) {
    battle.finished = true;
    battle.result = 'win';
    battle.log.push({ type: 'system', msg: '战斗胜利！' });
    return true;
  }
  if (lost) {
    battle.finished = true;
    battle.result = 'lose';
    battle.log.push({ type: 'system', msg: '队伍全灭。' });
    return true;
  }
  if (won) {
    battle.finished = true;
    battle.result = 'win';
    battle.log.push({ type: 'system', msg: '战斗胜利！' });
    return true;
  }
  return false;
}

export function pickTeamTarget(battle, preferActive = true) {
  if (preferActive) {
    const active = battle.team[battle.active];
    if (active?.alive) return active;
  }
  const alives = battle.team.filter(t => t.alive);
  return alives.length ? pick(alives) : null;
}

export function inflictFreeze(unit, turns = 1) {
  if (!unit?.alive) return;
  // 状态在 endTurn 清理阶段会立刻 -1,所以这里多放 1,保证玩家下回合能实际感受到 1 回合控制。
  unit.frozenTurns = Math.max(unit.frozenTurns || 0, turns + 1);
}

export function lockSkill(unit, turns = 1) {
  if (!unit?.alive) return;
  unit.skillLockedTurns = Math.max(unit.skillLockedTurns || 0, turns + 1);
}
