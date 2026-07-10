// 敌方 AI · 从 combat.js 拆出(Stage 4)
//
// 内容:
//   · enemyAttack(battle, enemy, target, opts) - 通用敌方一次攻击
//   · applyReflect(battle, attacker, defender, real) - 反弹机制(鸣钟龟等)
//   · 各类 BOSS 机制:
//     - 叹息古龙 spawnSaws / tickSaws
//     - 无归的谬误 handleDelayedBlast / handleOverclock
//     - 飞廉之猩 handleBaringalGrab
//     - 云闪之鳞 handleLaser / fireLaser
//     - 异构武装 handleAirStars

import { resistMultiplier } from '../elements.js';
import { applyTempStat, removeTempStat, computeStat } from '../tempStats.js';
import { dealDamage } from './damage.js';

export function enemyAttack(battle, enemy, target, opts = {}) {
  if (!enemy?.alive || !target?.alive) return 0;
  const action = opts.action || '攻击';
  const mult = opts.mult || 1;
  // 飞空无敌:不可被攻击
  if (enemy._flightTurns >= 2) {
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '飞空中，无法被攻击' });
    return 0;
  }
  if (Math.random() < (target.dodge || 0)) {
    battle.log.push({ type: 'dodge', src: enemy.name, tgt: target.name, action });
    return 0;
  }

  const resMult = resistMultiplier(enemy.element, { element: target.element });
  const debuffMult = 1;
  const isCrit = Math.random() < (opts.critRate ?? 0.05);
  const critMult = isCrit ? (opts.critMult || 1.5) : 1.0;
  let dmg = (enemy.atk + 30) * mult * resMult * debuffMult * critMult;
  // 降防 debuff 叠加(梦魇亚当)
  const defDown = (target.debuffs || []).find(d => d.type === 'defDown');
  const defDownMult = defDown ? (1 + (defDown.stacks || 0) * (defDown.value || 0.10)) : 1;
  // 穿甲(朔雷之鳞 雷霆墙)
  const wallPierce = (enemy.mechanic?.type === 'thunder_chain' && enemy.mechanic?.wallLock) ? 0.2 : 0;
  const defEffective = target.def * 0.5 * (1 - wallPierce) * defDownMult;
  dmg = Math.max(30, dmg - defEffective);
  // 自旋疲惫(聚械机偶旋转后下回合攻击 -30%)
  if (enemy._spinTired) dmg = Math.round(dmg * 0.7);
  const real = dealDamage(target, Math.round(dmg));
  battle.log.push({ type: 'enemy_attack', src: enemy.name, tgt: target.name, dmg: real, crit: isCrit, action });
  return real;
}

export function applyReflect(battle, attacker, defender, realDamage) {
  const m = defender?.mechanic;
  if (!attacker?.alive || !m || realDamage <= 0) return;
  // turtle_reflect: 反击姿态中反弹
  if (defender._deflectActive) {
    const reflected = dealDamage(attacker, Math.round(realDamage * (m.value || 0.4)));
    if (reflected > 0) {
      battle.log.push({ type: 'mechanic', src: defender.name, msg: `反弹 ${attacker.name} ${reflected} 伤害` });
    }
    return;
  }
  if (m.type !== 'reflect') return;
  if (m.cycle && battle.turn % m.cycle !== 0) return;
  const reflected = dealDamage(attacker, Math.round(realDamage * (m.value || 0.3)));
  if (reflected > 0) {
    battle.log.push({ type: 'mechanic', src: defender.name, msg: `反弹 ${attacker.name} ${reflected} 伤害` });
  }
}

// ===== 世界 BOSS 辅助函数 =====

// 叹息古龙:召唤追踪电锯
export function spawnSaws(battle, enemy) {
  const m = enemy.mechanic;
  const count = m.sawCount || 3;
  enemy._saws = enemy._saws || [];
  for (let i = 0; i < count; i++) {
    enemy._saws.push({ turnsLeft: m.sawDuration || 2, mult: m.sawMult || 0.5 });
  }
  battle.log.push({ type: 'mechanic', src: enemy.name, msg: `召唤 ${count} 个追踪电锯（持续 ${m.sawDuration||2} 回合）` });
}

export function tickSaws(battle, enemy, helpers) {
  if (!enemy._saws || !enemy._saws.length) return;
  enemy._saws.forEach(saw => {
    if (saw.turnsLeft <= 0) return;
    const tgt = randomTeamTarget2(battle);
    if (tgt) {
      helpers.enemyAttack(battle, enemy, tgt, { mult: saw.mult, action: '追踪电锯' });
    }
    saw.turnsLeft--;
  });
  enemy._saws = enemy._saws.filter(s => s.turnsLeft > 0);
}

