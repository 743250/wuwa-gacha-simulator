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
import { tickStacks } from './stacks.js';
import { applyTempStat, removeTempStat, computeStat, tickTempStats } from './tempStats.js';
import { onUnitSwitchOut } from './forms.js';
import { fireSwitchHook } from './switchHooks.js';
import { applyEnemyPeriodicMechanic, applyEnemyThresholdMechanic, applyEnemyOnHitMechanic, applyEnemyDefendHook, canTargetEnemy } from './enemyMechanics.js';
import { hasHeavyAttack } from './characters/index.js';
import { fireCharacterHook } from './characters/index.js';
import { ACTION_COST, ACTION_MULTIPLIER, VIBRATION_DAMAGE } from './balance.js';
import { jiyanGainRuiyi, jiyanGuanShiBuff, jiyanBurstRuiyi, jiyanQiZheng } from './characters/jiyan.js';
import { shorekeeperSkillHeal, shorekeeperStarfield, shorekeeperBurstRefund } from './characters/shorekeeper.js';
import { yinlinGainVerdict, yinlinOnHit, yinlinBurst, yinlinTurnCleanup } from './characters/yinlin.js';
import { encoreGainDisorder, encoreStartBlackSheep, encoreTurnCleanup } from './characters/encore.js';
import { cartethyiaGainResolve, cartethyiaApplyErosion, cartethyiaEnterFurForm, cartethyiaBurstErosion, cartethyiaResolveMultiplier, cartethyiaErosionTick, cartethyiaTurnCleanup, cartethyiaErosionOnBreak, cartethyiaLethalShield } from './characters/cartethyia.js';
import { carlottaApplyDissociation } from './characters/carlotta.js';
import { brantFlameDirge } from './characters/brant.js';
import { cantarellaMarkDream } from './characters/cantarella.js';
import { kakaroEnterDeathblade, kakaroTurnCleanup } from './characters/kakaro.js';
import { zhezhiSummonField, zhezhiCraneAssist, zhezhiSkillSummon, zhezhiInkShield, zhezhiTurnCleanup } from './characters/zhezhi.js';

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

  // 冥歌海墟：应用信物效果
  if (opts.wastesTokens) {
    const wt = opts.wastesTokens;
    team.forEach(t => {
      if (wt.atkMul) { t.atk = Math.round(t.atk * wt.atkMul); }
      if (wt.hpMul) { t.hp = Math.round(t.hp * wt.hpMul); t.hpMax = Math.round(t.hpMax * wt.hpMul); }
      if (wt.defMul) { t.def = Math.round(t.def * wt.defMul); }
      if (wt.crate) { t.crate = Math.min(1, (t.crate || 0) + wt.crate); }
      if (wt.cdmg) { t.cdmg = (t.cdmg || 0.5) + wt.cdmg; }
      if (wt.healPerTurn) {
        t.buffs.push({ type: 'wastes_heal', value: wt.healPerTurn, duration: 99, src: '愈合之印' });
      }
    });
  }

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
    apMax: 4 + (opts.wastesTokens?.apBonus || 0),
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
    freezeOn: {},                // {teamIdx: turnsLeft}
    // 冥歌海墟 token 效果
    wastesTokens: opts.wastesTokens || null
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
    hasHeavy: hasHeavyAttack(roleName) // 是否有重击（opt-in，默认无重击）
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
  // ★ 卡提希娅：HP 核 — 伤害基于生命值而非攻击力（倍率单独取，不复用 ACTION_MULTIPLIER）
  // HP/ATK ≈ 8.7×，所以 12%HP ≈ 100%ATK，22%HP ≈ 190%ATK，26%HP ≈ 225%ATK
  const CARTETHYIA_HP_MULT = { normal: 0.12, skill: 0.22, heavy: 0.26, burst: 0.462 };
  let baseStat;
  let hpMultOverride = null;
  if (attacker.name === '卡提希娅') {
    // 决意增伤
    const resolveMult = cartethyiaResolveMultiplier(attacker);
    baseStat = attacker.hp * resolveMult;
    // burst 不走固定倍率覆写——第二次解放·看潮怒风哮之刃的倍率已在 doBurst 中
    // 按风蚀层数动态计算好（baseMain），此处不应再用硬编码值覆盖
    hpMultOverride = (dmgType === 'burst') ? null : (CARTETHYIA_HP_MULT[dmgType] ?? null);
  } else {
    baseStat = attacker.atk * (1 + wb.atkBonus + buffAtkUp);
  }
  const atkRaw = baseStat * (hpMultOverride !== null ? hpMultOverride : multiplier);
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
  // ★ 卡提希娅 4 链带来的全队 elemAllUp 运行时 buff
  const elemAllUpBuff = (attacker.buffs || []).reduce((a, b) => b.type === 'elemAllUp' ? a + b.value : a, 0);
  const elemBonus = 1 + elemBase + elemAdd + elemAllUpBuff;
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

// 当前战斗上下文（dealDamage 内的 5 链致命伤等需要 access battle.log）
let _currentBattle = null;
export function setCurrentBattle(b) { _currentBattle = b; }
export function getCurrentBattle() { return _currentBattle; }

