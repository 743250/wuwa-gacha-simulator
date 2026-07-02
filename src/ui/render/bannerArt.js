import { DAY } from '../../state.js';
import { VERSION_NAMES } from '../../data/phases.js';
import { standard5 } from '../../data/chars.js';
import { poolTitle, targetOptions } from '../../gacha/core.js';
import { escJs } from './utils.js';

export function renderBannerArt(b, kind, state) {
  const pool = b.pool;
  const upText = (() => {
    if (pool === 'collabChar' || pool === 'noviceChoice') return '100% 本期角色';
    if (pool === 'eventChar') return '50% 本期角色';
    if (pool === 'eventWeapon' || pool === 'collabWeapon') return '100% 本期武器';
    if (pool === 'noviceWeapon') return '100% 自选武器（新旅）';
    if (pool === 'standardWeapon') return '100% 自选武器';
    if (pool === 'beginner') return '50 抽内必出五星';
    if (pool === 'standardChar') return '常驻五星';
    return '';
  })();
  const poolBadge = (() => {
    if (pool === 'beginner') {
      const used = state.beginnerPulls || 0;
      return `<div class="pool-badge novice">新手专享 · 累计 ${used}/50 抽用完关闭</div>`;
    }
    if (pool === 'noviceChoice' || pool === 'noviceWeapon') {
      const d = (typeof window.__noviceRemainDays === 'function') ? window.__noviceRemainDays() : 30;
      return `<div class="pool-badge novice">新人限时 · 剩余 ${d} 天 · 首五星 100% 命中</div>`;
    }
    if (pool === 'standardChar') return `<div class="pool-badge perm">永久常驻 · 5 选 1 等概率</div>`;
    if (pool === 'standardWeapon') return `<div class="pool-badge perm">永久常驻 · 100% 出自选武器</div>`;
    if (pool === 'collabChar' || pool === 'collabWeapon') return `<div class="pool-badge collab">联动版本限定</div>`;
    if (pool === 'eventChar' || pool === 'eventWeapon') return `<div class="pool-badge event">活动期间限定</div>`;
    return '';
  })();
  const headline = kind === 'weapon' ? b.weapon : (b.char || '常驻共鸣者');
  const subline = kind === 'weapon'
    ? (b.char ? `同期共鸣者 <b>${b.char}</b>` : `当前定向 <b>${b.weapon}</b>${b.weaponBanner ? ' · ' + b.weaponBanner : ''}`)
    : (b.pool === 'noviceChoice' ? `当前目标 <b>${b.char}</b>` : (b.weapon ? `同期武器 <b>${b.weapon}</b>` : '常驻五星角色池'));
  const remainDays = Math.max(0, Math.ceil((b.end - state.today) / DAY));
  let periodLine = b.end === Infinity ? '长期开放' : '活动卡池';
  let remainingLine = b.end === Infinity ? '' : '剩余 <b style="color:var(--accent)">' + remainDays + '</b> 天';
  if (b.pool === 'noviceChoice' || b.pool === 'noviceWeapon') {
    const d = (typeof window.__noviceRemainDays === 'function') ? window.__noviceRemainDays() : 30;
    periodLine = '新旅期限 · 共 30 天';
    remainingLine = `剩余 <b style="color:var(--gold)">${d}</b> 天<br><span style="font-size:9px;color:var(--muted)">首次唤取后开始计时</span>`;
  }
  const standardListHtml = (pool === 'standardChar' || pool === 'beginner')
    ? `<div class="ba-standard-list">
        <div class="bsl-title">${pool === 'beginner' ? '五星池 · 海上共潮生 5 选 1' : '常驻五星 · 5 选 1 等概率'}</div>
        <div class="bsl-row">${standard5.map(c => `<span class="bsl-chip">${c}</span>`).join('')}</div>
      </div>`
    : '';

  return {
    className: 'banner-art ' + (kind === 'weapon' ? 'theme-l' : 'theme-r'),
    html: `
      <div class="ba-main">
        <div class="ba-sub">${poolTitle(b)} · ${b.version} · ${VERSION_NAMES[b.version] || ''}</div>
        <div class="ba-name${headline.length > 5 ? ' small' : ''}">${headline}</div>
        <div class="ba-banner">「${b.banner}」</div>
        ${poolBadge}
        <div class="ba-weapon">${subline}</div>
        <div class="ba-fours"><b>四 星</b> ${b.fours.join(' · ')}</div>
        ${standardListHtml}
        ${targetOptions(b)}
        ${bannerPreviewButtons(b, kind)}
      </div>
      <div class="ba-meta">
        <div class="ba-up">${upText}</div>
        <div class="ba-period">${periodLine}</div>
        <div class="ba-remaining">${remainingLine}</div>
      </div>`
  };
}

function bannerPreviewButtons(b, kind) {
  if (!b) return '';
  const buttons = [];
  if (b.char) {
    buttons.push(`<button class="mbtn gold" onclick="event.stopPropagation();window.openRolePreview('${escJs(b.char)}')">查看 ${b.char}</button>`);
  }
  if (kind === 'weapon' && b.weapon) {
    buttons.push(`<button class="mbtn" onclick="event.stopPropagation();window.__openWeaponInfo('${escJs(b.weapon)}')">查看武器</button>`);
  }
  if ((b.pool === 'standardChar' || b.pool === 'beginner') && !b.char) {
    buttons.push(`<button class="mbtn" onclick="event.stopPropagation();window.__openStandardRolePreview()">查看常驻五星</button>`);
  }
  if (!buttons.length) return '';
  return `<div class="ba-preview-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${buttons.join('')}</div>`;
}
