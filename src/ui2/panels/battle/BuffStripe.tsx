// 顶部 buff 横条
import { h } from 'preact';
import { collectUnitBadges, collectEnemyBadges } from '../../../ui/battleRenderers/buffRenderers.js';
import { displayName } from './helpers';

interface BuffStripeProps {
  battle: any;
}

// Track new buffs across renders using a module level Set keyed by battle turn
// (mirrors the old _lastBuffSnapshot behavior)
let lastBuffKeys: Set<string> = new Set();
let lastTurnForBuff = -1;

export function renderBuffStripeItems(battle: any): Array<{ key: string; html: string; isNew: boolean }> {
  const items: Array<{ key: string; label: string; cls: string; icon: string; dur: number | null; tip: string }> = [];

  battle.team.forEach((t: any) => {
    if (!t.alive) return;
    const badges = collectUnitBadges(t, battle, { includeTeamGlobal: true });
    badges.forEach((bd: any) => {
      items.push({ ...bd, key: bd.key, label: `${displayName(t)} ${bd.label}` });
    });
  });

  battle.enemies.forEach((e: any) => {
    if (!e.alive) return;
    const badges = collectEnemyBadges(e, battle);
    badges.forEach((bd: any) => {
      items.push({ ...bd, key: bd.key, label: `${displayName(e)} ${bd.label}` });
    });
  });

  // Reset snapshot cache when turn changes
  if (battle.turn !== lastTurnForBuff) {
    lastBuffKeys = new Set();
    lastTurnForBuff = battle.turn;
  }

  const out = items.map(it => {
    const isNew = !lastBuffKeys.has(it.key);
    const tipEsc = String(it.tip || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const durHtml = it.dur != null ? `<span class="bf-dur">${it.dur}</span>` : '';
    return {
      key: it.key,
      isNew,
      html: `<span class="tip-term bf-buff ${it.cls}${isNew ? ' flash' : ''}" data-tip="${tipEsc}">${it.icon} ${it.label}${durHtml}</span>`
    };
  });

  lastBuffKeys = new Set(items.map(i => i.key));
  return out;
}

export function BuffStripe({ battle }: BuffStripeProps) {
  const items = renderBuffStripeItems(battle);

  if (items.length === 0) {
    return (
      <div class="bf-buff-stripe empty" style={{ marginBottom: 0 }}>
        — 无状态 / 增益 —
      </div>
    );
  }

  return (
    <div class="bf-buff-stripe" style={{ marginBottom: 0 }}
      dangerouslySetInnerHTML={{
        __html: items.map(i => i.html).join('')
      }}
    />
  );
}
