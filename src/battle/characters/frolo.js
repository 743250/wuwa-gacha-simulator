// 弗洛洛「乐声 / 谱曲终末 / 定音 / 指挥状态 / 赫卡忒」状态机
//
// ATK 核 · 三段循环主C:攒乐声+余响 → 谱曲终末核爆 → 定音解锁解放 → 指挥状态赫卡忒共鸣。
//
//   乐声 (0-6):普攻/技能/重击/变奏各+1,战斗开始+4。满6时重击替换为谱曲终末。
//   余响 (0-24):战斗开始+10;赫卡忒每次攻击+1;共鸣链描述额外层数(2链谱曲+14/6链幻象+8)。
//          谱曲终末结算时消耗全部余响(倍率先按消耗前层数计算);不上场 3 回合后消散。
//          谱曲终末:基倍 660.16% + 每层余响绝对 +82.55%(官方 Lv10 表,2 链两系数 ×1.75);CD 3 回合;每层暴伤+2.5%。
//   谱曲终末:ATK 倍率 AOE,消耗6乐声,进入定音。
//   定音:谱曲终末后进入,解锁共鸣解放(0AP)。
//   指挥状态(3回合):解放后进入,攻击 +120%,弗洛洛自由行动,赫卡忒协同攻击。
//   赫卡忒:继承属性的召唤物。弗洛洛普攻/技能/重击/变奏命中时协同追击
//          ATK×56%(+1乐声+1余响),每2次后升级为强化追击 ATK×340%(+1乐声+1余响;6链 ×1.24)。
//   承伤(对齐官方口径,非挡刀):
//          登场指挥时:赫卡忒与弗洛洛共伤——同额伤害同时扣双方(赫卡忒不替挡、不吸收)。
//          非登场:赫卡忒不受伤(模拟器切人结束指挥,一般不触发)。
//          指挥结束:3 回合尽 / 切人 / 弗洛洛倒下。
//
// 共鸣链:
//   1链:合并后的亡与死的乐章/永不消逝的梦呓倍率+80%
//   2链:谱曲终末倍率+75% + 余响加点效果+75% + 施放谱曲终末+14余响
//   3链:赫卡忒协同/强化伤害+80%(指挥窗,不再压谱曲) + 强化追击命中目标攻击-20%(2回合)
//   4链:施放谱曲终末时全队全属性伤害+20%(4回合,单实例无常驻双算)
//   5链:指挥状态期间受伤-30%(弗洛洛与赫卡忒同挂 defense,共伤同额减)
//   6链:强化追击倍率+24% + 指挥内普攻/技能重世幻象 ATK×216.4%(+8余响) + 指挥状态内湮灭+60% / 非登场受伤+36%(未实装)

import { registerSwitchOutHook, registerSwitchHook } from '../switchHooks.js';
import { spawnSummon, removeSummon, damageSummon } from '../combat.js';
import { calcDamage, dealDamage } from '../combat.js';

const NOTES_MAX = 6;
const ECHOES_MAX = 24;
const NOTES_START = 4;
const ECHOES_START = 10;
const ECHOES_PER_LAYER_CDMG = 0.025;
const ECHOES_OFF_FIELD_TURNS = 3;

// 设计文档 §4 · 全部 ATK%
const NORMAL_ATK_MULT = 5.05;           // 亡与死的乐章
const SKILL_ATK_MULT = 4.64;            // 永不消逝的梦呓
const VARIATION_ATK_MULT = 2.02;        // 致命组歌
const VARIATION_COMMAND_MULT = 5.96;    // 永生组歌
const DIRGE_BASE = 6.6016;              // 谱曲终末基倍
const DIRGE_ECHO_ADD = 0.8255;          // 每层余响绝对加点(官方 Lv10 表 82.55%)
const DIRGE_CD = 3;                     // 谱曲终末冷却回合(官方 25 秒≈4 回合,温和档取 3)
const C1_REQUIEM_MULT = 1.80;
const C2_DIRGE_MULT = 1.75;
const C3_HECATE_MULT = 1.80;            // 3 链:赫卡忒协同/强化伤害加深 +80%

