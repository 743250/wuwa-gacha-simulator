// 抽卡分析 tab · 复刻社区抽卡分析工具的整页样式
//
// 三段结构：
//   1. 头部：头像 + 存档标识 + 总消耗 / 生涯评分
//   2. 近期记录卡：四池汇总（限定 / 专武 / 常驻 / 联动）
//   3. 历史列表：每颗 5★ 一行（头像 + 日期 + 抽数条 + 超欧超非角标 + 歪章 + 四星陪跑）
//
// 数据全部来自 analysis.js（detailedHistory / computePoolGroups / computeAnalysis），
// 本文件只负责展示，不做统计口径判断。
//
// 与旧 StatsTab 并存：StatsTab 保留原指标网格与出金时间线，本页是新版分析视图。

import { h, Fragment } from 'preact';
import { useS } from '../../signals';
import { computeAnalysis, computePoolGroups, detailedHistory, historyTier, POOL_GROUPS } from '../../../gacha/analysis.js';
import { getRoleHead } from '../../assets/roleHead.ts';
import { getWeaponArt } from '../../assets/weaponArt.ts';

// 抽数条宽度百分比：8% 起底 + 线性。
// 带「歪」章时封顶留白；带角标时抬高下限，避免「超欧/超非」被挤到换行。
function barWidth(pity: number, hasStamp: boolean, hasTag: boolean): number {
  const cap = hasStamp ? 78 : 92;
  const floor = hasTag ? 38 : 10;
  return Math.max(floor, Math.min(cap, 8 + (pity || 0) * 0.92));
}

// 角色名优先取头像，取不到再当武器取图标；名字集合不相交。
function iconFor(name: string): string | undefined {
  return getRoleHead(name) || getWeaponArt(name);
}

const TAG_TEXT: Record<string, string> = {
  'super-euro': '超欧',
  'super-bad': '超非',
};

export function AnalysisTab() {
  const S = useS() as any;
  const a = computeAnalysis(S);
  const rows = detailedHistory(S);
  const groups = computePoolGroups(S);

  if (a.totalPulls === 0) {
    return (
      <div class="an-empty">
        <div class="an-empty-title">暂无抽卡数据</div>
        <div class="an-empty-hint">抽几发回来，这里会生成你的抽卡档案</div>
      </div>
    );
  }

  // 最近一次抽卡日期 = 列表最新一条；用作「统计自」的锚点
  const since = (rows[0] && rows[0].date) || (S.today && new Date(S.today).toISOString().slice(0, 10)) || '';

  // 「至今」垫抽行：取当前垫得最多的池
  let pending: { pity: number; label: string } | null = null;
  const groupByPool: Record<string, string> = {};
  for (const g of POOL_GROUPS) for (const key of g.pools) groupByPool[key] = g.label;
  for (const [pool, n] of Object.entries((S.pity || {}) as Record<string, number>)) {
    if (!n || n <= 0) continue;
    if (!pending || n > pending.pity) pending = { pity: n, label: groupByPool[pool] || pool };
  }

  let prevYear = '';

  return (
    <Fragment>
      {/* 1. 头部 */}
      <div class="an-head">
        <div class="an-avatar">
          {getRoleHead('漂泊者·衍射')
            ? <img src={getRoleHead('漂泊者·衍射')} alt="" />
            : <span class="an-avatar-fallback">浪</span>}
        </div>
        <div class="an-head-id">
          <div class="an-uid">本地存档</div>
          <div class="an-server">鸣潮 · 唤取模拟器</div>
        </div>
      </div>

      <div class="an-band">
        <div class="an-band-item">
          <span class="an-band-label">总消耗</span>
          <b>{((S.astriteSpent) || 0).toLocaleString()}</b>
        </div>
        <div class="an-band-sep" />
        <div class="an-band-item">
          <span class="an-band-label">生涯评分</span>
          <b>{a.title.label}</b>
        </div>
      </div>

      {/* 2. 近期记录卡 */}
      <div class="an-card">
        <div class="an-card-tag"><span>近期</span><span>记录</span></div>
        <div class="an-card-ribbon">{a.title.label}</div>
        {since && <div class="an-card-stamp">统计自<br />{since}</div>}
        <div class="an-groups">
          {groups.map(g => (
            <div class="an-group" key={g.key}>
              <div class="an-group-label">{g.label}</div>
              <div class="an-group-pulls">{g.pulls}<span>抽</span></div>
              <div class="an-group-line" />
              <div class="an-group-sub">
                <div class="an-sub">
                  <b>
                    {g.five}
                    {g.showLost && <Fragment>/<i>{g.lost}</i></Fragment>}
                  </b>
                  <span>出卡数{g.showLost ? '/歪' : ''}</span>
                </div>
                <div class="an-sub">
                  <b>{g.avgUpCost > 0 ? g.avgUpCost.toFixed(1) : '--'}</b>
                  <span>{g.avgLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 历史列表 */}
      <div class="an-list">
        {pending && (
          <div class="an-row an-row-pending">
            <div class="an-row-left">
              <div class="an-row-avatar an-row-avatar-q">?</div>
              <div class="an-row-date">至今</div>
            </div>
            <div class="an-row-main">
              <div class="an-bar-wrap">
                <div class={`an-bar an-bar-${historyTier(pending.pity)}`} style={{ width: barWidth(pending.pity, false, false) + '%' }}>
                  <span class="an-bar-num">{pending.pity}</span>
                  <span class="an-bar-unit">抽</span>
                </div>
              </div>
              <div class="an-pending-label">{pending.label}垫抽中</div>
            </div>
          </div>
        )}

        {rows.map((r, i) => {
          const year = (r.date || '').slice(0, 4);
          const showYear = i > 0 && year && year !== prevYear;
          prevYear = year;
          const lost = r.pool === 'eventChar' || r.pool === 'collabChar' || r.pool === 'noviceChoice'
            ? !r.up
            : false;
          const tag = TAG_TEXT[r.tier];
          return (
            <Fragment key={r.no ?? i}>
              {showYear && <div class="an-year">{year}年</div>}
              <div class={`an-row an-row-${r.tier}`}>
                <div class="an-row-left">
                  <div class="an-row-avatar">
                    {iconFor(r.name)
                      ? <img src={iconFor(r.name)} alt="" />
                      : <span class="an-row-avatar-fallback">{String(r.name || '?').slice(0, 1)}</span>}
                  </div>
                  <div class="an-row-date">{(r.date || '').slice(5)}</div>
                </div>
                <div class="an-row-main">
                  <div class="an-bar-wrap">
                    <div class={`an-bar an-bar-${r.tier}`} style={{ width: barWidth(r.pity, lost, !!tag) + '%' }}>
                      <span class="an-bar-num">{r.pity}</span>
                      <span class="an-bar-unit">抽</span>
                      {tag && <span class={`an-bar-tag an-bar-tag-${r.tier}`}>{tag}</span>}
                    </div>
                    {lost && <span class="an-stamp">歪</span>}
                  </div>
                  {r.fours.length > 0 && (
                    <div class="an-fours">
                      {r.fours.map(f => (
                        <div class="an-four" key={f.name} title={f.name}>
                          {iconFor(f.name)
                            ? <img src={iconFor(f.name)} alt="" />
                            : <span class="an-four-fallback">{String(f.name || '?').slice(0, 1)}</span>}
                          {f.count > 1 && <span class="an-four-n">{f.count}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Fragment>
          );
        })}

        {rows.length === 0 && <div class="an-empty-hint">还没有出金的记录</div>}
      </div>
    </Fragment>
  );
}
