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
// 注册表收口（2026-07-02 P1.0）：
//   · 离火层数 → stacks.js `changli_lihuo`（cap 6 / 无衰减 / onGain 刷新热熔 buff + 满层进心眼）
//   · 心眼态 → 保留在 unit.forte.mindEye（强耦合离火层数，不必单独 form）
//   · 焰羽 → 保留在 unit.buffs（buff 形态，非形态切换）
//   · 返回值型 hook（inMindEye / mindEyeForm / resolveCost）走 queryCharacterHook 直查
//   · 后处理 hook（onAttack/onSkill/onHeavy/onBurst）走 fireCharacterHook

import { registerStack, gainStack, getStack } from '../stacks.js';
import { registerSwitchHook } from '../switchHooks.js';

const LIHUO_PER_AP = 2;  // 每 2 层离火抵 1 点 AP
const LIHUO_CAP = 6;

// 心眼变身映射：心眼态下三招的倍率 / 伤害类型 / 名字
// 关键：dmgType 全变 'skill'（共鸣技能伤害）—— 普攻键打出技能伤害是心眼的灵魂
// Phase 3：征 300% / 劫 410% / 冲 650%（锚官方心眼表 + 回路焚身顶点）
const MIND_EYE_FORMS = {
  normal: { mult: 3.0, dmgType: 'skill', label: '心眼·征' },
  skill:  { mult: 4.1, dmgType: 'skill', label: '心眼·劫' },
  heavy:  { mult: 6.5, dmgType: 'skill', label: '心眼·冲' },
};

export function changliInMindEye(self) {
  return !!(self?.forte && self.forte.mindEye);
}

// 每层离火 +5% 热熔伤害：用 elemAllUp buff 承载，随层数实时刷新
function refreshLihuoBonus(self) {
  self.buffs = (self.buffs || []).filter(b => b.src !== '离火增伤');
  const layers = getStack(self, 'changli_lihuo');
  if (layers > 0) {
    self.buffs.push({ type: 'elemAllUp', value: 0.05 * layers, src: '离火增伤', duration: 99 });
  }
}

// 离火 Stack：cap 6 / 无衰减 / 满层自动进心眼
// forte.current 仍作 forte.js UI 显示镜像，在 onGain/onConsume 内同步
registerStack('changli_lihuo', {
  cap: LIHUO_CAP,
  onGain(unit, battle, after, before, source) {
    if (after <= before) return;
    // 同步 forte.current（UI 显示用）
    if (unit.forte) unit.forte.current = after;
    refreshLihuoBonus(unit);
    battle.log.push({ type: 'mechanic', src: unit.name, msg: `${source} → 离火 ${after}/${LIHUO_CAP}` });
    // 满 6 层 → 进入心眼模式
    if (after >= LIHUO_CAP && !unit.forte.mindEye) {
      unit.forte.mindEye = true;
      unit.forte.ready = true;  // 沿用 forte.ready 作 UI 满值标志
      battle.log.push({ type: 'mechanic', src: unit.name, msg: `离火满 ${LIHUO_CAP} → 进入心眼模式（攻击键变身，离火抵 AP）` });
    }
  },
  render(unit) {
    const cur = getStack(unit, 'changli_lihuo');
    if (cur <= 0) return '';
    return `<div style="font-size:9px;color:var(--gold);margin-top:2px">离火 ${'◆'.repeat(cur)}${'◇'.repeat(LIHUO_CAP - cur)} +${cur * 5}%热熔</div>`;
  }
});

// 攒离火（普攻/技能/重击/解放命中后调用）。心眼态内只消耗、不累积。
function changliGainLihuo(self, amount, source, battle) {
  if (self.name !== '长离') return;
  if (!self.forte || self.forte.resourceName !== '离火') return;
  if (self.forte.mindEye) return;  // 心眼内不累积，否则永远耗不空
  gainStack(self, 'changli_lihuo', source, battle, amount);
}

