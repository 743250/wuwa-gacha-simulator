// 仇「挑灯问剑 / 淋漓醉墨 / 答剑三连」状态机
//
// 设计思路（ATK 核 · 窗口型主C）：
//   仇远是"攒挑灯问剑→满 100 进淋漓醉墨→答剑三连爆发"的窗口型主C。
//   淋漓醉墨 2 回合：重击替换为答剑三连，三段合并结算。
//   且从容：第一次进淋漓醉墨时触发，答剑三连×1.5（每场 1 次）。
//   竹照：进淋漓醉墨时触发，全队全属性伤害+30%（3 回合）。
//   切人退出淋漓醉墨。挑灯问剑非当前角色时每回合衰减。
//
// Chain 3 荷蓑出林、答剑三连+600%、延奏替换由 resolveSkill hook 驱动。
// Chain 6 退出 AOE、停滞由状态机内部处理。

import { registerSwitchHook, registerSwitchOutHook } from '../switchHooks.js';
import { calcDamage, dealDamage } from '../combat/damage.js';

// ── 量 ──
const STACK_MAX = 100;
const GAIN_NORMAL = 10;
const GAIN_SKILL = 25;
const GAIN_BURST = 40;
const GAIN_VAR = 5;
const DRUNK_DURATION = 2;
const BAMBOO_DURATION = 3;
const HEAVY_BASE_MULT = 5.5;       // 答剑三连 ATK×550%
const CALM_HEAVY_MULT = 1.5;       // 且从容 ×1.5
const C3_HEAVY_BOOST = 6.0;        // 链3荷蓑出林后答剑三连+600%（倍率乘算）
const BAMBOO_ALL_DMG = 0.30;       // 竹照全队全属性伤害+30%
const BAMBOO_C2_EXTRA = 0.30;      // 链2竹照额外全队全属性伤害+30%
const CALM_CONCERTO_GAIN = 30;     // 且从容 忠烈死节+30协奏
const HESUOCHULIN_MULT = 5.0;      // 荷蓑出林 ATK×500%
const HESUOCHULIN_CONCERTO_COST = 60;
const C6_EXIT_AOE_MULT = 6.0;      // 链6退出600% AOE
const DECAY_BENCH = 5;             // 非当前角色-5/回合

// ── 状态查询 ──
export function chouyuanInDrunk(self) {
  return !!(self && self.name === '仇远' && (self.chouyuanDrunkTurns || 0) > 0);
}

export function chouyuanStack(self) {
  return self?.name === '仇远' ? (self.chouyuanStack || 0) : 0;
}

export function chouyuanBambooActive(self) {
  return !!(self && self.name === '仇远' && (self.chouyuanBambooTurns || 0) > 0);
}

// 是否可用重击：仅淋漓醉墨状态下可用
export function chouyuanCanHeavy(self) {
  if (self.name !== '仇远') return null;
  if (!chouyuanInDrunk(self)) {
    return { ok: false, err: '非淋漓醉墨状态 · 重击不可用' };
  }
  return null; // 可用
}

// 链3荷蓑出林条件：链3 + 协奏满 + 非淋漓醉墨 + 未使用过（每场1次）
export function chouyuanCanSkill(self, battle) {
  if (self.name !== '仇远') return null;
  if (self.chain < 3) return null;
  if (chouyuanInDrunk(self)) return null;
  if (self._chouyuanHeSuoUsed) return null;
  const concerto = self.concerto || 0;
  if (concerto < HESUOCHULIN_CONCERTO_COST) return null;
  return { ok: true, replaceWith: '荷蓑出林' };
}

// ── 资源操作 ──
export function chouyuanGainStack(self, amount, battle) {
  if (self.name !== '仇远') return;
  const before = self.chouyuanStack || 0;
  self.chouyuanStack = Math.min(STACK_MAX, before + amount);
  if (self.chouyuanStack !== before) {
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: `挑灯问剑 +${amount}（${before} → ${self.chouyuanStack}/${STACK_MAX}）`
    });
  }
  // 满值时进入淋漓醉墨
  if (self.chouyuanStack >= STACK_MAX && !chouyuanInDrunk(self)) {
    chouyuanEnterDrunk(self, battle);
  }
}

