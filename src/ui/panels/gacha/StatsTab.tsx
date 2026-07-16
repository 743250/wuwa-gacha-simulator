// 统计 tab · 抽卡记录分析 + 欧非评价
//
// 三层结构：
//   A. 称号横幅（欧皇/小欧/平稳/小非/非酋/大非酋 + 评语）
//   B. 指标网格（累计充值/总抽数/UP 五星武器均抽/UP 角色均抽/最欧/最非/小保底不歪率）
//   C. 出金时间线（展开按钮后显示）
//      - 顶部 tab 按池子分类（角色限定/武器限定/角色常驻/武器常驻）
//      - 列表倒序，时间近的在上，时间远的在下
//      - 每行 = pity 数字 + 进度条 + 名字 + UP/歪 标记
//      - 容器有滚动条，防止过长

import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { useS } from '../../signals';
import { computeAnalysis, timelineByPoolDesc, poolsTouched, fiveStarKind } from '../../../gacha/analysis.js';
import { HARD_PITY } from '../../../gacha/rateConfig.js';

const POOL_TITLE: Record<string, string> = {
  eventChar: '角色限定池',
  eventWeapon: '武器限定池',
  collabChar: '角色联动池',
  collabWeapon: '武器联动池',
  standardChar: '角色常驻池',
  standardWeapon: '武器常驻池',
  beginner: '新手池',
  noviceChoice: '角色新旅池',
  noviceWeapon: '武器新旅池',
};

// tab 显示顺序：限定池优先，常驻次之，其余池子只在有数据时追加
const TAB_ORDER = ['eventChar', 'eventWeapon', 'collabChar', 'collabWeapon', 'standardChar', 'standardWeapon'];

function pct(v: number | null, digits = 2): string {
  if (v == null || !isFinite(v)) return '--';
  return (v * 100).toFixed(digits) + '%';
}

function num(v: number | null, digits = 1): string {
  if (v == null || !isFinite(v)) return '--';
  return v.toFixed(digits);
}

function rateClass(rate: number | null, good: number, bad: number): string {
  if (rate == null) return 'rate-na';
  if (rate >= good) return 'rate-good';
  if (rate <= bad) return 'rate-bad';
  return 'rate-mid';
}

// 小保底不歪率：越高越好（与旧歪率颜色相反）
function softWinClass(win: number | null): string {
  if (win == null) return 'rate-na';
  if (win > 0.65) return 'rate-good';
  if (win < 0.35) return 'rate-bad';
  return 'rate-mid';
}