const COMMAND_DURATION = 3;
const COMMAND_ATK_BONUS = 1.20;
const HECASTE_AUTO_ATK_MULT = 0.56;
const HECASTE_AUGMENT_ATK_MULT = 3.40;
const C6_PHANTOM_ATK_MULT = 2.164;

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
  self.furoloEchoesOffFieldTurns = 0;
  self.heavyCd = DIRGE_CD; // 谱曲终末 CD 3 回合（供战斗 UI 重击 tooltip 显示）
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

export function furoloGainEchoes(self, n, battle, reason) {
  if (self.name !== '弗洛洛') return;
  const before = self.furoloEchoes || 0;
  self.furoloEchoes = Math.min(ECHOES_MAX, before + n);
  if (self.forte) {
    self.forte.current = self.furoloEchoes;
    self.forte.ready = self.furoloEchoes >= ECHOES_MAX;
  }
  if (self.furoloEchoes !== before && battle) {
    const gained = self.furoloEchoes - before;
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: reason
        ? `余响 +${gained} · ${reason}（${before} → ${self.furoloEchoes}/${ECHOES_MAX}）`
        : `余响 +${gained}（${before} → ${self.furoloEchoes}/${ECHOES_MAX}）`
    });
  }
  furoloRefreshEchoesCdmgBuff(self, battle);
}

function furoloClearEchoes(self, battle, reason) {
  if (self.name !== '弗洛洛') return;
  const before = self.furoloEchoes || 0;
  if (before <= 0) {
    self.furoloEchoesOffFieldTurns = 0;
    return;
  }
  self.furoloEchoes = 0;
  self.furoloEchoesOffFieldTurns = 0;
  if (self.forte) {
    self.forte.current = 0;
    self.forte.ready = false;
  }
  furoloRefreshEchoesCdmgBuff(self, battle);
  if (battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `余响消散 · ${reason || '全部清除'}（${before} → 0/${ECHOES_MAX}）`
    });
  }
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
      src: '弗洛洛余响暴伤',
      scope: 'self'
    });
  }
}

// ATK 核倍率 hooks
export function furoloNormalMult(self) {
  if (self.name !== '弗洛洛') return null;
  return NORMAL_ATK_MULT * (self.chain >= 1 ? C1_REQUIEM_MULT : 1);
}

export function furoloSkillMult(self) {
  if (self.name !== '弗洛洛') return null;
  return SKILL_ATK_MULT * (self.chain >= 1 ? C1_REQUIEM_MULT : 1);
}

export function furoloVariationMult(self) {
  if (self.name !== '弗洛洛') return null;
  return furoloInCommand(self) ? VARIATION_COMMAND_MULT : VARIATION_ATK_MULT;
}

export function furoloOnNormalHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  // 赫卡忒协同 / 6 链重世幻象仅指挥状态(解放后)触发,大招前不出现
  if (furoloInCommand(self)) {
    furoloHecateAssist(self, battle, 'normal');
    if (self.chain >= 6) furoloC6EchoPhantom(self, battle);
  }
}

export function furoloOnSkillHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  if (furoloInCommand(self)) {
    furoloHecateAssist(self, battle, 'skill');
    if (self.chain >= 6) furoloC6EchoPhantom(self, battle);
  }
}

export function furoloOnHeavyHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  if (furoloInCommand(self)) furoloHecateAssist(self, battle, 'heavy');
}

export function furoloOnVariationHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
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

