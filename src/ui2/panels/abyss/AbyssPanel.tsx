// 深塔面板 · Preact 迁移
//
// 三塔分区 + 12 层 + 28 天周期 + 活力系统（Stage 3.3）
// 只搬 UI，不碰业务逻辑。按钮 onClick 继续走 window.__。

import { h, ComponentChild } from 'preact';
import { useState } from 'preact/hooks';
import { useS } from '../../signals';
import { fmt, DAY } from '../../../state';
import { ABYSS_ZONES, STAR_CRITERIA, getAbyssStars, nextHazardResetDate, getAbyssVersionInfo, getAbyssFloorScale, getCurrentAbyssEnvironment, HAZARD_TOWERS, VIGOR_MAX, getTeamVigor, canChallengeFloor } from '../../../daily/abyss';
import { parseEnemyStr } from '../../../battle/dungeon';
import { getCombatTeamNames } from '../../../battle/combat';
import { ENEMIES } from '../../../battle/enemies';
import { ELEMENT_COLOR } from '../../../battle/elements';

// ===== helpers =====

function enemySpans(enemyStrs: string[]): ComponentChild[] {
  const parts: ComponentChild[] = [];
  enemyStrs.forEach((s, i) => {
    const p = parseEnemyStr(s);
    const e = ENEMIES[p.name];
    const ec = e ? (ELEMENT_COLOR[e.element] || '#fff') : '#fff';
    if (i > 0) parts.push(<span style={{ color: 'var(--muted)', margin: '0 2px' }}> · </span>);
    parts.push(
      <span style={{ color: ec }}>
        {p.name}
        {p.count > 1 && <span style={{ color: 'var(--muted)' }}>×{p.count}</span>}
      </span>
    );
  });
  return parts;
}

// ===== sub-components =====

