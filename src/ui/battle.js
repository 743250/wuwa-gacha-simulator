// 战斗 UI（全屏覆盖）
// 重构：拆 4 个区独立刷新，避免每次行动整页 innerHTML 重绘导致的"UI 一直变"
// 增强：buff 突出显示 + 入场动画 + 顶部 toast 队列
import { S, $, msg } from '../state.js';
import { startEncounter, doAttack, doSkill, doHeavy, doBurst, doSwitch, doDebris, endTurn, getCombatTeamNames, canAttack, canSkill, canHeavy, canBurst } from '../battle/combat.js';
import { renderCharacterBattleStatus } from '../battle/characters/index.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import { collectUnitBadges, collectEnemyBadges, renderBadge } from './battleRenderers/buffRenderers.js';
import { flattenEnemies, DUNGEONS, canUseWeeklyBoss, consumeWeeklyBoss, getWeeklyBossUsed, WEEKLY_BOSS_LIMIT, getDungeonEncounter, getSol3Level, getSol3Config, getWorldBossSpawnOpts, getDungeonEnemyLevel, onBattleResult } from '../battle/dungeon.js';
import { spendStamina } from '../daily/stamina.js';
import { generateEcho } from '../equip/echoActions.js';
import { getEchoesBySet } from '../data/echoes.js';
import { settleAbyss, ABYSS_ZONES, startAbyssFloor } from '../daily/abyss.js';
import { settleWastes, startWastesStage, WASTES_STAGES } from '../daily/wastes.js';
import { progressTask } from '../podcast/core.js';

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
  } else {
    const finalScale = (encounter.enemyScale || d.enemyScale || 1.0);
    const enemyLevel = getDungeonEnemyLevel(d);
    battleOpts = { enemyScale: finalScale, enemyLevel };
  }
  const battle = startEncounter({ team: names, enemies: enemyNames, options: battleOpts });
  if (!battle) {
    msg('战斗创建失败：队伍或敌人配置异常');
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
  // 初始化 / 校验目标选中：若当前目标已死，自动改成第一个活的
  if (b.targetIdx == null || !b.enemies[b.targetIdx]?.alive) {
    b.targetIdx = b.enemies.findIndex(e => e.alive);
  }
  let html = '';
  b.enemies.forEach((e, realIdx) => {
    if (!e.alive) return;
    const isTarget = b.targetIdx === realIdx;
    const hpPct = Math.max(0, e.hp / e.hpMax);
    const elemColor = ELEMENT_COLOR[e.element] || '#fff';
    const vibPct = (e.vibration ?? 100) / (e.vibrationMax || 100);
    const broken = e.suppressed > 0;
    const enemyBadges = collectEnemyBadges(e, b);
    const badgeRow = enemyBadges.length
      ? `<div class="bf-status-row">${enemyBadges.map(renderBadge).join('')}</div>`
      : '';
    html += `<div onclick="window.__bTarget(${realIdx})" style="border:1px solid ${isTarget ? 'var(--red)' : 'var(--line)'};border-radius:10px;padding:11px;margin-bottom:6px;background:${isTarget ? 'rgba(255,80,80,.10)' : 'rgba(255,80,80,.04)'};cursor:pointer;transition:.15s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-weight:600;font-size:14px">${isTarget ? '🎯 ' : ''}${displayName(e)}${e.class ? ` <span style="font-size:9px;color:var(--muted);letter-spacing:1px">[${e.class}]</span>` : ''}</span>
        <span style="font-size:10px;padding:2px 8px;border:1px solid ${elemColor};color:${elemColor};border-radius:999px">${e.element}</span>
      </div>
      <div style="height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${(hpPct*100).toFixed(1)}%;background:linear-gradient(90deg,var(--red),#ffaaaa);border-radius:4px;transition:width .35s ease"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:4px">
        <span>${e.hp.toLocaleString()} / ${e.hpMax.toLocaleString()}</span>
        <span>${(hpPct*100).toFixed(0)}% · 本属性抗 40%</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
        <span style="font-size:9px;color:${broken ? 'var(--gold)' : 'var(--muted)'};letter-spacing:1px;min-width:50px">${broken ? `中断 ×${(1 + (e.suppressedVuln || 0.3)).toFixed(1)} (${e.suppressed}回合)` : '破韧'}</span>
        <div style="flex:1;height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${(vibPct*100).toFixed(1)}%;background:${broken ? 'var(--gold)' : '#aaa'};border-radius:2px;transition:width .3s ease"></div>
        </div>
      </div>
      ${badgeRow}
    </div>`;
  });
  root.innerHTML = html;
}

