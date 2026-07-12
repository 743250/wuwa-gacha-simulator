import { registerStack, gainStack, consumeStack, getStack, getStackCap, renderStacks } from '../stacks.js';
import { registerForm, enterForm, exitForm, hasForm } from '../forms.js';
import { registerSwitchHook } from '../switchHooks.js';
import { fireEchoSetOnErosion } from '../echoSetTriggers.js';
import { addErosion, getErosionStacks, consumeAllErosion, doubleErosionStacks, erosionTick as 通用ErosionTick } from '../combat/erosion.js';

// 卡提希娅「决意 / 芙露德莉斯形态 / 风蚀」状态机
//
// 双形态循环：
//   卡提希娅形态（常态）：普攻/技能/重击叠【决意】→ 第一次解放消耗决意获得【人权/神权/异权】→ 进芙露德莉斯形态
//   芙露德莉斯形态：攻击/技能叠【风蚀效应】→ 第二次解放消耗全部风蚀层数,每层 +20% 爆发倍率（卡提希娅自己技能的爆发加成,非通用 debuff 的 perStack）→ 清空风蚀退出形态
//
// 风蚀效应：气动元素通用 debuff,通过 target.debuffs[{type:'erosion', element:'气动'}] 管理（见 combat/erosion.js）
//   通用每层加深 +10% 气动伤害（所有气动角色共享）
//   卡提希娅第二次解放的"每层 +20% 爆发"是她角色自己的技能倍率加成,独立计算,不动通用 debuff
//
// 决意系统：上限 3 层，每层 +10% 气动伤害，每层独立 2 回合衰减（表现为全局 timer=1，到时减 1 层并刷新）
// 仅作为 buff 名，不复刻官方原文的「每攒 30/60/90/120 决意暴伤 +25%」集意/决意真机制

// 决意 Stack：每 2 回合减 1 层（实现为 decayCooldown=1，到时层-1 并重置 timer）
registerStack('cartethyia_resolve', {
  cap: (unit) => unit.cartethyiaResolveCap || 3,
  decayCooldown: 1,
  resetDecayOnGain: true,
  onGain(unit, battle, after, _before, source) {
    if (after <= _before) return;
    const cap = getStackCap(unit, 'cartethyia_resolve');
    battle.log.push({
      type: 'mechanic', src: unit.name,
      msg: `${source} → 【决意】 ${after}/${cap}（每层气动伤害 +${(unit.cartethyiaResolveDmgPct || 10)}%）`
    });
  },
  onDecay(unit, battle) {
    const cur = getStack(unit, 'cartethyia_resolve');
    battle.log.push({ type: 'mechanic', src: unit.name, msg: `【决意】衰减 → ${cur} 层` });
  },
  onExhaust(unit, battle) {
    battle.log.push({ type: 'mechanic', src: unit.name, msg: `【决意】全部消散` });
  },
  render(unit) {
    const cur = getStack(unit, 'cartethyia_resolve');
    const cap = unit.cartethyiaResolveCap || 3;
    const pct = (unit.cartethyiaResolveDmgPct || 10) * cur;
    if (cur <= 0) return '';
    return `<div style="font-size:9px;color:var(--gold);margin-top:2px">决意 ${'◆'.repeat(cur)}${'◇'.repeat(cap - cur)} +${pct}%气动</div>`;
  }
});

// 芙露德莉斯形态：进入时改 displayName + 改 right + 接管 cartethyiaFurTurns
// carryOnSwitch=true —— 形态是场地态，切人不丢（与卡提希娅原本的"形态独立于切换"语义一致）
registerForm('cartethyia_furu', {
  enterName: '芙露德莉斯',
  carryOnSwitch: true,
  onEnter(unit, battle, opts = {}) {
    unit.cartethyiaFurTurns = opts.turns ?? 4;
    unit.cartethyiaRight = opts.right || null;
  },
  onExit(unit, battle) {
    unit.cartethyiaFurTurns = 0;
    unit.cartethyiaRight = null;
    unit.buffs = (unit.buffs || []).filter(b =>
      b.src !== '链3' && b.src !== '人权' && b.src !== '神权' && b.src !== '链2' && b.src !== '链4'
    );
  }
});

