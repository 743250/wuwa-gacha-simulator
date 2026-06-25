// 战斗引擎：AP 回合制
// 玩家手动控制，敌方 AI 简单出招
//
// 战斗实例结构：见 createBattle()
// 对外暴露的核心 API：
//   createBattle(teamNames, enemyNames, options) → battle
//   doAction(battle, action) → { ok, log }   action: { type:'attack'|'skill'|'heavy'|'burst'|'switch', targetIdx?, switchTo? }
//   endTurn(battle) → 敌方回合 + 清理 buff
//   isWin(battle) / isLose(battle)

import { S } from '../state.js';
import { computeBattleStats } from './stats.js';
import { applyChainBonuses, applyTeamAuras, getEnergyRefund } from './chains.js';
import { spawnEnemy } from './enemies.js';
import { resistMultiplier, vibrationMultiplier } from './elements.js';
import { initForte, gainForte, consumeForte, forteEnhances } from './forte.js';
import { fireTrigger, collectWeaponBonus, tickWeaponTriggers } from './weaponTriggers.js';

// 有重击的角色（opt-in）：只有共鸣链/技能里明确提到重击的角色才启用
// 默认所有角色都无重击 —— 战斗中按钮禁用，技能区不显示重击行
const HAS_HEAVY_ROLES = new Set([
  '忌炎',    // 重击积锐意
  '长离',    // 重击焚身以火
  '珂莱塔',  // 重击末路见行
  '菲比',    // 重击星辉
  '卡提希娅',// 重击 / 强化重击 (空中攻击)
  '嘉贝莉娜',// 重击炼羽裁决
  '卡卡罗',  // 重击死告
  '安可'     // 白咩 / 黑咩重击
  // 注：椿在原作核心是普攻派生（红椿蕊 → 含苞），模拟器里没有"重击型"，已移出
]);

export function getCombatTeamNames(teamNames = S.team) {
  const seen = new Set();
  return (teamNames || []).filter(n => {
    if (!n || seen.has(n)) return false;
    const role = S.roles?.[n];
    if (!role || role.owned <= 0) return false;
    if (!computeBattleStats(n)) return false;
    seen.add(n);
    return true;
  });
}

// 创建战斗实例
// teamNames: 长度 1-3 的角色名数组（null 跳过）
// enemyNames: 长度 1-3 的敌人名数组
export function createBattle(teamNames, enemyNames, opts = {}) {
  const team = (teamNames || []).filter(Boolean).map((n, idx) => createTeamUnit(n, idx)).filter(Boolean);
  if (team.length === 0) return null;
  // 应用全队 buff（光环/守岸人之类）
  applyTeamAuras(team);

  const expectedEnemies = (enemyNames || []).filter(Boolean);
  const enemies = expectedEnemies.map((n, idx) => {
    const e = spawnEnemy(n, opts.enemyStatScale || opts.enemyScale || 1.0);
    if (e) e.idx = idx + 100;
    return e;
  }).filter(Boolean);
  if (enemies.length === 0 || enemies.length !== expectedEnemies.length) return null;

  const battle = {
    turn: 1,
    ap: 4,
    apMax: 4,
    active: 0,                  // 当前出手队员 idx（0/1/2）
    team,
    enemies,
    log: [],
    finished: false,
    result: null,               // 'win' | 'lose' | null
    initialHpTotal: team.reduce((a, t) => a + t.hpMax, 0),
    burstUsedThisTurn: false,   // 本回合用过解放后限制切人?（先不做这个限制）
    switchUsedThisTurn: false,  // 本回合是否已切人（每回合限 1 次）
    // 评星辅助
    burnTimer: {},              // 持续效果累计
    freezeOn: {}                // {teamIdx: turnsLeft}
  };
  battle.log.push({ type: 'system', msg: `战斗开始！队伍 ${team.map(t=>t.name).join(' / ')} VS ${enemies.map(e=>e.name).join(' / ')}` });
  battle.log.push({ type: 'system', msg: `回合 1 · 当前出手：${team[0].name}` });
  return battle;
}

function createTeamUnit(roleName, idx) {
  const s = computeBattleStats(roleName);
  if (!s) return null;
  const unit = {
    name: roleName,
    idx,
    chain: s.chain,
    level: s.level,
    hp: s.hp,
    hpMax: s.hp,
    atk: s.atk,
    def: s.def,
    crate: s.crate,
    cdmg: s.cdmg,
    dodge: s.dodge || 0,
    energy: 0,
    energyMax: s.maxEnergy,
    element: s.element,
    type: s.type,
    cd: { skill: 0, heavy: 0 },
    buffs: [],
    elemBonus: { ...(s.elemBonus || {}) },
    elemAllBonus: s.elemAllBonus || 0,
    normalBonus: s.normalBonus || 0,
    skillBonus: s.skillBonus || 0,
    burstBonus: s.burstBonus || 0,
    heavyBonus: s.heavyBonus || 0,
    healBonus: s.healBonus || 0,
    pierceDef: s.defPierce || 0,
    skillCdReduce: s.skillCdReduce || 0,
    resonanceBonus: s.resonanceBonus || 0,
    weapon: s.weapon,
    weaponTriggers: s.weaponTriggers || [],
    weaponStacks: {},                       // 触发器运行时叠层状态
    _weaponTeamAtk: s.teamAtkBonus || 0,
    alive: true,
    frozenTurns: 0,
    skillLockedTurns: 0,
    debuffs: [],
    energyRefund: 0,
    concerto: 0,                            // 协奏值 0-100
    forteStart: s.forteStart || 0,          // 真实数值角色：开局自带 forte 值
    ruiyi: 0,                               // 忌炎「锐意之势」当前层数（其他角色用不到）
    verdict: 0,                             // 吟霖「审判值」0-100（其他角色用不到）
    encoreDisorder: 0,                      // 安可「失序值」0-100（满后重击变白咩/黑咩特殊重击）
    hasHeavy: HAS_HEAVY_ROLES.has(roleName) // 是否有重击（opt-in，默认无重击）
  };
  initForte(unit);
  applyChainBonuses(unit);
  unit.energyRefund = getEnergyRefund(unit);
  return unit;
}

