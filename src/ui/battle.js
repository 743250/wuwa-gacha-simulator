// 战斗 UI（全屏覆盖）
// 重构：拆 4 个区独立刷新，避免每次行动整页 innerHTML 重绘导致的"UI 一直变"
// 增强：buff 突出显示 + 入场动画 + 顶部 toast 队列
import { S, $, msg } from '../state.js';
import { startEncounter, getCombatTeamNames } from '../battle/combat.js';
import { collectUnitBadges, collectEnemyBadges, renderBadge } from './battleRenderers/buffRenderers.js';
import { renderTeamHTML } from './battle/teamRenderer.js';
import { renderEnemiesHTML, renderActionsHTML } from './battle/enemyRenderer.js';
import { flattenEnemies, DUNGEONS, canUseWeeklyBoss, getWeeklyBossUsed, WEEKLY_BOSS_LIMIT, getDungeonEncounter, getWorldBossSpawnOpts, getDungeonEnemyLevel, rollEchoMinions } from '../battle/dungeon.js';
import { ABYSS_ZONES, startAbyssFloor } from '../daily/abyss.js';
import { startWastesStage, WASTES_STAGES } from '../daily/wastes.js';
import { registerBattleActions } from './battle/battleActions.js';

let currentBattle = null;
let pendingDungeon = null;
let _lastLogLen = 0;       // 用于检测新增日志（弹 toast）
let _lastBuffSnapshot = null; // 用于检测新增 buff（用 flash 动画）

// 显示名：形态切换后 unit.displayName 会覆盖 unit.name（Step C）
// 数据层一律用 unit.name（key、log、save），UI 显示层走这里
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
  const sol3 = getSol3Config(getSol3Level());
  const enemyNames = flattenEnemies(encounter.enemies);
  // 三档机制：所有副本（含世界 BOSS）的敌人等级由 getDungeonEnemyLevel 决定
  let battleOpts;
  if (d.type === 'worldBoss') {
    const bossName = enemyNames[0];
    const spawnOpts = getWorldBossSpawnOpts(bossName);
    battleOpts = { enemyStatScale: spawnOpts };
  } else if (d.type === 'echo') {
    // 无音区：守关 BOSS + 按元素抽取的精英/小怪混编（官方设定）
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
  currentBattle = battle;
  pendingDungeon = { kind: 'dungeon', d, encounter, paidCost: false };
  showBattleScreen();
}

// 进入深渊战斗
export function startAbyssBattle(floorOrId) {
  const names = getCombatTeamNames();
  if (names.length === 0) {
    msg('编队为空或队员已失效，先去编队面板组队');
    return;
  }
  // 兼容：传 id 字符串 → 走新版 startAbyssFloor；传数字 → 旧版危险区第 N 层
  const battle = startAbyssFloor(floorOrId);
  if (!battle) {
    msg('无法挑战：关卡已完成、队伍无效或敌人配置异常');
    return;
  }
  // 找到 info 用于结算 UI
  let info = null;
  for (const zk of Object.keys(ABYSS_ZONES)) {
    info = ABYSS_ZONES[zk].floors.find(x => x.id === battle._abyssFloor);
    if (info) break;
  }
  currentBattle = battle;
  pendingDungeon = { kind: 'abyss', floor: battle._abyssFloor, info };
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
  currentBattle = battle;
  pendingDungeon = { kind: 'wastes', stageId, info };
  showBattleScreen();
}

function showBattleScreen() {
  const div = $('battleOverlay');
  if (!div) return;
  div.style.display = 'flex';
  _lastLogLen = 0;
  _lastBuffSnapshot = null;
  buildBattleScaffold();
  refreshAll();
}

function hideBattleScreen() {
  const div = $('battleOverlay');
  if (div) div.style.display = 'none';
  currentBattle = null;
  pendingDungeon = null;
}

function rerenderAfterBattle() {
  if (typeof window.__rerenderAll === 'function') window.__rerenderAll();
  else if (typeof window.__render === 'function') window.__render();
}

