// 尤诺「灵性 / 月相流转 / 满月领域 / 至臻的完满」状态机
//
// ATK 核 · 循环型主C:
//   灵性积累 → 满值入月相流转 → 满月领域展开 → 至臻的完满终结 → 清空灵性重新积累。
//   月相流转 3 回合:攻击 +20%（1 链 +40%）,技能替换为越限的弦引
//   满月领域:至臻的完满解锁,atk × 400%（6 链 × 2000%）。
//   6 链:至臻完满后重置状态,连发模式开启。
//
// 资源管理:
//   灵通过 self.younuoLingxing 管理,同步 forte.current。
//   月相流转回合数通过 self.younuoMoonTurns 管理。
//   满月领域回合数通过 self.younuoFullMoonTurns 管理。

// ── 量 ──
const LINGXING_MAX = 100;
const MOON_DURATION = 3;
const FULL_MOON_DURATION = 3;

// 灵性获取
const LINGXING_NORMAL = 12;     // 普攻 +12
const LINGXING_NORMAL_MOON = 20; // 月相流转中普攻 +20
const LINGXING_SKILL = 25;      // 共鸣技能 +25
const LINGXING_VARIATION = 15;  // 变奏 +15
const LINGXING_BURST = 40;      // 解放 +40

// 招式倍率
const NORMAL_MULT = 1.0;        // 普攻 atk × 100%
const SKILL_MULT = 1.8;         // 技能 atk × 180%
const BURST_MAIN_MULT = 4.0;    // 解放主 atk × 400%
const BURST_SIDE_MULT = 2.0;    // 解放副 atk × 200%
const VARIATION_MULT = 0.8;     // 变奏 atk × 80%
const ZHEN_WAN_MULT = 4.0;      // 至臻的完满 atk × 400%
const ZHEN_WAN_C6_MULT = 20.0;  // 6 链至臻的完满 atk × 2000%

// 月相流转攻击加成
const MOON_ATK_BONUS = 0.20;    // +20% atk
const C1_MOON_ATK_BONUS = 0.40; // 1 链 +40% atk（替代基础 20%）

// ── 状态查询 ──
export function younuoLingxing(self) {
  return self?.name === '尤诺' ? (self.younuoLingxing || 0) : 0;
}

export function younuoInMoonFlow(self) {
  return !!(self && self.name === '尤诺' && (self.younuoMoonTurns || 0) > 0);
}

export function younuoInFullMoon(self) {
  return !!(self && self.name === '尤诺' && (self.younuoFullMoonTurns || 0) > 0);
}

// ── canHeavy（仅在满月领域中可用） ──
export function younuoCanHeavy(self, battle) {
  if (self.name !== '尤诺') return null;
  if (!younuoInFullMoon(self)) {
    return { ok: false, err: '需在满月领域中才能施放重击·至臻的完满' };
  }
  // 冷却检查
  if (self.cd.heavy > 0) return { ok: false, err: `至臻的完满冷却中（${self.cd.heavy} 回合）` };
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return { ok: false, err: '没有目标' };
  return { ok: true };
}

// ── 资源操作 ──

// 获得灵性（同步 forte.current）
export function younuoGainLingxing(self, n, battle) {
  if (self.name !== '尤诺') return;
  const before = self.younuoLingxing || 0;
  const newVal = Math.min(LINGXING_MAX, before + n);
  self.younuoLingxing = newVal;
  if (self.forte) {
    self.forte.current = newVal;
    self.forte.ready = newVal >= LINGXING_MAX;
  }
  if (newVal !== before) {
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: `灵性 +${newVal - before}（${before} → ${newVal}/${LINGXING_MAX}）`
    });
  }
  // 灵性满 100 时自动进入月相流转
  if (newVal >= LINGXING_MAX && !younuoInMoonFlow(self)) {
    younuoEnterMoonFlow(self, battle);
  }
}

