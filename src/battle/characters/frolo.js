// 弗洛洛「乐声 / 谱曲终末 / 定音 / 指挥状态 / 赫卡忒」状态机
//
// HP 核 · 三段循环主C:攒乐声+余响 → 谱曲终末核爆 → 定音解锁解放 → 指挥状态赫卡忒共鸣。
//
//   乐声 (0-6):普攻/技能/重击/变奏各+1,战斗开始+4。满6时重击替换为谱曲终末。
//   余响 (0-24,指挥状态期间上限提升至 36):全动作积累,战斗开始+10。
//          每层谱曲终末倍率+60%(2链+105%);每层暴伤+2.5%。
//   谱曲终末:HP×20% AOE,消耗6乐声,基于余响增伤,进入定音。
//   定音:谱曲终末后进入,解锁共鸣解放(0AP)。
//   指挥状态(3回合):解放后进入,暴击伤害+120%,弗洛洛自由行动,赫卡忒协同攻击+挡刀。
//   赫卡忒:HP=弗洛洛HP,弗洛洛普攻/技能/重击/变奏命中时协同追击 HP×12%(+1乐声+2余响),
//          每2次后升级为强化追击 HP×24%(+1乐声+3余响)。主人受伤优先由赫卡忒承担,
//          overflow打主人;HP归零则消失,指挥状态立即结束。
//
// 共鸣链:
//   1链:普攻/技能倍率+80%
//   2链:谱曲终末倍率+75% + 余响增益效果+75%(每层+105%)+ 施放谱曲终末+14余响
//   3链:谱曲终末伤害+80%(heavyDmg) + 强化追击命中目标攻击-20%(2回合)
//   4链:施放谱曲终末时全队全属性伤害+20%(4回合)
//   5链:指挥状态期间赫卡忒及弗洛洛受伤-30%(defense buff)
//   6链:强化追击倍率+24% + 重世追击 HP×8% + 登场湮灭+60% / 非登场受伤+40%

import { registerSwitchOutHook } from '../switchHooks.js';
import { spawnSummon, removeSummon, damageSummon } from '../combat.js';
import { calcDamage, dealDamage } from '../combat.js';

const NOTES_MAX = 6;
const ECHOES_MAX = 24;
const ECHOES_MAX_IN_COMMAND = 36;
const NOTES_START = 4;
const ECHOES_START = 10;
const ECHOES_PER_NOTE_BONUS = 0.60;
const ECHOES_PER_LAYER_CDMG = 0.025;

const NORMAL_HP_MULT = 0.04;
const SKILL_HP_MULT = 0.075;
const HEAVY_HP_MULT = 0.09;
const DIRGE_HP_MULT = 0.20;
const VARIATION_HP_MULT = 0.033;
const VARIATION_COMMAND_MULT = 0.066;

const COMMAND_DURATION = 3;
const COMMAND_CDMG_BONUS = 1.20;
const HECASTE_AUTO_HP_MULT = 0.12;
const HECASTE_AUGMENT_HP_MULT = 0.24;

// ── 状态查询 ──
export function furoloNotes(self) {
  return self?.name === '弗洛洛' ? (self.furoloNotes || 0) : 0;
}
export function furoloEchoes(self) {
  return self?.name === '弗洛洛' ? (self.furoloEchoes || 0) : 0;
}
export function furoloInDirge(self) {
  return !!(self && self.name === '弗洛洛' && self.furoloDirge);
}
export function furoloInCommand(self) {
  return !!(self && self.name === '弗洛洛' && (self.furoloCommandTurns || 0) > 0);
}
export function furoloCanBurst(self) {
  return furoloInDirge(self);
}

export function furoloCanHeavy(self) {
  if (self.name !== '弗洛洛') return null;
  if ((self.furoloNotes || 0) < NOTES_MAX) return { ok: false, err: '乐声未满 6 枚，无法施放谱曲终末' };
  return null;
}

export function furoloCanBurstAction(self, battle) {
  if (self.name !== '弗洛洛') return null;
  if (!furoloCanBurst(self)) return { ok: false, err: '需处于定音状态(谱曲终末后)才能施放共鸣解放' };
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return { ok: false, err: '没有目标' };
  return { ok: true };
}