// ===== 外框：只在战斗开始时建一次 =====
function buildBattleScaffold() {
  const container = $('battleOverlay');
  if (!container) return;
  container.innerHTML = `
    <div class="battle-root" style="position:relative">
      <div class="bf-toast-stack" id="bfToastStack"></div>
      <div id="bfHeader"></div>
      <div id="bfBuffStripe"></div>
      <div id="bfEnemies" style="margin-bottom:14px"></div>
      <div id="bfTeam" style="margin-bottom:12px"></div>
      <div id="bfLog"></div>
      <div id="bfActions"></div>
    </div>`;
}

// ===== 主刷新：行动后调用，分区刷新 =====
function refreshAll() {
  const b = currentBattle;
  if (!b) return;
  renderHeader();
  renderBuffStripe();   // 顶部 buff 横条（明显化关键）
  renderEnemies();
  renderTeam();
  renderLog();
  renderActions();
  // 新增日志中的"机制/buff 入场"弹 toast
  const newLogs = b.log.slice(_lastLogLen);
  _lastLogLen = b.log.length;
  newLogs.forEach(l => {
    if (l.type === 'mechanic') pushToast(l.msg);
    else if (l.type === 'system' && /回合 \d+/.test(l.msg)) pushToast(l.msg);
  });
}

// ===== 顶部信息条 =====
function renderHeader() {
  const b = currentBattle;
  const root = $('bfHeader');
  if (!root) return;
  const titleTxt = pendingDungeon?.kind === 'abyss'
    ? `逆境深塔 · 第 ${pendingDungeon.floor} 层`
    : (pendingDungeon?.d?.name || '战斗');
  const subTitle = pendingDungeon?.kind === 'dungeon' && pendingDungeon.encounter
    ? `今日敌情：${pendingDungeon.encounter.tag} · ${pendingDungeon.encounter.enemies.join(' / ')}`
    : '';
  const switchTag = b.switchUsedThisTurn
    ? '<span style="color:var(--red)">切人已用</span>'
    : '<span style="color:var(--green)">可切人 1 次</span>';
  root.innerHTML = `<div style="text-align:center;margin-bottom:12px">
    <div style="font-size:18px;font-weight:700;letter-spacing:3px;color:var(--gold)">${titleTxt}</div>
    ${subTitle ? `<div style="font-size:11px;color:var(--accent);letter-spacing:1px;margin-top:4px">${subTitle}</div>` : ''}
    <div style="font-size:11px;color:var(--muted);letter-spacing:2px;margin-top:4px">
      回合 <b style="color:var(--text)">${b.turn}</b> · AP <b style="color:var(--gold)">${b.ap}/${b.apMax}</b> · ${switchTag} · 当前 <b style="color:var(--accent)">${displayName(b.team[b.active])}</b>
    </div>
    <div style="font-size:9px;color:var(--dim);letter-spacing:.5px;margin-top:4px;line-height:1.5">
      每回合 4 AP · 普攻 1AP · 技能 1AP/CD3${b.team[b.active]?.hasHeavy ? ' · 重击 2AP/CD1' : ''} · 解放 3AP · 切人 0AP（限 1 次）
    </div>
  </div>`;
}

