// 动作按钮 + 技能面板
import { h } from 'preact';
import { canAttack, canSkill, canHeavy, canBurst } from '../../../battle/combat.js';
import { renderCharacterBattleStatus } from '../../../battle/characters/index.js';
import { displayName } from './helpers';

interface ActionBarProps {
  battle: any;
  pendingDungeon: any;
}

function SkillPanel({ cur }: { cur: any }) {
  if (!cur) return null;
  const f = cur.forte;
  const wName = cur.weapon?.name;
  const fStatus = (() => {
    if (!f) return '';
    if (!f.ready) return `${f.resourceName} ${f.current}/${f.max}`;
    if (f.effectType === 'shorekeeperField') {
      return <span style={{ color: 'var(--gold)' }}>✦ {f.resourceName}已就绪 · 解放可展开星域</span>;
    }
    const actionName = f.effectType === 'enhancedSkill' ? '技能'
      : f.effectType === 'enhancedBurst' ? '解放' : '普攻';
    const multText = Number.isFinite(f.effectMult) ? ` ×${f.effectMult.toFixed(1)}` : '';
    return <span style={{ color: 'var(--gold)' }}>✦ {f.resourceName}已就绪 · 下次{actionName}强化{multText}</span>;
  })();

  return (
    <div style={{
      border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px',
      marginBottom: 8, background: 'rgba(245,207,107,.04)', fontSize: 11, lineHeight: 1.55
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, color: 'var(--gold)', letterSpacing: 1 }}>{displayName(cur)}</span>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
          {cur.element} · {cur.type}{wName ? ' · 装备 ' + wName : ''}
        </span>
      </div>
      {f && (
        <>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{fStatus}</div>
          <div style={{ fontSize: 9, color: 'var(--dim)', marginBottom: 3, letterSpacing: 0.3 }}>{f.desc}</div>
        </>
      )}
    </div>
  );
}