export function cartethyiaGainResolve(self, source, battle) {
  if (self.name !== '卡提希娅') return;
  gainStack(self, 'cartethyia_resolve', source, battle);
}

// onAttack hook：普攻叠决意 + 芙露形态附加风蚀 + 额外能量
export function cartethyiaOnAttack(self, ctx) {
  if (self.name !== '卡提希娅') return;
  const battle = ctx.battle;
  cartethyiaGainResolve(self, '普攻', battle);
  cartethyiaApplyErosion(self, ctx.target, battle, false);
  if ((self.cartethyiaFurTurns || 0) > 0) {
    self.energy = Math.min(self.energyMax, self.energy + 8);
  }
}

// onSkill hook：共鸣技能叠决意 + 芙露形态附加风蚀 + 额外能量
export function cartethyiaOnSkill(self, ctx) {
  if (self.name !== '卡提希娅') return;
  const battle = ctx.battle;
  cartethyiaGainResolve(self, '共鸣技能', battle);
  cartethyiaApplyErosion(self, ctx.target, battle, false);
  if ((self.cartethyiaFurTurns || 0) > 0) {
    self.energy = Math.min(self.energyMax, self.energy + 8);
  }
}

// onHeavy hook：重击叠决意 + 芙露形态附加风蚀 + 额外能量
export function cartethyiaOnHeavy(self, ctx) {
  if (self.name !== '卡提希娅') return;
  const battle = ctx.battle;
  cartethyiaGainResolve(self, '重击', battle);
  cartethyiaApplyErosion(self, ctx.target, battle, false);
  if ((self.cartethyiaFurTurns || 0) > 0) {
    self.energy = Math.min(self.energyMax, self.energy + 8);
  }
}

// 获取决意带来的气动伤害加成倍率
export function cartethyiaResolveMultiplier(self) {
  if (self.name !== '卡提希娅') return 1.0;
  const stacks = getStack(self, 'cartethyia_resolve');
  const pct = (self.cartethyiaResolveDmgPct || 10) * stacks;
  return 1 + pct / 100;
}

const CARTETHYIA_HP_MULT = { normal: 0.12, skill: 0.22, heavy: 0.26, burst: 0.462 };

export function cartethyiaHpCore(self, dmgType) {
  if (self.name !== '卡提希娅') return null;
  return {
    baseStat: 'hpMax',
    baseMultiplier: cartethyiaResolveMultiplier(self),
    hpMultOverride: dmgType === 'burst' ? null : (CARTETHYIA_HP_MULT[dmgType] ?? null)
  };
}

