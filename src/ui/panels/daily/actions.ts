// 每日委托 actions · Phase 5 从 src/ui/daily.js shim 迁入
import { msg } from '../../../state.js';
import { completeCommission } from '../../../daily/commission.js';
import { claimWeeklyTour } from '../../../daily/weekly.js';
import { bumpStateVersion } from '../../signals';

export function doCommission(idx: number) {
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