export function ActionBar({ battle, pendingDungeon }: ActionBarProps) {
  if (battle.finished) {
    if (battle.result === 'win') {
      return (
        <div style={{
          marginTop: 12, textAlign: 'center', padding: 16,
          border: '1px solid var(--green)', borderRadius: 10,
          background: 'rgba(141,230,166,.06)'
        }}>
          <div style={{ fontSize: 22, color: 'var(--green)', fontWeight: 700, letterSpacing: 4 }}>
            胜 利！
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', margin: '6px 0' }}>
            用 {battle.turn} 回合通关
          </div>
          <button
            style={{
              padding: '11px 28px', marginTop: 8, background: 'var(--gold)',
              color: '#1a1208', border: 'none', borderRadius: 8,
              fontWeight: 700, letterSpacing: 3, cursor: 'pointer'
            }}
            onClick={() => (window as any).__bSettle?.()}
          >
            领 取 奖 励
          </button>
        </div>
      );
    }
    return (
      <div style={{
        marginTop: 12, textAlign: 'center', padding: 16,
        border: '1px solid var(--red)', borderRadius: 10,
        background: 'rgba(255,133,133,.04)'
      }}>
        <div style={{ fontSize: 22, color: 'var(--red)', fontWeight: 700, letterSpacing: 4 }}>
          战 斗 失 败
        </div>
        <button
          style={{
            padding: '11px 28px', marginTop: 8, background: 'rgba(255,255,255,.06)',
            color: 'var(--text)', border: '1px solid var(--line)',
            borderRadius: 8, letterSpacing: 3, cursor: 'pointer'
          }}
          onClick={() => (window as any).__bClose?.()}
        >
          关 闭
        </button>
      </div>
    );
  }

  const cur = battle.team[battle.active];
  if (!cur) return null;

  // Resolve target
  if (battle.targetIdx == null || !battle.enemies[battle.targetIdx]?.alive) {
    battle.targetIdx = battle.enemies.findIndex((e: any) => e.alive);
  }
  const enemyIdx = battle.targetIdx;
  const hasTarget = enemyIdx >= 0;
  const canAtk = canAttack(cur, battle, enemyIdx).ok;
  const canSkillOk = canSkill(cur, battle, enemyIdx).ok;
  const canHeavyOk = canHeavy(cur, battle, enemyIdx).ok;
  const canBurstOk = canBurst(cur, battle).ok;
  const showHeavy = !!cur.hasHeavy;
  const cols = showHeavy ? 4 : 3;

  const isFurolo = cur.name === '弗洛洛';
  const furoloBurstReady = isFurolo && !!cur.furoloDirge;
  const hasDebris = battle.enemies.some((e: any) => e.alive && e._debrisReady);

  const blocker = (() => {
    if (cur && !cur.alive) return '当前角色已倒下，请切换队员';
    if (cur && cur.frozenTurns > 0) return `${displayName(cur)} 被冻结（剩余 ${cur.frozenTurns} 回合），请切换队员或结束回合`;
    if (cur && cur.skillLockedTurns > 0) return `${displayName(cur)} 技能被封锁（剩余 ${cur.skillLockedTurns} 回合）`;
    if (!hasTarget) return '当前没有活着的敌人';
    if (battle.ap <= 0) return `AP 已耗尽（0/${battle.apMax}），请点击「结束回合」`;
    return '';
  })();

  const litStyle = (can: boolean, color: string): any => can
    ? { borderColor: color, color, background: color === 'var(--gold)' ? 'rgba(245,207,107,.08)' : undefined }
    : { borderColor: 'var(--line)', color: 'var(--dim)', background: 'rgba(255,255,255,.02)', opacity: 0.4, cursor: 'not-allowed' };

  const burstSub = isFurolo
    ? (furoloBurstReady ? '定音 · 可解放' : '需定音')
    : `3 AP · ${cur.energy}/${cur.energyMax}`;

  const burstHint = isFurolo
    ? '弗洛洛 · 0 AP · 需定音状态 · 进入指挥状态 + 赫卡忒召唤'
    : '主目标 400% · 副目标 200% · AOE · 需能量满 · 削破韧 30';

  return (
    <>
      <SkillPanel cur={cur} />

      {blocker && (
        <div style={{
          marginBottom: 8, padding: '8px 12px', borderRadius: 8,
          background: 'rgba(255,133,133,.08)', borderLeft: '3px solid var(--red)',
          color: '#ffaaaa', fontSize: 11, letterSpacing: 0.5
        }}>
          ⚠ {blocker}
        </div>
      )}

      {/* Action buttons grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 6, marginBottom: 8 }}>
        <button class="bbtn"
          style={litStyle(canAtk, 'var(--text)')}
          onClick={() => (window as any).__bAtk?.(enemyIdx)}
          disabled={!canAtk}
          title="100% 攻击 · +12 能量 · 削破韧 8"
        >
          ⚔ 普攻<br /><span style={{ fontSize: 9, opacity: 0.7 }}>1 AP</span>
        </button>

        <button class="bbtn"
          style={litStyle(canSkillOk, 'var(--accent)')}
          onClick={() => (window as any).__bSkill?.(enemyIdx)}
          disabled={!canSkillOk}
          title="180% 攻击 · CD 3 回合 · +22 能量 · 削破韧 20"
        >
          ✦ 技能<br /><span style={{ fontSize: 9, opacity: 0.7 }}>1 AP{cur.cd.skill > 0 ? ' · CD' + cur.cd.skill : ''}</span>
        </button>

        {showHeavy && (
          <button class="bbtn"
            style={litStyle(canHeavyOk, '#ff8c5e')}
            onClick={() => (window as any).__bHeavy?.(enemyIdx)}
            disabled={!canHeavyOk}
            title="220% 攻击 · 重击伤害类型 · CD 1 回合 · +15 能量 · 削破韧 25"
          >
            💢 重击<br /><span style={{ fontSize: 9, opacity: 0.7 }}>2 AP{cur.cd.heavy > 0 ? ' · CD' + cur.cd.heavy : ''}</span>
          </button>
        )}

        <button class="bbtn"
          style={litStyle(canBurstOk, 'var(--gold)')}
          onClick={() => (window as any).__bBurst?.()}
          disabled={!canBurstOk}
          title={burstHint}
        >
          ⚡ 解放<br /><span style={{ fontSize: 9, opacity: 0.7 }}>{burstSub}</span>
        </button>
      </div>

      {/* Debris throw button */}
      {hasDebris && (
        <button
          style={{
            width: '100%', padding: 11, marginBottom: 6,
            background: 'rgba(245,207,107,.12)', border: '1px solid var(--gold)',
            borderRadius: 8, color: 'var(--gold)', fontSize: 12,
            letterSpacing: 2, cursor: 'pointer'
          }}
          onClick={() => (window as any).__bDebris?.()}
        >
          ⚙ 投掷残骸（0 AP · 眩晕 BOSS 1 回合）
        </button>
      )}

      {/* End turn */}
      <button
        style={{
          width: '100%', padding: 11,
          background: 'linear-gradient(180deg,#1a2436,#0e1626)',
          border: '1px solid var(--line2)', borderRadius: 8,
          color: 'var(--text)', fontSize: 12, letterSpacing: 3
        }}
        onClick={() => (window as any).__bEndTurn?.()}
      >
        结 束 回 合
      </button>
    </>
  );
}
