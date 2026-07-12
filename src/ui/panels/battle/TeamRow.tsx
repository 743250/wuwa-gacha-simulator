// 我方队伍卡片
import { h } from 'preact';
import { ELEMENT_COLOR } from '../../../battle/elements.js';
import { renderCharacterBattleStatus } from '../../../battle/characters/index.js';
import { collectUnitBadges, renderBadge } from '../../../ui/battleRenderers/buffRenderers.js';
import { bSwitch } from '../../../ui/battle/battleActions.js';
import { displayName } from './helpers';

interface TeamRowProps {
  battle: any;
}

function WeaponStacks(t: any) {
  const stacks = t.weaponStacks || {};
  const items: any[] = [];
  Object.values(stacks).forEach((s: any) => {
    const label = effectLabel(s.effect, s.element);
    const extra = s.stacks > 1 || s.maxStacks > 1 ? ` ×${s.stacks}/${s.maxStacks}` : '';
    items.push(
      <span class="wstack" title={`${s.duration} 回合`}>
        {label}{extra}
      </span>
    );
  });
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {items}
    </div>
  );
}

function effectLabel(effect: string, element?: string): string {
  switch (effect) {
    case 'atk_pct': return '攻击↑';
    case 'normal_pct': return '普攻↑';
    case 'skill_pct': return '技能↑';
    case 'burst_pct': return '解放↑';
    case 'heavy_pct': return '重击↑';
    case 'elem_dmg': return `${element || '元素'}↑`;
    case 'def_pierce': return '穿防';
    case 'team_atk': return '全队攻↑';
    case 'crate': return '暴击↑';
    case 'concerto_refund': return '协奏↑';
    default: return effect;
  }
}