// ===== 伤害计算 =====
// dmgType: 'normal' | 'skill' | 'burst' | 'heavy'
function calcDamage(attacker, defender, multiplier, dmgType) {
  // 武器触发器实时加成
  const wb = collectWeaponBonus(attacker, dmgType, { target: defender });
  // buff 中的 atkUp（守岸人 2 链等）
  const buffAtkUp = (attacker.buffs || []).reduce((a, b) => b.type === 'atkUp' ? a + b.value : a, 0);
  // 临时增强后的攻击
  const atkWithBuff = attacker.atk * (1 + wb.atkBonus + buffAtkUp);
  const atkRaw = atkWithBuff * multiplier;
  // 类型加成
  let typeBonus = 1;
  if (dmgType === 'normal') typeBonus += (attacker.normalBonus || 0) + wb.normalBonus;
  else if (dmgType === 'skill') typeBonus += (attacker.skillBonus || 0) + wb.skillBonus;
  else if (dmgType === 'burst') typeBonus += (attacker.burstBonus || 0) + wb.burstBonus;
  else if (dmgType === 'heavy') typeBonus += (attacker.heavyBonus || 0) + wb.heavyBonus;
  // 临时 buff（如忌炎 4 链 奇正：全队重击 +25%）
  const heavyDmgBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'heavyDmgUp' ? a + b.value : a, 0);
  if (dmgType === 'heavy') typeBonus += heavyDmgBuff;
  // 元素加成
  const elemBase = (attacker.elemBonus?.[attacker.element] || 0) + (attacker.elemAllBonus || 0);
  const elemAdd = wb.elemBonus?.[attacker.element] || 0;
  const elemBonus = 1 + elemBase + elemAdd;
  // 强化窗口：卡卡罗 burstWindow、安可黑咩形态等
  const burstWin = attacker.buffs?.find(b => b.type === 'burstWindow');
  let windowBonus = burstWin && (dmgType === 'normal' || dmgType === 'skill') ? (1 + burstWin.value) : 1;
  // 安可：共鸣解放·黑咩大暴走后进入黑咩形态
  // 释放当回合已花 3 AP，所以窗口保留到后续 3 个完整我方回合结束
  // · 普攻/技能 ×1.5
  // · 重击（黑咩·暴走之炎）×1.8
  if (attacker.name === '安可' && (attacker.encoreBlackTurns || 0) > 0) {
    if (dmgType === 'normal' || dmgType === 'skill') windowBonus *= 1.5;
    if (dmgType === 'heavy') windowBonus *= 1.8;
  }
  // 卡提希娅气动侵蚀类 debuff
  let debuffBonus = 1;
  if (defender.debuffs) {
    defender.debuffs.forEach(d => {
      if (d.type === 'erosion' && d.element === attacker.element) {
        debuffBonus += d.value;
      }
    });
  }
  // 卡提希娅武器条件加成
  if (wb.condBonus) debuffBonus += wb.condBonus;
  // ★ 吟霖审判印记：所有攻击者命中印记目标时，按印记层数额外增伤（3 链 +15%/层）
  //   印记本身只是"标记"，倍率收益由攻击者的全队 yinlinMarkVulnPerStack 决定
  //   吟霖自己额外加 1 链（技能/解放 ×1.7）和 5 链（解放 ×2.0）
  const mark = defender.judgeMark;
  if (mark && mark.layers > 0) {
    const perStack = attacker.yinlinMarkVulnPerStack || 0;
    if (perStack > 0) debuffBonus += perStack * mark.layers;
    if (attacker.name === '吟霖') {
      if ((dmgType === 'skill' || dmgType === 'burst') && attacker.yinlinMarkSkillBonus) {
        debuffBonus *= (1 + attacker.yinlinMarkSkillBonus);  // 1 链：技能/解放 对印记目标 ×1.7
      }
      if (dmgType === 'burst' && attacker.yinlinMarkBurstBonus) {
        debuffBonus *= (1 + attacker.yinlinMarkBurstBonus);  // 5 链：解放 对印记目标 ×2.0
      }
    }
  }
  // 防御穿透
  const totalPierce = (attacker.pierceDef || 0) + wb.defPierce;
  const defEffective = defender.def * (1 - totalPierce);
  // 抗性
  const resistMult = resistMultiplier(attacker.element, defender);
  const vibrMult = vibrationMultiplier(defender);
  // 暴击（武器叠加暴击率？例如琼枝冰绡；浅析星域 buff crateUp）
  const crateBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'crateUp' ? a + b.value : a, 0);
  const cdmgBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'cdmgUp' ? a + b.value : a, 0);
  const totalCrate = attacker.crate + (wb.crateBonus || 0) + crateBuff;
  const effectiveCdmg = attacker.cdmg + cdmgBuff;
  const isCrit = Math.random() < totalCrate;
  const critMult = isCrit ? effectiveCdmg : 1.0;
  let dmg = (atkRaw + 50) * typeBonus * elemBonus * resistMult * vibrMult * critMult * windowBonus * debuffBonus;
  dmg = Math.max(50, dmg - defEffective * 0.4);
  dmg = Math.round(dmg);
  return { dmg, crit: isCrit, resistMult, vibrMult };
}

// 扣血（处理护盾、防御 buff、卡卡罗 burstWindow buff）
function dealDamage(target, dmg) {
  // 防御 buff
  const defBuff = target.buffs?.find(b => b.type === 'defense');
  if (defBuff) dmg = Math.round(dmg * (1 - defBuff.value));
  // 护盾
  if (target.shield && target.shield > 0) {
    if (dmg <= target.shield) { target.shield -= dmg; return 0; }
    else { dmg -= target.shield; target.shield = 0; }
  }
  target.hp = Math.max(0, target.hp - dmg);
  if (target.hp <= 0) target.alive = false;
  return dmg;
}

// 协奏值：满 100 切人时触发变奏/延奏（暂未实装变奏，只显示）
function gainConcerto(unit, amount) {
  unit.concerto = Math.min(100, (unit.concerto || 0) + amount);
}

// 协奏值消耗（变奏/延奏触发，触发武器被动）
function consumeConcerto(unit, battle) {
  if ((unit.concerto || 0) < 100) return false;
  unit.concerto = 0;
  // 触发武器：消耗协奏
  fireTrigger(unit, 'concerto_consume', { battle });
  battle.log.push({ type: 'mechanic', src: unit.name, msg: '协奏满 → 触发变奏 / 延奏' });
  return true;
}

// 削减敌人破韧值，归零进入易伤 2 回合（破韧瞬间不算）
// battle 传入用于：破韧瞬间 +2 AP（爆发窗口）
function reduceVibration(enemy, amount, battle) {
  if (!enemy || !enemy.alive) return;
  if (enemy.vibrationBroken > 0) return;   // 已经在易伤期，不再削
  enemy.vibration = Math.max(0, (enemy.vibration ?? 100) - amount);
  if (enemy.vibration <= 0) {
    enemy.vibrationBroken = 2;             // 持续到下次自己回合开始
    enemy._brokenFresh = true;             // 标记本回合刚破韧，end-of-turn 不减
    enemy.vibration = enemy.vibrationMax || 100;
    // ★ 破韧瞬间：当前回合 +2 AP（爆发窗口，模拟手游打硬直可快速连招）
    if (battle) {
      battle.ap = Math.min((battle.apMax || 4) + 2, battle.ap + 2);
      battle.log.push({ type: 'system', msg: `💥 ${enemy.name} 被击破！+2 AP 爆发窗口` });
    }
  }
}

function finishIfBattleEnded(battle, priority = 'lose') {
  if (!battle || battle.finished) return !!battle?.finished;
  const won = battle.enemies.length > 0 && battle.enemies.every(e => !e.alive);
  const lost = battle.team.length > 0 && battle.team.every(t => !t.alive);
  if (priority === 'win' && won) {
    battle.finished = true;
    battle.result = 'win';
    battle.log.push({ type: 'system', msg: '战斗胜利！' });
    return true;
  }
  if (lost) {
    battle.finished = true;
    battle.result = 'lose';
    battle.log.push({ type: 'system', msg: '队伍全灭。' });
    return true;
  }
  if (won) {
    battle.finished = true;
    battle.result = 'win';
    battle.log.push({ type: 'system', msg: '战斗胜利！' });
    return true;
  }
  return false;
}

