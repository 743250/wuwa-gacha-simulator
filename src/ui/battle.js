// 战斗 UI（全屏覆盖）— Preact shim
// Preact <BattleView /> 已接管 #battleOverlay 的渲染。
// 本文件保留入口函数签名和 window handler 注册。
import { S } from '../state.js';
import { $, msg } from './services/toast.ts';
import { rerenderAll } from '../rerender.js';
import { startEncounter, getCombatTeamNames } from '../battle/combat.js';
import { flattenEnemies, DUNGEONS, canUseWeeklyBoss, getWeeklyBossUsed, WEEKLY_BOSS_LIMIT, getDungeonEncounter, getWorldBossSpawnOpts, getDungeonEnemyLevel, rollEchoMinions } from '../battle/dungeon.js';
import { ABYSS_ZONES, startAbyssFloor } from '../daily/abyss.js';
import { startWastesStage, WASTES_STAGES } from '../daily/wastes.js';
import { registerBattleActions } from './battle/battleActions.js';
import { currentBattleSignal, pendingDungeonSignal, battleVisibleSignal, battleToastSignal, bumpBattleVersion } from '../battle/battleSignals.js';

let pendingDungeon = null;
let _lastLogLen = 0;       // 用于检测新增日志（弹 toast）

// 显示名
const displayName = (u) => (u && u.displayName) ? u.displayName : (u ? u.name : '');

// 进入副本战斗（普通副本）
export function startDungeonBattle(dungeonId) {
  const names = getCombatTeamNames();
  if (names.length === 0) {
    msg('编队为空或队员已失效，先去编队面板组队');
    return;
  }
  const d = DUNGEONS.find(x => x.id === dungeonId);
  if (!d) return;
  if (S.stamina < d.cost) {
    msg(`体力不足（需 ${d.cost}）`);
    return;
  }
  // 周本周限 3 次（共享）
  if (d.weeklyLimit && !canUseWeeklyBoss()) {
    msg(`本周战歌重奏已领取 ${WEEKLY_BOSS_LIMIT} 次（共享）`);
    return;
  }
  const encounter = getDungeonEncounter(d, S.today);
  const enemyNames = flattenEnemies(encounter.enemies);
  let battleOpts;
  if (d.type === 'worldBoss') {
    const bossName = enemyNames[0];
    const spawnOpts = getWorldBossSpawnOpts(bossName);
    battleOpts = { enemyStatScale: spawnOpts };
  } else if (d.type === 'echo') {
    const bossName = enemyNames[0];
    const finalScale = (encounter.enemyScale || d.enemyScale || 1.0);
    const enemyLevel = getDungeonEnemyLevel(d);
    const minions = rollEchoMinions(bossName);
    const allNames = [bossName, ...minions.map(m => m.name)];
    const scales = [finalScale, ...minions.map(m => m.scale)];
    battleOpts = { enemyScales: scales, enemyLevel };
    enemyNames.length = 0;
    allNames.forEach(n => enemyNames.push(n));
  } else {
    const finalScale = (encounter.enemyScale || d.enemyScale || 1.0);
    const enemyLevel = getDungeonEnemyLevel(d);
    battleOpts = { enemyScale: finalScale, enemyLevel };
  }
  const battle = startEncounter({ team: names, enemies: enemyNames, options: battleOpts });
  if (!battle) {
    msg(`战斗创建失败：敌人「${enemyNames.join('、')}」配置异常（详见控制台）`);
    return;
  }
  currentBattleSignal.value = battle;
  pendingDungeon = { kind: 'dungeon', d, encounter, paidCost: false };
  pendingDungeonSignal.value = pendingDungeon;
  showBattleScreen();
}

// 进入深渊战斗
export function startAbyssBattle(floorOrId) {
  const names = getCombatTeamNames();
  if (names.length === 0) {
    msg('编队为空或队员已失效，先去编队面板组队');
    return;
  }
  const battle = startAbyssFloor(floorOrId);
  if (!battle) {
    msg('无法挑战：关卡已完成、队伍无效或敌人配置异常');
    return;
  }
  let info = null;
  for (const zk of Object.keys(ABYSS_ZONES)) {
    info = ABYSS_ZONES[zk].floors.find(x => x.id === battle._abyssFloor);
    if (info) break;
  }
  currentBattleSignal.value = battle;
  pendingDungeon = { kind: 'abyss', floor: battle._abyssFloor, info };
  pendingDungeonSignal.value = pendingDungeon;
  showBattleScreen();
}

// 进入冥歌海墟战斗（不消耗体力）
export function startWastesBattle(stageId) {
  const names = getCombatTeamNames();
  if (names.length === 0) {
    msg('编队为空或队员已失效，先去编队面板组队');
    return;
  }
  const battle = startWastesStage(stageId);
  if (!battle) {
    msg('无法挑战：关卡已完成、队伍无效或敌人配置异常');
    return;
  }
  const info = WASTES_STAGES.find(s => s.id === stageId);
  currentBattleSignal.value = battle;
  pendingDungeon = { kind: 'wastes', stageId, info };
  pendingDungeonSignal.value = pendingDungeon;
  showBattleScreen();
}

function showBattleScreen() {
  const div = $('battleOverlay');
  if (!div) return;
  div.style.display = 'flex';
  _lastLogLen = 0;
  battleVisibleSignal.value = true;
  bumpBattleVersion();
}

function hideBattleScreen() {
  const div = $('battleOverlay');
  if (div) div.style.display = 'none';
  currentBattleSignal.value = null;
  pendingDungeonSignal.value = null;
  pendingDungeon = null;
  battleVisibleSignal.value = false;
}

function rerenderAfterBattle() {
  rerenderAll();
}

// ===== 主刷新：行动后调用，通过 signal 驱动 Preact 重渲染 + toast 检测 =====
function refreshAll() {
  const b = currentBattleSignal.value;
  if (!b) return;

  // 新增日志中的"机制/buff 入场"弹 toast
  const newLogs = b.log.slice(_lastLogLen);
  _lastLogLen = b.log.length;
  newLogs.forEach(l => {
    if (l.type === 'mechanic') pushToast(l.msg);
    else if (l.type === 'system' && /回合 \d+/.test(l.msg)) pushToast(l.msg);
  });

  bumpBattleVersion();
}

// ===== 顶部 toast 队列 =====
function pushToast(text) {
  battleToastSignal.value = [...battleToastSignal.value, text];
}

// ===== 桥接到全局 =====
// Phase 3:registerBattleActions 收口为显式 initBattleUiBridge(),由 src/init.ts 调用。
// 必须在 BattleView 面板挂载前调用,否则 battleActions 的 _ctx 为 null,按钮 handler 会崩。
let _battleUiBridgeInitialized = false;
export function initBattleUiBridge() {
  if (_battleUiBridgeInitialized) return;
  _battleUiBridgeInitialized = true;
  registerBattleActions({
    getCurrentBattle: () => currentBattleSignal.value,
    getPendingDungeon: () => pendingDungeonSignal.value,
    refreshAll,
    hideBattleScreen,
    rerenderAfterBattle,
  });
}
