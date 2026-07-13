// 伤害计算流水线 · 从 combat.js 拆出(Stage 4)
//
// 内容:
//   · calcDamage(attacker, defender, mult, dmgType, opts) → { dmg, crit, resistMult, vibrMult }
//   · dealDamage(target, dmg) → 实扣血量(经过挡刀/护盾/防御 buff/致死免疫)
//   · damageSummon / spawnSummon / removeSummon / tickSummons / tickSummonsDuration
//   · setCurrentBattle / getCurrentBattle - dealDamage 需要 access battle.summons / battle.log
//
// _currentBattle 是模块级单例:所有 dealDamage 调用共享同一个 battle 引用,由 doAttack/doSkill/doBurst
// 在进入伤害流水线前 setCurrentBattle(battle)。

import { computeStat } from '../tempStats.js';
import { collectWeaponBonus } from '../weaponTriggers.js';
import { resistMultiplier, vibrationMultiplier } from '../elements.js';
import { applyEnemyDefendHook } from '../enemyMechanics.js';
import { voidErosionDefMult } from './effects.js';
import { ACTION_MULTIPLIER } from '../balance.js';

// Phase 4:切断 damage.js → characters/index.js 循环依赖
// damage.js 不再直接 import queryCharacterHook,改为通过注入的 resolver 调用。
// 默认 resolver 返回 undefined(行为与无角色机制时一致);
// combat orchestration (actions.js/turnEnd.js) 在 setCurrentBattle 时
// 一并调用 setDamageHooksResolver 注入真实 queryCharacterHook。
let _resolveCharacterHook = () => undefined;
export function setDamageHooksResolver(fn) { _resolveCharacterHook = fn || (() => undefined); }
export function getDamageHooksResolver() { return _resolveCharacterHook; }
function queryHook(self, hookName, ...args) { return _resolveCharacterHook(self, hookName, ...args); }

