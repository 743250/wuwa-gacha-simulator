// 我方队伍 / 技能面板 / 武器叠层 — 纯渲染函数
// 从 battle.js 拆出，入参即状态，不依赖 module-level 变量
import { ELEMENT_COLOR } from '../../battle/elements.js';
import { renderCharacterBattleStatus } from '../../battle/characters/index.js';
import { collectUnitBadges, renderBadge } from '../battleRenderers/buffRenderers.js';

const displayName = (u) => (u && u.displayName) ? u.displayName : (u ? u.name : '');

// ===== 我方区 =====
export function renderTeamHTML(b) {
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
      ${renderWeaponStacksHTML(t)}
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
  return html;
}

// ===== 当前角色技能说明面板（动作按钮上方）=====
export function renderSkillPanelHTML(cur) {
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

// ===== 渲染角色当前武器叠层标签 =====
export function renderWeaponStacksHTML(t) {
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
