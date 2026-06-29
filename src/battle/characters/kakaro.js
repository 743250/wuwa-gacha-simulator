// 卡卡罗「杀意 / Deathblade 形态」导电长刃主C
//
// 创作者思路：卡卡罗是「蓄杀意 → 杀戮武装 → 死告」的爆发型主C
//   杀意（state 0-100）：普攻/技能积攒，解放期间直接拉满
//   杀戮武装（Deathblade）：解放进入，普攻/技能 +50%（3 链额外导电 +25%）
//   死告（重击）：解放期间重击「死告」额外召唤猎杀影协同（6 链）

export function kakaroEnterDeathblade(self, battle) {
  if (self.name !== '卡卡罗') return;
  self.kakaroDeathblade = 3; // 持续 3 回合（含当回合）
  battle.log.push({ type: 'mechanic', src: self.name, msg: '杀戮武装（Deathblade）· 普攻/技能 +50%' });
}

export function kakaroDeathbladeBonus(self, dmgType) {
  if (self.name !== '卡卡罗' || !self.kakaroDeathblade || self.kakaroDeathblade <= 0) return 1.0;
  if (dmgType === 'normal' || dmgType === 'skill') return 1.5;
  return 1.0;
}

// 死告（6 链：重击时额外召唤猎杀影协同）
export function kakaroShikaku(self, target, dmg, battle) {
  if (self.name !== '卡卡罗' || !target?.alive) return;
  if (!self.kakaroShikakuSummon) return;
  // 每人形分身造成 100% atk 导电伤害
  const extraDmg = Math.round(self.atk * 2.0); // 2 个分身影
  target.hp = Math.max(0, target.hp - extraDmg);
  if (target.hp <= 0) target.alive = false;
  battle.log.push({ type: 'attack', src: self.name, tgt: target.name, dmg: extraDmg, crit: false, action: '死告·猎杀影协同（6 链）' });
}

// onBurst hook：解放进入杀戮武装形态
export function kakaroOnBurst(self, ctx) {
  if (self.name !== '卡卡罗') return;
  kakaroEnterDeathblade(self, ctx.battle);
}

export function kakaroTurnCleanup(self, ctx) {
  if (self.name !== '卡卡罗') return;
  const battle = ctx.battle;
  if (self.kakaroDeathblade > 0) {
    self.kakaroDeathblade--;
    if (self.kakaroDeathblade === 0) {
      battle.log.push({ type: 'mechanic', src: self.name, msg: '杀戮武装结束' });
    }
  }
}

export default {
  name: '卡卡罗',
  hasHeavy: true,
  enterDeathblade: kakaroEnterDeathblade,
  deathbladeBonus: kakaroDeathbladeBonus,
  shikaku: kakaroShikaku,
  onBurst: kakaroOnBurst,
  turnCleanup: kakaroTurnCleanup
};
