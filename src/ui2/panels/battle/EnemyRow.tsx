// 敌人行
import { h } from 'preact';
import { ELEMENT_COLOR } from '../../../battle/elements.js';
import { collectEnemyBadges, renderBadge } from '../../../ui/battleRenderers/buffRenderers.js';
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
    <div
      onClick={() => (window as any).__bTarget?.(realIdx)}
      style={{
        border: `1px solid ${isTarget ? 'var(--red)' : 'var(--line)'}`,
        borderRadius: 10, padding: 11, marginBottom: 6,
        background: isTarget ? 'rgba(255,80,80,.10)' : 'rgba(255,80,80,.04)',
        cursor: 'pointer', transition: '.15s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          {isTarget ? '🎯 ' : ''}{displayName(enemy)}
          {enemy.class ? <span style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 1 }}> [{enemy.class}]</span> : ''}
        </span>
        <span style={{
          fontSize: 10, padding: '2px 8px',
          border: `1px solid ${elemColor}`, color: elemColor, borderRadius: 999
        }}>
          {enemy.element}
        </span>
      </div>

      {/* HP bar */}
      <div style={{ height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${(hpPct * 100).toFixed(1)}%`,
          background: 'linear-gradient(90deg,var(--red),#ffaaaa)',
          borderRadius: 4, transition: 'width .35s ease'
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
        <span>{enemy.hp.toLocaleString()} / {enemy.hpMax.toLocaleString()}</span>
        <span>{(hpPct * 100).toFixed(0)}% · 本属性抗 40%</span>
      </div>

      {/* Vibration bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 9, color: broken ? 'var(--gold)' : 'var(--muted)', letterSpacing: 1, minWidth: 50 }}>
          {broken ? `中断 ×${(1 + (enemy.suppressedVuln || 0.3)).toFixed(1)} (${enemy.suppressed}回合)` : '破韧'}
        </span>
        <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${(vibPct * 100).toFixed(1)}%`,
            background: broken ? 'var(--gold)' : '#aaa',
            borderRadius: 2, transition: 'width .3s ease'
          }} />
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: badgeHtml }} />
    </div>
  );
}
