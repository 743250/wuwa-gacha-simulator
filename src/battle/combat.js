// 战斗引擎：AP 回合制
// 玩家手动控制，敌方 AI 简单出招
//
// 战斗实例结构：见 createBattle()
// 对外暴露的核心 API：
//   createBattle(teamNames, enemyNames, options) → battle
//   doAction(battle, action) → { ok, log }   action: { type:'attack'|'skill'|'heavy'|'burst'|'switch', targetIdx?, switchTo? }
//   endTurn(battle) → 敌方回合 + 清理 buff
//   isWin(battle) / isLose(battle)

import { S } from '../state.js';
import { computeBattleStats } from './stats.js';
import { applyChainBonuses, applyTeamAuras, getEnergyRefund } from './chains.js';
import { spawnEnemy } from './enemies.js';
import { resistMultiplier, vibrationMultiplier } from './elements.js';
import { initForte, gainForte, consumeForte, forteEnhances } from './forte.js';
import { fireTrigger, collectWeaponBonus, tickWeaponTriggers } from './weaponTriggers.js';

// 创建战斗实例
// teamNames: 长度 1-3 的角色名数组（null 跳过）
// enemyNames: 长度 1-3 的敌人名数组
export function createBattle(teamNames, enemyNames, opts = {}) {
  const team = teamNames.filter(Boolean).map((n, idx) => createTeamUnit(n, idx));
  if (team.length === 0) return null;
  // 应用全队 buff（光环/守岸人之类）
  applyTeamAuras(team);

  const enemies = enemyNames.map((n, idx) => {
    const e = spawnEnemy(n, opts.enemyScale || 1.0);
    if (e) e.idx = idx + 100;
    return e;
  }).filter(Boolean);

  const battle = {
    turn: 1,
    ap: 4,
    apMax: 4,
    active: 0,                  // 当前出手队员 idx（0/1/2）
    team,
    enemies,
    log: [],
    finished: false,
    result: null,               // 'win' | 'lose' | null
    initialHpTotal: team.reduce((a, t) => a + t.hpMax, 0),
    burstUsedThisTurn: false,   // 本回合用过解放后限制切人?（先不做这个限制）
    switchUsedThisTurn: false,  // 本回合是否已切人（每回合限 1 次）
    // 评星辅助
    burnTimer: {},              // 持续效果累计
    freezeOn: {}                // {teamIdx: turnsLeft}
  };
  battle.log.push({ type: 'system', msg: `战斗开始！队伍 ${team.map(t=>t.name).join(' / ')} VS ${enemies.map(e=>e.name).join(' / ')}` });
  battle.log.push({ type: 'system', msg: `回合 1 · 当前出手：${team[0].name}` });
  return battle;
}

function createTeamUnit(roleName, idx) {
  const s = computeBattleStats(roleName);
  if (!s) return null;
  const unit = {
    name: roleName,
    idx,
    chain: s.chain,
    level: s.level,
    hp: s.hp,
    hpMax: s.hp,
    atk: s.atk,
    def: s.def,
    crate: s.crate,
    cdmg: s.cdmg,
    dodge: s.dodge || 0,
    energy: 0,
    energyMax: s.maxEnergy,
    element: s.element,
    type: s.type,
    cd: { skill: 0, heavy: 0 },
    buffs: [],
    elemBonus: { ...(s.elemBonus || {}) },
    elemAllBonus: s.elemAllBonus || 0,
    normalBonus: s.normalBonus || 0,
    skillBonus: s.skillBonus || 0,
    burstBonus: s.burstBonus || 0,
    heavyBonus: s.heavyBonus || 0,
    healBonus: s.healBonus || 0,
    pierceDef: s.defPierce || 0,
    skillCdReduce: s.skillCdReduce || 0,
    resonanceBonus: s.resonanceBonus || 0,
    weapon: s.weapon,
    weaponTriggers: s.weaponTriggers || [],
    weaponStacks: {},                       // 触发器运行时叠层状态
    _weaponTeamAtk: s.teamAtkBonus || 0,
    alive: true,
    frozenTurns: 0,
    energyRefund: 0,
    concerto: 0                             // 协奏值 0-100
  };
  initForte(unit);
  applyChainBonuses(unit);
  unit.energyRefund = getEnergyRefund(unit);
  return unit;
}