// 进入月相流转状态
export function younuoEnterMoonFlow(self, battle) {
  if (self.name !== '尤诺') return;
  if (younuoInMoonFlow(self)) return; // 已在月相流转中

  self.younuoMoonTurns = MOON_DURATION;
  // 灵性满时进入月相流转 → 自动展开满月领域
  if ((self.younuoLingxing || 0) >= LINGXING_MAX) {
    self.younuoFullMoonTurns = FULL_MOON_DURATION;
  }

  // 应用月相流转攻加成
  const atkBonus = self.chain >= 1 ? C1_MOON_ATK_BONUS : MOON_ATK_BONUS;
  self.buffs = (self.buffs || []).filter(b => b.src !== '尤诺月相');
  self.buffs.push({
    type: 'atkUp',
    value: atkBonus,
    duration: MOON_DURATION,
    src: '尤诺月相'
  });

  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `月相流转展开 · 持续 ${MOON_DURATION} 回合 · 攻击 +${(atkBonus * 100).toFixed(0)}%` +
      (self.younuoFullMoonTurns ? ` · 满月领域展开（${FULL_MOON_DURATION} 回合）` : '')
  });

  // 3 链：月相流转中全伤害加深 +35%
  if (self.chain >= 3) {
    self.buffs.push({
      type: 'allDmgUp',
      value: 0.35,
      duration: MOON_DURATION,
      src: '尤诺3'
    });
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: '3 链 · 我痛饮他者的遗忘 · 相流转中全伤害 +35%'
    });
  }
}

// 退出月相流转状态
export function younuoExitMoonFlow(self, battle) {
  if (self.name !== '尤诺') return;
  if (!younuoInMoonFlow(self) && !younuoInFullMoon(self)) return;

  self.younuoMoonTurns = 0;
  self.younuoFullMoonTurns = 0;

  // 移除月相流转 buff
  self.buffs = (self.buffs || []).filter(b =>
    b.src !== '尤诺月相' && b.src !== '尤诺3链'
  );

  // 清空灵性
  const before = self.younuoLingxing || 0;
  self.younuoLingxing = 0;
  if (self.forte) {
    self.forte.current = 0;
    self.forte.ready = false;
  }

  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `月相流转结束 · 满月领域消散 · 灵性清空（${before} → 0）`
  });
}

// ── resolveHeavy（满月领域中返回至臻的完满） ──
export function younuoResolveHeavy(self, battle) {
  if (self.name !== '尤诺') return null;
  if (!younuoInFullMoon(self)) return null;
  const mult = self.chain >= 6 ? ZHEN_WAN_C6_MULT : ZHEN_WAN_MULT;
  return {
    mult,
    dmgType: 'heavy',
    label: '击·至臻的完满',
    isYounuoZhenWan: true
  };
}

// 至臻的完满结算（战后：退出月相+清空灵性; 6 链：重置状态
export function younuoExecuteZhenWan(self, battle) {
  if (self.name !== '尤诺') return;

  // 4 链：全队攻击 +10%（2 回合）
  if (self.chain >= 4) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '尤诺4链');
      t.buffs.push({ type: 'atkUp', value: 0.10, duration: 2, src: '尤诺4链' });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '4 链 · 任雨季栖息于眼眸 · 全队攻击 +10%（2 回合）'
    });
  }

  if (self.chain >= 6) {
    // 6 链：重置状态（连发模式）
    self.younuoMoonTurns = MOON_DURATION;
    self.younuoFullMoonTurns = FULL_MOON_DURATION;
    self.younuoLingxing = LINGXING_MAX;
    if (self.forte) {
      self.forte.current = LINGXING_MAX;
      self.forte.ready = true;
    }
    // 重置越限的弦引 CD（简化为技能 CD 重置）
    self.cd.skill = 0;

    // 重新应用月相流转 buff
    const atkBonus = self.chain >= 1 ? C1_MOON_ATK_BONUS : MOON_ATK_BONUS;
    self.buffs = (self.buffs || []).filter(b => b.src !== '尤诺月相' && b.src !== '尤诺3链');
    self.buffs.push({
      type: 'atkUp',
      value: atkBonus,
      duration: MOON_DURATION,
      src: '尤诺月相'
    });
    if (self.chain >= 3) {
      self.buffs.push({
        type: 'allDmgUp',
        value: 0.35,
        duration: MOON_DURATION,
        src: '尤诺3链'
      });
    }

    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '6 链 · 我所在即为不变的独一 · 重置状态 · 再次进入月相流转 · 灵性回满 · CD 重置'
    });
  } else {
    // 标准退出
    younuoExitMoonFlow(self, battle);
  }
}