// 扣血（处理护盾、防御 buff、敌方特殊减伤）
function dealDamage(target, dmg) {
  // 防御 buff（玩家角色）
  const defBuff = target.buffs?.find(b => b.type === 'defense');
  if (defBuff) dmg = Math.round(dmg * (1 - defBuff.value));
  // 敌方特殊减伤/无敌/易伤：统一走 applyEnemyDefendHook（Step D）
  // 涵盖冰翼盾 / 风壁 / 过渡减伤 / 飞空无敌 / suppressed 易伤
  dmg = applyEnemyDefendHook(target, dmg);
  if (dmg <= 0) return 0;
  // 护盾
  if (target.shield && target.shield > 0) {
    if (dmg <= target.shield) { target.shield -= dmg; return 0; }
    else { dmg -= target.shield; target.shield = 0; }
  }
  // ★ 卡提希娅 5 链 · 将烈风重塑希望：致命伤不倒 + 护盾（每场 1 次）
  if (target.hp - dmg <= 0 && target.name === '卡提希娅' && target.cartethyiaLethalShield) {
    if (cartethyiaLethalShield(target, dmg, _currentBattle)) {
      return 0;
    }
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
// attacker (可选)：造成本次破韧的角色；只用于卡提希娅 1 链"破韧瞬间 +1 风蚀"
function reduceVibration(enemy, amount, battle, attacker) {
  if (!enemy || !enemy.alive) return;
  if (enemy.suppressed > 0) return;   // 已经在破韧中断窗口，不再削
  enemy.vibration = Math.max(0, (enemy.vibration ?? 100) - amount);
  if (enemy.vibration <= 0) {
    // 破韧 → 进入 suppressed 中断窗口（2 回合），附带易伤 +30%（×1.3）
    enemy.suppressed = 2;
    enemy.suppressedVuln = 0.3;
    enemy._suppressedFresh = true;       // 本回合刚破韧，end-of-turn 不递减
    enemy.vibration = enemy.vibrationMax || 100;
    // ★ 破韧瞬间：当前回合 +2 AP（爆发窗口，模拟手游打硬直可快速连招）
    if (battle) {
      battle.ap = Math.min((battle.apMax || 4) + 2, battle.ap + 2);
      battle.log.push({ type: 'system', msg: `💥 ${enemy.name} 被击破！+2 AP 爆发窗口 · 中断 2 回合` });
      // ★ 卡提希娅 1 链 · 因命运戴上冠冕：仅当破韧伤害由卡提希娅本人造成时 → 主目标 +1 层风蚀
      if (attacker && attacker.name === '卡提希娅') {
        cartethyiaErosionOnBreak(attacker, enemy, battle);
      }
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
  // 飞空无敌：不可被攻击
  if (enemy._flightTurns >= 2) {
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '飞空中，无法被攻击' });
    return 0;
  }
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
  // 降防 debuff 叠加（梦魇亚当）
  const defDown = (target.debuffs || []).find(d => d.type === 'defDown');
  const defDownMult = defDown ? (1 + (defDown.stacks || 0) * (defDown.value || 0.10)) : 1;
  // 穿甲（朔雷之鳞 雷霆墙）
  const wallPierce = (enemy.mechanic?.type === 'thunder_chain' && enemy.mechanic?.wallLock) ? 0.2 : 0;
  const defEffective = target.def * 0.5 * (1 - wallPierce) * defDownMult;
  dmg = Math.max(30, dmg - defEffective);
  // 自旋疲惫（聚械机偶旋转后下回合攻击 -30%）
  if (enemy._spinTired) dmg = Math.round(dmg * 0.7);
  const real = dealDamage(target, Math.round(dmg));
  battle.log.push({ type: 'enemy_attack', src: enemy.name, tgt: target.name, dmg: real, crit: isCrit, action });
  return real;
}

function applyReflect(battle, attacker, defender, realDamage) {
  const m = defender?.mechanic;
  if (!attacker?.alive || !m || realDamage <= 0) return;
  // turtle_reflect: 反击姿态中反弹
  if (defender._deflectActive) {
    const reflected = dealDamage(attacker, Math.round(realDamage * (m.value || 0.4)));
    if (reflected > 0) {
      battle.log.push({ type: 'mechanic', src: defender.name, msg: `反弹 ${attacker.name} ${reflected} 伤害` });
    }
    return;
  }
  // 旧 reflect
  if (m.type !== 'reflect') return;
  if (m.cycle && battle.turn % m.cycle !== 0) return;
  const reflected = dealDamage(attacker, Math.round(realDamage * (m.value || 0.3)));
  if (reflected > 0) {
    battle.log.push({ type: 'mechanic', src: defender.name, msg: `反弹 ${attacker.name} ${reflected} 伤害` });
  }
}

// ===== 世界 BOSS 辅助函数 =====

// 叹息古龙：召唤追踪电锯
function spawnSaws(battle, enemy) {
  const m = enemy.mechanic;
  const count = m.sawCount || 3;
  enemy._saws = enemy._saws || [];
  for (let i = 0; i < count; i++) {
    enemy._saws.push({ turnsLeft: m.sawDuration || 2, mult: m.sawMult || 0.5 });
  }
  battle.log.push({ type: 'mechanic', src: enemy.name, msg: `召唤 ${count} 个追踪电锯（持续 ${m.sawDuration||2} 回合）` });
}

function tickSaws(battle, enemy, helpers) {
  if (!enemy._saws || !enemy._saws.length) return;
  enemy._saws.forEach(saw => {
    if (saw.turnsLeft <= 0) return;
    const tgt = randomTeamTarget2(battle);
    if (tgt) {
      helpers.enemyAttack(battle, enemy, tgt, { mult: saw.mult, action: '追踪电锯' });
    }
    saw.turnsLeft--;
  });
  enemy._saws = enemy._saws.filter(s => s.turnsLeft > 0);
}

function randomTeamTarget2(battle) {
  const alives = battle.team.filter(t => t.alive);
  return alives.length ? alives[Math.floor(Math.random() * alives.length)] : null;
}

// 无归的谬误：延迟爆破
function handleDelayedBlast(battle, enemy, helpers) {
  const m = enemy.mechanic;
  // 上回合设置的爆破，本回合触发
  if (enemy._delayedBlast) {
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '💥 延迟爆破！全队 AOE' });
    battle.team.forEach(t => {
      if (!t.alive) return;
      helpers.enemyAttack(battle, enemy, t, { mult: m.delayedBlastMult || 1.3, action: '延迟爆破' });
    });
    enemy._delayedBlast = false;
  }
  // 本回合设置下回合爆破
  if (battle.turn % (m.delayedBlastCycle || 3) === 0) {
    enemy._delayedBlast = true;
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '地面发光…下回合全队爆破！' });
  }
}

