// 散华「冰棘 · 重击爆裂」
// 设计：docs/plans/characters/散华.md（2026-07-16）
// 满冰棘才可重击·爆裂 → 清空；4 链解放窗 +120% 下次爆裂；5 链仅爆裂暴伤；6 链叠全队攻；延奏凛絜

import { consumeForte } from '../forte.js';
import { registerSwitchOutHook } from '../switchHooks.js';

export function sanhuaCanHeavy(self) {
  if (self.name !== '散华') return null;
  if (!self.forte?.ready) {
    return { ok: false, err: '冰棘未满，无法施放重击·爆裂' };
  }
  return null;
}

export function sanhuaHeavyMult(self) {
  if (self.name !== '散华') return null;
  return 3.7;
}

export function sanhuaNormalMult(self) {
  return self.name === '散华' ? 1.2 : null;
}

export function sanhuaSkillMult(self) {
  return self.name === '散华' ? 3.6 : null;
}

export function sanhuaVariationMult(self) {
  return self.name === '散华' ? 1.4 : null;
}

export function sanhuaResolveBurstMult(self) {
  if (self.name !== '散华') return null;
  return { baseMain: 8.1, baseSide: 4.05 };
}

// 3 链：目标生命 <70% 时伤害 +35%
export function sanhuaGetMarkDamageBonus(self, defender) {
  if (self.name !== '散华' || !self.sanhuaC3) return 1;
  if (!defender?.hpMax) return 1;
  if (defender.hp / defender.hpMax < 0.7) return 1 + self.sanhuaC3;
  return 1;
}

// 5 链：仅重击·爆裂暴伤 +100%（满条才放得了重击）
export function sanhuaCdmgBonus(self, _defender, dmgType) {
  if (self.name !== '散华' || !self.sanhuaC5) return 0;
  if (dmgType !== 'heavy') return 0;
  return self.sanhuaC5;
}

export function sanhuaFinishHeavy(self) {
  if (self.name !== '散华') return null;
  return '重击·爆裂';
}

// 1 链：每第 5 次普攻 → 暴击 +15% · 2 回合
export function sanhuaOnAttack(self, ctx) {
  if (self.name !== '散华') return;
  self.sanhuaNormalCount = (self.sanhuaNormalCount || 0) + 1;
  if (!self.sanhuaC1) return;
  if (self.sanhuaNormalCount % 5 !== 0) return;
  self.buffs = (self.buffs || []).filter(b => b.src !== '孤身孑然');
  self.buffs.push({
    type: 'crateUp',
    value: 0.15,
    duration: 3, // 2 回合 + endTurn 当回合 tick
    src: '孤身孑然',
  });
  ctx?.battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: '孤身孑然 · 暴击 +15%（2 回合）',
  });
}

// 解放：4 链回能 + 下次爆裂 +120% 窗
export function sanhuaOnBurst(self, ctx) {
  if (self.name !== '散华' || !self.sanhuaC4) return;
  const cfg = self.sanhuaC4;
  const energy = cfg.energy || 10;
  self.energy = Math.min(self.energyMax, Math.round(self.energy + energy));
  self.buffs = (self.buffs || []).filter(b => b.src !== '剑修五蕴');
  self.buffs.push({
    type: 'heavyDmgUp',
    value: cfg.heavyBonus != null ? cfg.heavyBonus : 1.2,
    duration: (cfg.dur || 2) + 1,
    src: '剑修五蕴',
    once: true,
  });
  ctx?.battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `剑修五蕴 · 回复 ${energy} 能量 · 下次重击·爆裂伤害 +${((cfg.heavyBonus != null ? cfg.heavyBonus : 1.2) * 100).toFixed(0)}%`,
  });
}

// 爆裂：清空冰棘、吃掉 4 链窗、6 链叠攻
export function sanhuaOnHeavy(self, ctx) {
  if (self.name !== '散华') return;
  const battle = ctx?.battle;
  consumeForte(self);

  const hadC4 = (self.buffs || []).some(b => b.src === '剑修五蕴');
  if (hadC4) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '剑修五蕴');
    battle?.log.push({ type: 'mechanic', src: self.name, msg: '剑修五蕴 · 爆裂强化已消耗' });
  }

  if (self.sanhuaC6 && battle) {
    const cfg = self.sanhuaC6;
    const val = cfg.value != null ? cfg.value : 0.1;
    const cap = cfg.cap || 2;
    const dur = (cfg.dur || 3) + 1;
    let stackNow = 0;
    battle.team.forEach(t => {
      if (!t.alive) return;
      const layers = (t.buffs || []).filter(b => b.src === '曙色天光');
      if (layers.length >= cap) {
        layers.forEach(b => { b.duration = dur; });
        stackNow = cap;
      } else {
        t.buffs = t.buffs || [];
        t.buffs.push({ type: 'atkUp', value: val, duration: dur, src: '曙色天光' });
        stackNow = layers.length + 1;
      }
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `曙色天光 · 全队攻击 +${(val * 100).toFixed(0)}%（${stackNow}/${cap} 层）`,
    });
  }
}

// 变奏 · 凛刺：+15 冰棘
export function sanhuaOnVariation(self, ctx) {
  if (self.name !== '散华' || !self.forte) return;
  const gain = 15;
  self.forte.current = Math.min(self.forte.max, (self.forte.current || 0) + gain);
  if (self.forte.current >= self.forte.max) self.forte.ready = true;
  ctx?.battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `凛刺 · 冰棘 +${gain}（${self.forte.current}/${self.forte.max}）`,
  });
}

// 延奏 · 凛絜：下一位普攻加深 38% · 2 回合；持有者再切人时 endOnSwitch 清除
function sanhuaSwitchOut({ from, to, battle }) {
  if (!from || from.name !== '散华' || !to) return;
  to.buffs = (to.buffs || []).filter(b => b.src !== '凛絜');
  to.buffs.push({
    type: 'normalDmgUp',
    value: 0.38,
    duration: 3,
    src: '凛絜',
    endOnSwitch: true,
  });
  battle?.log.push({
    type: 'mechanic', src: from.name,
    msg: `凛絜 · ${to.name} 普攻伤害加深 38%（2 回合）`,
  });
}

registerSwitchOutHook('散华', sanhuaSwitchOut);

export default {
  name: '散华',
  hasHeavy: true,
  canHeavy: sanhuaCanHeavy,
  heavyMult: sanhuaHeavyMult,
  normalMult: sanhuaNormalMult,
  skillMult: sanhuaSkillMult,
  variationMult: sanhuaVariationMult,
  resolveBurstMult: sanhuaResolveBurstMult,
  getMarkDamageBonus: sanhuaGetMarkDamageBonus,
  cdmgBonus: sanhuaCdmgBonus,
  finishHeavy: sanhuaFinishHeavy,
  onAttack: sanhuaOnAttack,
  onSkill: null,
  onBurst: sanhuaOnBurst,
  onHeavy: sanhuaOnHeavy,
  onVariation: sanhuaOnVariation,
  switchOut: sanhuaSwitchOut,
};
