// 忌炎「锐意之势」状态机
//
// 创作者思路：忌炎是「攒势 → 解放终结」的爆发型主C
//   每次 重击 / 共鸣技能 / 变奏(切入) 积 1 层【锐意之势】，上限默认 2，6 链 3
//   释放共鸣解放时消耗全部锐意，每层放大解放伤害（默认 +100%，6 链 +120%）
//   3 链 观势：任何技能动作后，自身暴击 +16% / 暴伤 +32% / 2 回合

import { registerStack, gainStack, consumeStack, getStack, getStackCap, renderStacks } from '../stacks.js';
import { registerSwitchHook } from '../switchHooks.js';

// 锐意之势：无衰减（解放时全消耗）
registerStack('jiyan_ruiyi', {
  cap: (unit) => unit.jiyanRuiyiCap || 2,
  onGain(unit, battle, after, _before, source) {
    const cap = getStackCap(unit, 'jiyan_ruiyi');
    battle.log.push({ type: 'mechanic', src: unit.name, msg: `${source} → 锐意之势 ${after}/${cap}` });
  },
  // 渲染：用于角色 file 的 renderBattleStatus
  render(unit) {
    const cap = unit.jiyanRuiyiCap || 2;
    const cur = getStack(unit, 'jiyan_ruiyi');
    const perStack = unit.jiyanRuiyiPerStack || 1.0;
    const nextMult = 1 + cur * perStack;
    const color = cur >= cap ? 'var(--red)' : cur > 0 ? 'var(--gold)' : 'var(--muted)';
    return `<div style="font-size:9px;color:${color};margin-top:2px;letter-spacing:.3px">锐意之势 ${'◆'.repeat(cur)}${'◇'.repeat(cap - cur)} ${cur}/${cap}${cur > 0 ? ` · 解放 ×${nextMult.toFixed(1)}` : ''}</div>`;
  }
});

// 向后兼容：旧调用方仍传 self/source/battle
export function jiyanGainRuiyi(self, source, battle) {
  if (self.name !== '忌炎') return;
  gainStack(self, 'jiyan_ruiyi', source, battle);
}

// onSkill hook：共鸣技能积锐意 + 3 链观势
export function jiyanOnSkill(self, ctx) {
  if (self.name !== '忌炎') return;
  const battle = ctx.battle;
  jiyanGainRuiyi(self, '共鸣技能', battle);
  jiyanGuanShiBuff(self, battle);
}

// onHeavy hook：重击积锐意 + 3 链观势
export function jiyanOnHeavy(self, ctx) {
  if (self.name !== '忌炎') return;
  const battle = ctx.battle;
  jiyanGainRuiyi(self, '重击', battle);
  jiyanGuanShiBuff(self, battle);
}

export function jiyanGuanShiBuff(self, battle) {
  if (self.name !== '忌炎' || !self.jiyanGuanShi) return;
  const cfg = self.jiyanGuanShi;
  self.buffs = (self.buffs || []).filter(b => b.src !== '观势');
  self.buffs.push({ type: 'crateUp', value: cfg.crate, duration: cfg.dur + 1, src: '观势' });
  self.buffs.push({ type: 'cdmgUp',  value: cfg.cdmg,  duration: cfg.dur + 1, src: '观势' });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `观势 · 暴击 +${(cfg.crate*100).toFixed(0)}% / 暴伤 +${(cfg.cdmg*100).toFixed(0)}%（${cfg.dur} 回合）`
  });
}

// 解放前计算锐意倍率，返回 { mult, used }
export function jiyanBurstRuiyi(self, battle) {
  let ruiyiMult = 1.0;
  let ruiyiUsed = 0;
  if (self.name !== '忌炎') return { ruiyiMult, ruiyiUsed };
  ruiyiUsed = consumeStack(self, 'jiyan_ruiyi', battle);
  if (ruiyiUsed > 0) {
    ruiyiMult = 1.0 + ruiyiUsed * (self.jiyanRuiyiPerStack || 1.0);
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `消耗锐意之势 ${ruiyiUsed} 层 → 解放伤害 ×${ruiyiMult.toFixed(1)}`
    });
  }
  return { ruiyiMult, ruiyiUsed };
}

