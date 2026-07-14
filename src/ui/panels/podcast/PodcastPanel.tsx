// 先约电台 Preact 面板 · Stage 3.5
//
// 迁移策略(playbook step 3):
//   · UI 层完全用 Preact JSX 重写
//   · 数据层继续读 S,靠 sSignal(stateVersion) 驱动重渲染
//   · 按钮 onClick 直接 import claimFree/claimPaid/buyLevel/claimAll,
//     调用后 bumpStateVersion() 驱动本组件刷新
//   · tooltip 沿用整体 CSS data-tip 机制

import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { useS } from '../../signals';
import { setView } from '../../AppShell';
import { DAY } from '../../../state.js';
import {
  ensurePodcast,
  resetPodcastDailyIfNeeded,
  resetPodcastWeeklyIfNeeded,
  taskState,
  progressTask,
  claimFree,
  claimPaid,
  buyLevel,
  claimAll,
  PODCAST_REWARDS,
  PODCAST_MAX_LEVEL,
  PODCAST_EXP_PER_LEVEL,
  PODCAST_BUY_LEVEL_COST,
} from '../../../podcast/core.js';
import { PODCAST_TASKS } from '../../../data/podcast-tasks.js';
import { phases } from '../../../data/phases.js';
import { buyShop } from '../../../shop/actions.js';
import { commit } from '../../../state/commit';

// ---------- helpers ----------

function rewardChips(r: any): any[] {
  if (!r) return [];
  const out: any[] = [];
  if (r.astrite)             out.push(<span class="rc rc-astrite">星声{r.astrite}</span>);
  if (r.lunite)              out.push(<span class="rc rc-lunite">月相{r.lunite}</span>);
  if (r.radiant)             out.push(<span class="rc rc-radiant">浮金{r.radiant}</span>);
  if (r.forging)             out.push(<span class="rc rc-forging">铸潮{r.forging}</span>);
  if (r.lustrous)            out.push(<span class="rc rc-lustrous">唤声{r.lustrous}</span>);
  if (r.exp_low)             out.push(<span class="rc">初促{r.exp_low}</span>);
  if (r.exp_mid)             out.push(<span class="rc">中促{r.exp_mid}</span>);
  if (r.exp_high)            out.push(<span class="rc">高促{r.exp_high}</span>);
  if (r.exp_super)           out.push(<span class="rc rc-super">特促{r.exp_super}</span>);
  if (r.weapon_book)         out.push(<span class="rc">武石{r.weapon_book}</span>);
  if (r.crystal_solvent)     out.push(<span class="rc">溶剂{r.crystal_solvent}</span>);
  if (r.waveplate_crystal)   out.push(<span class="rc">单质{r.waveplate_crystal}</span>);
  if (r.weaponBox)           out.push(<span class="rc rc-box">★箱</span>);
  if (r.refineStone)         out.push(<span class="rc">银{r.refineStone}</span>);
  if (r.cosmetic)            out.push(<span class="rc rc-cos">头像</span>);
  return out;
}

function rewardTipText(r: any): string {
  if (!r) return '无奖励';
  const out: string[] = [];
  if (r.astrite)             out.push(`星声 ×${r.astrite}`);
  if (r.lunite)              out.push(`月相 ×${r.lunite}`);
  if (r.radiant)             out.push(`浮金波纹 ×${r.radiant}`);
  if (r.forging)             out.push(`铸潮波纹 ×${r.forging}`);
  if (r.lustrous)            out.push(`唤声涡纹 ×${r.lustrous}`);
  if (r.exp_low)             out.push(`初级共鸣促剂 ×${r.exp_low}`);
  if (r.exp_mid)             out.push(`中级共鸣促剂 ×${r.exp_mid}`);
  if (r.exp_high)            out.push(`高级共鸣促剂 ×${r.exp_high}`);
  if (r.exp_super)           out.push(`特级共鸣促剂 ×${r.exp_super}`);
  if (r.weapon_book)         out.push(`武器突破石 ×${r.weapon_book}`);
  if (r.crystal_solvent)     out.push(`结晶溶剂 ×${r.crystal_solvent}`);
  if (r.waveplate_crystal)   out.push(`结晶单质 ×${r.waveplate_crystal}`);
  if (r.weaponBox)           out.push(`4★ 武器自选箱`);
  if (r.refineStone)         out.push(`烙金银杏 ×${r.refineStone}`);
  if (r.cosmetic)            out.push(r.cosmetic);
  return out.join(' · ');
}

// ---------- sub-components ----------