// ── onAttack hook（普攻积累灵性） ──
export function younuoOnAttack(self, ctx) {
  if (self.name !== '尤诺') return;
  const battle = ctx.battle;
  const gain = younuoInMoonFlow(self) ? LINGXING_NORMAL_MOON : LINGXING_NORMAL;
  younuoGainLingxing(self, gain, battle);
}

// ── onSkill hook（技能积累灵性） ──
export function younuoOnSkill(self, ctx) {
  if (self.name !== '尤诺') return;
  const battle = ctx.battle;

  // 不在月相流转中且灵性未满：告终的喧响 → 入月相流转
  if (!younuoInMoonFlow(self) && (self.younuoLingxing || 0) < LINGXING_MAX) {
    younuoGainLingxing(self, LINGXING_SKILL, battle);
    if (!younuoInMoonFlow(self)) {
      // 灵性未满 100，不触发自动进入；手动标记月相流转
      self.younuoMoonTurns = MOON_DURATION;
      const atkBonus = self.chain >= 1 ? C1_MOON_ATK_BONUS : MOON_ATK_BONUS;
      self.buffs = (self.buffs || []).filter(b => b.src !== '尤诺月相' && b.src !== '尤诺3链');
      self.buffs.push({
        type: 'atkUp',
        value: atkBonus,
        duration: MOON_DURATION,
        src: '尤诺月相'
      });
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: `告终的喧响 · 进入月相流转 · 持续 ${MOON_DURATION} 回合 · 攻击 +${(atkBonus * 100).toFixed(0)}%`
      });
      if (self.chain >= 3) {
        self.buffs.push({
          type: 'allDmgUp',
          value: 0.35,
          duration: MOON_DURATION,
          src: '尤诺3链'
        });
        battle.log.push({
          type: 'mechanic', src: self.name,
          msg: '3 链 · 我痛饮他者的遗忘 · 月流转中全伤害 +35%'
        });
      }
    }
  } else {
    // 月相流转中：越限的弦引
    younuoGainLingxing(self, LINGXING_SKILL, battle);
  }
}

// ── onBurst hook（共鸣解救：进入月相流转 + 积灵性） ──
export function younuoOnBurst(self, ctx) {
  if (self.name !== '尤诺') return;
  const battle = ctx.battle;

  // 积累灵性
  younuoGainLingxing(self, LINGXING_BURST, battle);

  // 如果尚未在月相流转中，手动进入
  if (!younuoInMoonFlow(self)) {
    self.younuoMoonTurns = MOON_DURATION;
    // 灵性达满则展开满月领域
    if ((self.younuoLingxing || 0) >= LINGXING_MAX) {
      self.younuoFullMoonTurns = FULL_MOON_DURATION;
    }
    const atkBonus = self.chain >= 1 ? C1_MOON_ATK_BONUS : MOON_ATK_BONUS;
    self.buffs = (self.buffs || []).filter(b => b.src !== '尤诺月相' && b.src !== '尤诺3链');
    self.buffs.push({
      type: 'atkUp',
      value: atkBonus,
      duration: MOON_DURATION,
      src: '尤诺月相'
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `共鸣解放 · 进入月相流转 · 持续 ${MOON_DURATION} 回合` +
        (self.younuoFullMoonTurns ? ` · 满月领域展开（${FULL_MOON_DURATION} 回合）` : '')
    });
    if (self.chain >= 3) {
      self.buffs.push({
        type: 'allDmgUp',
        value: 0.35,
        duration: MOON_DURATION,
        src: '尤诺3链'
      });
    }
  }

  // 2 链：全队全伤害加深 +20%（2 回合
  if (self.chain >= 2) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '尤诺2链');
      t.buffs.push({ type: 'allDmgUp', value: 0.20, duration: 2, src: '尤诺2链' });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '2 链 · 昼或夜且以它为永恒 · 全队全伤害加深 +20%（2 回合）'
    });
  }
}

