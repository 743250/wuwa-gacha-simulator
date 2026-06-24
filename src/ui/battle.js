// 战斗 UI（全屏覆盖）
// 重构：拆 4 个区独立刷新，避免每次行动整页 innerHTML 重绘导致的"UI 一直变"
// 增强：buff 突出显示 + 入场动画 + 顶部 toast 队列
import { S, $, msg } from '../state.js';
import { createBattle, doAttack, doSkill, doHeavy, doBurst, doSwitch, endTurn, getCombatTeamNames } from '../battle/combat.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import { flattenEnemies, DUNGEONS, canUseWeeklyBoss, consumeWeeklyBoss, getWeeklyBossUsed, WEEKLY_BOSS_LIMIT } from '../battle/dungeon.js';
import { spendStamina } from '../daily/stamina.js';
import { settleAbyss, ABYSS_ZONES, startAbyssFloor } from '../daily/abyss.js';
import { settleWastes, startWastesStage, WASTES_STAGES } from '../daily/wastes.js';
import { progressTask } from '../podcast/core.js';

let currentBattle = null;
let pendingDungeon = null;
let _lastLogLen = 0;       // 用于检测新增日志（弹 toast）
let _lastBuffSnapshot = null; // 用于检测新增 buff（用 flash 动画）

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
    msg(`本周无音区奖励已领取 ${WEEKLY_BOSS_LIMIT} 次（共享）`);
    return;
  }
  const enemyNames = flattenEnemies(d.enemies);
  const battle = createBattle(names, enemyNames, { enemyScale: d.enemyScale || 1.0 });
  if (!battle) {
    msg('战斗创建失败：队伍或敌人配置异常');
    return;
  }
  currentBattle = battle;
  pendingDungeon = { kind: 'dungeon', d, paidCost: false };
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
  const switchTag = b.switchUsedThisTurn
    ? '<span style="color:var(--red)">切人已用</span>'
    : '<span style="color:var(--green)">可切人 1 次</span>';
  root.innerHTML = `<div style="text-align:center;margin-bottom:12px">
    <div style="font-size:18px;font-weight:700;letter-spacing:3px;color:var(--gold)">${titleTxt}</div>
    <div style="font-size:11px;color:var(--muted);letter-spacing:2px;margin-top:4px">
      回合 <b style="color:var(--text)">${b.turn}</b> · AP <b style="color:var(--gold)">${b.ap}/${b.apMax}</b> · ${switchTag} · 当前 <b style="color:var(--accent)">${b.team[b.active]?.name}</b>
    </div>
    <div style="font-size:9px;color:var(--dim);letter-spacing:.5px;margin-top:4px;line-height:1.5">
      每回合 4 AP · 普攻 1AP · 技能 1AP/CD3 · 重击 2AP/CD1 · 解放 3AP · 切人 0AP（限 1 次）
    </div>
  </div>`;
}