export function furoloBattleStart(self, ctx) {
  if (self.name !== '弗洛洛') return;
  const battle = ctx?.battle;
  self.furoloNotes = NOTES_START;
  self.furoloEchoes = ECHOES_START;
  self.furoloDirge = false;
  self.furoloCommandTurns = 0;
  self.furoloHecateAttacks = 0;
  self.furoloHecateSummonId = null;
  furoloRefreshEchoesCdmgBuff(self, battle);
  if (self.forte) {
    self.forte.current = self.furoloEchoes;
    self.forte.ready = self.furoloEchoes >= ECHOES_MAX;
  }
  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `固有·八重奏 · 战斗开始：乐声 +${NOTES_START}（${self.furoloNotes}/${NOTES_MAX}）· 余响 +${ECHOES_START}（${self.furoloEchoes}/${ECHOES_MAX}）`
  });
}

export function furoloGainNotes(self, n, battle) {
  if (self.name !== '弗洛洛') return;
  const before = self.furoloNotes || 0;
  self.furoloNotes = Math.min(NOTES_MAX, before + n);
  if (self.furoloNotes !== before && battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `乐声 +${self.furoloNotes - before}（${before} → ${self.furoloNotes}/${NOTES_MAX}）`
    });
  }
}

export function furoloGainEchoes(self, n, battle) {
  if (self.name !== '弗洛洛') return;
  const cap = furoloInCommand(self) ? ECHOES_MAX_IN_COMMAND : ECHOES_MAX;
  const before = self.furoloEchoes || 0;
  self.furoloEchoes = Math.min(cap, before + n);
  if (self.forte) {
    self.forte.current = self.furoloEchoes;
    self.forte.ready = self.furoloEchoes >= ECHOES_MAX;
  }
  if (self.furoloEchoes !== before && battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `余响 +${self.furoloEchoes - before}（${before} → ${self.furoloEchoes}/${cap}）`
    });
  }
  furoloRefreshEchoesCdmgBuff(self, battle);
}

// ── 刷新余响暴伤 buff(每层+2.5%暴伤) ──
function furoloRefreshEchoesCdmgBuff(self, battle) {
  if (self.name !== '弗洛洛') return;
  self.buffs = (self.buffs || []).filter(b => b.src !== '弗洛洛余响暴伤');
  const echoes = self.furoloEchoes || 0;
  if (echoes > 0) {
    self.buffs.push({
      type: 'cdmgUp',
      value: echoes * ECHOES_PER_LAYER_CDMG,
      duration: 99,
      src: '弗洛洛余响暴伤'
    });
  }
}

export function furoloHpCore(self, dmgType, opts = {}) {
  if (self.name !== '弗洛洛') return null;
  const mults = { normal: NORMAL_HP_MULT, skill: SKILL_HP_MULT, heavy: HEAVY_HP_MULT, burst: 0.16 };
  return {
    baseStat: 'hpMax',
    hpMultOverride: (opts.explicitHpMult || dmgType === 'burst') ? null : (mults[dmgType] ?? null)
  };
}

export function furoloOnNormalHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  furoloGainEchoes(self, 3, battle);
  if (furoloInCommand(self)) furoloHecateAssist(self, battle, 'normal');
  if (self.chain >= 6) furoloC6EchoPhantom(self, battle);
}

export function furoloOnSkillHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  furoloGainEchoes(self, 5, battle);
  if (furoloInCommand(self)) furoloHecateAssist(self, battle, 'skill');
  if (self.chain >= 6) furoloC6EchoPhantom(self, battle);
}

export function furoloOnHeavyHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  furoloGainEchoes(self, 4, battle);
  if (furoloInCommand(self)) furoloHecateAssist(self, battle, 'heavy');
}

export function furoloOnVariationHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  furoloGainEchoes(self, 2, battle);
  if (furoloInCommand(self)) furoloHecateAssist(self, battle, 'skill');
}

export function furoloOnAttack(self, ctx) {
  furoloOnNormalHit(self, ctx.battle);
}

export function furoloOnSkill(self, ctx) {
  furoloOnSkillHit(self, ctx.battle);
}

export function furoloFinishHeavy(self, battle, form) {
  if (form?.isDirge) furoloExecuteDirge(self, battle);
  else furoloOnHeavyHit(self, battle);
}

export function furoloOnHeavy(self, ctx) {
  if (ctx.form) furoloFinishHeavy(self, ctx.battle, ctx.form);
}