// ── onVariation hook（变奏入场积灵性） ──
export function younuoOnVariation(self, ctx) {
  if (self.name !== '尤诺') return;
  younuoGainLingxing(self, LINGXING_VARIATION, ctx.battle);

  // 2 链：变奏时全队全伤害加深 +20%
  if (self.chain >= 2 && ctx.battle) {
    ctx.battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '尤诺2链');
      t.buffs.push({ type: 'allDmgUp', value: 0.20, duration: 2, src: '尤诺2链' });
    });
    ctx.battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '2 链 · 昼或夜且以它为永恒 · 全队全伤害加深 +20%（2 回合）'
    });
  }
}

// ── onHeavy hook（至臻完满后结算） ──
export function younuoOnHeavy(self, ctx) {
  if (self.name !== '尤诺') return;
  if (ctx.form?.isYounuoZhenWan) {
    younuoExecuteZhenWan(self, ctx.battle);
  }
}

// ── tick / turnCleanup（回合结束时：月相流转/满月领域衰减） ──
export function younuoTick(self, battle) {
  if (self.name !== '尤诺') return null;

  let changed = false;

  // 满月领域衰减
  if ((self.younuoFullMoonTurns || 0) > 0) {
    self.younuoFullMoonTurns--;
    if (self.younuoFullMoonTurns <= 0) {
      self.younuoFullMoonTurns = 0;
      changed = true;
      battle?.log.push({
        type: 'mechanic', src: self.name,
        msg: '满月领域消散'
      });
    }
  }

  // 月相流转衰减
  if ((self.younuoMoonTurns || 0) > 0) {
    self.younuoMoonTurns--;
    if (self.younuoMoonTurns <= 0) {
      self.younuoMoonTurns = 0;
      // 月相流转结束时也结束满月领域
      self.younuoFullMoonTurns = 0;
      // 移除 buff
      self.buffs = (self.buffs || []).filter(b =>
        b.src !== '尤诺月相' && b.src !== '尤诺3链'
      );
      battle?.log.push({
        type: 'mechanic', src: self.name,
        msg: '月相流转结束'
      });
      changed = true;
    }
  }

  if (changed) {
    // 月相流转结束时不清空灵性
  }

  return null;
}

export function younuoTurnCleanup(self, ctx) {
  return younuoTick(self, ctx.battle);
}

// ── 徽章收集 ──
export function younuoCollectBadges(self) {
  if (self.name !== '尤诺') return [];
  const out = [];
  const lingxing = self.younuoLingxing || 0;
  const inMoon = younuoInMoonFlow(self);
  const inFull = younuoInFullMoon(self);

  // 灵性
  out.push({
    key: `yn-lingxing-${self.name}`,
    cls: 'field',
    label: `灵性 ${lingxing}/${LINGXING_MAX}`,
    tip: '<b>灵性</b><br>尤诺奏回路资源。普攻/技能/变奏/放积累灵性。满 100 时进入月相流转状态。'
  });

  // 月相流转
  if (inMoon) {
    out.push({
      key: `yn-moon-${self.name}`,
      cls: 'crit',
      label: `月相流转 ${self.younuoMoonTurns}回`,
      dur: self.younuoMoonTurns,
      tip: '<b>月相流转</b><br>尤诺强化状态。攻击力 +20%（1 链 +40%），解锁至臻的完满。持续 3 回合。'
    });
  }

  // 满月领域
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

export default {
  name: '尤诺',
  hasHeavy: true,
  lingxing: younuoLingxing,
  inMoonFlow: younuoInMoonFlow,
  inFullMoon: younuoInFullMoon,
  canHeavy: younuoCanHeavy,
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
