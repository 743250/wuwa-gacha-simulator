// 长离「离火 · 心眼」热熔迅刀速切副C（S 级专属状态机）
//
// 设计灵魂（见 docs/plans/characters/长离.md）：
//   离火是一条「边攒边增伤」的资源条 —— 每持有 1 层，热熔伤害 +5%（满 6 层 +30%）。
//   普攻/技能/重击各攒 1 层，解放攒 3 层。攒满 6 层「进入心眼模式」：
//     三招变身（普攻→心眼·征、技能→心眼·劫、重击→心眼·冲），
//     倍率与伤害类型一起拔高（普攻 100%普攻 → 180%共鸣技能伤害，这是「用普攻键打技能伤害」的灵魂），
//     且出招优先用离火抵 AP（每 2 层离火 = 1 点 AP），离火不足的缺口用回合 AP 补。
//   离火 < 2 层（凑不出 1 点白嫖 AP）时退出心眼，三招还原。
//
// 判断器思路：combat.js 的 resolveActionCost 是薄入口（默认只看回合 AP），
//   仅在角色挂了 resolveCost hook（只有长离）时委托到这里算「离火付几层 + 回合 AP 补几点」。
//   特例隔离在本文件，不污染引擎核心。

const LIHUO_PER_AP = 2;  // 每 2 层离火抵 1 点 AP

// 心眼变身映射：心眼态下三招的倍率 / 伤害类型 / 名字
// 关键：dmgType 全变 'skill'（共鸣技能伤害）—— 普攻键打出技能伤害是心眼的灵魂
const MIND_EYE_FORMS = {
  normal: { mult: 1.8, dmgType: 'skill', label: '心眼·征' },
  skill:  { mult: 2.0, dmgType: 'skill', label: '心眼·劫' },
  heavy:  { mult: 4.0, dmgType: 'skill', label: '心眼·冲' },
};

export function changliInMindEye(self) {
  return !!(self?.forte && self.forte.mindEye);
}

// 每层离火 +5% 热熔伤害：用 elemAllUp buff 承载，随层数实时刷新
function refreshLihuoBonus(self) {
  self.buffs = (self.buffs || []).filter(b => b.src !== '离火增伤');
  const layers = self.forte?.current || 0;
  if (layers > 0) {
    self.buffs.push({ type: 'elemAllUp', value: 0.05 * layers, src: '离火增伤', duration: 99 });
  }
}

// 攒离火（普攻/技能/重击/解放命中后调用）。心眼态内只消耗、不累积。
export function changliGainLihuo(self, amount, source, battle) {
  if (self.name !== '长离') return;
  if (!self.forte || self.forte.resourceName !== '离火') return;
  if (self.forte.mindEye) return;  // 心眼内不累积，否则永远耗不空
  const before = self.forte.current;
  self.forte.current = Math.min(self.forte.max, before + amount);
  if (self.forte.current > before) {
    refreshLihuoBonus(self);
    battle?.log.push({ type: 'mechanic', src: self.name, msg: `${source} → 离火 ${self.forte.current}/${self.forte.max}` });
  }
  // 攒满 6 层 → 进入心眼模式
  if (self.forte.current >= self.forte.max && !self.forte.mindEye) {
    self.forte.mindEye = true;
    self.forte.ready = true;  // 沿用 forte.ready 作 UI 满值标志
    battle?.log.push({ type: 'mechanic', src: self.name, msg: `离火满 ${self.forte.max} → 进入心眼模式（攻击键变身，离火抵 AP）` });
  }
}

// 解析心眼态下一招的花费：返回 { apCost, lihuoCost }
//   离火优先抵 AP（每 2 层 1 AP），抵不满的缺口用回合 AP 补 —— 永远 afford 得起（只要回合 AP 够补缺口）
export function changliResolveCost(self, actionType, baseApCost) {
  if (!changliInMindEye(self)) return { apCost: baseApCost, lihuoCost: 0 };
  const lihuo = self.forte.current;
  const maxApFromLihuo = Math.floor(lihuo / LIHUO_PER_AP);
  const apPaidByLihuo = Math.min(baseApCost, maxApFromLihuo);
  return { apCost: baseApCost - apPaidByLihuo, lihuoCost: apPaidByLihuo * LIHUO_PER_AP };
}

// 心眼态下取某招的变身形态（倍率/类型/名字）；非心眼态返回 null
export function changliMindEyeForm(self, actionType) {
  if (self.name !== '长离' || !changliInMindEye(self)) return null;
  return MIND_EYE_FORMS[actionType] || null;
}

// 出招后扣离火 + 判定退出心眼
export function changliSpendLihuo(self, lihuoCost, battle) {
  if (self.name !== '长离' || !self.forte) return;
  if (lihuoCost > 0) {
    self.forte.current = Math.max(0, self.forte.current - lihuoCost);
    refreshLihuoBonus(self);
  }
  // 离火 < 2（凑不出 1 点白嫖 AP）→ 退出心眼，三招还原
  if (self.forte.mindEye && self.forte.current < LIHUO_PER_AP) {
    self.forte.mindEye = false;
    self.forte.ready = false;
    battle?.log.push({ type: 'mechanic', src: self.name, msg: `离火不足 → 退出心眼模式` });
  }
}

// 解放进入焰羽：2 回合内攻击力 +50%、攻击无视目标 40% 防御
export function changliEnterYanyu(self, battle) {
  if (self.name !== '长离') return;
  self.buffs = (self.buffs || []).filter(b => b.src !== '焰羽');
  self.buffs.push({ type: 'atkUp',    value: 0.5, duration: 2, src: '焰羽' });
  self.buffs.push({ type: 'pierceUp', value: 0.4, duration: 2, src: '焰羽' });
  battle?.log.push({ type: 'mechanic', src: self.name, msg: `离火照丹心 → 进入焰羽（攻击 +50%、无视 40% 防御，2 回合）` });
}

// 战斗 UI 徽章：离火层数 + 心眼/焰羽状态
function collectBadges(self) {
  if (!self.forte) return [];
  const badges = [`离火 ${self.forte.current}/${self.forte.max}`];
  if (self.forte.mindEye) badges.push('心眼');
  if ((self.buffs || []).some(b => b.src === '焰羽')) badges.push('焰羽');
  return badges;
}

export default {
  name: '长离',
  hasHeavy: true,
  gainLihuo: changliGainLihuo,
  resolveCost: changliResolveCost,
  mindEyeForm: changliMindEyeForm,
  spendLihuo: changliSpendLihuo,
  inMindEye: changliInMindEye,
  enterYanyu: changliEnterYanyu,
  collectBadges,
};