// ===== 我方区 =====
function renderTeam() {
  const b = currentBattle;
  const root = $('bfTeam');
  if (!root) return;
  const aliveTeam = b.team.filter(t => t.alive);
  let html = '<div style="display:grid;grid-template-columns:repeat(' + aliveTeam.length + ',1fr);gap:6px">';
  b.team.forEach((t, i) => {
    if (!t.alive) return;
    const hpPct = Math.max(0, t.hp / t.hpMax);
    const enPct = t.energy / t.energyMax;
    const isActive = i === b.active;
    const elemColor = ELEMENT_COLOR[t.element] || '#fff';
    const frozen = t.frozenTurns > 0 ? '<span style="color:var(--accent);font-size:9px">❄</span>' : '';
    const locked = t.skillLockedTurns > 0 ? '<span style="color:var(--red);font-size:9px">🔒</span>' : '';
    const burstReady = t.energy >= t.energyMax ? '⚡' : '';
    const f = t.forte;
    const fPct = f ? (f.current / f.max) : 0;
    const fReady = f && f.ready;
    const concertoPct = ((t.concerto || 0) / 100);
    const canSwitch = !isActive && t.alive && t.frozenTurns === 0 && !b.switchUsedThisTurn;
    const swapHint = !isActive ? (b.switchUsedThisTurn ? '本回合不能再切' : (b.team[b.active]?.concerto >= 100 ? '点击切换 · 强化变奏!' : '点击切换 · 触发变奏')) : '';
    html += `<div class="bf-unit ${isActive ? 'active' : ''}" style="border:2px solid ${isActive ? 'var(--gold)' : 'var(--line)'};border-radius:10px;padding:8px;background:${isActive ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)'};cursor:${canSwitch ? 'pointer' : 'default'};opacity:${canSwitch || isActive ? '1' : '.6'}"
      onclick="${canSwitch ? `window.__bSwitch(${i})` : ''}" title="${swapHint}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:12px;font-weight:600">${displayName(t)}${frozen}${locked}${burstReady}${fReady ? '<span style="color:var(--gold);font-size:9px;margin-left:3px">✦</span>' : ''}</span>
        <span style="font-size:9px;color:${elemColor}">${t.element}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
        <div style="flex:1;height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${(hpPct*100).toFixed(1)}%;background:var(--green);transition:width .35s ease"></div>
        </div>
        <span style="font-size:9px;color:var(--muted);white-space:nowrap">HP ${t.hp}/${t.hpMax}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
        <div style="flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${(enPct*100).toFixed(1)}%;background:var(--accent);transition:width .3s ease"></div>
        </div>
        <span style="font-size:9px;color:var(--accent);white-space:nowrap">能量 ${t.energy}/${t.energyMax}</span>
      </div>
      ${f ? `<div style="display:flex;align-items:center;gap:6px;margin-top:4px">
        <div style="flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${(fPct*100).toFixed(1)}%;background:${fReady ? 'var(--gold)' : '#c39bff'};transition:width .3s ease"></div>
        </div>
        <span style="font-size:9px;color:${fReady ? 'var(--gold)' : '#c39bff'};white-space:nowrap">${f.resourceName} ${f.current}/${f.max}${fReady ? ' · 强化就绪!' : ''}</span>
      </div>` : ''}
      ${renderCharacterBattleStatus(t)}
      <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
        <div style="flex:1;height:2px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${(concertoPct*100).toFixed(1)}%;background:linear-gradient(90deg,#69b8ff,#c39bff);transition:width .3s ease"></div>
        </div>
        <span style="font-size:8px;color:var(--muted);white-space:nowrap">协奏 ${t.concerto || 0}/100${t.dodge ? ` · 闪避 ${(t.dodge*100).toFixed(0)}%` : ''}</span>
      </div>
      ${renderWeaponStacks(t)}
      <div style="font-size:9px;color:${t.cd.skill > 0 ? 'var(--muted)' : 'var(--green)'};margin-top:2px">
        ${t.skillLockedTurns > 0 ? `技能封锁 ${t.skillLockedTurns}回` : (t.cd.skill > 0 ? `技能 CD ${t.cd.skill}回` : '技能就绪')}${(t.hasHeavy && t.cd.heavy > 0) ? ` · 重击 CD ${t.cd.heavy}回` : ''}
        ${t._wallLocked > 0 ? ` · <span style="color:var(--accent)">⚡雷霆墙锁定</span>` : ''}
      </div>
      ${(() => {
        const badges = collectUnitBadges(t, b, { includeTeamGlobal: false });
        return badges.length ? `<div class="bf-status-row">${badges.map(renderBadge).join('')}</div>` : '';
      })()}
      ${(() => {
        // ★ 召唤物 HP 条(赫卡忒等)·挂在主人卡片下方,不可点击切换
        const summons = (b.summons || []).filter(s => s.alive && s.ownerIdx === i);
        if (!summons.length) return '';
        return summons.map(s => {
          const sHpPct = Math.max(0, s.hp / s.hpMax);
          return `<div class="bf-summon" style="margin-top:6px;padding:6px 8px;border:1.5px dashed var(--gold);border-radius:8px;background:rgba(155,109,255,.06);cursor:default" title="召唤物 · 不可切换 · 不可控制">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <span style="font-size:11px;font-weight:600;color:#9b6dff">🢀 ${s.name}</span>
              <span style="font-size:9px;color:var(--muted)">召唤物 · ${s.duration>0?`持续 ${s.duration} 回合`:'永久'}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="flex:1;height:4px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${(sHpPct*100).toFixed(1)}%;background:#9b6dff;transition:width .35s ease"></div>
              </div>
              <span style="font-size:9px;color:#c39bff;white-space:nowrap">HP ${s.hp}/${s.hpMax}</span>
            </div>
          </div>`;
        }).join('');
      })()}
    </div>`;
  });
  html += '</div>';
  root.innerHTML = html;
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
  let html = '';
  if (!b.finished) {
    const cur = b.team[b.active];
    if (b.targetIdx == null || !b.enemies[b.targetIdx]?.alive) {
      b.targetIdx = b.enemies.findIndex(e => e.alive);
    }
    const enemyIdx = b.targetIdx;
    const aliveEnemyCount = b.enemies.filter(e => e.alive).length;
    const hasTarget = enemyIdx >= 0;
    const notFrozen = cur && cur.alive && cur.frozenTurns === 0;
    const skillReady = cur && cur.cd.skill === 0 && (cur.skillLockedTurns || 0) === 0;
    const canAtk = canAttack(cur, b, enemyIdx).ok;
    const canSkillOk = canSkill(cur, b, enemyIdx).ok;
    const isZhezhi = cur.name === '折枝';
    const zhezhiDianjingReady = isZhezhi && (cur.zhezhiFieldTurns || 0) > 0 && (cur.zhezhiCranes || 0) > 0;
    const canHeavyOk = canHeavy(cur, b, enemyIdx).ok;
    const isFurolo = cur.name === '弗洛洛';
    const furoloBurstReady = isFurolo && !!cur.furoloDirge;
    const canBurstOk = canBurst(cur, b).ok;

    const blocker = (() => {
      if (cur && !cur.alive) return '当前角色已倒下，请切换队员';
      if (cur && cur.frozenTurns > 0) return `${displayName(cur)} 被冻结（剩余 ${cur.frozenTurns} 回合）→ 请切换队员或结束回合`;
      if (cur && cur.skillLockedTurns > 0) return `${displayName(cur)} 技能被封锁（剩余 ${cur.skillLockedTurns} 回合）`;
      if (!hasTarget) return '当前没有活着的敌人';
      if (b.ap <= 0) return `AP 已耗尽（0/${b.apMax}）→ 请点击「结束回合」`;
      return '';
    })();

    html += renderSkillPanel(cur);
    if (blocker) {
      html += `<div style="margin-bottom:8px;padding:8px 12px;border-radius:8px;background:rgba(255,133,133,.08);border-left:3px solid var(--red);color:#ffaaaa;font-size:11px;letter-spacing:.5px">⚠ ${blocker}</div>`;
    }
    // 无重击的角色（如守岸人、吟霖）：按钮整列移除，网格变 3 列
    const showHeavy = !!cur.hasHeavy;
    const cols = showHeavy ? 4 : 3;
    html += `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;margin-bottom:8px">`;
    // 动态样式：按钮亮色仅在 can=true 时生效，否则强制灰化
    const litStyle = (can, color) => can
      ? `border-color:${color};color:${color}${color==='var(--gold)'?';background:rgba(245,207,107,.08)':''}`
      : `border-color:var(--line);color:var(--dim);background:rgba(255,255,255,.02);opacity:.4;cursor:not-allowed`;
    html += `<button class="bbtn" style="${litStyle(canAtk, 'var(--text)')}" onclick="window.__bAtk(${enemyIdx})" ${!canAtk ? 'disabled' : ''} title="100% 攻击 · +12 能量 · 削破韧 8">⚔ 普攻<br><span style="font-size:9px;opacity:.7">1 AP</span></button>`;
    html += `<button class="bbtn" style="${litStyle(canSkillOk, 'var(--accent)')}" onclick="window.__bSkill(${enemyIdx})" ${!canSkillOk ? 'disabled' : ''} title="180% 攻击 · CD 3 回合 · +22 能量 · 削破韧 20">✦ 技能<br><span style="font-size:9px;opacity:.7">1 AP${cur.cd.skill > 0 ? ' · CD'+cur.cd.skill : ''}</span></button>`;
    if (showHeavy) {
      html += `<button class="bbtn" style="${litStyle(canHeavyOk, '#ff8c5e')}" onclick="window.__bHeavy(${enemyIdx})" ${!canHeavyOk ? 'disabled' : ''} title="220% 攻击 · 重击伤害类型 · CD 1 回合 · +15 能量 · 削破韧 25">💢 重击<br><span style="font-size:9px;opacity:.7">2 AP${cur.cd.heavy > 0 ? ' · CD'+cur.cd.heavy : ''}</span></button>`;
    }
    const burstHint = isFurolo
      ? '弗洛洛 · 0 AP · 需定音状态 · 进入指挥状态 + 赫卡忒召唤'
      : '主目标 400% · 副目标 200% · AOE · 需能量满 · 削破韧 30';
    const burstSub = isFurolo
      ? (furoloBurstReady ? '定音 · 可解放' : '需定音')
      : `3 AP · ${cur.energy}/${cur.energyMax}`;
    html += `<button class="bbtn" style="${litStyle(canBurstOk, 'var(--gold)')}" onclick="window.__bBurst()" ${!canBurstOk ? 'disabled' : ''} title="${burstHint}">⚡ 解放<br><span style="font-size:9px;opacity:.7">${burstSub}</span></button>`;
    html += '</div>';
    // 残骸投掷按钮（聚械机偶特殊动作 · 0 AP）
    const hasDebris = b.enemies.some(e => e.alive && e._debrisReady);
    if (hasDebris) {
      html += `<button style="width:100%;padding:11px;margin-bottom:6px;background:rgba(245,207,107,.12);border:1px solid var(--gold);border-radius:8px;color:var(--gold);font-size:12px;letter-spacing:2px;cursor:pointer"
        onclick="window.__bDebris()">⚙ 投掷残骸（0 AP · 眩晕 BOSS 1 回合）</button>`;
    }
    html += `<button style="width:100%;padding:11px;background:linear-gradient(180deg,#1a2436,#0e1626);border:1px solid var(--line2);border-radius:8px;color:var(--text);font-size:12px;letter-spacing:3px"
      onclick="window.__bEndTurn()">结 束 回 合 →</button>`;
  } else if (b.result === 'win') {
    html += `<div style="margin-top:12px;text-align:center;padding:16px;border:1px solid var(--green);border-radius:10px;background:rgba(141,230,166,.06)">
      <div style="font-size:22px;color:var(--green);font-weight:700;letter-spacing:4px">胜 利！</div>
      <div style="font-size:11px;color:var(--muted);margin:6px 0">用 ${b.turn} 回合通关</div>
      <button style="padding:11px 28px;margin-top:8px;background:var(--gold);color:#1a1208;border:none;border-radius:8px;font-weight:700;letter-spacing:3px;cursor:pointer"
        onclick="window.__bSettle()">领 取 奖 励</button>
    </div>`;
  } else {
    html += `<div style="margin-top:12px;text-align:center;padding:16px;border:1px solid var(--red);border-radius:10px;background:rgba(255,133,133,.04)">
      <div style="font-size:22px;color:var(--red);font-weight:700;letter-spacing:4px">战 斗 失 败</div>
      <button style="padding:11px 28px;margin-top:8px;background:rgba(255,255,255,.06);color:var(--text);border:1px solid var(--line);border-radius:8px;letter-spacing:3px;cursor:pointer"
        onclick="window.__bClose()">关 闭</button>
    </div>`;
  }
  root.innerHTML = html;
}

