// 每日委托 actions · Phase 5 从 src/ui/daily.js shim 迁入
// completeCommission / claimWeeklyTour 已通过 commit() 收口自带 bump,这里只补 msg
import { msg } from '../../../state.js';
import { completeCommission } from '../../../daily/commission.js';
import { claimWeeklyTour } from '../../../daily/weekly.js';

export function doCommission(idx: number) {
  completeCommission(idx);
  msg('委托完成', false);
}

export function claimTour() {
  const r = claimWeeklyTour();
  if (r) msg(`周度游历领取 · 星声 +${r.astrite}`, false);
  else msg('本周已领取');
}
