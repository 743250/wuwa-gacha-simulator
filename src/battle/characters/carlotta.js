// 珂莱塔「晶体层数 / 解离 / 死兆」冷凝佩枪主C
//
// 创作者思路：珂莱塔是「叠晶体 → 示我璀璨 → 致死以终/死兆」的爆发型主C
//   共鸣技能积晶体层数（上限 5），满层强化共鸣技能（×2.0 冷凝爆发）
//   解离/变彩：目标状态效果，增加暴击率
//   末路见行（重击）：47% 倍率提升（5 链）
//   致死以终 → 死兆：共鸣解放二段爆发

export function carlottaApplyDissociation(self, target, battle) {
  if (self.name !== '珂莱塔') return;
  if (!target?.alive) return;
  target.debuffs = target.debuffs || [];
  const existing = target.debuffs.find(d => d.type === 'dissociation');
  if (!existing) {
    target.debuffs.push({ type: 'dissociation', duration: 3 });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 进入解离状态` });
  } else {
    // 解离 → 变彩升级
    existing.type = 'iridescent';
    existing.duration = 3;
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 解离 → 变彩（暴击率提升）` });
  }
}

// onSkill hook：共鸣技能命中 → 目标解离/变彩
export function carlottaOnSkill(self, ctx) {
  if (self.name !== '珂莱塔') return;
  carlottaApplyDissociation(self, ctx.target, ctx.battle);
}

// 对解离/变彩目标的暴击加成
export function carlottaCrateBonus(self, target) {
  if (self.name !== '珂莱塔' || !target?.debuffs) return 0;
  const d = target.debuffs.find(d => d.type === 'dissociation' || d.type === 'iridescent');
  return d ? (self.carlottaCrateVsDebuff || 0) : 0;
}

// 死兆（解放最终段）：灵萃满时触发额外晶体
export function carlottaDeathKnell(self, battle) {
  if (self.name !== '珂莱塔' || !self.carlottaDeathKnellBonus) return 1.0;
  return 1.0 + self.carlottaDeathKnellBonus;
}

export default {
  name: '珂莱塔',
  hasHeavy: true,
  applyDissociation: carlottaApplyDissociation,
  onSkill: carlottaOnSkill,
  crateBonus: carlottaCrateBonus,
  deathKnell: carlottaDeathKnell
};