// ── 6 链重世幻象追击 ATK×216.4%（仅指挥状态,与赫卡忒同窗） ──
function furoloC6EchoPhantom(self, battle) {
  if (self.chain < 6) return;
  if (!furoloInCommand(self)) return;
  const target = battle.enemies.find(e => e.alive);
  if (!target) return;
  const { dmg } = calcDamage(self, target, C6_PHANTOM_ATK_MULT, 'skill');
  const real = dealDamage(target, dmg);
  furoloGainEchoes(self, 8, battle, '6 链 · 重世幻象');
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `6 链 · 重世幻象 · 赫卡忒追击 攻击×216.4%（${real} 伤害）`
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

// 谱曲终末倍率:基倍 + 余响绝对加点;2 链基倍与余响加点均 ×1.75
export function furoloDirgeMult(self) {
  const c2 = self.chain >= 2 ? C2_DIRGE_MULT : 1;
  const echoes = self.furoloEchoes || 0;
  return (DIRGE_BASE * c2) + echoes * (DIRGE_ECHO_ADD * c2);
}

// 谱曲终末结算:消耗乐声与本击所用余响,进入定音;2 链再 +14 余响;4 链全队 +20%
// 倍率已在 resolveHeavy 用消耗前余响算完,此处清空层数供下一循环重攒
export function furoloExecuteDirge(self, battle) {
  if (self.name !== '弗洛洛') return;
  const consumedNotes = self.furoloNotes || 0;
  const consumedEchoes = self.furoloEchoes || 0;
  self.furoloNotes = 0;
  self.furoloDirge = true;
  // 谱曲终末冷却:引擎在 doHeavy 通用路径已设 cd.heavy=1,此处覆盖为 DIRGE_CD(3 回合)
  self.cd.heavy = DIRGE_CD;
  if (consumedEchoes > 0) {
    furoloClearEchoes(self, battle, `谱曲终末消耗 ${consumedEchoes} 层`);
  } else {
    furoloRefreshEchoesCdmgBuff(self, battle);
  }
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `谱曲终末 · 消耗 ${consumedNotes} 乐声` +
      (consumedEchoes > 0 ? ` · 消耗 ${consumedEchoes} 层余响` : '') +
      ' · 进入定音状态(解锁共鸣解放)'
  });
  if (self.chain >= 2) {
    furoloGainEchoes(self, 14, battle, '2 链 · 谱曲终末');
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `2 链 · 谱曲终末额外 +14 余响（${self.furoloEchoes}/${ECHOES_MAX}）`
    });
  }
  // 4 链:全队全属性伤害 +20%(4回合)
  if (self.chain >= 4) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '弗洛洛4链');
      t.buffs.push({ type: 'elemAllUp', value: 0.20, duration: 4, src: '弗洛洛4链', installer: self.idx });
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
  self.buffs = (self.buffs || []).filter(b =>
    b.src !== '弗洛洛指挥状态' && b.src !== '弗洛洛5链' && b.src !== '弗洛洛6链');
  self.buffs.push({ type: 'atkUp', value: COMMAND_ATK_BONUS, duration: COMMAND_DURATION, src: '弗洛洛指挥状态', scope: 'self' });
  // 5 链:指挥期间受伤 -30%;双方同挂,共伤后数值一致
  if (self.chain >= 5) {
    self.buffs.push({ type: 'defense', value: 0.30, duration: COMMAND_DURATION, src: '弗洛洛5链', scope: 'self' });
  }
  // 6 链:指挥状态内湮灭伤害加成 +60%(官方"指挥且登场",模拟器指挥=登场,仅指挥窗生效)
  if (self.chain >= 6) {
    self.buffs.push({ type: 'echoElemDmg', element: '湮灭', value: 0.60, duration: COMMAND_DURATION, src: '弗洛洛6链', scope: 'self' });
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
    msg: `指挥状态展开 · 持续 ${COMMAND_DURATION} 回合 · 攻击 +120% · 赫卡忒共伤协同` +
      (self.chain >= 5 ? ' · 5 链受伤 -30%' : '')
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
  const mult = isAugment ? HECASTE_AUGMENT_ATK_MULT : HECASTE_AUTO_ATK_MULT;
  // 3 链:赫卡忒协同/强化伤害 +80%(指挥窗伤害加深);6 链:强化追击倍率 +24%
  const finalMult = (isAugment && owner.chain >= 6 ? mult * 1.24 : mult)
    * (owner.chain >= 3 ? C3_HECATE_MULT : 1);
  const { dmg } = calcDamage(owner, target, finalMult, dmgType);
  const real = dealDamage(target, dmg);
  furoloGainNotes(owner, 1, battle);
  furoloGainEchoes(owner, 1, battle, isAugment ? '赫卡忒强化追击' : '赫卡忒协同追击');
  battle.log.push({
    type: 'mechanic', src: '赫卡忒',
    msg: `${isAugment ? '强化追击' : '协同追击'} · 攻击×${(finalMult * 100).toFixed(1)}%（${real} 伤害）· 弗洛洛 +1 乐声 +1 余响`
  });
  if (isAugment && owner.chain >= 3) {
    target.buffs = (target.buffs || []).filter(b => b.src !== '弗洛洛3链');
    target.buffs.push({ type: 'atkDown', value: 0.20, duration: 2, src: '弗洛洛3链', installer: owner.idx });
    battle.log.push({
      type: 'mechanic', src: '赫卡忒',
      msg: '3 链 · 强化攻击命中 · 目标攻击 -20%（2 回合）'
    });
  }
}

