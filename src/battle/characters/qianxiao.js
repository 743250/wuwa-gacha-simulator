// 千「虚无绞痕·电锯模式 / 锯环残响 / 锯环疾攻·终结 / 万缕·汇终」状态机
//
// 设计思路（HP 核 · 湮灭长刃主C · 形循环）：
//   千咲是"挂绞痕→积累残响→进电锯→锯环连斩→终结爆发"的形态循环主C。
//   锯环残响（0-100）：普攻+10 / 技能+25 / 锯环疾攻每段+12。
//   非电锯模式下响满100时共鸣技能替换为齿轨轮回（消耗全残响，进入电锯模式3回合）。
//   电锯模式下普攻替换为锯环疾攻（3段连斩，每段+12残响）。
//   电锯模式下残响满100时普攻替换为锯环终结（消耗全部残响，退出电锯模式）。
//   共鸣解放进入万缕·汇终2回合，锯环系倍率+120%，锯环终结后提前结束
//   无重击（hasHeavy: false）。
//
// 共鸣链：
//   1链：附加绞痕时攻击+30%（2回合）—— atkUp触发式
//   2链：无视10%湮灭抗性（elemPierce待新增）+虚湮之线全队全属性+50%（teamAllDmg）
//   3链：锯环疾攻/终结倍率+120%与万缕·汇终加法叠加）
//   4链：虚湮效应每回合叠层上限1→2（叠层加速，待新增专用机制
//   5链：放伤害+100%
//   6链：电锯模式致命伤不倒每场1次 + 终焉千咲伤害+40%

import { registerSwitchHook } from '../switchHooks.js';
import { addEffect, consumeAllEffect, getEffectStacks } from '../combat/effects.js';

// ── 常量 ──
const SAW_DURATION = 3;                // 电模式持续 3 回合
const WANLV_DURATION = 2;              // 万缕·汇终持续 2 回合
const RESOURCE_MAX = 100;              // 锯环残响上限
const MARK_DURATION = 3;               // 虚无绞痕持续 3 回合
const NORMAL_RESOURCE_GAIN = 10;       // 普攻 +10 残响
const SKILL_RESOURCE_GAIN = 25;        // 技能 +25 残响
const SAWSLASH_RESOURCE_GAIN = 12;     // 锯环疾攻每段 +12 残响（3段合计 +36）

// HP 核倍率
const NORMAL_HP_MULT = 0.041;          // 普攻 HP×4.1%
const SKILL_HP_MULT = 0.073;           // 技能 HP×7.3%
const SAWSLASH_PER_SEGMENT = 0.053;    // 锯环疾攻每 HP×5.3%
const SAWSLASH_COMBINED = SAWSLASH_PER_SEGMENT * 3; // 合计 HP×15.9%
const SAWFINISH_HP_MULT = 0.122;       // 锯环终结 HP×12.2%
const BURST_MAIN_HP_MULT = 0.163;      // 解放主目标 HP×16.3%
const BURST_SIDE_HP_MULT = 0.081;      // 解放副目标 HP×8.1%
const VARIATION_HP_MULT = 0.033;       // 变奏 HP×3.3%

// 万缕·汇终加成 +120%
const WANLV_BONUS = 1.20;
// 链3加成 +120%
const C3_BONUS = 1.20;

// ── 状态查询 ──
export function qianxiaoInSaw(self) {
  return !!(self && self.name === '千咲' && (self.qianxiaoSawTurns || 0) > 0);
}

export function qianxiaoStack(self) {
  return self?.name === '千咲' ? (self.qianxiaoStack || 0) : 0;
}

export function qianxiaoInWanlv(self) {
  return !!(self && self.name === '千咲' && (self.qianxiaoWanlvyTurns || 0) > 0);
}

export function qianxiaoErosionStacks(enemy) {
  return getEffectStacks(enemy, 'void_erosion');
}

// ── 锯环疾攻/终结 倍率计算（含万缕汇终 + 链3）──
function qianxiaoSawSlashMult(self) {
  let bonus = 0;
  if (qianxiaoInWanlv(self)) bonus += WANLV_BONUS;
  if (self.chain >= 3) bonus += C3_BONUS;
  return SAWSLASH_COMBINED * (1 + bonus);
}

function qianxiaoSawFinishMult(self) {
  let bonus = 0;
  if (qianxiaoInWanlv(self)) bonus += WANLV_BONUS;
  if (self.chain >= 3) bonus += C3_BONUS;
  return SAWFINISH_HP_MULT * (1 + bonus);
}

