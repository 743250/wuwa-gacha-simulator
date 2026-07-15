// 抽卡按钮区 · Stage 6.1b
// 挂载到 .pull-card，渲染 costPanel + pityRow + 抽卡按钮
// onClick 直接 import tryPull/doPullN/toFive，不依赖 main.js onclick 绑定

import { h, Fragment } from 'preact';
import { useS } from '../../signals';
import { cur, tideKey, tideName, tideLetter } from '../../../gacha/core.js';
import { tryPull, doPullN, toFive } from '../../../gacha/actions.js';

export function PullPanel() {
  const S = useS();
  const b = cur();

  if (!b) {
    return (
      <Fragment>
        <div class="cost-panel" id="costPanel"></div>
        <div class="pity-row" id="pityRow">
          <div style={{ color: 'var(--muted)', fontSize: '12px', letterSpacing: '1px', textAlign: 'center', width: '100%' }}>
            推进日期到开放期才能唤取
          </div>
        </div>
        <div class="pull-btns">
          <button class="pbtn" id="pull1" disabled={true}>
            <span class="big">唤取</span>
            <span class="small" id="lbl1">× 1</span>
          </button>
          <button class="pbtn" id="pull10" disabled={true}>
            <span class="big">十连唤取</span>
            <span class="small" id="lbl10">× 10</span>
          </button>
        </div>
        <div class="pull-extras">
          <button class="xbtn" id="toFive" disabled={true}>抽到下个五星</button>
          <button class="xbtn" id="free10" onClick={() => doPullN(10, true)}>试手十连</button>
        </div>
      </Fragment>
    );
  }

  const pool = b.pool;
  const tk = tideKey(pool);
  const tn = tideName(pool);
  const letter = tideLetter(pool);
  const tideHave = (S as any)[tk] || 0;
  const astHave = S.astrite;
  const lunHave = S.lunite;
  const priced10 = pool === 'beginner' ? 8 : 10;
  const tideUsed10 = Math.min(priced10, tideHave);
  const astUsed10 = (priced10 - tideUsed10) * 160;
  const lunNeed10 = Math.max(0, astUsed10 - astHave);
  const maxPulls = tideHave + Math.floor(astHave / 160);
  const maxPullsWithLunite = tideHave + Math.floor((astHave + lunHave) / 160);

  const pkey = pool;
  const pity = S.pity[pkey];
  const hard = pool === 'beginner' ? 50 : 80;

  let gtxt = '';
  let gcls = '';
  if (pool === 'eventChar' || pool === 'noviceChoice') {
    if (S.g[pkey]) { gtxt = '下个五星必为本期角色'; gcls = 'guar'; }
    else gtxt = '下个五星 50% 为本期角色';
  } else if (pool === 'collabChar') {
    gtxt = '下个五星必为本期角色'; gcls = 'guar';
  } else if (pool === 'eventWeapon' || pool === 'collabWeapon') {
    gtxt = '下个五星必为本期武器'; gcls = 'guar';
  } else if (pool === 'noviceWeapon') {
    gtxt = '下个五星必为自选武器（新旅）'; gcls = 'guar';
  } else if (pool === 'standardWeapon') {
    gtxt = '下个五星必为自选武器'; gcls = 'guar';
  } else if (pool === 'beginner') {
    gtxt = `已抽 ${S.beginnerPulls} / 50`;
  } else {
    gtxt = '常驻五星';
  }

  const lbl1 = `× 1`;
  // 消耗明细交给 cost-panel 展示，按钮只保留次数
  const lbl10 = `× 10`;

  const can1 = tideHave >= 1 || astHave + lunHave >= 160;
  const can10 = tideHave + Math.floor((astHave + lunHave) / 160) >= priced10 && !(pool === 'beginner' && S.beginnerDone);

  return (
    <Fragment>
      <div class="cost-panel" id="costPanel">
        <div class={`cost tide ${letter}`}>
          <div class="lbl">{tn}</div>
          <div class="val"><b>{tideHave}</b><span class="u">个</span></div>
          <div class="sub">十连消耗 {tideUsed10} 个{pool === 'beginner' ? '（八折）' : ''}</div>
        </div>
        <div class="cost ast">
          <div class="lbl">星 声</div>
          <div class="val"><b>{astHave.toLocaleString()}</b></div>
          <div class="sub">十连补 {astUsed10.toLocaleString()} 星声</div>
        </div>
        <div class="cost can">
          <div class="lbl">合计可抽</div>
          <div class="val"><b>{maxPulls}</b><span class="u">次</span></div>
          <div class="sub">含月相 {maxPullsWithLunite} 次</div>
        </div>
      </div>
      <div class="pity-row" id="pityRow">
        <div>
          <div class="pl">五 星 进 度</div>
          <div class="pv"><b>{pity}</b> / {hard}</div>
        </div>
        <div class="pity-bar"><i style={{ width: `${Math.min(100, pity / hard * 100)}%` }}></i></div>
        <span class={`pity-tag ${gcls}`}>{gtxt}</span>
      </div>
      <div class="pull-btns">
        <button class="pbtn" id="pull1" disabled={!can1 || pool === 'beginner'}
          onClick={() => tryPull(1)}>
          <span class="big">唤取</span>
          <span class="small" id="lbl1">{lbl1}</span>
        </button>
        <button class="pbtn" id="pull10" disabled={!can10}
          onClick={() => tryPull(10)}>
          <span class="big">十连唤取</span>
          <span class="small" id="lbl10">{lbl10}</span>
        </button>
      </div>
      <div class="pull-extras">
        <button class="xbtn" id="toFive" disabled={!can1 || pool === 'beginner'}
          onClick={() => toFive()}>抽到下个五星</button>
        <button class="xbtn" id="free10"
          onClick={() => doPullN(10, true)}>试手十连</button>
      </div>
    </Fragment>
  );
}
