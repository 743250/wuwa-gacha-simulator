// 战斗 UI（全屏覆盖）
import { S, $, msg } from '../state.js';
import { createBattle, doAttack, doSkill, doHeavy, doBurst, doSwitch, endTurn } from '../battle/combat.js';
import { ELEMENT_COLOR } from '../battle/elements.js';
import { flattenEnemies, DUNGEONS } from '../battle/dungeon.js';
import { spendStamina } from '../daily/stamina.js';
import { settleAbyss, ABYSS_FLOORS } from '../daily/abyss.js';

let currentBattle = null;
let pendingDungeon = null;

// 进入副本战斗（普通副本）
export function startDungeonBattle(dungeonId) {
  const names = (S.team || [null, null, null]).filter(Boolean);
  if (names.length === 0) {
    msg('编队为空，先去编队面板组队');
    return;
  }
  const d = DUNGEONS.find(x => x.id === dungeonId);
  if (!d) return;
  if (S.stamina < d.cost) {
    msg(`体力不足（需 ${d.cost}）`);
    return;
  }
  const enemyNames = flattenEnemies(d.enemies);
  const battle = createBattle(names, enemyNames, { enemyScale: d.enemyScale || 1.0 });
  if (!battle) return;
  currentBattle = battle;
  pendingDungeon = { kind: 'dungeon', d, paidCost: false };
  showBattleScreen();
}

// 进入深渊战斗
export function startAbyssBattle(floor) {
  const names = (S.team || [null, null, null]).filter(Boolean);
  if (names.length === 0) {
    msg('编队为空，先去编队面板组队');
    return;
  }
  const info = ABYSS_FLOORS[floor - 1];
  if (!info) return;
  const enemyNames = flattenEnemies(info.enemies);
  const battle = createBattle(names, enemyNames, { enemyScale: 1.0 + floor * 0.15 });
  if (!battle) return;
  battle._abyssFloor = floor;
  currentBattle = battle;
  pendingDungeon = { kind: 'abyss', floor, info };
  showBattleScreen();
}

function showBattleScreen() {
  const div = $('battleOverlay');
  if (!div) return;
  div.style.display = 'flex';
  renderBattle();
}

function hideBattleScreen() {
  const div = $('battleOverlay');
  if (div) div.style.display = 'none';
  currentBattle = null;
  pendingDungeon = null;
}

