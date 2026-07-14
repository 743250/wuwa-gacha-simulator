// 战斗全屏 UI 主入口
import { h } from 'preact';
import { currentBattleSignal, battleVisibleSignal, pendingDungeonSignal, battleVersionSignal } from '../../../battle/battleSignals.js';
import { Header } from './Header';
import { BuffStripe } from './BuffStripe';
import { EnemyRow } from './EnemyRow';
import { TeamRow } from './TeamRow';
import { LogView } from './LogView';
import { ActionBar } from './ActionBar';
import { ToastStack } from './ToastStack';

export function BattleView() {
  void battleVersionSignal.value;
  const visible = battleVisibleSignal.value;
  const battle = currentBattleSignal.value;
  const pendingDungeon = pendingDungeonSignal.value;

  if (!visible || !battle) return null;

  const enemies = battle.enemies || [];
  const aliveEnemies = enemies.filter((e: any) => e.alive);

  return (
    <div class="battle-root">
      <ToastStack />
      <div class="bf-stage">
        <Header battle={battle} pendingDungeon={pendingDungeon} />
        <BuffStripe battle={battle} />

        <section class="bf-section bf-section-enemy">
          <div class="bf-section-label">敌方</div>
          <div class="bf-enemy-list">
            {enemies.map((e: any, idx: number) => (
              <EnemyRow
                key={idx}
                enemy={e}
                realIdx={idx}
                isTarget={battle.targetIdx === idx}
                battle={battle}
              />
            ))}
            {aliveEnemies.length === 0 && (
              <div class="bf-empty">没有活着的敌人</div>
            )}
          </div>
        </section>

        <section class="bf-section bf-section-team">
          <div class="bf-section-label">我方</div>
          <TeamRow battle={battle} />
        </section>

        <section class="bf-section bf-section-log">
          <LogView logs={battle.log || []} />
        </section>

        <section class="bf-section bf-section-actions">
          <ActionBar battle={battle} pendingDungeon={pendingDungeon} />
        </section>
      </div>
    </div>
  );
}
