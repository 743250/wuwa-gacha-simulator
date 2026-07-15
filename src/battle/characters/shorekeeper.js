// 守岸人「星域」治疗 + 增益核心
//
// 创作者思路：领域是守岸人的全部价值。一按解放 = 全队进入"持续治疗 + 暴击 buff"状态。
//   普攻、技能、变奏都不抢戏，所有共鸣链都改这个领域的参数。

// 共鸣技能 · 混沌理论：附带全队治疗
export function shorekeeperSkillHeal(self, battle) {
  if (self.name !== '守岸人') return;
  const fourChain = self.healBuff4Chain || 0;
  const healUp4 = 1 + (self.healBonus || 0) + fourChain;
  battle.team.forEach(t => {
    if (!t.alive) return;
    const baseHeal = Math.round(t.hpMax * 0.06 + self.atk * 0.5);
    const healUp = (t.buffs || []).reduce((a, b) => b.type === 'healUp' ? a + b.value : a, 0);
    const finalHeal = Math.round(baseHeal * healUp4 * (1 + healUp));
    const healed = Math.min(t.hpMax - t.hp, finalHeal);
    t.hp += healed;
    if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed });
  });
}

// onSkill hook：共鸣技能附带全队治疗
export function shorekeeperOnSkill(self, ctx) {
  if (self.name !== '守岸人') return;
  shorekeeperSkillHeal(self, ctx.battle);
}

import { pushTeamBuffs } from '../pushBuff.js';

// 技能倍率（设计 80%，非通用 180%）
export function shorekeeperSkillMult(self) {
  if (self.name !== '守岸人') return null;
  return 0.8;
}

// 星域 HOT：生命×5% + 攻击×40% / 跳（原 8%+80% 过厚，2026-07-15 下调）
// 展开时立即回 1 跳，之后 endTurn 再按 duration 结算（按下即稳）
const STARFIELD_HOT_HP = 0.05;
const STARFIELD_HOT_ATK = 0.4;

function shorekeeperHotAmount(self, fieldMult) {
  const healUp = 1 + (self.healBonus || 0);
  return Math.round((self.hp * STARFIELD_HOT_HP + self.atk * STARFIELD_HOT_ATK) * healUp * fieldMult);
}

function shorekeeperApplyPulse(self, battle, amount, label) {
  if (!amount || amount <= 0) return;
  battle.team.forEach(t => {
    if (!t.alive) return;
    const healUp = (t.buffs || []).reduce((a, b) => b.type === 'healUp' ? a + b.value : a, 0);
    const finalHeal = Math.round(amount * (1 + healUp));
    const healed = Math.min(t.hpMax - t.hp, finalHeal);
    t.hp += healed;
    if (healed > 0) {
      battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed, msg: label || '星域回复' });
    }
  });
}

// 共鸣解放 · 终末回环 → 展开「星域」
// 4 链只放大技能治疗，不进星域 HOT（见设计 §7 边界）
export function shorekeeperStarfield(self, battle) {
  if (self.name !== '守岸人') return;
  const dur1Chain = self.fieldExtendDur || 0;
  const baseDur = 3 + dur1Chain;
  const heal1chain = self.fieldPersistOnSwitch ? 2.5 : 1.0;
  const fieldCrate = (0.20 + (self.fieldExtraCrate || 0)) * heal1chain;
  const fieldCdmg = 0.30 * heal1chain;
  const fieldAtk = (self.fieldExtraAtk || 0) * heal1chain;

  const hot = shorekeeperHotAmount(self, heal1chain);
  // 按下解放当场回一跳（此前只挂 HOT 要等 endTurn 才见血）
  shorekeeperApplyPulse(self, battle, hot, '星域展开回复');

  const buffs = [
    { type: 'healOverTime', value: hot, duration: baseDur, src: '星域', scope: 'team', persistent: !!self.fieldPersistOnSwitch },
    { type: 'crateUp', value: fieldCrate, duration: baseDur, src: '星域', scope: 'team', persistent: !!self.fieldPersistOnSwitch },
    { type: 'cdmgUp', value: fieldCdmg, duration: baseDur, src: '星域', scope: 'team', persistent: !!self.fieldPersistOnSwitch },
  ];
  if (fieldAtk > 0) {
    buffs.push({ type: 'atkUp', value: fieldAtk, duration: baseDur, src: '星域', scope: 'team', persistent: !!self.fieldPersistOnSwitch });
  }
  pushTeamBuffs(self, battle, buffs);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `「星域 · 终末回环」展开 · 立即回血 ~${hot} · 之后每回合 ~${hot} · 暴击 +${(fieldCrate * 100).toFixed(0)}% · 暴伤 +${(fieldCdmg * 100).toFixed(0)}%${fieldAtk > 0 ? ` · 攻击 +${(fieldAtk * 100).toFixed(0)}%` : ''}（${baseDur} 回合${self.fieldPersistOnSwitch ? ' · 切人不结束' : ''}）`
  });
}

// 3 链：解放后额外回 20 能量（CD 2 回合）
export function shorekeeperBurstRefund(self, battle) {
  if (self.name !== '守岸人' || !self.burstEnergyRefund || self.burstEnergyRefund <= 0) return;
  if (self._burstRefundCdLeft && self._burstRefundCdLeft > 0) return;
  const refund = self.burstEnergyRefund;
  self.energy = Math.min(self.energyMax, Math.round(self.energy + refund));
  self._burstRefundCdLeft = self.burstEnergyRefundCd || 2;
  battle.log.push({ type: 'mechanic', src: self.name, msg: `共鸣链 3 · 解放后额外回复 ${refund} 能量（CD ${self.burstEnergyRefundCd || 2} 回合）` });
}

// onBurst hook：展开星域 + 3 链解放回能
export function shorekeeperOnBurst(self, ctx) {
  if (self.name !== '守岸人') return;
  shorekeeperStarfield(self, ctx.battle);
  shorekeeperBurstRefund(self, ctx.battle);
}

export function shorekeeperSkipGenericBurstHeal(self) {
  return self.name === '守岸人';
}

// 6 链：变奏·洞悉时自身暴伤 +500%（倍率 +42% 已由 variationBonus）
export function shorekeeperOnVariation(self, ctx) {
  if (self.name !== '守岸人' || !self.shorekeeperC6Cdmg) return;
  const cfg = self.shorekeeperC6Cdmg;
  self.buffs = (self.buffs || []).filter(b => b.src !== '我所驶向的新世界');
  self.buffs.push({
    type: 'cdmgUp',
    value: cfg.value || 5,
    duration: (cfg.dur || 2) + 1,
    src: '我所驶向的新世界',
  });
  ctx?.battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `我所驶向的新世界 · 暴击伤害 +${((cfg.value || 5) * 100).toFixed(0)}%（${cfg.dur || 2} 回合）`
  });
}

export default {
  name: '守岸人',
  hasHeavy: false,
  skillMult: shorekeeperSkillMult,
  skillHeal: shorekeeperSkillHeal,
  onSkill: shorekeeperOnSkill,
  starfield: shorekeeperStarfield,
  burstRefund: shorekeeperBurstRefund,
  onBurst: shorekeeperOnBurst,
  onVariation: shorekeeperOnVariation,
  skipGenericBurstHeal: shorekeeperSkipGenericBurstHeal
};