export function chouyuanConsumeAllStack(self, battle) {
  if (self.name !== '仇远') return 0;
  const consumed = self.chouyuanStack || 0;
  self.chouyuanStack = 0;
  return consumed;
}

// 非当前角色衰减（battle.active 为当前出手下标）
function chouyuanDecayStack(self, battle) {
  if (self.name !== '仇远' || !battle) return;
  const active = battle.team?.[battle.active];
  if (active && active.name === '仇远') return;
  const before = self.chouyuanStack || 0;
  if (before <= 0) return;
  self.chouyuanStack = Math.max(0, before - DECAY_BENCH);
  if (self.chouyuanStack !== before) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `挑灯问剑 -${DECAY_BENCH}（非当前角色衰减 · ${before} → ${self.chouyuanStack}/${STACK_MAX}）`
    });
  }
  syncChouyuanForte(self);
}

function syncChouyuanForte(self) {
  if (self.forte) {
    self.forte.current = self.chouyuanStack || 0;
    self.forte.ready = (self.chouyuanStack || 0) >= STACK_MAX;
  }
}

// ── 答剑三连倍率 ──
function chouyuanAnswerSwordMult(self) {
  let mult = HEAVY_BASE_MULT; // 550%
  // 且从容 ×1.5：仅本场第一次淋漓醉墨窗口内生效
  if (self.chouyuanCalmActive) {
    mult *= CALM_HEAVY_MULT; // 825%
  }
  // 链3荷蓑出林后 +600%（独立乘数×7）
  if (self._chouyuanC3BoostActive) {
    mult *= (1 + C3_HEAVY_BOOST); // ×7 from base
  }
  return mult;
}

// 普攻积攒挑灯问剑
export function chouyuanOnAttack(self, ctx) {
  if (self.name !== '仇远') return;
  if (chouyuanInDrunk(self)) return;
  chouyuanGainStack(self, GAIN_NORMAL, ctx?.battle);
  syncChouyuanForte(self);
}

// 技能积攒；荷蓑出林由 finishSkill 处理（先 finish 再 onSkill 时已进醉墨，此处跳过）
export function chouyuanOnSkill(self, ctx) {
  if (self.name !== '仇远') return;
  if (chouyuanInDrunk(self)) return;
  chouyuanGainStack(self, GAIN_SKILL, ctx?.battle);
  syncChouyuanForte(self);
}

// 答剑后：C6 停滞（退出 AOE 在 exitDrunk 内即时结算）
export function chouyuanOnHeavy(self, ctx) {
  if (self.name !== '仇远') return;
  const target = ctx?.target;
  if (self._chouyuanStunPending && target) {
    target.suppressed = Math.max(target.suppressed || 0, 1);
    self._chouyuanStunPending = false;
  }
}

function settleExitAoe(self, battle) {
  if (!self._chouyuanExitAoePending || !battle) return;
  const alive = battle.enemies.filter(e => e.alive);
  const results = alive.map(e => {
    const { dmg, crit } = calcDamage(self, e, C6_EXIT_AOE_MULT, 'burst');
    const real = dealDamage(e, dmg);
    return { tgt: e.name, dmg: real, crit };
  });
  if (results.length) {
    battle.log.push({ type: 'burst', src: self.name, results, action: '6链 · 退出淋漓醉墨' });
  }
  self._chouyuanExitAoePending = false;
}

// ── 招式 hook ──

// resolveHeavy：淋漓醉墨中重击替换为答剑三连
export function chouyuanResolveHeavy(self, battle) {
  if (self.name !== '仇远' || !chouyuanInDrunk(self)) return null;
  return {
    mult: chouyuanAnswerSwordMult(self),
    dmgType: 'heavy',
    label: '答剑三连',
    isAnswerSword: true
  };
}

