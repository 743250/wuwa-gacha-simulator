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
const DECAY_ACTIVE = 10;           // 当前角色衰减（实际不衰减）
const DECAY_BENCH = 5;             // 非当前角色-5/回合
const DECAY_OFFBATTLE = 10;        // 非战斗-10/回合

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

// 非当前角色衰减
function chouyuanDecayStack(self, battle) {
  if (self.name !== '仇远') return;
  // 战斗中非当前角色
  if (battle?.currentIdx !== undefined && battle.team?.[battle.currentIdx]?.name !== '仇远') {
    const before = self.chouyuanStack || 0;
    self.chouyuanStack = Math.max(0, before - DECAY_BENCH);
    if (self.chouyuanStack !== before) {
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: `挑灯问剑 -${DECAY_BENCH}（非当前角色衰减 · ${before} → ${self.chouyuanStack}/${STACK_MAX}）`
      });
    }
  }
}

// ── 答剑三连倍率 ──
function chouyuanAnswerSwordMult(self) {
  let mult = HEAVY_BASE_MULT; // 550%
  // 且从容 ×1.5（每场1次，第一次进入淋漓醉墨时已标记）
  if (self.chouyuanCalmUsed) {
    mult *= CALM_HEAVY_MULT; // 825%
  }
  // 链3荷蓑出林后 +600%（独立乘数×7 → 3850% 或 5775% 含且从容）
  if (self._chouyuanC3BoostActive) {
    mult *= (1 + C3_HEAVY_BOOST); // ×7 from base
  }
  return mult;
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
    label: '荷出林',
    isHeSuoChuLin: true
  };
}

// 荷蓑出林后处理：消耗协奏、资源、进淋漓醉墨、设C3增益
export function chouyuanFinishSkill(self, battle, form) {
  if (self.name !== '仇远' || !form?.isHeSuoChuLin) return;
  self.concerto = Math.max(0, (self.concerto || 0) - HESUOCHULIN_CONCERTO_COST);
  self.chouyuanStack = STACK_MAX; // 满挑灯问剑
  self._chouyuanHeSuoUsed = true;
  // 标记下次进入淋漓醉墨时+600%倍率
  self._chouyuanC3BoostActive = true;
  // 且从容荷蓑出林提前结束（官方），直接进入淋漓醉墨
  // 注意：此时且从容已用标记保留（防止双算）
  // 但荷蓑出林进入的淋漓醉墨不触发且从容（官方：提前结束且从容）
  // 所以标记且从容为已用，但不给×1.5
  // 实际上 design doc 说 "荷蓑出林后下次淋漓醉墨无法获得且从容" - 这里的"且从容"是指新的且从容
  // 等待用户确认。目前实现：荷蓑出林→满资源→进淋漓醉墨（无且从容×1.5）
  self._chouyuanC3NoCalm = true;
  // 直接进入淋漓醉墨（且从容已被提前结束）
  self.chouyuanDrunkTurns = DRUNK_DURATION;
  // 竹照
  self.chouyuanBambooTurns = BAMBOO_DURATION;
  if (battle && battle.team) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '仇远竹照');
      let totalAllDmg = BAMBOO_ALL_DMG;
      if (self.chain >= 2) totalAllDmg += BAMBOO_C2_EXTRA;
      t.buffs.push({ type: 'teamAllDmg', value: totalAllDmg, duration: BAMBOO_DURATION, src: '仇远竹照' });
    });
  }
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: '链3 · 荷蓑出林 · 消耗60协奏 · 满挑灯问剑 · 进入淋漓醉墨 · 答剑三连+600%准备就绪'
  });
  // 延奏替换标记
  self._chouyuanXinYunReady = true;
}