// ===== 伤害计算 =====
// dmgType: 'normal' | 'skill' | 'burst' | 'heavy' | 'variation'
// HP 核 + variation：hpMultOverride 为设计变奏 HP 倍率；multiplier 仍走 ACTION_MULTIPLIER
// 的 0.8/1.6（及 variationBonus），用 multiplier/variation 基线把协奏强化叠上去，
// 避免旧路径 dmgType:'normal' 时被普攻 HP% 覆写、协奏无效。
export function calcDamage(attacker, defender, multiplier, dmgType, opts = {}) {
  // 武器触发器实时加成
  const wb = collectWeaponBonus(attacker, dmgType, { target: defender });
  // buff 中的 atkUp（守岸人 2 链等）
  const buffAtkUp = (attacker.buffs || []).reduce((a, b) => b.type === 'atkUp' ? a + b.value : a, 0);
  const hpCore = queryHook(attacker, 'hpCore', dmgType, opts);
  let baseStat;
  let hpMultOverride = null;
  if (hpCore) {
    baseStat = computeStat(attacker, hpCore.baseStat, attacker[hpCore.baseStat]) * (hpCore.baseMultiplier ?? 1);
    // explicitHpMult：调用方传入的 multiplier 已是生命%，勿再套表内普攻/重击 override
    hpMultOverride = opts.explicitHpMult ? null : hpCore.hpMultOverride;
  } else {
    baseStat = attacker.atk * (1 + wb.atkBonus + buffAtkUp);
  }
  let atkRaw;
  if (hpCore && dmgType === 'variation' && hpMultOverride != null) {
    const varBase = ACTION_MULTIPLIER.variation || 0.8;
    atkRaw = baseStat * hpMultOverride * (multiplier / varBase);
  } else {
    atkRaw = baseStat * (hpMultOverride !== null ? hpMultOverride : multiplier);
  }
  // 类型加成
  let typeBonus = 1;
  if (dmgType === 'normal') typeBonus += (attacker.normalBonus || 0) + wb.normalBonus;
  else if (dmgType === 'skill') typeBonus += (attacker.skillBonus || 0) + wb.skillBonus;
  else if (dmgType === 'burst') typeBonus += (attacker.burstBonus || 0) + wb.burstBonus;
  else if (dmgType === 'heavy') typeBonus += (attacker.heavyBonus || 0) + wb.heavyBonus;
  // variation：协奏/链加成已在 doSwitch 的 multiplier 上，不再吃 normalBonus
  // 临时 buff（如忌炎 4 链 奇正：全队重击 +25% / 椿 4 链 全队普攻）
  const heavyDmgBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'heavyDmgUp' ? a + b.value : a, 0);
  if (dmgType === 'heavy') typeBonus += heavyDmgBuff;
  const normalDmgBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'normalDmgUp' ? a + b.value : a, 0);
  if (dmgType === 'normal') typeBonus += normalDmgBuff;
  // 全伤害加深（尤诺 2/3 链等 allDmgUp buff）
  const allDmgUpBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'allDmgUp' ? a + b.value : a, 0);
  if (allDmgUpBuff && dmgType !== 'variation') typeBonus += allDmgUpBuff;
  // 角色专属声骸套装 5 件运行时触发：技能伤害 / 解放伤害加成
  const skillDmgBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'skillDmgUp' ? a + b.value : a, 0);
  if (dmgType === 'skill') typeBonus += skillDmgBuff;
  const burstDmgBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'burstDmgUp' ? a + b.value : a, 0);
  if (dmgType === 'burst') typeBonus += burstDmgBuff;
  // 元素加成
  const elemBase = (attacker.elemBonus?.[attacker.element] || 0) + (attacker.elemAllBonus || 0);
  const elemAdd = wb.elemBonus?.[attacker.element] || 0;
  const elemAllUpBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'elemAllUp' ? a + b.value : a, 0);
  const echoElemBuff = (attacker.buffs || []).reduce((a, b) =>
    b.type === 'echoElemDmg' && b.element === attacker.element ? a + b.value : a, 0);
  // 元素专属加深（夏空 elemAeroUp / 露帕追猎 elemFusionUp 等）
  const elemAeroUpBuff = attacker.element === '气动'
    ? (attacker.buffs || []).reduce((a, b) => b.type === 'elemAeroUp' ? a + b.value : a, 0)
    : 0;
  const elemFusionUpBuff = attacker.element === '热熔'
    ? (attacker.buffs || []).reduce((a, b) => b.type === 'elemFusionUp' ? a + b.value : a, 0)
    : 0;
  const elemBonus = 1 + elemBase + elemAdd + elemAllUpBuff + echoElemBuff + elemAeroUpBuff + elemFusionUpBuff;
  // 强化窗口:卡卡罗 burstWindow、安可黑咩形态等
  const burstWin = attacker.buffs?.find(b => b.type === 'burstWindow');
  let windowBonus = burstWin && (dmgType === 'normal' || dmgType === 'skill') ? (1 + burstWin.value) : 1;
  windowBonus *= queryHook(attacker, 'windowMultiplier', dmgType) || 1;
  // 六种元素异常效应不通过加深 debuff 影响伤害（风蚀/光噪/电磁是 DoT，聚爆/霜渐是累积爆发，虚湮走 defMult）
  let debuffBonus = 1;
  if (wb.condBonus) debuffBonus += wb.condBonus;
  // 吟霖审判印记
  const mark = defender.judgeMark;
  if (mark && mark.layers > 0) {
    const perStack = attacker.yinlinMarkVulnPerStack || 0;
    if (perStack > 0) debuffBonus += perStack * mark.layers;
    debuffBonus *= queryHook(attacker, 'markedTargetMultiplier', dmgType) || 1;
  }
  // 千咲虚无绞痕 / 终焉等角色标记增伤（hook 返回倍率，默认 1）
  const markDmgMult = queryHook(attacker, 'getMarkDamageBonus', defender);
  if (markDmgMult != null && markDmgMult !== 1) debuffBonus *= markDmgMult;
  // 防御穿透(含焰羽等临时 pierceUp buff)
  const pierceBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'pierceUp' ? a + b.value : a, 0);
  const hookPierce = queryHook(attacker, 'extraPierce', dmgType) || 0;
  const totalPierce = (attacker.pierceDef || 0) + wb.defPierce + pierceBuff + hookPierce;
  // 虚湮效应：每层 -2% 防御
  const voidDefMult = voidErosionDefMult(defender);
  const defEffective = defender.def * (1 - Math.min(1, totalPierce)) * voidDefMult;
  const atkLv = attacker.level || 1;
  const mitigation = defEffective / (800 + 8 * atkLv + defEffective);
  const defMult = 1 - mitigation;
  // 抗性（荣光等 elemResistIgnore：在抗性乘区上加回无视比例）
  const resistIgnore = (attacker.buffs || []).reduce((a, b) => {
    if (b.type !== 'elemResistIgnore') return a;
    if (b.element && b.element !== attacker.element) return a;
    return a + (b.value || 0);
  }, 0);
  const resistMult = Math.min(2, resistMultiplier(attacker.element, defender) + resistIgnore);
  const vibrMult = vibrationMultiplier(defender);
  // 暴击
  const crateBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'crateUp' ? a + b.value : a, 0);
  const cdmgBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'cdmgUp' ? a + b.value : a, 0);
  const hookCrate = queryHook(attacker, 'crateBonus', defender) || 0;
  const totalCrate = attacker.crate + (wb.crateBonus || 0) + crateBuff + hookCrate;
  const effectiveCdmg = attacker.cdmg + cdmgBuff;
  const isCrit = Math.random() < totalCrate;
  const critMult = isCrit ? effectiveCdmg : 1.0;
  let dmg = (atkRaw + 50) * typeBonus * elemBonus * defMult * resistMult * vibrMult * critMult * windowBonus * debuffBonus;
  dmg = Math.max(1, Math.round(dmg));
  return { dmg, crit: isCrit, resistMult, vibrMult };
}

