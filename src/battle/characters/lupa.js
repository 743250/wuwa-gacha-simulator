// 露帕「狼焰 / 狼舞·决意·极 / 追猎 / 荣光」状态机
//
// ATK 核 · 热熔副C:
//   攒狼焰 → 满时技能替换狼舞·决意·极(atk×320% burst) → 解放铺追猎/荣光 → 切主C。
//   链 1/2/3/4/5/6 状态机落地；registry 对应项占位防双算。

import { registerSwitchHook } from '../switchHooks.js';

const LANGWU_BASE = 5.8; // Phase3 encore 586%
const HUNT_ELEM = 0.10;
const GLORY_RESIST_BASE = 0.03;
const GLORY_RESIST_C3 = 0.15;
const AURA_TURNS = 4;
const C1_CRATE = 0.20;
const C2_TEAM_FUSION = 0.40;
const C2_TURNS = 4;
const C4_LANGWU_BONUS = 1.25;
const C5_BURST = 0.15;
const C6_PIERCE = 0.30;
const C6_FLAME_CD = 2;

const SRC_HUNT = '露帕追猎';
const SRC_GLORY = '露帕荣光';
const SRC_C1 = '露帕1链';
const SRC_C2 = '露帕2链';
const SRC_C5 = '露帕5链';

export function lupaFlame(self) {
  return self?.name === '露帕' ? (self.forte?.current || 0) : 0;
}

export function lupaLangwuReady(self) {
  return !!(self && self.name === '露帕' && self.forte?.ready);
}

function langwuMult(self) {
  let mult = LANGWU_BASE;
  // FORTE_BOOST 6 链 +0.4 已写入 forte.effectMult（3.2+0.4）；优先读实时 effectMult
  if (self.forte?.effectMult != null && self.forte.effectMult > 0) {
    mult = self.forte.effectMult;
  }
  if ((self.chain || 0) >= 4) mult *= (1 + C4_LANGWU_BONUS);
  return mult;
}

function gloryResist(self) {
  return (self.chain || 0) >= 3 ? GLORY_RESIST_C3 : GLORY_RESIST_BASE;
}

function applyTeamFusionAura(battle, value, duration, src) {
  if (!battle) return;
  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== src);
    if (value > 0) {
      t.buffs.push({
        type: 'elemFusionUp',
        value,
        duration,
        src,
        installer: battle.team.find(u => u.name === '露帕')?.idx
      });
    }
  });
}

function applyGloryAura(self, battle) {
  if (!battle) return;
  const ignore = gloryResist(self);
  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== SRC_GLORY);
    t.buffs.push({
      type: 'elemResistIgnore',
      element: '热熔',
      value: ignore,
      duration: AURA_TURNS + 1,
      src: SRC_GLORY,
      installer: self.idx
    });
  });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `荣光 · 全队攻击无视 ${(ignore * 100).toFixed(0)}% 热熔抗性（${AURA_TURNS} 回合）`
  });
}

function applyHuntAura(self, battle) {
  if (!battle) return;
  applyTeamFusionAura(battle, HUNT_ELEM, AURA_TURNS + 1, SRC_HUNT);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `追猎 · 全队热熔伤害 +${(HUNT_ELEM * 100).toFixed(0)}%（${AURA_TURNS} 回合）`
  });
}

function applyC2TeamFusion(self, battle) {
  if ((self.chain || 0) < 2 || !battle) return;
  applyTeamFusionAura(battle, C2_TEAM_FUSION, C2_TURNS + 1, SRC_C2);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `2 链 · 全队热熔 +${(C2_TEAM_FUSION * 100).toFixed(0)}%（${C2_TURNS} 回合）`
  });
}

// 满狼焰时技能替换为狼舞·决意·极
export function lupaResolveSkill(self, battle) {
  if (self.name !== '露帕') return null;
  if (!self.forte?.ready) return null;
  return {
    isLangwu: true,
    mult: langwuMult(self),
    dmgType: 'burst',
    label: '狼舞·决意·极'
  };
}

// doSkill 在 resolveSkill 后会调 enterHanbao —— 这里清空狼焰
export function lupaEnterHanbao(self, battle, _isRefresh) {
  if (self.name !== '露帕' || !self.forte) return;
  const before = self.forte.current || 0;
  self.forte.current = 0;
  self.forte.ready = false;
  if (before > 0) {
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: `消耗全部狼焰（${before} → 0）施放狼舞·决意·极`
    });
  }
}

export function lupaFinishSkill(self, battle, form) {
  if (self.name !== '露帕') return null;
  if (form?.isLangwu) {
    applyC2TeamFusion(self, battle);
    // gainForte 已在 doSkill 里 +15，再清零保证狼舞后归零
    if (self.forte) {
      self.forte.current = 0;
      self.forte.ready = false;
    }
    return form.label || '狼舞·决意·极';
  }
  return null;
}

// 6 链：凶噬（非狼舞）命中额外 +100 狼焰，CD 2 回合
export function lupaOnSkill(self, ctx) {
  if (self.name !== '露帕') return;
  if (ctx?.form?.isLangwu) return;
  if ((self.chain || 0) < 6) return;
  const battle = ctx?.battle;
  const cd = self.lupaC6FlameCd || 0;
  if (cd > 0 || !self.forte) return;
  const before = self.forte.current || 0;
  self.forte.current = Math.min(self.forte.max, before + 100);
  self.forte.ready = self.forte.current >= self.forte.max;
  self.lupaC6FlameCd = C6_FLAME_CD + 1;
  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `6 链 · 凶噬回满狼焰（${before} → ${self.forte.current}）`
  });
}

