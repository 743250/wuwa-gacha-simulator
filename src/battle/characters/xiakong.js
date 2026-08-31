// 夏空「音律 / 音律独奏 / 风蚀效应 / 演绎状态」状态机
//
// ATK 核 · 风蚀专辅:
//   叠风蚀 → 开音律独奏 → 解放演绎 → 切主C。
//   音律上限 3；满时普攻替换为四拍重奏（atk×200% heavy）。
//   音律独奏：全队气动 +24%（演绎下 +48%），挂 elemAeroUp 进伤害管线。
//   链 1/2/4/6 状态机落地；registry 对应项占位防双算。

import { addErosion } from '../combat/erosion.js';

const NOTES_MAX = 3;
const PERFORM_DURATION = 2;
const SOLO_AERO_BONUS = 0.24;
const SOLO_AERO_BONUS_PERFORM = 0.48;
const PERFORM_SHIELD_HP_MULT = 1.0;
const QUAD_MULT = 2.0;
const C6_SOLO_DMG_MULT = 2.2;
const SKILL_MULT = 1.5;
// Phase 3 · encore 歌者的三重华彩 Lv10 ≈1100%
const BURST_MAIN_MULT = 11.0;
const BURST_SIDE_MULT = 5.5;
const VARIATION_MULT = 1.9;
const C1_ATK = 0.35;
const C1_DURATION = 2;
const C2_AERO = 0.40;
const C4_PIERCE = 0.45;
const C5_DMG_DOWN = 0.30;

const SRC_SOLO = '夏空独奏';
const SRC_C1 = '夏空1链';
const SRC_C2 = '夏空2链';
const SRC_C5 = '夏空5链';

export function xiakongNotes(self) {
  return self?.name === '夏空' ? (self.forte?.current || 0) : 0;
}

export function xiakongSoloActive(self) {
  return !!(self && self.name === '夏空' && self.xiakongSoloActive);
}

export function xiakongPerforming(self) {
  return !!(self && self.name === '夏空' && (self.xiakongPerformTurns || 0) > 0);
}

export function xiakongCanHeavy(self) {
  if (self.name !== '夏空') return null;
  return { ok: false, err: '夏空没有独立重击 · 满音律时普攻自动替换为重击·四拍重奏' };
}

export function xiakongGainNote(self, n, battle) {
  if (self.name !== '夏空') return;
  const before = self.forte?.current || 0;
  const newVal = Math.min(NOTES_MAX, before + n);
  if (self.forte) {
    self.forte.current = newVal;
    self.forte.ready = newVal >= NOTES_MAX;
  }
  if (newVal !== before) {
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: `音律 +${newVal - before}（${before} → ${newVal}/${NOTES_MAX}）`
    });
  }
}

export function xiakongConsumeNotes(self, battle) {
  if (self.name !== '夏空') return;
  const before = self.forte?.current || 0;
  if (self.forte) {
    self.forte.current = 0;
    self.forte.ready = false;
  }
  if (before > 0) {
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: `消耗全部音律（${before} → 0）`
    });
  }
}

export function xiakongAddErosion(target, n, battle) {
  if (!target) return;
  addErosion(target, n, battle, { src: '夏空' });
}

export function xiakongSoloAeroBonus(self) {
  if (!xiakongSoloActive(self)) return 0;
  return xiakongPerforming(self) ? SOLO_AERO_BONUS_PERFORM : SOLO_AERO_BONUS;
}

function applySoloAeroAura(self, battle) {
  if (!battle) return;
  const val = xiakongSoloAeroBonus(self);
  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== SRC_SOLO);
    if (val > 0) {
      t.buffs.push({
        type: 'elemAeroUp',
        value: val,
        duration: 99,
        src: SRC_SOLO,
        installer: self.idx
      });
    }
  });
}

function clearSoloAeroAura(battle) {
  if (!battle) return;
  battle.team.forEach(t => {
    t.buffs = (t.buffs || []).filter(b => b.src !== SRC_SOLO);
  });
}

export function xiakongResolveNormal(self) {
  if (self.name !== '夏空') return null;
  if ((self.forte?.current || 0) < NOTES_MAX) return null;
  return {
    mult: QUAD_MULT,
    dmgType: 'heavy',
    label: '重击·四拍重奏',
    isXiakongQuad: true
  };
}