// 第一次解放：消耗决意 → 获得形态之力 → 进入芙露德莉斯形态
export function cartethyiaEnterFurForm(self, battle) {
  if (self.name !== '卡提希娅' || hasForm(self, 'cartethyia_furu')) return { right: null };

  const resolve = consumeStack(self, 'cartethyia_resolve', battle);

  // 根据消耗层数获得对应的 right
  let right = null;
  let rightName = '';
  if (resolve >= 3) {
    right = 'alien';
    rightName = '异权';
    battle.log.push({ type: 'mechanic', src: self.name, msg: `消耗 ${resolve} 层决意 → 获得【异权】（非大招技能叠加两层风蚀）` });
  } else if (resolve >= 2) {
    right = 'divine';
    rightName = '神权';
    battle.log.push({ type: 'mechanic', src: self.name, msg: `消耗 ${resolve} 层决意 → 获得【神权】（暴击率提高）` });
  } else if (resolve >= 1) {
    right = 'human';
    rightName = '人权';
    battle.log.push({ type: 'mechanic', src: self.name, msg: `消耗 ${resolve} 层决意 → 获得【人权】（防御力增强）` });
  } else {
    battle.log.push({ type: 'mechanic', src: self.name, msg: '没有决意，进入芙露德莉斯形态但无形态之力' });
  }

  // 进入芙露德莉斯形态 4 回合（释放当回合 + 后续 3 个回合）
  enterForm(self, 'cartethyia_furu', battle, { right, turns: 4 });

  // 人权：防御力增强
  if (right === 'human') {
    self.buffs = (self.buffs || []).filter(b => b.src !== '人权');
    self.buffs.push({ type: 'defense', value: 0.30, duration: 4, src: '人权' }); // +30% 减伤
    battle.log.push({ type: 'mechanic', src: self.name, msg: '【人权】防御力增强 · 受到伤害 -30%' });
  }

  // 神权：暴击率提高
  if (right === 'divine') {
    self.buffs = (self.buffs || []).filter(b => b.src !== '神权');
    self.buffs.push({ type: 'crateUp', value: 0.25, duration: 4, src: '神权' }); // +25% 暴击率
    battle.log.push({ type: 'mechanic', src: self.name, msg: '【神权】暴击率 +25%' });
  }

  return { right, rightName };
}

// 芙露德莉斯形态下：每次攻击/技能附加风蚀
export function cartethyiaApplyErosion(self, target, battle, isBurst = false) {
  if (self.name !== '卡提希娅' || !self.cartethyiaFurTurns) return;
  if (isBurst) return; // 第二次解放不清风蚀（而是消耗）

  // 异权：非大招技能叠加两层风蚀
  const stacks = (self.cartethyiaRight === 'alien' && !isBurst) ? 2 : 1;

  addErosion(target, stacks, battle, { src: self.name });

  // 触发音骸套装 · 流云逝尽之空 5 件：自身添加风蚀 → 全队气动 +15% / 自身额外 +15%
  fireEchoSetOnErosion(self, battle);

  // 4 链 · 为拯救舍弃其身：附加风蚀时全队元素伤害 +20% / 2 回合（不叠加）
  if (self.cartethyiaErosionTeamBuff) {
    const team = (battle.team || []).filter(t => t && t.alive);
    const dur = self.cartethyiaErosionTeamBuffDur || 2;
    team.forEach(t => {
      // 同源不叠加：移除旧的链4 buff
      t.buffs = (t.buffs || []).filter(b => b.src !== '链4');
      t.buffs.push({ type: 'elemAllUp', value: self.cartethyiaErosionTeamBuff, duration: dur, src: '链4', installer: self.idx });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `链 4 · 为拯救舍弃其身：全队元素伤害 +${Math.round(self.cartethyiaErosionTeamBuff * 100)}%（${dur} 回合）`
    });
  }
}

// 1 链 · 因命运戴上冠冕：破韧瞬间 → 主目标 +1 层风蚀
// 在 reduceVibration 内破韧事件触发时调用
export function cartethyiaErosionOnBreak(self, target, battle) {
  if (!self || self.name !== '卡提希娅' || !self.cartethyiaErosionOnBreak) return;
  addErosion(target, 1, battle, { src: self.name });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `链 1 · 因命运戴上冠冕：破韧瞬间 → ${target.name} 风蚀 +1`
  });
}

// 2 链 · 听风潮斩断利刃：变奏上场 → 主目标 +1 层风蚀
// 在 doSwitch 变奏命中后调用
export function cartethyiaErosionOnSwitchIn(self, target, battle) {
  if (!self || self.name !== '卡提希娅' || !self.cartethyiaErosionOnSwitchIn) return;
  addErosion(target, 1, battle, { src: self.name });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `链 2 · 听风潮斩断利刃：变奏上场 → ${target.name} 风蚀 +1`
  });
}

