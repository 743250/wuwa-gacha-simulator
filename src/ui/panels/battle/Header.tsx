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
  const switchTag = battle.switchUsedThisTurn
    ? <span style={{ color: 'var(--red)' }}>切人已用</span>
    : <span style={{ color: 'var(--green)' }}>可切人 1 次</span>;
  const heavyHint = cur?.hasHeavy ? ' · 重击 2AP/CD1' : '';

  return (
    <div style={{ textAlign: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3, color: 'var(--gold)' }}>{titleTxt}</div>
      {subTitle && <div style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: 1, marginTop: 4 }}>{subTitle}</div>}
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 2, marginTop: 4 }}>
        回合 <b style={{ color: 'var(--text)' }}>{battle.turn}</b>
        {' · '}AP <b style={{ color: 'var(--gold)' }}>{battle.ap}/{battle.apMax}</b>
        {' · '}{switchTag}
        {' · '}当前 <b style={{ color: 'var(--accent)' }}>{displayName(cur)}</b>
      </div>
      <div style={{ fontSize: 9, color: 'var(--dim)', letterSpacing: 0.5, marginTop: 4, lineHeight: 1.5 }}>
        每回合 4 AP · 普攻 1AP · 技能 1AP/CD3{heavyHint} · 解放 3AP · 切人 0AP（限 1 次）
      </div>
    </div>
  );
}
