// 商店面板 · Stage 6.1b
// 接管 #paneShop（viewStorage tab 内的商店视图）
// 含钱包、分类 tab、特惠/常驻/月相三区

import { h, Fragment } from 'preact';
import { signal } from '@preact/signals';
import { useS } from '../../signals';
import { shopCatalog } from '../../../shop/actions.js';
import { isCollabActive } from '../../../gacha/core.js';
import { renderTopupBanner, renderShopBanner } from './ShopBanner';

export const shopCatSignal = signal('featured');

export function ShopPanel() {
  const S = useS();
  const cat = shopCatSignal.value;
  const collabActive = isCollabActive();

  const visibleBundle = shopCatalog.bundle.filter((it: any) => !it.collab || collabActive);

  // featured: monthly + non-regular bundle + pass
  const featuredItems = [
    ...shopCatalog.monthly,
    ...visibleBundle.filter((it: any) => !it.regular),
    ...shopCatalog.pass,
  ];

  const regularItems = visibleBundle.filter((it: any) => it.regular);

  return (
    <Fragment>
      <h2 class="col-head" style={{ marginTop: 0 }}>钱 包</h2>
      <div class="shop-bar">
        <div class="sb spent">
          <div class="l">累计充值</div>
          <div class="v" id="kSpent">¥{S.spent}</div>
        </div>
        <div class="sb lun">
          <div class="l">月相库存</div>
          <div class="v" id="kLunite">{S.lunite}</div>
        </div>
        <div class="sb days">
          <div class="l">月卡剩余</div>
          <div class="v" id="kDays">{S.days}</div>
        </div>
      </div>

      {/* 商店分类 tab */}
      <div class="shop-cat-tabs">
        <button class={`sct${cat === 'featured' ? ' on' : ''}`} onClick={() => { shopCatSignal.value = 'featured'; }}>
          特惠专区
        </button>
        <button class={`sct${cat === 'regular' ? ' on' : ''}`} onClick={() => { shopCatSignal.value = 'regular'; }}>
          常驻礼包
        </button>
        <button class={`sct${cat === 'topup' ? ' on' : ''}`} onClick={() => { shopCatSignal.value = 'topup'; }}>
          凝刻月相
        </button>
      </div>

      {/* 特惠专区 */}
      <div class="shop-cat" id="scFeatured" style={{ display: cat === 'featured' ? '' : 'none' }}>
        <div class="shop-banners" id="bannerFeatured">
          {featuredItems.map((it: any) => renderShopBanner(it, S))}
        </div>
      </div>

      {/* 常驻礼包 */}
      <div class="shop-cat" id="scRegular" style={{ display: cat === 'regular' ? '' : 'none' }}>
        <div class="shop-banners" id="bannerRegular">
          {regularItems.length > 0
            ? regularItems.map((it: any) => renderShopBanner(it, S))
            : <div style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center', padding: '24px', letterSpacing: '1px' }}>
                暂无常驻礼包
              </div>
          }
        </div>
      </div>

      {/* 凝刻月相 */}
      <div class="shop-cat" id="scTopup" style={{ display: cat === 'topup' ? '' : 'none' }}>
        <div class="shop-banners topup-grid" id="bannerTopup">
          {shopCatalog.topup.map((it: any) => renderTopupBanner(it, S))}
        </div>
      </div>
    </Fragment>
  );
}