// ===== 伤害计算 =====
// dmgType: 'normal' | 'skill' | 'burst' | 'heavy'
function calcDamage(attacker, defender, multiplier, dmgType) {
  // 武器触发器实时加成
  const wb = collectWeaponBonus(attacker, dmgType, { target: defender });
  // 临时增强后的攻击
  const atkWithBuff = attacker.atk * (1 + wb.atkBonus);
  const atkRaw = atkWithBuff * multiplier;
  // 类型加成
  let typeBonus = 1;
  if (dmgType === 'normal') typeBonus += (attacker.normalBonus || 0) + wb.normalBonus;
  else if (dmgType === 'skill') typeBonus += (attacker.skillBonus || 0) + wb.skillBonus;
  else if (dmgType === 'burst') typeBonus += (attacker.burstBonus || 0) + wb.burstBonus;
  else if (dmgType === 'heavy') typeBonus += (attacker.heavyBonus || 0) + wb.heavyBonus;
  // 元素加成
  const elemBase = (attacker.elemBonus?.[attacker.element] || 0) + (attacker.elemAllBonus || 0);
  const elemAdd = wb.elemBonus?.[attacker.element] || 0;
  const elemBonus = 1 + elemBase + elemAdd;
  // 卡卡罗 burstWindow：普攻/技能 +50%
  const burstWin = attacker.buffs?.find(b => b.type === 'burstWindow');
  const windowBonus = burstWin && (dmgType === 'normal' || dmgType === 'skill') ? (1 + burstWin.value) : 1;
  // 卡提希娅气动侵蚀类 debuff
  let debuffBonus = 1;
  if (defender.debuffs) {
    defender.debuffs.forEach(d => {
      if (d.type === 'erosion' && d.element === attacker.element) {
        debuffBonus += d.value;
      }
    });
  }
  // 卡提希娅武器条件加成
  if (wb.condBonus) debuffBonus += wb.condBonus;
  // 防御穿透
  const totalPierce = (attacker.pierceDef || 0) + wb.defPierce;
  const defEffective = defender.def * (1 - totalPierce);
  // 抗性
  const resistMult = resistMultiplier(attacker.element, defender);
  const vibrMult = vibrationMultiplier(defender);
  // 暴击（武器叠加暴击率？例如琼枝冰绡）
  const totalCrate = attacker.crate + (wb.crateBonus || 0);
  const isCrit = Math.random() < totalCrate;
  const critMult = isCrit ? attacker.cdmg : 1.0;
  let dmg = (atkRaw + 50) * typeBonus * elemBonus * resistMult * vibrMult * critMult * windowBonus * debuffBonus;
  dmg = Math.max(50, dmg - defEffective * 0.4);
  dmg = Math.round(dmg);
  return { dmg, crit: isCrit, resistMult, vibrMult };
}

// 扣血（处理护盾、防御 buff、卡卡罗 burstWindow buff）
function dealDamage(target, dmg) {
  // 防御 buff
  const defBuff = target.buffs?.find(b => b.type === 'defense');
  if (defBuff) dmg = Math.round(dmg * (1 - defBuff.value));
  // 护盾
  if (target.shield && target.shield > 0) {
    if (dmg <= target.shield) { target.shield -= dmg; return 0; }
    else { dmg -= target.shield; target.shield = 0; }
  }
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp <= 0) target.alive = false;
  return dmg;
}

