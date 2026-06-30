// 赞妮「灼焰形态 / 焰光 / 重斩 / 终绝将至之刻」状态机
//
// 设计思路（HP 核 · 主C爆发）：
//   赞妮是"攒焰光→进灼焰形态→重斩连段消耗焰光→终结爆发"的爆发型主C。
//   灼焰形态 3 回合：普攻键替换为重斩（HP×12%，消耗 20 焰光），每回合自动 +10 焰光。
//   形态结束时自动施放终绝将至之刻（HP×20% × (1 + 焰光消耗加成)）。
//   3 链：每点焰光消耗 +2% 终绝加成（最多 +200%）。
//   6 链：重斩 ×1.4 + 终夜额外 +0.5%/点 + 焰光回复（每场 1 次）+ 致死不倒（每场 1 次）。
//
// 焰光来源（简化版烈阳余烬团队联动）：进灼焰形态 +50，每回合 +10。
//   官方需要队友上光噪效应→转化→汲取焰光的链条，回合制下合并为自动获取。

import { registerSwitchHook } from '../switchHooks.js';

// ── 常量 ──
const BLAZE_DURATION = 3;           // 灼焰形态持续 3 回合（含释放回合）
const BLAZE_FLAME_ON_ENTER = 50;    // 进入灼焰形态 +50 焰光
const BLAZE_FLAME_PER_TURN = 10;    // 灼焰形态内每回合 +10 焰光
const HEAVY_SLASH_FLAME_COST = 20;  // 重斩消耗 20 焰光
const HEAVY_SLASH_HP_MULT = 0.12;   // 重斩 HP × 12%
const NORMAL_HP_MULT = 0.04;        // 普攻 HP × 4%
const SKILL_HP_MULT = 0.075;        // 技能 HP × 7.5%
const HEAVY_HP_MULT = 0.09;         // 重击 HP × 9%（非灼焰形态）
const BURST_REKIND_HP_MULT = 0.16;  // 重燃主目标 HP × 16%
const BURST_REKIND_SIDE_MULT = 0.08;// 重燃副目标 HP × 8%
const BURST_FINAL_HP_MULT = 0.20;   // 终绝将至之刻 HP × 20%
const FINAL_BONUS_PER_FLAME_DEFAULT = 0.0;  // 默认无加成
const FINAL_BONUS_PER_FLAME_C3 = 0.02;      // 3 链每点焰光 +2%
const FINAL_BONUS_CAP_DEFAULT = 0.0;
const FINAL_BONUS_CAP_C3 = 2.0;             // 3 链最多 +200%
const HEAVY_SLASH_C6_MULT = 1.4;            // 6 链重斩 ×1.4
const FINAL_NIGHT_PER_FLAME_C6 = 0.005;     // 6 链终夜每点焰光额外 +0.5%
const C6_FLAME_REFILL_THRESHOLD = 70;       // 6 链焰光 <70 时回 70
const C6_FLAME_REFILL_TO = 70;

// ── 状态查询 ──
export function zanYanInBlaze(self) {
  return !!(self && self.name === '赞妮' && (self.zanYanFormTurns || 0) > 0);
}

export function zanYanFlame(self) {
  return self?.name === '赞妮' ? (self.zanYanFlameGauge || 0) : 0;
}

// ── HP 核倍率覆写（combat.js calcDamage 调用） ──
export function zanYanHpMult(dmgType) {
  switch (dmgType) {
    case 'normal': return NORMAL_HP_MULT;
    case 'skill':  return SKILL_HP_MULT;
    case 'heavy':  return HEAVY_HP_MULT;
    case 'burst':  return BURST_REKIND_HP_MULT;  // 重燃主目标
    default:       return null;
  }
}

// ── 重斩倍率（含 6 链加成） ──
export function zanYanHeavySlashMult(self) {
  let mult = HEAVY_SLASH_HP_MULT;
  if (self.chain >= 6) mult *= HEAVY_SLASH_C6_MULT;
  return mult;
}

// ── 终绝将至之刻倍率（HP × 20% × (1 + 焰光消耗加成)） ──
export function zanYanFinalMult(self) {
  const consumed = self.zanYanFlameConsumed || 0;
  let perFlame = FINAL_BONUS_PER_FLAME_DEFAULT;
  let cap = FINAL_BONUS_CAP_DEFAULT;
  if (self.chain >= 3) {
    perFlame = FINAL_BONUS_PER_FLAME_C3;
    cap = FINAL_BONUS_CAP_C3;
  }
  const bonus = Math.min(cap, consumed * perFlame);
  return BURST_FINAL_HP_MULT * (1 + bonus);
}