// resolveSkill：链3荷蓑出林替换
export function chouyuanResolveSkill(self, battle) {
  if (self.name !== '仇远') return null;
  if (self.chain < 3) return null;
  if (chouyuanInDrunk(self)) return null;
  if (self._chouyuanHeSuoUsed) return null;
  const concerto = self.concerto || 0;
  if (concerto < HESUOCHULIN_CONCERTO_COST) return null;
  // 荷蓑出林就绪
  return {
    mult: HESUOCHULIN_MULT,
    dmgType: 'skill',
    label: '荷蓑出林',
    isHeSuoChuLin: true
  };
}

// 荷蓑出林后处理：消耗协奏、资源、进淋漓醉墨、设C3增益
export function chouyuanFinishSkill(self, battle, form) {
  if (self.name !== '仇远' || !form?.isHeSuoChuLin) return;
  self.concerto = Math.max(0, (self.concerto || 0) - HESUOCHULIN_CONCERTO_COST);
  self.chouyuanStack = STACK_MAX;
  self._chouyuanHeSuoUsed = true;
  self._chouyuanC3BoostActive = true;
  // 荷蓑出林进入的淋漓醉墨不触发且从容
  self._chouyuanC3NoCalm = true;
  self.chouyuanDrunkTurns = DRUNK_DURATION;
  applyBambooBuff(self, battle);
  // 链6：荷蓑出林时暴伤 +100%（1 回合）
  if (self.chain >= 6) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '仇远链6');
    self.buffs.push({ type: 'cdmgUp', value: 1.0, duration: 1, src: '仇远链6', scope: 'self', installer: self.idx });
  }
  syncChouyuanForte(self);
  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: '链3 · 荷蓑出林 · 消耗60协奏 · 满挑灯问剑 · 进入淋漓醉墨 · 答剑三连+600%准备就绪'
  });
  self._chouyuanXinYunReady = true;
}

// 答剑三连后处理：消全部挑灯问剑，退出淋漓醉墨
export function chouyuanFinishHeavy(self, battle, form) {
  if (self.name !== '仇远' || !form?.isAnswerSword) return;
  chouyuanConsumeAllStack(self, battle);
  syncChouyuanForte(self);
  // 且从容 忠烈死节+30协奏（本窗口）
  if (self.chouyuanCalmActive) {
    self.concerto = Math.min(100, (self.concerto || 0) + CALM_CONCERTO_GAIN);
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: '且从容 · 忠烈死节 · 协奏 +30'
    });
    self.chouyuanCalmActive = false;
  }
  if (self.chain >= 6) {
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: '6链 · 忠烈死节 · 目标停滞1回合'
    });
    self._chouyuanStunPending = true;
  }
  chouyuanExitDrunk(self, battle);
}

function applyBambooBuff(self, battle) {
  self.chouyuanBambooTurns = BAMBOO_DURATION;
  if (!battle?.team) return;
  let totalAllDmg = BAMBOO_ALL_DMG;
  if (self.chain >= 2) totalAllDmg += BAMBOO_C2_EXTRA;
  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== '仇远竹照');
    // damage.js 认 elemAllUp
    t.buffs.push({
      type: 'elemAllUp', value: totalAllDmg, duration: BAMBOO_DURATION,
      src: '仇远竹照', installer: self.idx
    });
  });
}

