// 椿「红椿·蕊 → 永生花 → 含苞酣梦」状态机
//
// 创作者思路：椿是双资源管理型主C
//   红椿·蕊（gauge 0-100）：普攻 +10 / 技能 +15 / 解放 +30 / 变奏 +20
//   协奏（per-unit 0-100）：通用协奏机制积累
//   永生花：红椿·蕊满 100 + 协奏 ≥ 50 时，共鸣技能替换为永生花
//           消耗 50 红椿·蕊 + 50 协奏，造成 atk × 250% 湮灭，进入含苞 3 回合
//   含苞 · 酣梦：3 回合，普攻/技能 ×1.5（6 链 ×2.5）
//   3 链：含苞期间自身攻击 +58%
//   2 链：永生花倍率 +120%（×2.2）
//   6 链永生花续窗：含苞期间再次满双资源 → 可再放一次永生花（每场 1 次），酣梦 ×2.5

import { registerSwitchHook } from '../switchHooks.js';

const HANBAO_DURATION = 3;
const HANBAO_MULT_DEFAULT = 1.5;
const HANBAO_MULT_C6 = 2.5;
const YONGSHENG_RUI_THRESHOLD = 100;
const YONGSHENG_CONCERTO_THRESHOLD = 50;
const YONGSHENG_RUI_COST = 50;
const YONGSHENG_CONCERTO_COST = 50;
const YONGSHENG_BASE_MULT = 2.5;  // atk × 250%

export function chunInHanbao(self) {
  return !!(self?.forte && self.forte.hanbao && self.forte.hanbao > 0);
}

// 永生花倍率（含 2 链 +120%）
export function chunYongshengMult(self) {
  let mult = YONGSHENG_BASE_MULT;
  if (self.chain >= 2) mult *= (1 + 1.2);
  return mult;
}

// 含苞酣梦倍率（普攻/技能 dmgType 用）
export function chunHanbaoMult(self) {
  if (!chunInHanbao(self)) return 1.0;
  return self.chain >= 6 ? HANBAO_MULT_C6 : HANBAO_MULT_DEFAULT;
}

// 检查永生花触发条件
export function chunCheckYongsheng(self, battle) {
  if (self.name !== '椿') return { trigger: false };
  if (!self.forte) return { trigger: false };
  const ruiFull = self.forte.current >= YONGSHENG_RUI_THRESHOLD;
  const concertoEnough = (self.concerto || 0) >= YONGSHENG_CONCERTO_THRESHOLD;
  if (!ruiFull || !concertoEnough) return { trigger: false };

  const inHanbao = chunInHanbao(self);
  if (!inHanbao) return { trigger: true, isRefresh: false };
  if (self.chain >= 6 && !self._chunYongshengFired) {
    return { trigger: true, isRefresh: true };
  }
  return { trigger: false };
}

// 进入 / 重置含苞状态（永生花释放后调用）
export function chunEnterHanbao(self, battle, isRefresh = false) {
  if (self.name !== '椿' || !self.forte) return;
  self.forte.current = Math.max(0, self.forte.current - YONGSHENG_RUI_COST);
  self.forte.ready = self.forte.current >= self.forte.max;
  self.concerto = Math.max(0, (self.concerto || 0) - YONGSHENG_CONCERTO_COST);
  self.forte.hanbao = HANBAO_DURATION + 1;  // +1 补偿本回合 endTurn -1
  if (self.chain >= 3) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '含苞·酣梦');
    self.buffs.push({ type: 'atkUp', value: 0.58, duration: HANBAO_DURATION + 1, src: '含苞·酣梦' });
  }
  if (isRefresh) self._chunYongshengFired = true;
  const mult = chunHanbaoMult(self);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: isRefresh
      ? `永生花·续窗！消耗 ${YONGSHENG_RUI_COST} 红椿·蕊 + ${YONGSHENG_CONCERTO_COST} 协奏 → 含苞重置 ${HANBAO_DURATION} 回合（酣梦 ×${mult}）`
      : `永生花绽放！消耗 ${YONGSHENG_RUI_COST} 红椿·蕊 + ${YONGSHENG_CONCERTO_COST} 协奏 → 进入含苞 ${HANBAO_DURATION} 回合（酣梦 ×${mult}）`
  });
}