// ── HP 核倍率覆写（combat.js calcDamage 调用） ──
export function qianxiaoHpMult(dmgType) {
  switch (dmgType) {
    case 'normal': return NORMAL_HP_MULT;
    case 'skill':  return SKILL_HP_MULT;
    case 'burst':  return null;   // 由 resolveBurstMult 提供解放倍率
    default:       return null;
  }
}

export function qianxiaoHpCore(self, dmgType) {
  if (self.name !== '千咲') return null;
  return {
    baseStat: 'hpMax',
    hpMultOverride: qianxiaoHpMult(dmgType)
  };
}

// ── 解放倍率 ──
export function qianxiaoResolveBurstMult(self) {
  if (self.name !== '千咲') return null;
  let main = BURST_MAIN_HP_MULT;
  let side = BURST_SIDE_HP_MULT;
  if (self.chain >= 5) {
    main *= 2;  // 链5：解放伤害+100%
    side *= 2;
  }
  return { baseMain: main, baseSide: side };
}

// ── 虚无绞痕伤害加成（damage.js debuffBonus 中查询） ──
export function qianxiaoGetMarkDamageBonus(defender) {
  if (!defender) return 1.0;
  let mult = 1.0;
  // 虚无绞痕 +15%
  if (defender.qianxiaoMark && defender.qianxiaoMark > 0) {
    mult *= 1.15;
  }
  return mult;
}

// ── 普攻替换（电锯模式） ──
// 电锯模式下：残响满→锯环终结，否则→锯环疾攻（3段合并）
export function qianxiaoResolveNormal(self, battle) {
  if (self.name !== '千咲' || !qianxiaoInSaw(self)) return null;

  if ((self.qianxiaoStack || 0) >= RESOURCE_MAX) {
    return {
      mult: qianxiaoSawFinishMult(self),
      dmgType: 'burst',
      label: '锯环·终结',
      isSawFinish: true
    };
  }

  return {
    mult: qianxiaoSawSlashMult(self),
    dmgType: 'burst',
    label: '环·疾攻',
    isSawSlash: true
  };
}

// ── 共鸣能替换（齿轨轮回：非电锯下残响满时） ──
export function qianxiaoResolveSkill(self, battle) {
  if (self.name !== '千咲') return null;
  if (qianxiaoInSaw(self)) return null;          // 电锯模式下技能不变
  if ((self.qianxiaoStack || 0) < RESOURCE_MAX) return null;  // 残响未满
  return {
    mult: SKILL_HP_MULT,
    dmgType: 'skill',
    label: '齿轨轮回',
    isChigui: true
  };
}

// ── 普攻命中后 hook（电锯模式下资源增减） ──
export function qianxiaoOnAttack(self, ctx) {
  if (self.name !== '千咲') return;
  if (!qianxiaoInSaw(self)) {
    // 非电锯模式：普攻+10残响
    self.qianxiaoStack = Math.min(RESOURCE_MAX, (self.qianxiaoStack || 0) + NORMAL_RESOURCE_GAIN);
    return;
  }
  const battle = ctx.battle;
  // 电锯模式下：区分锯环疾攻和锯环终结
  if ((self.qianxiaoStack || 0) >= RESOURCE_MAX) {
    // 锯终结：消耗全部残响，退出电锯模式
    self.qianxiaoStack = 0;
    self.qianxiaoSawTurns = 0;
    // 万缕·汇终提前结束
    if (self.qianxiaoWanlvyTurns > 0) {
      self.qianxiaoWanlvyTurns = 0;
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '锯环终结 · 万缕·汇终提前结束'
      });
    }
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '锯环终结 · 消耗全部残响 · 退出电锯模式'
    });
  } else {
    // 锯环疾攻：3段合计+36残响
    const before = self.qianxiaoStack || 0;
    self.qianxiaoStack = Math.min(RESOURCE_MAX, before + SAWSLASH_RESOURCE_GAIN * 3);
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `锯环·攻 · 响 +36（${before} → ${self.qianxiaoStack}/${RESOURCE_MAX}）`
    });
    if (self.qianxiaoStack >= RESOURCE_MAX) {
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '锯环残响已满 · 下次普攻替换为锯环·终结'
      });
    }
  }
}

