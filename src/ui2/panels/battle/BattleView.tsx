// 战斗全屏 UI 主入口
import { h } from 'preact';
import { currentBattleSignal, battleVisibleSignal, pendingDungeonSignal, battleVersionSignal } from './battleSignals';
import { Header } from './Header';
import { BuffStripe } from './BuffStripe';
import { EnemyRow } from './EnemyRow';
import { TeamRow } from './TeamRow';
import { LogView } from './LogView';
import { ActionBar } from './ActionBar';
import { ToastStack } from './ToastStack';

export function BattleView() {
  // 订阅 version signal 确保 mutable battle 变化时重渲染
  void battleVersionSignal.value;
  const visible = battleVisibleSignal.value;
  const battle = currentBattleSignal.value;
  const pendingDungeon = pendingDungeonSignal.value;

  if (!visible || !battle) return null;

  const enemies = battle.enemies || [];

  return (
    <div class="battle-root" style={{ position: 'relative' }}>
      <ToastStack />
      <Header battle={battle} pendingDungeon={pendingDungeon} />
      <BuffStripe battle={battle} />

      {/* Enemy rows */}
      <div style={{ marginBottom: 14 }}>
        {enemies.map((e: any, idx: number) => (
          <EnemyRow
            key={idx}
            enemy={e}
            realIdx={idx}
            isTarget={battle.targetIdx === idx}
            battle={battle}
          />
        ))}
        {enemies.filter((e: any) => e.alive).length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: 8 }}>
            没有活着的敌人
          </div>
        )}
      </div>

      {/* Team */}
      <div style={{ marginBottom: 12 }}>
        <TeamRow battle={battle} />
      </div>

      {/* Log */}
      <LogView logs={battle.log || []} />

      {/* Actions */}
      <ActionBar battle={battle} pendingDungeon={pendingDungeon} />
    </div>
  );
}
