// 布兰特「航路 / 火焰归亡曲」热熔迅刀辅助
//
// 创作者思路：布兰特是带治疗/护盾的辅助型角色，核心为空中攻击 + 火焰归亡曲
//   航路（gauge 0-100）：普攻/技能积攒，满时火焰归亡曲伤害 +60% + 全队治疗
//   空中攻击派生：变奏入场后获得 3 层「乘风」（每层 +20% 伤害）
//   火焰归亡曲：满航路时解放额外造成普攻伤害 + 全队回血
//   4 链：护盾量 +20% + 全队回血
//   6 链：解放后再燃（火焰归亡曲 30% 热熔伤害）

export function brantGainWindRide(self, battle) {
  if (self.name !== '布兰特') return;
  self.brantWindRide = Math.min(3, (self.brantWindRide || 0) + 1);
  const stacks = self.brantWindRide;
  battle.log.push({ type: 'mechanic', src: self.name, msg: `乘风 ${stacks}/3（伤害 +${stacks * 20}%）` });
}

// 乘风增伤
export function brantWindRideBonus(self) {
  if (self.name !== '布兰特') return 1.0;
  return 1.0 + (self.brantWindRide || 0) * 0.20;
}

// 火焰归亡曲：满航路解放时全队治疗 + 再燃
export function brantFlameDirge(self, battle) {
  if (self.name !== '布兰特') return;
  if (!self.forte?.ready) return;
  // 全队治疗
  const healAmt = Math.round(self.atk * 1.5 * (1 + (self.healBonus || 0)));
  battle.team.forEach(t => {
    if (!t.alive) return;
    const healed = Math.min(t.hpMax - t.hp, healAmt);
    t.hp += healed;
    if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed, msg: '火焰归亡曲治疗' });
  });
  // 6 链再燃标记
  if (self.brantReignite) {
    self.brantReignitePending = true;
    battle.log.push({ type: 'mechanic', src: self.name, msg: '再燃就绪（下次普攻额外触发）' });
  }
}

export default {
  name: '布兰特',
  hasHeavy: true,
  gainWindRide: brantGainWindRide,
  windRideBonus: brantWindRideBonus,
  flameDirge: brantFlameDirge
};
