// 吟霖「审判印记」标记型副C
//
//   普攻 / 共鸣技能积"审判值"，满 100 自动触发"审判之雷" → 给当前主目标挂"审判印记"
//   印记挂在敌人身上，所有攻击者命中印记目标时，按印记层数额外增伤（3 链 +15%/层）
//   吟霖自己 1 链/5 链对印记目标技能/解放追加倍率
//   2 链：吟霖命中印记目标 +5 审判 +5 能量；4 链：触发审判之雷时全队 atk +20%/2 回合
//   6 链：解放后 2 回合，吟霖普攻命中印记目标额外触发疾霆昭彰（atk×100% 导电，每回合 1 次）

const MARK_CAP = 3;
const MARK_DURATION = 3;

function yinlinAddMark(target, layers) {
  const before = target.judgeMark;
  if (before) {
    target.judgeMark = {
      layers: Math.min(MARK_CAP, before.layers + layers),
      remaining: MARK_DURATION
    };
  } else {
    target.judgeMark = { layers: Math.min(MARK_CAP, layers), remaining: MARK_DURATION };
  }
}

function yinlinTriggerJudgment(self, battle, source) {
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return;
  const targetIdx = (typeof battle.targetIdx === 'number') ? battle.targetIdx : -1;
  const target = (battle.enemies[targetIdx] && battle.enemies[targetIdx].alive) ? battle.enemies[targetIdx] : aliveEnemies[0];
  yinlinAddMark(target, 1);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `审判之雷！${source} 满审判值 → ${target.name} 获得审判印记`
  });
  if (self.yinlinJudgmentTeamAtk) {
    const cfg = self.yinlinJudgmentTeamAtk;
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '前行的鼓舞');
      t.buffs.push({ type: 'atkUp', value: cfg.value, duration: cfg.dur + 1, src: '前行的鼓舞' });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `前行的鼓舞 · 全队攻击 +${(cfg.value * 100).toFixed(0)}%（${cfg.dur} 回合）`
    });
  }
}

export function yinlinGainVerdict(self, amount, source, battle) {
  if (self.name !== '吟霖') return;
  const before = self.verdict || 0;
  self.verdict = Math.min(100, before + amount);
  if (self.verdict >= 100) {
    self.verdict = 0;
    yinlinTriggerJudgment(self, battle, source);
  } else if (self.verdict > before) {
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${source} → 审判值 ${self.verdict}/100` });
  }
}

// 吟霖普攻/技能命中后：若目标有印记，2 链给吟霖 +5 审判 +5 能量；命中本身也叠 1 层
export function yinlinOnHit(self, target, dmgType, battle, helpers) {
  if (self.name !== '吟霖') return;
  if (!target || !target.judgeMark) return;
  if (self.yinlinMarkRefund) {
    self.verdict = Math.min(100, (self.verdict || 0) + self.yinlinMarkRefund.verdict);
    self.energy = Math.min(self.energyMax, Math.round(self.energy + self.yinlinMarkRefund.energy));
  }
  yinlinAddMark(target, 1);
  if (dmgType === 'normal' && self.yinlinJiTingActive && !self._jiTingFiredThisTurn && self.yinlinJiTing) {
    self._jiTingFiredThisTurn = true;
    const { dmg, crit } = helpers.calcDamage(self, target, self.yinlinJiTing.value, 'skill');
    const real = helpers.dealDamage(target, dmg);
    battle.log.push({
      type: 'attack', src: self.name, tgt: target.name, dmg: real, crit,
      action: '疾霆昭彰（6 链）'
    });
  }
}

// 解放后：主目标必挂印记 + 4 链全队 atk buff + 6 链开启疾霆窗口
export function yinlinBurst(self, primary, battle) {
  yinlinAddMark(primary, 1);
  battle.log.push({ type: 'mechanic', src: self.name, msg: `破天雷灭击 → ${primary.name} 获得审判印记` });
  if (self.yinlinJudgmentTeamAtk) {
    const cfg = self.yinlinJudgmentTeamAtk;
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '前行的鼓舞');
      t.buffs.push({ type: 'atkUp', value: cfg.value, duration: cfg.dur + 1, src: '前行的鼓舞' });
    });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `前行的鼓舞 · 全队攻击 +${(cfg.value*100).toFixed(0)}%（${cfg.dur} 回合）` });
  }
  if (self.yinlinJiTing) {
    self.yinlinJiTingActive = self.yinlinJiTing.dur + 1;
    battle.log.push({ type: 'mechanic', src: self.name, msg: `疾霆昭彰 · 普攻命中印记目标额外触发（持续 ${self.yinlinJiTing.dur} 回合）` });
  }
}

// endTurn 清理
export function yinlinTurnCleanup(self, battle) {
  if (self.yinlinJiTingActive > 0) {
    self.yinlinJiTingActive--;
    if (self.yinlinJiTingActive === 0) {
      battle.log.push({ type: 'mechanic', src: self.name, msg: '疾霆昭彰 · 效果结束' });
    }
  }
  self._jiTingFiredThisTurn = false;
}

export default {
  name: '吟霖',
  hasHeavy: false,
  gainVerdict: yinlinGainVerdict,
  onHit: yinlinOnHit,
  burst: yinlinBurst,
  turnCleanup: yinlinTurnCleanup
};
