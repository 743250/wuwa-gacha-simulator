// 玩家动作 · 从 combat.js 拆出(Stage 4)
//
// 内容:
//   · canAttack / canSkill / canHeavy / canBurst - 前置判定
//   · doAttack / doSkill / doHeavy / doBurst / doDebris / doSwitch - 动作执行

import { ACTION_COST, ACTION_MULTIPLIER, VIBRATION_DAMAGE } from '../balance.js';
import { forteEnhances, gainForte, consumeForte } from '../forte.js';
import { fireTrigger } from '../weaponTriggers.js';
import { fireEchoSetTrigger, fireEchoSetOnHitErosion, fireRoleEchoTriggers } from '../echoSetTriggers.js';
import { onUnitSwitchOut } from '../forms.js';
import { fireSwitchHook, fireSwitchOutHook } from '../switchHooks.js';
import { fireCharacterHook, queryCharacterHook } from '../characters/index.js';
import { calcDamage, dealDamage, setCurrentBattle } from './damage.js';
import { applyReflect } from './enemyAI.js';
import {
  resolveActionCost, fireCraneAssist,
  gainConcerto, consumeConcerto,
  reduceVibration, finishIfBattleEnded,
} from './helpers.js';

// 统一前置判定:UI 和 doXxx 共用,避免两处不同步导致"按钮亮但点不了"
// 返回 { ok: bool, err?: string },err 用于 UI 提示和 doXxx 早退

export function canAttack(self, battle, targetIdx) {
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  const cost = resolveActionCost(self, 'normal', ACTION_COST.normal);
  if (battle.finished || battle.ap < cost.apCost) return { ok: false, err: 'AP 不足' };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  return { ok: true };
}

export function canSkill(self, battle, targetIdx) {
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  if (self.skillLockedTurns > 0) return { ok: false, err: `技能被封锁中（${self.skillLockedTurns} 回合）` };
  const inMindEye = !!queryCharacterHook(self, 'inMindEye');
  if (self.cd.skill > 0 && !inMindEye) return { ok: false, err: `技能冷却中（${self.cd.skill} 回合）` };
  const cost = resolveActionCost(self, 'skill', ACTION_COST.skill);
  if (battle.finished || battle.ap < cost.apCost) return { ok: false, err: 'AP 不足' };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  return { ok: true };
}

export function canHeavy(self, battle, targetIdx) {
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (!self.hasHeavy) return { ok: false, err: `${self.name} 没有重击` };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  const inMindEye = !!queryCharacterHook(self, 'inMindEye');
  if (self.cd.heavy > 0 && !inMindEye) return { ok: false, err: `重击冷却中（${self.cd.heavy} 回合）` };
  const cost = resolveActionCost(self, 'heavy', ACTION_COST.heavy);
  if (battle.finished || battle.ap < cost.apCost) return { ok: false, err: `AP 不足（需 ${cost.apCost}）` };

  const heavyCheck = queryCharacterHook(self, 'canHeavy', battle, targetIdx);
  if (heavyCheck) return heavyCheck;
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  return { ok: true };
}

export function canBurst(self, battle) {
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };

  const burstCheck = queryCharacterHook(self, 'canBurst', battle);
  if (burstCheck) return burstCheck;

  if (battle.finished || battle.ap < ACTION_COST.burst) return { ok: false, err: `AP 不足（需 ${ACTION_COST.burst}）` };
  if (self.energy < self.energyMax) return { ok: false, err: `能量不足（${self.energy}/${self.energyMax}）` };
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return { ok: false, err: '没有目标' };
  return { ok: true };
}

