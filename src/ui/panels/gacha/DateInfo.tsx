// 顶部时间信息 · Stage 6.1b
// 挂载到 .timeline .ti 区域（#dateNow + #dateMeta）

import { h } from 'preact';
import { useS } from '../../signals';
import { fmt } from '../../../state.js';
import { activePhase } from '../../../gacha/core.js';
import { VERSION_NAMES } from '../../../data/phases.js';

export function DateInfo() {
  const S = useS();
  const phases = activePhase();
  const vs = phases.map((p: any) => p.v).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(' · ') || '无';
  const vName = VERSION_NAMES[vs] || '';
  const bannerCount = activePhase().length;

  return (
    <div>
      <div class="now" id="dateNow">{fmt(S.today)}</div>
      <div class="meta" id="dateMeta">
        版本 {vs}{vName ? ' · ' + vName : ''} · 开放卡池 {bannerCount}
      </div>
    </div>
  );
}
