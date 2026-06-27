// 坎特蕾拉「迷离 / 蜃境 / 惊醒」湮灭音感仪副C
//
// 创作者思路：坎特蕾拉是三层递进机制型副C
//   迷离（gauge 0-100）：普攻/技能积攒，满时进入蜃境
//   蜃境：迷离满时触发，解放伤害 ×1.8，治疗加成 +25%（4 链）
//   惊醒：迷梦目标受到非迷梦伤害时触发额外湮灭伤害
//   感知汲取（1 链）：技能伤害 +50%，免打断
//   3 链：解放后直接进入蜃境

export function cantarellaEnterMirage(self, battle) {
  if (self.name !== '坎特蕾拉') return;
  self.cantarellaMirage = true;
  battle.log.push({ type: 'mechanic', src: self.name, msg: '进入蜃境 · 解放伤害 ×1.8' + (self.cantarellaMirageHeal ? ' · 治疗 +25%' : '') });
  // 4 链：蜃境期间治疗加成 +25%
  if (self.cantarellaMirageHeal) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '蜃境治疗');
    self.buffs.push({ type: 'healUp', value: 0.25, duration: 99, src: '蜃境治疗' });
  }
}

export function cantarellaExitMirage(self, battle) {
  if (self.name !== '坎特蕾拉' || !self.cantarellaMirage) return;
  self.cantarellaMirage = false;
  self.buffs = (self.buffs || []).filter(b => b.src !== '蜃境治疗');
  battle.log.push({ type: 'mechanic', src: self.name, msg: '蜃境消散' });
}

// 惊醒：迷梦目标受到非迷梦攻击时的额外伤害
export function cantarellaAwaken(self, target, battle) {
  if (self.name !== '坎特蕾拉' || !target?.cantarellaDream) return 0;
  if (!self.cantarellaAwakenBonus) return 0;
  // 惊醒触发（单次）
  const awakenDmg = self.cantarellaAwakenBonus;
  delete target.cantarellaDream;
  battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 惊醒！额外湮灭伤害` });
  return awakenDmg;
}

// 钩织迷梦（2 链效果：解放后给主目标挂迷梦）
export function cantarellaMarkDream(self, target, battle) {
  if (self.name !== '坎特蕾拉' || !target?.alive) return;
  target.cantarellaDream = true;
  battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 陷入迷梦（受到非迷梦伤害触发惊醒）` });
}

export default {
  name: '坎特蕾拉',
  hasHeavy: true,
  enterMirage: cantarellaEnterMirage,
  exitMirage: cantarellaExitMirage,
  awaken: cantarellaAwaken,
  markDream: cantarellaMarkDream
};
