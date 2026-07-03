// 渲染主入口
import { S, $ } from '../state.js';
import { activePhase, activeBanners, cur, poolKind, isCollabActive } from '../gacha/core.js';
import { saveState } from '../save.js';
import { renderBannerArt } from './render/bannerArt.js';
import { renderBannerTabs } from './render/bannerTabs.js';
import { renderTopOverview, renderPullStats } from './render/overview.js';
import { renderLogList } from './render/logList.js';
import { renderPullPanel } from './render/pullPanel.js';
import { renderExchangeList } from './render/exchangeList.js';
import { renderWaveList } from './render/waveList.js';
import { renderShopPanel } from './render/shopPanel.js';
import { renderRoleList } from './render/roleList.js';
import { initRoleModal } from './render/roleModal.js';

export function render() {
  const aps = activePhase(), bs = activeBanners(), b = cur();

  renderTopOverview(aps, bs, S);

  if (bs.length) {
    renderBannerTabs(bs, S.selected, id => {
      S.selected = id;
      render();
    });

    // banner art
    const kind = poolKind(b.pool);
    const bannerArt = renderBannerArt(b, kind, S);
    $('bnArt').className = bannerArt.className;
    $('bnArt').innerHTML = bannerArt.html;
  } else {
    $('bnTabs').innerHTML = '';
    $('bnArt').innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px 0">当前日期没有开放卡池</div>';
  }

  renderPullPanel(b, S);

  renderPullStats(b, S);

  renderExchangeList(S, isCollabActive());

  renderWaveList(S);

  renderShopPanel(S, isCollabActive());

  renderLogList(S.log);

  renderRoleList(S);
  // 每次渲染后自动存档（防抖 1 秒）
  saveState();
}

initRoleModal({ render });