// ── 共鸣技能命中后 hook ──
export function qianxiaoOnSkill(self, ctx) {
  if (self.name !== '千咲') return;
  const battle = ctx.battle;
  const target = ctx.target;
  if (!target) return;

  // 电锯模式下技能正常使用（积累残响+附加绞痕）
  if (qianxiaoInSaw(self)) {
    const before = self.qianxiaoStack || 0;
    self.qianxiaoStack = Math.min(RESOURCE_MAX, before + SKILL_RESOURCE_GAIN);
    qianxiaoApplyMark(self, target, battle);
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `共鸣技能 · 残响 +${SKILL_RESOURCE_GAIN}（${before} → ${self.qianxiaoStack}/${RESOURCE_MAX}）· 附加虚无绞痕`
    });
    return;
  }

  // 非电锯模式：判断是否齿轨轮回
  if ((self.qianxiaoStack || 0) >= RESOURCE_MAX) {
    // 齿轨轮回：消耗全部残响，进入电锯模式
    self.qianxiaoStack = 0;
    self.qianxiaoSawTurns = SAW_DURATION;
    qianxiaoApplyMark(self, target, battle);

    // 链1：附加绞痕时攻击+30%（2回合）
    if (self.chain >= 1) {
      self.buffs = (self.buffs || []).filter(b => b.src !== '千咲链1');
      self.buffs.push({ type: 'atkUp', value: 0.30, duration: 2, src: '千咲链1' });
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '链1 · 附加虚无绞痕 · 攻击 +30%（2 回合）'
      });
    }

    // 链2：虚湮之线全队全属性伤害+50%
    if (self.chain >= 2) {
      battle.team.forEach(t => {
        if (!t.alive) return;
        t.buffs = (t.buffs || []).filter(b => b.src !== '千咲链2');
        t.buffs.push({ type: 'elemAllUp', value: 0.50, duration: MARK_DURATION, src: '千咲链2', installer: self.idx });
      });
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '链2 · 虚湮之线 · 全队全属性伤害 +50%'
      });
    }

    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `齿轨轮回 · 消耗全部残响 · 进入电锯模式（${SAW_DURATION} 回合）`
    });
  } else {
    // 正常共鸣技能
    const before = self.qianxiaoStack || 0;
    self.qianxiaoStack = Math.min(RESOURCE_MAX, before + SKILL_RESOURCE_GAIN);
    qianxiaoApplyMark(self, target, battle);

    // 链1：附加绞痕时攻击+30%（2回合）
    if (self.chain >= 1) {
      self.buffs = (self.buffs || []).filter(b => b.src !== '千咲链1');
      self.buffs.push({ type: 'atkUp', value: 0.30, duration: 2, src: '千咲链1' });
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '链1 · 附加虚无绞痕 · 攻击 +30%（2 回合）'
      });
    }

    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `共鸣技能 · 残响 +${SKILL_RESOURCE_GAIN}（${before} → ${self.qianxiaoStack}/${RESOURCE_MAX}）· 附加虚无绞痕`
    });
    if (self.qianxiaoStack >= RESOURCE_MAX) {
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '锯环残响已满 · 下次共鸣技能替换为齿轨轮回'
      });
    }
  }
}

// ── 附加虚无绞痕 ──
function qianxiaoApplyMark(self, target, battle) {
  if (!target) return;
  target.qianxiaoMark = MARK_DURATION;
  // 虚湮效应：标记命中时附加 1 层，回合末再叠（官方"每 2 秒触发 1 次"简化为回合制节奏）
  addEffect(target, 'void_erosion', 1, battle, { src: self.name });

  // 链6：终焉标记
  if (self.chain >= 6) {
    target.qianxiaoTerminal = true;
  }
}

// ── 共鸣解放 hook（进入万缕·汇终 + 全队回血） ──
export function qianxiaoOnBurst(self, ctx) {
  if (self.name !== '千咲') return;
  const battle = ctx.battle;
  self.qianxiaoWanlvyTurns = WANLV_DURATION;

  // 全队回血 HP×5%
  battle.team.forEach(t => {
    if (!t.alive) return;
    const healAmt = Math.round(t.hpMax * 0.05);
    const healed = Math.min(t.hpMax - t.hp, healAmt);
    t.hp += healed;
    if (healed > 0) {
      battle.log.push({
        type: 'heal', src: self.name, tgt: t.name, dmg: healed
      });
    }
  });

  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `共鸣解放 · 进入万缕·汇终（${WANLV_DURATION} 回合）· 锯环系倍率 +120% · 全队回血 5%`
  });
}

// ── 变奏入场 hook ──
export function qianxiaoSwitchIn({ to, battle }) {
  if (to?.name !== '千咲') return;
  // 变奏入场触发基础变奏伤害由 combat.js 处理
  // 电锯模式入场时变奏接锯环疾攻第2段
  if (qianxiaoInSaw(to)) {
    battle.log.push({
      type: 'mechanic', src: '千咲',
      msg: '电锯模式 · 变奏接锯环·疾攻第2段'
    });
  }
}
registerSwitchHook('千咲', qianxiaoSwitchIn);