export function furoloOnVariation(self, ctx) {
  if (!ctx.variationTarget) return;
  furoloOnVariationHit(self, ctx.battle);
}

// ── 6 链重世幻象追击(普攻第3段/技能后召唤赫卡忒追击 HP×8%) ──
function furoloC6EchoPhantom(self, battle) {
  if (self.chain < 6) return;
  const target = battle.enemies.find(e => e.alive);
  if (!target) return;
  const { dmg } = calcDamage(self, target, 0.08, 'skill', { explicitHpMult: true });
  const real = dealDamage(target, dmg);
  furoloGainEchoes(self, 8, battle);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `6 链 · 重世幻象 · 赫卡忒追击 HP×8%（${real} 伤害）`
  });
}

// 重击替换为谱曲终末:满 6 乐声时由 doHeavy 调用,返回替换招式
export function furoloResolveHeavy(self, battle) {
  if (self.name !== '弗洛洛') return null;
  if ((self.furoloNotes || 0) < NOTES_MAX) return null;
  return {
    mult: furoloDirgeMult(self),
    dmgType: 'heavy',
    label: '谱曲终末',
    isDirge: true
  };
}

// 谱曲终末倍率:HP×20% × (1 + 余响层数 × 每层加成),2 链基础 +75% 且每层 +105%
export function furoloDirgeMult(self) {
  let baseMult = DIRGE_HP_MULT;
  if (self.chain >= 2) baseMult *= 1.75;
  const perLayer = self.chain >= 2 ? ECHOES_PER_NOTE_BONUS * 1.75 : ECHOES_PER_NOTE_BONUS;
  const echoes = self.furoloEchoes || 0;
  return baseMult * (1 + echoes * perLayer);
}

// 谱曲终末结算:消耗乐声,进入定音,2 链 +14 余响,4 链全队 +20%
export function furoloExecuteDirge(self, battle) {
  if (self.name !== '弗洛洛') return;
  const consumed = self.furoloNotes || 0;
  self.furoloNotes = 0;
  self.furoloDirge = true;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `谱曲终末 · 消耗 ${consumed} 乐声 · 进入定音状态(解锁共鸣解放)`
  });
  if (self.chain >= 2) {
    furoloGainEchoes(self, 14, battle);
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `2 链 · 谱曲终末额外 +14 余响（${self.furoloEchoes}/${ECHOES_MAX_IN_COMMAND}）`
    });
  }
  // 4 链:全队全属性伤害 +20%(4回合)
  if (self.chain >= 4) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '弗洛洛4链');
      t.buffs.push({ type: 'elemAllUp', value: 0.20, duration: 4, src: '弗洛洛4链' });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '4 链 · 火炬引导 · 全队全属性伤害 +20%（4 回合）'
    });
  }
}

export function furoloResolveBurst(self) {
  if (self.name !== '弗洛洛') return null;
  return {
    results: [],
    action: '共鸣解放 · 往日深渊的圆舞曲（进入指挥状态 · 赫卡忒召唤）'
  };
}

// 解放 hook:退出定音,进入指挥状态,召唤赫卡忒
export function furoloOnBurst(self, ctx) {
  if (self.name !== '弗洛洛') return;
  const battle = ctx.battle;
  self.furoloDirge = false;
  self.furoloCommandTurns = COMMAND_DURATION;
  self.furoloHecateAttacks = 0;
  if (self.furoloHecateSummonId) {
    removeSummon(battle, self.furoloHecateSummonId);
    self.furoloHecateSummonId = null;
  }
  self.buffs = (self.buffs || []).filter(b => b.src !== '弗洛洛指挥状态');
  self.buffs.push({ type: 'cdmgUp', value: COMMAND_CDMG_BONUS, duration: COMMAND_DURATION, src: '弗洛洛指挥状态' });
  if (self.chain >= 5) {
    self.buffs.push({ type: 'defense', value: 0.30, duration: COMMAND_DURATION, src: '弗洛洛5链' });
  }
  const ownerIdx = battle.team.indexOf(self);
  const hecate = spawnSummon(battle, {
    id: 'furolo_hecate',
    name: '赫卡忒',
    ownerIdx,
    ownerName: self.name,
    hp: self.hp,
    atk: self.atk,
    def: self.def,
    element: '湮灭',
    duration: COMMAND_DURATION,
    onTurnStart: furoloHecateTurnStart,
    onOwnerDamaged: furoloHecateOnDamaged,
    onDeath: furoloHecateOnDeath
  });
  if (self.chain >= 5) {
    hecate.buffs.push({ type: 'defense', value: 0.30, duration: COMMAND_DURATION, src: '弗洛洛5链' });
  }
  self.furoloHecateSummonId = hecate.id;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `指挥状态展开 · 持续 ${COMMAND_DURATION} 回合 · 暴击伤害 +120% · 赫卡忒召唤（HP ${hecate.hp}）`
  });
}

