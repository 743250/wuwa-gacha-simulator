// 每日委托面板 · Preact 版 · Stage 3.1
//
// 业务函数 doCommission / claimTour 直接从 src/ui/daily.js import,不再走 window.__ 桥。

import { useS } from '../../signals';
import { WEEKLY_TOUR_REWARD, isWeeklyTourClaimed } from '../../../daily/weekly.js';
import { doCommission, claimTour } from '../../../ui/daily.js';

// 注:老 renderDaily 会先调 resetDailyIfNeeded() 触发跨日重置。
// 迁到 Preact 后,这个副作用移到 main.js 启动流程和时间推进按钮的 rerenderAll() 之前触发 —— 组件本身不做副作用。
// main.js 里 loadState() 后已经调 resetDailyIfNeeded(),advanceDay() 内部也会调,基线覆盖。

function CommissionCard({ commission, idx }: any) {
  const done = commission.done;
  const r = commission.reward;
  const rewardParts: string[] = [];
  if (r.astrite) rewardParts.push(`星声 +${r.astrite}`);
  if (r.exp_super) rewardParts.push(`特级促剂 ×${r.exp_super}`);
  if (r.exp_high) rewardParts.push(`高级促剂 ×${r.exp_high}`);
  if (r.exp_mid) rewardParts.push(`中级促剂 ×${r.exp_mid}`);
  if (r.exp_low) rewardParts.push(`初级促剂 ×${r.exp_low}`);
  if (r.weapon_book) rewardParts.push(`武器石 ×${r.weapon_book}`);
  return (
    <div style={{
      border: `1px solid ${done ? 'var(--green)' : 'var(--line)'}`,
      borderRadius: 8, padding: '10px 12px', marginBottom: 5,
      background: done ? 'rgba(141,230,166,.05)' : 'rgba(255,255,255,.02)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--green)' : 'var(--text)' }}>
            {done ? '✓ ' : ''}{commission.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }}>
            {rewardParts.join(' · ')}
          </div>
        </div>
        <button class={`mbtn ${done ? '' : 'gold'}`}
          disabled={done}
          onClick={() => doCommission(idx)}>
          {done ? '已完成' : '完 成'}
        </button>
      </div>
    </div>
  );
}

export function DailyPanel() {
  const S = useS();

  const cs = S.dailyCommissions || [];
  const doneCount = cs.filter((c: any) => c.done).length;
  const tourDone = isWeeklyTourClaimed();
  const r = WEEKLY_TOUR_REWARD;
  const allDone = doneCount === cs.length && cs.length > 0;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, letterSpacing: '3px', color: 'var(--gold)', fontWeight: 700 }}>
          每 日 委 托
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
          4 个常规 + 1 个挑战 · 全部完成共 60 星声 · 每日重置
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--accent)' }}>
          进度 {doneCount} / {cs.length}
        </div>
      </div>

      {cs.map((c: any, i: number) => (
        <CommissionCard key={i} commission={c} idx={i} />
      ))}

      {allDone && (
        <div style={{ textAlign: 'center', color: 'var(--gold)', fontSize: 11, marginTop: 10, letterSpacing: '1px' }}>
          🎉 今日全部完成
        </div>
      )}

      <div style={{
        marginTop: 16,
        border: `1px solid ${tourDone ? 'var(--green)' : 'rgba(245,207,107,.4)'}`,
        borderRadius: 10, padding: 12,
        background: tourDone
          ? 'rgba(141,230,166,.05)'
          : 'linear-gradient(135deg,rgba(245,207,107,.06),rgba(195,155,255,.03))',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', letterSpacing: '2px' }}>
              周 度 游 历
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
              原千道门扉 · 每周一次性 · 周一重置
            </div>
          </div>
          <button class={`mbtn ${tourDone ? '' : 'gold'}`}
            disabled={tourDone}
            onClick={() => claimTour()}>
            {tourDone ? '本周已领' : '一 键 领 取'}
          </button>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--muted)', marginTop: 8,
          borderTop: '1px dashed var(--line)', paddingTop: 6,
        }}>
          <span style={{ color: 'var(--gold)' }}>星声 +{r.astrite}</span> ·
          高级促剂 ×{r.exp_high} ·
          武器石 ×{r.weapon_book} ·
          <span style={{ color: '#9ad0f5' }}>唤声涡纹 ×{r.lustrous}</span>
        </div>
      </div>
    </div>
  );
}