// 5 链 · 将烈风重塑希望：致命伤不倒 + 20% HP 护盾 / 2 回合（每场 1 次）
// 在 dealDamage 内 target.hp 即将归 0 时调用；返回 true 表示已接管本次伤害
// onLethal hook signature: (self, battle, dmg) => boolean
export function cartethyiaLethalShield(self, battle, dmg) {
  if (!self || self.name !== '卡提希娅' || !self.cartethyiaLethalShield) return false;
  if (self._cartethyiaLethalUsed) return false;

  self._cartethyiaLethalUsed = true;
  const shieldAmt = Math.round(self.hpMax * self.cartethyiaLethalShield);
  self.shield = (self.shield || 0) + shieldAmt;
  // 不倒锁血 1 HP
  self.hp = 1;
  // 给一个 2 回合的标记 buff，便于 chain 类清理 & 显示
  self.buffs = (self.buffs || []).filter(b => b.src !== '链5');
  self.buffs.push({ type: 'shieldMark', value: shieldAmt, duration: self.cartethyiaLethalShieldDur || 2, src: '链5' });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `链 5 · 将烈风重塑希望：致命伤不倒 + ${shieldAmt} 护盾（${self.cartethyiaLethalShieldDur || 2} 回合，每场 1 次）`
  });
  return true;
}

// 第一次解放·听骑士从心祈愿:0 AP 纯变身,仅消耗能量。
// 第二次解放·看潮怒风哮之刃:3 AP。
//
// 卡提希娅两个大招走同一 doBurst 主流流程(只伤害结算有差异,见 resolveBurstDamage)。
// AP 通过通用 `resolveBurstCost` hook 返回,doBurst 会查它:
//   · 卡提希娅形态(第一次解放·听骑士从心祈愿):返回 0
//   · 芙露形态(第二次解放·看潮怒风哮之刃):返回 undefined,doBurst 回落 ACTION_COST.burst(=3)
// canBurst 同步放宽:第一次解放只检能量满 + 战斗未结束,不查 AP≥3;
//   第二次解放回落通用 canBurst(查 AP≥3)。
export function cartethyiaCanBurst(self, battle) {
  if (self.name !== '卡提希娅') return undefined;
  // 芙露形态下的解放(看潮怒风哮之刃):回落通用 canBurst(检 AP≥3 + 能量满)
  if ((self.cartethyiaFurTurns || 0) > 0) return undefined;
  // 卡提希娅形态下的解放(听骑士从心祈愿):0 AP,只检能量满 + 战斗未结束 + 有目标
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  if (battle.finished) return { ok: false, err: '战斗已结束' };
  if (self.energy < self.energyMax) return { ok: false, err: `能量不足（${self.energy}/${self.energyMax}）` };
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return { ok: false, err: '没有目标' };
  return { ok: true };
}

// 本次解放消耗的 AP(adapter 给 doBurst 用):
//   第一次解放(卡提希娅形态) → 0
//   第二次解放(芙露形态)    → undefined,回落通用 ACTION_COST.burst(=3)
export function cartethyiaResolveBurstCost(self, battle) {
  if (self.name !== '卡提希娅') return undefined;
  if ((self.cartethyiaFurTurns || 0) > 0) return undefined;  // 第二次解放回落默认
  return 0;  // 第一次解放 0 AP
}