// 赫卡忒协同追击:弗洛洛本击命中后触发,dmgType 继承本击以共享加深判定
// 每 2 次协同后升级为强化追击
export function furoloHecateAssist(owner, battle, dmgType) {
  if (owner.name !== '弗洛洛') return;
  if (!owner.furoloHecateSummonId) return;
  const summon = (battle.summons || []).find(s => s.id === owner.furoloHecateSummonId && s.alive);
  if (!summon) return;
  const target = battle.enemies.find(e => e.alive);
  if (!target) return;
  summon._attackCount = (summon._attackCount || 0) + 1;
  const isAugment = summon._attackCount % 2 === 0;
  const mult = isAugment ? HECASTE_AUGMENT_HP_MULT : HECASTE_AUTO_HP_MULT;
  const finalMult = isAugment && owner.chain >= 6 ? mult * 1.24 : mult;
  const { dmg } = calcDamage(owner, target, finalMult, dmgType, { explicitHpMult: true });
  const real = dealDamage(target, dmg);
  furoloGainNotes(owner, 1, battle);
  furoloGainEchoes(owner, isAugment ? 3 : 2, battle);
  battle.log.push({
    type: 'mechanic', src: '赫卡忒',
    msg: `${isAugment ? '强化追击' : '协同追击'} · HP×${(finalMult*100).toFixed(1)}%（${real} 伤害）· 弗洛洛 +1 乐声 +${isAugment ? 3 : 2} 余响`
  });
  if (isAugment && owner.chain >= 3) {
    target.buffs = (target.buffs || []).filter(b => b.src !== '弗洛洛3链');
    target.buffs.push({ type: 'atkDown', value: 0.20, duration: 2, src: '弗洛洛3链' });
    battle.log.push({
      type: 'mechanic', src: '赫卡忒',
      msg: '3 链 · 强化攻击命中 · 目标攻击 -20%（2 回合）'
    });
  }
}

// ── 赫卡忒回合开始 hook(保留挡刀,不再自动攻击) ──
function furoloHecateTurnStart(summon, battle) {
  // 协同攻击改为由弗洛洛普攻触发(furoloOnNormalHit → furoloHecateAssist)
  // 此处保留 hook 占位,不做任何攻击动作
}

// ── 赫卡忒挡刀(主人受伤前拦截) ──
function furoloHecateOnDamaged(summon, incomingDmg, battle) {
  if (!summon.alive) return incomingDmg;
  const taken = damageSummon(summon, incomingDmg);
  const overflow = incomingDmg - taken;
  const owner = battle.team[summon.ownerIdx];
  battle.log.push({
    type: 'mechanic', src: '赫卡忒',
    msg: `替主人挡刀 · 承担 ${taken} 伤害（HP ${summon.hp + taken} → ${summon.hp}）${overflow > 0 ? `· overflow ${overflow} 打主人` : ''}`
  });
  return overflow;
}

// 赫卡忒死亡:指挥状态立即结束
function furoloHecateOnDeath(summon, battle) {
  const owner = battle.team[summon.ownerIdx];
  if (!owner) return;
  owner.furoloCommandTurns = 0;
  owner.furoloHecateSummonId = null;
  owner.buffs = (owner.buffs || []).filter(b => b.src !== '弗洛洛指挥状态' && b.src !== '弗洛洛5链');
  battle.log.push({
    type: 'mechanic', src: owner.name,
    msg: '赫卡忒消散 · 指挥状态立即结束'
  });
}

