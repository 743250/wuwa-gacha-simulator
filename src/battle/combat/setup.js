// 战斗初始化 · 从 combat.js 拆出(Stage 4)
//   · getCombatTeamNames  - 从存档过滤有效出战角色名
//   · createTeamUnit      - 单个 Unit 构造
//   · createBattle        - Battle 实例构造 + 战斗开始 hook
//   · startEncounter      - 统一外部入口(deep tower/wastes/ui/battle 都走这)

import { S } from '../../state.js';
import { computeBattleStats } from '../stats.js';
import { applyChainBonuses, applyTeamAuras, getEnergyRefund } from '../chains.js';
import { spawnEnemy } from '../enemies.js';
import { initForte } from '../forte.js';
import { hasHeavyAttack, fireCharacterHook } from '../characters/index.js';
import { getDungeonTypeHpScale } from '../balance.js';

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
  const missing = [];
  const typeHp = getDungeonTypeHpScale(opts.dungeonType);
  const enemies = expectedEnemies.map((n, idx) => {
    // 副本池：enemyLevel 控制等级缩放；enemyScale / enemyScales 控制遭遇倍率
    // dungeonType → 类型 HP 倍率（战训/无音区 1.0，世界 BOSS/周本轻度压）
    // 深塔：enemyStatScale={hp,atk,def}，不传 dungeonType
    const scale = opts.enemyScales?.[idx] ?? opts.enemyStatScale ?? opts.enemyScale ?? 1.0;
    const isAbyssScale = scale && typeof scale === 'object' && typeof scale.hp === 'number' && !scale.bossLevel && !scale.enemyLevel;
    const isWorldBossOpts = scale && typeof scale === 'object' && !!(scale.bossLevel || scale.worldTier);

    let spawnOpts;
    if (opts.enemyLevel) {
      const s = typeof scale === 'number' ? scale : 1.0;
      spawnOpts = { enemyLevel: opts.enemyLevel, hp: s * typeHp, atk: s, def: 1.0 };
    } else if (isWorldBossOpts) {
      spawnOpts = {
        ...scale,
        hp: (typeof scale.hp === 'number' ? scale.hp : 1) * typeHp,
        atk: typeof scale.atk === 'number' ? scale.atk : 1,
        def: typeof scale.def === 'number' ? scale.def : 1
      };
    } else if (isAbyssScale) {
      spawnOpts = scale;
    } else if (typeof scale === 'number' && typeHp !== 1) {
      spawnOpts = { hp: scale * typeHp, atk: scale, def: 1.0 };
    } else {
      spawnOpts = scale;
    }

    const e = spawnEnemy(n, spawnOpts);
    if (e) e.idx = idx + 100;
    else missing.push(n);
    return e;
  }).filter(Boolean);
  if (enemies.length === 0 || enemies.length !== expectedEnemies.length) {
    console.warn(`[createBattle] 战斗创建失败：以下敌人不在 ENEMIES 表 → ${missing.join('、')}（期望敌人: ${expectedEnemies.join('、')}）`);
    return null;
  }

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
    burstUsedThisTurn: false,
    switchUsedThisTurn: false,
    burnTimer: {},              // 持续效果累计
    freezeOn: {},                // {teamIdx: turnsLeft}
    wastesTokens: opts.wastesTokens || null,
    summons: []                   // 召唤物数组(赫卡忒等,不进 team,玩家不可控)
  };
  battle.log.push({ type: 'system', msg: `战斗开始！队伍 ${team.map(t=>t.name).join(' / ')} VS ${enemies.map(e=>e.name).join(' / ')}` });
  battle.log.push({ type: 'system', msg: `回合 1 · 当前出手：${team[0].name}` });
  // 角色战斗开始 hook(弗洛洛固有·八重奏送乐声/余响等)
  team.forEach(t => fireCharacterHook(t, 'battleStart', { battle }));
  return battle;
}

// 统一战斗入口:所有外部调用方(深塔/海墟/UI)都走这里,createBattle 视为内部实现。
// 以后改 createBattle 签名或挂战斗开始 hook 只需改这一处。
export function startEncounter({ team, enemies, options = {} } = {}) {
  return createBattle(team, enemies, options);
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
    skillChargesMax: s.skillChargesMax || 1,
    skillCharges: s.skillCharges != null ? s.skillCharges : (s.skillChargesMax || 1),
    resonanceBonus: s.resonanceBonus || 0,
    weapon: s.weapon,
    weaponTriggers: s.weaponTriggers || [],
    weaponStacks: {},
    _weaponTeamAtk: s.teamAtkBonus || 0,
    echoStats: s.echoStats || null,
    alive: true,
    frozenTurns: 0,
    skillLockedTurns: 0,
    debuffs: [],
    energyRefund: 0,
    concerto: 0,
    forteStart: s.forteStart || 0,
    ruiyi: 0,
    verdict: 0,
    encoreDisorder: 0,
    hasHeavy: hasHeavyAttack(roleName),
    _isPlayerUnit: true
  };
  initForte(unit);
  applyChainBonuses(unit);
  unit.energyRefund = getEnergyRefund(unit);
  return unit;
}