// ── 赫卡忒回合开始 hook(不再自动攻击;协同由命中触发) ──
function furoloHecateTurnStart(summon, battle) {
  // 协同攻击由 furoloOnNormalHit / Skill / Heavy / Variation → furoloHecateAssist
}

// 共伤(非挡刀):登场时赫卡忒与弗洛洛同额受伤;返回全额让主人继续走 dealDamage
// 官方:「赫卡忒受到攻击时弗洛洛会受到伤害」;非登场「赫卡忒不会受到伤害」
function furoloHecateOnDamaged(summon, incomingDmg, battle) {
  if (!summon.alive) return incomingDmg;
  const owner = battle?.team?.[summon.ownerIdx];
  const isActive = !!(owner && battle.team?.[battle.active] === owner);
  if (!isActive) {
    // 非登场:赫卡忒不受伤,主人伤害照常(不挡)
    return incomingDmg;
  }
  const hpBefore = summon.hp;
  const taken = damageSummon(summon, incomingDmg);
  battle?.log.push({
    type: 'mechanic', src: '赫卡忒',
    msg: `共伤 · 赫卡忒与弗洛洛同额承受 ${taken}（赫卡忒 HP ${hpBefore} → ${summon.hp}）`
  });
  // 关键:不吸收,全额回传给主人
  return incomingDmg;
}

// 赫卡忒消散:清理引用;指挥回合仍可由 duration/切人结束
function furoloHecateOnDeath(summon, battle) {
  const owner = battle?.team?.[summon.ownerIdx];
  if (!owner) return;
  owner.furoloHecateSummonId = null;
  battle.log.push({
    type: 'mechanic', src: owner.name,
    msg: '赫卡忒消散'
  });
}

function furoloEndCommand(self, battle, reason) {
  if (self?.name !== '弗洛洛') return;
  if (self.furoloHecateSummonId) {
    removeSummon(battle, self.furoloHecateSummonId);
    self.furoloHecateSummonId = null;
  }
  self.furoloCommandTurns = 0;
  self.buffs = (self.buffs || []).filter(b =>
    b.src !== '弗洛洛指挥状态' && b.src !== '弗洛洛5链' && b.src !== '弗洛洛6链');
  if (battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: reason || '指挥状态结束'
    });
  }
}

