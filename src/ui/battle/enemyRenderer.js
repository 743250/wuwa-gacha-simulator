// 敌人区 + 动作按钮 HTML 渲染（从 battle.js 抽出）
import { ELEMENT_COLOR } from '../../battle/elements.js';
import { collectEnemyBadges, renderBadge } from '../battleRenderers/buffRenderers.js';
import { canAttack, canSkill, canHeavy, canBurst } from '../../battle/combat.js';
import { renderSkillPanelHTML } from './teamRenderer.js';

const displayName = (u) => (u && u.displayName) ? u.displayName : (u ? u.name : '');

// ===== 敌人区 HTML =====
export function renderEnemiesHTML(b) {
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
  return html;
}

// ===== 动作按钮 HTML =====
export function renderActionsHTML(b) {
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

    html += renderSkillPanelHTML(cur);
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
  return html;
}