// 解放伤害分发:第一/第二次解放仍走 resolveBurstDamage 主流路径(doBurst 全套流程:扣 AP、onBurst、concerto+30、forte...)。
// 第一次解放 = 形态切换(无伤害,调 enterFurForm);第二次 = 看潮怒风哮之刃(风蚀爆发)。
export function cartethyiaResolveBurstDamage(self, battle, helpers = {}) {
  if (self.name !== '卡提希娅') return null;

  const aliveEnemies = battle.enemies.filter(e => e.alive);
  const targetIdx = (typeof battle.targetIdx === 'number') ? battle.targetIdx : -1;
  const primary = (battle.enemies[targetIdx] && battle.enemies[targetIdx].alive) ? battle.enemies[targetIdx] : aliveEnemies[0];
  if (!primary) return { results: [], action: '共鸣解放' };

  if ((self.cartethyiaFurTurns || 0) > 0) {
    const { erosionMult } = cartethyiaBurstErosion(self, battle);
    const chain3Bonus = self.cartethyiaBurstHpBonus || 0;
    const baseMain = (0.462 + chain3Bonus) * erosionMult;
    const baseSide = (0.462 + chain3Bonus) * erosionMult * 0.5;
    const results = aliveEnemies.map(e => {
      const mult = (e === primary) ? baseMain : baseSide;
      const { dmg, crit } = helpers.calcDamage(self, e, mult, 'burst');
      const real = helpers.dealDamage(e, dmg);
      helpers.reduceVibration(e, helpers.VIBRATION_DAMAGE.burst, battle, self);
      helpers.applyReflect(battle, self, e, real);
      return { tgt: e.name, dmg: real, crit, primary: e === primary };
    });
    return { results, action: '共鸣解放 · 看潮怒风哮之刃（风蚀爆发）' };
  }

  cartethyiaEnterFurForm(self, battle);
  return {
    results: [],
    action: '共鸣解放 · 听骑士从心祈愿（进入芙露德莉斯形态）'
  };
}

export function cartethyiaBurstErosion(self, battle) {
  if (self.name !== '卡提希娅') return { erosionMult: 1.0, erosionConsumed: 0 };

  const primary = battle.enemies.find(e => e.alive && e === battle.enemies[battle.targetIdx || 0]);
  if (!primary) return { erosionMult: 1.0, erosionConsumed: 0 };

  let erosion = getErosionStacks(primary);

  // 6 链：风蚀层数翻倍 + 不清空（官方无上限，不封顶）
  const chain6Double = !!self.cartethyiaBurst2DoubleErosion;
  if (chain6Double) {
    erosion = erosion * 2;
    doubleErosionStacks(primary, battle, { src: self.name });
    erosion = getErosionStacks(primary);
  }

  // 每层风蚀 +20%（卡提希娅自己解放技能的爆发倍率加成,非通用 debuff 的 perStack）
  const erosionMult = 1 + erosion * 0.20;

  if (erosion > 0) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: chain6Double
        ? `链 6 · 风蚀层数翻倍！消耗 ${erosion} 层 → 伤害 ×${erosionMult.toFixed(1)}（不清空 + 立即结算）`
        : `风蚀爆发！消耗 ${erosion} 层 → 伤害 ×${erosionMult.toFixed(1)}`
    });
  }

  // 6 链：立即结算 1 次 + 不清空
  if (chain6Double) {
    battle.enemies.forEach(e => {
      if (e.alive && getErosionStacks(e) > 0) {
        通用ErosionTick(e, battle);
        // 不清空：保留风蚀层数
      }
    });
  } else {
    // 清空所有敌人的风蚀
    consumeAllErosion(primary, battle, { src: self.name });
    battle.enemies.forEach(e => {
      if (e !== primary && getErosionStacks(e) > 0) consumeAllErosion(e, battle, { src: self.name });
    });
  }

  // 退出芙露德莉斯形态
  exitForm(self, 'cartethyia_furu', battle);
  battle.log.push({ type: 'mechanic', src: self.name, msg: '芙露德莉斯形态结束 · 回到卡提希娅形态' });

  return { erosionMult, erosionConsumed: erosion };
}

// 风蚀效应 DoT：转发到通用 erosionTick（combat/erosion.js）
export function cartethyiaErosionTick(enemy, battle) {
  通用ErosionTick(enemy, battle);
}