interface LevelCellProps {
  lv: number;
  level: number;
  paid: boolean;
  claimedFree: number[];
  claimedPaid: number[];
}

function LevelCell({ lv, level, paid, claimedFree, claimedPaid }: LevelCellProps) {
  const isCurrent = lv === level + 1;
  const reached = lv <= level;
  const lockedPaid = !paid;
  const r = PODCAST_REWARDS[lv - 1];
  const freeClaimed = claimedFree.includes(lv);
  const paidClaimed = claimedPaid.includes(lv);
  const freeChips = rewardChips(r.free);
  const paidChips = rewardChips(r.paid);

  let freeCls = 'pc-cell-free tip';
  if (freeClaimed) freeCls += ' claimed';
  else if (reached) freeCls += ' canclaim';

  let paidCls = 'pc-cell-paid tip';
  if (paidClaimed) paidCls += ' claimed';
  else if (reached && !lockedPaid) paidCls += ' canclaim';
  else if (lockedPaid) paidCls += ' locked';

  const freeTip = `<b>Lv ${lv} · 免费轨</b><br>${rewardTipText(r.free)}`;

  const paidTipText = lockedPaid
    ? `<b>Lv ${lv} · 付费轨 🔒</b><br>${rewardTipText(r.paid)}<br><span style="color:var(--gold)">购买内幕频道后可领取</span>`
    : `<b>Lv ${lv} · 付费轨</b><br>${rewardTipText(r.paid)}`;

  return (
    <div class={`pc-col ${isCurrent ? 'pc-cur' : ''} ${reached ? 'pc-reached' : ''}`}>
      <div class={freeCls}
        data-tip={freeTip}
        onClick={() => {
          if (reached && !freeClaimed) {
            claimFree(lv);
          }
        }}
        style={{ position: 'relative', cursor: reached && !freeClaimed ? 'pointer' : 'default' }}>
        <div class="rw">{freeChips.length ? freeChips : <span class="dim">—</span>}</div>
      </div>
      <div class="pc-lv">{lv}</div>
      <div class={paidCls}
        data-tip={paidTipText}
        onClick={() => {
          if (reached && !paidClaimed && !lockedPaid) {
            claimPaid(lv);
          }
        }}
        style={{ position: 'relative', cursor: reached && !paidClaimed && !lockedPaid ? 'pointer' : 'default' }}>
        <div class="rw">{paidChips.length ? paidChips : <span class="dim">—</span>}</div>
        {lockedPaid && <div class="lock-icon">🔒</div>}
      </div>
    </div>
  );
}

function taskToView(id: string): string | null {
  if (id === 'd_signin') return null;
  if (id === 'd_pull' || id === 'p_pull50' || id === 'p_pull200' || id === 'p_five') return 'gacha';
  if (id === 'p_weapon90' || id === 'd_upgrade') return 'bag';
  if (id.startsWith('d_') || id.startsWith('w_') || id.startsWith('p_')) return 'adventure';
  return null;
}

function TaskItem({ id, name, exp }: any) {
  const st = taskState(id);
  const pct = Math.min(100, Math.round(st.progress / st.target * 100));
  const cls = st.done ? 'pct pct-done' : 'pct';
  const targetView = taskToView(id);
  return (
    <div class={cls} style={{
      border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px',
      background: 'rgba(255,255,255,.02)',
    }}>
      <div class="pct-name">{name}</div>
      <div class="pct-bar"><div class="pct-fill" style={{ width: `${pct}%` }}></div></div>
      <div class="pct-info">{Math.min(st.progress, st.target)}/{st.target} · +{exp} EXP {st.done ? '✓' : ''}
        {targetView && !st.done && (
          <a style={{ marginLeft: 6, color: 'var(--gold)', cursor: 'pointer', fontSize: 10 }}
            onClick={() => { if (targetView === 'gacha' || targetView === 'adventure' || targetView === 'bag' || targetView === 'storage') setView(targetView); }}>前往 ›</a>
        )}
      </div>
    </div>
  );
}

function TaskBucket({ title, list }: any) {
  const doneCount = list.filter((t: any) => taskState(t.id).done).length;
  return (
    <div class="pct-bucket">
      <div class="pct-bucket-head">{title} <span class="dim">({doneCount}/{list.length})</span></div>
      <div class="pct-list">
        {list.map((t: any) => <TaskItem key={t.id} {...t} />)}
      </div>
    </div>
  );
}

// ---------- main ----------