// ── 重燃倍率（5 链 +120%） ──
export function zanYanRekindleMult(self) {
  let mult = BURST_REKIND_HP_MULT;
  if (self.chain >= 5) mult *= 2.2;  // +120% = ×2.2
  return mult;
}

// ── 进入灼焰形态（解放·重燃触发） ──
export function zanYanEnterBlaze(self, battle) {
  if (self.name !== '赞妮') return;
  self.zanYanFormTurns = BLAZE_DURATION;
  self.zanYanFlameGauge = Math.min(100, (self.zanYanFlameGauge || 0) + BLAZE_FLAME_ON_ENTER);
  self.zanYanFlameConsumed = 0;  // 重置消耗计数（每场形态独立）
  self.zanYanLethalUsed = self.zanYanLethalUsed || false;
  self.zanYanFlameRefillUsed = self.zanYanFlameRefillUsed || false;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `「灼焰形态」展开 · 焰光 +${BLAZE_FLAME_ON_ENTER}（${self.zanYanFlameGauge}/100）· 持续 ${BLAZE_DURATION} 回合 · 普攻替换为重斩`
  });
}

// ── 普攻键替换为重斩（灼焰形态内） ──
// 返回 { mult, dmgType, label, isHeavySlash } 或 null（非灼焰形态）
export function zanYanResolveNormal(self, battle) {
  if (self.name !== '赞妮' || !zanYanInBlaze(self)) return null;
  if ((self.zanYanFlameGauge || 0) < HEAVY_SLASH_FLAME_COST) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `焰光不足（${self.zanYanFlameGauge || 0} < ${HEAVY_SLASH_FLAME_COST}）· 重斩无法释放，转为普攻`
    });
    return null;  // 焰光不足时退化为普攻
  }
  return {
    mult: zanYanHeavySlashMult(self),
    dmgType: 'heavy',
    label: '重斩 · 破晓',
    isHeavySlash: true,
    flameCost: HEAVY_SLASH_FLAME_COST
  };
}

// ── 重斩消耗焰光（普攻键重斩路径调用） ──
export function zanYanSpendFlameForSlash(self, battle) {
  if (self.name !== '赞妮' || !zanYanInBlaze(self)) return;
  const cost = HEAVY_SLASH_FLAME_COST;
  const before = self.zanYanFlameGauge || 0;
  self.zanYanFlameGauge = Math.max(0, before - cost);
  self.zanYanFlameConsumed = (self.zanYanFlameConsumed || 0) + cost;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `重斩消耗焰光 ${cost}（${before} → ${self.zanYanFlameGauge}）· 累计消耗 ${self.zanYanFlameConsumed}`
  });
}

// ── 灼焰形态内每回合 +10 焰光（烈阳余烬简化转化） ──
function zanYanGainFlamePerTurn(self, battle) {
  if (!zanYanInBlaze(self)) return;
  const before = self.zanYanFlameGauge || 0;
  self.zanYanFlameGauge = Math.min(100, before + BLAZE_FLAME_PER_TURN);
  if (self.zanYanFlameGauge !== before) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `烈阳余烬转化 · 焰光 +${BLAZE_FLAME_PER_TURN}（${before} → ${self.zanYanFlameGauge}）`
    });
  }
}

// ── 6 链焰光回复（每场 1 次，焰光 <70 时回 70） ──
function zanYanC6FlameRefill(self, battle) {
  if (self.chain < 6 || self.zanYanFlameRefillUsed) return;
  if (!zanYanInBlaze(self)) return;
  if ((self.zanYanFlameGauge || 0) >= C6_FLAME_REFILL_THRESHOLD) return;
  const before = self.zanYanFlameGauge || 0;
  self.zanYanFlameGauge = C6_FLAME_REFILL_TO;
  self.zanYanFlameRefillUsed = true;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `6 链 · 焰光回复（每场 1 次）· ${before} → ${self.zanYanFlameGauge}`
  });
}

