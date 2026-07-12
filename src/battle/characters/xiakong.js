// 夏空「音律 / 音律独奏 / 风蚀效应 / 演绎状态」状态机
//
// ATK 核 · 风蚀专辅:
//   夏空的核心价值链是"叠风蚀 → 开音律独 → 解放强化 → 延奏翻倍"。
//   风蚀效应（气动元素通用 debuff）上限 6 层,每层使目标受到的气动伤害 +10%（通用值,全气动角色共享）。
//   音律（FORTE 资源）上限 3 格,普攻第4段/变入场各 +1 格。
//   满 3 音律时普攻替换为重击·四拍重奏（atk × 200%,叠 1 层风蚀,消耗全部音律）。
//   音律独奏：普攻第4段后进入,全队气动伤害加成 +24%（演绎下 +48%）。
//   演绎状态：共鸣解放后持 2 回合,音律独奏效果翻倍。
//
// 资源管理：
//   音律通过 self.forte.current + forte.ready 与 FORTE 系统同步。
//   风蚀效应通过通用 debuff 系统 target.debuffs[{type:'erosion', element:'气动'}] 管理（见 combat/erosion.js）,
//   与卡提希娅共用同一套字段和管线。

import { registerSwitchHook } from '../switchHooks.js';
import { addErosion, getErosionStacks } from '../combat/erosion.js';

// ── 常量 ──
const NOTES_MAX = 3;
const PERFORM_DURATION = 2;
const SOLO_AERO_BONUS = 0.24;          // 音律独奏全队气动 +24%
const SOLO_AERO_BONUS_PERFORM = 0.48;  // 演绎状态下 +48%
const PERFORM_SHIELD_HP_MULT = 1.0;    // 护盾 HP × 100%
const QUAD_MULT = 2.0;                 // 四拍重奏 atk × 200%
const C6_SOLO_DMG_MULT = 2.2;          // 6 链进入独奏 220% 气动

// 各招式倍率（设计文档：夏空是 ATK 核）
const NORMAL_ATK_MULT = 1.0;    // 普攻 atk × 100%
const SKILL_ATK_MULT = 1.5;     // 共鸣技能 atk × 150%
const BURST_MAIN_MULT = 3.5;    // 解放主目标 atk × 350%
const BURST_SIDE_MULT = 1.75;   // 解放副目标 atk × 175%
const VARIATION_ATK_MULT = 0.6; // 变奏 atk × 60%

// ── 状态查询 ──
export function xiakongNotes(self) {
  return self?.name === '夏空' ? (self.forte?.current || 0) : 0;
}

export function xiakongSoloActive(self) {
  return !!(self && self.name === '夏空' && self.xiakongSoloActive);
}

export function xiakongPerforming(self) {
  return !!(self && self.name === '夏空' && (self.xiakongPerformTurns || 0) > 0);
}

export function xiakongGetErosion(target) {
  if (!target) return { stacks: 0, duration: 0 };
  return {
    stacks: getErosionStacks(target),
    duration: 0  // 通用 debuff 由 duration 字段管理，外部读取不再用
  };
}

export function xiakongCanHeavy(self) {
  if (self.name !== '夏空') return null;
  return { ok: false, err: '夏空没有独立重击 · 满音律时普攻自动替换为重击·四拍重奏' };
}

// ── 资源操作 ──

// 获得音律（同步 forte.current 和 forte.ready）
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

// 消耗全部音律（四拍重奏后调用）
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

// 为目标叠加风蚀效应（接入通用 debuff 系统）
export function xiakongAddErosion(target, n, battle) {
  if (!target) return;
  addErosion(target, n, battle, { src: '夏空' });
}

// 获取当前 solo 气动加成（演绎下翻倍）
export function xiakongSoloAeroBonus(self) {
  if (!xiakongSoloActive(self)) return 0;
  return xiakongPerforming(self) ? SOLO_AERO_BONUS_PERFORM : SOLO_AERO_BONUS;
}