// ── 形态进入 ──
export function chouyuanEnterDrunk(self, battle) {
  if (self.name !== '仇远' || chouyuanInDrunk(self)) return;
  self.chouyuanDrunkTurns = DRUNK_DURATION;
  applyBambooBuff(self, battle);

  // 且从容：每场 1 次；荷蓑出林进入时不触发
  if (!self.chouyuanCalmUsed && !self._chouyuanC3NoCalm) {
    self.chouyuanCalmUsed = true;
    self.chouyuanCalmActive = true;
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: '且从容 · 答剑三连伤害×1.5 · 忠烈死节回复30协奏'
    });
  } else {
    self.chouyuanCalmActive = false;
  }

  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `淋漓醉墨展开 · 持续${DRUNK_DURATION}回合 · 重击替换为答剑三连 · 竹照激活（全队全属性伤害+${(BAMBOO_ALL_DMG*100).toFixed(0)}%）`
  });
}

// opts.suppressAoe：切人退出不触发 C6 AOE（需为登场角色）
function chouyuanExitDrunk(self, battle, opts = {}) {
  if (!chouyuanInDrunk(self)) return;
  self.chouyuanDrunkTurns = 0;
  self.chouyuanCalmActive = false;
  self._chouyuanC3BoostActive = false;
  self._chouyuanC3NoCalm = false;
  const isActive = !!(battle && battle.team?.[battle.active] === self);
  if (self.chain >= 6 && battle && isActive && !opts.suppressAoe) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '6链 · 退出淋漓醉墨 · 对全体敌人造成600%气动AOE'
    });
    self._chouyuanExitAoePending = true;
    settleExitAoe(self, battle);
  }
  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: '淋漓醉墨结束'
  });
}

// ── 解放 hook ──
export function chouyuanResolveBurstMult(self) {
  if (self.name !== '仇远') return null;
  // Phase 3 · 万钧一断 encore 795% → 主 800% / 副 400%；C3 抬至 1200%/600%
  if (self.chain >= 3) return { baseMain: 12.0, baseSide: 6.0 };
  return { baseMain: 8.0, baseSide: 4.0 };
}

export function chouyuanNormalMult(self) {
  return self.name === '仇远' ? 1.2 : null;
}
export function chouyuanSkillMult(self) {
  // resolveSkill 替换路径（荷蓑/不辞远）优先；此为常态技能基底
  return self.name === '仇远' ? 2.2 : null;
}
export function chouyuanVariationMult(self) {
  return self.name === '仇远' ? 2.0 : null;
}

export function chouyuanOnBurst(self, ctx) {
  if (self.name !== '仇远') return;
  // 暴击>50%转化暴伤
  const crate = self.crate || 0.05;
  if (crate > 0.50 && ctx?.battle) {
    const bonus = Math.min(0.30, (crate - 0.50) * 2);
    if (bonus > 0) {
      // 为登场角色（仇远自身）加暴伤buff
      const target = ctx.target || self;
      target.buffs = (target.buffs || []).filter(b => b.src !== '仇远解放暴伤');
      target.buffs.push({ type: 'cdmgUp', value: bonus, duration: 3, src: '仇远解放暴伤', scope: 'self', installer: self.idx });
      ctx.battle.log.push({
        type: 'mechanic', src: self.name,
        msg: `解放·万钧一断 · 击${(crate*100).toFixed(0)}%>50% · 登场角色暴伤+${(bonus*100).toFixed(0)}%（3回合）`
      });
    }
  }

  // 解放积攒挑灯问剑
  if (!chouyuanInDrunk(self)) {
    chouyuanGainStack(self, GAIN_BURST, ctx.battle);
  }
}

// ── 延奏 hook（链3 新筠坠箨替换）──
export function chouyuanResolveOutro(self, battle) {
  if (self.name !== '仇远') return null;
  if (self._chouyuanXinYunReady && self.chain >= 3) {
    return {
      mult: 5.0,
      dmgType: 'skill',
      label: '新筠坠箨',
      isXinYun: true,
      skipOutroBuff: true  // 替换延奏，不给队友全属性+50%
    };
  }
  return null;
}

