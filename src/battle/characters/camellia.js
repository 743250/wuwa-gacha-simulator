// 椿「红椿·蕊/蕾 + 一日花 + 含苞」湮灭迅刀主C
//
// 创作者思路：椿是双资源管理型主C
//   红椿·蕊（gauge 0-100）：普攻/技能积攒，满时进入含苞状态
//   红椿·蕾：含苞状态下的次级资源
//   一日花：满红椿时释放（技能强化），消耗红椿进入含苞
//   含苞状态：攻击 +58%（3 链），酣梦倍率提升
//   6 链永生花：含苞期间协奏满时技能替换为永生花（一日花 100% 伤害）

export function camelliaEnterHanbao(self, battle) {
  if (self.name !== '椿') return;
  if (!self.forte?.ready) return;
  // 消耗红椿，进入含苞
  self.camelliaHanbao = true;
  self.forte.current = 0;
  self.forte.ready = false;
  battle.log.push({ type: 'mechanic', src: self.name, msg: '一日花绽放！进入含苞状态（攻击 +58%，酣梦强化）' });
  // 3 链：含苞期间攻击 +58%
  if (self.camelliaAttackBonus) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '含苞');
    self.buffs.push({ type: 'atkUp', value: self.camelliaAttackBonus, duration: 99, src: '含苞' });
  }
  // 6 链永生花标记
  if (self.camelliaEternalFlower) {
    self.camelliaEternalReady = true;
    battle.log.push({ type: 'mechanic', src: self.name, msg: '永生花就绪 · 协奏满时可释放' });
  }
}

// 含苞状态下伤害加成
export function camelliaHanbaoBonus(self) {
  if (self.name !== '椿' || !self.camelliaHanbao) return 1.0;
  // 酣梦基础倍率提升（6 链时从 100% → 250%）
  return self.camelliaDreamBonus || 1.0;
}

// 退出含苞（切换/战斗结束）
export function camelliaExitHanbao(self, battle) {
  if (self.name !== '椿' || !self.camelliaHanbao) return;
  self.camelliaHanbao = false;
  self.camelliaEternalReady = false;
  self.buffs = (self.buffs || []).filter(b => b.src !== '含苞');
  battle.log.push({ type: 'mechanic', src: self.name, msg: '含苞状态结束' });
}

export default {
  name: '椿',
  hasHeavy: true,
  enterHanbao: camelliaEnterHanbao,
  hanbaoBonus: camelliaHanbaoBonus,
  exitHanbao: camelliaExitHanbao
};