// 解放前：1 链暴击；Phase 3 解放主 1100% / 副 550%
export function lupaResolveBurstMult(self) {
  if (self.name !== '露帕') return null;
  if ((self.chain || 0) >= 1) {
    self.buffs = (self.buffs || []).filter(b => b.src !== SRC_C1);
    self.buffs.push({ type: 'crateUp', value: C1_CRATE, duration: 1, src: SRC_C1 });
  }
  return { baseMain: 11.0, baseSide: 5.5 };
}

export function lupaNormalMult(self) {
  return self.name === '露帕' ? 1.2 : null;
}
export function lupaSkillMult(self) {
  // 狼舞走 resolveSkill 替换；常态凶噬 300%
  return self.name === '露帕' ? 3.0 : null;
}
export function lupaHeavyMult(self) {
  return self.name === '露帕' ? 4.0 : null;
}

export function lupaOnBurst(self, ctx) {
  if (self.name !== '露帕') return;
  const battle = ctx?.battle;
  // 解放回满狼焰（gainForte 已 +100，再保证满）
  if (self.forte) {
    self.forte.current = self.forte.max;
    self.forte.ready = true;
  }
  applyHuntAura(self, battle);
  applyGloryAura(self, battle);
  applyC2TeamFusion(self, battle);
}

export function lupaOnHeavy(self, ctx) {
  if (self.name !== '露帕') return;
  applyC2TeamFusion(self, ctx?.battle);
}

export function lupaOnVariation(self, ctx) {
  if (self.name !== '露帕') return;
  const battle = ctx?.battle;
  if ((self.chain || 0) >= 5) {
    self.buffs = (self.buffs || []).filter(b => b.src !== SRC_C5);
    self.buffs.push({
      type: 'burstDmgUp',
      value: C5_BURST,
      duration: 1 + 1,
      src: SRC_C5
    });
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: `5 链 · 下次共鸣解放伤害 +${(C5_BURST * 100).toFixed(0)}%`
    });
  }
  // 6 链：变奏不再清除追猎/荣光 —— 本模拟器变奏本就不清，无需额外处理
}

export function lupaExtraPierce(self, dmgType) {
  if (self.name !== '露帕') return 0;
  if ((self.chain || 0) < 6) return 0;
  if (dmgType === 'burst' || dmgType === 'variation') return C6_PIERCE;
  return 0;
}

export function lupaVariationMult(self) {
  if (self.name !== '露帕') return null;
  // 3 链：变奏倍率 +100% → 由 doSwitch 的 variationBonus 或这里不直接接管
  // variationBonus 已可挂 unit；用占位链时在 onVariation 不改倍率。
  // 这里通过 query 不介入；3 链用 variationBonus 字段在 battleStart 不挂 flat。
  // 改为 switchIn/onVariation 临时？doSwitch 用 target.variationBonus。
  return null;
}

export function lupaBattleStart(self, ctx) {
  if (self.name !== '露帕') return;
  // 3 链变奏 +100%：挂 variationBonus（仅变奏吃，非常驻 skill/burst flat）
  if ((self.chain || 0) >= 3) {
    self.variationBonus = (self.variationBonus || 0) + 1.0;
  }
}

export function lupaTurnCleanup(self, ctx) {
  if (self.name !== '露帕') return;
  if ((self.lupaC6FlameCd || 0) > 0) self.lupaC6FlameCd -= 1;
}

export function lupaSwitchIn({ to, battle }) {
  // 无额外变奏资源；onVariation 处理 5 链
}

registerSwitchHook('露帕', lupaSwitchIn);

export function collectLupaBadges(unit) {
  if (unit.name !== '露帕' || !unit.forte) return [];
  const badges = [];
  const cur = unit.forte.current || 0;
  const max = unit.forte.max || 100;
  const ready = !!unit.forte.ready;
  badges.push({
    key: 'flame',
    cls: ready ? 'burst' : 'field',
    icon: ready ? '✦' : '◈',
    label: ready ? `狼焰 ${cur} · 狼舞就绪` : `狼焰 ${cur}/${max}`,
    tip: `<b>狼焰</b><br>普攻 +10 / 凶噬 +15 / 重击 +20 / 解放回满<br>满 100 → 共鸣技能替换为<b>狼舞·决意·极</b>（atk×580% 热熔，视为共鸣解放伤害）`
  });
  const hunt = (unit.buffs || []).find(b => b.src === SRC_HUNT);
  if (hunt) {
    badges.push({
      key: 'hunt', cls: 'field', icon: '⚑',
      label: `追猎 ${Math.max(0, (hunt.duration || 1) - 1)}回`,
      tip: `<b>追猎</b><br>全队热熔伤害 +10%`
    });
  }
  const glory = (unit.buffs || []).find(b => b.src === SRC_GLORY);
  if (glory) {
    badges.push({
      key: 'glory', cls: 'field', icon: '☀',
      label: `荣光 ${Math.max(0, (glory.duration || 1) - 1)}回`,
      tip: `<b>荣光</b><br>全队攻击无视热熔抗性`
    });
  }
  return badges;
}

export default {
  name: '露帕',
  hasHeavy: true,
  resolveSkill: lupaResolveSkill,
  enterHanbao: lupaEnterHanbao,
  finishSkill: lupaFinishSkill,
  resolveBurstMult: lupaResolveBurstMult,
  normalMult: lupaNormalMult,
  skillMult: lupaSkillMult,
  heavyMult: lupaHeavyMult,
  onBurst: lupaOnBurst,
  onSkill: lupaOnSkill,
  onHeavy: lupaOnHeavy,
  onVariation: lupaOnVariation,
  extraPierce: lupaExtraPierce,
  battleStart: lupaBattleStart,
  turnCleanup: lupaTurnCleanup,
  switchIn: lupaSwitchIn,
  collectBadges: collectLupaBadges
};