// ── tick/turnCleanup ──
export function chouyuanTick(self, battle) {
  if (self.name !== '仇远') return null;
  // 淋漓醉墨回合递减
  if (chouyuanInDrunk(self)) {
    self.chouyuanDrunkTurns = (self.chouyuanDrunkTurns || 0) - 1;
    if (self.chouyuanDrunkTurns <= 0) {
      chouyuanExitDrunk(self, battle);
    }
  }
  // 竹照回合递减
  if (self.chouyuanBambooTurns > 0) {
    self.chouyuanBambooTurns -= 1;
  }
  // 非当前角色衰减
  if (!chouyuanInDrunk(self)) {
    chouyuanDecayStack(self, battle);
  }
  return null;
}

export function chouyuanTurnCleanup(self, ctx) {
  return chouyuanTick(self, ctx?.battle);
}

// ── 切换 hook ──
export function chouyuanSwitchIn({ to, battle, ctx }) {
  if (to?.name !== '仇远') return;
  chouyuanGainStack(to, GAIN_VAR, battle);
}

export function chouyuanSwitchOut({ from, to, battle }) {
  if (from?.name !== '仇远') return;
  // 切人退出淋漓醉墨（非登场，不触发 C6 退出 AOE）
  if (chouyuanInDrunk(from)) {
    chouyuanExitDrunk(from, battle, { suppressAoe: true });
  }
}

registerSwitchHook('仇远', chouyuanSwitchIn);
registerSwitchOutHook('仇远', chouyuanSwitchOut);

// ── 战斗开始 ──
export function chouyuanBattleStart(self, { battle }) {
  if (self.name !== '仇远') return;
  self.chouyuanStack = 0;
  self.chouyuanDrunkTurns = 0;
  self.chouyuanBambooTurns = 0;
  self.chouyuanCalmUsed = false;
  self.chouyuanCalmActive = false;
  self._chouyuanC3BoostActive = false;
  self._chouyuanC3NoCalm = false;
  self._chouyuanHeSuoUsed = false;
  self._chouyuanXinYunReady = false;
  self._chouyuanExitAoePending = false;
  self._chouyuanStunPending = false;
  syncChouyuanForte(self);
}

// ── 徽 ──
export function chouyuanCollectBadges(self) {
  if (self.name !== '仇远') return [];
  const badges = [];
  const stack = self.chouyuanStack || 0;
  if (stack > 0 || chouyuanInDrunk(self)) {
    badges.push(`<span style="color:#69b8ff">挑灯问剑 ${stack}/${STACK_MAX}</span>`);
  }
  if (chouyuanInDrunk(self)) {
    badges.push(`<span style="color:var(--gold)">淋漓醉墨 ${self.chouyuanDrunkTurns}回</span>`);
  }
  if (self.chouyuanBambooTurns > 0) {
    badges.push(`<span style="color:var(--green)">竹照 ${self.chouyuanBambooTurns}回</span>`);
  }
  if (self.chouyuanCalmUsed) {
    badges.push(`<span style="color:#ff8c5e">且从容</span>`);
  }
  return badges;
}

export default {
  name: '仇远',
  hasHeavy: true,
  inDrunk: chouyuanInDrunk,
  canHeavy: chouyuanCanHeavy,
  canSkill: chouyuanCanSkill,
  resolveHeavy: chouyuanResolveHeavy,
  resolveSkill: chouyuanResolveSkill,
  resolveBurstMult: chouyuanResolveBurstMult,
  normalMult: chouyuanNormalMult,
  skillMult: chouyuanSkillMult,
  variationMult: chouyuanVariationMult,
  onAttack: chouyuanOnAttack,
  onSkill: chouyuanOnSkill,
  onHeavy: chouyuanOnHeavy,
  onBurst: chouyuanOnBurst,
  finishHeavy: chouyuanFinishHeavy,
  finishSkill: chouyuanFinishSkill,
  resolveOutro: chouyuanResolveOutro,
  tick: chouyuanTick,
  turnCleanup: chouyuanTurnCleanup,
  battleStart: chouyuanBattleStart,
  collectBadges: chouyuanCollectBadges
};