export function xiakongResolveHeavy(self, battle) {
  return xiakongResolveNormal(self, battle);
}

export function xiakongResolveSkill(self) {
  if (self.name !== '夏空') return null;
  return {
    mult: SKILL_MULT,
    dmgType: 'skill',
    label: '谐律速奏'
  };
}

export function xiakongResolveBurstMult(self) {
  if (self.name !== '夏空') return null;
  return { baseMain: BURST_MAIN_MULT, baseSide: BURST_SIDE_MULT };
}

export function xiakongVariationMult(self) {
  return self.name === '夏空' ? VARIATION_MULT : null;
}

// 4 链：仅四拍/解放吃穿透
export function xiakongExtraPierce(self, dmgType) {
  if (self.name !== '夏空' || self.chain < 4) return 0;
  if (dmgType === 'heavy' || dmgType === 'burst') return C4_PIERCE;
  return 0;
}

export function xiakongOnAttack(self, ctx) {
  if (self.name !== '夏空') return;
  const battle = ctx.battle;
  const target = ctx.target;

  // 四拍重奏：resolveNormal 已替换普攻；此处消费音律+叠风蚀
  if (ctx.form?.isXiakongQuad || (self.forte?.current || 0) >= NOTES_MAX) {
    // 若 resolveNormal 已结算伤害，notes 仍满直至本 hook
    if ((self.forte?.current || 0) >= NOTES_MAX) {
      xiakongConsumeNotes(self, battle);
      if (target?.alive) xiakongAddErosion(target, 1, battle);
    }
    return;
  }

  xiakongGainNote(self, 1, battle);
  if (self.chain >= 3) xiakongGainNote(self, 1, battle);
  if (target?.alive) xiakongAddErosion(target, 1, battle);

  if (!self.xiakongSoloActive) {
    self.xiakongSoloActive = true;
    applySoloAeroAura(self, battle);
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `音律独奏 · 全队气动伤害加成 +${(xiakongSoloAeroBonus(self) * 100).toFixed(0)}%`
    });

    if (self.chain >= 1) {
      self.buffs = (self.buffs || []).filter(b => b.src !== SRC_C1);
      self.buffs.push({ type: 'atkUp', value: C1_ATK, duration: C1_DURATION, src: SRC_C1 });
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: `1 链 · 故风的吟游序曲 · 攻击力 +${(C1_ATK * 100).toFixed(0)}%（${C1_DURATION} 回合）`
      });
    }

    if (self.chain >= 6 && !self._xiakongSoloTriggeredThisTurn && ctx.helpers) {
      self._xiakongSoloTriggeredThisTurn = true;
      const enemies = battle.enemies.filter(e => e.alive);
      enemies.forEach(e => {
        const { dmg } = ctx.helpers.calcDamage(self, e, C6_SOLO_DMG_MULT, 'burst');
        const real = ctx.helpers.dealDamage(e, dmg);
        battle.log.push({
          type: 'mechanic', src: self.name,
          msg: `6 链 · 终曲未终 · 音律独奏引动 ${real} 气动伤害（对 ${e.name}）`
        });
      });
    }
  }
}

export function xiakongOnSkill(self, ctx) {
  if (self.name !== '夏空') return;
  const target = ctx.target;
  // 设计：技能只叠风蚀，不加音律
  if (target?.alive) xiakongAddErosion(target, 1, ctx.battle);
}

export function xiakongOnBurst(self, ctx) {
  if (self.name !== '夏空') return;
  const battle = ctx.battle;
  self.xiakongPerformTurns = PERFORM_DURATION;

  const shieldAmt = Math.round(self.hpMax * PERFORM_SHIELD_HP_MULT);
  self.shield = (self.shield || 0) + shieldAmt;

  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `演绎状态展开 · 持续 ${PERFORM_DURATION} 回合 · 音律独奏效果翻倍至 +48% · 获得护盾 ${shieldAmt}`
  });

  // 若已在独奏中，刷新气动光环为演绎倍率
  if (self.xiakongSoloActive) applySoloAeroAura(self, battle);

  if (self.chain >= 2) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== SRC_C2);
      t.buffs.push({
        type: 'elemAeroUp',
        value: C2_AERO,
        duration: PERFORM_DURATION,
        src: SRC_C2,
        installer: self.idx
      });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `2 链 · 四季的连奏之音 · 全队气动伤害加成 +${(C2_AERO * 100).toFixed(0)}%（${PERFORM_DURATION} 回合）`
    });
  }

  if (self.chain >= 5) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== SRC_C5);
      t.buffs.push({
        type: 'allDmgDown',
        value: C5_DMG_DOWN,
        duration: PERFORM_DURATION,
        src: SRC_C5,
        installer: self.idx
      });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `5 链 · 献予长夏的永恒叙诗 · 全队受到伤害 -${(C5_DMG_DOWN * 100).toFixed(0)}%（${PERFORM_DURATION} 回合）`
    });
  }
}

