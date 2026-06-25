// 忌炎「锐意之势」状态机
//
// 创作者思路：忌炎是「攒势 → 解放终结」的爆发型主C
//   每次 重击 / 共鸣技能 / 变奏(切入) 积 1 层【锐意之势】，上限默认 2，6 链 3
//   释放共鸣解放时消耗全部锐意，每层放大解放伤害（默认 +100%，6 链 +120%）
//   3 链 观势：任何技能动作后，自身暴击 +16% / 暴伤 +32% / 2 回合

export function jiyanGainRuiyi(self, source, battle) {
  if (self.name !== '忌炎') return;
  const cap = self.jiyanRuiyiCap || 2;
  const before = self.ruiyi || 0;
  self.ruiyi = Math.min(cap, before + 1);
  if (self.ruiyi > before) {
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${source} → 锐意之势 ${self.ruiyi}/${cap}` });
  }
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
  if (self.ruiyi > 0) {
    ruiyiUsed = self.ruiyi;
    ruiyiMult = 1.0 + ruiyiUsed * (self.jiyanRuiyiPerStack || 1.0);
    self.ruiyi = 0;
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `消耗锐意之势 ${ruiyiUsed} 层 → 解放伤害 ×${ruiyiMult.toFixed(1)}`
    });
  }
  return { ruiyiMult, ruiyiUsed };
}

// 解放后 4 链奇正
export function jiyanQiZheng(self, battle) {
  if (!self.jiyanQiZheng) return;
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

export default {
  name: '忌炎',
  hasHeavy: true,
  renderBattleStatus(unit) {
    const cap = unit.jiyanRuiyiCap || 2;
    const cur = unit.ruiyi || 0;
    const perStack = unit.jiyanRuiyiPerStack || 1.0;
    const nextMult = 1 + cur * perStack;
    const color = cur >= cap ? 'var(--red)' : cur > 0 ? 'var(--gold)' : 'var(--muted)';
    return `<div style="font-size:9px;color:${color};margin-top:2px;letter-spacing:.3px">锐意之势 ${'◆'.repeat(cur)}${'◇'.repeat(cap - cur)} ${cur}/${cap}${cur > 0 ? ` · 解放 ×${nextMult.toFixed(1)}` : ''}</div>`;
  },
  gainRuiyi: jiyanGainRuiyi,
  guanShi: jiyanGuanShiBuff,
  burstRuiyi: jiyanBurstRuiyi,
  qiZheng: jiyanQiZheng,
  switchIn: jiyanSwitchIn
};