function SummonBlock({ s }: any) {
  const sHpPct = Math.max(0, s.hp / s.hpMax);
  return (
    <div style={{
      marginTop: 6, padding: '6px 8px', border: '1.5px dashed var(--gold)',
      borderRadius: 8, background: 'rgba(155,109,255,.06)', cursor: 'default'
    }} title="召唤物 · 不可切换 · 不可控制">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9b6dff' }}>🢀 {s.name}</span>
        <span style={{ fontSize: 9, color: 'var(--muted)' }}>召唤物 · {s.duration > 0 ? `持续 ${s.duration} 回合` : '永久'}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${(sHpPct * 100).toFixed(1)}%`,
            background: '#9b6dff', transition: 'width .35s ease'
          }} />
        </div>
        <span style={{ fontSize: 9, color: '#c39bff', whiteSpace: 'nowrap' }}>HP {s.hp}/{s.hpMax}</span>
      </div>
    </div>
  );
}

export function TeamRow({ battle }: TeamRowProps) {
  const team = battle.team;

  return (
    <div class="team-row" style={{ display: 'grid', gridTemplateColumns: `repeat(${team.length},1fr)`, gap: 6 }}>
      {team.map((t: any, i: number) => {
        if (!t.alive) {
          return (
            <div key={i} class="bf-unit dead" style={{
              border: '1px dashed var(--line)', borderRadius: 10, padding: 8,
              background: 'rgba(255,80,80,.03)', opacity: 0.45,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 80,
            }}>
              <div style={{ fontSize: 11, color: 'var(--dim)' }}>💀 {displayName(t)}</div>
              <div style={{ fontSize: 9, color: 'var(--red)', marginTop: 6, letterSpacing: 2 }}>阵 亡</div>
            </div>
          );
        }
        const hpPct = Math.max(0, t.hp / t.hpMax);
        const enPct = t.energy / t.energyMax;
        const isActive = i === battle.active;
        const elemColor = ELEMENT_COLOR[t.element] || '#fff';
        const canSwitch = !isActive && t.alive && t.frozenTurns === 0 && !battle.switchUsedThisTurn;
        const swapHint = !isActive
          ? (battle.switchUsedThisTurn ? '本回合不能再切' : (battle.team[battle.active]?.concerto >= 100 ? '点击切换 · 强化变奏!' : '点击切换 · 触发变奏'))
          : '';
        const f = t.forte;
        const fPct = f ? (f.current / f.max) : 0;
        const fReady = f && f.ready;
        const concertoPct = ((t.concerto || 0) / 100);
        // 全队 buff 只显示本角色施放的（installer === t.idx），如星域挂在守岸人头像下
    const badges = collectUnitBadges(t, battle, { includeTeamGlobal: 'installer' as any });
        const badgeHtml = badges.length ? `<div class="bf-status-row">${badges.map(renderBadge).join('')}</div>` : '';
        const summons = (battle.summons || []).filter((s: any) => s.alive && s.ownerIdx === i);

        return (
          <div
            key={i}
            class={`bf-unit ${isActive ? 'active' : ''}`}
            onClick={canSwitch ? () => bSwitch(i) : undefined}
            title={swapHint}
            style={{
              border: `2px solid ${isActive ? 'var(--gold)' : 'var(--line)'}`,
              borderRadius: 10, padding: 8,
              background: isActive ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)',
              cursor: canSwitch ? 'pointer' : 'default',
              opacity: (canSwitch || isActive) ? 1 : 0.6
            }}
          >
            {/* Name row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                {displayName(t)}
                {t.frozenTurns > 0 ? <span style={{ color: 'var(--accent)', fontSize: 9 }}>❄</span> : ''}
                {t.skillLockedTurns > 0 ? <span style={{ color: 'var(--red)', fontSize: 9 }}>🔒</span> : ''}
                {t.energy >= t.energyMax ? '⚡' : ''}
                {fReady ? <span style={{ color: 'var(--gold)', fontSize: 9, marginLeft: 3 }}>✦</span> : ''}
              </span>
              <span style={{ fontSize: 9, color: elemColor }}>{t.element}</span>
            </div>

            {/* HP bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(hpPct * 100).toFixed(1)}%`,
                  background: 'var(--green)', transition: 'width .35s ease'
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--muted)', whiteSpace: 'nowrap' }}>HP {t.hp}/{t.hpMax}</span>
            </div>

            {/* Energy bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(enPct * 100).toFixed(1)}%`,
                  background: 'var(--accent)', transition: 'width .3s ease'
                }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--accent)', whiteSpace: 'nowrap' }}>能量 {t.energy}/{t.energyMax}</span>
            </div>

            {/* Forte bar */}
            {f && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(fPct * 100).toFixed(1)}%`,
                    background: fReady ? 'var(--gold)' : '#c39bff', transition: 'width .3s ease'
                  }} />
                </div>
                <span style={{ fontSize: 9, color: fReady ? 'var(--gold)' : '#c39bff', whiteSpace: 'nowrap' }}>
                  {f.resourceName} {f.current}/{f.max}{fReady ? ' · 强化就绪!' : ''}
                </span>
              </div>
            )}

            {/* Character battle status (HTML from character modules) */}
            <div dangerouslySetInnerHTML={{ __html: renderCharacterBattleStatus(t) }} />

            {/* Concerto bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(concertoPct * 100).toFixed(1)}%`,
                  background: 'linear-gradient(90deg,#69b8ff,#c39bff)', transition: 'width .3s ease'
                }} />
              </div>
              <span style={{ fontSize: 8, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                协奏 {t.concerto || 0}/100
                {t.dodge ? ` · 闪避 ${(t.dodge * 100).toFixed(0)}%` : ''}
              </span>
            </div>

            <WeaponStacks {...t} />

            {/* CD status */}
            <div style={{ fontSize: 9, color: t.cd.skill > 0 ? 'var(--muted)' : 'var(--green)', marginTop: 2 }}>
              {t.skillLockedTurns > 0
                ? `技能封锁 ${t.skillLockedTurns}回`
                : (t.cd.skill > 0 ? `技能 CD ${t.cd.skill}回` : '技能就绪')}
              {(t.hasHeavy && t.cd.heavy > 0) ? ` · 重击 CD ${t.cd.heavy}回` : ''}
              {t._wallLocked > 0 ? ` · <span style="color:var(--accent)">⚡雷霆墙锁定</span>` : ''}
            </div>

            {/* Badge row */}
            <div dangerouslySetInnerHTML={{ __html: badgeHtml }} />

            {/* Summons */}
            {summons.map((s: any) => <SummonBlock key={s.name} s={s} />)}
          </div>
        );
      })}
    </div>
  );
}