// ── 终绝将至之刻（灼焰形态结束时自动施放） ──
// 状态机只标记 pending + 准备参数，伤害结算由 combat.js 执行（避免 ESM 循环依赖）
export function zanYanPrepareFinal(self, battle) {
  if (self.name !== '赞妮') return null;
  if (!self.alive) return null;  // 赞妮在灼焰形态持续期间阵亡则不触发
  const mult = zanYanFinalMult(self);
  const consumed = self.zanYanFlameConsumed || 0;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `灼焰形态结束 · 即将施放终绝将至之刻（HP × ${(mult*100).toFixed(1)}% · 消耗焰光 ${consumed}）`
  });
  return { mult, consumed };
}

// ── turnCleanup hook（每回合结束时调用） ──
// 返回 { pendingFinal: true, mult } 表示需触发终绝，combat.js 接管结算
export function zanYanTick(self, battle) {
  if (self.name !== '赞妮') return null;
  if (!zanYanInBlaze(self)) return null;
  // 6 链焰光回复优先（每场 1 次）
  zanYanC6FlameRefill(self, battle);
  // 形态回合数 -1
  self.zanYanFormTurns = (self.zanYanFormTurns || 0) - 1;
  if (self.zanYanFormTurns <= 0) {
    const prep = zanYanPrepareFinal(self, battle);
    // 退出形态、清空焰光
    self.zanYanFormTurns = 0;
    self.zanYanFlameGauge = 0;
    if (prep) return { pendingFinal: true, mult: prep.mult };
    return null;
  }
  // 形态内每回合 +10 焰光
  zanYanGainFlamePerTurn(self, battle);
  return null;
}

// ── 6 链致死不倒（每场 1 次，灼焰形态内） ──
export function zanYanOnLethal(self, battle) {
  if (self.name !== '赞妮') return false;
  if (self.chain < 6) return false;
  if (self.zanYanLethalUsed) return false;
  if (!zanYanInBlaze(self)) return false;
  self.zanYanLethalUsed = true;
  self.hp = 1;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: '6 链 · 致死不倒（每场 1 次）· 保留 1 点生命'
  });
  return true;
}

// ── 变奏入场 hook（4 链全队攻击 +20% · 2 回合） ──
export function zanYanSwitchIn({ to, battle }) {
  if (to?.name !== '赞妮') return;
  // 变奏入场伤害 atk × 3%（HP 核 → 用 HP × 3%）—— 由 combat.js doSwitch 处理基础变奏伤害
  // 这里只挂 4 链全队 buff
  if (to.chain >= 4) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '赞妮4链');
      t.buffs.push({ type: 'atkUp', value: 0.20, duration: 2, src: '赞妮4链' });
    });
    battle.log.push({
      type: 'mechanic', src: '赞妮',
      msg: '4 链 · 即刻执行 · 全队攻击 +20%（2 回合）'
    });
  }
}
registerSwitchHook('赞妮', zanYanSwitchIn);

// ── onBurst hook（解放·重燃进入灼焰形态） ──
export function zanYanOnBurst(self, ctx) {
  if (self.name !== '赞妮') return;
  zanYanEnterBlaze(self, ctx.battle);
}

// ── 徽章收集（战斗 UI 状态行） ──
export function zanYanCollectBadges(self) {
  if (self.name !== '赞妮') return [];
  const badges = [];
  if (zanYanInBlaze(self)) {
    badges.push(`<span style="color:var(--gold)">灼焰 ${self.zanYanFormTurns}回</span>`);
  }
  const flame = self.zanYanFlameGauge || 0;
  if (flame > 0 || zanYanInBlaze(self)) {
    badges.push(`<span style="color:#ff9b3a">焰光 ${flame}/100</span>`);
  }
  if (self.zanYanFlameConsumed > 0) {
    badges.push(`<span style="color:#666">已耗焰光 ${self.zanYanFlameConsumed}</span>`);
  }
  return badges;
}

export default {
  name: '赞妮',
  hasHeavy: true,
  inBlaze: zanYanInBlaze,
  hpMult: zanYanHpMult,
  heavySlashMult: zanYanHeavySlashMult,
  finalMult: zanYanFinalMult,
  rekindleMult: zanYanRekindleMult,
  enterBlaze: zanYanEnterBlaze,
  resolveNormal: zanYanResolveNormal,
  spendFlameForSlash: zanYanSpendFlameForSlash,
  onLethal: zanYanOnLethal,
  tick: zanYanTick,
  switchIn: zanYanSwitchIn,
  onBurst: zanYanOnBurst,
  collectBadges: zanYanCollectBadges
};