// ── resolveNormal（满 3 音律时普攻替换为四拍重奏） ──
export function xiakongResolveNormal(self, battle) {
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
// ── resolveHeavy（满3音律时返回四拍重奏，供doHeavy路径使用） ──

// ── onAttack hook（普攻/四拍重奏命中后调） ──
// 音律已满 → 四拍重奏路径（消耗音律+叠风蚀）
// 音律未满 → 常规普攻路径（获音律+叠风蚀+进入独奏）
export function xiakongOnAttack(self, ctx) {
  if (self.name !== '夏空') return;
  const battle = ctx.battle;
  const target = ctx.target;

  // 音律已满 → 此次攻击为四拍重奏路径
  if ((self.forte?.current || 0) >= NOTES_MAX) {
    xiakongConsumeNotes(self, battle);
    if (target?.alive) xiakongAddErosion(target, 1, battle);
    return;
  }

  // 常规普攻路径
  // 1. 获 1 格音律
  xiakongGainNote(self, 1, battle);

  // 2. 3 链：额外 +1 音律
  if (self.chain >= 3) xiakongGainNote(self, 1, battle);

  // 3. 为目标叠 1 层风蚀效应
  if (target?.alive) xiakongAddErosion(target, 1, battle);

  // 4. 进入音律独奏状态
  if (!self.xiakongSoloActive) {
    self.xiakongSoloActive = true;
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `音律独奏 · 全队气动伤害加成 +${(xiakongSoloAeroBonus(self) * 100).toFixed(0)}%`
    });

    // 1 链：普攻攻击 +35%（2 回合）
    if (self.chain >= 1) {
      self.buffs = (self.buffs || []).filter(b => b.src !== '夏空1链');
      self.buffs.push({ type: 'atkUp', value: 0.35, duration: 2, src: '夏空1链' });
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '1 链 · 故风的吟游序曲 · 攻击力 +35%（2 回合）'
      });
    }

    // 6 链：入音律独奏时造成 220% 气动 AOE
    if (self.chain >= 6 && !self._xiakongSoloTriggeredThisTurn && ctx.helpers) {
      self._xiakongSoloTriggeredThisTurn = true;
      const enemies = battle.enemies.filter(e => e.alive);
      enemies.forEach(e => {
        const { dmg } = ctx.helpers.calcDamage(self, e, C6_SOLO_DMG_MULT, 'burst');
        const real = ctx.helpers.dealDamage(e, dmg);
        battle.log.push({
          type: 'mechanic', src: self.name,
          msg: `6 链 · 终未终 · 音律独奏引动 ${real} 气动伤害（对 ${e.name}）`
        });
      });
    }
  }
}

// ── onSkill hook（共鸣技能叠风蚀） ──
export function xiakongOnSkill(self, ctx) {
  const battle = ctx.battle;
  xiakongGainNote(self, 1, battle);
  if (self.name !== '夏空') return;
  const target = ctx.target;
  if (target?.alive) xiakongAddErosion(target, 1, ctx.battle);
}

// ── onBurst hook（共鸣解放：进入演绎状态+护盾） ──
export function xiakongOnBurst(self, ctx) {
  if (self.name !== '夏空') return;
  const battle = ctx.battle;
  self.xiakongPerformTurns = PERFORM_DURATION;

  // 护盾（HP × 100%，不叠加）
  const shieldAmt = Math.round(self.hpMax * PERFORM_SHIELD_HP_MULT);
  self.shield = (self.shield || 0) + shieldAmt;

  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `演绎状态展开 · 持续 ${PERFORM_DURATION} 回合 · 音律独奏效果翻倍至 +48% · 获得护盾 ${shieldAmt}`
  });

  // 2 链：演绎期间全队气动 +40%
  if (self.chain >= 2) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '夏空2链');
      t.buffs.push({ type: 'elemAeroUp', value: 0.40, duration: PERFORM_DURATION, src: '夏空2链', installer: self.idx });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '2 链 · 四季的连奏之音 · 全队气动伤害加成 +40%（' + PERFORM_DURATION + ' 回合）'
    });
  }

  // 5 链：全队减伤 -30%
  if (self.chain >= 5) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '夏空5链');
      t.buffs.push({ type: 'allDmgDown', value: 0.30, duration: PERFORM_DURATION, src: '夏空5链', installer: self.idx });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '5 链 · 献予长夏的永恒叙诗 · 全队受到伤害 -30%（' + PERFORM_DURATION + ' 回合）'
    });
  }
}