// 当前角色技能说明面板（动作按钮上方）
function renderSkillPanel(cur) {
  if (!cur) return '';
  const f = cur.forte;
  const wName = cur.weapon?.name;
  const fStatus = (() => {
    if (!f) return '';
    if (!f.ready) return `${f.resourceName} ${f.current}/${f.max}`;
    if (f.effectType === 'shorekeeperField') {
      return `<span style="color:var(--gold)">✦ ${f.resourceName}已就绪 · 解放可展开星域</span>`;
    }
    const actionName = f.effectType === 'enhancedSkill'
      ? '技能'
      : f.effectType === 'enhancedBurst'
        ? '解放'
        : '普攻';
    const multText = Number.isFinite(f.effectMult) ? ` ×${f.effectMult.toFixed(1)}` : '';
    return `<span style="color:var(--gold)">✦ ${f.resourceName}已就绪 · 下次${actionName}强化${multText}</span>`;
  })();

  let html = `<div style="border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin-bottom:8px;background:rgba(245,207,107,.04);font-size:11px;line-height:1.55">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
      <span style="font-weight:700;color:var(--gold);letter-spacing:1px">${displayName(cur)}</span>
      <span style="font-size:10px;color:var(--muted)">${cur.element} · ${cur.type}${wName ? ' · 装备 ' + wName : ''}</span>
    </div>`;

  if (f) html += `<div style="font-size:10px;color:var(--muted);margin-bottom:3px">${fStatus}</div>
    <div style="font-size:9px;color:var(--dim);margin-bottom:3px;letter-spacing:.3px">${f.desc}</div>`;
  html += '</div>';
  return html;
}