function renderBattle() {
  const b = currentBattle;
  if (!b) return;
  const container = $('battleOverlay');
  if (!container) return;

  let html = '<div style="max-width:820px;width:100%;margin:0 auto;padding:24px;max-height:96vh;overflow-y:auto">';

  // 标题
  let titleTxt = pendingDungeon?.kind === 'abyss' ? `逆境深塔 · 第 ${pendingDungeon.floor} 层` : (pendingDungeon?.d?.name || '战斗');
  const switchTag = b.switchUsedThisTurn
    ? '<span style="color:var(--red)">切人已用</span>'
    : '<span style="color:var(--green)">可切人 1 次</span>';
  html += `<div style="text-align:center;margin-bottom:12px">
    <div style="font-size:18px;font-weight:700;letter-spacing:3px;color:var(--gold)">${titleTxt}</div>
    <div style="font-size:11px;color:var(--muted);letter-spacing:2px;margin-top:4px">回合 <b style="color:var(--text)">${b.turn}</b> · AP <b style="color:var(--gold)">${b.ap}/${b.apMax}</b> · ${switchTag} · 当前 <b style="color:var(--accent)">${b.team[b.active]?.name}</b></div>
    <div style="font-size:9px;color:var(--dim);letter-spacing:.5px;margin-top:4px;line-height:1.5">
      每回合 4 AP · 普攻 1AP · 技能 1AP/CD3 · 重击 2AP/CD1 · 解放 3AP · 切人 0AP（限 1 次）
    </div>
  </div>`;

  // 敌人
  html += '<div style="margin-bottom:14px">';
  b.enemies.filter(e => e.alive).forEach((e, ei) => {
    const hpPct = Math.max(0, e.hp / e.hpMax);
    const elemColor = ELEMENT_COLOR[e.element] || '#fff';
    const vibPct = (e.vibration ?? 100) / (e.vibrationMax || 100);
    const broken = e.vibrationBroken > 0;
    // 完整 debuff 列表
    const debuffs = (e.debuffs || []).map(d => {
      if (d.type === 'erosion') return `<span style="color:#8de6a6;font-size:10px;padding:1px 6px;border:1px solid #8de6a6;border-radius:4px;margin-right:3px">${d.element}侵蚀 +${(d.value*100).toFixed(0)}% (${d.duration}回)</span>`;
      if (d.type === 'spectro_frazzle') return `<span style="color:#fff0b0;font-size:10px;padding:1px 6px;border:1px solid #fff0b0;border-radius:4px;margin-right:3px">衍射失序 (${d.duration}回)</span>`;
      return '';
    }).join('');
    // 机制提示
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
    html += `<div style="border:1px solid var(--line);border-radius:10px;padding:11px;margin-bottom:6px;background:rgba(255,80,80,.04)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
        <span style="font-weight:600;font-size:14px">${e.name}${e.class ? ` <span style="font-size:9px;color:var(--muted);letter-spacing:1px">[${e.class}]</span>` : ''}</span>
        <span style="font-size:10px;padding:2px 8px;border:1px solid ${elemColor};color:${elemColor};border-radius:999px">${e.element}</span>
      </div>
      <div style="height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${(hpPct*100).toFixed(1)}%;background:linear-gradient(90deg,var(--red),#ffaaaa);border-radius:4px"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:4px">
        <span>${e.hp.toLocaleString()} / ${e.hpMax.toLocaleString()}</span>
        <span>${(hpPct*100).toFixed(0)}% · 本属性抗 40%</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
        <span style="font-size:9px;color:${broken ? 'var(--gold)' : 'var(--muted)'};letter-spacing:1px;min-width:50px">${broken ? `易伤 ×1.3 (${e.vibrationBroken}回合)` : '破韧'}</span>
        <div style="flex:1;height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${(vibPct*100).toFixed(1)}%;background:${broken ? 'var(--gold)' : '#aaa'};border-radius:2px"></div>
        </div>
      </div>
      ${debuffs ? `<div style="margin-top:5px">${debuffs}</div>` : ''}
      ${e.shield > 0 ? `<div style="font-size:10px;color:var(--accent);margin-top:3px">🛡 护盾 ${e.shield}</div>` : ''}
      ${mechHint}
    </div>`;
  });
  html += '</div>';

  // 我方
  const aliveTeam = b.team.filter(t => t.alive);
  html += '<div style="display:grid;grid-template-columns:repeat(' + aliveTeam.length + ',1fr);gap:6px;margin-bottom:12px">';
  b.team.forEach((t, i) => {
    if (!t.alive) return;
    const hpPct = Math.max(0, t.hp / t.hpMax);
    const enPct = t.energy / t.energyMax;
    const isActive = i === b.active;
    const elemColor = ELEMENT_COLOR[t.element] || '#fff';
    const frozen = t.frozenTurns > 0 ? '<span style="color:var(--accent);font-size:9px">❄</span>' : '';
    const burstReady = t.energy >= t.energyMax ? '⚡' : '';
    // forte 资源条
    const f = t.forte;
    const fPct = f ? (f.current / f.max) : 0;
    const fReady = f && f.ready;
    const concertoPct = ((t.concerto || 0) / 100);
    const canSwitch = !isActive && t.alive && t.frozenTurns === 0 && !b.switchUsedThisTurn;
    const swapHint = !isActive ? (b.switchUsedThisTurn ? '本回合不能再切' : (b.team[b.active]?.concerto >= 100 ? '点击切换 · 强化变奏!' : '点击切换 · 触发变奏')) : '';
    html += `<div style="border:2px solid ${isActive ? 'var(--gold)' : 'var(--line)'};border-radius:10px;padding:8px;background:${isActive ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)'};cursor:${canSwitch ? 'pointer' : 'default'};opacity:${canSwitch || isActive ? '1' : '.6'}"
      onclick="${canSwitch ? `window.__bSwitch(${i})` : ''}" title="${swapHint}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:12px;font-weight:600">${t.name}${frozen}${burstReady}${fReady ? '<span style="color:var(--gold);font-size:9px;margin-left:3px">✦</span>' : ''}</span>
        <span style="font-size:9px;color:${elemColor}">${t.element}</span>
      </div>
      <div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${(hpPct*100).toFixed(1)}%;background:var(--green)"></div>
      </div>
      <div style="font-size:9px;color:var(--muted);margin-top:2px">HP ${t.hp}/${t.hpMax}</div>
      <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:4px;overflow:hidden">
        <div style="height:100%;width:${(enPct*100).toFixed(1)}%;background:var(--accent)"></div>
      </div>
      <div style="font-size:9px;color:var(--accent);margin-top:1px">能量 ${t.energy}/${t.energyMax}</div>
      ${f ? `<div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:4px;overflow:hidden">
        <div style="height:100%;width:${(fPct*100).toFixed(1)}%;background:${fReady ? 'var(--gold)' : '#c39bff'}"></div>
      </div>
      <div style="font-size:9px;color:${fReady ? 'var(--gold)' : '#c39bff'};margin-top:1px">${f.resourceName} ${f.current}/${f.max}${fReady ? ' · 强化就绪!' : ''}</div>` : ''}
      <div style="height:2px;background:rgba(255,255,255,.06);border-radius:2px;margin-top:3px;overflow:hidden">
        <div style="height:100%;width:${(concertoPct*100).toFixed(1)}%;background:linear-gradient(90deg,#69b8ff,#c39bff)"></div>
      </div>
      <div style="font-size:8px;color:var(--muted);margin-top:1px">协奏 ${t.concerto || 0}/100${t.dodge ? ` · 闪避 ${(t.dodge*100).toFixed(0)}%` : ''}</div>
      ${renderWeaponStacks(t)}
      <div style="font-size:9px;color:${t.cd.skill > 0 ? 'var(--muted)' : 'var(--green)'};margin-top:2px">
        ${t.cd.skill > 0 ? `技能 CD ${t.cd.skill}回` : '技能就绪'}${t.cd.heavy > 0 ? ` · 重击 CD ${t.cd.heavy}回` : ''}
      </div>
    </div>`;
  });
  html += '</div>';

  // 日志
  const logs = b.log.slice(-8);
  html += '<div style="margin-bottom:12px;font-size:11px;color:var(--muted);max-height:100px;overflow-y:auto;background:rgba(0,0,0,.25);border-radius:8px;padding:8px 12px;line-height:1.6">';
  logs.forEach(l => {
    const text = formatLogLine(l);
    if (text) html += `<div>${text}</div>`;
  });
  html += '</div>';

  // 动作按钮
  if (!b.finished) {
    const cur = b.team[b.active];
    const enemyIdx = b.enemies.findIndex(e => e.alive);
    const canAtk = cur && cur.alive && cur.frozenTurns === 0 && b.ap >= 1;
    const canSkill = canAtk && cur.cd.skill === 0 && b.ap >= 1;
    const canHeavy = canAtk && cur.cd.heavy === 0 && b.ap >= 2;
    const canBurst = canAtk && cur.energy >= cur.energyMax && b.ap >= 3;

    // 技能说明面板（动作按钮上方）
    html += renderSkillPanel(cur);

    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px">';
    html += `<button class="bbtn" onclick="window.__bAtk(${enemyIdx})" ${!canAtk ? 'disabled' : ''} title="100% 攻击 · +12 能量 · 削破韧 8">⚔ 普攻<br><span style="font-size:9px;opacity:.7">1 AP</span></button>`;
    html += `<button class="bbtn" style="border-color:var(--accent);color:var(--accent)" onclick="window.__bSkill(${enemyIdx})" ${!canSkill ? 'disabled' : ''} title="180% 攻击 · CD 3 回合 · +22 能量 · 削破韧 20">✦ 技能<br><span style="font-size:9px;opacity:.7">1 AP${cur.cd.skill > 0 ? ' · CD'+cur.cd.skill : ''}</span></button>`;
    html += `<button class="bbtn" style="border-color:#ff8c5e;color:#ff8c5e" onclick="window.__bHeavy(${enemyIdx})" ${!canHeavy ? 'disabled' : ''} title="220% 攻击 · 重击伤害类型 · CD 1 回合 · +15 能量 · 削破韧 25">💢 重击<br><span style="font-size:9px;opacity:.7">2 AP${cur.cd.heavy > 0 ? ' · CD'+cur.cd.heavy : ''}</span></button>`;
    html += `<button class="bbtn" style="border-color:var(--gold);color:var(--gold);background:rgba(245,207,107,.08)" onclick="window.__bBurst()" ${!canBurst ? 'disabled' : ''} title="300% 攻击 · AOE · 需能量满 · 削破韧 30">⚡ 解放<br><span style="font-size:9px;opacity:.7">3 AP · ${cur.energy}/${cur.energyMax}</span></button>`;
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

  html += '</div>';
  container.innerHTML = html;
}

// 当前角色技能说明面板（动作按钮上方）
function renderSkillPanel(cur) {
  if (!cur) return '';
  const f = cur.forte;
  const wName = cur.weapon?.name;
  const fStatus = f && f.ready
    ? `<span style="color:var(--gold)">✦ ${f.resourceName}已就绪 · 下次${f.effectType === 'enhancedSkill' ? '技能' : f.effectType === 'enhancedBurst' ? '解放' : '普攻'}强化 ×${f.effectMult.toFixed(1)}</span>`
    : f ? `${f.resourceName} ${f.current}/${f.max}` : '';

  let html = `<div style="border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin-bottom:8px;background:rgba(245,207,107,.04);font-size:11px;line-height:1.55">
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
      <span style="font-weight:700;color:var(--gold);letter-spacing:1px">${cur.name}</span>
      <span style="font-size:10px;color:var(--muted)">${cur.element} · ${cur.type}${wName ? ' · 装备 ' + wName : ''}</span>
    </div>`;

  if (f) html += `<div style="font-size:10px;color:var(--muted);margin-bottom:3px">${fStatus}</div>
    <div style="font-size:9px;color:var(--dim);margin-bottom:3px;letter-spacing:.3px">${f.desc}</div>`;

  // 当前 buff 标签
  const buffTags = [];
  (cur.buffs || []).forEach(b => {
    if (b.type === 'burstWindow') buffTags.push(`<b style="color:var(--gold)">🔥 强化形态 +${(b.value*100).toFixed(0)}% (${b.duration})</b>`);
  });
  if (cur.concerto >= 100) buffTags.push(`<b style="color:#c39bff">协奏满，下次切人触发变奏/延奏</b>`);
  if (buffTags.length) {
    html += `<div style="margin-top:3px;font-size:10px;color:var(--accent)">▸ ${buffTags.join(' · ')}</div>`;
  }
  html += '</div>';
  return html;
}

// 渲染角色当前武器叠层标签 / buff
function renderWeaponStacks(t) {
  const stacks = t.weaponStacks || {};
  const wName = t.weapon?.name;
  const buffs = (t.buffs || []).filter(b => b.type === 'burstWindow');
  const items = [];
  Object.values(stacks).forEach(s => {
    const label = effectLabel(s.effect, s.element);
    items.push(`<span class="wstack" title="${s.duration} 回合">${label} ${s.stacks > 1 || s.maxStacks > 1 ? `×${s.stacks}/${s.maxStacks}` : ''}</span>`);
  });
  buffs.forEach(b => {
    if (b.type === 'burstWindow') items.push(`<span class="wstack" style="color:var(--gold)">强化形态 (${b.duration})</span>`);
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

// 桥接到全局
window.__bAtk = (idx) => {
  const r = doAttack(currentBattle, idx);
  if (!r.ok) msg(r.err);
  else renderBattle();
};
window.__bSkill = (idx) => {
  const r = doSkill(currentBattle, idx);
  if (!r.ok) msg(r.err);
  else renderBattle();
};
window.__bHeavy = (idx) => {
  const r = doHeavy(currentBattle, idx);
  if (!r.ok) msg(r.err);
  else renderBattle();
};
window.__bBurst = () => {
  const r = doBurst(currentBattle);
  if (!r.ok) msg(r.err);
  else renderBattle();
};
window.__bSwitch = (i) => {
  const r = doSwitch(currentBattle, i);
  if (!r.ok) msg(r.err);
  else renderBattle();
};
window.__bEndTurn = () => {
  endTurn(currentBattle);
  renderBattle();
};
window.__bClose = () => {
  hideBattleScreen();
  window.__render();
};
window.__bSettle = () => {
  const pd = pendingDungeon;
  if (!pd) { hideBattleScreen(); return; }
  if (pd.kind === 'dungeon') {
    // 扣体力
    if (!pd.paidCost) {
      spendStamina(pd.d.cost);
      pd.paidCost = true;
    }
    // 加奖励
    const drops = pd.d.drops || {};
    const rewardText = [];
    if (drops.exp_super) { S.materials.exp_super += drops.exp_super; rewardText.push(`特级共鸣促剂 ×${drops.exp_super}`); }
    if (drops.exp_high) { S.materials.exp_high += drops.exp_high; rewardText.push(`高级共鸣促剂 ×${drops.exp_high}`); }
    if (drops.exp_mid) { S.materials.exp_mid += drops.exp_mid; rewardText.push(`中级共鸣促剂 ×${drops.exp_mid}`); }
    if (drops.exp_low) { S.materials.exp_low += drops.exp_low; rewardText.push(`初级共鸣促剂 ×${drops.exp_low}`); }
    if (drops.weapon_book) { S.materials.weapon_book += drops.weapon_book; rewardText.push(`武器石 ×${drops.weapon_book}`); }
    if (drops.astrite) { S.astrite += drops.astrite; rewardText.push(`星声 +${drops.astrite}`); }
    msg('获得 ' + rewardText.join(' · '), false);
  } else if (pd.kind === 'abyss') {
    const r = settleAbyss(currentBattle);
    if (r) {
      msg(`深塔第 ${r.floor} 层 ★${r.stars} · +${r.reward} 星声`, false);
    }
  }
  hideBattleScreen();
  window.__render();
};

// 暴露给外部
window.__startDungeon = startDungeonBattle;
window.__startAbyss = startAbyssBattle;