function pickTeamTarget(battle, preferActive = true) {
  if (preferActive) {
    const active = battle.team[battle.active];
    if (active?.alive) return active;
  }
  const alives = battle.team.filter(t => t.alive);
  return alives.length ? alives[Math.floor(Math.random() * alives.length)] : null;
}

function inflictFreeze(unit, turns = 1) {
  if (!unit?.alive) return;
  // 状态在 endTurn 清理阶段会立刻 -1，所以这里多放 1，保证玩家下回合能实际感受到 1 回合控制。
  unit.frozenTurns = Math.max(unit.frozenTurns || 0, turns + 1);
}

function lockSkill(unit, turns = 1) {
  if (!unit?.alive) return;
  unit.skillLockedTurns = Math.max(unit.skillLockedTurns || 0, turns + 1);
}

function enemyAttack(battle, enemy, target, opts = {}) {
  if (!enemy?.alive || !target?.alive) return 0;
  const action = opts.action || '攻击';
  const mult = opts.mult || 1;
  if (Math.random() < (target.dodge || 0)) {
    battle.log.push({ type: 'dodge', src: enemy.name, tgt: target.name, action });
    return 0;
  }

  const resMult = resistMultiplier(enemy.element, { element: target.element });
  const debuffMult = (target.debuffs || []).reduce((m, d) => {
    if (d.type === 'erosion' && d.element === enemy.element) return m + d.value;
    return m;
  }, 1);
  const isCrit = Math.random() < (opts.critRate ?? 0.05);
  const critMult = isCrit ? (opts.critMult || 1.5) : 1.0;
  let dmg = (enemy.atk + 30) * mult * resMult * debuffMult * critMult;
  dmg = Math.max(30, dmg - target.def * 0.5);
  const real = dealDamage(target, Math.round(dmg));
  battle.log.push({ type: 'enemy_attack', src: enemy.name, tgt: target.name, dmg: real, crit: isCrit, action });
  return real;
}

function applyReflect(battle, attacker, defender, realDamage) {
  const m = defender?.mechanic;
  if (!attacker?.alive || !m || m.type !== 'reflect' || realDamage <= 0) return;
  if (m.cycle && battle.turn % m.cycle !== 0) return;
  const reflected = dealDamage(attacker, Math.round(realDamage * (m.value || 0.3)));
  if (reflected > 0) {
    battle.log.push({ type: 'mechanic', src: defender.name, msg: `反弹 ${attacker.name} ${reflected} 伤害` });
  }
}

function isMechanicTurn(m, turn) {
  return !!(m?.cycle && turn % m.cycle === 0);
}

function summonNameFor(enemy) {
  if (enemy.name === '聚械机偶') return '机偶小弟';
  if (enemy.name === '鸣式·利维亚坦') return '鸣式残响';
  return '幻象';
}

// ===== 忌炎「锐意之势」状态机 =====
// 创作者思路：忌炎是「攒势 → 解放终结」的爆发型主C
//   每次 重击 / 共鸣技能 / 变奏(切入) 积 1 层【锐意之势】，上限默认 2，6 链 3
//   释放共鸣解放时消耗全部锐意，每层放大解放伤害（默认 +100%，6 链 +120%）
//   3 链 观势：任何技能动作后，自身暴击 +16% / 暴伤 +32% / 2 回合
function jiyanGainRuiyi(self, source, battle) {
  if (self.name !== '忌炎') return;
  const cap = self.jiyanRuiyiCap || 2;
  const before = self.ruiyi || 0;
  self.ruiyi = Math.min(cap, before + 1);
  if (self.ruiyi > before) {
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${source} → 锐意之势 ${self.ruiyi}/${cap}` });
  }
}

// 3 链 观势：自身暴击/暴伤 buff（任意技能/重击/变奏/解放后刷新）
function jiyanGuanShiBuff(self, battle) {
  if (self.name !== '忌炎' || !self.jiyanGuanShi) return;
  const cfg = self.jiyanGuanShi;
  self.buffs = (self.buffs || []).filter(b => b.src !== '观势');
  self.buffs.push({ type: 'crateUp', value: cfg.crate, duration: cfg.dur + 1, src: '观势' });
  self.buffs.push({ type: 'cdmgUp',  value: cfg.cdmg,  duration: cfg.dur + 1, src: '观势' });
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `观势 · 暴击 +${(cfg.crate*100).toFixed(0)}% / 暴伤 +${(cfg.cdmg*100).toFixed(0)}%（${cfg.dur} 回合）`
  });
}

// ===== 安可「失序值 / 黑咩大暴走」状态机 =====
// 原版思路：安可不是单纯解放 AOE，而是「失序值满 → 特殊重击」+「解放进入黑咩强化形态」。
// 模拟器抽象：
//   · 失序值 0-100：普攻 +20 / 共鸣技能 +35 / 普通重击 +20 / 变奏 +30；黑咩窗口内命中额外 +10
//   · 失序值满时施放重击：消耗 100 失序值，改为白咩·失控之炎 / 黑咩·暴走之炎（按共鸣解放伤害结算）
//   · 共鸣解放·黑咩大暴走：进入黑咩窗口（释放当回合 + 后续 3 个完整我方回合），普攻/技能/重击强化
function encoreGainDisorder(self, amount, source, battle) {
  if (self.name !== '安可') return;
  const extra = (self.encoreBlackTurns || 0) > 0 ? 10 : 0;
  const gain = amount + extra;
  const before = self.encoreDisorder || 0;
  self.encoreDisorder = Math.min(100, before + gain);
  if (self.forte?.resourceName === '失序值') {
    self.forte.current = self.encoreDisorder;
    self.forte.ready = self.encoreDisorder >= 100;
  }
  if (self.encoreDisorder > before) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `${source} → 失序值 ${self.encoreDisorder}/100${extra ? '（黑咩 +10）' : ''}`
    });
  }
}


// 创作者思路：吟霖是「攒审判值 → 引爆印记」的标记型副C
//   普攻 / 共鸣技能积"审判值"，满 100 自动触发"审判之雷" → 给当前主目标挂"审判印记"
//   印记挂在敌人身上，所有攻击者命中印记目标时，按印记层数额外增伤（3 链 +15%/层）
//   吟霖自己 1 链/5 链对印记目标技能/解放追加倍率
//   2 链：吟霖命中印记目标 +5 审判 +5 能量；4 链：触发审判之雷时全队 atk +20%/2 回合
//   6 链：解放后 2 回合，吟霖普攻命中印记目标额外触发疾霆昭彰（atk×100% 导电，每回合 1 次）
const YINLIN_MARK_CAP = 3;
const YINLIN_MARK_DURATION = 3;

function yinlinGainVerdict(self, amount, source, battle) {
  if (self.name !== '吟霖') return;
  const before = self.verdict || 0;
  self.verdict = Math.min(100, before + amount);
  if (self.verdict >= 100) {
    self.verdict = 0;
    yinlinTriggerJudgment(self, battle, source);
  } else if (self.verdict > before) {
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${source} → 审判值 ${self.verdict}/100` });
  }
}

