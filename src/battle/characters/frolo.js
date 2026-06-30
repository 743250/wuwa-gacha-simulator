// 弗洛洛「乐声 / 谱曲终末 / 定音 / 指挥状态 / 赫卡忒」状态机
//
// 设计思路（HP 核 · 三段循环主C）：
//   弗洛洛是"攒乐声+余响 → 谱曲终末核爆 → 定音解锁解放 → 指挥状态赫卡忒持续压制"的循环主C。
//
//   乐声 (0-6):普攻第3段/技能/重击/变奏各+1,战斗开始+4(固有·八重奏)。满6时重击替换为谱曲终末。
//   余响 (0-24):全动作积累,战斗开始+10。每层谱曲终末倍率+20%,满24层×3.0;每层暴伤+2.5%(固有·八重奏)。
//   谱曲终末:HP×20% AOE,消耗6乐声,基于余响增伤,进入定音。视为声骸技能/共鸣技能伤害。
//   定音:谱曲终末后进入,解锁共鸣解放(0AP,对应官方"能量上限为0")。
//   指挥状态(3回合):解放后进入,攻击+120%,弗洛洛自由行动,赫卡忒自动攻击+挡刀。
//   赫卡忒:HP=弗洛洛HP×1.0,每回合自动攻击HP×12%(+1乐声+2余响),每第2次后强化HP×24%(+1乐声+3余响)。
//          主人受伤优先由赫卡忒承担,overflow打主人;HP归零则消失,指挥状态立即结束。
//
// 共鸣链:
//   1链:亡与死的乐章/梦呓倍率+80%(普攻第3段/技能倍率+80%)
//   2链:谱曲终末倍率+75% + 余响增益效果+75%(每层+35%)+ 施放谱曲终末+14余响
//   3链:声骸技能伤害+80% + 强化攻击·赫卡忒命中目标攻击-20%(2回合)
//   4链:施放谱曲终末时全队全属性伤害+20%(4回合)
//   5链:指挥状态期间赫卡忒及弗洛洛受伤-30%(defense buff)
//   6链:强化攻击·赫卡忒倍率+24% + 重世动作召唤赫卡忒追击 + 登场湮灭+60% / 非登场受伤+40%

import { registerSwitchOutHook } from '../switchHooks.js';
import { spawnSummon, removeSummon, damageSummon } from '../combat.js';
import { calcDamage, dealDamage } from '../combat.js';

// ── 常量 ──
const NOTES_MAX = 6;
const ECHOES_MAX = 24;
const NOTES_START = 4;        // 战斗开始送4乐声(固有·八重奏)
const ECHOES_START = 10;      // 战斗开始送10余响(固有·八重奏)
const ECHOES_PER_NOTE_BONUS = 0.20;  // 每层余响谱曲终末+20%
const ECHOES_FULL_MULT = 3.0;        // 满24层×3.0
const ECHOES_PER_LAYER_CDMG = 0.025; // 每层余响+2.5%暴伤(固有·八重奏)

const NORMAL_HP_MULT = 0.04;
const SKILL_HP_MULT = 0.075;
const HEAVY_HP_MULT = 0.09;
const DIRGE_HP_MULT = 0.20;          // 谱曲终末 HP×20%
const VARIATION_HP_MULT = 0.033;     // 致命组歌 HP×3.3%
const VARIATION_COMMAND_MULT = 0.066;// 永生组歌 HP×6.6%

const COMMAND_DURATION = 3;
const COMMAND_ATK_BONUS = 1.20;      // 指挥状态攻击+120%
const HECASTE_AUTO_HP_MULT = 0.12;   // 赫卡忒自动 HP×12%
const HECASTE_AUGMENT_HP_MULT = 0.24;// 赫卡忒强化 HP×24%

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
  return furoloInDirge(self);  // 解放需处于定音状态
}

// ── 战斗开始 hook(固有·八重奏) ──
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
  // 同步到 forte.current 让 UI 资源条显示
  if (self.forte) {
    self.forte.current = self.furoloEchoes;
    self.forte.ready = self.furoloEchoes >= ECHOES_MAX;
  }
  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `固有·八重奏 · 战斗开始：乐声 +${NOTES_START}（${self.furoloNotes}/${NOTES_MAX}）· 余响 +${ECHOES_START}（${self.furoloEchoes}/${ECHOES_MAX}）`
  });
}

