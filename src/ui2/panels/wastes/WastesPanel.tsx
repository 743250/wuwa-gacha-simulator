// 冥歌海墟面板 · Preact · Stage 3.4

import { h } from 'preact';
import { useS } from '../../signals';
import {
  WASTES_STAGES, WASTES_TOKENS, SCORE_TIERS,
  getWastesStars, getWastesMaxScore, getPickedTokens,
  nextWastesResetDate, resetWastesIfNeeded,
} from '../../../daily/wastes.js';
import { parseEnemyStr } from '../../../battle/dungeon.js';
import { getCombatTeamNames } from '../../../battle/combat.js';
import { ENEMIES } from '../../../battle/enemies.js';
import { ELEMENT_COLOR } from '../../../battle/elements.js';
import { activePhase } from '../../../gacha/core.js';
import { startWastesWithTokens } from '../../../ui/wastes.js';

// ---------- helpers ----------

function EnemyNames({ enemyStrs }: { enemyStrs: string[] }) {
  const parts = enemyStrs.map((s, i) => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    if (!e) {
      return (
        <span key={i}>
          {p.name}{p.count > 1 ? <span style={{ color: 'var(--muted)' }}>×{p.count}</span> : ''}
        </span>
      );
    }
    const ec = ELEMENT_COLOR[(e as any).element] || '#fff';
    return (
      <span key={i}>
        <span style={{ color: ec }}>{p.name}</span>
        {p.count > 1 ? <span style={{ color: 'var(--muted)' }}>×{p.count}</span> : ''}
      </span>
    );
  });
  // interleave separator
  const result: any[] = [];
  parts.forEach((part, i) => {
    if (i > 0) result.push(<span key={`sep-${i}`}> · </span>);
    result.push(part);
  });
  return <>{result}</>;
}

function TokenLabel({ picked, stageId }: { picked: string[]; stageId: string }) {
  if (picked.length === 0) {
    return <div style={{ color: 'var(--dim)' }}>📿 未选信物（开战前可选）</div>;
  }
  return (
    <div>
      📿 <span style={{ color: 'var(--dim)' }}>信物：</span>
      {picked.map((id, i) => {
        const t = WASTES_TOKENS.find(x => x.id === id);
        return <span key={id}>{i > 0 ? ' · ' : ''}{t ? `${t.icon} ${t.name}` : id}</span>;
      })}
    </div>
  );
}

// ---------- main panel ----------