// 触发审判之雷：给当前主目标挂印记，全队 atk +20%（4 链）
function yinlinTriggerJudgment(self, battle, source) {
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return;
  const targetIdx = (typeof battle.targetIdx === 'number') ? battle.targetIdx : -1;
  const target = (battle.enemies[targetIdx] && battle.enemies[targetIdx].alive) ? battle.enemies[targetIdx] : aliveEnemies[0];
  yinlinAddMark(target, 1);
  battle.log.push({
    type: 'mechanic', src: self.name,
    msg: `审判之雷！${source} 满审判值 → ${target.name} 获得审判印记`
  });
  // 4 链：触发审判之雷时全队攻击 +20% / 2 回合
  if (self.yinlinJudgmentTeamAtk) {
    const cfg = self.yinlinJudgmentTeamAtk;
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '前行的鼓舞');
      t.buffs.push({ type: 'atkUp', value: cfg.value, duration: cfg.dur + 1, src: '前行的鼓舞' });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `前行的鼓舞 · 全队攻击 +${(cfg.value*100).toFixed(0)}%（${cfg.dur} 回合）`
    });
  }
}

// 给敌人加 N 层印记（上限 3，回合数会延续）
function yinlinAddMark(target, layers) {
  const before = target.judgeMark;
  if (before) {
    target.judgeMark = {
      layers: Math.min(YINLIN_MARK_CAP, before.layers + layers),
      remaining: YINLIN_MARK_DURATION
    };
  } else {
    target.judgeMark = { layers: Math.min(YINLIN_MARK_CAP, layers), remaining: YINLIN_MARK_DURATION };
  }
}

// 吟霖普攻/技能命中后：若目标有印记，2 链给吟霖 +5 审判 +5 能量；命中本身也叠 1 层
function yinlinOnHit(self, target, dmgType, battle) {
  if (self.name !== '吟霖') return;
  if (!target || !target.judgeMark) return;
  // 2 链：命中印记目标 +5 审判 +5 能量
  if (self.yinlinMarkRefund) {
    self.verdict = Math.min(100, (self.verdict || 0) + self.yinlinMarkRefund.verdict);
    self.energy = Math.min(self.energyMax, self.energy + self.yinlinMarkRefund.energy);
  }
  // 命中再叠 1 层印记（普攻/技能/解放都算）
  yinlinAddMark(target, 1);
  // 6 链：解放后 2 回合内，吟霖普攻命中印记目标额外触发疾霆昭彰（每回合 1 次）
  if (dmgType === 'normal' && self.yinlinJiTingActive && !self._jiTingFiredThisTurn && self.yinlinJiTing) {
    self._jiTingFiredThisTurn = true;
    const { dmg, crit } = calcDamage(self, target, self.yinlinJiTing.value, 'skill');
    const real = dealDamage(target, dmg);
    battle.log.push({
      type: 'attack', src: self.name, tgt: target.name, dmg: real, crit,
      action: '疾霆昭彰（6 链）'
    });
  }
}

// ===== 玩家动作 =====

