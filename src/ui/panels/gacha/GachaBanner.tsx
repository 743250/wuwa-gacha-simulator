// 卡池 banner 区域 · Stage 6.1b
// 挂载到 .banner-wrap，用 fragment 保持子节点平铺

import { h, Fragment } from 'preact';
import { useS } from '../../signals';
import { activeBanners, cur, poolKind, poolTitle, targetOptions, noviceRemainDays } from '../../../gacha/core.js';
import { selectTarget, selectBanner } from '../../../gacha/actions.js';
import { DAY } from '../../../state.js';
import { VERSION_NAMES } from '../../../data/phases.js';
import { standard5 } from '../../../data/chars.js';
import { openRolePreview } from '../../../ui/render/roleModal.js';

function tabTag(x: any): string {
  if (x.pool === 'beginner') return '新手';
  if (x.pool === 'noviceChoice') return '新旅 · 角色';
  if (x.pool === 'noviceWeapon') return '新旅 · 武器';
  if (x.pool === 'standardChar' || x.pool === 'standardWeapon') return '常驻';
  const kind = poolKind(x.pool);
  let tag = kind === 'weapon' ? '武器' : '角色';
  if (x.pool === 'eventChar' || x.pool === 'eventWeapon') return tag + ' · 限定';
  if (x.pool === 'collabChar' || x.pool === 'collabWeapon') return tag + ' · 联动';
  return tag;
}