// 普攻:1 AP,单体,100% atk
// 守岸人 5 链:normalSplit = 2,会额外打一个相邻敌人
export function doAttack(battle, targetIdx) {
  setCurrentBattle(battle);
  const self0 = battle.team[battle.active];
  const check = canAttack(self0, battle, targetIdx);
  if (!check.ok) return check;
  const self = self0;
  const cost = resolveActionCost(self0, 'normal', ACTION_COST.normal);
  const target = battle.enemies[targetIdx];
  // 长离心眼·征:普攻变身为 180% 共鸣技能伤害
  const meForm = queryCharacterHook(self, 'mindEyeForm', 'normal');
  // 赞妮灼焰形态:普攻键替换为重斩(HP×12%,消耗 20 焰光,heavy 类型)
  const zyForm = queryCharacterHook(self, 'resolveNormal', battle);
  const fEnh = (meForm || zyForm) ? null : forteEnhances(self, 'normal');
  let mult;
  if (meForm) mult = meForm.mult;
  else if (zyForm) mult = zyForm.mult;
  else mult = fEnh ? ACTION_MULTIPLIER.normal * fEnh.effectMult : ACTION_MULTIPLIER.normal;
  const dmgType = meForm ? meForm.dmgType : (zyForm ? zyForm.dmgType : 'normal');
  const { dmg, crit } = calcDamage(self, target, mult, dmgType);
  const real = dealDamage(target, dmg);
  reduceVibration(target, VIBRATION_DAMAGE.normal + (fEnh ? VIBRATION_DAMAGE.normalForteBonus : 0), battle, self);
  applyReflect(battle, self, target, real);
  // 攻击绿泡(罗蕾莱)
  if (target._bubbleHp > 0) {
    target._bubbleHp -= real;
    if (target._bubbleHp <= 0) {
      const healAmt = target._bubbleHealAmt || 0;
      if (healAmt > 0) {
        battle.team.forEach(t => {
          if (t.alive) {
            const healed = Math.min(t.hpMax - t.hp, healAmt);
            t.hp += healed;
            if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed, msg: '抢到绿泡治疗！' });
          }
        });
      }
      target._bubbleHp = 0;
      target._bubbleHealAmt = 0;
      battle.log.push({ type: 'mechanic', src: self.name, msg: '击破绿泡！全队获得治疗' });
    }
  }
  battle.log.push({
    type: 'attack', src: self.name, tgt: target.name, dmg: real, crit,
    action: meForm ? meForm.label : (zyForm ? zyForm.label : (fEnh ? `${fEnh.resourceName}强化普攻` : '普攻'))
  });
  // 赞妮重斩消耗焰光(普攻键重斩路径)
  if (zyForm) queryCharacterHook(self, 'spendFlameForSlash', battle);
  // 守岸人 5 链:自动多打一个相邻敌人
  if ((self.normalSplit || 1) >= 2) {
    const aliveOthers = battle.enemies.filter(e => e.alive && e !== target);
    if (aliveOthers.length) {
      const extra = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
      const { dmg: dmg2, crit: crit2 } = calcDamage(self, extra, mult, 'normal');
      const real2 = dealDamage(extra, dmg2);
      reduceVibration(extra, VIBRATION_DAMAGE.normalSplit, battle, self);
      applyReflect(battle, self, extra, real2);
      battle.log.push({
        type: 'attack', src: self.name, tgt: extra.name, dmg: real2, crit: crit2,
        action: '链击（5 链）'
      });
    }
  }
  battle.ap -= cost.apCost;
  self.energy = Math.min(self.energyMax, Math.round(self.energy + 12 * (1 + self.resonanceBonus)));
  gainConcerto(self, 8);
  gainForte(self, 'normal');
  if (fEnh) consumeForte(self);
  // 折枝墨鹤追击:己方普攻命中主目标时消耗 1 只墨鹤(不递归)
  fireCraneAssist(battle, target);
  fireTrigger(self, 'normal_hit', { battle, target });
  fireEchoSetTrigger(self, 'normal_hit', battle);
  fireEchoSetTrigger(self, 'normal_or_heavy_hit', battle);
  fireEchoSetOnHitErosion(self, target, battle);
  fireRoleEchoTriggers(self, 'normal_hit', target, battle);
  fireCharacterHook(self, 'onAttack', { battle, target, cost, helpers: { calcDamage, dealDamage } });
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 共鸣技能:1 AP,CD 3 回合,单体 180% atk
export function doSkill(battle, targetIdx) {
  setCurrentBattle(battle);
  const self0 = battle.team[battle.active];
  const check = canSkill(self0, battle, targetIdx);
  if (!check.ok) return check;
  const self = self0;
  const cost = resolveActionCost(self0, 'skill', ACTION_COST.skill);
  const inMindEye = !!queryCharacterHook(self0, 'inMindEye');
  const target = battle.enemies[targetIdx];
  const meForm = queryCharacterHook(self, 'mindEyeForm', 'skill');
  const chunForm = queryCharacterHook(self, 'resolveSkill', battle);
  if (chunForm) queryCharacterHook(self, 'enterHanbao', battle, chunForm.isRefresh);
  const fEnh = (meForm || chunForm) ? null : forteEnhances(self, 'skill');
  let mult;
  if (meForm) mult = meForm.mult;
  else if (chunForm) mult = chunForm.mult;
  else mult = (fEnh && fEnh.effectMult ? ACTION_MULTIPLIER.skill * fEnh.effectMult : ACTION_MULTIPLIER.skill);
  const { dmg, crit } = calcDamage(self, target, mult, 'skill');
  const real = dealDamage(target, dmg);
  reduceVibration(target, VIBRATION_DAMAGE.skill + (fEnh ? VIBRATION_DAMAGE.skillForteBonus : 0), battle, self);
  applyReflect(battle, self, target, real);
  battle.ap -= cost.apCost;
  if (!inMindEye) self.cd.skill = Math.max(1, 3 - (self.skillCdReduce || 0));
  self.energy = Math.min(self.energyMax, Math.round(self.energy + (22 + self.energyRefund) * (1 + self.resonanceBonus)));
  gainConcerto(self, 18);
  gainForte(self, 'skill');

  if (fEnh) consumeForte(self);
  // 菲比 toggleForm dispatch:使用技能后 forte 满自动切换形态
  if (!fEnh && self.forte?.ready && self.forte?.effectType === 'toggleForm') {
    fireCharacterHook(self, 'toggleForm', battle);
    consumeForte(self);
  }

  if (fEnh && fEnh.effectType === 'erosion') {
    target.debuffs = target.debuffs || [];
    target.debuffs.push({ type: 'erosion', element: '气动', value: fEnh.effectMult, duration: 3 });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 进入气动侵蚀（受气动伤害 +${(fEnh.effectMult*100).toFixed(0)}%）` });
  }
  fireTrigger(self, 'skill_hit', { battle, target });
  fireEchoSetTrigger(self, 'skill_hit', battle);
  fireEchoSetTrigger(self, 'heavy_or_skill_hit', battle);
  fireEchoSetOnHitErosion(self, target, battle);
  fireRoleEchoTriggers(self, 'skill_hit', target, battle);
  // 治疗型技能
  if (self.type === '辅助' || self.type === '治疗') {
    fireTrigger(self, 'heal_skill', { battle });
  }
  battle.log.push({
    type: 'skill', src: self.name, tgt: target.name, dmg: real, crit,
    action: meForm ? meForm.label : (chunForm ? chunForm.label : (fEnh ? `${fEnh.resourceName}强化技能` : '共鸣技能'))
  });
  fireCharacterHook(self, 'onSkill', { battle, target, cost, helpers: { calcDamage, dealDamage } });
  fireCraneAssist(battle, target);
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 共鸣解放:3 AP,能量满,AOE,主目标 400% / 副目标 200%
export function doBurst(battle) {
  setCurrentBattle(battle);
  const self = battle.team[battle.active];
  const check = canBurst(self, battle);
  if (!check.ok) return check;

  const characterBurst = queryCharacterHook(self, 'resolveBurst', battle);
  if (characterBurst) {
    fireCharacterHook(self, 'onBurst', { battle });
    battle.log.push({
      type: 'burst', src: self.name, results: characterBurst.results || [],
      action: characterBurst.action
    });
    finishIfBattleEnded(battle, 'win');
    return { ok: true };
  }

  const aliveEnemies = battle.enemies.filter(e => e.alive);
  const targetIdx = (typeof battle.targetIdx === 'number') ? battle.targetIdx : -1;
  const primary = (battle.enemies[targetIdx] && battle.enemies[targetIdx].alive) ? battle.enemies[targetIdx] : aliveEnemies[0];
  const fEnh = forteEnhances(self, 'burst');
  const { ruiyiMult = 1.0 } = queryCharacterHook(self, 'burstRuiyi', battle) || {};
  const characterBurstDamage = queryCharacterHook(self, 'resolveBurstDamage', battle, {
    calcDamage,
    dealDamage,
    reduceVibration,
    applyReflect,
    VIBRATION_DAMAGE
  });
  const characterBurstMult = characterBurstDamage ? null : queryCharacterHook(self, 'resolveBurstMult');
  const baseMain = characterBurstMult?.baseMain ?? ACTION_MULTIPLIER.burstMain * (fEnh ? fEnh.effectMult : 1.0) * ruiyiMult;
  const baseSide = characterBurstMult?.baseSide ?? ACTION_MULTIPLIER.burstSide * (fEnh ? fEnh.effectMult : 1.0) * ruiyiMult;
  const results = characterBurstDamage?.results || aliveEnemies.map(e => {
    const mult = (e === primary) ? baseMain : baseSide;
    const { dmg, crit } = calcDamage(self, e, mult, 'burst');
    const real = dealDamage(e, dmg);
    reduceVibration(e, VIBRATION_DAMAGE.burst, battle, self);
    applyReflect(battle, self, e, real);
    return { tgt: e.name, dmg: real, crit, primary: e === primary };
  });
  battle.ap -= queryCharacterHook(self, 'resolveBurstCost', battle) ?? ACTION_COST.burst;
  self.energy = 0;
  gainConcerto(self, 30);
  gainForte(self, 'burst');
  if (fEnh) consumeForte(self);
  if (fEnh && fEnh.effectType === 'teamShield') {
    battle.team.forEach(t => {
      if (t.alive) {
        const sh = Math.round(t.hpMax * fEnh.effectMult);
        t.shield = (t.shield || 0) + sh;
      }
    });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `全队展开领域，获得最大生命 ${(fEnh.effectMult*100).toFixed(0)}% 护盾` });
  }
  if (fEnh && fEnh.effectType === 'burstWindow') {
    self.buffs.push({ type: 'burstWindow', value: fEnh.effectMult - 1, duration: 2 });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `进入强化形态（攻击/技能 +${((fEnh.effectMult-1)*100).toFixed(0)}%，持续 2 回合）` });
  }

  fireCharacterHook(self, 'onBurst', { battle, target: primary });
  fireTrigger(self, 'burst_cast', { battle });
  fireEchoSetTrigger(self, 'burst_cast', battle);
  if (primary) fireEchoSetOnHitErosion(self, primary, battle);
  fireRoleEchoTriggers(self, 'burst_cast', primary, battle);
  if (self.concerto >= 100) {
    consumeConcerto(self, battle);
  }
  if (!queryCharacterHook(self, 'skipCraneAssistOnBurst')) fireCraneAssist(battle, primary);
  battle.log.push({
    type: 'burst', src: self.name, results,
    action: characterBurstDamage?.action || (fEnh ? `${fEnh.resourceName}强化解放` : '共鸣解放')
  });

  // 其他治疗/辅助位(非守岸人):解放时一次性治疗全队
  if ((self.type === '辅助' || self.type === '治疗') && !queryCharacterHook(self, 'skipGenericBurstHeal')) {
    const healAmt = Math.round(self.atk * 1.5 * (1 + (self.healBonus || 0)));
    battle.team.forEach(t => {
      if (t.alive) {
        const healUp = (t.buffs || []).reduce((a, b) => b.type === 'healUp' ? a + b.value : a, 0);
        const finalHeal = Math.round(healAmt * (1 + healUp));
        const healed = Math.min(t.hpMax - t.hp, finalHeal);
        t.hp += healed;
        if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed });
      }
    });
  }
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 重击:2 AP,CD 1,220% atk · 重击伤害类型 · 削破韧 25
export function doHeavy(battle, targetIdx) {
  setCurrentBattle(battle);
  const self0 = battle.team[battle.active];
  const check = canHeavy(self0, battle, targetIdx);
  if (!check.ok) return check;
  const self = self0;
  const cost = resolveActionCost(self0, 'heavy', ACTION_COST.heavy);
  const inMindEye = !!queryCharacterHook(self0, 'inMindEye');

  // 折枝重击「点睛」:消耗半数墨鹤转全队护盾,不造成伤害、不触发墨鹤追击
  const inkShieldHandled = queryCharacterHook(self, 'inkShield', battle);
  if (inkShieldHandled) {
    battle.ap -= ACTION_COST.heavy;
    self.cd.heavy = 2;
    gainConcerto(self, 14);
    gainForte(self, 'heavy');
    fireTrigger(self, 'heavy_hit', { battle });
    finishIfBattleEnded(battle, 'win');
    return { ok: true };
  }

  const target = battle.enemies[targetIdx];

  const furoloDirgeForm = queryCharacterHook(self, 'resolveHeavy', battle);

  // 安可特殊重击:失序值满时重击改为白咩·失控之炎 / 黑咩·暴走之炎
  const encoreForm = queryCharacterHook(self, 'resolveHeavy');
  const meForm = queryCharacterHook(self, 'mindEyeForm', 'heavy');
  const heavyMult = furoloDirgeForm
    ? furoloDirgeForm.mult
    : (meForm
        ? meForm.mult
        : (encoreForm?.special ? encoreForm.mult : ACTION_MULTIPLIER.heavy));
  const heavyType = furoloDirgeForm ? furoloDirgeForm.dmgType : (meForm ? meForm.dmgType : (encoreForm?.special ? encoreForm.dmgType : 'heavy'));
  const { dmg, crit } = calcDamage(self, target, heavyMult, heavyType, { explicitHpMult: !!furoloDirgeForm });
  const real = dealDamage(target, dmg);
  reduceVibration(target, encoreForm?.special ? VIBRATION_DAMAGE.heavySpecial : VIBRATION_DAMAGE.heavy, battle, self);
  applyReflect(battle, self, target, real);
  battle.ap -= cost.apCost;
  if (!inMindEye) self.cd.heavy = 1;
  battle._heavyUsedThisTurn = true;
  self.energy = Math.min(self.energyMax, Math.round(self.energy + 15 * (1 + self.resonanceBonus)));
  gainConcerto(self, 14);
  gainForte(self, 'heavy');
  fireTrigger(self, 'heavy_hit', { battle, target });
  fireEchoSetTrigger(self, 'heavy_hit', battle);
  fireEchoSetTrigger(self, 'normal_or_heavy_hit', battle);
  fireEchoSetTrigger(self, 'heavy_or_skill_hit', battle);
  fireEchoSetOnHitErosion(self, target, battle);
  fireRoleEchoTriggers(self, 'heavy_hit', target, battle);
  let heavyAction = meForm ? meForm.label : '重击';
  if (furoloDirgeForm) heavyAction = furoloDirgeForm.label;
  fireCharacterHook(self, 'onHeavy', { battle, target, form: furoloDirgeForm });
  const encoreHeavyAction = queryCharacterHook(self, 'finishHeavy', battle, encoreForm);
  if (encoreHeavyAction) heavyAction = encoreHeavyAction;
  battle.log.push({ type: 'heavy', src: self.name, tgt: target.name, dmg: real, crit, action: heavyAction });
  // 重击也能击破绿泡
  if (target._bubbleHp > 0) {
    target._bubbleHp -= real;
    if (target._bubbleHp <= 0) {
      const healAmt = target._bubbleHealAmt || 0;
      if (healAmt > 0) {
        battle.team.forEach(t => {
          if (t.alive) {
            const healed = Math.min(t.hpMax - t.hp, healAmt);
            t.hp += healed;
            if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed, msg: '抢到绿泡治疗！' });
          }
        });
      }
      target._bubbleHp = 0;
      target._bubbleHealAmt = 0;
      battle.log.push({ type: 'mechanic', src: self.name, msg: '击破绿泡！全队获得治疗' });
    }
  }
  fireCharacterHook(self, 'onHeavy', { battle, target, cost });
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 投掷残骸(聚械机偶特殊动作 · 0 AP)
// 仅当 BOSS 掉落残骸时可使用
export function doDebris(battle) {
  setCurrentBattle(battle);
  if (battle.finished) return { ok: false, err: '战斗已结束' };
  const self = battle.team[battle.active];
  if (!self || !self.alive || self.frozenTurns > 0) return { ok: false, err: '当前角色不可行动' };
  const enemy = battle.enemies.find(e => e.alive && e._debrisReady);
  if (!enemy) return { ok: false, err: '没有可投掷的残骸' };
  enemy.suppressed = Math.max(enemy.suppressed || 0, 1);
  enemy.suppressedVuln = 0.5;
  enemy._debrisReady = false;
  battle.log.push({ type: 'mechanic', src: self.name, msg: `投掷残骸！${enemy.name} 被中断 1 回合（受伤 +50%）` });
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 切换角色(每回合限 1 次)
// 每次切人触发简化版变奏(入场角色对敌方一击 + 削破韧)
// 协奏满时强化:变奏伤害提升 + 武器 outro/variation 触发器激活
export function doSwitch(battle, toIdx) {
  setCurrentBattle(battle);
  if (battle.finished) return { ok: false, err: '战斗已结束' };
  if (toIdx === battle.active) return { ok: false, err: '已在该角色' };
  if (battle.switchUsedThisTurn) return { ok: false, err: '本回合已经切换过角色' };
  const target = battle.team[toIdx];
  if (!target || !target.alive) return { ok: false, err: '目标不可切换' };
  if (target.frozenTurns > 0) return { ok: false, err: '目标被冻结' };
  // 雷霆墙:锁定切换
  const cur = battle.team[battle.active];
  if (cur && (cur._wallLocked || 0) > 0) return { ok: false, err: `被雷霆墙锁定，不可切换` };
  const prev = cur;
  const concertoFull = prev && (prev.concerto || 0) >= 100;
  battle.active = toIdx;
  battle.switchUsedThisTurn = true;

  // 离场角色延奏 → 给入场角色一个"上场增益"
  if (prev && prev.alive) {
    onUnitSwitchOut(prev, battle);
    fireTrigger(prev, 'outro', { battle });
    fireSwitchOutHook({ from: prev, to: target, battle });
  }
  // 入场角色变奏:对当前主目标造成一段伤害
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  let variationTarget = null;
  if (aliveEnemies.length) {
    const tgt = aliveEnemies[0];
    variationTarget = tgt;
    let variMult = concertoFull ? ACTION_MULTIPLIER.concertoVariation : ACTION_MULTIPLIER.variation;
    if (target.variationBonus > 0) {
      variMult *= (1 + target.variationBonus);
    }
    const { dmg, crit } = calcDamage(target, tgt, variMult, 'normal');
    const real = dealDamage(tgt, dmg);
    reduceVibration(tgt, concertoFull ? VIBRATION_DAMAGE.concertoVariation : VIBRATION_DAMAGE.variation, battle, target);
    applyReflect(battle, target, tgt, real);
    battle.log.push({
      type: 'attack', src: target.name, tgt: tgt.name, dmg: real, crit,
      action: target.variationBonus > 0 ? '强化变奏 · 6链' : (concertoFull ? '强化变奏' : '变奏')
    });
  }
  if (concertoFull) {
    prev.concerto = 0;
    fireTrigger(target, 'variation', { battle });
    fireEchoSetTrigger(target, 'variation_in', battle);
    fireRoleEchoTriggers(target, 'variation_in', variationTarget || battle.enemies.find(e => e.alive), battle, prev);
    battle.log.push({ type: 'mechanic', src: prev.name, msg: `协奏满 · ${prev.name} 延奏 → ${target.name} 强化变奏` });
  }
  battle.log.push({ type: 'switch', src: target.name, action: '切换上场' });
  fireSwitchHook({ from: prev, to: target, battle, ctx: { variationTarget } });
  fireCharacterHook(target, 'onVariation', { battle, variationTarget });
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}