// ===== 顶部 buff 横条（明显化）=====
// 把全队 + 全敌人 的所有 buff/debuff 汇总成大号彩色徽章；新出现的 buff 加 flash 动画
function renderBuffStripe() {
  const b = currentBattle;
  const root = $('bfBuffStripe');
  if (!root) return;
  const items = [];

  // "全队 buff" 去重：一份 buff 会同步存到每个队员身上，UI 只显示一次
  // 用 src+type+value 当 key，team buff 类型在白名单内
  const TEAM_BUFF_TYPES = new Set(['critUp', 'cdmgUp', 'atkUp']);
  const teamSeen = new Set();
  const isDup = (buf) => {
    if (!TEAM_BUFF_TYPES.has(buf.type)) return false;
    const k = `${buf.src || ''}-${buf.type}-${buf.value}`;
    if (teamSeen.has(k)) return true;
    teamSeen.add(k);
    return false;
  };

  b.team.forEach(t => {
    if (!t.alive) return;
    (t.buffs || []).forEach(buf => {
      if (isDup(buf)) return;
      if (buf.type === 'burstWindow') items.push({
        key: `bw-${t.name}`, cls: 'burst', icon: '🔥',
        label: `${t.name} 强化形态 +${(buf.value*100).toFixed(0)}%`, dur: buf.duration
      });
      if (buf.type === 'defense') items.push({
        key: `def-${t.name}`, cls: 'def', icon: '🛡',
        label: `${t.name} 减伤 ${(buf.value*100).toFixed(0)}%`, dur: buf.duration
      });
      if (buf.type === 'healUp') items.push({
        key: `hup-${t.name}`, cls: 'heal', icon: '💚',
        label: `${t.name} 治疗效果 +${(buf.value*100).toFixed(0)}%`, dur: buf.duration
      });
      if (buf.type === 'critUp') items.push({
        key: `cup-${t.name}`, cls: 'crit', icon: '✦',
        label: `全队 暴击 +${(buf.value*100).toFixed(0)}%`, dur: buf.duration
      });
      if (buf.type === 'cdmgUp') items.push({
        key: `cdup-${t.name}`, cls: 'crit', icon: '✦',
        label: `全队 暴伤 +${(buf.value*100).toFixed(0)}%`, dur: buf.duration
      });
      if (buf.type === 'atkUp') items.push({
        key: `aup-${t.name}`, cls: 'atk', icon: '⚔',
        label: `全队 攻击 +${(buf.value*100).toFixed(0)}%`, dur: buf.duration
      });
      if (buf.type === 'field') items.push({
        key: `fld-${t.name}`, cls: 'field', icon: '🌐',
        label: `${t.name} ${buf.label || '领域'}`, dur: buf.duration
      });
    });
    if (t.shield > 0) items.push({
      key: `sh-${t.name}`, cls: 'shield', icon: '🛡',
      label: `${t.name} 护盾 ${t.shield}`, dur: null
    });
    if (t.concerto >= 100) items.push({
      key: `con-${t.name}`, cls: 'crit', icon: '🎵',
      label: `${t.name} 协奏满（切人触发延奏）`, dur: null
    });
    if (t.skillLockedTurns > 0) items.push({
      key: `lock-${t.name}`, cls: 'debuff', icon: '🔒',
      label: `${t.name} 技能封锁`, dur: t.skillLockedTurns
    });
    (t.debuffs || []).forEach(d => {
      if (d.type === 'erosion') items.push({
        key: `per-${t.name}-${d.element}`, cls: 'debuff', icon: '☣',
        label: `${t.name} ${d.element}侵蚀`, dur: d.duration
      });
    });
  });

  b.enemies.forEach(e => {
    if (!e.alive) return;
    (e.debuffs || []).forEach(d => {
      if (d.type === 'erosion') items.push({
        key: `er-${e.name}-${d.element}`, cls: 'debuff', icon: '☣',
        label: `${e.name} ${d.element}侵蚀 +${(d.value*100).toFixed(0)}%`, dur: d.duration
      });
      if (d.type === 'spectro_frazzle') items.push({
        key: `sf-${e.name}`, cls: 'debuff', icon: '☣',
        label: `${e.name} 衍射失序`, dur: d.duration
      });
    });
    if (e.vibrationBroken > 0) items.push({
      key: `vb-${e.name}`, cls: 'debuff', icon: '💢',
      label: `${e.name} 破韧易伤 ×1.3`, dur: e.vibrationBroken
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
    return `<span class="bf-buff ${it.cls}${isNew ? ' flash' : ''}">${it.icon} ${it.label}${it.dur != null ? `<span class="bf-dur">${it.dur}</span>` : ''}</span>`;
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
    const broken = e.vibrationBroken > 0;
    const m = e.mechanic;
    let mechHint = '';
    if (m && m.type !== 'none') {
      const turnsToNext = m.cycle ? (m.cycle - (b.turn % m.cycle)) : 0;
      const desc = {
        burn_team: `🔥 每${m.cycle}回合点燃全队 ${(m.dmgPct*100).toFixed(0)}% HP`,
        freeze: `❄ 每${m.cycle}回合冻结 1 人`,
        shield: `🛡 HP ≤ ${(m.threshold*100).toFixed(0)}% 时生成 ${m.value} 护盾`,
        enrage: `⚡ HP ≤ ${(m.threshold*100).toFixed(0)}% 时狂暴 +${(m.atkBonus*100).toFixed(0)}%`,
        reflect: `↩ 每${m.cycle}回合反弹 ${(m.value*100).toFixed(0)}% 受伤`,
        minion: `🐺 每${m.cycle}回合召唤小弟`,
        thunder_chain: `⚡ 每${m.cycle}回合雷电连段`,
        dive: `🦅 每${m.cycle}回合俯冲`,
        aoe_freeze: `❄ 每${m.cycle}回合冰雾减速`,
        data_lock: `🔒 每${m.cycle}回合封锁 1 名技能`
      }[m.type] || '';
      mechHint = desc ? `<div style="font-size:9px;color:var(--muted);margin-top:3px;letter-spacing:.3px">${desc}${m.cycle && turnsToNext < m.cycle ? ' · 下次：' + turnsToNext + '回合后' : ''}</div>` : '';
    }
    html += `<div onclick="window.__bTarget(${realIdx})" style="border:1px solid ${isTarget ? 'var(--red)' : 'var(--line)'};border-radius:10px;padding:11px;margin-bottom:6px;background:${isTarget ? 'rgba(255,80,80,.10)' : 'rgba(255,80,80,.04)'};cursor:pointer;transition:.15s">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-weight:600;font-size:14px">${isTarget ? '🎯 ' : ''}${e.name}${e.class ? ` <span style="font-size:9px;color:var(--muted);letter-spacing:1px">[${e.class}]</span>` : ''}</span>
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
        <span style="font-size:9px;color:${broken ? 'var(--gold)' : 'var(--muted)'};letter-spacing:1px;min-width:50px">${broken ? `易伤 ×1.3 (${e.vibrationBroken}回合)` : '破韧'}</span>
        <div style="flex:1;height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${(vibPct*100).toFixed(1)}%;background:${broken ? 'var(--gold)' : '#aaa'};border-radius:2px;transition:width .3s ease"></div>
        </div>
      </div>
      ${e.shield > 0 ? `<div style="font-size:10px;color:var(--accent);margin-top:3px">🛡 护盾 ${e.shield}</div>` : ''}
      ${mechHint}
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
        <span style="font-size:12px;font-weight:600">${t.name}${frozen}${locked}${burstReady}${fReady ? '<span style="color:var(--gold);font-size:9px;margin-left:3px">✦</span>' : ''}</span>
        <span style="font-size:9px;color:${elemColor}">${t.element}</span>
      </div>
      <div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${(hpPct*100).toFixed(1)}%;background:var(--green);transition:width .35s ease"></div>
      </div>
      <div style="font-size:9px;color:var(--muted);margin-top:2px">HP ${t.hp}/${t.hpMax}</div>
      <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:4px;overflow:hidden">
        <div style="height:100%;width:${(enPct*100).toFixed(1)}%;background:var(--accent);transition:width .3s ease"></div>
      </div>
      <div style="font-size:9px;color:var(--accent);margin-top:1px">能量 ${t.energy}/${t.energyMax}</div>
      ${f ? `<div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:4px;overflow:hidden">
        <div style="height:100%;width:${(fPct*100).toFixed(1)}%;background:${fReady ? 'var(--gold)' : '#c39bff'};transition:width .3s ease"></div>
      </div>
      <div style="font-size:9px;color:${fReady ? 'var(--gold)' : '#c39bff'};margin-top:1px">${f.resourceName} ${f.current}/${f.max}${fReady ? ' · 强化就绪!' : ''}</div>` : ''}
      ${t.name === '忌炎' ? (() => {
        const cap = t.jiyanRuiyiCap || 2;
        const cur = t.ruiyi || 0;
        const perStack = t.jiyanRuiyiPerStack || 1.0;
        const nextMult = 1 + cur * perStack;
        const color = cur >= cap ? 'var(--red)' : cur > 0 ? 'var(--gold)' : 'var(--muted)';
        return `<div style="font-size:9px;color:${color};margin-top:2px;letter-spacing:.3px">锐意之势 ${'◆'.repeat(cur)}${'◇'.repeat(cap-cur)} ${cur}/${cap}${cur > 0 ? ` · 解放 ×${nextMult.toFixed(1)}` : ''}</div>`;
      })() : ''}
      <div style="height:2px;background:rgba(255,255,255,.06);border-radius:2px;margin-top:3px;overflow:hidden">
        <div style="height:100%;width:${(concertoPct*100).toFixed(1)}%;background:linear-gradient(90deg,#69b8ff,#c39bff);transition:width .3s ease"></div>
      </div>
      <div style="font-size:8px;color:var(--muted);margin-top:1px">协奏 ${t.concerto || 0}/100${t.dodge ? ` · 闪避 ${(t.dodge*100).toFixed(0)}%` : ''}</div>
      ${renderWeaponStacks(t)}
      <div style="font-size:9px;color:${t.cd.skill > 0 ? 'var(--muted)' : 'var(--green)'};margin-top:2px">
        ${t.skillLockedTurns > 0 ? `技能封锁 ${t.skillLockedTurns}回` : (t.cd.skill > 0 ? `技能 CD ${t.cd.skill}回` : '技能就绪')}${(t.hasHeavy && t.cd.heavy > 0) ? ` · 重击 CD ${t.cd.heavy}回` : ''}
      </div>
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
    const canAtk = notFrozen && b.ap >= 1 && hasTarget;
    const canSkill = notFrozen && skillReady && b.ap >= 1 && hasTarget;
    const canHeavy = cur.hasHeavy && notFrozen && cur.cd.heavy === 0 && b.ap >= 2 && hasTarget;
    const canBurst = notFrozen && cur.energy >= cur.energyMax && b.ap >= 3 && aliveEnemyCount > 0;

    const blocker = (() => {
      if (cur && !cur.alive) return '当前角色已倒下，请切换队员';
      if (cur && cur.frozenTurns > 0) return `${cur.name} 被冻结（剩余 ${cur.frozenTurns} 回合）→ 请切换队员或结束回合`;
      if (cur && cur.skillLockedTurns > 0) return `${cur.name} 技能被封锁（剩余 ${cur.skillLockedTurns} 回合）`;
      if (!hasTarget) return '当前没有活着的敌人';
      if (b.ap <= 0) return `AP 已耗尽（0/${b.apMax}）→ 请点击「结束回合」`;
      return '';
    })();

    html += renderSkillPanel(cur);
    if (blocker) {
      html += `<div style="margin-bottom:8px;padding:8px 12px;border-radius:8px;background:rgba(255,133,133,.08);border-left:3px solid var(--red);color:#ffaaaa;font-size:11px;letter-spacing:.5px">⚠ ${blocker}</div>`;
    }
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px">';
    // 动态样式：按钮亮色仅在 can=true 时生效，否则强制灰化
    const litStyle = (can, color) => can
      ? `border-color:${color};color:${color}${color==='var(--gold)'?';background:rgba(245,207,107,.08)':''}`
      : `border-color:var(--line);color:var(--dim);background:rgba(255,255,255,.02);opacity:.4;cursor:not-allowed`;
    html += `<button class="bbtn" style="${litStyle(canAtk, 'var(--text)')}" onclick="window.__bAtk(${enemyIdx})" ${!canAtk ? 'disabled' : ''} title="100% 攻击 · +12 能量 · 削破韧 8">⚔ 普攻<br><span style="font-size:9px;opacity:.7">1 AP</span></button>`;
    html += `<button class="bbtn" style="${litStyle(canSkill, 'var(--accent)')}" onclick="window.__bSkill(${enemyIdx})" ${!canSkill ? 'disabled' : ''} title="180% 攻击 · CD 3 回合 · +22 能量 · 削破韧 20">✦ 技能<br><span style="font-size:9px;opacity:.7">1 AP${cur.cd.skill > 0 ? ' · CD'+cur.cd.skill : ''}</span></button>`;
    html += `<button class="bbtn" style="${litStyle(canHeavy, '#ff8c5e')}" onclick="window.__bHeavy(${enemyIdx})" ${!canHeavy ? 'disabled' : ''} title="${!cur.hasHeavy ? cur.name+' 没有重击' : '220% 攻击 · 重击伤害类型 · CD 1 回合 · +15 能量 · 削破韧 25'}">💢 重击<br><span style="font-size:9px;opacity:.7">${!cur.hasHeavy ? '—' : `2 AP${cur.cd.heavy > 0 ? ' · CD'+cur.cd.heavy : ''}`}</span></button>`;
    html += `<button class="bbtn" style="${litStyle(canBurst, 'var(--gold)')}" onclick="window.__bBurst()" ${!canBurst ? 'disabled' : ''} title="300% 攻击 · AOE · 需能量满 · 削破韧 30">⚡ 解放<br><span style="font-size:9px;opacity:.7">3 AP · ${cur.energy}/${cur.energyMax}</span></button>`;
    html += '</div>';
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
      <span style="font-weight:700;color:var(--gold);letter-spacing:1px">${cur.name}</span>
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
    default:            return effect;
  }
}

function formatLogLine(l) {
  if (l.type === 'attack') return `${l.src} ${l.action || '普攻'} → ${l.tgt} <b style="color:var(--red)">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'skill') return `${l.src} 技能 → ${l.tgt} <b style="color:var(--accent)">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'heavy') return `${l.src} 💢 重击 → ${l.tgt} <b style="color:#ff8c5e">${l.dmg}</b>${l.crit ? ' ⚡' : ''}`;
  if (l.type === 'burst') return `${l.src} 解放 → ${l.results.map(r => `${r.tgt} <b style="color:var(--gold)">${r.dmg}</b>`).join(', ')}`;
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
    const drops = pd.d.drops || {};
    const rewardText = [];
    if (drops.exp_super) { S.materials.exp_super += drops.exp_super; rewardText.push(`特级共鸣促剂 ×${drops.exp_super}`); }
    if (drops.exp_high) { S.materials.exp_high += drops.exp_high; rewardText.push(`高级共鸣促剂 ×${drops.exp_high}`); }
    if (drops.exp_mid) { S.materials.exp_mid += drops.exp_mid; rewardText.push(`中级共鸣促剂 ×${drops.exp_mid}`); }
    if (drops.exp_low) { S.materials.exp_low += drops.exp_low; rewardText.push(`初级共鸣促剂 ×${drops.exp_low}`); }
    if (drops.weapon_book) { S.materials.weapon_book += drops.weapon_book; rewardText.push(`武器石 ×${drops.weapon_book}`); }
    if (drops.astrite) { S.astrite += drops.astrite; rewardText.push(`星声 +${drops.astrite}`); }
    // 电台任务：副本完成
    progressTask('d_dungeon', 1);
    progressTask('w_dungeon', 1);
    if (pd.d.weeklyLimit) {
      progressTask('w_weeklyboss', 1);
      progressTask('p_weeklyboss', 1);
    }
    msg('获得 ' + rewardText.join(' · '), false);
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
      if (r.repeated) msg(`${r.name} · 已通关，本次未更新评星`, false);
      else {
        const bonusTxt = r.bonus ? ` · 全清奖励 +${r.bonus}` : '';
        msg(`${r.name} ★${r.stars} · +${r.reward} 星声${bonusTxt}`, false);
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
