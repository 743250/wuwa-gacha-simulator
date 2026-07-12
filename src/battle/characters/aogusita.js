// 奥古斯塔「以众愿为冕 / 威慑 / 赫日威临」状态机
//
// 设计思路（HP 核 · 重装主C）:
//   奥古斯塔是"叠冕层+攒威慑→赫日威临爆发"型重装主C。
//   冕层（以众愿为冕）提升导电伤害和双暴，由变奏/技能/重击/延奏积累。
//   威慑满2层时将共鸣解放升级为赫日威临（高倍率+爆发窗口2回合），
//   窗口内普攻替换为烈阳，窗口结束时冕层+威慑全部清零。
//
// 冕层上限: 1层(C0) / 2层(C1) / 4层(C6)
// 威慑上限: 2层
// 爆发窗口: 2回合（赫日威临展开后）
//
// HP 核倍率: 普攻HP×4.5% / 技能HP×8.1%（冕层>=1时×1.5）/ 重击HP×9.9%（×1.5）
//   普通解放HP×18%主9%副 / 赫日威临HP×36%主18%副 / 烈阳HP×8.5% / 变奏HP×3.6%

import { calcDamage, dealDamage } from '../combat/damage.js';
import { registerSwitchHook } from '../switchHooks.js';

// ── 常量 ──
const WEISHE_MAX = 2;
const BURST_WINDOW_TURNS = 2;

const NORMAL_HP_MULT = 0.045;
const SKILL_HP_MULT = 0.081;
const SKILL_CROWN_BOOST = 1.5;
const HEAVY_HP_MULT = 0.099;
const HEAVY_CROWN_BOOST = 1.5;
const BURST_NORMAL_HP_MULT = 0.18;
const BURST_NORMAL_SIDE_MULT = 0.09;
const BURST_MAJESTIC_HP_MULT = 0.36;
const BURST_MAJESTIC_SIDE_MULT = 0.18;
const SUNSTRIKE_HP_MULT = 0.085;
const VARIATION_HP_MULT = 0.036;
const C6_NU_THUNDER_MULT = 0.045;

// ── 冕层上限 ──
function crownMax(self) {
  if (self.chain >= 6) return 4;
  if (self.chain >= 1) return 2;
  return 1;
}

// ── 状态查询 ──
export function aogusitaCrownLevel(self) {
  return self?.name === '奥古斯塔' ? (self.aogusitaCrown || 0) : 0;
}

export function aogusitaWeiSheLevel(self) {
  return self?.name === '奥古斯塔' ? (self.aogusitaWeiShe || 0) : 0;
}

export function aogusitaInBurstWindow(self) {
  return !!(self && self.name === '奥古斯塔' && (self.aogusitaBurstTurns || 0) > 0);
}

// ── 刷新冕层 buff ──
function refreshCrownBuffs(self, battle) {
  if (self.name !== '奥古斯塔') return;
  const crown = self.aogusitaCrown || 0;
  self.buffs = (self.buffs || []).filter(b =>
    b.src !== '奥古斯塔冕层' && b.src !== '奥古斯塔C1冕层' &&
    b.src !== '奥古斯塔C2冕层' && b.src !== '奥古斯塔C6冕层'
  );
  if (crown <= 0) return;
  self.buffs.push({ type: 'elemAllUp', value: crown * 0.15, duration: 99, src: '奥古斯塔冕层' });
  if (self.chain >= 1) {
    self.buffs.push({ type: 'cdmgUp', value: crown * 0.15, duration: 99, src: '奥古斯塔C1冕层' });
  }
  if (self.chain >= 2) {
    self.buffs.push({ type: 'crateUp', value: crown * 0.20, duration: 99, src: '奥古斯塔C2冕层' });
  }
  if (self.chain >= 6) {
    self.buffs.push({ type: 'cdmgUp', value: crown * 0.15, duration: 99, src: '奥古斯塔C6冕层' });
  }
  if (battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `冕层刷新 · 当前 ${crown}/${crownMax(self)} 层`
    });
  }
}

// ── 获得冕层 ──
function gainCrown(self, n, battle) {
  if (self.name !== '奥古斯塔') return;
  const max = crownMax(self);
  const before = self.aogusitaCrown || 0;
  self.aogusitaCrown = Math.min(max, before + n);
  if (self.aogusitaCrown !== before) {
    refreshCrownBuffs(self, battle);
    if (battle) {
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: `以众愿为冕 +${self.aogusitaCrown - before}（${before} → ${self.aogusitaCrown}/${max}）`
      });
    }
  }
}

// ── 获得威慑 ──
function gainWeiShe(self, n, battle) {
  if (self.name !== '奥古斯塔') return;
  const before = self.aogusitaWeiShe || 0;
  self.aogusitaWeiShe = Math.min(WEISHE_MAX, before + n);
  if (self.aogusitaWeiShe !== before && battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `威慑 +${self.aogusitaWeiShe - before}（${before} → ${self.aogusitaWeiShe}/${WEISHE_MAX}）`
    });
  }
}

