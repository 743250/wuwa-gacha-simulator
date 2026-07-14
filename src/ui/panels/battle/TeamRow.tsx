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
  return <div class="bf-wstack-row">{items}</div>;
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
    <div class="bf-summon" title="召唤物 · 不可切换 · 不可控制">
      <div class="bf-summon-top">
        <span class="bf-summon-name">🢀 {s.name}</span>
        <span class="bf-summon-meta">{s.duration > 0 ? `${s.duration} 回` : '永久'}</span>
      </div>
      <div class="bf-bar-row compact">
        <div class="bf-bar bf-bar-summon">
          <div class="bf-bar-fill" style={{ width: `${(sHpPct * 100).toFixed(1)}%` }} />
        </div>
        <span class="bf-bar-num">HP {s.hp}/{s.hpMax}</span>
      </div>
    </div>
  );
}

export function TeamRow({ battle }: TeamRowProps) {
  const team = battle.team;

  return (
    <div class="bf-team-row" style={{ gridTemplateColumns: `repeat(${team.length}, minmax(0, 1fr))` }}>
      {team.map((t: any, i: number) => {
        if (!t.alive) {
          return (
            <div key={i} class="bf-unit dead">
              <div class="bf-unit-dead-name">💀 {displayName(t)}</div>
              <div class="bf-unit-dead-tag">阵亡</div>
            </div>
          );
        }
        const hpPct = Math.max(0, t.hp / t.hpMax);
        const enPct = t.energy / t.energyMax;
        const isActive = i === battle.active;
        const elemColor = ELEMENT_COLOR[t.element] || '#fff';
        const activeUnit = battle.team[battle.active];
        const switchLocked = !!(activeUnit as any)?.aogusitaBurstTurns;
        const canSwitch = !isActive && t.alive && t.frozenTurns === 0 && !battle.switchUsedThisTurn && !switchLocked;
        const swapHint = !isActive
          ? (switchLocked ? '俯首之刻期间不可切换'
            : (battle.switchUsedThisTurn ? '本回合不能再切' : (activeUnit?.concerto >= 100 ? '点击切换 · 强化变奏!' : '点击切换 · 触发变奏')))
          : '当前出战';
        const f = t.forte;
        const fPct = f ? (f.current / f.max) : 0;
        const fReady = f && f.ready;
        const concertoPct = ((t.concerto || 0) / 100);
        const badges = collectUnitBadges(t, battle, { includeTeamGlobal: 'installer' as any });
        const badgeHtml = badges.length ? `<div class="bf-status-row">${badges.map(renderBadge).join('')}</div>` : '';
        const summons = (battle.summons || []).filter((s: any) => s.alive && s.ownerIdx === i);
        const burstReady = t.energy >= t.energyMax;

        return (
          <div
            key={i}
            class={`bf-unit ${isActive ? 'active' : ''} ${canSwitch ? 'can-switch' : ''}`}
            onClick={canSwitch ? () => bSwitch(i) : undefined}
            title={swapHint}
            style={{ ['--elem' as any]: elemColor }}
          >
            <div class="bf-unit-top">
              <div class="bf-unit-name">
                <span class="bf-name">{displayName(t)}</span>
                {t.frozenTurns > 0 && <span class="bf-flag ice" title="冻结">❄</span>}
                {t.skillLockedTurns > 0 && <span class="bf-flag lock" title="技能封锁">🔒</span>}
                {burstReady && <span class="bf-flag burst" title="解放就绪">⚡</span>}
                {fReady && <span class="bf-flag ready" title="奏回路就绪">✦</span>}
              </div>
              <span class="bf-elem-tag sm" style={{ borderColor: elemColor, color: elemColor }}>{t.element}</span>
            </div>

            <div class="bf-bar-row">
              <div class="bf-bar bf-bar-hp">
                <div class="bf-bar-fill" style={{ width: `${(hpPct * 100).toFixed(1)}%` }} />
              </div>
              <span class="bf-bar-num">HP {t.hp}/{t.hpMax}</span>
            </div>

            <div class="bf-bar-row">
              <div class={`bf-bar bf-bar-en ${burstReady ? 'full' : ''}`}>
                <div class="bf-bar-fill" style={{ width: `${(enPct * 100).toFixed(1)}%` }} />
              </div>
              <span class="bf-bar-num en">能量 {t.energy}/{t.energyMax}</span>
            </div>

            {f && (
              <div class="bf-bar-row">
                <div class={`bf-bar bf-bar-forte ${fReady ? 'ready' : ''}`}>
                  <div class="bf-bar-fill" style={{ width: `${(fPct * 100).toFixed(1)}%` }} />
                </div>
                <span class={`bf-bar-num forte ${fReady ? 'ready' : ''}`}>
                  {f.resourceName} {f.current}/{f.max}{fReady ? ' · 就绪' : ''}
                </span>
              </div>
            )}

            <div dangerouslySetInnerHTML={{ __html: renderCharacterBattleStatus(t) }} />

            <div class="bf-bar-row compact">
              <div class="bf-bar bf-bar-concerto">
                <div class="bf-bar-fill" style={{ width: `${(concertoPct * 100).toFixed(1)}%` }} />
              </div>
              <span class="bf-bar-num dim">
                协奏 {t.concerto || 0}/100
                {t.dodge ? ` · 闪避 ${(t.dodge * 100).toFixed(0)}%` : ''}
              </span>
            </div>

            <WeaponStacks {...t} />

            <div class={`bf-cd-line ${t.cd.skill > 0 || t.skillLockedTurns > 0 ? 'cooling' : 'ready'}`}>
              {t.skillLockedTurns > 0
                ? `技能封锁 ${t.skillLockedTurns}回`
                : (t.cd.skill > 0 ? `技能 CD ${t.cd.skill}回` : '技能就绪')}
              {(t.hasHeavy && t.cd.heavy > 0) ? ` · 重击 CD ${t.cd.heavy}回` : ''}
              {t._wallLocked > 0 ? ' · 雷霆墙锁定' : ''}
            </div>

            <div dangerouslySetInnerHTML={{ __html: badgeHtml }} />

            {summons.map((s: any) => <SummonBlock key={s.name} s={s} />)}
          </div>
        );
      })}
    </div>
  );
}