// 解放后 4 链奇正
export function jiyanQiZheng(self, battle) {
  if (self.name !== '忌炎' || !self.jiyanQiZheng) return;
  const cfg = self.jiyanQiZheng;
  battle.team.forEach(t => {
    if (!t.alive) return;
    t.buffs = (t.buffs || []).filter(b => b.src !== '奇正');
    t.buffs.push({ type: 'heavyDmgUp', value: cfg.value, duration: cfg.dur + 1, src: '奇正' });
  });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `奇正 · 全队重击伤害 +${(cfg.value*100).toFixed(0)}%（${cfg.dur} 回合）`
  });
}

// onBurst hook：解放后 3 链观势 + 4 链奇正（锐意倍率由 jiyanBurstRuiyi 在结算前具名调用）
export function jiyanOnBurst(self, ctx) {
  if (self.name !== '忌炎') return;
  const battle = ctx.battle;
  jiyanGuanShiBuff(self, battle);
  jiyanQiZheng(self, battle);
}

// 变奏入场：锐意 + 2 链通变 + 5 链明断 + 3 链观势
export function jiyanSwitchIn(self, battle) {
  jiyanGainRuiyi(self, '变奏入场', battle);
  jiyanGuanShiBuff(self, battle);
  if (self.jiyanTongBian) {
    const cfg = self.jiyanTongBian;
    if (self.forte && cfg.forteGain > 0) {
      self.forte.current = Math.min(self.forte.max, self.forte.current + cfg.forteGain);
      if (self.forte.current >= self.forte.max) self.forte.ready = true;
    }
    self.buffs = (self.buffs || []).filter(b => b.src !== '通变');
    self.buffs.push({ type: 'atkUp', value: cfg.atkUp, duration: cfg.dur + 1, src: '通变' });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `通变 · 破阵值 +${cfg.forteGain} · 攻击 +${(cfg.atkUp*100).toFixed(0)}%（${cfg.dur} 回合）`
    });
  }
  if (self.jiyanMingDuan) {
    const cfg = self.jiyanMingDuan;
    self.buffs = (self.buffs || []).filter(b => b.src !== '明断');
    self.buffs.push({ type: 'atkUp', value: cfg.value, duration: cfg.dur + 1, src: '明断' });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `明断 · 攻击 +${(cfg.value*100).toFixed(0)}%（${cfg.dur} 回合）`
    });
  }
}

// Step E：切人入场钩子（锐意 + 通变 / 明断 / 观势）
registerSwitchHook('忌炎', ({ to, battle }) => jiyanSwitchIn(to, battle));

// 徽章数组版本
export function collectJiyanBadges(unit) {
  if (unit.name !== '忌炎') return [];
  const cap = unit.jiyanRuiyiCap || 2;
  const cur = getStack(unit, 'jiyan_ruiyi');
  if (cur <= 0) return [];
  const perStack = unit.jiyanRuiyiPerStack || 1.0;
  const nextMult = 1 + cur * perStack;
  return [{
    key: 'ruiyi', cls: 'field', icon: '◆',
    label: `锐意 ${cur}/${cap} · 解放 ×${nextMult.toFixed(1)}`,
    tip: `<b>锐意之势</b><br>每层提升解放倍率 ×${perStack.toFixed(1)}。当前 ${cur}/${cap} 层 → 解放倍率 ×${nextMult.toFixed(1)}。`
  }];
}

export default {
  name: '忌炎',
  hasHeavy: true,
  renderBattleStatus(unit) {
    return renderStacks(unit);
  },
  collectBadges: collectJiyanBadges,
  gainRuiyi: jiyanGainRuiyi,
  guanShi: jiyanGuanShiBuff,
  onSkill: jiyanOnSkill,
  onHeavy: jiyanOnHeavy,
  burstRuiyi: jiyanBurstRuiyi,
  qiZheng: jiyanQiZheng,
  onBurst: jiyanOnBurst,
  switchIn: jiyanSwitchIn
};
