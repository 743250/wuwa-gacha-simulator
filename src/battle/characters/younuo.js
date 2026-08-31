// 尤诺「灵性 / 月相流转 / 满月领域 / 至臻的完满」状态机
//
// ATK 核 · 循环型主C:
//   灵性积累 → 满值入月相流转 + 满月领域 → 至臻的完满终结 → 清空灵性重新积累。
//   月相流转 3 回合:攻击 +20%（1 链 +40%）,技能替换为越限的弦引
//   满月领域:至臻的完满解锁,atk × 400%（6 链 × 2000%）。
//   6 链:至臻完满后重置状态,连发模式开启。
//
// 链数值均在本状态机落地；registry 对应链用占位 effect，禁止 flat atk/allDmg/heavyDmg 常驻双算。

const LINGXING_MAX = 100;
const MOON_DURATION = 3;
const FULL_MOON_DURATION = 3;

const LINGXING_NORMAL = 12;
const LINGXING_NORMAL_MOON = 20;
const LINGXING_SKILL = 25;
const LINGXING_VARIATION = 15;
const LINGXING_BURST = 40;

const NORMAL_MULT = 1.0;
const SKILL_MULT = 1.8;
const BURST_MAIN_MULT = 4.0; // 设计 §4 主 400%（非全局 700）
const BURST_SIDE_MULT = 2.0;
const VARIATION_MULT = 0.8; // 设计 §4 变奏 80%
const ZHEN_WAN_MULT = 4.0;
const ZHEN_WAN_C6_MULT = 20.0;

const MOON_ATK_BONUS = 0.20;
const C1_MOON_ATK_BONUS = 0.40;
const C2_TEAM_ALL_DMG = 0.40;
const C2_DURATION = 2;
const C3_MOON_ALL_DMG = 0.65;
const C4_SHIELD_ATK = 1.6;
const C4_DURATION = 3;

const SRC_MOON = '尤诺月相';
const SRC_C3 = '尤诺3链';
const SRC_C2 = '尤诺2链';
const SRC_C4 = '尤诺4链';

export function younuoLingxing(self) {
  return self?.name === '尤诺' ? (self.younuoLingxing || 0) : 0;
}

export function younuoInMoonFlow(self) {
  return !!(self && self.name === '尤诺' && (self.younuoMoonTurns || 0) > 0);
}

export function younuoInFullMoon(self) {
  return !!(self && self.name === '尤诺' && (self.younuoFullMoonTurns || 0) > 0);
}

function syncForte(self) {
  if (!self.forte) return;
  self.forte.current = self.younuoLingxing || 0;
  self.forte.ready = (self.younuoLingxing || 0) >= LINGXING_MAX;
}

function moonAtkBonus(self) {
  return self.chain >= 1 ? C1_MOON_ATK_BONUS : MOON_ATK_BONUS;
}

function applyMoonBuffs(self, duration) {
  const atkBonus = moonAtkBonus(self);
  self.buffs = (self.buffs || []).filter(b => b.src !== SRC_MOON && b.src !== SRC_C3);
  self.buffs.push({
    type: 'atkUp',
    value: atkBonus,
    duration,
    src: SRC_MOON
  });
  if (self.chain >= 3) {
    self.buffs.push({
      type: 'allDmgUp',
      value: C3_MOON_ALL_DMG,
      duration,
      src: SRC_C3
    });
  }
  return atkBonus;
}

function clearMoonBuffs(self) {
  self.buffs = (self.buffs || []).filter(b => b.src !== SRC_MOON && b.src !== SRC_C3);
}

function openFullMoon(self, battle) {
  if (self.name !== '尤诺') return;
  if ((self.younuoFullMoonTurns || 0) > 0) return;
  self.younuoFullMoonTurns = FULL_MOON_DURATION;
  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `满月领域展开 · 持续 ${FULL_MOON_DURATION} 回合 · 解锁重击·至臻的完满`
  });
}

export function younuoCanHeavy(self, battle) {
  if (self.name !== '尤诺') return null;
  if (!younuoInFullMoon(self)) {
    return { ok: false, err: '需在满月领域中才能施放重击·至臻的完满' };
  }
  if (self.cd.heavy > 0) return { ok: false, err: `至臻的完满冷却中（${self.cd.heavy} 回合）` };
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return { ok: false, err: '没有目标' };
  return { ok: true };
}

export function younuoGainLingxing(self, n, battle) {
  if (self.name !== '尤诺') return;
  const before = self.younuoLingxing || 0;
  const newVal = Math.min(LINGXING_MAX, before + n);
  self.younuoLingxing = newVal;
  syncForte(self);
  if (newVal !== before) {
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: `灵性 +${newVal - before}（${before} → ${newVal}/${LINGXING_MAX}）`
    });
  }
  if (newVal >= LINGXING_MAX) {
    if (!younuoInMoonFlow(self)) {
      younuoEnterMoonFlow(self, battle);
    } else {
      openFullMoon(self, battle);
    }
  }
}