// 无归的谬误：Overclock 过载
function handleOverclock(battle, enemy) {
  const m = enemy.mechanic;
  if (!enemy._overclocked && enemy.hp / enemy.hpMax <= (m.overclockThreshold || 0.3)) {
    enemy._overclocked = true;
    enemy._overclockTurns = m.overclockDuration || 3;
    // Step D：atk 加成走 TempStat（永久型，由 _overclockTurns 单独跟踪双动持续回合）
    applyTempStat(enemy, 'atk', 1 + (m.overclockAtkBonus || 0.5), Infinity, 'overclock');
    enemy.atk = computeStat(enemy, 'atk', enemy.baseAtk);
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: `Overclock 过载！攻击 +${((m.overclockAtkBonus||0.5)*100).toFixed(0)}%，双动 ${m.overclockDuration||3} 回合` });
  }
  // 过载结束：清掉 atk 加成
  if (enemy._overclocked && enemy._overclockTurns <= 0) {
    removeTempStat(enemy, 'overclock');
    enemy.atk = computeStat(enemy, 'atk', enemy.baseAtk);
    enemy._overclocked = false;
  }
}

// 飞廉之猩：抓投（periodic 中触发）
function handleBaringalGrab(battle, enemy, helpers) {
  const m = enemy.mechanic;
  const cycle = enemy.enraged && enemy._enrageGrabFast ? 2 : (m.grabCycle || 4);
  if (battle.turn % cycle !== 0) return;
  if (battle._heavyUsedThisTurn) {
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: `抓投被 ${battle.team[battle.active]?.name} 弹反！` });
    return;
  }
  const tgt = helpers.pickTeamTarget(battle);
  if (!tgt) return;
  // 无视闪避
  const dmg = Math.round((enemy.atk + 30) * (m.grabMult || 2.5) * 0.8);
  const real = helpers.dealDamage(tgt, dmg);
  battle.log.push({ type: 'mechanic', src: enemy.name, tgt: tgt.name, dmg: real, msg: '抓投（不可闪避）！' });
  // 狂暴后抓投加速
  if (enemy.enraged && !enemy._enrageGrabFast) {
    enemy._enrageGrabFast = true;
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '狂暴：抓投频率翻倍！' });
  }
}

// 云闪之鳞：蓄力激光
function handleLaser(battle, enemy, helpers) {
  const m = enemy.mechanic;
  if (m.type !== 'thunder_chain' || !m.laserCycle) return;
  if (battle.turn % m.laserCycle !== 0) return;
  if (m.laserWarn) {
    battle.log.push({ type: 'mechanic', src: enemy.name, msg: '⚡ 正在蓄力激光…（下回合可切高防角色）' });
    enemy._laserCharging = true;
  }
}

function fireLaser(battle, enemy, helpers) {
  if (!enemy._laserCharging) return;
  const m = enemy.mechanic;
  const tgt = helpers.pickTeamTarget(battle);
  if (!tgt) return;
  let mult = m.laserMult || 2.8;
  if (tgt.def > enemy.atk * 0.8) {
    mult *= 0.5;
    battle.log.push({ type: 'mechanic', src: enemy.name, tgt: tgt.name, msg: '重甲扛住激光！伤害减半' });
  }
  helpers.enemyAttack(battle, enemy, tgt, { mult, action: '红色激光' });
  enemy._laserCharging = false;
}

// 异构武装：空中弹幕
function handleAirStars(battle, enemy, helpers) {
  const m = enemy.mechanic;
  if (!m.airPhase || !enemy._airPhase) return;
  if (!m.airStarCycle || battle.turn % m.airStarCycle !== 0) return;
  const count = m.airStarCount || 6;
  battle.log.push({ type: 'mechanic', src: enemy.name, msg: `空中弹幕 ×${count}` });
  for (let i = 0; i < count; i++) {
    const tgt = randomTeamTarget2(battle);
    if (!tgt) break;
    helpers.enemyAttack(battle, enemy, tgt, { mult: m.airStarMult || 0.4, action: '星光追踪弹' });
  }
}

// ===== 玩家动作 =====