// ===== 顶部 buff 横条（明显化）=====
// 全队 + 全敌人 状态汇总成大号彩色徽章；新出现的加 flash 动画
// 通过 collectUnitBadges / collectEnemyBadges 统一收集，自带 tooltip
function renderBuffStripe() {
  const b = currentBattle;
  const root = $('bfBuffStripe');
  if (!root) return;
  const items = [];

  b.team.forEach(t => {
    if (!t.alive) return;
    const badges = collectUnitBadges(t, b, { includeTeamGlobal: true });
    badges.forEach(bd => {
      // 顶部 stripe 加角色名前缀，避免同名 buff 在不同角色身上混淆
      items.push({ ...bd, key: bd.key, label: `${displayName(t)} ${bd.label}` });
    });
  });

  b.enemies.forEach(e => {
    if (!e.alive) return;
    const badges = collectEnemyBadges(e, b);
    badges.forEach(bd => {
      items.push({ ...bd, key: bd.key, label: `${displayName(e)} ${bd.label}` });
    });
  });

  if (items.length === 0) {
    root.className = 'bf-buff-stripe empty';
    root.innerHTML = '— 无状态 / 增益 —';
    _lastBuffSnapshot = new Set();
    return;
  }
  root.className = 'bf-buff-stripe';
  const prev = _lastBuffSnapshot || new Set();
  root.innerHTML = items.map(it => {
    const isNew = !prev.has(it.key);
    const tipEsc = String(it.tip || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<span class="tip-term bf-buff ${it.cls}${isNew ? ' flash' : ''}" data-tip="${tipEsc}">${it.icon} ${it.label}${it.dur != null ? `<span class="bf-dur">${it.dur}</span>` : ''}</span>`;
  }).join('');
  _lastBuffSnapshot = new Set(items.map(i => i.key));
}

// ===== 敌人区 =====
function renderEnemies() {
  const b = currentBattle;
  const root = $('bfEnemies');
  if (!root) return;
  root.innerHTML = renderEnemiesHTML(b);
}

// ===== 我方区 =====
function renderTeam() {
  const b = currentBattle;
  const root = $('bfTeam');
  if (!root) return;
  root.innerHTML = renderTeamHTML(b);
}

// ===== 日志 =====
function renderLog() {
  const b = currentBattle;
  const root = $('bfLog');
  if (!root) return;
  const logs = b.log.slice(-8);
  let html = '<div style="margin-bottom:12px;font-size:11px;color:var(--muted);max-height:100px;overflow-y:auto;background:rgba(0,0,0,.25);border-radius:8px;padding:8px 12px;line-height:1.6">';
  logs.forEach(l => {
    const text = formatLogLine(l);
    if (text) html += `<div>${text}</div>`;
  });
  html += '</div>';
  root.innerHTML = html;
}

// ===== 动作按钮 =====
function renderActions() {
  const b = currentBattle;
  const root = $('bfActions');
  if (!root) return;
  root.innerHTML = renderActionsHTML(b);
}

function formatLogLine(l) {
  if (l.type === 'attack') return `${l.src} ${l.action || '普攻'} → ${l.tgt} <b style="color:var(--red)">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'skill') return `${l.src} 技能 → ${l.tgt} <b style="color:var(--accent)">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'heavy') return `${l.src} 💢 ${l.action || '重击'} → ${l.tgt} <b style="color:#ff8c5e">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'burst') return `${l.src} 解放 → ${l.results.map(r => `${r.tgt}${r.primary ? '★' : ''} <b style="color:var(--gold)">${r.dmg}</b>`).join(', ')}`;
  if (l.type === 'switch') return `↑ ${l.src} 上场`;
  if (l.type === 'enemy_attack') return `<span style="color:var(--red)">${l.src}</span> 攻击 → ${l.tgt} <b>${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'dodge') return `<span style="color:var(--accent)">${l.tgt} 闪避了 ${l.src} 的攻击！</span>`;
  if (l.type === 'heal') return `${l.src} 治疗 ${l.tgt} <b style="color:var(--green)">+${l.dmg}</b>`;
  if (l.type === 'burn') return `🔥 ${l.tgt} 受到点燃 <b>${l.dmg}</b>`;
  if (l.type === 'freeze') return `❄ ${l.tgt} 被冻结`;
  if (l.type === 'summon') return `🟢 ${l.src} 召唤 ${l.tgt}`;
  if (l.type === 'mechanic') return `⚠ ${l.src} · ${l.msg}`;
  if (l.type === 'system') return `<span style="color:var(--gold)">${l.msg}</span>`;
  return '';
}

// ===== 顶部 toast 队列：新机制/新回合 push 一条彩色横幅，2 秒淡出 =====
function pushToast(text) {
  const stack = $('bfToastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'bf-toast';
  el.textContent = text;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .4s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 450);
  }, 1800);
}

// ===== 桥接到全局 =====
registerBattleActions({
  getCurrentBattle: () => currentBattle,
  getPendingDungeon: () => pendingDungeon,
  refreshAll,
  hideBattleScreen,
  rerenderAfterBattle,
});

// 暴露给外部
window.__startDungeon = startDungeonBattle;
window.__startAbyss = startAbyssBattle;
window.__startWastes = startWastesBattle;