// ── 加乐声 ──
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

// ── 加余响(同步刷新暴伤 buff + self.forte.current 给 UI) ──
export function furoloGainEchoes(self, n, battle) {
  if (self.name !== '弗洛洛') return;
  const before = self.furoloEchoes || 0;
  self.furoloEchoes = Math.min(ECHOES_MAX, before + n);
  // 同步到 forte.current 让 UI 资源条显示
  if (self.forte) {
    self.forte.current = self.furoloEchoes;
    self.forte.ready = self.furoloEchoes >= ECHOES_MAX;
  }
  if (self.furoloEchoes !== before && battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `余响 +${self.furoloEchoes - before}（${before} → ${self.furoloEchoes}/${ECHOES_MAX}）`
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

// ── 普攻第3段后加乐声(由 doAttack 调用) ──
export function furoloOnNormalHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  furoloGainEchoes(self, 3, battle);
  // 6 链重世追击:普攻第3段后召唤赫卡忒追击
  if (self.chain >= 6) furoloC6EchoPhantom(self, battle);
}

// ── 技能命中后加乐声 ──
export function furoloOnSkillHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  furoloGainEchoes(self, 5, battle);
  if (self.chain >= 6) furoloC6EchoPhantom(self, battle);
}

// ── 重击命中后加乐声 ──
export function furoloOnHeavyHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  furoloGainEchoes(self, 4, battle);
}

// ── 变奏入场后加乐声 ──
export function furoloOnVariationHit(self, battle) {
  if (self.name !== '弗洛洛') return;
  furoloGainNotes(self, 1, battle);
  furoloGainEchoes(self, 2, battle);
}

// ── 6 链重世幻象追击(普攻第3段/技能后召唤赫卡忒追击 HP×8%) ──
function furoloC6EchoPhantom(self, battle) {
  if (self.chain < 6) return;
  const target = battle.enemies.find(e => e.alive);
  if (!target) return;
  // HP×8% 等效(官方 216.42% ATK,HP核折算 ≈ HP×8%)
  const { dmg } = calcDamage(self, target, 0.08, 'skill');
  const real = dealDamage(target, dmg);
  furoloGainEchoes(self, 8, battle);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `6 链 · 重世幻象 · 赫卡忒追击 HP×8%（${real} 伤害）`
  });
}

// ── 重击替换为谱曲终末(满6乐声时) ──
// 返回 { mult, dmgType, label, isDirge } 或 null
export function furoloResolveHeavy(self, battle) {
  if (self.name !== '弗洛洛') return null;
  if ((self.furoloNotes || 0) < NOTES_MAX) return null;
  return {
    mult: furoloDirgeMult(self),
    dmgType: 'skill',  // 谱曲终末视为共鸣技能伤害 + 声骸技能
    label: '谱曲终末',
    isDirge: true
  };
}

// ── 谱曲终末倍率(HP×20% × (1 + 余响层数×每层加成) × 满层倍率) ──
export function furoloDirgeMult(self) {
  let baseMult = DIRGE_HP_MULT;
  // 2 链:谱曲终末倍率 +75%
  if (self.chain >= 2) baseMult *= 1.75;
  // 余响增伤:每层 +20%(2链时 +35%),满24层 ×3.0
  const perLayer = self.chain >= 2 ? ECHOES_PER_NOTE_BONUS * 1.75 : ECHOES_PER_NOTE_BONUS;
  const echoes = self.furoloEchoes || 0;
  const echoBonus = 1 + echoes * perLayer;
  let mult = baseMult * echoBonus;
  // 满24层 ×3.0
  if (echoes >= ECHOES_MAX) mult *= ECHOES_FULL_MULT;
  return mult;
}