export function younuoEnterMoonFlow(self, battle) {
  if (self.name !== '尤诺') return;
  if (younuoInMoonFlow(self)) return;

  self.younuoMoonTurns = MOON_DURATION;
  const atkBonus = applyMoonBuffs(self, MOON_DURATION);
  const full = (self.younuoLingxing || 0) >= LINGXING_MAX;
  if (full) {
    self.younuoFullMoonTurns = FULL_MOON_DURATION;
  }

  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `月相流转展开 · 持续 ${MOON_DURATION} 回合 · 攻击 +${(atkBonus * 100).toFixed(0)}%` +
      (full ? ` · 满月领域展开（${FULL_MOON_DURATION} 回合）` : '')
  });

  if (self.chain >= 3) {
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: `3 链 · 我痛饮他者的遗忘 · 月相流转中全伤害 +${(C3_MOON_ALL_DMG * 100).toFixed(0)}%`
    });
  }
}

export function younuoExitMoonFlow(self, battle) {
  if (self.name !== '尤诺') return;
  if (!younuoInMoonFlow(self) && !younuoInFullMoon(self)) return;

  self.younuoMoonTurns = 0;
  self.younuoFullMoonTurns = 0;
  clearMoonBuffs(self);

  const before = self.younuoLingxing || 0;
  self.younuoLingxing = 0;
  syncForte(self);

  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `月相流转结束 · 满月领域消散 · 灵性清空（${before} → 0）`
  });
}

export function younuoResolveSkill(self) {
  if (self.name !== '尤诺') return null;
  if (younuoInMoonFlow(self)) {
    return {
      mult: SKILL_MULT,
      dmgType: 'burst',
      label: '越限的弦引',
      isYueXian: true
    };
  }
  return {
    mult: SKILL_MULT,
    dmgType: 'skill',
    label: '告终的喧响',
    isGaoZhong: true
  };
}

export function younuoResolveHeavy(self) {
  if (self.name !== '尤诺') return null;
  if (!younuoInFullMoon(self)) return null;
  const mult = self.chain >= 6 ? ZHEN_WAN_C6_MULT : ZHEN_WAN_MULT;
  return {
    mult,
    dmgType: 'heavy',
    label: '重击·至臻的完满',
    isYounuoZhenWan: true
  };
}

function applyC2TeamBuff(self, battle) {
  if (self.chain < 2 || !battle) return;
  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== SRC_C2);
    t.buffs.push({
      type: 'allDmgUp',
      value: C2_TEAM_ALL_DMG,
      duration: C2_DURATION,
      src: SRC_C2,
      installer: self.idx
    });
  });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `2 链 · 昼或夜且以它为永恒 · 全队全伤害加深 +${(C2_TEAM_ALL_DMG * 100).toFixed(0)}%（${C2_DURATION} 回合）`
  });
}

export function younuoExecuteZhenWan(self, battle) {
  if (self.name !== '尤诺') return;

  if (self.chain >= 4 && battle) {
    const mult = self.younuoC4Shield?.value || C4_SHIELD_ATK;
    const dur = self.younuoC4Shield?.duration || C4_DURATION;
    const amt = Math.round((self.atk || 0) * mult);
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.shield = (t.shield || 0) + amt;
      t.buffs = (t.buffs || []).filter(b => b.src !== SRC_C4);
      t.buffs.push({
        type: 'shieldMark',
        value: amt,
        duration: dur + 1,
        src: SRC_C4,
        installer: self.idx
      });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `4 链 · 任雨季栖息于眼眸 · 全队护盾 ${amt}（攻击 ×${(mult * 100).toFixed(0)}% · ${dur} 回合）`
    });
  }

  if (self.chain >= 6) {
    self.younuoMoonTurns = MOON_DURATION;
    self.younuoFullMoonTurns = FULL_MOON_DURATION;
    self.younuoLingxing = LINGXING_MAX;
    syncForte(self);
    self.cd.skill = 0;
    applyMoonBuffs(self, MOON_DURATION);
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: '6 链 · 我所在即为不变的独一 · 重置状态 · 再次进入月相流转 · 灵性回满 · 技能 CD 重置'
    });
  } else {
    younuoExitMoonFlow(self, battle);
  }
}

export function younuoOnAttack(self, ctx) {
  if (self.name !== '尤诺') return;
  const gain = younuoInMoonFlow(self) ? LINGXING_NORMAL_MOON : LINGXING_NORMAL;
  younuoGainLingxing(self, gain, ctx.battle);
}

export function younuoOnSkill(self, ctx) {
  if (self.name !== '尤诺') return;
  const battle = ctx.battle;
  const wasInMoon = younuoInMoonFlow(self);

  younuoGainLingxing(self, LINGXING_SKILL, battle);

  // 告终的喧响：非月相时技能强制进月相（未必满月，满灵性才会满月）
  if (!wasInMoon && !younuoInMoonFlow(self)) {
    younuoEnterMoonFlow(self, battle);
  }
}