export function PodcastPanel() {
  const S = useS();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 日期或版本变化后统一重置并签到；通过 commit 持久化，避免在渲染阶段直接修改状态。
  useEffect(() => {
    commit(() => {
      ensurePodcast();
      resetPodcastDailyIfNeeded();
      resetPodcastWeeklyIfNeeded();
      const st = taskState('d_signin');
      if (st && !st.done) progressTask('d_signin', 1);
    });
  }, [S.today, S.podcast.version]);

  const p = S.podcast;
  const expPct = p.level >= PODCAST_MAX_LEVEL ? 100 : Math.round(p.exp / PODCAST_EXP_PER_LEVEL * 100);

  // Calculate expiry days from phase data
  const matched = phases.filter((ph: any) => ph.v === p.version);
  let endTs = 0;
  const inOne = matched.find((ph: any) => S.today >= ph.start && S.today < ph.end);
  if (inOne) {
    endTs = matched.filter((ph: any) => ph.end >= inOne.end).reduce((m: number, ph: any) => Math.max(m, ph.end), 0);
  } else if (matched.length) {
    endTs = matched.reduce((m: number, ph: any) => Math.max(m, ph.end), 0);
  }
  const daysLeft = endTs ? Math.max(0, Math.ceil((endTs - S.today) / DAY)) : 0;

  // Scroll to current level on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const curCell = scrollRef.current.querySelector('.pc-cur') as HTMLElement | null;
    if (curCell) {
      const offset = curCell.offsetLeft - scrollRef.current.clientWidth / 2 + curCell.clientWidth / 2;
      scrollRef.current.scrollLeft = Math.max(0, offset);
    }
  }, []);

  // Build level cells (70 级)
  const cells: any[] = [];
  for (let lv = 1; lv <= PODCAST_MAX_LEVEL; lv++) {
    cells.push(
      <LevelCell
        key={lv}
        lv={lv}
        level={p.level}
        paid={p.paid}
        claimedFree={p.claimedFree}
        claimedPaid={p.claimedPaid}
      />
    );
  }

  return (
    <div>
      {/* Head: title + purchase buttons */}
      <div class="pc-head">
        <div class="pc-title">
          📻 先约电台 · 第 {p.version} 期
          {endTs > 0 && (
            <span class="pc-expire" title="本期电台剩余天数">
              {daysLeft > 0
                ? <>剩余 <b>{daysLeft}</b> 天</>
                : <span style={{ color: 'var(--red)' }}>本期已结束 · 等待版本切换</span>}
            </span>
          )}
        </div>
        <div class="pc-purchase">
          {p.paid
            ? <span class="tag-on">已订阅内幕频道</span>
            : <button class="mbtn gold" onClick={() => buyShop('bp_basic')}>¥68 解锁内幕频道</button>}
          {p.premium
            ? <span class="tag-on">寰宇频道</span>
            : <button class="mbtn" onClick={() => buyShop('bp_premium')}>¥128 寰宇频道</button>}
        </div>
      </div>

      {/* Progress bar + buy-level actions */}
      <div class="pc-progress">
        <div class="pc-lv-big">Lv <b>{p.level}</b> / {PODCAST_MAX_LEVEL}</div>
        <div class="pc-exp-bar"><div class="pc-exp-fill" style={{ width: `${expPct}%` }}></div></div>
        <div class="pc-exp-num">{p.exp.toLocaleString()} / {PODCAST_EXP_PER_LEVEL.toLocaleString()} EXP</div>
        <div class="pc-actions">
          <button class="mbtn" onClick={() => { buyLevel(1); }}>
            买 1 级 (星声 {PODCAST_BUY_LEVEL_COST})
          </button>
          <button class="mbtn" onClick={() => { buyLevel(5); }}>
            买 5 级 (星声 {PODCAST_BUY_LEVEL_COST * 5})
          </button>
          <button class="mbtn gold" onClick={() => { claimAll(); }}>
            一键领取已达成
          </button>
        </div>
      </div>

      {/* Track labels */}
      <div class="pc-track-label">
        <div class="pc-label-free">免费 · 大众频道</div>
        <div class="pc-label-paid">付费 · 内幕频道{p.paid ? '' : ' 🔒'}</div>
      </div>

      {/* Scrollable level grid */}
      <div class="pc-track-scroll" ref={scrollRef}>
        <div class="pc-track-inner">{cells}</div>
      </div>

      {/* Task buckets */}
      <div class="pc-tasks">
        <TaskBucket title="每日任务" key="daily" list={PODCAST_TASKS.daily} />
        <TaskBucket title="每周任务" key="weekly" list={PODCAST_TASKS.weekly} />
        <TaskBucket title="本期任务" key="period" list={PODCAST_TASKS.period} />
      </div>
    </div>
  );
}