export function GachaBanner() {
  const S = useS();
  const bs = activeBanners();
  const b = cur();

  // No banners → empty state
  if (bs.length === 0 || !b) {
    return (
      <Fragment>
        <div class="banner-tabs" id="bnTabs"></div>
        <div class="banner-art" id="bnArt">
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
            当前日期没有开放卡池
          </div>
        </div>
      </Fragment>
    );
  }

  const kind = poolKind(b.pool);
  const pool = b.pool;

  const upText = (() => {
    if (pool === 'collabChar') return '100% 本期角色';
    if (pool === 'eventChar' || pool === 'noviceChoice') return '50% 本期角色';
    if (pool === 'eventWeapon' || pool === 'collabWeapon') return '100% 本期武器';
    if (pool === 'noviceWeapon') return '100% 自选武器（新旅）';
    if (pool === 'standardWeapon') return '100% 自选武器';
    if (pool === 'beginner') return '50 抽内必出五星';
    if (pool === 'standardChar') return '常驻五星';
    return '';
  })();

  const poolBadge = (() => {
    if (pool === 'beginner') {
      const used = S.beginnerPulls || 0;
      return <div class="pool-badge novice">新手专享 · 累计 {used}/50 抽用完关闭</div>;
    }
    if (pool === 'noviceChoice' || pool === 'noviceWeapon') {
      const d = noviceRemainDays();
      const rule = pool === 'noviceChoice' ? '50% 自选角色' : '100% 自选武器';
      return <div class="pool-badge novice">新人限时 · 剩余 {d} 天 · {rule}</div>;
    }
    if (pool === 'standardChar') return <div class="pool-badge perm">永久常驻 · 5 选 1 等概率</div>;
    if (pool === 'standardWeapon') return <div class="pool-badge perm">永久常驻 · 100% 出自选武器</div>;
    if (pool === 'collabChar' || pool === 'collabWeapon') return <div class="pool-badge collab">联动版本限定</div>;
    if (pool === 'eventChar' || pool === 'eventWeapon') return <div class="pool-badge event">活动期间限定</div>;
    return null;
  })();

  const headline = kind === 'weapon' ? b.weapon : (b.char || '常驻共鸣者');

  const sublineParts = (() => {
    if (kind === 'weapon') {
      if (b.char) return <>同期共鸣者 <b>{b.char}</b></>;
      return <>当前定向 <b>{b.weapon}</b>{b.weaponBanner ? ' · ' + b.weaponBanner : ''}</>;
    }
    if (b.pool === 'noviceChoice') return <>当前目标 <b>{b.char}</b></>;
    if (b.weapon) return <>同期武器 <b>{b.weapon}</b></>;
    return <span>常驻五星角色池</span>;
  })();

  const remainDays = Math.max(0, Math.ceil((b.end - S.today) / DAY));
  let periodLine: any = b.end === Infinity ? '长期开放' : '活动卡池';
  let remainingLine: any = null;
  if (b.end !== Infinity) {
    remainingLine = <>剩余 <b style={{ color: 'var(--accent)' }}>{remainDays}</b> 天</>;
  }

  let extraPeriod: any = null;
  if (b.pool === 'noviceChoice' || b.pool === 'noviceWeapon') {
    const d = noviceRemainDays();
    extraPeriod = (
      <>
        新旅期限 · 共 30 天<br />
        剩余 <b style={{ color: 'var(--gold)' }}>{d}</b> 天<br />
        <span style={{ fontSize: '9px', color: 'var(--muted)' }}>首次唤取后开始计时</span>
      </>
    );
  }

  const showStdList = pool === 'standardChar' || pool === 'beginner';
  const stdTitle = pool === 'beginner' ? '五星池 · 海上共潮生 5 选 1' : '常驻五星 · 5 选 1 等概率';

  return (
    <Fragment>
      <div class="banner-tabs" id="bnTabs">
        {bs.map(x => {
          const on = x.id === S.selected ? (' on ' + (poolKind(x.pool) === 'weapon' ? 'w' : 'r')) : '';
          return (
            <div class={`btab${on}`} data-id={x.id}
              onClick={() => { selectBanner(x.id); }}>
              <span class="bt-kind">{tabTag(x)}</span>
              <span class="bt-name">{x.banner}</span>
            </div>
          );
        })}
      </div>
      <div class={'banner-art ' + (kind === 'weapon' ? 'theme-l' : 'theme-r')} id="bnArt">
        <div class="ba-main">
          <div class="ba-sub">{poolTitle(b)} · {b.version} · {VERSION_NAMES[b.version] || ''}</div>
          <div class={'ba-name' + (headline.length > 5 ? ' small' : '')}>{headline}</div>
          <div class="ba-banner">「{b.banner}」</div>
          {poolBadge}
          <div class="ba-weapon">{sublineParts}</div>
          <div class="ba-fours"><b>四 星</b> {b.fours.join(' · ')}</div>
          {showStdList && (
            <div class="ba-standard-list">
              <div class="bsl-title">{stdTitle}</div>
              <div class="bsl-row">{standard5.map(c => <span class="bsl-chip">{c}</span>)}</div>
            </div>
          )}
          {(() => {
            const t = targetOptions(b);
            if (!t) return null;
            if (t.locked) {
              return (
                <div class="ba-weapon" style={{ marginTop: '10px', fontSize: '12px', color: 'var(--gold)', letterSpacing: '1px' }}>
                  已选定：<b>{t.locked}</b>（开始抽取后不可更改）
                </div>
              );
            }
            return (
              <div class="ba-weapon" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                {t.opts.map(o => (
                  <button class={`mbtn ${o.active ? 'gold' : ''}`} onClick={() => selectTarget(t.pool, o.target)}>{o.label}</button>
                ))}
              </div>
            );
          })()}
          <BannerPreviewButtons b={b} kind={kind} />
        </div>
        <div class="ba-meta">
          <div class="ba-up">{upText}</div>
          {extraPeriod ? (
            <div class="ba-period">{extraPeriod}</div>
          ) : (
            <>
              <div class="ba-period">{periodLine}</div>
              {remainingLine && <div class="ba-remaining">{remainingLine}</div>}
            </>
          )}
        </div>
      </div>
    </Fragment>
  );
}

function BannerPreviewButtons({ b, kind }: any) {
  if (!b) return null;
  const buttons: any[] = [];
  if (b.char) {
    buttons.push(
      <button class="mbtn gold" onClick={(e: any) => { e.stopPropagation(); openRolePreview(b.char); }}>
        查看 {b.char}
      </button>
    );
  }
  if (!buttons.length) return null;
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
      {buttons}
    </div>
  );
}
