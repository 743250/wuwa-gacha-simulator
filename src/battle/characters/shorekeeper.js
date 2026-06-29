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

// 共鸣解放 · 终末回环 → 展开「星域」
export function shorekeeperStarfield(self, battle) {
  if (self.name !== '守岸人') return;
  const dur1Chain = self.fieldExtendDur || 0;
  const baseDur = 3 + dur1Chain;
  const fourChain = self.healBuff4Chain || 0;
  const healUp = 1 + (self.healBonus || 0) + fourChain;
  const heal1chain = self.fieldPersistOnSwitch ? 2.5 : 1.0;
  let sampleHot = 0;
  const fieldCrate = (0.20 + (self.fieldExtraCrate || 0)) * heal1chain;
  const fieldCdmg = 0.30 * heal1chain;
  const fieldAtk = (self.fieldExtraAtk || 0) * heal1chain;

  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== '星域');
    const hot = Math.round((self.hp * 0.08 + self.atk * 0.8) * healUp * heal1chain);
    if (!sampleHot) sampleHot = hot;
    t.buffs.push({ type: 'healOverTime', value: hot, duration: baseDur, src: '星域', persistent: !!self.fieldPersistOnSwitch });
    t.buffs.push({ type: 'crateUp', value: fieldCrate, duration: baseDur, src: '星域', persistent: !!self.fieldPersistOnSwitch });
    t.buffs.push({ type: 'cdmgUp', value: fieldCdmg, duration: baseDur, src: '星域', persistent: !!self.fieldPersistOnSwitch });
    if (fieldAtk > 0) {
      t.buffs.push({ type: 'atkUp', value: fieldAtk, duration: baseDur, src: '星域', persistent: !!self.fieldPersistOnSwitch });
    }
  });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `「星域 · 终末回环」展开 · 全队每回合回血 ~${sampleHot} · 暴击 +${(fieldCrate*100).toFixed(0)}% · 暴伤 +${(fieldCdmg*100).toFixed(0)}%${fieldAtk > 0 ? ` · 攻击 +${(fieldAtk * 100).toFixed(0)}%` : ''}（${baseDur} 回合${self.fieldPersistOnSwitch ? ' · 切人不结束' : ''}）`
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

export default {
  name: '守岸人',
  hasHeavy: false,
  skillHeal: shorekeeperSkillHeal,
  onSkill: shorekeeperOnSkill,
  starfield: shorekeeperStarfield,
  burstRefund: shorekeeperBurstRefund,
  onBurst: shorekeeperOnBurst
};