export function younuoOnBurst(self, ctx) {
  if (self.name !== '尤诺') return;
  const battle = ctx.battle;
  const wasInMoon = younuoInMoonFlow(self);

  younuoGainLingxing(self, LINGXING_BURST, battle);

  if (!wasInMoon && !younuoInMoonFlow(self)) {
    younuoEnterMoonFlow(self, battle);
  }

  applyC2TeamBuff(self, battle);
}

export function younuoOnVariation(self, ctx) {
  if (self.name !== '尤诺') return;
  younuoGainLingxing(self, LINGXING_VARIATION, ctx.battle);
  applyC2TeamBuff(self, ctx.battle);
}

export function younuoOnHeavy(self, ctx) {
  if (self.name !== '尤诺') return;
  if (ctx.form?.isYounuoZhenWan) {
    younuoExecuteZhenWan(self, ctx.battle);
  }
}

export function younuoTick(self, battle) {
  if (self.name !== '尤诺') return null;

  if ((self.younuoFullMoonTurns || 0) > 0) {
    self.younuoFullMoonTurns--;
    if (self.younuoFullMoonTurns <= 0) {
      self.younuoFullMoonTurns = 0;
      battle?.log.push({
        type: 'mechanic', src: self.name,
        msg: '满月领域消散'
      });
    }
  }

  if ((self.younuoMoonTurns || 0) > 0) {
    self.younuoMoonTurns--;
    if (self.younuoMoonTurns <= 0) {
      self.younuoMoonTurns = 0;
      self.younuoFullMoonTurns = 0;
      clearMoonBuffs(self);
      battle?.log.push({
        type: 'mechanic', src: self.name,
        msg: '月相流转结束'
      });
    }
  }

  return null;
}

export function younuoTurnCleanup(self, ctx) {
  return younuoTick(self, ctx.battle);
}

export function younuoCollectBadges(self) {
  if (self.name !== '尤诺') return [];
  const out = [];
  const lingxing = self.younuoLingxing || 0;
  const inMoon = younuoInMoonFlow(self);
  const inFull = younuoInFullMoon(self);

  out.push({
    key: `yn-lingxing-${self.name}`,
    cls: 'field',
    label: `灵性 ${lingxing}/${LINGXING_MAX}`,
    tip: '<b>灵性</b><br>尤诺奏回路资源。普攻/技能/变奏/解放积累灵性。满 100 时进入月相流转并展开满月领域。'
  });

  if (inMoon) {
    out.push({
      key: `yn-moon-${self.name}`,
      cls: 'crit',
      label: `月相流转 ${self.younuoMoonTurns}回`,
      dur: self.younuoMoonTurns,
      tip: '<b>月相流转</b><br>尤诺强化状态。攻击力 +20%（1 链 +40%），技能替换为越限的弦引。持续 3 回合。'
    });
  }

  if (inFull) {
    out.push({
      key: `yn-fullmoon-${self.name}`,
      cls: 'burst',
      label: `满月领域 ${self.younuoFullMoonTurns}回`,
      dur: self.younuoFullMoonTurns,
      tip: '<b>满月领域</b><br>灵性满时自动展开。解锁重击·至臻的完满。'
    });
  }

  return out;
}

export function younuoResolveBurstMult(self) {
  if (self.name !== '尤诺') return null;
  return { baseMain: BURST_MAIN_MULT, baseSide: BURST_SIDE_MULT };
}

export function younuoVariationMult(self) {
  if (self.name !== '尤诺') return null;
  return VARIATION_MULT;
}

export function younuoNormalMult(self) {
  if (self.name !== '尤诺') return null;
  return NORMAL_MULT;
}

export function younuoSkillMult(self) {
  if (self.name !== '尤诺') return null;
  return SKILL_MULT;
}

export default {
  name: '尤诺',
  hasHeavy: true,
  normalMult: younuoNormalMult,
  skillMult: younuoSkillMult,
  variationMult: younuoVariationMult,
  resolveBurstMult: younuoResolveBurstMult,
  lingxing: younuoLingxing,
  inMoonFlow: younuoInMoonFlow,
  inFullMoon: younuoInFullMoon,
  canHeavy: younuoCanHeavy,
  resolveSkill: younuoResolveSkill,
  resolveHeavy: younuoResolveHeavy,
  onAttack: younuoOnAttack,
  onSkill: younuoOnSkill,
  onBurst: younuoOnBurst,
  onVariation: younuoOnVariation,
  onHeavy: younuoOnHeavy,
  tick: younuoTick,
  turnCleanup: younuoTurnCleanup,
  collectBadges: younuoCollectBadges,
  gainLingxing: younuoGainLingxing,
  enterMoonFlow: younuoEnterMoonFlow,
  exitMoonFlow: younuoExitMoonFlow,
  executeZhenWan: younuoExecuteZhenWan
};