// 普攻：1 AP，单体，100% atk
// 守岸人 5 链：normalSplit = 2，会额外打一个相邻敌人
export function doAttack(battle, targetIdx) {
  _currentBattle = battle;
  if (battle.finished || battle.ap < ACTION_COST.normal) return { ok: false, err: 'AP 不足' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  const fEnh = forteEnhances(self, 'normal');
  const mult = fEnh ? ACTION_MULTIPLIER.normal * fEnh.effectMult : ACTION_MULTIPLIER.normal;
  const { dmg, crit } = calcDamage(self, target, mult, 'normal');
  const real = dealDamage(target, dmg);
  reduceVibration(target, VIBRATION_DAMAGE.normal + (fEnh ? VIBRATION_DAMAGE.normalForteBonus : 0), battle, self);
  applyReflect(battle, self, target, real);
  // 攻击绿泡（罗蕾莱）
  if (target._bubbleHp > 0) {
    target._bubbleHp -= real;
    if (target._bubbleHp <= 0) {
      const healAmt = target._bubbleHealAmt || 0;
      if (healAmt > 0) {
        battle.team.forEach(t => {
          if (t.alive) {
            const healed = Math.min(t.hpMax - t.hp, healAmt);
            t.hp += healed;
            if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed, msg: '抢到绿泡治疗！' });
          }
        });
      }
      target._bubbleHp = 0;
      target._bubbleHealAmt = 0;
      battle.log.push({ type: 'mechanic', src: self.name, msg: '击破绿泡！全队获得治疗' });
    }
  }
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
      reduceVibration(extra, VIBRATION_DAMAGE.normalSplit, battle, self);
      applyReflect(battle, self, extra, real2);
      battle.log.push({
        type: 'attack', src: self.name, tgt: extra.name, dmg: real2, crit: crit2,
        action: '链击（5 链）'
      });
    }
  }
  battle.ap -= ACTION_COST.normal;
  self.energy = Math.min(self.energyMax, Math.round(self.energy + 12 * (1 + self.resonanceBonus)));
  gainConcerto(self, 8);
  gainForte(self, 'normal');
  if (fEnh) consumeForte(self);
  // 折枝墨鹤追击：己方普攻命中主目标时消耗 1 只墨鹤（不递归）
  zhezhiCraneAssist(battle, target);
  // 卡提希娅：普攻叠决意（卡提希娅形态）+ 芙露德莉斯形态下附加风蚀 + 额外能量
  cartethyiaGainResolve(self, '普攻', battle);
  cartethyiaApplyErosion(self, target, battle, false);
  if ((self.cartethyiaFurTurns || 0) > 0) {
    self.energy = Math.min(self.energyMax, self.energy + 8);
  }
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
  _currentBattle = battle;
  if (battle.finished || battle.ap < ACTION_COST.skill) return { ok: false, err: 'AP 不足' };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  if (self.skillLockedTurns > 0) return { ok: false, err: `技能被封锁中（${self.skillLockedTurns} 回合）` };
  if (self.cd.skill > 0) return { ok: false, err: `技能冷却中（${self.cd.skill} 回合）` };
  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  const fEnh = forteEnhances(self, 'skill');
  const mult = fEnh && fEnh.effectMult ? ACTION_MULTIPLIER.skill * fEnh.effectMult : ACTION_MULTIPLIER.skill;
  const { dmg, crit } = calcDamage(self, target, mult, 'skill');
  const real = dealDamage(target, dmg);
  reduceVibration(target, VIBRATION_DAMAGE.skill + (fEnh ? VIBRATION_DAMAGE.skillForteBonus : 0), battle, self);
  applyReflect(battle, self, target, real);
  battle.ap -= ACTION_COST.skill;
  self.cd.skill = Math.max(1, 3 - (self.skillCdReduce || 0));
  self.energy = Math.min(self.energyMax, Math.round(self.energy + (22 + self.energyRefund) * (1 + self.resonanceBonus)));
  gainConcerto(self, 18);
  gainForte(self, 'skill');

  shorekeeperSkillHeal(self, battle);

  if (fEnh) consumeForte(self);
  // Step D：菲比 toggleForm dispatch —— 使用技能后 forte 满自动切换形态（史遗留未接）
  if (!fEnh && self.forte?.ready && self.forte?.effectType === 'toggleForm') {
    fireCharacterHook(self, 'toggleForm', battle);
    consumeForte(self);
  }
  // 卡提希娅：共鸣技能叠决意 + 芙露德莉斯形态下附加风蚀 + 额外能量
  cartethyiaGainResolve(self, '共鸣技能', battle);
  cartethyiaApplyErosion(self, target, battle, false);
  if ((self.cartethyiaFurTurns || 0) > 0) {
    self.energy = Math.min(self.energyMax, self.energy + 8);
  }

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
  carlottaApplyDissociation(self, target, battle);
  zhezhiSkillSummon(self, battle);
  // 折枝墨鹤追击：共鸣技能命中主目标时消耗 1 只墨鹤（追击在补货之后，逻辑上仍是技能命中触发）
  zhezhiCraneAssist(battle, target);
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 共鸣解放：3 AP，能量满，AOE，主目标 400% / 副目标 200%
export function doBurst(battle) {
  _currentBattle = battle;
  if (battle.finished || battle.ap < ACTION_COST.burst) return { ok: false, err: `AP 不足（需 ${ACTION_COST.burst}）` };
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
  const { ruiyiMult } = jiyanBurstRuiyi(self, battle);
  // ===== 卡提希娅双阶段解放 =====
  if (self.name === '卡提希娅') {
    const inFurForm = (self.cartethyiaFurTurns || 0) > 0;

    // ---- 第二次解放：芙露德莉斯形态下 · 看潮怒风哮之刃 ----
    if (inFurForm) {
      const { erosionMult, erosionConsumed } = cartethyiaBurstErosion(self, battle);
      // 官方「看潮怒风哮之刃」倍率：6.60%×7 = 46.2% 最大生命（Lv1 简化值）
      // 3 链 +60% 最大生命 / 6 链风蚀翻倍 + 立即结算 + 不清空（在 cartethyiaBurstErosion 内处理）
      const chain3Bonus = self.cartethyiaBurstHpBonus || 0;
      const baseMain = (0.462 + chain3Bonus) * erosionMult;
      const baseSide = (0.462 + chain3Bonus) * erosionMult * 0.5;
      const results = aliveEnemies.map(e => {
        const mult = (e === primary) ? baseMain : baseSide;
        const { dmg, crit } = calcDamage(self, e, mult, 'burst');
        const real = dealDamage(e, dmg);
        reduceVibration(e, VIBRATION_DAMAGE.burst, battle, self);
        applyReflect(battle, self, e, real);
        return { tgt: e.name, dmg: real, crit, primary: e === primary };
      });
      battle.ap -= ACTION_COST.burst;
      self.energy = 0;
      gainConcerto(self, 30);
      gainForte(self, 'burst');
      if (fEnh) consumeForte(self);
      fireTrigger(self, 'burst_cast', { battle });
      battle.log.push({
        type: 'burst', src: self.name, results,
        action: '共鸣解放 · 看潮怒风哮之刃（风蚀爆发）'
      });
      finishIfBattleEnded(battle, 'win');
      return { ok: true };
    }

    // ---- 第一次解放：听骑士从心祈愿（卡提希娅形态 → 芙露德莉斯）----
    // 官方此技能无伤害倍率，是纯化身技能
    cartethyiaEnterFurForm(self, battle);
    self.energy = 0;
    battle.ap -= ACTION_COST.burst;
    gainConcerto(self, 30);
    gainForte(self, 'burst');
    if (fEnh) consumeForte(self);
    fireTrigger(self, 'burst_cast', { battle });
    battle.log.push({
      type: 'burst', src: self.name, results: [],
      action: '共鸣解放 · 听骑士从心祈愿（进入芙露德莉斯形态）'
    });
    finishIfBattleEnded(battle, 'win');
    return { ok: true };
    battle.ap -= ACTION_COST.burst;
    gainConcerto(self, 30);
    gainForte(self, 'burst');
    if (fEnh) consumeForte(self);
    fireTrigger(self, 'burst_cast', { battle });
    battle.log.push({
      type: 'burst', src: self.name, results: fResults,
      action: '共鸣解放 · 听骑士从心祈愿（进入芙露德莉斯形态）'
    });
    finishIfBattleEnded(battle, 'win');
    return { ok: true };
  }

  // ===== 非卡提希娅·原逻辑 =====
  const baseMain = ACTION_MULTIPLIER.burstMain * (fEnh ? fEnh.effectMult : 1.0) * ruiyiMult;
  const baseSide = ACTION_MULTIPLIER.burstSide * (fEnh ? fEnh.effectMult : 1.0) * ruiyiMult;
  const results = aliveEnemies.map(e => {
    const mult = (e === primary) ? baseMain : baseSide;
    const { dmg, crit } = calcDamage(self, e, mult, 'burst');
    const real = dealDamage(e, dmg);
    reduceVibration(e, VIBRATION_DAMAGE.burst, battle, self);
    applyReflect(battle, self, e, real);
    return { tgt: e.name, dmg: real, crit, primary: e === primary };
  });
  battle.ap -= ACTION_COST.burst;
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

  encoreStartBlackSheep(self, battle);

  shorekeeperStarfield(self, battle);
  kakaroEnterDeathblade(self, battle);
  brantFlameDirge(self, battle);
  zhezhiSummonField(self, battle);

  // ★ 忌炎 3 链 观势：解放后自身暴击/暴伤 buff
  jiyanGuanShiBuff(self, battle);
  jiyanQiZheng(self, battle);

  // 触发武器被动：解放释放
  fireTrigger(self, 'burst_cast', { battle });
  // 协奏值满后视为切人（变奏/延奏）
  if (self.concerto >= 100) {
    consumeConcerto(self, battle);
  }
  shorekeeperBurstRefund(self, battle);
  yinlinBurst(self, primary, battle);
  cantarellaMarkDream(self, primary, battle);
  // 折枝墨鹤追击：解放 AOE 只对主目标触发一次（不因 AOE 多次消耗）
  if (self.name !== '折枝') zhezhiCraneAssist(battle, primary);
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
  _currentBattle = battle;
  if (battle.finished || battle.ap < ACTION_COST.heavy) return { ok: false, err: `AP 不足（需 ${ACTION_COST.heavy}）` };
  const self = battle.team[battle.active];
  if (!self || !self.alive) return { ok: false, err: '当前角色不可行动' };
  if (!self.hasHeavy) return { ok: false, err: `${self.name} 没有重击` };
  if (self.frozenTurns > 0) return { ok: false, err: `当前角色被冻结（${self.frozenTurns} 回合）` };
  if (self.cd.heavy > 0) return { ok: false, err: `重击冷却中（${self.cd.heavy} 回合）` };

  // 折枝重击「点睛」：消耗半数墨鹤转全队护盾，不造成伤害、不触发墨鹤追击
  if (self.name === '折枝') {
    if (!self.zhezhiFieldTurns || self.zhezhiFieldTurns <= 0) return { ok: false, err: '墨鹤领域未展开' };
    if (!self.zhezhiCranes || self.zhezhiCranes <= 0) return { ok: false, err: '无墨鹤可消耗' };
    const handled = zhezhiInkShield(self, battle);
    if (handled) {
      battle.ap -= ACTION_COST.heavy;
      self.cd.heavy = 2;
      gainConcerto(self, 14);
      gainForte(self, 'heavy');
      fireTrigger(self, 'heavy_hit', { battle });
      finishIfBattleEnded(battle, 'win');
      return { ok: true };
    }
    return { ok: false, err: '点睛无法释放' };
  }

  const target = battle.enemies[targetIdx];
  if (!target || !target.alive) return { ok: false, err: '目标无效' };
  // 安可特殊重击：失序值满时，重击改为白咩·失控之炎 / 黑咩·暴走之炎
  // 官方归类为共鸣解放伤害，因此这里用 dmgType='burst' 结算，但仍消耗 2 AP 和重击 CD。
  const isEncore = self.name === '安可';
  const encoreBlack = isEncore && (self.encoreBlackTurns || 0) > 0;
  const encoreSpecial = isEncore && (self.encoreDisorder || 0) >= 100;
  const heavyMult = encoreSpecial
    ? (encoreBlack ? 4.5 : 3.5) * (1 + (self.heavyBonus || 0))
    : ACTION_MULTIPLIER.heavy;
  const heavyType = encoreSpecial ? 'burst' : 'heavy';
  const { dmg, crit } = calcDamage(self, target, heavyMult, heavyType);
  const real = dealDamage(target, dmg);
  reduceVibration(target, encoreSpecial ? VIBRATION_DAMAGE.heavySpecial : VIBRATION_DAMAGE.heavy, battle, self);
  applyReflect(battle, self, target, real);
  battle.ap -= ACTION_COST.heavy;
  self.cd.heavy = 1;
  battle._heavyUsedThisTurn = true;  // ★ 弹反判定：本回合使用了重击
  self.energy = Math.min(self.energyMax, Math.round(self.energy + 15 * (1 + self.resonanceBonus)));
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
  // 重击也能击破绿泡
  if (target._bubbleHp > 0) {
    target._bubbleHp -= real;
    if (target._bubbleHp <= 0) {
      const healAmt = target._bubbleHealAmt || 0;
      if (healAmt > 0) {
        battle.team.forEach(t => {
          if (t.alive) {
            const healed = Math.min(t.hpMax - t.hp, healAmt);
            t.hp += healed;
            if (healed > 0) battle.log.push({ type: 'heal', src: self.name, tgt: t.name, dmg: healed, msg: '抢到绿泡治疗！' });
          }
        });
      }
      target._bubbleHp = 0;
      target._bubbleHealAmt = 0;
      battle.log.push({ type: 'mechanic', src: self.name, msg: '击破绿泡！全队获得治疗' });
    }
  }
  // 卡提希娅：重击叠决意 + 芙露德莉斯形态下附加风蚀 + 额外能量
  cartethyiaGainResolve(self, '重击', battle);
  cartethyiaApplyErosion(self, target, battle, false);
  if ((self.cartethyiaFurTurns || 0) > 0) {
    self.energy = Math.min(self.energyMax, self.energy + 8);
  }
  // 忌炎：重击积锐意 + 3 链观势
  jiyanGainRuiyi(self, '重击', battle);
  jiyanGuanShiBuff(self, battle);
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 投掷残骸（聚械机偶特殊动作 · 0 AP）
// 仅当 BOSS 掉落残骸时可使用
export function doDebris(battle) {
  _currentBattle = battle;
  if (battle.finished) return { ok: false, err: '战斗已结束' };
  const self = battle.team[battle.active];
  if (!self || !self.alive || self.frozenTurns > 0) return { ok: false, err: '当前角色不可行动' };
  const enemy = battle.enemies.find(e => e.alive && e._debrisReady);
  if (!enemy) return { ok: false, err: '没有可投掷的残骸' };
  enemy.suppressed = Math.max(enemy.suppressed || 0, 1);
  enemy.suppressedVuln = 0.5; // 残骸眩晕易伤 +50%（覆盖破韧的 0.3）
  enemy._debrisReady = false;
  battle.log.push({ type: 'mechanic', src: self.name, msg: `投掷残骸！${enemy.name} 被中断 1 回合（受伤 +50%）` });
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// 切换角色（每回合限 1 次）
// 每次切人触发简化版变奏（入场角色对敌方一击 + 削破韧）
// 协奏满时强化：变奏伤害提升 + 武器 outro/variation 触发器激活
export function doSwitch(battle, toIdx) {
  _currentBattle = battle;
  if (battle.finished) return { ok: false, err: '战斗已结束' };
  if (toIdx === battle.active) return { ok: false, err: '已在该角色' };
  if (battle.switchUsedThisTurn) return { ok: false, err: '本回合已经切换过角色' };
  const target = battle.team[toIdx];
  if (!target || !target.alive) return { ok: false, err: '目标不可切换' };
  if (target.frozenTurns > 0) return { ok: false, err: '目标被冻结' };
  // 雷霆墙：锁定切换（朔雷之鳞）
  const cur = battle.team[battle.active];
  if (cur && (cur._wallLocked || 0) > 0) return { ok: false, err: `被雷霆墙锁定，不可切换` };
  const prev = cur;
  const concertoFull = prev && (prev.concerto || 0) >= 100;
  battle.active = toIdx;
  battle.switchUsedThisTurn = true;

  // 离场角色延奏 → 给入场角色一个"上场增益"
  if (prev && prev.alive) {
    // Step E 预备：carryOnSwitch=false 的形态（角色态）切人时退出
    onUnitSwitchOut(prev, battle);
    // 离场角色的 outro 武器被动（如停驻之烟：延奏后下场角色攻击+10%）
    fireTrigger(prev, 'outro', { battle });
  }
  // 入场角色变奏：对当前主目标造成一段伤害
  const aliveEnemies = battle.enemies.filter(e => e.alive);
  let variationTarget = null;
  if (aliveEnemies.length) {
    const tgt = aliveEnemies[0];
    variationTarget = tgt;
    // 变奏倍率：基础 80%，协奏满时 ×2 = 160%
    let variMult = concertoFull ? ACTION_MULTIPLIER.concertoVariation : ACTION_MULTIPLIER.variation;
    // ★ 守岸人 6 链：变奏伤害 +500%（×6）
    if (target.variationBonus > 0) {
      variMult *= (1 + target.variationBonus);
    }
    const { dmg, crit } = calcDamage(target, tgt, variMult, 'normal');
    const real = dealDamage(tgt, dmg);
    reduceVibration(tgt, concertoFull ? VIBRATION_DAMAGE.concertoVariation : VIBRATION_DAMAGE.variation, battle, target);
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
  // Step E：统一切人入场钩子（忌炎锐意/通变、今汐谪仙/韶光、卡提希娅 2 链风蚀、安可变奏失序）
  fireSwitchHook({ from: prev, to: target, battle, ctx: { variationTarget } });
  finishIfBattleEnded(battle, 'win');
  return { ok: true };
}

// ===== 回合切换 =====

// 我方结束回合，敌方出手
export function endTurn(battle) {
  _currentBattle = battle;
  if (battle.finished) return;
  const enemyHelpers = { dealDamage, enemyAttack, inflictFreeze, lockSkill, pickTeamTarget, spawnEnemy };

  // ===== 敌方出招 =====
  battle.enemies.forEach(enemy => {
    if (!enemy.alive) return;

    // 破韧/残骸/弹反中断中跳过
    if (enemy.suppressed > 0) {
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: `中断中（${enemy.suppressed} 回合），跳过行动` });
      return;
    }

    // 飞空无敌中跳过
    if (enemy._flightTurns >= 2) {
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '飞空中' });
      return;
    }

    // 反击姿态中不主动攻击（鸣钟之龟）
    if (enemy._deflectActive) {
      battle.log.push({ type: 'mechanic', src: enemy.name, msg: '处于反击姿态' });
      return;
    }

    // ---- 特殊 pre-attack 效果 ----

    // ★ 卡提希娅风蚀效应：敌人回合开始时受到伤害
    cartethyiaErosionTick(enemy, battle);

    // 叹息古龙：电锯召唤 & 电锯攻击
    if (enemy.mechanic?.type === 'burn_team' && enemy.mechanic?.sawCycle) {
      if (battle.turn % enemy.mechanic.sawCycle === 0) spawnSaws(battle, enemy);
      tickSaws(battle, enemy, enemyHelpers);
    }

    // 无归的谬误：延迟爆破 & Overclock
    if (enemy.mechanic?.type === 'data_lock' && enemy.mechanic?.delayedBlastCycle) {
      handleDelayedBlast(battle, enemy, enemyHelpers);
      handleOverclock(battle, enemy);
    }

    // 云闪之鳞：激光（先蓄力再发射）
    fireLaser(battle, enemy, enemyHelpers);

    // 异构武装：空中弹幕
    handleAirStars(battle, enemy, enemyHelpers);

    // 阈值机制（阶段切换等，在攻击前检查——可能影响本回合攻击模式）
    applyEnemyThresholdMechanic({ battle, enemy, helpers: enemyHelpers });

    // ---- 普攻 ----
    const target = pickTeamTarget(battle);
    if (!target) return;

    // 双段攻击（云闪之鳞）
    const dualStrike = enemy.mechanic?.type === 'thunder_chain' && enemy.mechanic?.dualStrike;
    // 过载/狂暴双动（无归的谬误 Overclock / 梦魇亚当 狂暴）
    const frenzyDouble = (enemy._overclockTurns > 0 || enemy._frenzyDouble);
    const totalStrikes = dualStrike ? 2 : (frenzyDouble ? 2 : 1);

    for (let s = 0; s < totalStrikes; s++) {
      const strikeTarget = (s > 0 && dualStrike && !frenzyDouble)
        ? (randomTeamTarget2(battle) || target)
        : target;
      if (!strikeTarget?.alive) continue;

      enemyAttack(battle, enemy, strikeTarget, { action: s > 0 ? (dualStrike ? '二段斩击' : '双动') : '攻击' });

      // ★ On-hit mechanics（标记 / 侵蚀 / 溅射 / 降防 / 冰冻追踪）
      applyEnemyOnHitMechanic({ battle, enemy, target: strikeTarget, helpers: enemyHelpers });

      // 溅射（梦魇亚当）
      if (enemy.mechanic?.splash && strikeTarget.alive) {
        const splashPct = enemy.mechanic.splashPct || 0.5;
        battle.team.forEach(tm => {
          if (tm !== strikeTarget && tm.alive) {
            const splashDmg = Math.round(enemy.atk * 0.5 * splashPct);
            const real = dealDamage(tm, splashDmg);
            if (real > 0) battle.log.push({ type: 'mechanic', src: enemy.name, tgt: tm.name, dmg: real, msg: '溅射' });
          }
        });
      }

      // 降防（梦魇亚当）
      if (enemy.mechanic?.defDown && strikeTarget.alive) {
        strikeTarget.debuffs = strikeTarget.debuffs || [];
        let dd = strikeTarget.debuffs.find(d => d.type === 'defDown');
        if (!dd) {
          dd = { type: 'defDown', stacks: 0, value: enemy.mechanic.defDownPct || 0.10, duration: enemy.mechanic.defDownDuration || 2 };
          strikeTarget.debuffs.push(dd);
        } else {
          dd.duration = Math.max(dd.duration, enemy.mechanic.defDownDuration || 2);
        }
        dd.stacks = Math.min((dd.stacks || 0) + 1, enemy.mechanic.defDownMax || 3);
        if (dd.stacks > 1) battle.log.push({ type: 'mechanic', src: enemy.name, tgt: strikeTarget.name, msg: `防御 ↓ ${dd.stacks}层` });
      }

      // 冰冻累积追踪（辉萤军势 / 异构武装）
      if ((enemy.mechanic?.type === 'aoe_freeze' || enemy.mechanic?.airPhase) && strikeTarget.alive) {
        enemy._hitTracker = enemy._hitTracker || {};
        enemy._hitTracker[strikeTarget.idx] = (enemy._hitTracker[strikeTarget.idx] || 0) + 1;
        if (enemy._hitTracker[strikeTarget.idx] >= 3) {
          enemyHelpers.inflictFreeze(strikeTarget, 1);
          enemy._hitTracker[strikeTarget.idx] = 0;
          battle.log.push({ type: 'freeze', src: enemy.name, tgt: strikeTarget.name, msg: '冰冻累积触发！' });
        }
      }
    }

    // 云闪之鳞：本回合蓄力（下回合发射）
    handleLaser(battle, enemy, enemyHelpers);

    // 飞廉之猩：抓投（弹反判定）
    if (enemy.mechanic?.grabCycle) {
      handleBaringalGrab(battle, enemy, enemyHelpers);
    }
  });

  if (finishIfBattleEnded(battle, 'lose')) return;

  // ===== 触发持续机制（periodic）=====
  battle.enemies.forEach(enemy => {
    if (!enemy.alive) return;
    applyEnemyPeriodicMechanic({ battle, enemy, helpers: enemyHelpers });
  });

  if (finishIfBattleEnded(battle, 'lose')) return;

  // ===== 清理 buff/CD/状态 =====
  battle.team.forEach(t => {
    // 浅析星域：healOverTime 持续治疗
    // 冥歌海墟：愈合之印 每回合恢复 HP
    (t.buffs || []).forEach(b => {
      if ((b.type === 'healOverTime' || b.type === 'wastes_heal') && t.alive && b.value > 0) {
        const healUp = (t.buffs || []).reduce((a, x) => x.type === 'healUp' ? a + x.value : a, 0);
        const rawHeal = b.type === 'wastes_heal' ? b.value * t.hpMax : b.value;
        const realHeal = Math.round(rawHeal * (1 + healUp));
        const healed = Math.min(t.hpMax - t.hp, realHeal);
        t.hp += healed;
        if (healed > 0) battle.log.push({ type: 'heal', src: b.src || '愈合', tgt: t.name, dmg: healed });
      }
    });
    t.buffs = (t.buffs || []).filter(b => --b.duration > 0);
    if (t.cd.skill > 0) t.cd.skill--;
    if (t.cd.heavy > 0) t.cd.heavy--;
    if (t.frozenTurns > 0) t.frozenTurns--;
    if (t.skillLockedTurns > 0) t.skillLockedTurns--;
    t.debuffs = (t.debuffs || []).filter(d => --d.duration > 0);
    if (t._burstRefundCdLeft > 0) t._burstRefundCdLeft--;
    // 雷霆墙锁定衰减
    if (t._wallLocked > 0) t._wallLocked--;
    yinlinTurnCleanup(t, battle);
    encoreTurnCleanup(t, battle);
    cartethyiaTurnCleanup(t, battle);
    kakaroTurnCleanup(t, battle);
    zhezhiTurnCleanup(t, battle);
    tickStacks(battle, t);     // Step B：统一衰减 Stack（卡提希娅决意 / 忌炎锐意无衰减直接 no-op）
    tickWeaponTriggers(t);
  });

  // 敌人 suppressed / debuff / 特殊状态衰减
  battle.enemies.forEach(e => {
    if (e._suppressedFresh) { e._suppressedFresh = false; }
    else if (e.suppressed > 0) {
      e.suppressed--;
      if (e.suppressed <= 0) e.suppressedVuln = 0;
    }
    e.debuffs = (e.debuffs || []).filter(d => --d.duration > 0);
    if (e.judgeMark) {
      e.judgeMark.remaining--;
      if (e.judgeMark.remaining <= 0) delete e.judgeMark;
    }
    // Boss 状态衰减
    if (e._flightTurns > 0) e._flightTurns--;
    if (e._overclockTurns > 0) e._overclockTurns--;
    if (e._spinTired) e._spinTired = false;
    // 反击姿态衰减
    if (e._deflectActive) e._deflectActive = false;
    // 残骸过期
    if (e._debrisReady && battle.turn % 5 === 0 && !e._debrisReady) { /* debris stays 1 turn */ }
    // Step D：TempStat 统一衰减（过渡减伤 / 风壁 / 飞空无敌 等）
    tickTempStats(e);
    // 绿泡回合末治疗（若未被击破）
    if (e._bubbleHp > 0 && e._bubbleHealAmt > 0 && e.alive) {
      e.hp = Math.min(e.hpMax, e.hp + e._bubbleHealAmt);
      battle.log.push({ type: 'heal', src: e.name, tgt: e.name, dmg: e._bubbleHealAmt, msg: '绿泡自疗' });
      e._bubbleHp = 0;
      e._bubbleHealAmt = 0;
    }
    // 冰翼盾：若被击破则清除标记
    if (e._iceShielded && e.shield <= 0) {
      e._iceShielded = false;
      e._hitTracker = {};
      battle.log.push({ type: 'mechanic', src: e.name, msg: '冰翼盾被击破！减伤解除' });
    }
  });

  // 下一回合
  battle.turn++;
  battle.ap = battle.apMax;
  battle._heavyUsedThisTurn = false;
  battle.burstUsedThisTurn = false;
  battle.switchUsedThisTurn = false;
  // active 指针
  let nextActive = battle.active;
  for (let i = 0; i < battle.team.length; i++) {
    const idx = (battle.active + i + 1) % battle.team.length;
    if (battle.team[idx].alive && battle.team[idx].frozenTurns === 0) {
      nextActive = idx;
      break;
    }
  }
  if (!(battle.team[battle.active].alive && battle.team[battle.active].frozenTurns === 0)) {
    battle.active = nextActive;
  }
  battle.log.push({ type: 'system', msg: `—— 回合 ${battle.turn} —— 当前出手：${battle.team[battle.active].name}` });

  // 安全上限
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