export function xiakongOnVariation(self, ctx) {
  if (self.name !== '夏空') return;
  const battle = ctx.battle;
  const target = ctx.variationTarget;
  xiakongGainNote(self, 1, battle);
  if (target?.alive) xiakongAddErosion(target, 1, battle);
}

export function xiakongTick(self, battle) {
  if (self.name !== '夏空') return null;

  self._xiakongSoloTriggeredThisTurn = false;

  if (self.xiakongSoloActive) {
    self.xiakongSoloActive = false;
    clearSoloAeroAura(battle);
  }

  if ((self.xiakongPerformTurns || 0) > 0) {
    self.xiakongPerformTurns--;
    if (self.xiakongPerformTurns <= 0) {
      self.xiakongPerformTurns = 0;
      battle?.log.push({
        type: 'mechanic', src: self.name,
        msg: '演绎状态结束'
      });
    }
  }

  return null;
}

export function xiakongTurnCleanup(self, ctx) {
  return xiakongTick(self, ctx.battle);
}

export function xiakongFinishQuad(self, battle, target) {
  if (self.name !== '夏空') return;
  xiakongConsumeNotes(self, battle);
  if (target?.alive) xiakongAddErosion(target, 1, battle);
}

export function xiakongOnHeavy(self, ctx) {
  if (self.name !== '夏空') return;
  if (ctx.form?.isXiakongQuad) {
    xiakongFinishQuad(self, ctx.battle, ctx.target);
  }
}

export function xiakongCollectBadges(self) {
  if (self.name !== '夏空') return [];
  const out = [];
  const notes = self.forte?.current || 0;

  out.push({
    key: `xk-notes-${self.name}`,
    cls: 'field',
    label: `音律 ${notes}/${NOTES_MAX}`,
    tip: '<b>音律</b><br>夏空专属 FORTE。普攻/变奏 +1。满 3 格时普攻替换为四拍重奏。'
  });

  if (self.xiakongSoloActive) {
    out.push({
      key: `xk-solo-${self.name}`,
      cls: 'crit',
      label: '音律独奏',
      tip: '<b>音律独奏</b><br>全队气动伤害加成 +24%（演绎下 +48%）。'
    });
  }

  if ((self.xiakongPerformTurns || 0) > 0) {
    out.push({
      key: `xk-perform-${self.name}`,
      cls: 'burst',
      label: `演绎 ${self.xiakongPerformTurns}回`,
      dur: self.xiakongPerformTurns,
      tip: '<b>演绎状态</b><br>共鸣解放后进入。音律独奏效果翻倍，夏空获得护盾。切人不中断。'
    });
  }

  return out;
}

export default {
  name: '夏空',
  hasHeavy: false,
  notes: xiakongNotes,
  soloActive: xiakongSoloActive,
  performing: xiakongPerforming,
  canHeavy: xiakongCanHeavy,
  resolveNormal: xiakongResolveNormal,
  resolveHeavy: xiakongResolveHeavy,
  resolveSkill: xiakongResolveSkill,
  resolveBurstMult: xiakongResolveBurstMult,
  variationMult: xiakongVariationMult,
  extraPierce: xiakongExtraPierce,
  onAttack: xiakongOnAttack,
  onSkill: xiakongOnSkill,
  onBurst: xiakongOnBurst,
  onVariation: xiakongOnVariation,
  onHeavy: xiakongOnHeavy,
  tick: xiakongTick,
  turnCleanup: xiakongTurnCleanup,
  collectBadges: xiakongCollectBadges,
  finishQuad: xiakongFinishQuad,
  consumeNotes: xiakongConsumeNotes,
  gainNote: xiakongGainNote,
  addErosion: xiakongAddErosion,
  soloAeroBonus: xiakongSoloAeroBonus
};