// 渲染角色当前武器叠层标签
function renderWeaponStacks(t) {
  const stacks = t.weaponStacks || {};
  const items = [];
  Object.values(stacks).forEach(s => {
    const label = effectLabel(s.effect, s.element);
    items.push(`<span class="wstack" title="${s.duration} 回合">${label} ${s.stacks > 1 || s.maxStacks > 1 ? `×${s.stacks}/${s.maxStacks}` : ''}</span>`);
  });
  if (items.length === 0) return '';
  return `<div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:2px">${items.join('')}</div>`;
}

function effectLabel(effect, element) {
  switch (effect) {
    case 'atk_pct':     return '攻击↑';
    case 'normal_pct':  return '普攻↑';
    case 'skill_pct':   return '技能↑';
    case 'burst_pct':   return '解放↑';
    case 'heavy_pct':   return '重击↑';
    case 'elem_dmg':    return `${element || '元素'}↑`;
    case 'def_pierce':  return '穿防';
    case 'team_atk':    return '全队攻↑';
    case 'crate':       return '暴击↑';
    case 'concerto_refund': return '协奏↑';
    default:            return effect;
  }
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
window.__bAtk = (idx) => {
  const r = doAttack(currentBattle, idx);
  if (!r.ok) msg(r.err);
  else refreshAll();
};
window.__bTarget = (idx) => {
  if (!currentBattle || currentBattle.finished) return;
  if (currentBattle.enemies[idx]?.alive) {
    currentBattle.targetIdx = idx;
    refreshAll();
  }
};
window.__bSkill = (idx) => {
  const r = doSkill(currentBattle, idx);
  if (!r.ok) msg(r.err);
  else refreshAll();
};
window.__bHeavy = (idx) => {
  const r = doHeavy(currentBattle, idx);
  if (!r.ok) msg(r.err);
  else refreshAll();
};
window.__bBurst = () => {
  const r = doBurst(currentBattle);
  if (!r.ok) msg(r.err);
  else refreshAll();
};
window.__bDebris = () => {
  const r = doDebris(currentBattle);
  if (!r.ok) msg(r.err);
  else refreshAll();
};
window.__bSwitch = (i) => {
  const r = doSwitch(currentBattle, i);
  if (!r.ok) msg(r.err);
  else refreshAll();
};
window.__bEndTurn = () => {
  endTurn(currentBattle);
  refreshAll();
};
window.__bClose = () => {
  // 三档机制：失败 -20 级
  const pd = pendingDungeon;
  if (pd && pd.kind === 'dungeon' && currentBattle && currentBattle.result === 'lose') {
    const newLv = onBattleResult(pd.d, 'lose');
    msg(`${pd.d.name} 敌人等级降至 Lv${newLv}`, false);
  }
  hideBattleScreen();
  rerenderAfterBattle();
};
window.__bSettle = () => {
  const pd = pendingDungeon;
  if (!pd) { hideBattleScreen(); return; }
  if (pd.kind === 'dungeon') {
    if (!pd.paidCost) {
      spendStamina(pd.d.cost);
      if (pd.d.weeklyLimit) consumeWeeklyBoss();
      pd.paidCost = true;
    }
    const rawDrops = pd.d.drops || {};
    const sol3 = getSol3Config(getSol3Level());
    const dropMult = sol3.dropMult;
    const drops = {};
    Object.entries(rawDrops).forEach(([k, v]) => {
      // 星声不收世界等级加成，其余材料按 SOL3 倍率缩放
      // echo_set/echo_count 是元字段（字符串/数组/整数），不参与倍率缩放
      if (k === 'astrite' || k === 'echo_set' || k === 'echo_count') { drops[k] = v; return; }
      drops[k] = Math.round(v * dropMult);
    });
    const rewardText = [];
    if (drops.exp_super) { S.materials.exp_super += drops.exp_super; rewardText.push(`特级共鸣促剂 ×${drops.exp_super}`); }
    if (drops.exp_high) { S.materials.exp_high += drops.exp_high; rewardText.push(`高级共鸣促剂 ×${drops.exp_high}`); }
    if (drops.exp_mid) { S.materials.exp_mid += drops.exp_mid; rewardText.push(`中级共鸣促剂 ×${drops.exp_mid}`); }
    if (drops.exp_low) { S.materials.exp_low += drops.exp_low; rewardText.push(`初级共鸣促剂 ×${drops.exp_low}`); }
    if (drops.weapon_book) { S.materials.weapon_book += drops.weapon_book; rewardText.push(`武器石 ×${drops.weapon_book}`); }
    if (drops.echo_tuner) { S.materials.echo_tuner += drops.echo_tuner; rewardText.push(`声骸调谐器 ×${drops.echo_tuner}`); }
    if (drops.astrite) { S.astrite += drops.astrite; rewardText.push(`星声 +${drops.astrite}`); }
    // 声骸掉落：按套装筛选并生成 echo（echo_set 支持数组 → 多套随机选一）
    if (drops.echo_set) {
      const setIds = Array.isArray(drops.echo_set) ? drops.echo_set : [drops.echo_set];
      const pool = [];
      for (const sid of setIds) {
        const part = getEchoesBySet(sid);
        if (part.length) pool.push(...part);
      }
      if (pool.length) {
        const n = drops.echo_count || 1;
        const rolled = [];
        for (let i = 0; i < n; i++) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          const e = generateEcho(pick.id);
          if (e) rolled.push(e.name);
        }
        if (rolled.length) rewardText.push(`声骸 ×${rolled.length}: ${rolled.join(' · ')}`);
      }
    }
    // 电台任务：副本完成
    progressTask('d_dungeon', 1);
    progressTask('w_dungeon', 1);
    if (pd.d.weeklyLimit) {
      progressTask('w_weeklyboss', 1);
      progressTask('p_weeklyboss', 1);
    }
    msg('获得 ' + rewardText.join(' · '), false);
    // 三档机制：所有副本胜负都调整敌人等级
    if (currentBattle) {
      if (currentBattle.result === 'win') {
        const newLv = onBattleResult(pd.d, 'win');
        msg(`🏆 ${pd.d.name} 敌人等级提升至 Lv${newLv}`, false);
      } else if (currentBattle.result === 'lose') {
        const newLv = onBattleResult(pd.d, 'lose');
        msg(`${pd.d.name} 敌人等级降至 Lv${newLv}`, false);
      }
    }
  } else if (pd.kind === 'abyss') {
    const r = settleAbyss(currentBattle);
    if (r) {
      progressTask('w_abyss', 1);
      progressTask('p_abyss', 1);
      if (r.repeated) msg(`${r.name} · 本次未更新评星，无重复奖励`, false);
      else msg(`${r.name} ★${r.stars} · +${r.reward} 星声`, false);
    }
  } else if (pd.kind === 'wastes') {
    const r = settleWastes(currentBattle);
    if (r) {
      if (r.repeated) msg(`${r.name} · 本次未刷新最高分`, false);
      else {
        const tierTxt = r.tierReward > 0 ? ` · 🎁 积分档位 +${r.tierReward} 星声` : '';
        msg(`${r.name} · ${r.score.toLocaleString()} 分（累计 ${r.cumulative.toLocaleString()}）${tierTxt}`, false);
      }
    }
  }
  hideBattleScreen();
  rerenderAfterBattle();
};

// 暴露给外部
window.__startDungeon = startDungeonBattle;
window.__startAbyss = startAbyssBattle;
window.__startWastes = startWastesBattle;