export function WastesPanel() {
  const S = useS() as any;
  resetWastesIfNeeded();

  const teamCount = getCombatTeamNames().length;
  const scores: Record<string, number> = getWastesStars();
  const cumulative = getWastesMaxScore();
  const v = ((activePhase() as any)[0] || {}).v || '未知';
  const pickedAll: Record<string, string[]> = getPickedTokens();

  // reset countdown
  const resetDate = nextWastesResetDate();
  let resetLine: any = null;
  if (resetDate) {
    const daysLeft = Math.max(0, Math.ceil((resetDate - S.today) / 86400000));
    const dateStr = new Date(resetDate).toISOString().slice(0, 10);
    resetLine = (
      <div style={{ fontSize: 10, color: 'var(--gold)', marginTop: 3 }}>
        ⏳ 海墟下次重置：{dateStr}{daysLeft > 0 ? `（剩余 ${daysLeft} 天）` : '（即将重置）'}
      </div>
    );
  }

  return (
    <div>
      {/* header */}
      <div style={{
        textAlign: 'center', marginBottom: 14, padding: 12,
        border: '1px solid rgba(195,155,255,.3)', borderRadius: 10,
        background: 'linear-gradient(135deg,rgba(195,155,255,.06),rgba(141,230,166,.03))',
      }}>
        <div style={{ fontSize: 15, letterSpacing: 4, color: '#c39bff', fontWeight: 700 }}>
          冥 歌 海 墟
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, lineHeight: 1.7 }}>
          🔥 焚潮：每 3 回合触发 · 全场 +30% 伤害 2 回合 · 选「焚潮之印」可加速
        </div>
        <div style={{ marginTop: 6, fontSize: 12 }}>
          <span style={{ color: '#c39bff' }}>
            累计积分 <b style={{ fontSize: 16 }}>{cumulative.toLocaleString()}</b>
          </span>
          <span style={{ color: 'var(--muted)', marginLeft: 8 }}>版本 {v} · 不消耗波片 · 档位领星声</span>
        </div>
        {resetLine}
      </div>

      {/* score tiers */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {SCORE_TIERS.map(tier => {
          const reached = cumulative >= tier.score;
          const claimed = S.wastes?.tiersClaimed?.includes(tier.score);
          const borderColor = claimed ? 'var(--green)' : reached ? 'var(--gold)' : 'var(--line)';
          const bg = claimed
            ? 'rgba(141,230,166,.08)'
            : reached
            ? 'rgba(245,207,107,.06)'
            : 'rgba(255,255,255,.02)';
          return (
            <div key={tier.score} style={{
              flex: 1, border: `1px solid ${borderColor}`, borderRadius: 8, padding: 8,
              textAlign: 'center', background: bg, fontSize: 10,
            }}>
              <div style={{ color: reached ? 'var(--gold)' : 'var(--dim)', fontWeight: 700 }}>
                {tier.name}
              </div>
              <div style={{ color: 'var(--muted)', marginTop: 2 }}>
                {tier.score.toLocaleString()} 分
              </div>
              <div style={{ color: claimed ? 'var(--green)' : 'var(--gold)', fontWeight: 700, marginTop: 2 }}>
                {claimed ? '✓ 已领' : '🎁 ' + tier.reward + ' 星声'}
              </div>
            </div>
          );
        })}
      </div>

      {/* empty team warning */}
      {teamCount === 0 && (
        <div style={{
          color: 'var(--red)', textAlign: 'center', padding: 10, fontSize: 12,
          border: '1px dashed var(--red)', borderRadius: 8, marginBottom: 12,
        }}>
          ⚠ 编队为空或队员已失效，先去【编队】面板组队
        </div>
      )}

      {/* stages */}
      {WASTES_STAGES.map((s: any, i: number) => {
        const score = scores[s.id] || 0;
        const isLocked = i > 0 && (scores[WASTES_STAGES[i - 1].id] || 0) === 0;
        const maxScore = s.baseScore + 500 + 300;
        const picked = pickedAll[s.id] || [];

        const borderColor = score > 0 ? 'rgba(195,155,255,.5)' : 'var(--line)';
        const bg = score > 0 ? 'rgba(195,155,255,.05)' : 'rgba(255,255,255,.02)';
        const bottomBorder = score > 0 ? `2px solid rgba(195,155,255,.5)` : '2px solid var(--line)';

        return (
          <div key={s.id} style={{
            border: `1px solid ${borderColor}`, borderRadius: 10,
            padding: '11px 13px', marginBottom: 6,
            background: bg, opacity: isLocked ? 0.4 : 1,
            borderBottom: bottomBorder,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', gap: 10, marginBottom: 6,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline',
                  gap: 8, flexWrap: 'wrap',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{s.desc}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 3 }}>
                  得分 <b>{score.toLocaleString()}</b> / {maxScore.toLocaleString()} · 基础 {s.baseScore} + 回合 + 血量
                </div>
              </div>
              <button
                class="mbtn gold"
                disabled={isLocked || teamCount === 0}
                onClick={() => startWastesWithTokens(s.id)}
              >
                {isLocked ? '🔒 锁定' : (score > 0 ? '刷 分' : '挑 战')}
              </button>
            </div>
            <div style={{
              fontSize: 11, color: 'var(--muted)', lineHeight: 1.6,
              borderTop: '1px dashed var(--line)', paddingTop: 5,
            }}>
              <div>⚔ <span style={{ color: 'var(--dim)' }}>敌人：</span>
                <EnemyNames enemyStrs={s.enemies} />
                <span> · 敌强 ×{s.enemyScale.toFixed(1)}</span>
              </div>
              <div><TokenLabel picked={picked} stageId={s.id} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
