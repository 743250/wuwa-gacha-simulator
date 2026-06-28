// 今汐「韶光层数 / 惊蛰」爆发型主C
//
// 创作者思路：今汐是「攒韶光 → 惊龙破空」的爆发流主C
//   普攻/技能积韶光层数（上限 4），满层时共鸣技能进入惊龙破空强化形态
//   1 链惊蛰：普攻/逐天取月额外叠惊蛰层（4 层），惊龙破空消耗惊蛰 +20%/层
//   3 链谪仙：变奏入场获得攻击 +25%/层 ×2 层

import { registerSwitchHook } from '../switchHooks.js';

export function jinhsiSwitchIn(self, battle) {
  if (self.name !== '今汐') return;
  // 3 链谪仙：变奏入场攻击 +50%（2 层 ×25%）
  if (self.jinhsiZheXian) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '谪仙');
    self.buffs.push({ type: 'atkUp', value: 0.50, duration: 21, src: '谪仙' });
    battle.log.push({ type: 'mechanic', src: self.name, msg: '谪仙 · 攻击 +50%（2 层）' });
  }
  // 变奏入场积韶光（2 层）
  if (self.forte && self.forte.resourceName === '韶光层数') {
    self.forte.current = Math.min(self.forte.max, self.forte.current + 2);
    if (self.forte.current >= self.forte.max) self.forte.ready = true;
  }
}

// Step E：切人入场钩子（3 链谪仙 + 韶光 +2）
registerSwitchHook('今汐', ({ to, battle }) => jinhsiSwitchIn(to, battle));

export default {
  name: '今汐',
  hasHeavy: true,
  switchIn: jinhsiSwitchIn
};