// ── 谱曲终末结算(消耗乐声,进入定音,4链团队buff,2链+14余响) ──
export function furoloExecuteDirge(self, battle) {
  if (self.name !== '弗洛洛') return;
  // 消耗全部乐声
  const consumed = self.furoloNotes || 0;
  self.furoloNotes = 0;
  // 进入定音
  self.furoloDirge = true;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `谱曲终末 · 消耗 ${consumed} 乐声 · 进入定音状态(解锁共鸣解放)`
  });
  // 2 链:施放谱曲终末 +14 余响
  if (self.chain >= 2) {
    furoloGainEchoes(self, 14, battle);
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
      t.buffs.push({ type: 'elemAllUp', value: 0.20, duration: 4, src: '弗洛洛4链' });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '4 链 · 火炬引导 · 全队全属性伤害 +20%（4 回合）'
    });
  }
}

// ── 解放 hook(进入指挥状态 + 召唤赫卡忒) ──
export function furoloOnBurst(self, ctx) {
  if (self.name !== '弗洛洛') return;
  const battle = ctx.battle;
  // 退出定音
  self.furoloDirge = false;
  // 进入指挥状态
  self.furoloCommandTurns = COMMAND_DURATION;
  self.furoloHecateAttacks = 0;
  // 攻击 +120% buff
  self.buffs = (self.buffs || []).filter(b => b.src !== '弗洛洛指挥状态');
  self.buffs.push({ type: 'atkUp', value: COMMAND_ATK_BONUS, duration: COMMAND_DURATION, src: '弗洛洛指挥状态' });
  // 5 链:减伤 30% buff(赫卡忒和弗洛洛均受益)
  if (self.chain >= 5) {
    self.buffs.push({ type: 'defense', value: 0.30, duration: COMMAND_DURATION, src: '弗洛洛5链' });
  }
  // 召唤赫卡忒
  const ownerIdx = battle.team.indexOf(self);
  const hecate = spawnSummon(battle, {
    id: 'furolo_hecate',
    name: '赫卡忒',
    ownerIdx,
    ownerName: self.name,
    hp: self.hp,  // 继承弗洛洛 HP
    atk: self.atk,
    def: self.def,
    element: '湮灭',
    duration: COMMAND_DURATION,
    onTurnStart: furoloHecateTurnStart,
    onOwnerDamaged: furoloHecateOnDamaged,
    onDeath: furoloHecateOnDeath
  });
  // 5 链减伤同步给赫卡忒
  if (self.chain >= 5) {
    hecate.buffs.push({ type: 'defense', value: 0.30, duration: COMMAND_DURATION, src: '弗洛洛5链' });
  }
  self.furoloHecateSummonId = hecate.id;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `指挥状态展开 · 持续 ${COMMAND_DURATION} 回合 · 攻击 +120% · 赫卡忒召唤（HP ${hecate.hp}）`
  });
}