// ── 6 链致命伤不倒（每场1次） ──
export function qianxiaoOnLethal(self, battle) {
  if (self.name !== '千咲') return false;
  if (self.chain < 6) return false;
  if (self.qianxiaoLethalUsed) return false;
  if (!qianxiaoInSaw(self)) return false;
  self.qianxiaoLethalUsed = true;
  self.hp = 1;
  // 退出电锯模式
  self.qianxiaoSawTurns = 0;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: '6 链 · 终焉形态 · 致命伤不倒每场 1 次）· 保留 1 点生命 · 退出电锯模式'
  });
  return true;
}

// ── turnCleanup hook（每回合结束时调用） ──
// 处理：电锯模式duration递减 / 万缕·汇终duration递减 /
//       虚无绞痕duration递减 / 虚湮效应叠层
export function qianxiaoTick(self, battle) {
  if (self.name !== '千咲') return null;
  const results = [];

  // 电锯模式duration递减
  if (qianxiaoInSaw(self)) {
    self.qianxiaoSawTurns = (self.qianxiaoSawTurns || 0) - 1;
    if (self.qianxiaoSawTurns <= 0) {
      self.qianxiaoSawTurns = 0;
      self.qianxiaoStack = 0;
      results.push('电锯模式结束 · 残响清零');
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '电锯模式结束 · 残响清零'
      });
    }
  }

  // 万缕·汇终duration递减
  if (self.qianxiaoWanlvyTurns > 0) {
    self.qianxiaoWanlvyTurns = (self.qianxiaoWanlvyTurns || 0) - 1;
    if (self.qianxiaoWanlvyTurns <= 0) {
      self.qianxiaoWanlvyTurns = 0;
      results.push('万缕·汇终结束');
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '万缕·汇终结束'
      });
    }
  }

  // 虚无绞痕duration递减 + 虚湮效应叠层
  const target = battle.enemies.find(e => e.alive && e.qianxiaoMark > 0);
  if (target) {
    // 递减标记duration
    target.qianxiaoMark = (target.qianxiaoMark || 0) - 1;
    if (target.qianxiaoMark <= 0) {
      target.qianxiaoMark = 0;
      consumeAllEffect(target, 'void_erosion', battle, { src: self.name });
      // 清除链2 buff（标记消失时移除）
      if (self.chain >= 2) {
        battle.team.forEach(t => {
          t.buffs = (t.buffs || []).filter(b => b.src !== '千咲链2');
        });
      }
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: '虚无绞痕消失'
      });
    } else {
      const maxLayersPerTurn = self.chain >= 4 ? 2 : 1;
      addEffect(target, 'void_erosion', maxLayersPerTurn, battle, { src: self.name });
    }
  }

  return results.length > 0 ? results.join('; ') : null;
}

export function qianxiaoTurnCleanup(self, ctx) {
  return qianxiaoTick(self, ctx.battle);
}

// ── 徽章收集（战斗 UI 状态行） ──
export function qianxiaoCollectBadges(self) {
  if (self.name !== '千咲') return [];
  const badges = [];
  const stack = self.qianxiaoStack || 0;

  if (qianxiaoInSaw(self)) {
    badges.push(`<span style="color:var(--gold)">电锯 ${self.qianxiaoSawTurns}回</span>`);
  }
  if (stack > 0 || qianxiaoInSaw(self)) {
    badges.push(`<span style="color:#a78bff">残响 ${stack}/${RESOURCE_MAX}</span>`);
  }
  if (qianxiaoInWanlv(self)) {
    badges.push(`<span style="color:#ff6b9d">万缕·汇终 ${self.qianxiaoWanlvyTurns}回</span>`);
  }
  if (self.qianxiaoLethalUsed) {
    badges.push(`<span style="color:#666">终焉已用</span>`);
  }
  return badges;
}

// ── 查询敌人是否带绞痕（供 UI 显示） ──
export function qianxiaoEnemyHasMark(enemy) {
  return !!(enemy?.qianxiaoMark && enemy.qianxiaoMark > 0);
}

export default {
  name: '千咲',
  hasHeavy: false,
  inSaw: qianxiaoInSaw,
  stack: qianxiaoStack,
  inWanlv: qianxiaoInWanlv,
  hpMult: qianxiaoHpMult,
  hpCore: qianxiaoHpCore,
  resolveBurstMult: qianxiaoResolveBurstMult,
  resolveNormal: qianxiaoResolveNormal,
  resolveSkill: qianxiaoResolveSkill,
  onAttack: qianxiaoOnAttack,
  onSkill: qianxiaoOnSkill,
  onBurst: qianxiaoOnBurst,
  onLethal: qianxiaoOnLethal,
  tick: qianxiaoTick,
  turnCleanup: qianxiaoTurnCleanup,
  switchIn: qianxiaoSwitchIn,
  collectBadges: qianxiaoCollectBadges
};