export function StatsTab() {
  const S = useS();
  const [expanded, setExpanded] = useState(false);
  const [activePool, setActivePool] = useState<string>('eventChar');

  const roleArr = Object.values(S.roles || {}).filter((r: any) => r.owned > 0);
  const role5 = roleArr.filter((r: any) => r.r === 5).length;
  const role4 = roleArr.filter((r: any) => r.r === 4).length;
  const weaponArr = Object.values(S.weapons || {});
  const weapon5 = weaponArr.filter((w: any) => w.r === 5).length;
  const weapon4 = weaponArr.filter((w: any) => w.r === 4).length;

  const a = computeAnalysis(S as any);
  const groups = timelineByPoolDesc(S as any) as Record<string, any[]>;
  const isEmpty = a.totalPulls === 0;

  const tbColor = a.title.color === 'gold' ? 'tb-gold'
    : a.title.color === 'accent' ? 'tb-accent'
    : a.title.color === 'red' ? 'tb-red'
    : 'tb-muted';

  // 可用 tab：TAB_ORDER 中抽过的池子 + 其他抽过的池子（哪怕没出金也算）
  const touched = poolsTouched(S as any);
  const availablePools = [
    ...TAB_ORDER.filter(p => touched.includes(p)),
    ...touched.filter(p => !TAB_ORDER.includes(p)),
  ];
  const curTab = availablePools.includes(activePool) ? activePool : (availablePools[0] || 'eventChar');
  const curTimeline = (groups[curTab] || []) as any[];
  const curPity = (S.pity && S.pity[curTab]) || 0;

  return (
    <Fragment>
      {/* 区域 A：称号横幅 */}
      <div class={`title-banner ${tbColor}`}>
        {isEmpty ? (
          <Fragment>
            <div class="tb-label" style={{ color: 'var(--muted)' }}>暂无抽卡数据</div>
            <div class="tb-comment">快去抽几发，让命运为你定档</div>
          </Fragment>
        ) : (
          <Fragment>
            <div class="tb-label">{a.title.label}</div>
            <div class="tb-comment">{a.title.comment}</div>
            <div class="tb-summary">
              综合评分 {a.title.score.toFixed(2)} · 均抽 {a.avgPity > 0 ? num(a.avgPity, 1) : '--'} · 出金率 {pct(a.overallRate)} · 小保底不歪率 {a.lossRateReliable ? pct(a.softWinRate, 1) : (a.softWinRate != null ? pct(a.softWinRate, 1) + '（样本少）' : '--')}
              {a.title.flavor ? ` · ${a.title.flavor}` : ''}
            </div>
          </Fragment>
        )}
      </div>

      {/* 区域 B：精简指标网格 */}
      <div class="stats">
        <div class="stat"><b style={{ color: 'var(--red)' }}>¥{(((S as any).spent) || 0).toLocaleString()}</b><span>累计充值</span></div>
        <div class="stat"><b style={{ color: 'var(--gold)' }}>{(((S as any).astriteSpent) || 0).toLocaleString()}</b><span>已花费星声</span></div>
        <div class="stat"><b>{a.totalPulls}</b><span>总抽数</span></div>
        <div class="stat"><b>{a.avgWeaponUpPity > 0 ? num(a.avgWeaponUpPity, 1) : '--'}</b><span>UP 五星武器均抽</span></div>
        <div class="stat"><b>{a.avgUpPity > 0 ? num(a.avgUpPity, 1) : '--'}</b><span>UP 角色平均抽数</span></div>
        <div class="stat"><b>{a.luckiestPity ?? '--'}</b><span>最欧</span></div>
        <div class="stat"><b>{a.unluckiestPity ?? '--'}</b><span>最非</span></div>
        <div class="stat">
          <b class={softWinClass(a.softWinRate)}>{a.lossRateReliable ? pct(a.softWinRate, 1) : '--'}</b>
          <span>小保底不歪率</span>
        </div>
        <div class="stat"><b>{roleArr.length}</b><span>已拥角色</span></div>
        <div class="stat"><b>{weaponArr.length}</b><span>已拥武器</span></div>
      </div>

      <div id="sCollectionDetail" style={{ marginTop: '10px', fontSize: '11px', color: 'var(--muted)', textAlign: 'center', letterSpacing: '.5px' }}>
        角色 ★5 × <b style={{ color: 'var(--gold)' }}>{role5}</b> · ★4 × <b style={{ color: 'var(--purple)' }}>{role4}</b><br />
        武器 ★5 × <b style={{ color: 'var(--gold)' }}>{weapon5}</b> · ★4 × <b style={{ color: 'var(--purple)' }}>{weapon4}</b>
      </div>

      <button class="expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? '收起 ▲' : '展开出金时间线 ▼'}
      </button>

      {expanded && (
        <div class="timeline-wrap">
          <div class="tl-title">出金时间线</div>

          {/* 池子 tab */}
          {availablePools.length > 0 && (
            <div class="tl-tabs">
              {availablePools.map(pool => (
                <button
                  key={pool}
                  class={`tl-tab ${pool === curTab ? 'tl-tab-active' : ''}`}
                  onClick={() => setActivePool(pool)}
                >
                  {POOL_TITLE[pool] || pool}({(groups[pool] || []).length})
                </button>
              ))}
            </div>
          )}

          <div class="tl-legend">
            <span class="lg-up">UP 命中</span>
            <span class="lg-lost">歪了</span>
            <span class="lg-wait">垫条</span>
          </div>

          <div class="tl-list">
            {curPity > 0 && (
              <div class="tl-row tl-row-wait" title={`${POOL_TITLE[curTab] || curTab} 当前已垫 ${curPity} 抽，未出 5★`}>
                <span class="tl-num">{curPity}</span>
                <span class="tl-bar">
                  <span class="tl-fill" style={{ width: Math.min(100, Math.round((curPity / HARD_PITY) * 100)) + '%' }} />
                </span>
                <span class="tl-name tl-waiting">等待中？</span>
              </div>
            )}
            {curTimeline.map((x: any) => {
              const kind = fiveStarKind(x);
              const fillPct = Math.min(100, Math.round((x.pity / HARD_PITY) * 100));
              const cls = kind === 'up' ? 'up' : kind === 'lost' ? 'lost' : 'fixed';
              const tag = kind === 'up' ? 'UP' : kind === 'lost' ? '歪' : '';
              const poolLabel = POOL_TITLE[x.pool] || x.pool;
              return (
                <div class={`tl-row tl-row-${cls}`} title={`${x.n} · ${poolLabel} · 第${x.pity}抽 · ${x.date}`}>
                  <span class="tl-num">{x.pity}</span>
                  <span class="tl-bar">
                    <span class="tl-fill" style={{ width: fillPct + '%' }} />
                  </span>
                  <span class="tl-name">{x.n}{tag && <span class="tl-tag">{tag}</span>}</span>
                </div>
              );
            })}
            {curTimeline.length === 0 && curPity === 0 && (
              <div class="tl-empty">该池暂无抽卡记录</div>
            )}
          </div>
        </div>
      )}
    </Fragment>
  );
}