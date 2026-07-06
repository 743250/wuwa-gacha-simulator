// 海市兑换 tab · Stage 6.1b
// 接管 #paneEx（包含 exList + waveList + 珊瑚余额）

import { h, Fragment } from 'preact';
import { useS } from '../../signals';
import { isCollabActive } from '../../../gacha/core.js';
import { standard5, fourAll, bannerNames } from '../../../data/chars.js';
import { openWaveModal } from '../../../exchange/coral.js';

export function ExchangeTab() {
  const S = useS();
  const collabActive = isCollabActive();

  const tides: [string, string][] = [
    ['radiant', '浮金波纹'],
    ['forging', '铸潮波纹'],
    ['lustrous', '唤声涡纹'],
  ];
  if (collabActive) {
    tides.push(['dream', '捕梦波纹'], ['mirage', '铭影波纹']);
  }

  // ---- wave list ---- //
  const allFiveStars = [...new Set([
    ...standard5,
    ...Object.keys(bannerNames).filter((n: string) => !standard5.includes(n) && !fourAll.includes(n)),
  ])];
  const waveCandidates: any[] = [];
  for (const name of allFiveStars) {
    const realName = Object.keys(S.roles).find(x => x === name || x.includes(name)) || name;
    const owned = S.roles[realName];
    if (!owned || owned.owned <= 0) continue;
    if (owned.chain >= 6) continue;
    const isStd = standard5.includes(name);
    const cost = isStd ? 270 : 360;
    const used = S.waveBuy[name] || 0;
    const can = Math.min(2 - used, Math.floor(S.afterglow / cost));
    waveCandidates.push({ name, realName, cost, used, can, isStd, chain: owned.chain });
  }
  // 链数升序 + 已购 0 优先（离满链越近、还没换过的排前面）
  waveCandidates.sort((a, b) => a.chain !== b.chain ? a.chain - b.chain : a.used - b.used);

  return (
    <Fragment>
      <h2 class="col-head" style={{ marginTop: 0 }}>海 市 珊 瑚</h2>
      <div class="coral-bar">
        <div class="coral">
          <div class="l">余 波 珊 瑚</div>
          <div class="v" id="cAg">{S.afterglow}</div>
          <div class="h" id="cAgHint">可换 {Math.floor(S.afterglow / 8)} 抽</div>
        </div>
        <div class="coral osc">
          <div class="l">残 振 珊 瑚</div>
          <div class="v" id="cOs">{S.oscillated}</div>
          <div class="h" id="cOsHint">可换 {Math.floor(S.oscillated / 70)} 抽</div>
        </div>
      </div>

      <h2 class="col-head" style={{ marginTop: '14px' }}>波 纹 兑 换</h2>
      <div class="exch-list" id="exList">
        {tides.map(([k, n]) => {
          const agMax = Math.floor(S.afterglow / 8);
          const osLeft = 7 - ((S.oscBuy as any)[k] || 0);
          const osMax = Math.min(Math.floor(S.oscillated / 70), osLeft);
          return (
            <div class="exch" key={k}>
              <div class="n">
                <span>{n}</span>
                <span class="own">持有 <b>{(S as any)[k] || 0}</b> 个</span>
              </div>
              <div class="btns">
                <button class="mbtn" disabled={agMax <= 0}
                  onClick={() => (window as any).openExchangeModal(k, n, 'afterglow')}>
                  余 波 · 最多 {agMax}
                </button>
                <button class="mbtn gold" disabled={osMax <= 0}
                  onClick={() => (window as any).openExchangeModal(k, n, 'oscillated')}>
                  残 振 · 剩 {osLeft}/7
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 class="col-head" style={{ marginTop: '14px' }}>角 色 波 段</h2>
      <div class="exch-list" id="waveList">
        {waveCandidates.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', padding: '12px', letterSpacing: '1px' }}>
            无可兑换回音频段的五星角色（已满链或未拥有）
          </div>
        ) : waveCandidates.map(c => (
          <div class="exch" key={c.name}>
            <div class="n">
              <span>{c.name}的回音频段</span>
              <span class="own">已购 <b>{c.used}</b> / 2</span>
            </div>
            <div class="btns">
              <button class="mbtn gold" disabled={c.can <= 0}
                onClick={() => openWaveModal()}>
                余波 {c.cost} / 个 · 可换 {c.can}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Fragment>
  );
}
