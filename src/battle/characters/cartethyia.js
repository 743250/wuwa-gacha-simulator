// 卡提希娅「决意 / 芙露德莉斯形态 / 风蚀」状态机
//
// 双形态循环：
//   卡提希娅形态（常态）：普攻/技能/重击叠【决意】→ 第一次解放消耗决意获得【人权/神权/异权】→ 进芙露德莉斯形态
//   芙露德莉斯形态：攻击/技能叠【风蚀效应】→ 第二次解放每层风蚀 +20% → 清空风蚀退出形态
//
// 决意系统：上限 3 层，每层 +10% 气动伤害，持续 2 回合，刷新机制
// 仅作为 buff 名，不复刻官方原文的「每攒 30/60/90/120 决意暴伤 +25%」集意/决意真机制

export function cartethyiaGainResolve(self, source, battle) {
  if (self.name !== '卡提希娅') return;
  const cap = self.cartethyiaResolveCap || 3;
  const before = self.cartethyiaResolve || 0;
  self.cartethyiaResolve = Math.min(cap, before + 1);
  self.cartethyiaResolveTimer = 2; // 刷新全部决意持续时间
  if (self.cartethyiaResolve > before) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `${source} → 【决意】 ${self.cartethyiaResolve}/${cap}（每层气动伤害 +${(self.cartethyiaResolveDmgPct || 10)}%）`
    });
  }
}

// 获取决意带来的气动伤害加成倍率
export function cartethyiaResolveMultiplier(self) {
  if (self.name !== '卡提希娅') return 1.0;
  const stacks = self.cartethyiaResolve || 0;
  const pct = (self.cartethyiaResolveDmgPct || 10) * stacks;
  return 1 + pct / 100;
}

// 第一次解放：消耗决意 → 获得形态之力 → 进入芙露德莉斯形态
export function cartethyiaEnterFurForm(self, battle) {
  if (self.name !== '卡提希娅' || self.cartethyiaFurTurns > 0) return { right: null };

  const resolve = self.cartethyiaResolve || 0;

  // 消耗全部决意
  self.cartethyiaResolve = 0;
  self.cartethyiaResolveTimer = 0;

  // 根据消耗层数获得对应的 right
  let right = null;
  let rightName = '';
  if (resolve >= 3) {
    right = 'alien';
    rightName = '异权';
    self.cartethyiaRight = 'alien';
    battle.log.push({ type: 'mechanic', src: self.name, msg: `消耗 ${resolve} 层决意 → 获得【异权】（非大招技能叠加两层风蚀）` });
  } else if (resolve >= 2) {
    right = 'divine';
    rightName = '神权';
    self.cartethyiaRight = 'divine';
    battle.log.push({ type: 'mechanic', src: self.name, msg: `消耗 ${resolve} 层决意 → 获得【神权】（暴击率提高）` });
  } else if (resolve >= 1) {
    right = 'human';
    rightName = '人权';
    self.cartethyiaRight = 'human';
    battle.log.push({ type: 'mechanic', src: self.name, msg: `消耗 ${resolve} 层决意 → 获得【人权】（防御力增强）` });
  } else {
    battle.log.push({ type: 'mechanic', src: self.name, msg: '没有决意，进入芙露德莉斯形态但无形态之力' });
  }

  // 进入芙露德莉斯形态 4 回合（释放当回合 + 后续 3 个回合）
  self.cartethyiaFurTurns = 4;

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

  target.cartethyiaErosion = target.cartethyiaErosion || 0;

  // 异权：非大招技能叠加两层风蚀
  const stacks = (self.cartethyiaRight === 'alien' && !isBurst) ? 2 : 1;

  target.cartethyiaErosion += stacks;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `风蚀 +${stacks} 层（共 ${target.cartethyiaErosion} 层）`
  });

  // 4 链 · 为拯救舍弃其身：附加风蚀时全队元素伤害 +20% / 2 回合（不叠加）
  if (self.cartethyiaErosionTeamBuff) {
    const team = (battle.team || []).filter(t => t && t.alive);
    const dur = self.cartethyiaErosionTeamBuffDur || 2;
    team.forEach(t => {
      // 同源不叠加：移除旧的链4 buff
      t.buffs = (t.buffs || []).filter(b => b.src !== '链4');
      t.buffs.push({ type: 'elemAllUp', value: self.cartethyiaErosionTeamBuff, duration: dur, src: '链4' });
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
  target.cartethyiaErosion = (target.cartethyiaErosion || 0) + 1;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `链 1 · 因命运戴上冠冕：破韧瞬间 → ${target.name} 风蚀 +1（共 ${target.cartethyiaErosion} 层）`
  });
}

// 2 链 · 听风潮斩断利刃：变奏上场 → 主目标 +1 层风蚀
// 在 doSwitch 变奏命中后调用
export function cartethyiaErosionOnSwitchIn(self, target, battle) {
  if (!self || self.name !== '卡提希娅' || !self.cartethyiaErosionOnSwitchIn) return;
  target.cartethyiaErosion = (target.cartethyiaErosion || 0) + 1;
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `链 2 · 听风潮斩断利刃：变奏上场 → ${target.name} 风蚀 +1（共 ${target.cartethyiaErosion} 层）`
  });
}