// endTurn 清理：决意计时移到 stacks.js tickStacks 统一管理，芙露形态计时仍在此处
export function cartethyiaTurnCleanup(self, ctx) {
  if (self.name !== '卡提希娅') return;
  const battle = ctx.battle;

  // 芙露德莉斯形态计时
  if (self.cartethyiaFurTurns > 0 && hasForm(self, 'cartethyia_furu')) {
    self.cartethyiaFurTurns--;
    if (self.cartethyiaFurTurns === 0) {
      exitForm(self, 'cartethyia_furu', battle);
      battle.log.push({ type: 'mechanic', src: self.name, msg: '芙露德莉斯形态结束 · 回到卡提希娅形态' });
    }
  }
}

// 战斗内左侧状态渲染
export function renderCartethyiaStatus(unit) {
  const badges = collectCartethyiaBadges(unit);
  if (!badges.length) return '';
  return `<div style="font-size:9px;color:var(--gold);margin-top:2px;letter-spacing:.3px">${badges.map(b => `${b.icon} ${b.label}`).join(' | ')}</div>`;
}

// 徽章数组版本（供统一徽章系统使用）
export function collectCartethyiaBadges(unit) {
  if (unit.name !== '卡提希娅') return [];
  const out = [];

  const resolve = getStack(unit, 'cartethyia_resolve');
  const resolveCap = unit.cartethyiaResolveCap || 3;
  if (resolve > 0) {
    const dmgPct = (unit.cartethyiaResolveDmgPct || 10) * resolve;
    out.push({
      key: 'resolve', cls: 'field', icon: '◆',
      label: `决意 ${resolve}/${resolveCap} +${dmgPct}%气动`,
      tip: `<b>决意</b><br>气动伤害加成 +${dmgPct}%。${resolve}/${resolveCap} 层。`
    });
  }

  const fur = unit.cartethyiaFurTurns || 0;
  if (fur > 0) {
    const rightLabels = { human: '人权·防↑', divine: '神权·暴↑', alien: '异权·风蚀×2' };
    const right = unit.cartethyiaRight ? (rightLabels[unit.cartethyiaRight] || '') : '';
    out.push({
      key: 'fur', cls: 'burst', icon: '🌟',
      label: `芙露德莉斯 ${fur - 1}回${right ? ' · ' + right : ''}`, dur: fur - 1,
      tip: `<b>芙露德莉斯形态</b><br>强化形态。${right || '无附加权能'}。剩余 ${fur - 1} 回合。`
    });
  }

  return out;
}

// Step E：切人入场钩子（2 链 · 变奏上场主目标 +1 层风蚀）
// 只在有变奏命中目标时触发；无变奏目标则跳过
registerSwitchHook('卡提希娅', ({ to, battle, ctx }) => {
  if (!ctx?.variationTarget) return;
  cartethyiaErosionOnSwitchIn(to, ctx.variationTarget, battle);
});

export default {
  name: '卡提希娅',
  hasHeavy: false,
  renderBattleStatus: renderCartethyiaStatus,
  collectBadges: collectCartethyiaBadges,
  hpCore: cartethyiaHpCore,
  gainResolve: cartethyiaGainResolve,
  applyErosion: cartethyiaApplyErosion,
  onAttack: cartethyiaOnAttack,
  onSkill: cartethyiaOnSkill,
  onHeavy: cartethyiaOnHeavy,
  enterFurForm: cartethyiaEnterFurForm,
  canBurst: cartethyiaCanBurst,
  resolveBurstCost: cartethyiaResolveBurstCost,
  resolveBurstDamage: cartethyiaResolveBurstDamage,
  burstErosion: cartethyiaBurstErosion,
  erosionOnBreak: cartethyiaErosionOnBreak,
  erosionOnSwitchIn: cartethyiaErosionOnSwitchIn,
  lethalShield: cartethyiaLethalShield,
  onLethal: cartethyiaLethalShield,
  erosionTick: cartethyiaErosionTick,
  turnCleanup: cartethyiaTurnCleanup
};