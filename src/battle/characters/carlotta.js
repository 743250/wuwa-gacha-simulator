// 珂莱塔「晶体层数 / 解离 / 死兆」冷凝佩枪主C
//
//   技能 +1 晶体（上限 5），满层强化技能 ×2.0
//   技能命中挂解离，再命中升级变彩
//   C1：对解离/变彩目标暴击 +12.5%（crateBonus hook）
//   C3：技能 +93% + 切人离场碎璃镜花 1032%
//   C4：重击后全队 skillDmgUp +25% · 2 回合

import { registerSwitchOutHook } from '../switchHooks.js';
import { calcDamage, dealDamage } from '../combat/damage.js';

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
  return self.name === '珂莱塔' ? 8.35 : null; // WIKI 末路见行 835.36%
}
export function carlottaVariationMult(self) {
  return self.name === '珂莱塔' ? 2.0 : null;
}
export function carlottaResolveBurstMult(self) {
  if (self.name !== '珂莱塔') return null;
  return { baseMain: 6.44, baseSide: 3.22 }; // WIKI 致死以终 644.33%
}

// 3 链：切人离场碎璃镜花
export function carlottaSwitchOut({ from, battle }) {
  if (!from || from.name !== '珂莱塔' || !from.carlottaOutroMult || !battle) return;
  const target = battle.enemies.find(e => e.alive);
  if (!target) return;
  const { dmg, crit } = calcDamage(from, target, from.carlottaOutroMult, 'skill');
  const real = dealDamage(target, dmg);
  battle.log.push({
    type: 'attack', src: from.name, tgt: target.name, dmg: real, crit,
    action: '碎璃镜花（3 链延奏）'
  });
}

registerSwitchOutHook('珂莱塔', carlottaSwitchOut);

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
  resolveBurstMult: carlottaResolveBurstMult,
  switchOut: carlottaSwitchOut,
};
