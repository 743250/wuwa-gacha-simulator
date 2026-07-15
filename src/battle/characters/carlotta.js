// 珂莱塔「晶体层数 / 解离 / 死兆」冷凝佩枪主C
//
//   技能 +1 晶体（上限 5），满层强化技能 ×2.0
//   技能命中挂解离，再命中升级变彩
//   C1：对解离/变彩目标暴击 +12.5%（crateBonus hook）
//   C4：重击后全队 skillDmgUp +25% · 2 回合

export function carlottaApplyDissociation(self, target, battle) {
  if (self.name !== '珂莱塔') return;
  if (!target?.alive) return;
  target.debuffs = target.debuffs || [];
  const existing = target.debuffs.find(d => d.type === 'dissociation' || d.type === 'iridescent');
  if (!existing) {
    target.debuffs.push({ type: 'dissociation', duration: 3 });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 进入解离状态` });
  } else if (existing.type === 'dissociation') {
    existing.type = 'iridescent';
    existing.duration = 3;
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 解离 → 变彩` });
  } else {
    existing.duration = 3;
  }
}

export function carlottaOnSkill(self, ctx) {
  if (self.name !== '珂莱塔') return;
  carlottaApplyDissociation(self, ctx.target, ctx.battle);
}

export function carlottaCrateBonus(self, target) {
  if (self.name !== '珂莱塔' || !target?.debuffs) return 0;
  const d = target.debuffs.find(d => d.type === 'dissociation' || d.type === 'iridescent');
  return d ? (self.carlottaCrateVsDebuff || 0) : 0;
}

export function carlottaOnHeavy(self, ctx) {
  if (self.name !== '珂莱塔') return;
  const v = self.carlottaTeamSkillAfterHeavy;
  if (!v || !ctx?.battle) return;
  ctx.battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== '以旧雨');
    t.buffs.push({ type: 'skillDmgUp', value: v, duration: 3, src: '以旧雨', installer: self.idx });
  });
  ctx.battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `以旧雨 · 全队共鸣技能 +${(v * 100).toFixed(0)}%（2 回合）`
  });
}

export function carlottaDeathKnell(self) {
  if (self.name !== '珂莱塔' || !self.carlottaDeathKnellBonus) return 1.0;
  return 1.0 + self.carlottaDeathKnellBonus;
}

// Phase 3 · encore Lv10：N120 / S280 / 满晶体×2→560 / H550 / 解放 1000·500 / 变奏 200
export function carlottaNormalMult(self) {
  return self.name === '珂莱塔' ? 1.2 : null;
}
export function carlottaSkillMult(self) {
  return self.name === '珂莱塔' ? 2.8 : null;
}
export function carlottaHeavyMult(self) {
  return self.name === '珂莱塔' ? 5.5 : null;
}
export function carlottaVariationMult(self) {
  return self.name === '珂莱塔' ? 2.0 : null;
}
export function carlottaResolveBurstMult(self) {
  if (self.name !== '珂莱塔') return null;
  return { baseMain: 10.0, baseSide: 5.0 };
}

export default {
  name: '珂莱塔',
  hasHeavy: true,
  applyDissociation: carlottaApplyDissociation,
  onSkill: carlottaOnSkill,
  onHeavy: carlottaOnHeavy,
  crateBonus: carlottaCrateBonus,
  deathKnell: carlottaDeathKnell,
  normalMult: carlottaNormalMult,
  skillMult: carlottaSkillMult,
  heavyMult: carlottaHeavyMult,
  variationMult: carlottaVariationMult,
  resolveBurstMult: carlottaResolveBurstMult
};