// ── HP 核倍率覆写 ──
export function aogusitaHpMult(dmgType) {
  switch (dmgType) {
    case 'normal': return NORMAL_HP_MULT;
    case 'skill':  return SKILL_HP_MULT;
    case 'heavy':  return HEAVY_HP_MULT;
    case 'burst':  return BURST_NORMAL_HP_MULT;
    default:       return null;
  }
}

export function aogusitaHpCore(self, dmgType) {
  if (self.name !== '奥古斯塔') return null;
  return {
    baseStat: 'hpMax',
    hpMultOverride: dmgType === 'burst' ? null : aogusitaHpMult(dmgType)
  };
}

// ── 技能倍率（冕层>=1时×1.5，C3 +25%） ──
export function aogusitaSkillMult(self) {
  let mult = SKILL_HP_MULT;
  if ((self.aogusitaCrown || 0) >= 1) mult *= SKILL_CROWN_BOOST;
  if (self.chain >= 3) mult *= 1.25;
  return mult;
}

// ── 重击倍率（冕层>=1时×1.5，C3 +25%） ──
export function aogusitaHeavyMult(self) {
  let mult = HEAVY_HP_MULT;
  if ((self.aogusitaCrown || 0) >= 1) mult *= HEAVY_CROWN_BOOST;
  if (self.chain >= 3) mult *= 1.25;
  return mult;
}

// ── 解放倍率（誓锋不殒 / 赫日威临） ──
export function aogusitaResolveBurstMult(self) {
  if (self.name !== '奥古斯塔') return null;
  if ((self.aogusitaWeiShe || 0) >= WEISHE_MAX) {
    let m = BURST_MAJESTIC_HP_MULT;
    let s = BURST_MAJESTIC_SIDE_MULT;
    if (self.chain >= 3) { m *= 1.25; s *= 1.25; }
    return { baseMain: m, baseSide: s };
  }
  return { baseMain: BURST_NORMAL_HP_MULT, baseSide: BURST_NORMAL_SIDE_MULT };
}

// ── 烈阳倍率（C3 +25%） ──
function sunstrikeMult(self) {
  let mult = SUNSTRIKE_HP_MULT;
  if (self.chain >= 3) mult *= 1.25;
  return mult;
}

// ── 普攻键替换（赫日威临窗口内替换为烈阳） ──
export function aogusitaResolveNormal(self, battle) {
  if (self.name !== '奥古斯塔' || !aogusitaInBurstWindow(self)) return null;
  return {
    mult: sunstrikeMult(self),
    dmgType: 'heavy',
    label: '烈阳',
    isSunstrike: true
  };
}

// ── 重击可用性（窗口内禁用） ──
export function aogusitaCanHeavy(self) {
  if (self.name !== '奥古斯塔') return null;
  if (aogusitaInBurstWindow(self)) {
    return { ok: false, err: '赫日威临窗口内重击不可用' };
  }
  return null;
}

// ── 解放可用性 ──
export function aogusitaCanBurst(self, battle) {
  if (self.name !== '奥古斯塔') return null;
  if (aogusitaInBurstWindow(self)) {
    return { ok: false, err: '赫日威临窗口内不可再次解放' };
  }
  if ((self.aogusitaWeiShe || 0) >= WEISHE_MAX) {
    const alive = battle?.enemies?.filter(e => e.alive);
    if (!alive || !alive.length) return { ok: false, err: '没有目标' };
    return { ok: true };
  }
  return null;
}

// ── 解放判定（威慑>=2→赫日威临使用resolveBurstMult, 否则标准路径） ──
export function aogusitaResolveBurst(self, battle) {
  return null;
}

// ── onBurst hook ──
export function aogusitaOnBurst(self, ctx) {
  if (self.name !== '奥古斯塔') return;
  const battle = ctx.battle;
  if ((self.aogusitaWeiShe || 0) >= WEISHE_MAX) {
    self.aogusitaWeiShe = 0;
    self.aogusitaBurstTurns = BURST_WINDOW_TURNS;
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `赫日威临展开 · 窗口 ${BURST_WINDOW_TURNS} 回合 · 普攻替换为烈阳 · 窗口结束时冕层清零`
    });
  } else {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '誓锋不殒'
    });
  }
}

// ── 变奏入场 ──
export function aogusitaSwitchIn({ to, battle }) {
  if (to?.name !== '奥古斯塔') return;
  if (to.chain >= 1) {
    gainCrown(to, 1, battle);
  }
  if (to.chain >= 4) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '奥古斯塔4链');
      t.buffs.push({ type: 'atkUp', value: 0.20, duration: 2, src: '奥古斯塔4链', installer: self.idx });
    });
    battle.log.push({
      type: 'mechanic', src: to.name,
      msg: '4 链 · 于荣辉中孤行 · 全队攻击 +20%（2 回合）'
    });
  }
}
registerSwitchHook('奥古斯塔', aogusitaSwitchIn);