// 答剑三连后处理：消全部挑灯问剑，退出淋漓醉墨
export function chouyuanFinishHeavy(self, battle, form) {
  if (self.name !== '仇远' || !form?.isAnswerSword) return;
  chouyuanConsumeAllStack(self, battle);
  // 且从容 忠烈死节+30协奏
  if (self.chouyuanCalmUsed) {
    self.concerto = Math.min(100, (self.concerto || 0) + CALM_CONCERTO_GAIN);
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '且从容 · 忠烈死节 · 协奏 +30'
    });
  }
  // 链6 忠烈死节停滞（标记，由combat.js处理）
  if (self.chain >= 6) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '6链 · 忠烈死节 · 目标停滞1回合'
    });
    self._chouyuanStunPending = true;
  }
  // 答剑三连后退出淋漓醉墨
  chouyuanExitDrunk(self, battle);
}

// ── 形态进入 ──
export function chouyuanEnterDrunk(self, battle) {
  if (self.name !== '仇远' || chouyuanInDrunk(self)) return;
  self.chouyuanDrunkTurns = DRUNK_DURATION;

  // 竹照
  self.chouyuanBambooTurns = BAMBOO_DURATION;
  if (battle && battle.team) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '仇远竹照');
      let totalAllDmg = BAMBOO_ALL_DMG;
      if (self.chain >= 2) totalAllDmg += BAMBOO_C2_EXTRA;
      t.buffs.push({ type: 'teamAllDmg', value: totalAllDmg, duration: BAMBOO_DURATION, src: '仇远竹照' });
    });
  }

  // 且从：每场1次；荷蓑出林进入时不触发
  if (!self.chouyuanCalmUsed && !self._chouyuanC3NoCalm) {
    self.chouyuanCalmUsed = true;
    battle?.log.push({
      type: 'mechanic', src: self.name,
      msg: '且从容 · 答剑三连伤害×1.5 · 忠烈死节回复30协奏'
    });
  }

  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: `淋漓醉墨展开 · 持续${DRUNK_DURATION}回合 · 重击替换为答剑三连 · 竹照激活（全队全属性伤害+${(BAMBOO_ALL_DMG*100).toFixed(0)}%）`
  });
}

function chouyuanExitDrunk(self, battle) {
  if (!chouyuanInDrunk(self)) return;
  self.chouyuanDrunkTurns = 0;
  // C3增益仅持续一次淋漓醉墨，退出时清除
  self._chouyuanC3BoostActive = false;
  self._chouyuanC3NoCalm = false;
  // 链6：退出时600% AOE
  if (self.chain >= 6 && battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '6链 · 退出淋漓醉墨 · 对全体敌人造成600%气动AOE'
    });
    self._chouyuanExitAoePending = true;
  }
  battle?.log.push({
    type: 'mechanic', src: self.name,
    msg: '淋漓醉墨结束'
  });
}

// ── 解放 hook ──
export function chouyuanResolveBurstMult(self) {
  if (self.name !== '仇远') return null;
  // 基础倍率，链3+500%由 chains.js burstDmg: 5 处
  // 此处只返回基础值，链加成走 chainBonuses
  return { baseMain: 4.0, baseSide: 2.0 };
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
      target.buffs.push({ type: 'cdmg', value: bonus, duration: 3, src: '仇远解放暴伤' });
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
  // 切人退出淋漓醉墨
  if (chouyuanInDrunk(from)) {
    chouyuanExitDrunk(from, battle);
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
  self._chouyuanC3BoostActive = false;
  self._chouyuanC3NoCalm = false;
  self._chouyuanHeSuoUsed = false;
  self._chouyuanXinYunReady = false;
  self._chouyuanExitAoePending = false;
  self._chouyuanStunPending = false;
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
  onBurst: chouyuanOnBurst,
  finishHeavy: chouyuanFinishHeavy,
  finishSkill: chouyuanFinishSkill,
  resolveOutro: chouyuanResolveOutro,
  tick: chouyuanTick,
  turnCleanup: chouyuanTurnCleanup,
  switchIn: chouyuanSwitchIn,
  switchOut: chouyuanSwitchOut,
  battleStart: chouyuanBattleStart,
  collectBadges: chouyuanCollectBadges
};