function FloorCard({ f, opts, today }: any) {
  const stars = getAbyssStars();
  const earned = stars[f.id] || 0;
  const isLocked = opts.lockable && opts.prevId && (stars[opts.prevId] || 0) === 0;
  const isCleared = earned >= 3;
  const isOneShotDone = f.oneShot && earned > 0;
  const isFullStarDone = !f.oneShot && earned >= 3;
  const isDone = isOneShotDone || isFullStarDone;
  const starHtml = '★'.repeat(earned) + '☆'.repeat(3 - earned);
  const teamCount = getCombatTeamNames().length;
  const scale = getAbyssFloorScale(f, today);

  let canChallenge = teamCount > 0 && !isLocked && !isDone;
  let vigorInfo: ComponentChild = '';
  if (f.zone === 'hazard' && !isDone && !isLocked && teamCount > 0) {
    const check = canChallengeFloor(f);
    if (!check.ok) {
      canChallenge = false;
      vigorInfo = <span style={{ color: 'var(--red)', fontSize: 11 }}>⚠ {check.reason}</span>;
    } else {
      const tv = getTeamVigor();
      vigorInfo = (
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>
          活力 {tv.map((t: any) => `${t.name} ${t.vigor}/${VIGOR_MAX}`).join(' · ')}
        </span>
      );
    }
  }

  const scaleLine = f.zone === 'hazard'
    ? `水温 HP ×${scale.hp.toFixed(2)} / 攻 ×${scale.atk.toFixed(2)} / 防 ×${scale.def.toFixed(2)}${f.towerScale ? ' · 塔倍率 ×' + f.towerScale.toFixed(2) : ''}`
    : `敌方强度 ×${scale.hp.toFixed(2)}`;

  const btnText = isDone
    ? (isOneShotDone ? '已通关' : '已满星')
    : (isLocked ? '🔒 锁定' : (earned > 0 ? '补 星' : '挑 战'));

  return (
    <div style={{
      border: '1px solid ' + (isCleared ? 'rgba(245,207,107,.5)' : 'var(--line)'),
      borderRadius: 10, padding: '11px 13px', marginBottom: 6,
      background: isCleared ? 'rgba(245,207,107,.05)' : 'rgba(255,255,255,.02)',
      opacity: isLocked ? 0.4 : 1,
      borderBottom: '2px solid ' + (isCleared ? 'rgba(245,207,107,.5)' : 'var(--line)'),
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{f.name}</span>
            {f.oneShot && (
              isOneShotDone
                ? <span style={{ fontSize: 12, color: 'var(--green)', marginLeft: 6 }}>已通关</span>
                : <span style={{ fontSize: 12, color: 'var(--accent)', marginLeft: 6 }}>首通领奖</span>
            )}
            <span style={{ fontSize: 12, color: 'var(--gold)' }}>{starHtml}</span>
          </div>
          {vigorInfo && <div style={{ marginTop: 3 }}>{vigorInfo}</div>}
        </div>
        <button class={isDone ? 'mbtn' : 'mbtn gold'}
          disabled={isDone || !canChallenge}
          onClick={() => (window as any).__startAbyss?.(f.id)}>
          {btnText}
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px dashed var(--line)', paddingTop: 5 }}>
        <div>⚔ <span style={{ color: 'var(--dim)' }}>敌人：</span>{enemySpans(f.enemies)}</div>
        <div style={{ marginTop: 2, color: f.zone === 'hazard' ? 'var(--accent)' : 'var(--muted)' }}>
          🌡 <span style={{ color: 'var(--dim)' }}>强度：</span>{scaleLine}
        </div>
        <div style={{ marginTop: 2 }}>
          🎁 <span style={{ color: 'var(--dim)' }}>{f.oneShot ? '首通奖励：' : '满星奖励：'}</span>
          <span style={{ color: 'var(--gold)' }}>{f.baseReward} 星声</span>
          {!f.oneShot && (
            <> · <span style={{ color: 'var(--muted)' }}>补星只发新增差额</span> · <span style={{ color: 'var(--gold)' }}>★3 额外：特级促剂×2 + 武器石×4</span></>
          )}
        </div>
      </div>
    </div>
  );
}

function HazardTowersBlock({ today }: { today: number }) {
  const teamCount = getCombatTeamNames().length;
  const tv = teamCount > 0 ? getTeamVigor() : [];

  return (
    <>
      {tv.length > 0 && (
        <div style={{ marginBottom: 10, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, background: 'rgba(255,255,255,.02)', fontSize: 11, color: 'var(--muted)', letterSpacing: 0.5 }}>
          ⚡ 当前编队活力：{tv.map((t: any) => {
            const pct = t.vigor / VIGOR_MAX;
            const c = pct >= 0.7 ? 'var(--green)' : pct >= 0.3 ? 'var(--gold)' : 'var(--red)';
            return <span style={{ color: c }}>{t.name} <b>{t.vigor}/{VIGOR_MAX}</b></span>;
          }).reduce((acc: any[], el: any, i: number) => {
            if (i > 0) acc.push(<span> · </span>);
            acc.push(el);
            return acc;
          }, [])}
          <span style={{ color: 'var(--dim)' }}>（第 N 层消耗 N 点 · 单塔通刷需 10 点/角色 · 失败不扣 · 三塔满星需 3 队）</span>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {HAZARD_TOWERS.map(tower => {
          const stars = getAbyssStars();
          const totalStars = tower.floors.reduce((a: number, f: any) => a + (stars[f.id] || 0), 0);
          const maxStars = tower.floors.length * 3;
          const allCleared = totalStars >= maxStars;
          const totalReward = tower.floors.reduce((a: number, f: any) => a + f.baseReward, 0);

          return (
            <div key={tower.key} style={{
              border: '1px solid ' + (allCleared ? 'rgba(245,207,107,.35)' : 'var(--line)'),
              borderRadius: 10, padding: '9px 10px',
              background: allCleared ? 'rgba(245,207,107,.04)' : 'rgba(255,255,255,.01)',
            }}>
              <div style={{
                textAlign: 'center', fontWeight: 700, fontSize: 12, color: tower.color,
                letterSpacing: 2, marginBottom: 6, paddingBottom: 6,
                borderBottom: '1px dashed var(--line)',
              }}>
                {tower.name} <span style={{ fontSize: 11, color: 'var(--muted)' }}>★ {totalStars}/{maxStars} · {totalReward} 星声</span>
              </div>
              {tower.floors.map((f: any, i: number) => {
                const prevId = i > 0 ? tower.floors[i - 1].id : null;
                return <FloorCard key={f.id} f={f} opts={{ lockable: true, prevId }} today={today} />;
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ===== main component =====

export function AbyssPanel() {
  const S = useS();
  const [abyssZone, setAbyssZone] = useState('hazard');

  // Read S fields to establish signal subscription
  const teamCount = getCombatTeamNames().length;
  const stars = getAbyssStars();

  const hazardTotal = ABYSS_ZONES.hazard.floors.reduce((a: number, f: any) => a + (stars[f.id] || 0), 0);
  const hazardMax = ABYSS_ZONES.hazard.floors.length * 3;
  const oneShotZoneKeys = Object.keys(ABYSS_ZONES).filter(k => ABYSS_ZONES[k].oneShot);
  const oneShotTotal = oneShotZoneKeys.reduce((sum: number, k: string) =>
    sum + ABYSS_ZONES[k].floors.reduce((a: number, f: any) => a + (stars[f.id] || 0), 0), 0);
  const oneShotMax = oneShotZoneKeys.reduce((sum: number, k: string) => sum + ABYSS_ZONES[k].floors.length * 3, 0);

  const nextReset = nextHazardResetDate(S.today);
  const daysLeft = Math.max(0, Math.ceil((nextReset - S.today) / DAY));
  const versionInfo = getAbyssVersionInfo(S.today);
  const env = getCurrentAbyssEnvironment(S.today);

  const zoneConfig: Record<string, { label: string; desc: string }> = {
    stable:     { label: '稳定区',     desc: '一次性 4 关\n满星 800 星声' },
    experiment: { label: '实验区',     desc: '一次性 5 关\n满星 1000 星声' },
    hazard:     { label: '危险区',     desc: '28 天重置\n12 关满星 800 星声' },
  };

  return (
    <div>
      {/* ===== Summary Header ===== */}
      <div style={{
        textAlign: 'center', marginBottom: 12, padding: '10px 12px',
        border: '1px solid rgba(245,207,107,.3)', borderRadius: 10,
        background: 'linear-gradient(135deg,rgba(245,207,107,.06),rgba(195,155,255,.03))',
      }}>
        <div style={{ fontSize: 15, letterSpacing: 4, color: 'var(--gold)', fontWeight: 700 }}>逆 境 深 塔</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, lineHeight: 1.7 }}>
          <span style={{ color: 'var(--accent)' }}>★1：{STAR_CRITERIA.oneStar.turn} 回合内通关</span> ·
          <span style={{ color: 'var(--accent)' }}>★2：{STAR_CRITERIA.twoStar.turn} 回合内 + HP ≥ {(STAR_CRITERIA.twoStar.hp * 100).toFixed(0)}%</span> ·
          <span style={{ color: 'var(--gold)' }}>★3：{STAR_CRITERIA.threeStar.turn} 回合内 + HP ≥ {(STAR_CRITERIA.threeStar.hp * 100).toFixed(0)}%</span>
        </div>
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11 }}>
          <span>稳定/实验 一次性区 <b style={{ color: 'var(--green)' }}>★ {oneShotTotal}/{oneShotMax}</b></span>
          <span>危险区 <b style={{ color: 'var(--gold)' }}>★ {hazardTotal}/{hazardMax}</b> · 三塔满星 800 星声</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--accent)', letterSpacing: 1 }}>
          ⏳ 危险区下次重置：{fmt(nextReset)}（剩余 {daysLeft} 天） · 水温 {versionInfo.version} HP×{versionInfo.hp.toFixed(2)}
        </div>
        <div style={{ marginTop: 3, fontSize: 11, letterSpacing: 0.5 }}>
          🌐 本期环境：<b style={{ color: 'var(--green)' }}>{env.favorElement} −10%抗</b> · <b style={{ color: 'var(--red)' }}>{env.resistElement} +10%抗</b> · <b style={{ color: 'var(--gold)' }}>{env.buffLabel}</b>
        </div>
      </div>

      {/* ===== Empty team warning ===== */}
      {teamCount === 0 && (
        <div style={{
          color: 'var(--red)', textAlign: 'center', padding: 10, fontSize: 12,
          border: '1px dashed var(--red)', borderRadius: 8, marginBottom: 12,
        }}>
          ⚠ 编队为空或队员已失效，先去【编队】面板组队
        </div>
      )}

      {/* ===== Zone tabs + content ===== */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Left sidebar - zone tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 85 }}>
          {Object.entries(zoneConfig).map(([key, cfg]) => {
            const active = abyssZone === key;
            const color = key === 'hazard' ? 'var(--gold)' : key === 'experiment' ? 'var(--accent)' : 'var(--green)';
            return (
              <div key={key} onClick={() => setAbyssZone(key)} style={{
                cursor: 'pointer', border: '2px solid ' + (active ? color : 'var(--line)'),
                borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                background: active ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)',
                transition: '.15s',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: active ? color : 'var(--text)' }}>{cfg.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{cfg.desc}</div>
              </div>
            );
          })}

          {/* Hazard sub-info */}
          {abyssZone === 'hazard' && (
            <div style={{
              marginTop: 4, padding: 8, borderRadius: 8, background: 'rgba(255,255,255,.02)',
              fontSize: 10, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.4,
            }}>
              <div style={{ color: 'var(--gold)', fontWeight: 600 }}>三塔结构</div>
              回音 · 残响 · 深境<br />
              各 4 层 · 共 12 关<br />
              <span style={{ color: 'var(--dim)' }}>第 N 层耗 N 活力</span>
            </div>
          )}
        </div>

        {/* Right content area */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', maxHeight: '60vh' }}>
          {abyssZone === 'hazard' && <HazardTowersBlock today={S.today} />}
          {abyssZone === 'stable' && (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>{ABYSS_ZONES.stable.desc}</div>
              {ABYSS_ZONES.stable.floors.map((f: any) => <FloorCard key={f.id} f={f} opts={{ lockable: false, prevId: null }} today={S.today} />)}
            </>
          )}
          {abyssZone === 'experiment' && (
            <>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.6 }}>{ABYSS_ZONES.experiment.desc}</div>
              {ABYSS_ZONES.experiment.floors.map((f: any) => <FloorCard key={f.id} f={f} opts={{ lockable: false, prevId: null }} today={S.today} />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