// ── 战斗开始（炽盛决意: 威慑补至 1 层） ──
export function aogusitaBattleStart(self, ctx) {
  if (self.name !== '奥古斯塔') return;
  const battle = ctx?.battle;
  self.aogusitaCrown = 0;
  self.aogusitaWeiShe = Math.max(1, self.aogusitaWeiShe || 0);
  self.aogusitaBurstTurns = 0;
  if (battle) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `炽盛决意 · 威慑补至 ${self.aogusitaWeiShe} 层`
    });
  }
}

// ── 技能命中（C1+ 获得 1 层冕层） ──
export function aogusitaOnSkill(self, ctx) {
  if (self.name !== '奥古斯塔' || self.chain < 1) return;
  gainCrown(self, 1, ctx.battle);
}

// ── 重击命中（C1+ 获得 1 层冕层；C6 额外 +2 层 + 怒霆） ──
export function aogusitaOnHeavy(self, ctx) {
  if (self.name !== '奥古斯塔') return;
  const battle = ctx.battle;
  if (self.chain >= 1) {
    gainCrown(self, 1, battle);
  }
  if (self.chain >= 6 && (self.aogusitaCrown || 0) >= 1) {
    gainCrown(self, 2, battle);
    const target = battle?.enemies?.find(e => e.alive);
    if (target) {
      for (let i = 0; i < 2; i++) {
        const { dmg } = calcDamage(self, target, C6_NU_THUNDER_MULT, 'heavy', { explicitHpMult: true });
        const real = dealDamage(target, dmg);
        battle.log.push({
          type: 'mechanic', src: self.name, tgt: target.name,
          msg: `6 链 · 怒霆（HP×${(C6_NU_THUNDER_MULT*100).toFixed(1)}% · ${real} 伤害）`
        });
      }
    }
  }
}

// ── turnCleanup hook（每回合结束时调用） ──
export function aogusitaTick(self, battle) {
  if (self.name !== '奥古斯塔' || !aogusitaInBurstWindow(self)) return null;
  self.aogusitaBurstTurns = (self.aogusitaBurstTurns || 0) - 1;
  if (self.aogusitaBurstTurns <= 0) {
    self.aogusitaBurstTurns = 0;
    self.aogusitaCrown = 0;
    self.aogusitaWeiShe = 0;
    refreshCrownBuffs(self, battle);
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '赫日威临窗口结束 · 冕层与威慑全部清零'
    });
  }
  return null;
}

export function aogusitaTurnCleanup(self, ctx) {
  return aogusitaTick(self, ctx.battle);
}

// ── 徽章收集（战斗 UI 状态行） ──
export function aogusitaCollectBadges(self) {
  if (self.name !== '奥古斯塔') return [];
  const badges = [];
  const crown = self.aogusitaCrown || 0;
  const max = crownMax(self);
  const weiShe = self.aogusitaWeiShe || 0;
  const inWindow = aogusitaInBurstWindow(self);
  if (crown > 0 || inWindow) {
    badges.push(`<span style="color:var(--gold)">冕 ${crown}/${max}</span>`);
  }
  if (weiShe > 0 || inWindow) {
    badges.push(`<span style="color:#ff6b35">威慑 ${weiShe}/${WEISHE_MAX}</span>`);
  }
  if (inWindow) {
    badges.push(`<span style="color:#ff4444">赫日威临 ${self.aogusitaBurstTurns}回</span>`);
  }
  return badges;
}

export default {
  name: '奥古斯塔',
  hasHeavy: true,
  crown: aogusitaCrownLevel,
  weiShe: aogusitaWeiSheLevel,
  inBurstWindow: aogusitaInBurstWindow,
  canHeavy: aogusitaCanHeavy,
  canBurst: aogusitaCanBurst,
  hpMult: aogusitaHpMult,
  hpCore: aogusitaHpCore,
  skillMult: aogusitaSkillMult,
  heavyMult: aogusitaHeavyMult,
  resolveBurst: aogusitaResolveBurst,
  resolveBurstMult: aogusitaResolveBurstMult,
  resolveNormal: aogusitaResolveNormal,
  onBurst: aogusitaOnBurst,
  onSkill: aogusitaOnSkill,
  onHeavy: aogusitaOnHeavy,
  battleStart: aogusitaBattleStart,
  switchIn: aogusitaSwitchIn,
  tick: aogusitaTick,
  turnCleanup: aogusitaTurnCleanup,
  collectBadges: aogusitaCollectBadges
};
