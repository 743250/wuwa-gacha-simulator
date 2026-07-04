// 每日委托面板 · Stage 3.1 已迁 Preact (src/ui2/panels/daily/DailyPanel.tsx)
//
// 本文件保留:
//   1. main.js 里 `import { renderDaily }` / `renderDaily()` 调用不挂
//   2. 注册 window.__doCommission / window.__claimWeeklyTour handler(action 层未拆,Stage 6 处理)
//   3. Stage 6 清理时一并删掉

import { msg } from '../state.js';
import { completeCommission } from '../daily/commission.js';
import { WEEKLY_TOUR_REWARD, claimWeeklyTour } from '../daily/weekly.js';

// no-op —— Preact 已接管 #paneDaily
export function renderDaily() {}

window.__doCommission = (idx) => {
  completeCommission(idx);
  msg('委托完成', false);
  window.__render();
};

window.__claimWeeklyTour = () => {
  const r = claimWeeklyTour();
  if (r) {
    msg(`周度游历领取 · 星声 +${r.astrite}`, false);
    window.__render();
  } else {
    msg('本周已领取');
  }
};

// 保持 export 不变(main.js 有引用)
void WEEKLY_TOUR_REWARD;