// 切人退场:指挥状态结束,赫卡忒消失;开始余响 3 回合消散计时
export function furoloSwitchOut({ from, battle }) {
  if (from?.name !== '弗洛洛') return;
  if ((from.furoloCommandTurns || 0) > 0) {
    furoloEndCommand(from, battle, '切人退场 · 指挥状态结束 · 赫卡忒消散');
  }
  if ((from.furoloEchoes || 0) > 0) {
    from.furoloEchoesOffFieldTurns = ECHOES_OFF_FIELD_TURNS;
    battle.log.push({
      type: 'mechanic', src: from.name,
      msg: `余响将于不上场 ${ECHOES_OFF_FIELD_TURNS} 回合后消散`
    });
  }
}
registerSwitchOutHook('弗洛洛', furoloSwitchOut);

export function furoloSwitchIn({ to, battle }) {
  if (to?.name !== '弗洛洛') return;
  to.furoloEchoesOffFieldTurns = 0;
}
registerSwitchHook('弗洛洛', furoloSwitchIn);

// 指挥状态 tick:同步主人 commandTurns 与赫卡忒 duration
export function furoloTick(self, battle) {
  if (self.name !== '弗洛洛') return null;
  if (!(self.furoloCommandTurns || 0)) return null;
  const hecate = (battle.summons || []).find(s => s.id === self.furoloHecateSummonId && s.alive);
  if (!hecate) return null;
  self.furoloCommandTurns = hecate.duration;
  return null;
}

// 不上场时余响 3 回合消散;上场则重置计时
export function furoloTurnCleanup(self, ctx) {
  const battle = ctx.battle;
  furoloTick(self, battle);
  if (self.name !== '弗洛洛') return null;
  const isActive = battle.team?.[battle.active] === self;
  if (isActive) {
    self.furoloEchoesOffFieldTurns = 0;
    return null;
  }
  if (!(self.furoloEchoes || 0)) {
    self.furoloEchoesOffFieldTurns = 0;
    return null;
  }
  if (!(self.furoloEchoesOffFieldTurns > 0)) {
    self.furoloEchoesOffFieldTurns = ECHOES_OFF_FIELD_TURNS;
  }
  self.furoloEchoesOffFieldTurns -= 1;
  if (self.furoloEchoesOffFieldTurns <= 0) {
    furoloClearEchoes(self, battle, `不上场 ${ECHOES_OFF_FIELD_TURNS} 回合`);
  } else if (battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `余响消散倒计时 ${self.furoloEchoesOffFieldTurns} 回合（当前 ${self.furoloEchoes}/${ECHOES_MAX}）`
    });
  }
  return null;
}

// ── 徽章收集(战斗 UI 状态行) ──
export function furoloCollectBadges(self) {
  if (self.name !== '弗洛洛') return [];
  const out = [];
  const notes = self.furoloNotes || 0;
  const echoes = self.furoloEchoes || 0;
  const inCommand = (self.furoloCommandTurns || 0) > 0;
  out.push({
    key: `frolo-notes-${self.name}`,
    cls: 'field', icon: '🎵',
    label: `乐声 ${notes}/${NOTES_MAX}`,
    tip: '<b>乐声</b><br>弗洛洛专属资源。普攻/技能/重击/变奏各 +1 枚，满 6 枚时重击替换为谱曲终末。'
  });
  out.push({
    key: `frolo-echoes-${self.name}`,
    cls: 'crit', icon: '✦',
    label: `余响 ${echoes}/${ECHOES_MAX}`,
    tip: `<b>余响</b><br>弗洛洛奏回路资源。战斗开始 +10；赫卡忒每次攻击 +1；共鸣链额外层数。谱曲终末每层绝对 +82.55% 攻击倍率（2 链 ×1.75），施放后消耗全部余响；每层暴伤 +2.5%。不上场 ${ECHOES_OFF_FIELD_TURNS} 回合后消散。`
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
      tip: '<b>指挥状态</b><br>共鸣解放后进入，持续 3 回合。弗洛洛攻击提升 120%，赫卡忒协同追击。登场时赫卡忒与弗洛洛共伤（同额，不挡刀）。'
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
  normalMult: furoloNormalMult,
  skillMult: furoloSkillMult,
  variationMult: furoloVariationMult,
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