// 5 链 · 将烈风重塑希望：致命伤不倒 + 20% HP 护盾 / 2 回合（每场 1 次）
// 在 dealDamage 内 target.hp 即将归 0 时调用；返回 true 表示已接管本次伤害
export function cartethyiaLethalShield(self, dmg, battle) {
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

// 第二次解放：看潮怒风哮之刃 — 每层风蚀 +20%，清空全部
export function cartethyiaBurstErosion(self, battle) {
  if (self.name !== '卡提希娅') return { erosionMult: 1.0, erosionConsumed: 0 };

  const primary = battle.enemies.find(e => e.alive && e === battle.enemies[battle.targetIdx || 0]);
  if (!primary) return { erosionMult: 1.0, erosionConsumed: 0 };

  let erosion = primary.cartethyiaErosion || 0;

  // 6 链：风蚀层数翻倍 + 不清空
  const chain6Double = !!self.cartethyiaBurst2DoubleErosion;
  if (chain6Double) {
    erosion = erosion * 2;
  }

  // 每层风蚀 +20%
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
      if (e.alive && e.cartethyiaErosion) {
        cartethyiaErosionTick(e, battle);
        // 不清空：保留风蚀层数
      }
    });
  } else {
    // 清空所有敌人的风蚀
    primary.cartethyiaErosion = 0;
    battle.enemies.forEach(e => {
      if (e !== primary) e.cartethyiaErosion = 0;
    });
  }

  // 退出芙露德莉斯形态
  self.cartethyiaFurTurns = 0;
  self.cartethyiaRight = null;
  // 清除形态相关的 buff
  self.buffs = (self.buffs || []).filter(b =>
    b.src !== '链3' && b.src !== '人权' && b.src !== '神权' && b.src !== '链2' && b.src !== '链4'
  );
  battle.log.push({ type: 'mechanic', src: self.name, msg: '芙露德莉斯形态结束 · 回到卡提希娅形态' });

  return { erosionMult, erosionConsumed: erosion };
}

// 风蚀效应伤害：敌人回合开始时，根据敌人自身攻击力受到伤害
export function cartethyiaErosionTick(enemy, battle) {
  if (!enemy.alive) return;
  const erosion = enemy.cartethyiaErosion || 0;
  if (erosion <= 0) return;

  // 伤害计算：敌人 ATK × 层数 × 0.3（固定倍率，不受玩家加成）
  const dmg = Math.round(enemy.atk * erosion * 0.3);
  enemy.hp = Math.max(0, enemy.hp - dmg);
  battle.log.push({
    type: 'mechanic', src: enemy.name,
    msg: `风蚀效应造成 ${dmg} 点伤害（${erosion} 层 × ${enemy.atk} × 0.3）`
  });
}

// endTurn 清理：决意计时、芙露形态计时
export function cartethyiaTurnCleanup(self, battle) {
  if (self.name !== '卡提希娅') return;

  // 决意计时
  if (self.cartethyiaResolveTimer > 0) {
    self.cartethyiaResolveTimer--;
    if (self.cartethyiaResolveTimer <= 0) {
      const before = self.cartethyiaResolve || 0;
      self.cartethyiaResolve = 0;
      if (before > 0) {
        battle.log.push({ type: 'mechanic', src: self.name, msg: `【决意】持续时间结束，全部清除` });
      }
    }
  }

  // 芙露德莉斯形态计时
  if (self.cartethyiaFurTurns > 0) {
    self.cartethyiaFurTurns--;
    if (self.cartethyiaFurTurns === 0) {
      self.cartethyiaRight = null;
      self.buffs = (self.buffs || []).filter(b =>
        b.src !== '链3' && b.src !== '人权' && b.src !== '神权' && b.src !== '链2' && b.src !== '链4'
      );
      battle.log.push({ type: 'mechanic', src: self.name, msg: '芙露德莉斯形态结束 · 回到卡提希娅形态' });
    }
  }
}

// 战斗内左侧状态渲染
export function renderCartethyiaStatus(unit) {
  if (unit.name !== '卡提希娅') return '';
  const parts = [];

  // 决意
  const resolve = unit.cartethyiaResolve || 0;
  const resolveCap = unit.cartethyiaResolveCap || 3;
  const resolveTimer = unit.cartethyiaResolveTimer || 0;
  if (resolve > 0) {
    const pct = (unit.cartethyiaResolveDmgPct || 10) * resolve;
    parts.push(`决意 ${'◆'.repeat(resolve)}${'◇'.repeat(resolveCap - resolve)} +${pct}%气动`);
  }

  // 芙露德莉斯形态
  const fur = unit.cartethyiaFurTurns || 0;
  if (fur > 0) {
    const rightLabels = { human: '人权·防↑', divine: '神权·暴↑', alien: '异权·风蚀×2' };
    const right = unit.cartethyiaRight ? (rightLabels[unit.cartethyiaRight] || '') : '';
    parts.push(`芙露德莉斯 ${fur - 1}回合${right ? ' · ' + right : ''}`);
  }

  if (!parts.length) return '';
  return `<div style="font-size:9px;color:var(--gold);margin-top:2px;letter-spacing:.3px">${parts.join(' | ')}</div>`;
}

export default {
  name: '卡提希娅',
  hasHeavy: true,
  renderBattleStatus: renderCartethyiaStatus,
  gainResolve: cartethyiaGainResolve,
  applyErosion: cartethyiaApplyErosion,
  enterFurForm: cartethyiaEnterFurForm,
  burstErosion: cartethyiaBurstErosion,
  erosionOnBreak: cartethyiaErosionOnBreak,
  erosionOnSwitchIn: cartethyiaErosionOnSwitchIn,
  lethalShield: cartethyiaLethalShield,
  turnCleanup: cartethyiaTurnCleanup
};