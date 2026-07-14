// 敌人行
import { h } from 'preact';
import { ELEMENT_COLOR } from '../../../battle/elements.js';
import { collectEnemyBadges, renderBadge } from '../../../ui/battleRenderers/buffRenderers.js';
import { bTarget } from '../../../ui/battle/battleActions.js';
import { displayName } from './helpers';

interface EnemyRowProps {
  enemy: any;
  realIdx: number;
  isTarget: boolean;
  battle: any;
}

export function EnemyRow({ enemy, realIdx, isTarget, battle }: EnemyRowProps) {
  if (!enemy.alive) return null;
  const hpPct = Math.max(0, enemy.hp / enemy.hpMax);
  const elemColor = ELEMENT_COLOR[enemy.element] || '#fff';
  const vibPct = (enemy.vibration ?? 100) / (enemy.vibrationMax || 100);
  const broken = enemy.suppressed > 0;
  const enemyBadges = collectEnemyBadges(enemy, battle);
  const badgeHtml = enemyBadges.length
    ? `<div class="bf-status-row">${enemyBadges.map(renderBadge).join('')}</div>`
    : '';

  return (
    <button
      type="button"
      class={`bf-enemy ${isTarget ? 'is-target' : ''}`}
      onClick={() => bTarget(realIdx)}
    >
      <div class="bf-enemy-top">
        <div class="bf-enemy-name">
          {isTarget && <span class="bf-target-mark">目标</span>}
          <span class="bf-name">{displayName(enemy)}</span>
          {enemy.class ? <span class="bf-enemy-class">{enemy.class}</span> : null}
        </div>
        <span class="bf-elem-tag" style={{ borderColor: elemColor, color: elemColor }}>
          {enemy.element}
        </span>
      </div>

      <div class="bf-bar bf-bar-hp enemy">
        <div class="bf-bar-fill" style={{ width: `${(hpPct * 100).toFixed(1)}%` }} />
      </div>
      <div class="bf-bar-meta">
        <span>{enemy.hp.toLocaleString()} / {enemy.hpMax.toLocaleString()}</span>
        <span>{(hpPct * 100).toFixed(0)}%</span>
      </div>

      <div class="bf-bar-row">
        <span class={`bf-bar-label ${broken ? 'broken' : ''}`}>
          {broken
            ? `中断 ×${(1 + (enemy.suppressedVuln || 0.3)).toFixed(1)} · ${enemy.suppressed}回`
            : '破韧'}
        </span>
        <div class={`bf-bar bf-bar-vib ${broken ? 'broken' : ''}`}>
          <div class="bf-bar-fill" style={{ width: `${(vibPct * 100).toFixed(1)}%` }} />
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: badgeHtml }} />
    </button>
  );
}