// doSkill 前调用：判断是否替换为永生花
// 返回 { yongsheng: true, isRefresh, mult, dmgType, label } 或 null
export function chunResolveSkill(self, battle) {
  if (self.name !== '椿') return null;
  const check = chunCheckYongsheng(self, battle);
  if (!check.trigger) return null;
  return {
    yongsheng: true,
    isRefresh: check.isRefresh,
    mult: chunYongshengMult(self),
    dmgType: 'skill',
    label: check.isRefresh ? '永生花·续窗' : '永生花'
  };
}

// turnCleanup: 含苞 duration 递减
export function chunTick(self, battle) {
  if (self.name !== '椿' || !self.forte) return;
  if (self.forte.hanbao && self.forte.hanbao > 0) {
    self.forte.hanbao--;
    if (self.forte.hanbao <= 0) {
      self.forte.hanbao = 0;
      self.buffs = (self.buffs || []).filter(b => b.src !== '含苞·酣梦');
      battle?.log.push({ type: 'mechanic', src: self.name, msg: '含苞状态结束' });
    }
  }
}

// 变奏入场：红椿·蕊 +20，1 链暴伤，4 链全队普攻
export function chunSwitchIn({ to, battle }) {
  const self = to;
  if (self.name !== '椿' || !self.forte) return;
  self.forte.current = Math.min(self.forte.max, self.forte.current + 20);
  self.forte.ready = self.forte.current >= self.forte.max;
  if (self.chain >= 1) {
    self.buffs = (self.buffs || []).filter(b => b.src !== '秘密小径');
    self.buffs.push({ type: 'cdmgUp', value: 0.28, duration: 3 + 1, src: '秘密小径' });
  }
  if (self.chain >= 4) {
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '根茎永恒');
      t.buffs.push({ type: 'normalDmgUp', value: 0.25, duration: 4 + 1, src: '根茎永恒' });
    });
    battle.log.push({ type: 'mechanic', src: self.name, msg: '根茎永恒 · 全队普攻 +25%（4 回合）' });
  }
}

registerSwitchHook('椿', chunSwitchIn);

export function collectChunBadges(unit) {
  if (unit.name !== '椿' || !unit.forte) return [];
  const badges = [];
  const rui = unit.forte.current || 0;
  const ruiMax = unit.forte.max || 100;
  const concerto = unit.concerto || 0;
  const yongshengReady = rui >= YONGSHENG_RUI_THRESHOLD && concerto >= YONGSHENG_CONCERTO_THRESHOLD;
  badges.push({
    key: 'rui', cls: yongshengReady ? 'burst' : 'field',
    icon: yongshengReady ? '✦' : '◈',
    label: yongshengReady ? `蕊${rui} 协${concerto} · 永生花就绪` : `蕊 ${rui}/${ruiMax} · 协 ${concerto}/100`,
    tip: `<b>红椿·蕊</b><br>普攻 +10 / 技能 +15 / 解放 +30 / 变奏 +20<br>满 100 + 协奏 ≥ 50 → 共鸣技能替换为<b>永生花</b>`
  });
  if (chunInHanbao(unit)) {
    const mult = unit.chain >= 6 ? HANBAO_MULT_C6 : HANBAO_MULT_DEFAULT;
    badges.push({
      key: 'hanbao', cls: 'burst', icon: '✿',
      label: `含苞 ${unit.forte.hanbao - 1}回 · 酣梦 ×${mult}`,
      tip: `<b>含苞 · 酣梦</b><br>普攻/技能伤害 ×${mult}（6 链 ×2.5）<br>3 链: 自身攻击 +58%<br>剩余 ${unit.forte.hanbao - 1} 回合`
    });
  }
  return badges;
}

export default {
  name: '椿',
  hasHeavy: true,
  inHanbao: chunInHanbao,
  resolveSkill: chunResolveSkill,
  enterHanbao: chunEnterHanbao,
  hanbaoMult: chunHanbaoMult,
  yongshengMult: chunYongshengMult,
  tick: chunTick,
  turnCleanup: chunTick,
  switchIn: chunSwitchIn,
  collectBadges: collectChunBadges
};