// ===== 当前战斗上下文 =====
// dealDamage 内的 5 链致命伤等需要 access battle.log / battle.summons
// Phase 4:setCurrentBattle 同时接收 hook resolver,由 combat orchestration 注入,
// 避免 damage.js 直接 import characters/index.js 形成循环依赖。
// 注意:resolveHook 必须显式传入;省略时会把 resolver 复位为 no-op,
// 避免上一场战斗的 resolver 残留到下一场(状态泄露)。
let _currentBattle = null;
let _currentResolveHook = null;
export function setCurrentBattle(b, resolveHook = null) {
  _currentBattle = b;
  _currentResolveHook = resolveHook;
  setDamageHooksResolver(resolveHook);
}
export function getCurrentBattle() { return _currentBattle; }
export function getCurrentResolveHook() { return _currentResolveHook; }

// 扣血(处理护盾、防御 buff、敌方特殊减伤、召唤物挡刀)
export function dealDamage(target, dmg) {
  // 召唤物挡刀:target 是玩家单位且有存活挡刀召唤物时,优先打召唤物
  if (target._isPlayerUnit && _currentBattle && _currentBattle.summons?.length) {
    const ownerIdx = _currentBattle.team.indexOf(target);
    const shielder = _currentBattle.summons.find(s =>
      s.alive && s.ownerIdx === ownerIdx && typeof s.onOwnerDamaged === 'function'
    );
    if (shielder) {
      const overflow = shielder.onOwnerDamaged(shielder, dmg, _currentBattle);
      if (overflow <= 0) return 0;
      dmg = overflow;
    }
  }
  // 防御 buff
  const defBuff = target.buffs?.find(b => b.type === 'defense');
  if (defBuff) dmg = Math.round(dmg * (1 - defBuff.value));
  // 全伤害减免（夏空 5 链 allDmgDown 等）
  const allDown = (target.buffs || []).reduce((a, b) => b.type === 'allDmgDown' ? a + b.value : a, 0);
  if (allDown > 0) dmg = Math.round(dmg * (1 - Math.min(0.9, allDown)));
  // 敌方特殊减伤/无敌/易伤
  dmg = applyEnemyDefendHook(target, dmg);
  if (dmg <= 0) return 0;
  // 护盾
  if (target.shield && target.shield > 0) {
    if (dmg <= target.shield) { target.shield -= dmg; return 0; }
    else { dmg -= target.shield; target.shield = 0; }
  }
  if (target.hp - dmg <= 0) {
    if (queryHook(target, 'onLethal', _currentBattle, dmg)) {
      return 0;
    }
  }
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp <= 0) target.alive = false;
  return dmg;
}

// 召唤物受伤(独立路径,不走主人 defense/护盾,但走自身 defense buff)
export function damageSummon(summon, dmg) {
  const defBuff = summon.buffs?.find(b => b.type === 'defense');
  if (defBuff) dmg = Math.round(dmg * (1 - defBuff.value));
  summon.hp = Math.max(0, summon.hp - dmg);
  if (summon.hp <= 0 && summon.alive) {
    summon.alive = false;
    summon.onDeath?.(summon, _currentBattle);
  }
  return dmg;
}

// 创建召唤物并加入 battle.summons
export function spawnSummon(battle, summonDef) {
  const summon = {
    id: `${summonDef.id}_${Date.now()}`,
    name: summonDef.name,
    ownerIdx: summonDef.ownerIdx,
    ownerName: summonDef.ownerName,
    hp: summonDef.hp,
    hpMax: summonDef.hp,
    atk: summonDef.atk || 0,
    def: summonDef.def || 0,
    element: summonDef.element || '物理',
    duration: summonDef.duration || 0,
    alive: true,
    buffs: [],
    _isSummon: true,
    onTurnStart: summonDef.onTurnStart || null,
    onOwnerDamaged: summonDef.onOwnerDamaged || null,
    onDeath: summonDef.onDeath || null,
    ...summonDef.extra
  };
  battle.summons.push(summon);
  battle.log.push({ type: 'summon', src: summonDef.ownerName, tgt: summonDef.name, msg: `${summonDef.ownerName} 召唤 ${summonDef.name}（HP ${summonDef.hp}，持续 ${summonDef.duration} 回合）` });
  return summon;
}

export function removeSummon(battle, summonId) {
  const idx = battle.summons.findIndex(s => s.id === summonId);
  if (idx < 0) return;
  const s = battle.summons[idx];
  s.alive = false;
  battle.summons.splice(idx, 1);
}

// 回合开始时触发所有召唤物的 onTurnStart(主人回合开始时)
export function tickSummons(battle, ownerIdx) {
  for (const s of [...battle.summons]) {
    if (!s.alive || s.ownerIdx !== ownerIdx) continue;
    s.onTurnStart?.(s, battle);
  }
}

// 回合结束时所有召唤物 duration - 1
export function tickSummonsDuration(battle) {
  for (const s of [...battle.summons]) {
    if (!s.alive) continue;
    s.duration -= 1;
    if (s.duration <= 0) {
      s.alive = false;
      s.onDeath?.(s, battle);
      battle.log.push({ type: 'mechanic', src: s.ownerName, msg: `${s.name} 持续结束，消散` });
    }
  }
  battle.summons = battle.summons.filter(s => s.alive);
}
