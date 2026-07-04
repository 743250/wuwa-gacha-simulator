// 每日委托面板 · Stage 3.1 已迁 Preact (src/ui2/panels/daily/DailyPanel.tsx)
//
// 本文件保留:
//   1. main.js 里 `import { renderDaily }` / `renderDaily()` 调用不挂
//   2. doCommission / claimWeeklyTour action 函数,被 DailyPanel.tsx 直接 import
//   3. Stage 6 清理时连 main.js import 一起删

import { msg } from '../state.js';
import { completeCommission } from '../daily/commission.js';
import { WEEKLY_TOUR_REWARD, claimWeeklyTour } from '../daily/weekly.js';
import { bumpStateVersion } from '../ui2/signals.ts';

// no-op —— Preact 已接管 #paneDaily
export function renderDaily() {}

export function doCommission(idx) {
  completeCommission(idx);
  msg('委托完成', false);
  bumpStateVersion();
}

export function claimTour() {
  const r = claimWeeklyTour();
  if (r) {
    msg(`周度游历领取 · 星声 +${r.astrite}`, false);
    bumpStateVersion();
  } else {
    msg('本周已领取');
  }
}

// 保持 export 不变(main.js 有引用)
void WEEKLY_TOUR_REWARD;
