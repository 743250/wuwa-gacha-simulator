// 长离「离火 / 心眼」热熔迅刀主C
//
// 创作者思路：长离是「攒离火 → 心眼派生重击焚身以火」的连段型主C
//   普攻/技能积离火（上限 6），满离火时普攻变为心眼派生 → 重击焚身以火（×2.2）
//   2 链循我所望：获得离火时暴击 +25%/8s
//   6 链成我所谋：无视 40% 防御

export function changliGainLihuo(self, amount, source, battle) {
  if (self.name !== '长离') return;
  if (!self.forte || self.forte.resourceName !== '离火') return;
  const before = self.forte.current;
  self.forte.current = Math.min(self.forte.max, before + amount);
  if (self.forte.current >= self.forte.max) self.forte.ready = true;
  if (self.forte.current > before) {
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${source} → 离火 ${self.forte.current}/${self.forte.max}` });
  }
  // 2 链：获得离火时暴击 +25%
  if (self.changliXunWang && self.forte.current > before) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '循我所望');
    self.buffs.push({ type: 'crateUp', value: 0.25, duration: 9, src: '循我所望' });
  }
}

// 心眼派生重击（满离火时普攻自动触发焚身以火）
export function changliMindEye(self, battle) {
  if (self.name !== '长离') return false;
  if (!self.forte?.ready || self.forte.effectType !== 'enhancedNormal') return false;
  // 心眼触发 — 由 combat.js 在普攻前检测并改为重击结算
  return true;
}

export default {
  name: '长离',
  hasHeavy: true,
  gainLihuo: changliGainLihuo,
  mindEye: changliMindEye
};