// 协奏值：满 100 切人时触发变奏/延奏（暂未实装变奏，只显示）
function gainConcerto(unit, amount) {
  unit.concerto = Math.min(100, (unit.concerto || 0) + amount);
}

// 协奏值消耗（变奏/延奏触发，触发武器被动）
function consumeConcerto(unit, battle) {
  if ((unit.concerto || 0) < 100) return false;
  unit.concerto = 0;
  // 触发武器：消耗协奏
  fireTrigger(unit, 'concerto_consume', { battle });
  battle.log.push({ type: 'mechanic', src: unit.name, msg: '协奏满 → 触发变奏 / 延奏' });
  return true;
}

// 削减敌人破韧值，归零进入易伤 2 回合（破韧瞬间不算）
function reduceVibration(enemy, amount) {
  if (!enemy || !enemy.alive) return;
  if (enemy.vibrationBroken > 0) return;   // 已经在易伤期，不再削
  enemy.vibration = Math.max(0, (enemy.vibration ?? 100) - amount);
  if (enemy.vibration <= 0) {
    enemy.vibrationBroken = 2;             // 持续到下次自己回合开始
    enemy._brokenFresh = true;             // 标记本回合刚破韧，end-of-turn 不减
    enemy.vibration = enemy.vibrationMax || 100;
  }
}

// ===== 玩家动作 =====