// 普攻：1 AP，单体，100% atk
// 守岸人 5 链：normalSplit = 2，会额外打一个相邻敌人
export function doAttack(battle, targetIdx) {
  if (battle.finished || battle.ap < 1) return { ok: false, err: 'AP 不足' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  const fEnh = forteEnhances(self, 'normal');
  const mult = fEnh ? 1.0 * fEnh.effectMult : 1.0;
  const { dmg, crit } = calcDamage(self, target, mult, 'normal');
  const real = dealDamage(target, dmg);
  reduceVibration(target, 8 + (fEnh ? 12 : 0), battle);
  applyReflect(battle, self, target, real);
  battle.log.push({
    type: 'attack', src: self.name, tgt: target.name, dmg: real, crit,
    action: fEnh ? `${fEnh.resourceName}强化普攻` : '普攻'
  });
  // ★ 守岸人 5 链：自动多打一个相邻敌人
  if ((self.normalSplit || 1) >= 2) {
    const aliveOthers = battle.enemies.filter(e => e.alive && e !== target);
    if (aliveOthers.length) {
      const extra = aliveOthers[Math.floor(Math.random() * aliveOthers.length)];
      const { dmg: dmg2, crit: crit2 } = calcDamage(self, extra, mult, 'normal');
      const real2 = dealDamage(extra, dmg2);
      reduceVibration(extra, 6, battle);
      applyReflect(battle, self, extra, real2);
      battle.log.push({
        type: 'attack', src: self.name, tgt: extra.name, dmg: real2, crit: crit2,
        action: '链击（5 链）'
      });
    }
  }
  battle.ap -= 1;
  // 共鸣效率：影响共鸣解放充能（能量值）回复速度
  self.energy = Math.min(self.energyMax, self.energy + 12 * (1 + self.resonanceBonus));
  gainConcerto(self, 8);
  gainForte(self, 'normal');
  if (fEnh) consumeForte(self);
  // 触发武器被动：普攻命中
  fireTrigger(self, 'normal_hit', { battle, target });
  // 安可：普攻积失序；黑咩窗口内额外 +10
  encoreGainDisorder(self, 20, (self.encoreBlackTurns || 0) > 0 ? '普攻·黑咩·胡闹' : '普攻·羊咩出击', battle);
  // 吟霖：普攻 +15 审判 + 命中印记回调（2 链 / 6 链疾霆昭彰）
  yinlinOnHit(self, target, 'normal', battle);
  yinlinGainVerdict(self, 15, '普攻', battle);
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 共鸣技能：1 AP，CD 3 回合，单体 180% atk
export function doSkill(battle, targetIdx) {
  if (battle.finished || battle.ap < 1) return { ok: false, err: 'AP 不足' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  if (self.skillLockedTurns > 0) return { ok: false, err: `技能被封锁中（${self.skillLockedTurns} 回合）` };
  if (self.cd.skill > 0) return { ok: false, err: `技能冷却中（${self.cd.skill} 回合）` };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  const fEnh = forteEnhances(self, 'skill');
  const mult = fEnh && fEnh.effectMult ? 1.8 * fEnh.effectMult : 1.8;
  const { dmg, crit } = calcDamage(self, target, mult, 'skill');
  const real = dealDamage(target, dmg);
  reduceVibration(target, 20 + (fEnh ? 20 : 0), battle);
  applyReflect(battle, self, target, real);
  battle.ap -= 1;
  self.cd.skill = Math.max(1, 3 - (self.skillCdReduce || 0));
  self.energy = Math.min(self.energyMax, self.energy + (22 + self.energyRefund) * (1 + self.resonanceBonus));
  gainConcerto(self, 18);
  gainForte(self, 'skill');

  // ★ 守岸人共鸣技能 · 混沌理论：附带全队治疗（治疗 = HP 上限 × 6% + ATK × 0.5）
  //   贴近原版"治疗按 HP 上限算 + 小幅攻击加成"的公式，治疗位面板再低也能稳定奶量
  if (self.name === '守岸人') {
    const fourChain = self.healBuff4Chain || 0;       // 4 链：治疗 +70%
    const healUp4 = 1 + (self.healBonus || 0) + fourChain;
    battle.team.forEach(t => {
      if (!t.alive) return;
      const baseHeal = Math.round(t.hpMax * 0.06 + self.atk * 0.5);
      const healUp = (t.buffs || []).reduce((a, b) => b.type === 'healUp' ? a + b.value : a, 0);
      const finalHeal = Math.round(baseHeal * healUp4 * (1 + healUp));
      const healed = Math.min(t.hpMax - t.hp, finalHeal);
      t.hp += healed;
      if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed });
    });
  }

  if (fEnh) consumeForte(self);

  if (fEnh && fEnh.effectType === 'erosion') {
    target.debuffs = target.debuffs || [];
    target.debuffs.push({ type: 'erosion', element: '气动', value: fEnh.effectMult, duration: 3 });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `${target.name} 进入气动侵蚀（受气动伤害 +${(fEnh.effectMult*100).toFixed(0)}%）` });
  }
  // 触发武器被动：技能命中
  fireTrigger(self, 'skill_hit', { battle, target });
  // 治疗型技能（辅助/治疗位 用技能视为 heal_skill）
  if (self.type === '辅助' || self.type === '治疗') {
    fireTrigger(self, 'heal_skill', { battle });
  }
  battle.log.push({
    type: 'skill', src: self.name, tgt: target.name, dmg: real, crit,
    action: fEnh ? `${fEnh.resourceName}强化技能` : '共鸣技能'
  });
  // 忌炎：共鸣技能积锐意 + 3 链观势
  jiyanGainRuiyi(self, '共鸣技能', battle);
  jiyanGuanShiBuff(self, battle);
  // 安可：共鸣技能积失序；黑咩窗口内视为黑咩·狂热并额外 +10
  encoreGainDisorder(self, 35, (self.encoreBlackTurns || 0) > 0 ? '共鸣技能·黑咩·狂热' : '共鸣技能·热力羊咩', battle);
  // 吟霖：共鸣技能 +30 审判 + 命中印记回调
  yinlinOnHit(self, target, 'skill', battle);
  yinlinGainVerdict(self, 30, '共鸣技能', battle);
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 共鸣解放：3 AP，能量满，AOE，主目标 400% / 副目标 200%
export function doBurst(battle) {
  if (battle.finished || battle.ap < 3) return { ok: false, err: 'AP 不足（需 3）' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  if (self.energy < self.energyMax) return { ok: false, err: `能量不足（${self.energy}/${self.energyMax}）` };
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (!aliveEnemies.length) return { ok: false, err: '没有目标' };
  // 主目标 = 当前选中（targetIdx），若死/无效则取第一只活着的
  const targetIdx = (typeof battle.targetIdx === 'number') ? battle.targetIdx : -1;
  const primary = (battle.enemies[targetIdx] && battle.enemies[targetIdx].alive) ? battle.enemies[targetIdx] : aliveEnemies[0];
  const fEnh = forteEnhances(self, 'burst');
  // ★ 忌炎「锐意之势」：消耗所有锐意，每层 +100%（6 链 +120%）解放伤害
  //   2 层 = 解放 ×3（默认）；6 链 3 层 = 解放 ×4.6（默认）/ ×4.6（默认 +120%）
  let ruiyiMult = 1.0;
  let ruiyiUsed = 0;
  if (self.name === '忌炎' && self.ruiyi > 0) {
    ruiyiUsed = self.ruiyi;
    const perStack = self.jiyanRuiyiPerStack || 1.0;
    ruiyiMult = 1.0 + ruiyiUsed * perStack;
    self.ruiyi = 0;
  }
  // 主目标 400%、副目标 200%（命中前结算）。fEnh 的 effectMult 直接乘在双倍率上
  const baseMain = 4.0 * (fEnh ? fEnh.effectMult : 1.0) * ruiyiMult;
  const baseSide = 2.0 * (fEnh ? fEnh.effectMult : 1.0) * ruiyiMult;
  if (ruiyiUsed > 0) {
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `消耗锐意之势 ${ruiyiUsed} 层 → 解放伤害 ×${ruiyiMult.toFixed(1)}`
    });
  }
  const results = aliveEnemies.map(e => {
    const mult = (e === primary) ? baseMain : baseSide;
    const { dmg, crit } = calcDamage(self, e, mult, 'burst');
    const real = dealDamage(e, dmg);
    reduceVibration(e, 30, battle);
    applyReflect(battle, self, e, real);
    return { tgt: e.name, dmg: real, crit, primary: e === primary };
  });
  battle.ap -= 3;
  self.energy = 0;
  gainConcerto(self, 30);
  gainForte(self, 'burst');
  if (fEnh) consumeForte(self);
  if (fEnh && fEnh.effectType === 'teamShield') {
    battle.team.forEach(t => {
      if (t.alive) {
        const sh = Math.round(t.hpMax * fEnh.effectMult);
        t.shield = (t.shield || 0) + sh;
      }
    });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `全队展开领域，获得最大生命 ${(fEnh.effectMult*100).toFixed(0)}% 护盾` });
  }
  if (fEnh && fEnh.effectType === 'burstWindow') {
    self.buffs.push({ type: 'burstWindow', value: fEnh.effectMult - 1, duration: 2 });
    battle.log.push({ type: 'mechanic', src: self.name, msg: `进入强化形态（攻击/技能 +${((fEnh.effectMult-1)*100).toFixed(0)}%，持续 2 回合）` });
  }

  // ★ 安可：共鸣解放 · 黑咩大暴走 → 进入黑咩形态（释放当回合 + 后续 3 个完整我方回合）
  if (self.name === '安可') {
    self.encoreBlackTurns = 4; // endTurn 会立刻 -1；设 4 = 释放当回合 + 后续 3 个完整我方回合
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: '黑咩大暴走 · 进入黑咩形态（后续 3 回合），普攻/技能/重击获得强化'
    });
  }

  // ★★★ 守岸人核心：共鸣解放 · 终末回环 → 展开「星域」
  //   作者意图：领域是守岸人的全部价值。一按解放 = 全队进入"持续治疗 + 暴击 buff"状态。
  //   普攻、技能、变奏都不抢戏，所有共鸣链都改这个领域的参数。
  if (self.name === '守岸人') {
    // 基础参数：3 回合 / 全队每回合回 ATK×0.8 治疗 / 暴击 +20% / 暴伤 +30%
    // 1 链 → 持续延长 2 回合 + 切人不消散；治疗与增益强度 ×2.5
    // 2 链 → 附带攻击 +25%（与暴击 buff 同源）
    // 4 链 → 持续治疗 ×1.7
    // 其他链不进领域 buff，按各自机制处理
    const dur1Chain = self.fieldExtendDur || 0;
    const baseDur = 3 + dur1Chain;
    const heal4chain = 1 + (self.healBuff4Chain || 0);
    const heal1chain = self.fieldPersistOnSwitch ? 2.5 : 1.0;     // 1 链：增益强度 ×2.5
    const hot = Math.round(self.atk * 0.8 * heal4chain * heal1chain);
    const fieldCrate = (0.20 + (self.fieldExtraCrate || 0)) * heal1chain;
    const fieldCdmg = 0.30 * heal1chain;
    const fieldAtk = (self.fieldExtraAtk || 0) * heal1chain;     // 2 链：+40% × heal1chain

    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '星域');
      t.buffs.push({ type: 'healOverTime', value: hot, duration: baseDur, src: '星域', persistent: !!self.fieldPersistOnSwitch });
      t.buffs.push({ type: 'crateUp', value: fieldCrate, duration: baseDur, src: '星域', persistent: !!self.fieldPersistOnSwitch });
      t.buffs.push({ type: 'cdmgUp', value: fieldCdmg, duration: baseDur, src: '星域', persistent: !!self.fieldPersistOnSwitch });
      if (fieldAtk > 0) {
        t.buffs.push({ type: 'atkUp', value: fieldAtk, duration: baseDur, src: '星域', persistent: !!self.fieldPersistOnSwitch });
      }
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `「星域 · 终末回环」展开 · 全队每回合回血 ${hot} · 暴击 +${(fieldCrate*100).toFixed(0)}% · 暴伤 +${(fieldCdmg*100).toFixed(0)}%${fieldAtk>0?` · 攻击 +${(fieldAtk*100).toFixed(0)}%`:''}（${baseDur} 回合${self.fieldPersistOnSwitch?' · 切人不结束':''}）`
    });
  }

  // ★ 忌炎 3 链 观势：解放后自身暴击/暴伤 buff
  jiyanGuanShiBuff(self, battle);
  // ★ 忌炎 4 链 奇正：解放后全队重击伤害 +25% / 2 回合
  if (self.name === '忌炎' && self.jiyanQiZheng) {
    const cfg = self.jiyanQiZheng;
    battle.team.forEach(t => {
      if (!t.alive) return;
      t.buffs = (t.buffs || []).filter(b => b.src !== '奇正');
      t.buffs.push({ type: 'heavyDmgUp', value: cfg.value, duration: cfg.dur + 1, src: '奇正' });
    });
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `奇正 · 全队重击伤害 +${(cfg.value*100).toFixed(0)}%（${cfg.dur} 回合）`
    });
  }

  // 触发武器被动：解放释放
  fireTrigger(self, 'burst_cast', { battle });
  // 协奏值满后视为切人（变奏/延奏）
  if (self.concerto >= 100) {
    consumeConcerto(self, battle);
  }
  // ★ 守岸人 3 链：解放后额外回 20 能量（CD 2 回合）
  if (self.burstEnergyRefund > 0) {
    if (!self._burstRefundCdLeft || self._burstRefundCdLeft <= 0) {
      const refund = self.burstEnergyRefund;
      self.energy = Math.min(self.energyMax, self.energy + refund);
      self._burstRefundCdLeft = self.burstEnergyRefundCd || 2;
      battle.log.push({ type: 'mechanic', src: self.name, msg: `共鸣链 3 · 解放后额外回复 ${refund} 能量（CD ${self.burstEnergyRefundCd||2} 回合）` });
    }
  }
  // ★ 吟霖：解放后主目标必挂审判印记 + 4 链全队 atk buff + 6 链开启疾霆窗口
  if (self.name === '吟霖') {
    yinlinAddMark(primary, 1);
    battle.log.push({
      type: 'mechanic', src: self.name,
      msg: `破天雷灭击 → ${primary.name} 获得审判印记`
    });
    if (self.yinlinJudgmentTeamAtk) {
      const cfg = self.yinlinJudgmentTeamAtk;
      battle.team.forEach(t => {
        if (!t.alive) return;
        t.buffs = (t.buffs || []).filter(b => b.src !== '前行的鼓舞');
        t.buffs.push({ type: 'atkUp', value: cfg.value, duration: cfg.dur + 1, src: '前行的鼓舞' });
      });
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: `前行的鼓舞 · 全队攻击 +${(cfg.value*100).toFixed(0)}%（${cfg.dur} 回合）`
      });
    }
    if (self.yinlinJiTing) {
      self.yinlinJiTingActive = self.yinlinJiTing.dur + 1;   // +1 因 endTurn 当前回合也会 -1
      battle.log.push({
        type: 'mechanic', src: self.name,
        msg: `疾霆昭彰 · 普攻命中印记目标额外触发（持续 ${self.yinlinJiTing.dur} 回合）`
      });
    }
  }
  battle.log.push({
    type: 'burst', src: self.name, results,
    action: fEnh ? `${fEnh.resourceName}强化解放` : '共鸣解放'
  });

  // 其他治疗/辅助位（非守岸人）：解放时一次性治疗全队
  if ((self.type === '辅助' || self.type === '治疗') && self.name !== '守岸人') {
    const healAmt = Math.round(self.atk * 1.5 * (1 + (self.healBonus || 0)));
    battle.team.forEach(t => {
      if (t.alive) {
        const healUp = (t.buffs || []).reduce((a, b) => b.type === 'healUp' ? a + b.value : a, 0);
        const finalHeal = Math.round(healAmt * (1 + healUp));
        const healed = Math.min(t.hpMax - t.hp, finalHeal);
        t.hp += healed;
        if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed });
      }
    });
  }
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 重击：2 AP，CD 1，220% atk · 重击伤害类型 · 削破韧 25
export function doHeavy(battle, targetIdx) {
  if (battle.finished || battle.ap < 2) return { ok: false, err: 'AP 不足（需 2）' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (!self.hasHeavy) return { ok: false, err: `${self.name} 没有重击` };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  if (self.cd.heavy > 0) return { ok: false, err: `重击冷却中（${self.cd.heavy} 回合）` };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  // 安可特殊重击：失序值满时，重击改为白咩·失控之炎 / 黑咩·暴走之炎
  // 官方归类为共鸣解放伤害，因此这里用 dmgType='burst' 结算，但仍消耗 2 AP 和重击 CD。
  const isEncore = self.name === '安可';
  const encoreBlack = isEncore && (self.encoreBlackTurns || 0) > 0;
  const encoreSpecial = isEncore && (self.encoreDisorder || 0) >= 100;
  const heavyMult = encoreSpecial
    ? (encoreBlack ? 4.5 : 3.5) * (1 + (self.heavyBonus || 0))
    : 2.2;
  const heavyType = encoreSpecial ? 'burst' : 'heavy';
  const { dmg, crit } = calcDamage(self, target, heavyMult, heavyType);
  const real = dealDamage(target, dmg);
  reduceVibration(target, encoreSpecial ? 35 : 25, battle);
  applyReflect(battle, self, target, real);
  battle.ap -= 2;
  self.cd.heavy = 1;
  self.energy = Math.min(self.energyMax, self.energy + 15 * (1 + self.resonanceBonus));
  gainConcerto(self, 14);
  gainForte(self, 'heavy');
  fireTrigger(self, 'heavy_hit', { battle, target });
  let heavyAction = '重击';
  if (isEncore) {
    if (encoreSpecial) {
      heavyAction = encoreBlack ? '黑咩·暴走之炎（失序满）' : '白咩·失控之炎（失序满）';
      self.encoreDisorder = 0;
      if (self.forte?.resourceName === '失序值') {
        self.forte.current = 0;
        self.forte.ready = false;
      }
      battle.log.push({ type: 'mechanic', src: self.name, msg: '消耗失序值 100 → 触发' + (encoreBlack ? '黑咩·暴走之炎' : '白咩·失控之炎') });
    } else {
      heavyAction = encoreBlack ? '黑咩·重击' : '重击';
      encoreGainDisorder(self, 20, encoreBlack ? '黑咩·重击' : '重击', battle);
    }
  }
  battle.log.push({ type: 'heavy', src: self.name, tgt: target.name, dmg: real, crit, action: heavyAction });
  // 忌炎：重击积锐意 + 3 链观势
  jiyanGainRuiyi(self, '重击', battle);
  jiyanGuanShiBuff(self, battle);
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 切换角色（每回合限 1 次）
// 每次切人触发简化版变奏（入场角色对敌方一击 + 削破韧）
// 协奏满时强化：变奏伤害提升 + 武器 outro/variation 触发器激活
export function doSwitch(battle, toIdx) {
  if (battle.finished) return { ok: false, err: '战斗已结束' };
  if (toIdx === battle.active) return { ok: false, err: '已在该角色' };
  if (battle.switchUsedThisTurn) return { ok: false, err: '本回合已经切换过角色' };
  const target = battle.team[toIdx];
  if (!target || !target.alive) return { ok: false, err: '目标不可切换' };
  if (target.frozenTurns > 0) return { ok: false, err: '目标被冻结' };
  const prev = battle.team[battle.active];
  const concertoFull = prev && (prev.concerto || 0) >= 100;
  battle.active = toIdx;
  battle.switchUsedThisTurn = true;

  // 离场角色延奏 → 给入场角色一个"上场增益"
  if (prev && prev.alive) {
    // 离场角色的 outro 武器被动（如停驻之烟：延奏后下场角色攻击+10%）
    fireTrigger(prev, 'outro', { battle });
  }
  // 入场角色变奏：对当前主目标造成一段伤害
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  if (aliveEnemies.length) {
    const tgt = aliveEnemies[0];
    // 变奏倍率：基础 80%，协奏满时 ×2 = 160%
    let variMult = concertoFull ? 1.6 : 0.8;
    // ★ 守岸人 6 链：变奏伤害 +500%（×6）
    if (target.variationBonus > 0) {
      variMult *= (1 + target.variationBonus);
    }
    const { dmg, crit } = calcDamage(target, tgt, variMult, 'normal');
    const real = dealDamage(tgt, dmg);
    reduceVibration(tgt, concertoFull ? 25 : 10, battle);
    applyReflect(battle, target, tgt, real);
    battle.log.push({
      type: 'attack', src: target.name, tgt: tgt.name, dmg: real, crit,
      action: target.variationBonus > 0 ? '强化变奏 · 6链' : (concertoFull ? '强化变奏' : '变奏')
    });
  }
  // 协奏值满时清空 + 触发 variation 武器被动
  if (concertoFull) {
    prev.concerto = 0;
    fireTrigger(target, 'variation', { battle });
    battle.log.push({ type: 'mechanic', src: prev.name, msg: `协奏满 · ${prev.name} 延奏 → ${target.name} 强化变奏` });
  }
  battle.log.push({ type: 'switch', src: target.name, action: '切换上场' });
  // 安可：变奏·咩咩帮手命中回复失序值
  if (target.name === '安可') {
    encoreGainDisorder(target, 30, '变奏·咩咩帮手', battle);
  }
  // ★ 忌炎入场（变奏）：积锐意 + 2 链通变 + 5 链明断 + 3 链观势
  if (target.name === '忌炎') {
    jiyanGainRuiyi(target, '变奏入场', battle);
    jiyanGuanShiBuff(target, battle);
    // 2 链 通变：直接送破阵 + 攻击 buff
    if (target.jiyanTongBian) {
      const cfg = target.jiyanTongBian;
      if (target.forte && cfg.forteGain > 0) {
        target.forte.current = Math.min(target.forte.max, target.forte.current + cfg.forteGain);
        if (target.forte.current >= target.forte.max) target.forte.ready = true;
      }
      target.buffs = (target.buffs || []).filter(b => b.src !== '通变');
      target.buffs.push({ type: 'atkUp', value: cfg.atkUp, duration: cfg.dur + 1, src: '通变' });
      battle.log.push({
        type: 'mechanic', src: target.name,
        msg: `通变 · 破阵值 +${cfg.forteGain} · 攻击 +${(cfg.atkUp*100).toFixed(0)}%（${cfg.dur} 回合）`
      });
    }
    // 5 链 明断：攻击 +45%（与 2 链 atkUp 并存）
    if (target.jiyanMingDuan) {
      const cfg = target.jiyanMingDuan;
      target.buffs = (target.buffs || []).filter(b => b.src !== '明断');
      target.buffs.push({ type: 'atkUp', value: cfg.value, duration: cfg.dur + 1, src: '明断' });
      battle.log.push({
        type: 'mechanic', src: target.name,
        msg: `明断 · 攻击 +${(cfg.value*100).toFixed(0)}%（${cfg.dur} 回合）`
      });
    }
  }
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// ===== 回合切换 =====

// 我方结束回合，敌方出手
export function endTurn(battle) {
  if (battle.finished) return;
  // 敌方出招
  battle.enemies.forEach(enemy => {
    if (!enemy.alive) return;
    const target = pickTeamTarget(battle);
    if (!target) return;
    // 狂暴触发判定
    if (enemy.mechanic.type === 'enrage' && !enemy.enraged && enemy.hp / enemy.hpMax <= enemy.mechanic.threshold) {
      enemy.atk = Math.round(enemy.atk * (1 + enemy.mechanic.atkBonus));
      enemy.enraged = true;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `狂暴！攻击 +${(enemy.mechanic.atkBonus*100).toFixed(0)}%` });
    }
    // 护盾触发
    if (enemy.mechanic.type === 'shield' && !enemy._shielded && enemy.hp / enemy.hpMax <= enemy.mechanic.threshold) {
      enemy.shield = enemy.mechanic.value;
      enemy._shielded = true;
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `生成护盾 ${enemy.mechanic.value}！` });
    }
    enemyAttack(battle, enemy, target);
  });
  if (finishIfBattleEnded(battle, 'lose')) return;

  // 触发持续机制
  battle.enemies.forEach(enemy => {
    if (!enemy.alive) return;
    const m = enemy.mechanic;
    if (m.type === 'burn_team' && isMechanicTurn(m, battle.turn)) {
      battle.team.forEach(t => {
        if (!t.alive) return;
        const dmg = Math.round(t.hpMax * m.dmgPct);
        const real = dealDamage(t, dmg);
        battle.log.push({ type: 'burn', src: enemy.name, tgt: t.name, dmg: real });
      });
    } else if (m.type === 'freeze' && isMechanicTurn(m, battle.turn)) {
      const alives = battle.team.filter(t => t.alive);
      if (alives.length) {
        const tgt = alives[Math.floor(Math.random() * alives.length)];
        inflictFreeze(tgt, 1);
        battle.log.push({ type: 'freeze', src: enemy.name, tgt: tgt.name });
      }
    } else if (m.type === 'minion' && isMechanicTurn(m, battle.turn)) {
      const summonName = summonNameFor(enemy);
      const minion = spawnEnemy(summonName, 1);
      if (minion) {
        minion.idx = 100 + battle.enemies.length;
        minion.isMinion = true;
        battle.enemies.push(minion);
        battle.log.push({ type: 'summon', src: enemy.name, tgt: summonName });
      }
    } else if (m.type === 'thunder_chain' && isMechanicTurn(m, battle.turn)) {
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '释放雷电连段' });
      for (let i = 0; i < 3; i++) {
        const tgt = pickTeamTarget(battle, i === 0);
        if (!tgt) break;
        enemyAttack(battle, enemy, tgt, { mult: m.mult || 0.6, action: '雷电连段' });
      }
    } else if (m.type === 'dive' && isMechanicTurn(m, battle.turn)) {
      const tgt = pickTeamTarget(battle);
      if (tgt) {
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: '俯冲压制' });
        enemyAttack(battle, enemy, tgt, { mult: m.mult || 1.4, action: '俯冲' });
      }
    } else if (m.type === 'aoe_freeze' && isMechanicTurn(m, battle.turn)) {
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '释放冰雾，全队受击并冻结当前角色' });
      battle.team.forEach(t => {
        if (!t.alive) return;
        enemyAttack(battle, enemy, t, { mult: m.mult || 0.45, action: '冰雾' });
      });
      const tgt = pickTeamTarget(battle);
      if (tgt) {
        inflictFreeze(tgt, 1);
        battle.log.push({ type: 'freeze', src: enemy.name, tgt: tgt.name });
      }
    } else if (m.type === 'data_lock' && isMechanicTurn(m, battle.turn)) {
      const alives = battle.team.filter(t => t.alive);
      if (alives.length) {
        const tgt = alives[Math.floor(Math.random() * alives.length)];
        lockSkill(tgt, 1);
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `数据封锁 ${tgt.name} 的技能` });
      }
    } else if (m.type === 'aero_erosion' && isMechanicTurn(m, battle.turn)) {
      const tgt = pickTeamTarget(battle);
      if (tgt) {
        tgt.debuffs = tgt.debuffs || [];
        tgt.debuffs.push({ type: 'erosion', element: '气动', value: m.value || 0.15, duration: m.duration || 2 });
        battle.log.push({ type: 'mechanic', src: enemy.name, msg: `${tgt.name} 受到气动侵蚀` });
      }
    }
  });
  if (finishIfBattleEnded(battle, 'lose')) return;

  // 清 buff/CD
  battle.team.forEach(t => {
    // 浅析星域：healOverTime 持续治疗（每回合结束触发一次）
    (t.buffs || []).forEach(b => {
      if (b.type === 'healOverTime' && t.alive && b.value > 0) {
        const healUp = (t.buffs || []).reduce((a, x) => x.type === 'healUp' ? a + x.value : a, 0);
        const realHeal = Math.round(b.value * (1 + healUp));
        const healed = Math.min(t.hpMax - t.hp, realHeal);
        t.hp += healed;
        if (healed > 0) battle.log.push({ type: 'heal', src: b.src || '星域', tgt: t.name, dmg: healed });
      }
    });
    t.buffs = (t.buffs || []).filter(b => --b.duration > 0);
    if (t.cd.skill > 0) t.cd.skill--;
    if (t.cd.heavy > 0) t.cd.heavy--;
    if (t.frozenTurns > 0) t.frozenTurns--;
    if (t.skillLockedTurns > 0) t.skillLockedTurns--;
    t.debuffs = (t.debuffs || []).filter(d => --d.duration > 0);
    // 守岸人 3 链：burstRefund CD
    if (t._burstRefundCdLeft > 0) t._burstRefundCdLeft--;
    // 吟霖：6 链疾霆窗口倒计时 + 清"本回合疾霆已触发"标记
    if (t.name === '吟霖') {
      if (t.yinlinJiTingActive > 0) {
        t.yinlinJiTingActive--;
        if (t.yinlinJiTingActive === 0) {
          battle.log.push({ type: 'mechanic', src: t.name, msg: '疾霆昭彰 · 效果结束' });
        }
      }
      t._jiTingFiredThisTurn = false;
    }
    // 安可：黑咩形态持续时间倒计时
    if (t.name === '安可' && t.encoreBlackTurns > 0) {
      t.encoreBlackTurns--;
      if (t.encoreBlackTurns === 0) {
        battle.log.push({ type: 'mechanic', src: t.name, msg: '黑咩大暴走结束 · 回到白咩形态' });
      }
    }
    // 武器叠层持续时间衰减
    tickWeaponTriggers(t);
  });
  // 敌人易伤期 / debuff 减一回合
  battle.enemies.forEach(e => {
    // 刚破韧的本回合不减（让玩家下回合还能用），下个回合再减
    if (e._brokenFresh) { e._brokenFresh = false; }
    else if (e.vibrationBroken > 0) e.vibrationBroken--;
    e.debuffs = (e.debuffs || []).filter(d => --d.duration > 0);
    // 吟霖审判印记倒计时
    if (e.judgeMark) {
      e.judgeMark.remaining--;
      if (e.judgeMark.remaining <= 0) {
        delete e.judgeMark;
      }
    }
  });

  // 下一回合，AP 重置，active 找到下一个活着的
  battle.turn++;
  battle.ap = battle.apMax;
  battle.burstUsedThisTurn = false;
  battle.switchUsedThisTurn = false;
  // active 指针：找到下一个活着且非冻结的
  let nextActive = battle.active;
  for (let i = 0; i < battle.team.length; i++) {
    const idx = (battle.active + i + 1) % battle.team.length;
    if (battle.team[idx].alive && battle.team[idx].frozenTurns === 0) {
      nextActive = idx;
      break;
    }
  }
  // 如果当前 active 还活着且非冻结，保留
  if (battle.team[battle.active].alive && battle.team[battle.active].frozenTurns === 0) {
    // 保留
  } else {
    battle.active = nextActive;
  }
  battle.log.push({ type: 'system', msg: `—— 回合 ${battle.turn} —— 当前出手：${battle.team[battle.active].name}` });

  // 安全上限（25 回合 · 深塔 ★1 阈值 20 回合，留出容错）
  if (battle.turn > 25) {
    battle.finished = true;
    battle.result = 'lose';
    battle.log.push({ type: 'system', msg: '战斗超时（>25 回合）。' });
  }
}

// ===== 评星（深渊用） =====
export function evaluateStars(battle, turnLimit = 3, hpThreshold = 0.6) {
  if (battle.result !== 'win') return 0;
  let stars = 1;
  if (battle.turn <= turnLimit) stars++;
  const hpPct = battle.team.reduce((a, t) => a + t.hp / t.hpMax, 0) / battle.team.length;
  if (hpPct >= hpThreshold) stars++;
  return stars;
}

export function isWin(battle) { return battle.result === 'win'; }
export function isLose(battle) { return battle.result === 'lose'; }
