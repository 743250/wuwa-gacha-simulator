// 商店 banner 卡片 · Stage 6.1b
// 纯渲染组件，由 ShopPanel 调用

import { h } from 'preact';
import { buyShop } from '../../../shop/actions.js';

function topupIcon(lun: number): string {
  if (lun >= 6480) return '💎';
  if (lun >= 3280) return '👑';
  if (lun >= 1980) return '🌟';
  if (lun >= 980) return '✨';
  if (lun >= 300) return '🌙';
  return '🌑';
}

function shopIcon(it: any): string {
  if (it.days) return '📅';
  if (it.id?.startsWith('bp_')) return '📡';
  if (it.id?.startsWith('qsfj')) return '🟡';
  if (it.id?.startsWith('qscc')) return '🟢';
  if (it.id?.startsWith('pkbm')) return '🔴';
  if (it.id?.startsWith('pkmy')) return '🟥';
  if (it.id?.startsWith('zsb')) return '📦';
  if (it.id?.startsWith('newbie')) return '🎁';
  return '🎁';
}

export function renderTopupBanner(it: any, S: any): any {
  const first = S.shopFirstTime[it.id];
  const got = it.firstDouble && first ? it.lunite * 2 : it.lunite;
  const badge = it.firstDouble && first
    ? <span class="sb-badge gold">首充翻倍</span>
    : null;
  return (
    <div class="shop-banner topup" key={it.id}>
      <div class="sb-icon">{topupIcon(it.lunite)}</div>
      <div class="sb-body">
        <div class="sb-name">{it.name} {badge}</div>
        <div class="sb-desc">
          购买后获得 <b style={{ color: 'var(--gold)' }}>{got}</b> 月相
          {first && it.firstDouble ? <span style={{ color: 'var(--gold)' }}> · 首充双倍</span> : null}
        </div>
        <div class="sb-cpr" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
          ≈ {(got / 160).toFixed(1)} 抽 · 每元 {(got / it.price).toFixed(0)} 月相
        </div>
      </div>
      <div class="sb-side">
        <div class="sb-price">¥{it.price}</div>
        <button class="mbtn gold" onClick={() => buyShop(it.id)}>购 买</button>
      </div>
    </div>
  );
}

export function renderShopBanner(it: any, S: any): any {
  const used = S.shopBuyCount?.[it.id] || 0;
  const exhausted = it.limit && used >= it.limit;
  const left = it.limit ? Math.max(0, it.limit - used) : 0;
  if (it.id?.startsWith('newbie') && exhausted) return null;

  let limitLabel = '';
  if (it.period === 'month') limitLabel = `每月限购：${left}/${it.limit}`;
  else if (it.period === 'version') limitLabel = `本版本限购：${left}/${it.limit}`;
  else if (it.regular) limitLabel = `本月限购：${left}/${it.limit}（每月刷新）`;
  else if (it.limit) limitLabel = `永久限购：${left}/${it.limit}`;

  const typeClass = it.type || '';
  return (
    <div class={`shop-banner ${typeClass}${exhausted ? ' sold' : ''}`} key={it.id}>
      <div class="sb-icon">{shopIcon(it)}</div>
      <div class="sb-body">
        <div class="sb-name">{it.name}</div>
        <div class="sb-desc" dangerouslySetInnerHTML={{ __html: it.desc }} />
      </div>
      <div class="sb-side">
        <div class="sb-price">¥{it.price}</div>
        {limitLabel ? <div class="sb-limit">{limitLabel}</div> : null}
        <button class="mbtn gold" disabled={exhausted}
          onClick={() => buyShop(it.id)}>
          {exhausted ? '已售罄' : '购 买'}
        </button>
      </div>
    </div>
  );
}