// 普攻：1 AP，单体，100% atk
export function doAttack(battle, targetIdx) {
  if (battle.finished || battle.ap < 1) return { ok: false, err: 'AP 不足' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  const fEnh = forteEnhances(self, 'normal');
  const mult = fEnh ? 1.0 * fEnh.effectMult : 1.0;
  const { dmg, crit } = calcDamage(self, target, mult, 'normal');
  const real = dealDamage(target, dmg);
  reduceVibration(target, 8 + (fEnh ? 12 : 0));
  battle.ap -= 1;
  self.energy = Math.min(self.energyMax, self.energy + 12);
  // 协奏值：受共鸣效率影响
  gainConcerto(self, 8 * (1 + self.resonanceBonus));
  gainForte(self, 'normal');
  if (fEnh) consumeForte(self);
  // 触发武器被动：普攻命中
  fireTrigger(self, 'normal_hit', { battle, target });
  battle.log.push({
    type: 'attack', src: self.name, tgt: target.name, dmg: real, crit,
    action: fEnh ? `${fEnh.resourceName}强化普攻` : '普攻'
  });
  return { ok: true };
}

// 共鸣技能：1 AP，CD 3 回合，单体 180% atk
export function doSkill(battle, targetIdx) {
  if (battle.finished || battle.ap < 1) return { ok: false, err: 'AP 不足' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.cd.skill > 0) return { ok: false, err: `技能冷却中（${self.cd.skill} 回合）` };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  const fEnh = forteEnhances(self, 'skill');
  const mult = fEnh ? 1.8 * fEnh.effectMult : 1.8;
  const { dmg, crit } = calcDamage(self, target, mult, 'skill');
  const real = dealDamage(target, dmg);
  reduceVibration(target, 20 + (fEnh ? 20 : 0));
  battle.ap -= 1;
  self.cd.skill = Math.max(1, 3 - (self.skillCdReduce || 0));
  self.energy = Math.min(self.energyMax, self.energy + 22 + self.energyRefund);
  gainConcerto(self, 18 * (1 + self.resonanceBonus));
  gainForte(self, 'skill');
  if (fEnh) consumeForte(self);
  if (fEnh && fEnh.effectType === 'erosion') {
    target.debuffs = target.debuffs || [];
    target.debuffs.push({ type: 'erosion', element: '气动', value: fEnh.effectMult, duration: 3 });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 进入气动侵蚀（受气动伤害 +${(fEnh.effectMult*100).toFixed(0)}%）` });
  }
  // 触发武器被动：技能命中
  fireTrigger(self, 'skill_hit', { battle, target });
  // 治疗型技能（辅助/治疗位 用技能视为 heal_skill）
  if (self.type === '辅助' || self.type === '治疗') {
    fireTrigger(self, 'heal_skill', { battle });
  }
  battle.log.push({
    type: 'skill', src: self.name, tgt: target.name, dmg: real, crit,
    action: fEnh ? `${fEnh.resourceName}强化技能` : '共鸣技能'
  });
  return { ok: true };
}

// 共鸣解放：3 AP，能量满，AOE，300% atk
export function doBurst(battle) {
  if (battle.finished || battle.ap < 3) return { ok: false, err: 'AP 不足（需 3）' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.energy < self.energyMax) return { ok: false, err: `能量不足（${self.energy}/${self.energyMax}）` };
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return { ok: false, err: '没有目标' };
  const fEnh = forteEnhances(self, 'burst');
  const mult = fEnh ? 3.0 * fEnh.effectMult : 3.0;
  const results = aliveEnemies.map(e => {
    const { dmg, crit } = calcDamage(self, e, mult, 'burst');
    const real = dealDamage(e, dmg);
    reduceVibration(e, 30);
    return { tgt: e.name, dmg: real, crit };
  });
  battle.ap -= 3;
  self.energy = 0;
  gainConcerto(self, 30 * (1 + self.resonanceBonus));
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
  // 触发武器被动：解放释放
  fireTrigger(self, 'burst_cast', { battle });
  // 协奏值满后视为切人（变奏/延奏）
  if (self.concerto >= 100) {
    consumeConcerto(self, battle);
  }
  battle.log.push({
    type: 'burst', src: self.name, results,
    action: fEnh ? `${fEnh.resourceName}强化解放` : '共鸣解放'
  });

  if (self.type === '辅助' || self.type === '治疗') {
    const healAmt = Math.round(self.atk * 1.5 * (1 + self.healBonus));
    battle.team.forEach(t => {
      if (t.alive) {
        const healed = Math.min(t.hpMax - t.hp, healAmt);
        t.hp += healed;
        if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed });
      }
    });
  }
  return { ok: true };
}

// 重击：2 AP，CD 1，220% atk · 重击伤害类型 · 削破韧 25
export function doHeavy(battle, targetIdx) {
  if (battle.finished || battle.ap < 2) return { ok: false, err: 'AP 不足（需 2）' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.cd.heavy > 0) return { ok: false, err: `重击冷却中（${self.cd.heavy} 回合）` };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  const { dmg, crit } = calcDamage(self, target, 2.2, 'heavy');
  const real = dealDamage(target, dmg);
  reduceVibration(target, 25);
  battle.ap -= 2;
  self.cd.heavy = 1;
  self.energy = Math.min(self.energyMax, self.energy + 15);
  gainConcerto(self, 14 * (1 + self.resonanceBonus));
  gainForte(self, 'heavy');
  fireTrigger(self, 'heavy_hit', { battle, target });
  battle.log.push({ type: 'heavy', src: self.name, tgt: target.name, dmg: real, crit, action: '重击' });
  return { ok: true };
}

// 切换角色（每回合限 1 次）
// 每次切人触发简化版变奏（入场角色对敌方一击 + 削破韧）
// 协奏满时强化：变奏伤害提升 + 武器 outro/variation 触发器激活
export function doSwitch(battle, toIdx) {
  if (battle.finished) return { ok: false, err: '战斗已结束' };
  if (toIdx === battle.active) return { ok: false, err: '已在该角色' };
  if (battle.switchUsedThisTurn) return { ok: false, err: '本回合已经切换过角色' };
  const target = battle.team[toIdx];
  if (!target || !target.alive) return { ok: false, err: '目标不可切换' };
  if (target.frozenTurns > 0) return { ok: false, err: '目标被冻结' };
  const prev = battle.team[battle.active];
  const concertoFull = prev && (prev.concerto || 0) >= 100;
  battle.active = toIdx;
  battle.switchUsedThisTurn = true;

  // 离场角色延奏 → 给入场角色一个"上场增益"
  if (prev && prev.alive) {
    // 离场角色的 outro 武器被动（如停驻之烟：延奏后下场角色攻击+10%）
    fireTrigger(prev, 'outro', { battle });
  }
  // 入场角色变奏：对当前主目标造成一段伤害
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (aliveEnemies.length) {
    const tgt = aliveEnemies[0];
    // 变奏倍率：基础 80%，协奏满时 ×2 = 160%
    const variMult = concertoFull ? 1.6 : 0.8;
    const { dmg, crit } = calcDamage(target, tgt, variMult, 'normal');
    const real = dealDamage(tgt, dmg);
    reduceVibration(tgt, concertoFull ? 25 : 10);
    battle.log.push({
      type: 'attack', src: target.name, tgt: tgt.name, dmg: real, crit,
      action: concertoFull ? '强化变奏' : '变奏'
    });
  }
  // 协奏值满时清空 + 触发 variation 武器被动
  if (concertoFull) {
    prev.concerto = 0;
    fireTrigger(target, 'variation', { battle });
    battle.log.push({ type: 'mechanic', src: prev.name, msg: `协奏满 · ${prev.name} 延奏 → ${target.name} 强化变奏` });
  }
  battle.log.push({ type: 'switch', src: target.name, action: '切换上场' });
  return { ok: true };
}

// ===== 回合切换 =====

// 我方结束回合，敌方出手
export function endTurn(battle) {
  if (battle.finished) return;
  // 敌方出招
  battle.enemies.forEach(enemy => {
    if (!enemy.alive) return;
    // 优先攻击当前出手角色，否则随机
    let target = battle.team[battle.active];
    if (!target || !target.alive) {
      const alives = battle.team.filter(t => t.alive);
      if (!alives.length) return;
      target = alives[Math.floor(Math.random() * alives.length)];
    }
    // 狂暴触发判定
    if (enemy.mechanic.type === 'enrage' && !enemy.enraged && enemy.hp / enemy.hpMax <= enemy.mechanic.threshold) {
      enemy.atk = Math.round(enemy.atk * (1 + enemy.mechanic.atkBonus));
      enemy.enraged = true;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `狂暴！攻击 +${(enemy.mechanic.atkBonus*100).toFixed(0)}%` });
    }
    // 护盾触发
    if (enemy.mechanic.type === 'shield' && !enemy._shielded && enemy.hp / enemy.hpMax <= enemy.mechanic.threshold) {
      enemy.shield = enemy.mechanic.value;
      enemy._shielded = true;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `生成护盾 ${enemy.mechanic.value}！` });
    }
    // 闪避判定（模拟玩家躲避）
    if (Math.random() < (target.dodge || 0)) {
      battle.log.push({ type: 'dodge', src: enemy.name, tgt: target.name });
      return;
    }
    // 普通攻击
    const baseAtk = enemy.atk;
    // 抗性（玩家对敌人元素的抗性）：暂用统一系数（玩家方目前无 resist 字段）
    const resMult = resistMultiplier(enemy.element, { element: target.element });
    const isCrit = Math.random() < 0.05;
    const critMult = isCrit ? 1.5 : 1.0;
    let dmg = (baseAtk + 30) * resMult * critMult;
    dmg = Math.max(30, dmg - target.def * 0.5);
    dmg = Math.round(dmg);
    const real = dealDamage(target, dmg);
    battle.log.push({ type: 'enemy_attack', src: enemy.name, tgt: target.name, dmg: real, crit: isCrit });
  });

  // 触发持续机制
  battle.enemies.forEach(enemy => {
    if (!enemy.alive) return;
    const m = enemy.mechanic;
    if (m.type === 'burn_team' && battle.turn % m.cycle === 0) {
      battle.team.forEach(t => {
        if (!t.alive) return;
        const dmg = Math.round(t.hpMax * m.dmgPct);
        dealDamage(t, dmg);
        battle.log.push({ type: 'burn', src: enemy.name, tgt: t.name, dmg });
      });
    } else if (m.type === 'freeze' && battle.turn % m.cycle === 0) {
      const alives = battle.team.filter(t => t.alive);
      if (alives.length) {
        const tgt = alives[Math.floor(Math.random() * alives.length)];
        tgt.frozenTurns = 1;
        battle.log.push({ type: 'freeze', src: enemy.name, tgt: tgt.name });
      }
    } else if (m.type === 'minion' && battle.turn % m.cycle === 0) {
      const minion = spawnEnemy('机偶小弟', 1);
      minion.idx = 100 + battle.enemies.length;
      minion.isMinion = true;
      battle.enemies.push(minion);
      battle.log.push({ type: 'summon', src: enemy.name, tgt: '机偶小弟' });
    }
  });

  // 检查胜负
  if (battle.team.every(t => !t.alive)) {
    battle.finished = true;
    battle.result = 'lose';
    battle.log.push({ type: 'system', msg: '队伍全灭。' });
    return;
  }
  if (battle.enemies.every(e => !e.alive)) {
    battle.finished = true;
    battle.result = 'win';
    battle.log.push({ type: 'system', msg: '战斗胜利！' });
    return;
  }

  // 清 buff/CD
  battle.team.forEach(t => {
    t.buffs = (t.buffs || []).filter(b => --b.duration > 0);
    if (t.cd.skill > 0) t.cd.skill--;
    if (t.cd.heavy > 0) t.cd.heavy--;
    if (t.frozenTurns > 0) t.frozenTurns--;
    // 武器叠层持续时间衰减
    tickWeaponTriggers(t);
  });
  // 敌人易伤期 / debuff 减一回合
  battle.enemies.forEach(e => {
    // 刚破韧的本回合不减（让玩家下回合还能用），下个回合再减
    if (e._brokenFresh) { e._brokenFresh = false; }
    else if (e.vibrationBroken > 0) e.vibrationBroken--;
    e.debuffs = (e.debuffs || []).filter(d => --d.duration > 0);
  });

  // 下一回合，AP 重置，active 找到下一个活着的
  battle.turn++;
  battle.ap = battle.apMax;
  battle.burstUsedThisTurn = false;
  battle.switchUsedThisTurn = false;
  // active 指针：找到下一个活着且非冻结的
  let nextActive = battle.active;
  for (let i = 0; i < battle.team.length; i++) {
    const idx = (battle.active + i + 1) % battle.team.length;
    if (battle.team[idx].alive && battle.team[idx].frozenTurns === 0) {
      nextActive = idx;
      break;
    }
  }
  // 如果当前 active 还活着且非冻结，保留
  if (battle.team[battle.active].alive && battle.team[battle.active].frozenTurns === 0) {
    // 保留
  } else {
    battle.active = nextActive;
  }
  battle.log.push({ type: 'system', msg: `—— 回合 ${battle.turn} —— 当前出手：${battle.team[battle.active].name}` });

  // 安全上限
  if (battle.turn > 30) {
    battle.finished = true;
    battle.result = 'lose';
    battle.log.push({ type: 'system', msg: '战斗超时。' });
  }
}

// ===== 评星（深渊用） =====
export function evaluateStars(battle, turnLimit = 3, hpThreshold = 0.6) {
  if (battle.result !== 'win') return 0;
  let stars = 1;
  if (battle.turn <= turnLimit) stars++;
  const hpPct = battle.team.reduce((a, t) => a + t.hp / t.hpMax, 0) / battle.team.length;
  if (hpPct >= hpThreshold) stars++;
  return stars;
}

export function isWin(battle) { return battle.result === 'win'; }
export function isLose(battle) { return battle.result === 'lose'; }