export function randomTeamTarget2(battle) {
  const alives = battle.team.filter(t => t.alive);
  return alives.length ? alives[Math.floor(Math.random() * alives.length)] : null;
}

// 无归的谬误:延迟爆破
export function handleDelayedBlast(battle, enemy, helpers) {
  const m = enemy.mechanic;
  // 上回合设置的爆破,本回合触发
  if (enemy._delayedBlast) {
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '💥 延迟爆破！全队 AOE' });
    battle.team.forEach(t => {
      if (!t.alive) return;
      helpers.enemyAttack(battle, enemy, t, { mult: m.delayedBlastMult || 1.3, action: '延迟爆破' });
    });
    enemy._delayedBlast = false;
  }
  // 本回合设置下回合爆破
  if (battle.turn % (m.delayedBlastCycle || 3) === 0) {
    enemy._delayedBlast = true;
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '地面发光…下回合全队爆破！' });
  }
}

// 无归的谬误:Overclock 过载
export function handleOverclock(battle, enemy) {
  const m = enemy.mechanic;
  if (!enemy._overclocked && enemy.hp / enemy.hpMax <= (m.overclockThreshold || 0.3)) {
    enemy._overclocked = true;
    enemy._overclockTurns = m.overclockDuration || 3;
    applyTempStat(enemy, 'atk', 1 + (m.overclockAtkBonus || 0.5), Infinity, 'overclock');
    enemy.atk = computeStat(enemy, 'atk', enemy.baseAtk);
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: `Overclock 过载！攻击 +${((m.overclockAtkBonus||0.5)*100).toFixed(0)}%，双动 ${m.overclockDuration||3} 回合` });
  }
  if (enemy._overclocked && enemy._overclockTurns <= 0) {
    removeTempStat(enemy, 'overclock');
    enemy.atk = computeStat(enemy, 'atk', enemy.baseAtk);
    enemy._overclocked = false;
  }
}

// 飞廉之猩:抓投(periodic 中触发)
export function handleBaringalGrab(battle, enemy, helpers) {
  const m = enemy.mechanic;
  const cycle = enemy.enraged && enemy._enrageGrabFast ? 2 : (m.grabCycle || 4);
  if (battle.turn % cycle !== 0) return;
  if (battle._heavyUsedThisTurn) {
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: `抓投被 ${battle.team[battle.active]?.name} 弹反！` });
    return;
  }
  const tgt = helpers.pickTeamTarget(battle);
  if (!tgt) return;
  const dmg = Math.round((enemy.atk + 30) * (m.grabMult || 2.5) * 0.8);
  const real = helpers.dealDamage(tgt, dmg);
  battle.log.push({ type: 'mechanic', src: enemy.name, tgt: tgt.name, dmg: real, msg: '抓投（不可闪避）！' });
  if (enemy.enraged && !enemy._enrageGrabFast) {
    enemy._enrageGrabFast = true;
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '狂暴：抓投频率翻倍！' });
  }
}

// 云闪之鳞:蓄力激光
export function handleLaser(battle, enemy, helpers) {
  const m = enemy.mechanic;
  if (m.type !== 'thunder_chain' || !m.laserCycle) return;
  if (battle.turn % m.laserCycle !== 0) return;
  if (m.laserWarn) {
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '⚡ 正在蓄力激光…（下回合可切高防角色）' });
    enemy._laserCharging = true;
  }
}

export function fireLaser(battle, enemy, helpers) {
  if (!enemy._laserCharging) return;
  const m = enemy.mechanic;
  const tgt = helpers.pickTeamTarget(battle);
  if (!tgt) return;
  let mult = m.laserMult || 2.8;
  if (tgt.def > enemy.atk * 0.8) {
    mult *= 0.5;
    battle.log.push({ type: 'mechanic', src: enemy.name, tgt: tgt.name, msg: '重甲扛住激光！伤害减半' });
  }
  helpers.enemyAttack(battle, enemy, tgt, { mult, action: '红色激光' });
  enemy._laserCharging = false;
}

// 异构武装:空中弹幕
export function handleAirStars(battle, enemy, helpers) {
  const m = enemy.mechanic;
  if (!m.airPhase || !enemy._airPhase) return;
  if (!m.airStarCycle || battle.turn % m.airStarCycle !== 0) return;
  const count = m.airStarCount || 6;
  battle.log.push({ type: 'mechanic', src: enemy.name, msg: `空中弹幕 ×${count}` });
  for (let i = 0; i < count; i++) {
    const tgt = randomTeamTarget2(battle);
    if (!tgt) break;
    helpers.enemyAttack(battle, enemy, tgt, { mult: m.airStarMult || 0.4, action: '星光追踪弹' });
  }
}