// 解析心眼态下一招的花费：返回 { apCost, lihuoCost }
//   离火优先抵 AP（每 2 层 1 AP），抵不满的缺口用回合 AP 补 —— 永远 afford 得起（只要回合 AP 够补缺口）
export function changliResolveCost(self, actionType, baseApCost) {
  if (!changliInMindEye(self)) return { apCost: baseApCost, lihuoCost: 0 };
  const lihuo = getStack(self, 'changli_lihuo');
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
function changliSpendLihuo(self, lihuoCost, battle) {
  if (self.name !== '长离' || !self.forte) return;
  if (lihuoCost > 0) {
    self._stacks = self._stacks || {};
    self._stacks['changli_lihuo'] = Math.max(0, getStack(self, 'changli_lihuo') - lihuoCost);
    self.forte.current = self._stacks['changli_lihuo'];  // 同步 UI 镜像
    refreshLihuoBonus(self);
  }
  // 离火 < 2（凑不出 1 点白嫖 AP）→ 退出心眼，三招还原
  if (self.forte.mindEye && getStack(self, 'changli_lihuo') < LIHUO_PER_AP) {
    self.forte.mindEye = false;
    self.forte.ready = false;
    battle?.log.push({ type: 'mechanic', src: self.name, msg: `离火不足 → 退出心眼模式` });
  }
}

// 解放进入焰羽：2 回合内攻击力 +50%、攻击无视目标 40% 防御
function changliEnterYanyu(self, battle) {
  if (self.name !== '长离') return;
  self.buffs = (self.buffs || []).filter(b => b.src !== '焰羽');
  self.buffs.push({ type: 'atkUp',    value: 0.5, duration: 2, src: '焰羽' });
  self.buffs.push({ type: 'pierceUp', value: 0.4, duration: 2, src: '焰羽' });
  battle?.log.push({ type: 'mechanic', src: self.name, msg: `离火照丹心 → 进入焰羽（攻击 +50%、无视 40% 防御，2 回合）` });
}

// C1：技能/重击 +10%（仅这两类，不碰普攻/解放）
export function changliBattleStart(self) {
  if (self.name !== '长离') return;
  if ((self.chain || 0) >= 1) {
    self.skillBonus = (self.skillBonus || 0) + 0.1;
    self.heavyBonus = (self.heavyBonus || 0) + 0.1;
  }
}

// C6：技能 / 重击 / 解放额外无视 40% 防御（普攻不吃）
export function changliExtraPierce(self, dmgType) {
  if (self.name !== '长离' || (self.chain || 0) < 6) return 0;
  if (dmgType === 'skill' || dmgType === 'heavy' || dmgType === 'burst') return 0.4;
  return 0;
}

// C4：变奏入场后全队攻击 +20%，2 回合
export function changliSwitchIn({ to, battle }) {
  if (to?.name !== '长离' || (to.chain || 0) < 4) return;
  for (const t of battle.team) {
    if (!t.alive) continue;
    t.buffs = (t.buffs || []).filter(b => b.src !== '长离·饰我所言');
    t.buffs.push({ type: 'atkUp', value: 0.2, duration: 2, src: '长离·饰我所言' });
  }
  battle.log.push({ type: 'mechanic', src: to.name, msg: '饰我所言 → 全队攻击 +20%，持续 2 回合' });
}

registerSwitchHook('长离', changliSwitchIn);

// onAttack hook：普攻后离火处理（心眼态消耗 / 常态累积）
export function changliOnAttack(self, ctx) {
  if (self.name !== '长离') return;
  const battle = ctx.battle;
  const cost = ctx.cost;
  if (changliInMindEye(self)) changliSpendLihuo(self, cost?.lihuoCost || 0, battle);
  else changliGainLihuo(self, 1, '普攻', battle);
}

// onSkill hook：技能后离火处理
export function changliOnSkill(self, ctx) {
  if (self.name !== '长离') return;
  const battle = ctx.battle;
  const cost = ctx.cost;
  if (changliInMindEye(self)) changliSpendLihuo(self, cost?.lihuoCost || 0, battle);
  else changliGainLihuo(self, 1, '共鸣技能', battle);
}

// onHeavy hook：重击后离火处理
export function changliOnHeavy(self, ctx) {
  if (self.name !== '长离') return;
  const battle = ctx.battle;
  const cost = ctx.cost;
  if (changliInMindEye(self)) changliSpendLihuo(self, cost?.lihuoCost || 0, battle);
  else changliGainLihuo(self, 1, '重击', battle);
}

// onBurst hook：解放后焰羽 + 离火 +3
export function changliOnBurst(self, ctx) {
  if (self.name !== '长离') return;
  const battle = ctx.battle;
  changliEnterYanyu(self, battle);
  changliGainLihuo(self, 3, '离火照丹心', battle);
}

// 战斗 UI 徽章：离火层数 + 心眼/焰羽状态
function collectBadges(self) {
  if (!self.forte) return [];
  const cur = getStack(self, 'changli_lihuo');
  const badges = [{
    key: `lihuo-${self.name}`, cls: 'field', icon: '🔥',
    label: `离火 ${cur}/${LIHUO_CAP}`,
    tip: `<b>离火</b><br>普攻/技能/重击各 +1 层、解放 +3。每层热熔伤害 +5%（满 ${LIHUO_CAP} 层 +30%）。满层进入心眼模式。`
  }];
  if (self.forte.mindEye) {
    badges.push({
      key: `mindeye-${self.name}`, cls: 'atk', icon: '🧠',
      label: '心眼',
      tip: '<b>心眼模式</b><br>普攻/技能/重击变身（征/劫/冲），打出共鸣技能伤害；离火抵 AP，<2 层退出。'
    });
  }
  if ((self.buffs || []).some(b => b.src === '焰羽')) {
    badges.push({
      key: `yanyu-${self.name}`, cls: 'crit', icon: '🕊',
      label: '焰羽',
      tip: '<b>焰羽</b><br>攻击 +50%、无视 40% 防御，持续 2 回合。'
    });
  }
  return badges;
}

// Phase 3 常态倍率：技能 200% / 重击 400% / 解放 900%/450% / 变奏 150%
export function changliNormalMult(self) {
  return self.name === '长离' ? 1.0 : null;
}
export function changliSkillMult(self) {
  return self.name === '长离' ? 2.0 : null;
}
export function changliHeavyMult(self) {
  return self.name === '长离' ? 4.0 : null;
}
export function changliVariationMult(self) {
  return self.name === '长离' ? 1.5 : null;
}
export function changliResolveBurstMult(self) {
  if (self.name !== '长离') return null;
  return { baseMain: 9.0, baseSide: 4.5 };
}

export default {
  name: '长离',
  hasHeavy: true,
  inMindEye: changliInMindEye,
  mindEyeForm: changliMindEyeForm,
  resolveCost: changliResolveCost,
  extraPierce: changliExtraPierce,
  battleStart: changliBattleStart,
  switchIn: changliSwitchIn,
  onAttack: changliOnAttack,
  onSkill: changliOnSkill,
  onHeavy: changliOnHeavy,
  onBurst: changliOnBurst,
  normalMult: changliNormalMult,
  skillMult: changliSkillMult,
  heavyMult: changliHeavyMult,
  variationMult: changliVariationMult,
  resolveBurstMult: changliResolveBurstMult,
  collectBadges,
};