// ── onVariation hook（变奏入场：叠风蚀+获音律） ──
export function xiakongOnVariation(self, ctx) {
  if (self.name !== '夏空') return;
  const battle = ctx.battle;
  const target = ctx.variationTarget;

  // 获 1 格音律
  xiakongGainNote(self, 1, battle);

  // 叠 1 层风蚀
  if (target?.alive) xiakongAddErosion(target, 1, battle);
}

// ── tick / turnCleanup（回合结束时：演绎递减 + 音律独奏退出） ──
export function xiakongTick(self, battle) {
  if (self.name !== '夏空') return null;

  // 音律独奏在当前回合结束时退出
  if (self.xiakongSoloActive) {
    self.xiakongSoloActive = false;
    // 不清空日志
  }

  // 演绎状态剩余回合递减
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

// ── switchIn hook（变奏入场：1 音律+叠风蚀，由 onVariation 处理） ──
export function xiakongSwitchIn({ to, battle }) {
  if (to?.name !== '夏空') return;
  // 变奏入场后，放行到 onVariation hook（doSwitch 末尾触发）
}

registerSwitchHook('夏空', xiakongSwitchIn);

// ── 四拍重奏后处理（消音律+叠风蚀，在 doAttack 中由 resolveNormal 路径调用） ──
export function xiakongFinishQuad(self, battle, target) {
  if (self.name !== '夏空') return;
  xiakongConsumeNotes(self, battle);
  if (target?.alive) xiakongAddErosion(target, 1, battle);
}

// ── onHeavy hook（四拍重奏命中时消费音律+叠风蚀） ──
export function xiakongOnHeavy(self, ctx) {
  if (self.name !== '夏空') return;
  const battle = ctx.battle;
  const target = ctx.target;
  // 若由 resolveNormal 替换触发,ctx.form 表四拍重奏
  if (ctx.form?.isXiakongQuad) {
    xiakongFinishQuad(self, battle, target);
  }
}

// ── 徽章收集 ──
export function xiakongCollectBadges(self) {
  if (self.name !== '夏空') return [];
  const out = [];
  const notes = self.forte?.current || 0;

  // 音律
  out.push({
    key: `xk-notes-${self.name}`,
    cls: 'field',
    label: `音律 ${notes}/${NOTES_MAX}`,
    tip: '<b>音律</b><br>夏空专属 FORTE 资源。普攻/变奏获得 1 格音律。满 3 格时重击替换为<b class="term-lightheavy">四拍重奏</b>。'
  });

  // 音律独奏
  if (self.xiakongSoloActive) {
    out.push({
      key: `xk-solo-${self.name}`,
      cls: 'crit',
      label: '音律独奏',
      tip: '<b>音律独奏</b><br>全队气动伤害加成 +24%（演绎下 +48%）。'
    });
  }

  // 演绎状态
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
  getErosion: xiakongGetErosion,
  canHeavy: xiakongCanHeavy,
  resolveNormal: xiakongResolveNormal,
  resolveHeavy: xiakongResolveHeavy,
  onAttack: xiakongOnAttack,
  onSkill: xiakongOnSkill,
  onBurst: xiakongOnBurst,
  onVariation: xiakongOnVariation,
  onHeavy: xiakongOnHeavy,
  tick: xiakongTick,
  turnCleanup: xiakongTurnCleanup,
  switchIn: xiakongSwitchIn,
  collectBadges: xiakongCollectBadges,
  finishQuad: xiakongFinishQuad,
  consumeNotes: xiakongConsumeNotes,
  gainNote: xiakongGainNote,
  addErosion: xiakongAddErosion,
  soloAeroBonus: xiakongSoloAeroBonus
};
