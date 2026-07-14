// 顶部信息条
import { h } from 'preact';
import { displayName } from './helpers';

interface HeaderProps {
  battle: any;
  pendingDungeon: any;
}

export function Header({ battle, pendingDungeon }: HeaderProps) {
  const titleTxt = pendingDungeon?.kind === 'abyss'
    ? `逆境深塔 · 第 ${pendingDungeon.floor} 层`
    : (pendingDungeon?.d?.name || '战斗');
  const subTitle = pendingDungeon?.kind === 'dungeon' && pendingDungeon.encounter
    ? `今日敌情：${pendingDungeon.encounter.tag} · ${pendingDungeon.encounter.enemies.join(' / ')}`
    : '';
  const cur = battle.team[battle.active];
  const apPct = battle.apMax > 0 ? Math.max(0, Math.min(1, battle.ap / battle.apMax)) : 0;
  const switchUsed = !!battle.switchUsedThisTurn;

  return (
    <header class="bf-header">
      <div class="bf-header-main">
        <div class="bf-title">{titleTxt}</div>
        {subTitle && <div class="bf-subtitle">{subTitle}</div>}
      </div>

      <div class="bf-hud">
        <div class="bf-hud-chip">
          <span class="bf-hud-k">回合</span>
          <span class="bf-hud-v">{battle.turn}</span>
        </div>
        <div class="bf-hud-chip bf-hud-ap">
          <span class="bf-hud-k">AP</span>
          <span class="bf-hud-v gold">{battle.ap}<span class="bf-hud-den">/{battle.apMax}</span></span>
          <span class="bf-ap-track" aria-hidden="true">
            <span class="bf-ap-fill" style={{ width: `${(apPct * 100).toFixed(0)}%` }} />
          </span>
        </div>
        <div class={`bf-hud-chip ${switchUsed ? 'is-used' : 'is-ready'}`}>
          <span class="bf-hud-k">切人</span>
          <span class="bf-hud-v">{switchUsed ? '已用' : '可用'}</span>
        </div>
        <div class="bf-hud-chip bf-hud-cur">
          <span class="bf-hud-k">当前</span>
          <span class="bf-hud-v accent">{displayName(cur)}</span>
        </div>
      </div>
    </header>
  );
}
