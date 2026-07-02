import { $ } from '../../state.js';
import { shopCatalog } from '../../shop/actions.js';
import { renderShopBanner, renderTopupBanner } from './shopBanner.js';

export function renderShopPanel(state, collabActive) {
  $('kSpent').textContent = '¥' + state.spent;
  $('kLunite').textContent = state.lunite;
  $('kDays').textContent = state.days;

  if ($('bannerFeatured')) {
    const visibleBundle = shopCatalog.bundle.filter(it => !it.collab || collabActive);
    $('bannerTopup').innerHTML = shopCatalog.topup.map(it => renderTopupBanner(it, state)).join('');
    const featuredItems = [
      ...shopCatalog.monthly,
      ...visibleBundle.filter(it => !it.regular),
      ...shopCatalog.pass
    ];
    $('bannerFeatured').innerHTML = featuredItems.map(it => renderShopBanner(it, state)).join('');
    const regularItems = visibleBundle.filter(it => it.regular);
    $('bannerRegular').innerHTML = regularItems.length
      ? regularItems.map(it => renderShopBanner(it, state)).join('')
      : '<div style="color:var(--muted);font-size:12px;text-align:center;padding:24px;letter-spacing:1px">暂无常驻礼包</div>';
  }
}