// ── 赫卡忒每回合自动攻击 ──
function furoloHecateTurnStart(summon, battle) {
  if (!summon.alive) return;
  const owner = battle.team[summon.ownerIdx];
  if (!owner || !owner.alive) return;
  const target = battle.enemies.find(e => e.alive);
  if (!target) return;
  summon._attackCount = (summon._attackCount || 0) + 1;
  // 每 2 次后强化
  const isAugment = summon._attackCount % 2 === 0;
  const mult = isAugment ? HECASTE_AUGMENT_HP_MULT : HECASTE_AUTO_HP_MULT;
  // 6 链:强化攻击倍率 +24%
  const finalMult = isAugment && owner.chain >= 6 ? mult * 1.24 : mult;
  // 赫卡忒用 owner 的属性计算(继承)
  const { dmg } = calcDamage(owner, target, finalMult, 'burst');
  const real = dealDamage(target, dmg);
  // 加乐声+余响给主人
  furoloGainNotes(owner, 1, battle);
  furoloGainEchoes(owner, isAugment ? 3 : 2, battle);
  battle.log.push({
    type: 'mechanic', src: '赫卡忒',
    msg: `${isAugment ? '强化攻击' : '自动攻击'} · HP×${(finalMult*100).toFixed(1)}%（${real} 伤害）· 弗洛洛 +1 乐声 +${isAugment ? 3 : 2} 余响`
  });
  // 3 链:强化攻击命中目标攻击 -20%(2回合)
  if (isAugment && owner.chain >= 3) {
    target.buffs = (target.buffs || []).filter(b => b.src !== '弗洛洛3链');
    target.buffs.push({ type: 'atkDown', value: 0.20, duration: 2, src: '弗洛洛3链' });
    battle.log.push({
      type: 'mechanic', src: '赫卡忒',
      msg: '3 链 · 强化攻击命中 · 目标攻击 -20%（2 回合）'
    });
  }
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

// ── 赫卡忒死亡(指挥状态立即结束) ──
function furoloHecateOnDeath(summon, battle) {
  const owner = battle.team[summon.ownerIdx];
  if (!owner) return;
  owner.furoloCommandTurns = 0;
  owner.furoloHecateSummonId = null;
  // 清除指挥状态 buff
  owner.buffs = (owner.buffs || []).filter(b => b.src !== '弗洛洛指挥状态' && b.src !== '弗洛洛5链');
  battle.log.push({
    type: 'mechanic', src: owner.name,
    msg: '赫卡忒消散 · 指挥状态立即结束 · 失去攻击 +120% 与赫卡忒攻击'
  });
}

// ── 切人 hook(切人时退指挥状态,赫卡忒消失) ──
export function furoloSwitchOut({ from, battle }) {
  if (from?.name !== '弗洛洛') return;
  if (!(from.furoloCommandTurns || 0)) return;
  // 移除赫卡忒
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

// ── 变奏入场 hook ──
export function furoloSwitchIn({ to, battle }) {
  if (to?.name !== '弗洛洛') return;
  // 变奏伤害由 combat.js doSwitch 处理,这里只挂资源加成
  // furoloOnVariationHit 由 doSwitch 内部调用
}

// ── 指挥状态 duration tick(由通用 tickSummonsDuration 处理 duration,这里只同步主人状态) ──
export function furoloTick(self, battle) {
  if (self.name !== '弗洛洛') return null;
  if (!(self.furoloCommandTurns || 0)) return null;
  // 检查赫卡忒是否还活着(可能本回合被打死)
  const hecateAlive = battle.summons.some(s => s.id === self.furoloHecateSummonId && s.alive);
  if (!hecateAlive) {
    // 赫卡忒已死,指挥状态由 onDeath 回调清理过,这里不需要再处理
    return null;
  }
  // duration 由通用系统递减,这里同步主人 commandTurns
  // 实际上 commandTurns 应该跟随赫卡忒 duration
  // 简化:commandTurns = 赫卡忒 duration
  const hecate = battle.summons.find(s => s.id === self.furoloHecateSummonId);
  if (hecate) {
    self.furoloCommandTurns = hecate.duration;
  }
  return null;
}

// ── 徽章收集(战斗 UI 状态行) ──
export function furoloCollectBadges(self) {
  if (self.name !== '弗洛洛') return [];
  const badges = [];
  const notes = self.furoloNotes || 0;
  const echoes = self.furoloEchoes || 0;
  badges.push(`<span style="color:var(--gold)">乐声 ${notes}/${NOTES_MAX}</span>`);
  badges.push(`<span style="color:#c39bff">余响 ${echoes}/${ECHOES_MAX}</span>`);
  if (self.furoloDirge) badges.push(`<span style="color:var(--accent)">定音</span>`);
  if ((self.furoloCommandTurns || 0) > 0) {
    badges.push(`<span style="color:#9b6dff">指挥 ${self.furoloCommandTurns}回</span>`);
  }
  return badges;
}

export default {
  name: '弗洛洛',
  hasHeavy: true,
  notes: furoloNotes,
  echoes: furoloEchoes,
  inDirge: furoloInDirge,
  inCommand: furoloInCommand,
  canBurst: furoloCanBurst,
  battleStart: furoloBattleStart,
  onNormalHit: furoloOnNormalHit,
  onSkillHit: furoloOnSkillHit,
  onHeavyHit: furoloOnHeavyHit,
  onVariationHit: furoloOnVariationHit,
  resolveHeavy: furoloResolveHeavy,
  executeDirge: furoloExecuteDirge,
  dirgeMult: furoloDirgeMult,
  onBurst: furoloOnBurst,
  switchIn: furoloSwitchIn,
  tick: furoloTick,
  collectBadges: furoloCollectBadges
};