// 切人退场:指挥状态结束,赫卡忒消失
export function furoloSwitchOut({ from, battle }) {
  if (from?.name !== '弗洛洛') return;
  if (!(from.furoloCommandTurns || 0)) return;
  if (from.furoloHecateSummonId) {
    removeSummon(battle, from.furoloHecateSummonId);
    from.furoloHecateSummonId = null;
  }
  from.furoloCommandTurns = 0;
  from.buffs = (from.buffs || []).filter(b => b.src !== '弗洛洛指挥状态' && b.src !== '弗洛洛5链');
  battle.log.push({
    type: 'mechanic', src: from.name,
    msg: '切人退场 · 指挥状态结束 · 赫卡忒消失'
  });
}
registerSwitchOutHook('弗洛洛', furoloSwitchOut);

export function furoloSwitchIn({ to, battle }) {
  if (to?.name !== '弗洛洛') return;
}

// 指挥状态 tick:同步主人 commandTurns 与赫卡忒 duration
export function furoloTick(self, battle) {
  if (self.name !== '弗洛洛') return null;
  if (!(self.furoloCommandTurns || 0)) return null;
  const hecate = (battle.summons || []).find(s => s.id === self.furoloHecateSummonId && s.alive);
  if (!hecate) return null;
  self.furoloCommandTurns = hecate.duration;
  return null;
}

export function furoloTurnCleanup(self, ctx) {
  return furoloTick(self, ctx.battle);
}

// ── 徽章收集(战斗 UI 状态行) ──
// 返回 badge 对象数组 { key, cls, icon, label, tip }，与 collectUnitBadges 协议一致
export function furoloCollectBadges(self) {
  if (self.name !== '弗洛洛') return [];
  const out = [];
  const notes = self.furoloNotes || 0;
  const echoes = self.furoloEchoes || 0;
  const inCommand = (self.furoloCommandTurns || 0) > 0;
  const echoesCap = inCommand ? ECHOES_MAX_IN_COMMAND : ECHOES_MAX;
  out.push({
    key: `frolo-notes-${self.name}`,
    cls: 'field', icon: '🎵',
    label: `乐声 ${notes}/${NOTES_MAX}`,
    tip: '<b>乐声</b><br>弗洛洛专属资源。普攻/技能/重击/变奏各 +1 枚，满 6 枚时重击替换为谱曲终末。'
  });
  out.push({
    key: `frolo-echoes-${self.name}`,
    cls: 'crit', icon: '✦',
    label: `余响 ${echoes}/${echoesCap}`,
    tip: `<b>余响</b><br>弗洛洛奏回路资源。每层使谱曲终末倍率线性 +60%（2 链 +105%）；每层暴伤 +2.5%。指挥状态期间上限提升至 ${ECHOES_MAX_IN_COMMAND}。`
  });
  if (self.furoloDirge) {
    out.push({
      key: `frolo-dirge-${self.name}`,
      cls: 'burst', icon: '🎯',
      label: '定音',
      tip: '<b>定音</b><br>谱曲终末后进入的状态，可施放共鸣解放（不消耗 AP）。'
    });
  }
  if (inCommand) {
    out.push({
      key: `frolo-cmd-${self.name}`,
      cls: 'atk', icon: '指挥',
      label: `指挥 ${self.furoloCommandTurns}回`, dur: self.furoloCommandTurns,
      tip: '<b>指挥状态</b><br>共鸣解放后进入，持续 3 回合。弗洛洛暴击伤害 +120%，赫卡忒协同追击并挡刀。'
    });
  }
  return out;
}

export default {
  name: '弗洛洛',
  hasHeavy: true,
  notes: furoloNotes,
  echoes: furoloEchoes,
  inDirge: furoloInDirge,
  inCommand: furoloInCommand,
  hpCore: furoloHpCore,
  canHeavy: furoloCanHeavy,
  canBurst: furoloCanBurstAction,
  battleStart: furoloBattleStart,
  onNormalHit: furoloOnNormalHit,
  onSkillHit: furoloOnSkillHit,
  onHeavyHit: furoloOnHeavyHit,
  onVariationHit: furoloOnVariationHit,
  onAttack: furoloOnAttack,
  onSkill: furoloOnSkill,
  onHeavy: furoloOnHeavy,
  onVariation: furoloOnVariation,
  resolveHeavy: furoloResolveHeavy,
  executeDirge: furoloExecuteDirge,
  dirgeMult: furoloDirgeMult,
  resolveBurst: furoloResolveBurst,
  onBurst: furoloOnBurst,
  switchIn: furoloSwitchIn,
  tick: furoloTick,
  turnCleanup: furoloTurnCleanup,
  collectBadges: furoloCollectBadges
};
