// 渲染主入口
import { S, DAY, fmt, $ } from '../state.js';
import { activePhase, activeBanners, cur, poolKind, poolTitle, tideKey, tideName, tideLetter, targetOptions, isCollabActive } from '../gacha/core.js';
import { shopCatalog } from '../shop/actions.js';
import { seqText } from '../data/seq.js';
import { standard5, fourAll, weapons as characterWeapons } from '../data/chars.js';
import { openModal } from '../modal.js';
import { upgrade } from '../gacha/core.js';
import { saveState } from '../save.js';
import { computeBattleStats, calcBP, expToNext, weaponToNext } from '../battle/stats.js';
import { getMeta } from '../battle/template.js';
import { WEAPON_DATA } from '../equip/weapons.js';
import { levelUpRole, levelUpRoleMax, levelUpWeapon, levelUpWeaponMax, equipWeapon, unequipWeapon, getEquippableWeapons, totalExp } from '../equip/actions.js';
import { getForte } from '../battle/forte.js';
import { getOverrideMeta, hasChainOverride } from '../battle/chains.js';
import { attachTermTips } from './terms.js';
import { msg } from '../state.js';

export function render() {
  const aps = activePhase(), bs = activeBanners(), b = cur();

  // 顶部全局资源
  const gres = [
    { c: 'ast', l: '星声', v: S.astrite.toLocaleString(), k: 'astrite' },
    { c: 'lun', l: '月相', v: S.lunite, k: 'lunite' },
    { c: 'r', l: '浮金', v: S.radiant, k: 'radiant' },
    { c: 'f', l: '铸潮', v: S.forging, k: 'forging' },
    { c: 'l', l: '唤声', v: S.lustrous, k: 'lustrous' }
  ];
  if (S.days > 0) gres.push({ c: 'day', l: '月卡', v: S.days + '天' });
  gres.push({ c: 'day', l: '体力', v: `${S.stamina}/${S.staminaMax}`, k: 'stamina' });
  $('gres').innerHTML = gres.map(x => `<span class="gtag ${x.c}"><span class="dot"></span>${x.l} <b>${x.v}</b>${x.k ? `<button class="plus" onclick="${x.k === 'stamina' ? 'openStaminaModal' : 'openTopup'}('${x.k}')" title="${x.k === 'stamina' ? '嗑药剂回复体力' : '兑换/补充'}">+</button>` : ''}</span>`).join('');

  // 时间
  $('dateNow').textContent = fmt(S.today);
  const vs = aps.map(p => p.v).filter((v, i, a) => a.indexOf(v) === i).join(' · ') || '无';
  $('dateMeta').textContent = `版本 ${vs} · 开放卡池 ${bs.length}`;

  // 卡池横向 Tab
  if (bs.length) {
    $('bnTabs').innerHTML = bs.map(x => {
      const kind = poolKind(x.pool);
      const on = x.id === S.selected ? (' on ' + (kind === 'weapon' ? 'w' : 'r')) : '';
      let tag = '角色';
      if (kind === 'weapon') tag = '武器';
      if (x.pool === 'beginner') tag = '新手';
      else if (x.pool === 'noviceChoice') tag = '新旅 · 角色';
      else if (x.pool === 'noviceWeapon') tag = '新旅 · 武器';
      else if (x.pool === 'standardChar' || x.pool === 'standardWeapon') tag = '常驻';
      else if (x.pool === 'eventChar' || x.pool === 'eventWeapon') tag = tag + ' · 限定';
      else if (x.pool === 'collabChar' || x.pool === 'collabWeapon') tag = tag + ' · 联动';
      return `<div class="btab${on}" data-id="${x.id}"><span class="bt-kind">${tag}</span><span class="bt-name">${x.banner}</span></div>`;
    }).join('');
    $('bnTabs').querySelectorAll('.btab').forEach(el => el.onclick = () => {
      S.selected = el.dataset.id;
      render();
    });

    // banner art
    const pool = b.pool, kind = poolKind(pool);
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
    // 池子性质 badge（新增）
    const poolBadge = (() => {
      if (pool === 'beginner') {
        const used = S.beginnerPulls || 0;
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
    const remainDays = Math.max(0, Math.ceil((b.end - S.today) / DAY));
    // 卡池剩余天数显示（不再显示具体日期，避免界面太啰嗦）
    let periodLine = b.end === Infinity ? '长期开放' : '活动卡池';
    let remainingLine = b.end === Infinity ? '' : '剩余 <b style="color:var(--accent)">' + remainDays + '</b> 天';
    if (b.pool === 'noviceChoice' || b.pool === 'noviceWeapon') {
      const d = (typeof window.__noviceRemainDays === 'function') ? window.__noviceRemainDays() : 30;
      periodLine = '新旅期限 · 共 30 天';
      remainingLine = `剩余 <b style="color:var(--gold)">${d}</b> 天<br><span style="font-size:9px;color:var(--muted)">首次唤取后开始计时</span>`;
    }
    // 常驻五星名单 + 万象新声 5 选 1 名单（永久常驻 & 新手池都用 standard5）
    const standardListHtml = (pool === 'standardChar' || pool === 'beginner')
      ? `<div class="ba-standard-list">
          <div class="bsl-title">${pool === 'beginner' ? '五星池 · 海上共潮生 5 选 1' : '常驻五星 · 5 选 1 等概率'}</div>
          <div class="bsl-row">${standard5.map(c => `<span class="bsl-chip">${c}</span>`).join('')}</div>
        </div>`
      : '';

    $('bnArt').className = 'banner-art ' + (kind === 'weapon' ? 'theme-l' : 'theme-r');
    $('bnArt').innerHTML = `
      <div class="ba-main">
        <div class="ba-sub">${poolTitle(b)} · ${b.version}</div>
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
      </div>`;
  } else {
    $('bnTabs').innerHTML = '';
    $('bnArt').innerHTML = '<div style="text-align:center;color:var(--muted);padding:40px 0">当前日期没有开放卡池</div>';
  }

  // 抽卡区
  if (b) {
    const pool = b.pool, tk = tideKey(pool), tn = tideName(pool), letter = tideLetter(pool);
    const tideHave = S[tk] || 0;
    const astHave = S.astrite;
    const lunHave = S.lunite;
    const priced10 = pool === 'beginner' ? 8 : 10;
    const tideUsed10 = Math.min(priced10, tideHave);
    const astUsed10 = (priced10 - tideUsed10) * 160;
    const lunNeed10 = Math.max(0, astUsed10 - astHave);
    const can1 = tideHave >= 1 || astHave + lunHave >= 160;
    const can10 = tideHave + Math.floor((astHave + lunHave) / 160) >= priced10 && !(pool === 'beginner' && S.beginnerDone);
    const maxPulls = tideHave + Math.floor(astHave / 160);
    const maxPullsWithLunite = tideHave + Math.floor((astHave + lunHave) / 160);

    $('costPanel').innerHTML = `
      <div class="cost tide ${letter}">
        <div class="lbl">${tn}</div>
        <div class="val"><b>${tideHave}</b><span class="u">个</span></div>
        <div class="sub">十连消耗 ${tideUsed10} 个${pool === 'beginner' ? '（八折）' : ''}</div>
      </div>
      <div class="cost ast">
        <div class="lbl">星 声</div>
        <div class="val"><b>${astHave.toLocaleString()}</b></div>
        <div class="sub">十连补 ${astUsed10.toLocaleString()} 星声</div>
      </div>
      <div class="cost can">
        <div class="lbl">合计可抽</div>
        <div class="val"><b>${maxPulls}</b><span class="u">次</span></div>
        <div class="sub">含月相 ${maxPullsWithLunite} 次</div>
      </div>`;

    $('pull1').disabled = !can1 || pool === 'beginner';
    $('pull10').disabled = !can10;
    $('toFive').disabled = !can1 || pool === 'beginner';
    $('lbl1').textContent = `× 1 · ${tideHave > 0 ? '消耗 1 ' + tn : '消耗 160 星声'}`;
    $('lbl10').textContent = `× 10 · 消耗 ${tideUsed10 > 0 ? tideUsed10 + ' ' + tn : ''}${astUsed10 > 0 ? (tideUsed10 > 0 ? ' + ' : '') + Math.min(astUsed10, astHave).toLocaleString() + ' 星声' : ''}${lunNeed10 > 0 ? ' + ' + lunNeed10.toLocaleString() + ' 月相' : ''}`;

    // 保底
    const pkey = pool;
    const pity = S.pity[pkey];
    const hard = pool === 'beginner' ? 50 : 80;
    let gtxt = '', gcls = '';
    if (pool === 'eventChar') {
      if (S.g[pkey]) { gtxt = '下个五星必为本期角色'; gcls = 'guar'; }
      else gtxt = '下个五星 50% 为本期角色';
    } else if (pool === 'collabChar' || pool === 'noviceChoice') {
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
    $('pityRow').innerHTML = `
      <div>
        <div class="pl">五 星 进 度</div>
        <div class="pv"><b>${pity}</b> / ${hard}</div>
      </div>
      <div class="pity-bar"><i style="width:${Math.min(100, pity / hard * 100)}%"></i></div>
      <span class="pity-tag ${gcls}">${gtxt}</span>`;
  } else {
    $('costPanel').innerHTML = '';
    $('pityRow').innerHTML = '<div style="color:var(--muted);font-size:12px;letter-spacing:1px;text-align:center;width:100%">推进日期到开放期才能唤取</div>';
    ['pull1', 'pull10', 'toFive'].forEach(id => $(id).disabled = true);
  }

  // 统计
  $('sTotal').textContent = S.total;
  $('sFive').textContent = S.five;
  $('sFour').textContent = S.four;
  $('sAvg').textContent = S.five ? (S.total / S.five).toFixed(1) : '-';
  $('sUp').textContent = S.upHits;
  $('sWave').textContent = Object.values(S.waveBuy).reduce((a, b) => a + b, 0);
  const curPool = b ? b.pool : 'eventChar';
  const charPityPool = poolKind(curPool) === 'char' ? curPool : 'eventChar';
  const weapPityPool = poolKind(curPool) === 'weapon' ? curPool : 'eventWeapon';
  $('sCharPity').textContent = S.pity[charPityPool] || 0;
  $('sWeapPity').textContent = S.pity[weapPityPool] || 0;
  // 收藏统计（已拥有的角色/武器）
  const roleArr = Object.values(S.roles || {}).filter(r => r.owned > 0);
  const role5 = roleArr.filter(r => r.r === 5).length;
  const role4 = roleArr.filter(r => r.r === 4).length;
  const weaponArr = Object.values(S.weapons || {});
  const weapon5 = weaponArr.filter(w => w.r === 5).length;
  const weapon4 = weaponArr.filter(w => w.r === 4).length;
  $('sRoles').textContent = roleArr.length;
  $('sWeapons').textContent = weaponArr.length;
  const cd = $('sCollectionDetail');
  if (cd) cd.innerHTML = `角色 ★5 × <b style="color:var(--gold)">${role5}</b> · ★4 × <b style="color:var(--purple)">${role4}</b><br>武器 ★5 × <b style="color:var(--gold)">${weapon5}</b> · ★4 × <b style="color:var(--purple)">${weapon4}</b>`;

  // 海市
  $('cAg').textContent = S.afterglow;
  $('cOs').textContent = S.oscillated;
  $('cAgHint').textContent = `可换 ${Math.floor(S.afterglow / 8)} 抽`;
  $('cOsHint').textContent = `可换 ${Math.floor(S.oscillated / 70)} 抽`;
  const tides = [['radiant', '浮金波纹'], ['forging', '铸潮波纹'], ['lustrous', '唤声波纹']];
  // 联动期：把联动波纹也加入兑换列表（#7 #9）
  if (isCollabActive()) {
    tides.push(['dream', '捕梦波纹'], ['mirage', '铭影波纹']);
  }
  $('exList').innerHTML = tides.map(([k, n]) => {
    const agMax = Math.floor(S.afterglow / 8);
    const osLeft = 7 - (S.oscBuy[k] || 0);
    const osMax = Math.min(Math.floor(S.oscillated / 70), osLeft);
    return `<div class="exch">
      <div class="n"><span>${n}</span><span class="own">持有 <b>${S[k]||0}</b> 个</span></div>
      <div class="btns">
        <button class="mbtn" onclick="openExchangeModal('${k}','${n}','afterglow')" ${agMax <= 0 ? 'disabled' : ''}>余 波 · 最多 ${agMax}</button>
        <button class="mbtn gold" onclick="openExchangeModal('${k}','${n}','oscillated')" ${osMax <= 0 ? 'disabled' : ''}>残 振 · 剩 ${osLeft}/7</button>
      </div>
    </div>`;
  }).join('');

  if (b && b.char && (b.pool === 'eventChar' || b.pool === 'collabChar' || b.pool === 'noviceChoice')) {
    const std = standard5.some(x => x.startsWith(b.char)), cost = std ? 270 : 360, used = S.waveBuy[b.char] || 0;
    const can = Math.min(2 - used, Math.floor(S.afterglow / cost));
    $('waveList').innerHTML = `<div class="exch">
      <div class="n"><span>${b.char}的回音频段</span><span class="own">已购 <b>${used}</b> / 2</span></div>
      <div class="btns">
        <button class="mbtn gold" onclick="openWaveModal()" ${can <= 0 ? 'disabled' : ''}>余波 ${cost} / 个 · 可换 ${can}</button>
      </div>
    </div>`;
  } else {
    $('waveList').innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:12px;letter-spacing:1px">无可用卡池</div>';
  }

  // 商店
  $('kSpent').textContent = '¥' + S.spent;
  $('kLunite').textContent = S.lunite;
  $('kDays').textContent = S.days;

  // 横幅式商店渲染（参考游戏内布局）
  if ($('bannerFeatured')) {
    const collabOn = isCollabActive();
    // 非联动期：把 collab 标记礼包过滤掉
    const visibleBundle = shopCatalog.bundle.filter(it => !it.collab || collabOn);
    // 凝刻月相：6 档充值
    $('bannerTopup').innerHTML = shopCatalog.topup.map(it => renderTopupBanner(it)).join('');
    // 特惠专区：月卡 + 战令 + 限购礼包（非 regular 的 bundle）
    const featuredItems = [
      ...shopCatalog.monthly,
      ...visibleBundle.filter(it => !it.regular),
      ...shopCatalog.pass
    ];
    $('bannerFeatured').innerHTML = featuredItems.map(it => renderShopBanner(it)).join('');
    // 常驻礼包：bundle 中 regular = true 的
    const regularItems = visibleBundle.filter(it => it.regular);
    $('bannerRegular').innerHTML = regularItems.length
      ? regularItems.map(it => renderShopBanner(it)).join('')
      : '<div style="color:var(--muted);font-size:12px;text-align:center;padding:24px;letter-spacing:1px">暂无常驻礼包</div>';
  }

  // 记录
  $('logList').innerHTML = S.log.length ? S.log.map(x => `
    <div class="logrow r${x.r}"><b style="color:var(${x.r === 5 ? '--gold' : x.r === 4 ? '--purple' : '--blue'})">${x.r}★</b>
      <span>${x.n}${x.up ? ' <span style="color:var(--gold);font-size:10px;letter-spacing:1px">提升</span>' : ''}</span>
      <span class="dt">${x.date}<br>#${x.no}</span></div>`).join('') : '<div style="text-align:center;color:var(--muted);padding:20px;font-size:12px;letter-spacing:1px">暂无记录</div>';

  renderRoles();
  // 每次渲染后自动存档（防抖 1 秒）
  saveState();
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

function escJs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function roleRarity(n) {
  return standard5.includes(n) || Object.prototype.hasOwnProperty.call(characterWeapons, n) ? 5 : (fourAll.includes(n) ? 4 : 5);
}

function makePreviewRole(n) {
  return {
    n,
    r: roleRarity(n),
    owned: 0,
    chain: 0,
    spare: 0,
    bought: 0,
    pulled: 0,
    level: 90,
    exp: 0,
    equipWeapon: null,
    skillLevels: { 普攻: 1, 技能: 1, 解放: 1, 回路: 1 },
    preview: true
  };
}

function getRoleForModal(n) {
  return S.roles[n] || makePreviewRole(n);
}

function withPreviewRole(n, fn) {
  if (S.roles[n]) return fn();
  S.roles[n] = makePreviewRole(n);
  try { return fn(); }
  finally { delete S.roles[n]; }
}

function computeRoleStatsForModal(n) {
  return withPreviewRole(n, () => computeBattleStats(n));
}

function calcRoleBPForModal(n) {
  return withPreviewRole(n, () => calcBP(n));
}

function renderRoles() {
  const arr = Object.values(S.roles).sort((a, b) => b.r - a.r || (b.level || 1) - (a.level || 1) || a.n.localeCompare(b.n, 'zh'));
  $('roles').innerHTML = arr.length ? arr.map(o => {
    const stars = '★'.repeat(o.r);
    const chainCls = o.chain >= 6 ? 'full' : (o.chain > 0 ? 'has' : '');
    const lv = o.level || 1;
    return `<div class="role r${o.r}" onclick="openRoleModal('${o.n.replace(/'/g, "\\'")}')">
      <div class="chain-badge ${chainCls}">+${o.chain}/6</div>
      ${o.spare > 0 ? `<div class="spare-dot">频段 ${o.spare}</div>` : ''}
      <div class="stars">${stars}</div>
      <div class="rname">${o.n}</div>
      <div style="font-size:9px;color:var(--muted);text-align:center;margin-top:3px;letter-spacing:.5px">LV ${lv}${o.equipWeapon ? ' · 已装备' : ''}</div>
    </div>`;
  }).join('') : '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:30px;font-size:12px;letter-spacing:1px">还没有角色 / 武器</div>';
}

// 角色面板的当前 tab（每次打开重置；切换 tab 时只更新右侧内容、不重建外框）
let _currentRoleTab = 'basic';
let _currentRoleName = null;
let _currentRolePreview = false;

export function openRoleModal(n) {
  _currentRoleName = n;
  _currentRolePreview = false;
  _currentRoleTab = 'basic';
  renderRoleModal(false);
}

export function openRolePreview(n) {
  _currentRoleName = n;
  _currentRolePreview = true;
  _currentRoleTab = 'basic';
  renderRoleModal(true);
}

window.openRolePreview = openRolePreview;

window.__openStandardRolePreview = () => {
  const buttons = standard5.map(n => `<button class="mbtn gold" style="margin:4px;min-width:90px" onclick="window.openRolePreview('${escJs(n)}')">${n}</button>`).join('');
  openModal({
    title: '常驻五星角色预览',
    body: `<div style="color:var(--muted);font-size:12px;margin-bottom:10px">这些角色都可能从当前角色池抽到，可先查看技能与共鸣链。</div><div style="text-align:center">${buttons}</div>`,
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
};

// 重新打开角色面板（在弹窗被自动关闭后用，例如激活共鸣链）
function reopenRoleModal() {
  if (_currentRoleName) renderRoleModal();
}
window.__reopenRoleModal = reopenRoleModal;

// 计算当前 tab 的 HTML 片段（不含外框 / sidebar）
function renderRoleTabContent(tabId, preview = false) {
  const n = _currentRoleName;
  const o = getRoleForModal(n); if (!o) return '';
  const base = o.n.split(' / ')[0];
  const meta = getMeta(n);
  const stats = computeRoleStatsForModal(n);
  const bp = calcRoleBPForModal(n);
  const expNext = expToNext(o);
  const wName = preview ? null : o.equipWeapon;
  const wObj = wName ? S.weapons[wName] : null;
  const wInfo = preview ? '未装备武器' : (wObj ? `${wName} · LV${wObj.level} · 精${wObj.refine}` : '未装备');
  const previewNote = preview ? '<div style="margin-bottom:10px;padding:8px 10px;border:1px solid rgba(245,207,107,.35);border-radius:8px;background:rgba(245,207,107,.06);color:var(--gold);font-size:11px;line-height:1.6">角色档案：展示 90 级 / 0 链 / 未装备武器时的参考面板。</div>' : '';

  if (tabId === 'basic') {
    return `
      ${previewNote}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
        <div style="border:1px solid var(--line);border-radius:8px;padding:8px;background:rgba(255,255,255,.02);text-align:center">
          <div style="font-size:9px;color:var(--muted);letter-spacing:2px">等级</div>
          <div style="font-size:18px;font-weight:700;margin-top:2px"><b>LV ${o.level}</b> / 90</div>
        </div>
        <div style="border:1px solid var(--line);border-radius:8px;padding:8px;background:rgba(245,207,107,.04);text-align:center">
          <div style="font-size:9px;color:var(--muted);letter-spacing:2px">战力</div>
          <div style="font-size:18px;font-weight:700;margin-top:2px;color:var(--gold)">${bp.toLocaleString()}</div>
        </div>
      </div>
      <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02)">
        <div style="font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:8px">面 板 属 性</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--muted);line-height:1.8">
          <div>💚 生命 <b style="color:var(--green);float:right">${stats.hp.toLocaleString()}</b></div>
          <div>⚔ 攻击 <b style="color:var(--red);float:right">${stats.atk.toLocaleString()}</b></div>
          <div>🛡 防御 <b style="color:var(--blue);float:right">${stats.def.toLocaleString()}</b></div>
          <div>⚡ 能量 <b style="color:var(--accent);float:right">${stats.maxEnergy}</b></div>
          <div>✦ 暴击 <b style="color:var(--gold);float:right">${(stats.crate*100).toFixed(1)}%</b></div>
          <div>✦ 暴伤 <b style="color:var(--gold);float:right">${((stats.cdmg-1)*100).toFixed(0)}%</b></div>
          <div>💨 闪避 <b style="color:#8de6a6;float:right">${((stats.dodge||0)*100).toFixed(0)}%</b></div>
          <div>🎵 共鸣效率 <b style="color:#c39bff;float:right">${(100+(stats.resonanceBonus||0)*100).toFixed(1)}%</b></div>
        </div>
      </div>
      <div style="margin-top:10px;padding:9px 11px;border:1px solid var(--line);border-radius:8px;background:rgba(141,230,166,.03);font-size:11px;color:var(--muted);line-height:1.6">
        <div style="color:var(--accent);font-size:10px;letter-spacing:1px;margin-bottom:3px">💡 闪避率</div>
        敌方攻击时按此概率躲避。主C 18% / 副C 14% / 辅助 10% / 治疗 8%
      </div>`;
  }
  if (tabId === 'weapon') {
    return `
      <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02)">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <span style="font-size:9px;color:var(--muted);letter-spacing:2px">装 备 武 器</span>
          <span style="font-size:10px;padding:2px 8px;border:1px solid var(--line2);color:var(--muted);border-radius:999px">${meta.weaponType}</span>
        </div>
        <div style="font-size:13px;font-weight:700;color:${wName ? 'var(--gold)' : 'var(--dim)'}">${wInfo}</div>
        ${preview ? '<div style="font-size:10px;color:var(--gold);margin-top:8px">未持有时仅显示适配武器类型。</div>' : (wName && WEAPON_DATA[wName] ? renderWeaponDetail(wName, wObj) : '<div style="font-size:10px;color:var(--dim);margin-top:8px">点击下方"装备"选择匹配的武器</div>')}
        <div style="display:flex;gap:5px;margin-top:10px;flex-wrap:wrap">
          <button class="mbtn" onclick="openWeaponPicker('${n.replace(/'/g, "\\'")}')" ${preview ? 'disabled' : ''}>${preview ? '未持有' : (wName ? '换装' : '装备')}</button>
          ${!preview && wName ? `<button class="mbtn" onclick="window.__doUnequip('${n.replace(/'/g, "\\'")}')">卸下</button>` : ''}
          ${!preview && wName && wObj.level < 90 ? `<button class="mbtn gold" onclick="window.__levelUpWeapon('${wName.replace(/'/g, "\\'")}')">武器升级 (${weaponToNext(wObj)} 石)</button>` : ''}
          ${!preview && wName && wObj.level < 90 ? `<button class="mbtn" onclick="window.__levelUpWeaponMax('${wName.replace(/'/g, "\\'")}')">升满</button>` : ''}
        </div>
        <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:10px">武器石库存 <b style="color:var(--gold)">${S.materials.weapon_book}</b></div>
      </div>`;
  }
  if (tabId === 'chain') {
    const canUp = !preview && o.spare > 0 && o.chain < 6;
    const usingOverride = hasChainOverride(base);
    const seqLines = usingOverride
      ? Array.from({ length: 6 }, (_, i) => {
          const meta = getOverrideMeta(base, i) || {};
          return {
            name: meta.title || (`第 ${i+1} 链`),
            desc: attachTermTips(meta.desc || '')
          };
        })
      : (seqText[base] || []).map(s => ({ name: s[0], desc: attachTermTips(highlightChainTerms(s[1])) }));
    return `
      ${previewNote}
      <div style="font-size:11px;color:var(--muted);letter-spacing:.5px;text-align:center;margin:0 0 8px">
        共鸣链 <b style="color:var(--gold)">${o.chain}/6</b> · 回音频段 <b style="color:var(--accent)">${o.spare}</b>${o.bought ? ' · 海市兑换 ' + o.bought + '/2' : ''}
      </div>
      <div class="chain">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i <= o.chain ? 'on' : ''}">${i}链</i>`).join('')}</div>
      <div style="margin:10px 0;text-align:center">
        <button class="mbtn ${canUp ? 'gold' : ''}" onclick="window.__activateChain('${n.replace(/'/g, "\\'")}')" ${canUp ? '' : 'disabled'}>${preview ? '0 链基础效果' : (o.chain >= 6 ? '已满 6 链' : (canUp ? `✦ 激活 ${o.chain + 1} 链（消耗 1 回音频段）` : '无回音频段'))}</button>
      </div>
      ${seqLines.length ? `<div class="seq-detail">
        ${seqLines.map((L, i) => `<div class="seq-line ${i < o.chain ? 'owned' : ''}">
          <b class="seq-name ${i < o.chain ? 'owned' : ''}">${i + 1}链 · ${L.name}</b>
          <div class="seq-desc">${L.desc}</div>
        </div>`).join('')}
      </div>` : '<div style="font-size:11px;color:var(--dim);text-align:center;padding:10px">暂无共鸣链文案</div>'}`;
  }
  if (tabId === 'skill') {
    return previewNote + renderSkillsBlock(n, meta, o);
  }
  if (tabId === 'levelup') {
    if (preview) {
      return `${previewNote}<div style="border:1px solid var(--line);border-radius:8px;padding:18px;background:rgba(255,255,255,.02);color:var(--muted);font-size:12px;text-align:center">未持有角色暂不开放培养。</div>`;
    }
    return `
      ${previewNote}
      <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02);margin-bottom:10px">
        <div style="font-size:9px;color:var(--muted);letter-spacing:2px;margin-bottom:6px">角 色 等 级</div>
        <div style="font-size:20px;font-weight:700;text-align:center;margin-bottom:8px">LV <b style="color:var(--gold)">${o.level}</b> <span style="color:var(--muted);font-size:14px">/ 90</span></div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">
          <button class="mbtn ${totalExp() >= expNext && o.level < 90 ? 'gold' : ''}" onclick="window.__levelUpRole('${n.replace(/'/g, "\\'")}')" ${o.level >= 90 ? 'disabled' : ''} style="flex:1">升 1 级 (${expNext.toLocaleString()} exp)</button>
          <button class="mbtn" onclick="window.__levelUpRoleMax('${n.replace(/'/g, "\\'")}')" ${o.level >= 90 ? 'disabled' : ''} style="flex:1">一键升满</button>
        </div>
      </div>
      <div style="font-size:10px;color:var(--muted);text-align:center;letter-spacing:.5px;line-height:1.8;padding:8px;background:rgba(255,255,255,.02);border-radius:8px">
        <div>共鸣促剂库存</div>
        <div><b style="color:var(--gold)">特</b> ${S.materials.exp_super || 0} · <b style="color:#fff">高</b> ${S.materials.exp_high} · <b style="color:var(--accent)">中</b> ${S.materials.exp_mid} · <b style="color:var(--green)">初</b> ${S.materials.exp_low}</div>
        <div>合计 <b style="color:var(--gold)">${totalExp().toLocaleString()}</b> 经验</div>
      </div>`;
  }
  return '';
}

function renderRoleModal(preview = _currentRolePreview) {
  _currentRolePreview = !!preview;
  const n = _currentRoleName;
  const o = getRoleForModal(n); if (!o) return;
  const stars = '★'.repeat(o.r);
  const meta = getMeta(n);

  const elemColor = {
    '热熔': '#ff8c5e', '湮灭': '#c39bff', '气动': '#8de6a6',
    '冷凝': '#7bd6ff', '衍射': '#fff0b0', '导电': '#b58cff'
  }[meta.element] || '#fff';

  // 5 个 tab 配置
  const TABS = [
    { id: 'basic',  icon: '🧍', label: '基本属性' },
    { id: 'weapon', icon: '⚔', label: '武器' },
    { id: 'chain',  icon: '🔗', label: '共鸣链' },
    { id: 'skill',  icon: '✦', label: '技能介绍' },
    { id: 'levelup',icon: '🎯', label: '突破升级' }
  ];

  const previewTabs = preview ? TABS.filter(t => t.id !== 'levelup') : TABS;
  const content = renderRoleTabContent(_currentRoleTab, preview);

  // 左侧 tab 栏 + 右侧内容（外框结构始终一致 · 切 tab 只换右侧 #roleContent）
  const sidebar = previewTabs.map(t => `
    <div class="role-tab ${_currentRoleTab === t.id ? 'on' : ''}" onclick="window.__switchRoleTab('${t.id}')">
      <span class="rt-icon">${t.icon}</span>
      <span class="rt-lbl">${t.label}</span>
    </div>`).join('');

  const body = `
    <div class="role-modal-wrap">
      <div class="role-sidebar">
        <div class="role-portrait">
          <div style="font-size:28px;font-weight:700;color:${o.r === 5 ? 'var(--gold)' : '#dbc6ff'};letter-spacing:1px">${o.n}</div>
          <div style="font-size:16px;color:${o.r === 5 ? 'var(--gold)' : 'var(--purple)'};letter-spacing:2px;margin-top:7px">${stars}</div>
          <div style="display:flex;gap:7px;justify-content:center;margin-top:10px;flex-wrap:wrap">
            <span style="font-size:14px;padding:3px 10px;border:1px solid ${elemColor};color:${elemColor};border-radius:999px">${meta.element}</span>
            <span style="font-size:14px;padding:3px 10px;border:1px solid var(--line2);color:var(--muted);border-radius:999px">${meta.type}</span>
          </div>
          <div style="font-size:15px;color:var(--muted);margin-top:10px">LV ${o.level} · 链 ${o.chain}/6</div>
        </div>
        ${sidebar}
      </div>
      <div class="role-content" id="roleContent">${content}</div>
    </div>`;

  openModal({
    title: '',
    body,
    className: 'role-modal',
    actions: [
      { cls: 'mbtn', label: '关闭', fn: () => {} }
    ]
  });
}

// 安可技能页：共鸣解放文案白咩/黑咩版本切换（只刷新当前角色页）
window.__encoreBurstMode = window.__encoreBurstMode || 'white';
window.__toggleEncoreBurstMode = () => {
  window.__encoreBurstMode = window.__encoreBurstMode === 'black' ? 'white' : 'black';
  const content = document.getElementById('roleContent');
  if (content) content.innerHTML = renderRoleTabContent(_currentRoleTab, _currentRolePreview);
};

// 切换 tab（onclick 调用）· 不重建外框，只刷新右侧内容与左栏激活态
window.__switchRoleTab = (tabId) => {
  _currentRoleTab = tabId;
  const content = document.getElementById('roleContent');
  if (content) {
    content.innerHTML = renderRoleTabContent(tabId, _currentRolePreview);
  }
  document.querySelectorAll('.role-tab').forEach(el => {
    const lbl = el.querySelector('.rt-lbl')?.textContent;
    const isOn = (tabId === 'basic' && lbl === '基本属性') ||
                 (tabId === 'weapon' && lbl === '武器') ||
                 (tabId === 'chain' && lbl === '共鸣链') ||
                 (tabId === 'skill' && lbl === '技能介绍') ||
                 (tabId === 'levelup' && lbl === '突破升级');
    el.classList.toggle('on', isOn);
  });
};

// 激活共鸣链：不退出角色界面，原地刷新
window.__activateChain = (n) => {
  const o = S.roles[n];
  if (!o || o.spare <= 0 || o.chain >= 6) { msg('无法激活'); return; }
  upgrade(n);
  msg(`激活 ${o.chain} 链`, false);
  // 直接刷新当前 tab 内容（不关闭弹窗）
  const content = document.getElementById('roleContent');
  if (content) content.innerHTML = renderRoleTabContent(_currentRoleTab, _currentRolePreview);
};

window.openRoleModal = openRoleModal;

// 角色升级桥接（不重开 modal，只刷新右侧内容）
function refreshRolePane() {
  const content = document.getElementById('roleContent');
  if (content && _currentRoleName) content.innerHTML = renderRoleTabContent(_currentRoleTab, _currentRolePreview);
}
window.__levelUpRole = (n) => {
  if (levelUpRole(n)) { msg('升级成功', false); refreshRolePane(); render(); }
};
window.__levelUpRoleMax = (n) => {
  const c = levelUpRoleMax(n);
  if (c > 0) { msg(`+${c} 级`, false); refreshRolePane(); render(); }
  else msg('经验书不足');
};
window.__levelUpWeapon = (wn) => {
  if (levelUpWeapon(wn)) {
    msg('武器升级', false);
    refreshRolePane();
    render();
  }
};
window.__levelUpWeaponMax = (wn) => {
  const c = levelUpWeaponMax(wn);
  if (c > 0) {
    msg(`武器 +${c} 级`, false);
    refreshRolePane();
    render();
  }
};
window.__doUnequip = (n) => {
  unequipWeapon(n);
  refreshRolePane();
  render();
};


window.__openWeaponInfo = (weaponName) => {
  const data = WEAPON_DATA[weaponName];
  if (!data) {
    openModal({
      title: weaponName,
      body: '<div style="color:var(--muted);font-size:12px">暂无详细面板。</div>',
      actions: [{ label: '关闭', cls: '', fn: () => {} }]
    });
    return;
  }
  const previewObj = { n: weaponName, r: data.r || 5, level: 90, refine: 1, spareRefine: 0, equippedBy: null };
  openModal({
    title: `武器预览 · ${weaponName}`,
    body: `<div style="font-size:12px;color:var(--muted);margin-bottom:8px">${'★'.repeat(data.r || 5)} · ${data.type || '武器'} · 90 级 · 精炼 1</div>${renderWeaponDetail(weaponName, previewObj)}`,
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
};

// 武器选择器
window.openWeaponPicker = (roleName) => {
  const list = getEquippableWeapons(roleName);
  if (!list.length) {
    openModal({
      title: '没有可装备的武器',
      body: '当前没有适配的武器。',
      actions: [{ label: '关闭', cls: 'primary', fn: () => {} }]
    });
    return;
  }
  // 按星级排序
  list.sort((a, b) => {
    const ra = WEAPON_DATA[a.n]?.r || 0;
    const rb = WEAPON_DATA[b.n]?.r || 0;
    return rb - ra;
  });
  const html = list.map(w => {
    const data = WEAPON_DATA[w.n];
    const r = data?.r || 3;
    const color = r === 5 ? 'var(--gold)' : r === 4 ? 'var(--purple)' : 'var(--blue)';
    const eqBy = w.equippedBy && w.equippedBy !== roleName ? `<span style="color:var(--muted);font-size:10px">（${w.equippedBy}）</span>` : '';
    return `<div style="border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:5px;background:rgba(255,255,255,.02);cursor:pointer" onclick="window.__pickWeapon('${roleName.replace(/'/g, "\\'")}','${w.n.replace(/'/g, "\\'")}')">
      <div style="font-size:12px;font-weight:600;color:${color}">${'★'.repeat(r)} ${w.n} <span style="font-size:10px;color:var(--muted)">LV${w.level} · 精${w.refine}</span> ${eqBy}</div>
      <div style="font-size:10px;color:var(--muted);margin-top:2px">${data?.desc || ''}</div>
    </div>`;
  }).join('');
  openModal({
    title: `为 ${roleName} 选武器`,
    body: `<div style="max-height:340px;overflow-y:auto">${html}</div>`,
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
};

window.__pickWeapon = (roleName, weaponName) => {
  equipWeapon(roleName, weaponName);
  msg(`装备 ${weaponName}`, false);
  // 重弹角色 modal 但保留之前的 tab（武器选择是在武器 tab 内点的）
  _currentRoleName = roleName;
  if (_currentRoleTab !== 'weapon') _currentRoleTab = 'weapon';
  renderRoleModal();
  render();
};
// ===== 商店横幅式渲染（参考游戏内布局） =====
// 凝刻月相 banner（直充档位）
function renderTopupBanner(it) {
  const first = S.shopFirstTime[it.id];
  const got = it.firstDouble && first ? it.lunite * 2 : it.lunite;
  const badge = it.firstDouble && first
    ? '<span class="sb-badge gold">首充翻倍</span>' : '';
  return `<div class="shop-banner topup">
    <div class="sb-icon">${topupIcon(it.lunite)}</div>
    <div class="sb-body">
      <div class="sb-name">${it.name} ${badge}</div>
      <div class="sb-desc">购买后获得 <b style="color:var(--gold)">${got}</b> 月相${first && it.firstDouble ? ' · <span style="color:var(--gold)">首充双倍</span>' : ''}</div>
    </div>
    <div class="sb-side">
      <div class="sb-price">¥${it.price}</div>
      <button class="mbtn gold" onclick="buyShop('${it.id}')">购 买</button>
    </div>
  </div>`;
}

// 礼包/月卡/战令 通用 banner
function renderShopBanner(it) {
  const used = S.shopBuyCount?.[it.id] || 0;
  const exhausted = it.limit && used >= it.limit;
  const left = it.limit ? Math.max(0, it.limit - used) : 0;
  let limitLabel = '';
  if (it.period === 'month') limitLabel = `每月限购：${left}/${it.limit}`;
  else if (it.period === 'version') limitLabel = `本版本限购：${left}/${it.limit}`;
  else if (it.regular) limitLabel = `本月限购：${left}/${it.limit}（每月刷新）`;
  else if (it.limit) limitLabel = `永久限购：${left}/${it.limit}`;
  const typeClass = it.type ? it.type : '';
  return `<div class="shop-banner ${typeClass} ${exhausted ? 'sold' : ''}">
    <div class="sb-icon">${shopIcon(it)}</div>
    <div class="sb-body">
      <div class="sb-name">${it.name}</div>
      <div class="sb-desc">${it.desc}</div>
    </div>
    <div class="sb-side">
      <div class="sb-price">¥${it.price}</div>
      ${limitLabel ? `<div class="sb-limit">${limitLabel}</div>` : ''}
      <button class="mbtn gold" onclick="buyShop('${it.id}')" ${exhausted ? 'disabled' : ''}>${exhausted ? '已售罄' : '购 买'}</button>
    </div>
  </div>`;
}

function topupIcon(lun) {
  if (lun >= 6480) return '💎';
  if (lun >= 3280) return '👑';
  if (lun >= 1980) return '🌟';
  if (lun >= 980) return '✨';
  if (lun >= 300) return '🌙';
  return '🌑';
}

function shopIcon(it) {
  if (it.days) return '📅';
  if (it.id?.startsWith('bp_')) return '📡';
  if (it.id?.startsWith('qsfj')) return '🟡';   // 求索浮金（角色）
  if (it.id?.startsWith('qscc')) return '🟢';   // 求索铸潮（武器）
  if (it.id?.startsWith('pkbm')) return '🔴';   // 叛客捕梦（联动角色）
  if (it.id?.startsWith('pkmy')) return '🟥';   // 叛客铭影（联动武器）
  if (it.id?.startsWith('zsb')) return '📦';    // 准时宝月度
  if (it.id?.startsWith('newbie')) return '🎁'; // 新手
  return '🎁';
}

// 武器详情面板：90 级数值 + 副词条 + 静态被动 + 触发器
function renderWeaponDetail(weaponName, wObj) {
  const data = WEAPON_DATA[weaponName];
  if (!data) return '';
  const lv = wObj?.level || 1;
  const refine = wObj?.refine || 1;
  const scale = 0.20 + (lv - 1) * (0.80 / 89);   // 1 级 = 20%, 90 级 = 100%
  const refineMult = 1 + (refine - 1) * 0.25;

  // 实时攻击 + 副词条数值
  const baseAtk = Math.round(data.atk90 * scale);
  const sub = data.sub;
  const subText = sub ? `${SUB_STAT_LABEL[sub.stat] || sub.stat} ${formatStatValue(sub.stat, sub.value90 * scale)}` : '';

  // 副词条 tooltip：解释计算公式 + 明确不受精炼影响
  let subTip;
  if (sub) {
    if (sub.stat === 'resonance') {
      subTip = `<span class="tip" data-tip='${'<b style=\"color:var(--gold)\">共鸣效率</b><br>提升<b style=\"color:var(--accent)\">共鸣解放充能</b>积累速度。<br>能量值积累 ×(1 + 共鸣效率)。<br>当前 +'+(sub.value90*scale*100).toFixed(1)+'%（90 级满值 '+(sub.value90*100).toFixed(1)+'% × 等级缩放 '+(scale*100).toFixed(1)+'%）。<br><span style=\"color:var(--muted);font-size:10px\">副词条只受等级影响，<b>不受精炼影响</b>；精炼只放大武器被动。</span>'}'>${subText} ⓘ</span>`;
    } else {
      const subName = SUB_STAT_LABEL[sub.stat] || sub.stat;
      const formatted = formatStatValue(sub.stat, sub.value90 * scale);
      const fullVal = formatStatValue(sub.stat, sub.value90);
      const tip = `<b style="color:var(--gold)">${subName}（副词条）</b><br>= 90 级满值 <b>${fullVal}</b> × 等级缩放 <b>${(scale*100).toFixed(1)}%</b><br>= <b style="color:var(--accent)">${formatted}</b><br><span style="color:var(--muted);font-size:10px">副词条只受等级影响，<b>不受精炼影响</b>；精炼只放大武器被动。</span>`;
      subTip = `<span class="tip" data-tip='${tipAttrEsc(tip)}'>${subText} ⓘ</span>`;
    }
  } else {
    subTip = subText;
  }

  // 攻击 tooltip：90 级 × 当前等级缩放
  const atkTip = `<b style="color:var(--gold)">基础攻击公式</b><br>= 90 级满值 <b>${data.atk90}</b> × 等级缩放 <b>${(scale*100).toFixed(1)}%</b><br>= <b style="color:var(--red)">${baseAtk}</b><br><span style="color:var(--muted);font-size:10px">等级 1 = 20% · 等级 90 = 100%（线性）</span>`;

  let html = `<div style="font-size:11px;color:var(--muted);margin-top:5px;line-height:1.6">
    <div style="margin-bottom:6px"><b style="color:var(--text)">基础攻击</b> <span class="tip" data-tip='${tipAttrEsc(atkTip)}'><b style="color:var(--red)">${baseAtk}</b></span>${subText ? ` · ${subTip}` : ''}</div>`;

  // 武器被动名 + 完整官方文案（按精炼度把数值改写）
  if (data.descFull) {
    const passiveName = data.passiveName || '武器被动';
    const refinedDesc = applyRefineToDesc(data.descFull, refineMult);
    html += `<div style="border-top:1px dashed var(--line);padding-top:6px;margin-top:4px">
      <div style="font-size:10px;color:var(--gold);letter-spacing:1.5px;margin-bottom:4px">▸ ${passiveName}${refine > 1 ? ` · 精炼 <b>${refine}</b>/5（数值 ×${refineMult.toFixed(2)}）` : ' · 精炼 1/5'}</div>
      <div style="color:var(--muted);font-size:11px;line-height:1.7">${refinedDesc}</div>
    </div>`;
    // 战斗内实际数值（精炼缩放后）
    html += renderWeaponRuntime(data, refineMult, refine);
  } else {
    // 老格式回退：堆 passive + triggers 行
    const staticPassives = (data.passive || []).map(p => {
      const v = (p.value * refineMult * 100).toFixed(0);
      return `${PASSIVE_TYPE_LABEL[p.type] || p.type}${p.element ? ' · ' + p.element : ''} +${v}%`;
    });
    if (staticPassives.length) {
      html += `<div style="color:var(--accent);margin-top:2px">▸ ${staticPassives.join(' · ')}</div>`;
    }
    html += renderWeaponRuntime(data, refineMult, refine);
  }
  html += '</div>';
  return html;
}

// HTML 属性单引号转义（给 data-tip='...' 用）
function tipAttrEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}

// 把官方文案 descFull 中的所有数值按精炼倍率改写，并加 tooltip 显示"原值 × 精炼倍率 = 当前"
// 处理两类 token：
//   1) <b class="term-num">12%</b>     → 百分比，按 ×refineMult
//   2) <b class="term-num">8</b>       → 整数（点数），按 ×refineMult 四舍五入
// 注：descFull 是 1 精原文，精炼 1 时 refineMult = 1.0，不改动
function applyRefineToDesc(html, refineMult) {
  if (refineMult === 1.0) return html;        // 1 精时不动
  // 收集 data.passive / data.triggers 上"绝对值"型 effect（如 concerto_refund 是点数，按整数缩放）
  // 简化：按 b 标签内文本判定 — 含 "%" 当百分比，纯数字当整数
  return String(html).replace(/<b class="term-num">([^<]+)<\/b>/g, (full, txt) => {
    const t = String(txt).trim();
    // 百分比："12%" / "12.5%"
    const pctM = t.match(/^([0-9]+(?:\.[0-9]+)?)\s*%$/);
    if (pctM) {
      const orig = Number(pctM[1]);
      const scaled = orig * refineMult;
      const scaledStr = (scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1)) + '%';
      const tip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>= 原值 <b>${orig}%</b> × 精 ${(refineMult===1?1:Math.round(refineMult*100)/100)} 倍率 <b>${refineMult.toFixed(2)}</b><br>= <b style="color:var(--accent)">${scaledStr}</b>`);
      return `<span class="tip" data-tip='${tip}'><b class="term-num">${scaledStr}</b></span>`;
    }
    // 整数："8 点" / "8" / "2 回合"——回合数 / 秒数不缩放（只缩"点"或纯数）
    const intM = t.match(/^([0-9]+)\s*(点|个)?$/);
    if (intM && (intM[2] === '点' || intM[2] === '个' || !intM[2])) {
      // 纯数 + "点"才认为是数值；纯整数（如"2 回合"已经在外层文字里"回合"不在 b 内）也按数值缩放
      const orig = Number(intM[1]);
      const scaled = Math.round(orig * refineMult);
      if (scaled === orig) return full;
      const unit = intM[2] || '';
      const tip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>= 原值 <b>${orig}${unit}</b> × 精 倍率 <b>${refineMult.toFixed(2)}</b><br>= <b style="color:var(--accent)">${scaled}${unit}</b>`);
      return `<span class="tip" data-tip='${tip}'><b class="term-num">${scaled}${unit}</b></span>`;
    }
    // 时间 / 秒 / 回合 等不缩放
    return full;
  });
}

// 战斗实时数值：常驻被动 + 触发被动（带精炼数值 + 公式 tooltip）
function renderWeaponRuntime(data, refineMult, refine = 1) {
  const ABSOLUTE_VALUE_EFFECTS = new Set(['concerto_refund']);
  const lines = [];
  (data.passive || []).forEach(p => {
    const origPct = (p.value * 100).toFixed(1).replace(/\.0$/, '');
    const v = p.value * refineMult * 100;
    const vStr = v.toFixed(v % 1 === 0 ? 0 : 1);
    const tip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>= 原值 <b>${origPct}%</b> × 精 倍率 <b>${refineMult.toFixed(2)}</b><br>= <b style="color:var(--accent)">${vStr}%</b>`);
    const valStr = refineMult === 1.0
      ? `<b>+${vStr}%</b>`
      : `<span class="tip" data-tip='${tip}'><b>+${vStr}%</b></span>`;
    lines.push(`<div style="color:var(--accent);font-size:10px">▸ ${PASSIVE_TYPE_LABEL[p.type] || p.type}${p.element ? '·' + p.element : ''} ${valStr}（常驻）</div>`);
  });
  (data.triggers || []).forEach(t => {
    const trig = TRIGGER_LABEL[t.on] || t.on;
    const eff = EFFECT_LABEL[t.effect] || t.effect;
    const stacks = t.maxStacks > 1 ? ` ×${t.maxStacks} 层` : '';
    const dur = t.duration && t.duration < 99 ? ` · ${t.duration} 回合` : '';
    const isAbsolute = ABSOLUTE_VALUE_EFFECTS.has(t.effect);
    const v = t.value * refineMult;
    let origLabel, scaledLabel;
    if (isAbsolute) {
      origLabel = `${Math.round(t.value)} 点`;
      scaledLabel = `${Math.round(v)} 点`;
    } else {
      origLabel = `${(t.value * 100).toFixed(0)}%`;
      const pct = v * 100;
      scaledLabel = `${pct.toFixed(pct % 1 === 0 ? 0 : 1)}%`;
    }
    const tip = tipAttrEsc(`<b style="color:var(--gold)">精炼公式</b><br>= 原值 <b>${origLabel}</b> × 精 倍率 <b>${refineMult.toFixed(2)}</b><br>= <b style="color:var(--accent)">${scaledLabel}</b>`);
    const valStr = refineMult === 1.0
      ? `<b>+${scaledLabel}</b>`
      : `<span class="tip" data-tip='${tip}'><b>+${scaledLabel}</b></span>`;
    lines.push(`<div style="color:var(--gold2);font-size:10px">⚡ ${trig} → ${eff}${t.element ? '(' + t.element + ')' : ''} ${valStr}${stacks}${dur}</div>`);
  });
  if (!lines.length) return '';
  // 精炼倍率 tooltip：解释 1.0 / 1.25 / 1.5 / 1.75 / 2.0 怎么算出来的
  const refineTip = tipAttrEsc(`<b style="color:var(--gold)">精炼倍率</b><br>= 1 + (精炼 ${refine} − 1) × 0.25<br>= <b style="color:var(--accent)">${refineMult.toFixed(2)}</b><br><span style="color:var(--muted);font-size:10px">精 1: ×1.00 · 精 2: ×1.25 · 精 3: ×1.50 · 精 4: ×1.75 · 精 5: ×2.00</span>`);
  return `<div style="margin-top:5px;padding-top:5px;border-top:1px dashed var(--line)">
    <div style="font-size:9px;color:var(--muted);letter-spacing:1.5px;margin-bottom:3px">战 斗 内 数 值（含精炼 <span class="tip" data-tip='${refineTip}'>×${refineMult.toFixed(2)}</span>）</div>
    ${lines.join('')}
  </div>`;
}

const SUB_STAT_LABEL = {
  atk_pct: '攻击', crate: '暴击率', cdmg: '暴击伤害',
  hp: '生命', def_pct: '防御',
  resonance: '共鸣效率', heal: '治疗效果'
};
const PASSIVE_TYPE_LABEL = {
  atk_pct: '攻击', atk: '攻击', hp: '生命', def_pct: '防御',
  crate: '暴击', cdmg: '暴伤',
  elem_dmg: '元素伤害', elem_all: '全属性伤害',
  normal_pct: '普攻', skill_pct: '技能', burst_pct: '解放', heavy_pct: '重击',
  team_atk: '全队攻击', teamAtk: '全队攻击',
  resonance: '共鸣效率', heal: '治疗', def_pierce: '防御穿透'
};
const TRIGGER_LABEL = {
  normal_hit: '普攻命中',
  skill_hit: '技能命中',
  burst_cast: '解放释放',
  heavy_hit: '重击命中',
  variation: '变奏',
  outro: '延奏',
  concerto_consume: '消耗协奏',
  heal_skill: '治疗技能',
  condition_attack: '攻击带状态敌人',
  offstage: '后台时',
  always: '常驻'
};
const EFFECT_LABEL = {
  atk_pct: '攻击', normal_pct: '普攻伤害', skill_pct: '技能伤害',
  burst_pct: '解放伤害', heavy_pct: '重击伤害',
  elem_dmg: '元素伤害', def_pierce: '防御穿透',
  team_atk: '全队攻击', concerto_refund: '协奏值',
  condition_bonus: '条件加成', crate: '暴击率'
};

function formatStatValue(stat, value) {
  if (stat === 'atk_pct' || stat === 'def_pct' || stat === 'hp' || stat === 'crate' || stat === 'cdmg' || stat === 'resonance' || stat === 'heal') {
    return (value * 100).toFixed(1) + '%';
  }
  return value.toString();
}

// 对原版共鸣链文案做关键词高亮（不改语义，只加 <b class="term-xxx">）
// 顺序要从长到短，避免"共鸣解放"被"共鸣"先匹配。
const CHAIN_TERM_PATTERNS = [
  // 数值百分比 / 数值秒数（最先匹配，避免影响后续文本）
  { re: /(\d+(?:\.\d+)?%)/g,                                                  cls: 'term-num' },
  { re: /(\d+(?:\.\d+)?\s*(?:秒|回合|层|点|次))/g,                            cls: 'term-num' },
  // 招式术语（长串优先）
  { re: /(共鸣解放[··]终末回环|共鸣解放|终末回环)/g,                       cls: 'term-burst' },
  { re: /(共鸣技能[··][一-龥]{2,6}|共鸣技能)/g,                   cls: 'term-skill' },
  { re: /(共鸣回路|延奏技能|变奏技能|变奏|延奏|协奏)/g, replaceCls: dynamicTermCls },
  { re: /(重击)/g,                                                            cls: 'term-heavy' },
  { re: /(普攻)/g,                                                            cls: 'term-normal' },
  // 角色独有资源/状态名
  { re: /(星蝶|星域|破阵值|破阵|离火|韶光|晶体|红椿|杀意|猎杀阈值|决意|气动侵蚀|衍射失序|心眼)/g, cls: 'term-resource' }
];

function dynamicTermCls(t) {
  if (t.includes('变奏')) return 'term-variation';
  if (t.includes('延奏')) return 'term-outro';
  if (t.includes('协奏')) return 'term-concerto';
  if (t.includes('回路')) return 'term-forte';
  return 'term-normal';
}

// 先把已经是 <b ...> 的部分锁住（占位），高亮完再换回去
function highlightChainTerms(text) {
  if (!text) return '';
  // 已经含 <b>，跳过避免双重包裹
  if (/<b\s+class="term-/.test(text)) return text;
  let out = String(text);
  CHAIN_TERM_PATTERNS.forEach(p => {
    out = out.replace(p.re, (m) => {
      const cls = p.replaceCls ? p.replaceCls(m) : p.cls;
      return `<b class="${cls}">${m}</b>`;
    });
  });
  return out;
}

// ===== 通用 customLines 工厂 =====
// 大部分主C/副C 角色没有"专属状态机"那种结构化战斗（如忌炎锐意、守岸人星域、吟霖印记），
// 他们的差异在元素 / 招式名 / 共鸣链数值，customLines 主要是把数值反映到公式 tooltip。
// 工厂把通用模板抽出来，角色只需要传一个 config（招式名 + 元素 + 标志性 quirks）。
//
// quirks 字段：
//   hasHeavy: boolean              — 是否在 SKILL_HINTS 显示重击行（必须跟 HAS_HEAVY_ROLES 一致）
//   normalMech/skillMech/heavyMech/burstMech/varMech: string
//                                  — 该招式的"基础机制说明"（双形态切换条件 / 派生规则 等）
//                                    无"N 链："前缀，永久显示在该招式描述里
//   skillFollowUp/...: string      — 共鸣链效果（按 "N 链：" 切分，按当前 chain 过滤）
//   forteHint: string              — forteDesc 中"推荐战斗节奏"前的核心循环说明
function makeSkillLines(cfg) {
  return (stats, role) => {
    const tipAttr = s => String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
    const chain = role.chain || 0;
    const atk = stats.atk;
    const energyMax = stats.maxEnergy || 125;
    const elem = cfg.element || '元素';

    // 动态过滤 followUp 文案：把"N 链：xxx；M 链：yyy"按当前 chain 数过滤
    //   - 未激活：直接隐藏（不让玩家提前看到未购买内容）
    //   - 已激活：去掉"N 链："前缀，正文用浅金色高亮（表示这是共鸣链强化）
    //   - 不含"N 链："标记的句子：通用机制说明，永远显示
    function renderFollowUp(text) {
      if (!text) return '';
      // 按"N 链："切分，每段独立判断
      const parts = text.split(/(?=\d\s*链[：:])/g);
      const out = [];
      for (const part of parts) {
        const m = part.match(/^(\d)\s*链[：:]\s*([\s\S]*)$/);
        if (!m) {
          if (part.trim()) out.push(part.trim());
          continue;
        }
        const need = parseInt(m[1], 10);
        if (chain >= need) {
          const body = m[2].replace(/[；;]\s*$/, '').trim();
          out.push(`<span style="color:var(--gold)">[${need}链] ${body}</span>`);
        }
        // 未激活：丢弃，不让玩家提前看到内容
      }
      return out.join(' ');
    }

    // 通用倍率
    const normalDmg = Math.round(atk * 1.0);
    const skillDmg  = Math.round(atk * 1.8);
    const heavyDmg  = Math.round(atk * 2.2);
    const burstMain = Math.round(atk * 4.0);
    const burstSide = Math.round(atk * 2.0);
    const varDmg    = Math.round(atk * 0.8);
    const varConcerto = Math.round(atk * 1.6);

    // 读取已经被 applyChainBonuses 算进 stats 的加成
    const normalBonus = (role.normalBonus || 0);
    const skillBonus  = (role.skillBonus  || 0);
    const burstBonus  = (role.burstBonus  || 0);
    const heavyBonus  = (role.heavyBonus  || 0);

    const finalNormal = Math.round(normalDmg * (1 + normalBonus));
    const finalSkill  = Math.round(skillDmg  * (1 + skillBonus));
    const finalHeavy  = Math.round(heavyDmg  * (1 + heavyBonus));
    const finalBurstMain = Math.round(burstMain * (1 + burstBonus));
    const finalBurstSide = Math.round(burstSide * (1 + burstBonus));

    const fmtPct = v => `${(v*100).toFixed(0)}%`;

    const encoreMode = cfg.encoreBurstToggle ? ((typeof window !== 'undefined' && window.__encoreBurstMode) || 'white') : '';
    const isEncoreBlack = encoreMode === 'black';
    const encoreMult = isEncoreBlack ? (cfg.encoreDamageMult || 1.5) : 1;
    const normalShown = Math.round(finalNormal * encoreMult);
    const skillShown = Math.round(finalSkill * encoreMult);
    const heavyShown = Math.round(finalHeavy * encoreMult);

    const normalTip = tipAttr(
      `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
      `= 攻击 <b>${atk}</b> × 100%${normalBonus>0?` × (1 + 普攻加成 ${fmtPct(normalBonus)})`:''}${encoreMult>1?` × 黑咩强化 ${encoreMult}`:''} = <b style="color:var(--text)">${normalShown}</b><br>` +
      `<span style="color:var(--muted);font-size:10px">命中前结算，最终伤害受暴击/抗性/防御影响</span>`
    );
    const skillTip = tipAttr(
      `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
      `= 攻击 <b>${atk}</b> × 180%${skillBonus>0?` × (1 + 技能加成 ${fmtPct(skillBonus)})`:''}${encoreMult>1?` × 黑咩强化 ${encoreMult}`:''} = <b style="color:var(--accent)">${skillShown}</b>`
    );
    const heavyTip = cfg.hasHeavy ? tipAttr(
      `<b style="color:var(--gold)">重击伤害公式</b><br>` +
      `= 攻击 <b>${atk}</b> × 220%${heavyBonus>0?` × (1 + 重击加成 ${fmtPct(heavyBonus)})`:''}${encoreMult>1?` × 黑咩强化 ${encoreMult}`:''} = <b style="color:#ff8c5e">${heavyShown}</b>`
    ) : '';
    const burstTip = tipAttr(
      `<b style="color:var(--gold)">解放伤害公式</b><br>` +
      `· 主目标：攻击 <b>${atk}</b> × 400%${burstBonus>0?` × (1 + 解放加成 ${fmtPct(burstBonus)})`:''} = <b style="color:#ff8c5e">${finalBurstMain}</b><br>` +
      `· 副目标：攻击 <b>${atk}</b> × 200%${burstBonus>0?` × (1 + 解放加成 ${fmtPct(burstBonus)})`:''} = <b style="color:#ff8c5e">${finalBurstSide}</b>`
    );
    const varTip = tipAttr(
      `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
      `· 普通：攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
      `· 协奏满：攻击 <b>${atk}</b> × 160% = <b style="color:var(--accent)">${varConcerto}</b>`
    );

    const pickEncore = (base, white, black) => {
      if (!cfg.encoreBurstToggle) return base;
      return encoreMode === 'black'
        ? (black ?? white ?? base)
        : (white ?? base);
    };
    const normalName = pickEncore(cfg.normalName, cfg.normalNameWhite, cfg.normalNameBlack);
    const skillName = pickEncore(cfg.skillName, cfg.skillNameWhite, cfg.skillNameBlack);
    const heavyName = pickEncore(cfg.heavyName, cfg.heavyNameWhite, cfg.heavyNameBlack);
    const normalForteGain = pickEncore(cfg.normalForteGain, cfg.normalForteGainWhite, cfg.normalForteGainBlack);
    const skillForteGain = pickEncore(cfg.skillForteGain, cfg.skillForteGainWhite, cfg.skillForteGainBlack);
    const heavyForteGain = pickEncore(cfg.heavyForteGain, cfg.heavyForteGainWhite, cfg.heavyForteGainBlack);

    const skillFollow = renderFollowUp(cfg.skillFollowUp);
    const heavyFollow = renderFollowUp(cfg.heavyFollowUp);
    const rawBurstMech = (() => {
      if (!cfg.encoreBurstToggle) return cfg.burstMech || '';
      const mode = encoreMode || 'white';
      const text = mode === 'black' ? cfg.burstMechBlack : cfg.burstMechWhite;
      return text || '';
    })();
    const burstFollow = renderFollowUp(cfg.burstFollowUp);
    const varFollow   = renderFollowUp(cfg.varFollowUp);

    const lines = [
      {
        icon: '⚔', name: `普攻 · ${normalName || '常态攻击'}`, cost: '1 AP',
        color: 'var(--text)',
        desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalShown}</b> 点</span><b class="term-normal">${elem}伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值${normalForteGain ? `，回复 ${normalForteGain} <b class="term-resource">${cfg.forteName || '资源'}</b>` : ''}。`
      },
      {
        icon: '✦', name: `共鸣技能 · ${skillName || '共鸣斩击'}`, cost: '1 AP · 冷却 3 回合',
        color: 'var(--accent)',
        desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillShown}</b> 点</span><b class="term-skill">${elem}伤害</b>，命中后回复 22 能量${skillForteGain ? `、回复 ${skillForteGain} <b class="term-resource">${cfg.forteName || '资源'}</b>` : ''}。${skillFollow ? '<br>' + skillFollow : ''}`
      }
    ];
    if (cfg.hasHeavy) {
      lines.push({
        icon: '💢', name: `重击 · ${heavyName || '蓄力斩'}`, cost: '2 AP · 冷却 1 回合',
        color: '#ff8c5e',
        desc: `对目标造成 <span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyShown}</b> 点</span><b class="term-heavy">${elem}伤害</b>，回复 15 能量${heavyForteGain ? `、回复 ${heavyForteGain} <b class="term-resource">${cfg.forteName || '资源'}</b>` : ''}。${heavyFollow ? '<br>' + heavyFollow : ''}`
      });
    }
    lines.push({
      icon: '⚡', name: `共鸣解放 · ${cfg.burstName || '元素爆发'}`, cost: `3 AP · 需共鸣能量满 ${energyMax}`,
      color: 'var(--gold)',
      desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${finalBurstMain}</b> 点</span>、副目标 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${finalBurstSide}</b> 点</span><b class="term-burst">${elem}伤害</b>。${rawBurstMech ? '<br>' + rawBurstMech : ''}${burstFollow ? '<br>' + burstFollow : ''}`
    });
    lines.push({
      icon: '🎵', name: `变奏技能 · ${cfg.varName || '上场袭击'}`, cost: '切换上场时触发',
      color: '#c39bff',
      desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">${elem}伤害</b>。${cfg.varMech ? '<br>' + cfg.varMech : ''}${varFollow ? '<br>' + varFollow : ''}`
    });

    return lines;
  };
}

// 角色技能与机制简要描述（模拟器抽象，参考 AI 第三轮校准）
const SKILL_HINTS = {
  '忌炎': {
    intro: '气动 · 长刃 · 主C · 「锐意之势」爆发解放机',
    hasHeavy: true,  // 重击积锐意，必须保留
    // 文案=具体数值，tooltip=计算公式
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;

      // ===== 共鸣链相关参数 =====
      const skillCd = chain >= 1 ? 2 : 3;
      const ruiyiCap = chain >= 6 ? 3 : 2;
      const perStack = chain >= 6 ? 1.2 : 1.0;
      const fullMult = 1 + ruiyiCap * perStack;            // 满锐意倍率：×3 / ×4.6
      const tongbianAtk = chain >= 2 ? 0.28 : 0;
      const mingduanAtk = chain >= 5 ? 0.45 : 0;
      const totalAtkUp = tongbianAtk + mingduanAtk;

      // ===== 真实伤害数（命中前结算）=====
      const normalDmg = Math.round(atk * 1.0);
      const skillDmg  = Math.round(atk * 1.8);
      const heavyDmg  = Math.round(atk * 2.2);
      const burstZero = Math.round(atk * 4.0);                       // 0 锐意时的解放（主目标）
      const burstOne  = Math.round(atk * 4.0 * (1 + perStack));      // 1 锐意（主目标）
      const burstFull = Math.round(atk * 4.0 * fullMult);            // 满锐意（主目标）
      const burstSide = Math.round(atk * 2.0);                       // 副目标基础
      const burstSideFull = Math.round(atk * 2.0 * fullMult);        // 副目标满锐意
      const varDmg    = Math.round(atk * 0.8);
      const varStrong = Math.round(atk * 1.6);                       // 协奏满

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">命中前结算，最终伤害受暴击/抗性/防御影响</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 180% = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const heavyTip = tipAttr(
        `<b style="color:var(--gold)">重击伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 220% = <b style="color:#ff8c5e">${heavyDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标基础 = 攻击 <b>${atk}</b> × 400% = ${burstZero}<br>` +
        `· 副目标基础 = 攻击 <b>${atk}</b> × 200% = ${burstSide}<br>` +
        `· 锐意每层 +${(perStack*100).toFixed(0)}%${chain>=6?'（共鸣链 6 由 +100% 提升）':''}<br>` +
        `· 0 锐意：主 ${burstZero} / 副 ${burstSide}<br>` +
        `· 1 锐意：主 ${burstOne}<br>` +
        `· ${ruiyiCap} 锐意（满层）：主 <b style="color:#ff8c5e">${burstFull}</b> / 副 <b style="color:#ff8c5e">${burstSideFull}</b>`
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满（×2）：攻击 <b>${atk}</b> × 160% = <b style="color:var(--accent)">${varStrong}</b>`
      );

      // 共鸣链激活效果（写真实数值，不写"激活提示"）
      let chainHints = '';
      if (chain >= 2 || chain >= 5) {
        const detail = [
          chain >= 2 ? `· 共鸣链 2「通变」：破阵 +30、攻击 +28%（2 回合）` : '',
          chain >= 5 ? `· 共鸣链 5「明断」：攻击 +45%（2 回合）` : '',
          chain >= 5 ? `· 合计攻击 ${atk} → <b style="color:#ff8c5e">${Math.round(atk*(1+totalAtkUp))}</b>` : ''
        ].filter(Boolean).join('<br>');
        const varBuffTip = tipAttr(`<b style="color:var(--gold)">变奏入场加成</b><br>${detail}`);
        chainHints = `<br>切换上场时还会触发 <span class="tip" data-tip='${varBuffTip}'>共鸣链入场 buff（攻击 +${(totalAtkUp*100).toFixed(0)}%）</span>`;
      }

      return [
        {
          icon: '⚔', name: '普攻 · 长枪连段', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">气动伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值。<br>积满<b class="term-resource">破阵值</b>时，下次普攻进入<b style="color:var(--gold)">枪扫风定·强化连段</b>（伤害 ×2）。`
        },
        {
          icon: '✦', name: '共鸣技能 · 枪扫风定', cost: `1 AP · 冷却 ${skillCd} 回合`,
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">气动伤害</b>，命中后回复 22 能量、+18 协奏。<br>获得 <b style="color:var(--gold)">1 层</b><b class="term-resource">锐意之势</b>${chain>=1?`（共鸣链 1 已将冷却由 3 缩短为 <b>${skillCd}</b> 回合）`:''}。`
        },
        {
          icon: '💢', name: '重击 · 突进', cost: '2 AP · 冷却 1 回合',
          color: '#ff8c5e',
          desc: `对目标造成 <span class="tip" data-tip='${heavyTip}'><b style="color:#ff8c5e">${heavyDmg}</b> 点</span><b class="term-heavy">气动伤害</b>，命中后回复 15 能量、+14 协奏。<br>获得 <b style="color:var(--gold)">1 层</b><b class="term-resource">锐意之势</b>。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 苍躣八荒', cost: `3 AP · 需共鸣能量满 ${stats.maxEnergy}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'>基础 <b style="color:#ff8c5e">${burstZero}</b></span>、副目标 <span class="tip" data-tip='${burstTip}'>基础 <b style="color:#ff8c5e">${burstSide}</b></span> <b class="term-burst">气动伤害</b>，消耗全部<b class="term-resource">锐意之势</b>放大：<br>· 1 锐意 主 <b style="color:#ff8c5e">${burstOne}</b><br>· ${ruiyiCap} 锐意（满层）主 <b style="color:#ff8c5e">${burstFull}</b> / 副 <b style="color:#ff8c5e">${burstSideFull}</b>（<b>×${fullMult.toFixed(1)}</b>）${chain>=4?`<br>释放后 2 回合内，全队<b class="term-heavy">重击</b>伤害 +25%（共鸣链 4「奇正」）`:''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 攻其不备', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换至忌炎上场，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varStrong}</b>）点</span><b class="term-variation">变奏伤害</b>，获得 <b style="color:var(--gold)">1 层</b><b class="term-resource">锐意之势</b>。${chainHints}`
        }
      ];
    },
    forteName: '破阵值',
    forteDesc: '<b class="term-resource">破阵值</b>（0-100）由普攻 +12 / 技能 +25 / 解放 +40 积累，满后下次<b class="term-normal">普攻</b>进入<b style="color:var(--gold)">枪扫风定·强化连段</b>（伤害 ×2）。<br><br>真正的核心是<b class="term-resource">锐意之势</b>—— <b class="term-heavy">重击</b> / <b class="term-skill">共鸣技能</b> / <b class="term-variation">变奏入场</b> 每次 +1 层，<b class="term-burst">共鸣解放</b>消耗全部层数放大终结伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>切人入场（积 1 锐意 + 攻击 buff）→ 共鸣技能（2 锐意）→ 重击（满 3 锐意 / 6 链）→ 共鸣解放清场。'
  },
  '今汐': {
    intro: '衍射 · 长刃 · 主C · 「韶光满 → 惊龙破空」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '凌霄', skillName: '逐天取月', burstName: '移岁诛邪', varName: '蟠龙清辉',
      normalMech: '<span style="color:var(--muted)">资源积累：</span>普攻 +<b>10</b> <b class="term-resource">韶光</b>，并获得 <b>1</b> 层<b class="term-resource">惊蛰</b>（上限 4）。',
      skillMech: '<span style="color:var(--muted)">形态判定：</span><b class="term-resource">韶光</b>未满时为<b>逐天取月</b>（+20 韶光 / +1 惊蛰）；韶光满 <b>100</b> 时下次共鸣技能替换为<b style="color:var(--gold)">惊龙破空</b>，消耗全部韶光与惊蛰造成高额爆发。',
      burstMech: '<span style="color:var(--muted)">爆发窗口：</span>优先在<b class="term-resource">惊蛰</b>叠满 4 层后释放，用 4 层惊蛰放大解放/惊龙破空循环。',
      skillFollowUp: '1 链：惊龙破空每层惊蛰 +25%（满 4 层 +100%）。 6 链：共鸣技能·惊龙破空倍率 +45%，消耗韶光时再 +45%。',
      burstFollowUp: '5 链：解放·移岁诛邪倍率 +120%。'
    }),
    forteName: '韶光',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· <b class="term-resource">韶光</b> 0-100：普攻 +10 / 技能 +20 / 变奏入场 +50<br>· <b class="term-resource">惊蛰</b> 0-4：普攻/技能各 +1 层<br>· 韶光满 <b>100</b> 时，下次<b class="term-skill">共鸣技能</b>变为<b style="color:var(--gold)">惊龙破空</b>，消耗全部韶光和惊蛰；惊蛰层数越高，爆发越高<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻/技能积韶光与惊蛰 → 变奏切下再切回补韶光 → 韶光满 100 + 惊蛰 4 层 → 惊龙破空 → 共鸣解放清场。'
  },
  '长离': {
    intro: '热熔 · 迅刀 · 主C · 「离火 + 重击焚身以火」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '赫羽连斩', skillName: '赫羽三相', heavyName: '焚身以火', burstName: '离火照丹心', varName: '焰离入场',
      hasHeavy: true,
      normalMech: '<span style="color:var(--muted)">资源积累：</span>普攻每 <b>3</b> 段获得 <b>1</b> 层<b class="term-resource">离火</b>（上限 3）。',
      skillMech: '<span style="color:var(--muted)">资源积累：</span>共鸣技能命中获得 <b>1</b> 层<b class="term-resource">离火</b>。',
      heavyMech: '<span style="color:var(--muted)">派生条件：</span>拥有<b class="term-resource">离火</b>时，重击变为<b>焚身以火</b>；消耗 <b>1</b> 层离火，每层使本次重击 +50%。无离火时为普通重击。',
      burstMech: '<span style="color:var(--muted)">爆发窗口：</span>建议在 2-3 层<b class="term-resource">离火</b>后释放，先用重击焚身打出强化段，再接解放收尾。',
      skillFollowUp: '2 链：获得离火时暴击 +25%。',
      heavyFollowUp: '1 链：共鸣技能/重击伤害 +10%。 5 链：重击·焚身以火倍率 +50%。',
      burstFollowUp: '3 链：共鸣解放·离火照丹心 +80%。 6 链：共鸣技能/重击/解放无视 40% 防御。'
    }),
    forteName: '离火',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态/派生条件</span><br>· <b class="term-resource">离火</b> 0-3 层：共鸣技能 +1 / 普攻每 3 段 +1<br>· 拥有离火时，<b class="term-heavy">重击</b>变为<b style="color:#ff8c5e">焚身以火</b>；释放后消耗 1 层离火，每层让本次重击 +50%<br>· 没有离火时，重击只是普通蓄力段<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏入场 → 共鸣技能积 1 层离火 → 普攻补到 2-3 层 → 重击·焚身以火消耗离火爆发 → 共鸣解放·离火照丹心收尾。'
  },
  '守岸人': {
    intro: '衍射 · 音感仪 · 辅助 · 「星域」治疗 + 增益核心',
    // 文案=具体数值，tooltip=计算公式
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;
      const hp = stats.hp;
      const healBonus = stats.healBonus || 0;
      const energyMax = stats.maxEnergy || 125;

      // ===== 共鸣链相关参数 =====
      const fieldDur   = chain >= 1 ? 5 : 3;
      const fieldMult  = chain >= 1 ? 2.5 : 1.0;             // 1 链：星域内所有增益强度 ×2.5
      const heal4Mult  = chain >= 4 ? 1.7 : 1.0;             // 4 链：持续治疗再 ×1.7
      const fieldAtkPct  = chain >= 2 ? Math.round(40 * fieldMult) : 0;
      const fieldCratePct = Math.round(20 * fieldMult);
      const fieldCdmgPct  = Math.round(30 * fieldMult);

      // ===== 真实伤害/治疗数（命中前结算）=====
      const normalDmg = Math.round(atk * 1.0);
      const skillDmg  = Math.round(atk * 1.8);
      const burstDmg  = Math.round(atk * 4.0);
      const burstSide = Math.round(atk * 2.0);

      // 共鸣技能 · 混沌理论 一次性治疗（命中后给全队，4 链放大）
      const skillHealBase  = Math.round(hp * 0.06 + atk * 0.5);
      const skillHealTotal = Math.round(skillHealBase * (1 + healBonus) * heal4Mult);

      // 星域每回合持续治疗（共鸣链 4 / 1 共同放大）
      const hotTotal = Math.round(atk * 0.8 * heal4Mult * fieldMult);

      // 变奏伤害（守岸人 6 链：×6 倍率）
      const varDmg       = Math.round(atk * 0.8);
      const varConcerto  = Math.round(atk * 1.6);
      const varChain6    = chain >= 6 ? Math.round(atk * 1.6 * 6) : 0;

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">命中前结算，最终伤害受暴击/抗性/防御影响</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 180% = <b style="color:var(--accent)">${skillDmg}</b>`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 400% = <b style="color:#ff8c5e">${burstDmg}</b><br>` +
        `· 副目标：攻击 <b>${atk}</b> × 200% = <b style="color:#ff8c5e">${burstSide}</b>`
      );
      const skillHealTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能治疗公式</b><br>` +
        `= (生命 <b>${hp}</b> × 6% + 攻击 <b>${atk}</b> × 50%)<br>` +
        `&nbsp;&nbsp;× (1 + 治疗加成 ${(healBonus*100).toFixed(1)}%)` +
        (chain >= 4 ? `<br>&nbsp;&nbsp;× <b style="color:var(--gold)">共鸣链 4 倍率 1.7</b>` : '') +
        `<br>= <b style="color:var(--green)">${skillHealTotal}</b>`
      );
      const hotTip = tipAttr(
        `<b style="color:var(--gold)">星域每回合治疗公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 80%` +
        (chain >= 4 ? ` × <b style="color:var(--gold)">共鸣链 4 倍率 1.7</b>` : '') +
        (chain >= 1 ? ` × <b style="color:var(--gold)">共鸣链 1 倍率 2.5</b>` : '') +
        `<br>= <b style="color:var(--green)">${hotTotal}</b>`
      );
      const crateTip = tipAttr(
        `<b style="color:var(--gold)">星域全队暴击公式</b><br>` +
        `= 基础 <b>20%</b>` +
        (chain >= 1 ? ` × <b style="color:var(--gold)">共鸣链 1 倍率 2.5</b>` : '') +
        `<br>= <b style="color:#ffd96b">+${fieldCratePct}%</b>`
      );
      const cdmgTip = tipAttr(
        `<b style="color:var(--gold)">星域全队暴伤公式</b><br>` +
        `= 基础 <b>30%</b>` +
        (chain >= 1 ? ` × <b style="color:var(--gold)">共鸣链 1 倍率 2.5</b>` : '') +
        `<br>= <b style="color:#ffd96b">+${fieldCdmgPct}%</b>`
      );
      const fieldAtkTip = chain >= 2 ? tipAttr(
        `<b style="color:var(--gold)">星域全队攻击公式</b>（共鸣链 2）<br>` +
        `= 基础 <b>40%</b>` +
        (chain >= 1 ? ` × <b style="color:var(--gold)">共鸣链 1 倍率 2.5</b>` : '') +
        `<br>= <b style="color:#ff8c5e">+${fieldAtkPct}%</b>`
      ) : '';
      const fieldDurTip = tipAttr(
        `<b style="color:var(--gold)">星域持续时间</b><br>` +
        `· 基础：<b>3</b> 回合` +
        (chain >= 1 ? `<br>· 共鸣链 1：延长至 <b>${fieldDur}</b> 回合 + 切换角色后不消散` : '')
      );
      const fieldTip = tipAttr(
        `<b style="color:var(--gold)">星域总览</b>（持续 <b>${fieldDur}</b> 回合${chain>=1?' · 切人不消散':''}）<br>` +
        `· 每回合治疗：<b style="color:var(--green)">${hotTotal}</b>（攻击 × 80%${chain>=4?' × 1.7':''}${chain>=1?' × 2.5':''}）<br>` +
        `· 全队暴击 +<b style="color:#ffd96b">${fieldCratePct}%</b>${chain>=1?'（基础 20% × 2.5）':''}<br>` +
        `· 全队暴伤 +<b style="color:#ffd96b">${fieldCdmgPct}%</b>${chain>=1?'（基础 30% × 2.5）':''}` +
        (chain >= 2 ? `<br>· 全队攻击 +<b style="color:#ff8c5e">${fieldAtkPct}%</b>（基础 40%${chain>=1?' × 2.5':''}）` : '')
      );
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：攻击 <b>${atk}</b> × 160% = <b style="color:var(--accent)">${varConcerto}</b>` +
        (chain >= 6 ? `<br>· 共鸣链 6（×6）：${varConcerto} × 6 = <b style="color:var(--gold)">${varChain6}</b>` : '')
      );

      return [
        {
          icon: '⚔', name: '普攻 · 真源构演', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">衍射伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值。`
        },
        {
          icon: '✦', name: '共鸣技能 · 混沌理论', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b> 点</span><b class="term-skill">衍射伤害</b>，并为附近队伍中所有角色恢复 <span class="tip" data-tip='${skillHealTip}'><b style="color:var(--green)">${skillHealTotal}</b> 点生命值</span>。<br>命中后回复 22 共鸣能量。`
        },
        {
          icon: '⚡', name: '共鸣解放 · 终末回环', cost: `3 AP · 需共鸣能量满 ${energyMax}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstDmg}</b> 点</span>、对副目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSide}</b> 点</span><b class="term-burst">衍射伤害</b>，展开 <span class="tip" data-tip='${fieldTip}'><b class="term-resource">星域</b></span>（<span class="tip" data-tip='${fieldDurTip}'><b>${fieldDur}</b> 回合</span>${chain>=1?' · 切人不消散':''}）：<br>· 每回合治疗全队 <span class="tip" data-tip='${hotTip}'><b style="color:var(--green)">${hotTotal}</b></span><br>· 全队暴击 +<span class="tip" data-tip='${crateTip}'><b style="color:#ffd96b">${fieldCratePct}%</b></span> · 暴伤 +<span class="tip" data-tip='${cdmgTip}'><b style="color:#ffd96b">${fieldCdmgPct}%</b></span>${chain>=2?` · 攻击 +<span class="tip" data-tip='${fieldAtkTip}'><b style="color:#ff8c5e">${fieldAtkPct}%</b></span>`:''}${chain>=3?'<br>额外回复 <b>20</b> 共鸣能量（每 <b>2</b> 回合 1 次 · 共鸣链 3）':''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 洞悉', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换上场时，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>${chain>=6?` · 6 链 <b style="color:var(--gold)">${varChain6}</b>`:''}）点</span><b class="term-variation">变奏伤害</b>。${chain>=5?'<br>共鸣链 5：普攻额外攻击一名相邻敌人。':''}`
        }
      ];
    },
    forteName: '协奏',
    forteDesc: '守岸人不依赖专属资源，全部价值集中于<b class="term-burst">共鸣解放</b>展开的<b class="term-resource">星域</b>：每回合治疗、暴击/暴伤/攻击增益。所有共鸣链都用来加强星域。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻/技能积攒能量与协奏 → 解放展开星域 → 切到主 C → 主 C 在星域加成下输出。'
  },
  '椿': {
    intro: '湮灭 · 迅刀 · 主C · 「红椿蕊 → 含苞形态」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '红椿剑舞', skillName: '一日花', burstName: '芳华绽烬', varName: '八千春秋',
      normalMech: '<span style="color:var(--muted)">资源积累：</span>每段普攻 +<b>10</b> <b class="term-resource">红椿蕊</b>。<b class="term-resource">含苞</b>状态下普攻 ×1.5（6 链 ×2.5）。',
      skillMech: '<span style="color:var(--muted)">形态切换：</span><b class="term-resource">红椿蕊</b>满 <b>100</b> 且协奏 ≥ <b>50</b> 时，共鸣技能替换为<b style="color:var(--gold)">永生花</b>：消耗 50 蕊 + 50 协奏，进入<b class="term-resource">含苞</b>状态 <b>3</b> 回合（普攻/技能 ×1.5；6 链 ×2.5）。<br><span style="color:var(--muted)">未满 100 蕊：</span>正常一日花，每次 +<b>20</b> 蕊。',
      burstMech: '<span style="color:var(--muted)">含苞期间释放：</span>伤害基础放大 ×1.5（6 链 ×2.5）+ 3 链时自身攻击 +58%。',
      skillFollowUp: '2 链：共鸣回路·一日花伤害倍率 +120%。 6 链：含苞强化倍率 1.5 → 2.5。',
      burstFollowUp: '3 链：解放·芳华绽烬 +50%，含苞期间攻击 +58%。',
      varFollowUp: '1 链：变奏后暴击伤害 +28%。 5 链：变奏倍率 +303%。'
    }),
    forteName: '红椿蕊',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· <b style="color:var(--text)">常态</b>（默认）：普攻 +10 / 技能 +20 <b class="term-resource">红椿蕊</b>（0-100）<br>· <b style="color:var(--gold)">永生花触发</b>：红椿蕊满 <b>100</b> + 协奏值 ≥ <b>50</b> → 下次共鸣技能变为<b style="color:var(--gold)">永生花</b>，消耗资源后进入<b class="term-resource">含苞</b>状态<br>· <b style="color:#c39bff">含苞形态</b>：普攻/技能 ×<b>1.5</b>（6 链 ×<b>2.5</b>）+ 自身攻击 +58%（3 链），持续 <b>3</b> 回合后自动退出<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏起手 → 普攻 + 共鸣技能积蕊 + 协奏 → 满 100 蕊后释放<b style="color:var(--gold)">永生花</b>进入含苞 → 含苞 3 回合全程爆发（普攻/技能 ×1.5/×2.5）→ 共鸣解放收尾。'
  },
  '折枝': {
    intro: '衍射 · 迅刀 · 副C · 「墨鹤召唤协同」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '挥毫', skillName: '神来之笔', burstName: '虚实境趣', varName: '展卷入场',
      skillFollowUp: '6 链：额外召唤 <b>1</b> 只<b class="term-resource">白鹤</b>（共鸣技能伤害 +120%）。',
      burstFollowUp: '召唤 <b>6</b> 只<b class="term-resource">墨鹤</b>持续协同，是折枝后台输出的核心。 2 链：墨鹤上限 +6 → 12 只。 4 链：解放时全队攻击 +20%。 5 链：协同墨鹤额外 +40% 伤害。'
    }),
    forteName: '墨鹤',
    forteDesc: '折枝是召唤型副C：<b class="term-burst">共鸣解放·虚实境趣</b>召唤 6 只<b class="term-resource">墨鹤</b>，切下场后<b>每回合自动协同</b>攻击。<br>2 链上限 +6（12 只）、5 链协同伤害 +40%、6 链共鸣技能额外白鹤。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏起手 → 共鸣技能 + 普攻积能量 → 释放解放召唤墨鹤 → 切到主 C → 墨鹤后台跟手。'
  },
  '相里要': {
    intro: '导电 · 臂铠 · 副C · 「邃古遗墟叠层」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '基本推衍', skillName: '万方法则', burstName: '思维矩阵', varName: '链式入场',
      skillFollowUp: '<b class="term-resource">邃古遗墟</b>可用时，每次共鸣技能消耗 1 次伤害 +63%（最多 5 次）。 1 链：额外 6 个<b class="term-resource">衍构模体</b>（伤害 +48%）。 6 链：幻方强化共鸣技能 +76%。',
      burstFollowUp: '释放后获得 <b>5</b> 次<b class="term-resource">邃古遗墟</b>叠层。 4 链：解放时全队共鸣解放 +25%。 5 链：解放·思维矩阵倍率 +100%。'
    }),
    forteName: '幻方',
    forteDesc: '<b class="term-burst">共鸣解放·思维矩阵</b>释放后获得 5 次<b class="term-resource">邃古遗墟</b>buff：每次<b class="term-skill">共鸣技能</b>消耗 1 次，让本次 +63% 伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣解放铺 buff → 切到主 C 输出 → 切回相里要打满 5 个共鸣技能爆发。'
  },
  '珂莱塔': {
    intro: '冷凝 · 佩枪 · 主C · 「解离 + 重击末路见行」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '冷凝枪击', skillName: '示我璀璨', heavyName: '末路见行', burstName: '死兆', varName: '碎璃镜花',
      burstMech: '<span style="color:var(--muted)">控制效果：</span><b class="term-burst">共鸣解放·死兆</b>射击命中附加<b class="term-resource">焕彩</b>，使目标短暂停滞。',
      heavyMech: '<span style="color:var(--muted)">重击派生：</span><b class="term-heavy">重击·末路见行</b>是珂莱塔的爆发段；4 链时施放后全队共鸣技能 +25%。',
      skillMech: '<span style="color:var(--muted)">强化条件：</span>命中带<b class="term-resource">解离</b>/<b class="term-resource">变彩</b>的目标会回复<b class="term-resource">灵萃</b>。灵萃满时，共鸣技能进入<b style="color:var(--gold)">暴力美学</b>强化形态（高倍率冷凝伤害）。',
      hasHeavy: true,
      skillFollowUp: '<b class="term-resource">灵萃</b>满时强化为<b style="color:var(--gold)">暴力美学</b>。 3 链：共鸣技能·示我璀璨 +93%。',
      heavyFollowUp: '5 链：重击·末路见行 +47%。 4 链：施放重击时全队<b class="term-skill">共鸣技能</b>伤害 +25%。',
      burstFollowUp: '射击命中附加<b class="term-resource">焕彩</b><b class="term-resource">停滞</b>效果。 1 链：对<b class="term-resource">解离</b>目标暴击 +12.5%。 2 链：解放·致死以终 +126%。 6 链：死兆射击 + 晶体翻倍 = 解放 +186.6%。'
    }),
    forteName: '灵萃',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 强化条件</span><br>· 共鸣技能命中带<b class="term-resource">解离</b>/<b class="term-resource">变彩</b>的目标 → 回复<b class="term-resource">灵萃</b><br>· 灵萃满后，下次共鸣技能进入<b style="color:var(--gold)">暴力美学</b>强化形态<br>· <b class="term-heavy">重击·末路见行</b>是主要爆发段（4 链给全队共鸣技能 +25%）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能挂解离/变彩 → 继续技能回灵萃 → 灵萃满释放暴力美学 → 重击末路见行 → 共鸣解放死兆附加焕彩停滞。'
  },
  '洛可可': {
    intro: '湮灭 · 臂铠 · 副C · 「想象力 + 全队湮灭增伤」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '幻想照进现实', skillName: '高难度设计', burstName: '即兴喜剧', varName: '佩洛，来帮忙',
      skillFollowUp: '回复 100 想象力 + 10 协奏；普攻幻想照进现实免疫打断。 4 链：共鸣技能后普攻幻想照进现实 +60%。',
      burstFollowUp: '开场强化普攻 + 重击。 2 链：普攻每层给全队湮灭 +10%（满 3 层 +40%）。 3 链：变奏后暴击/暴伤 +10%/+30%。 5 链：解放开场 +20%，重击 +80%。 6 链：解放期间普攻无视 60% 防御。'
    }),
    forteName: '想象力',
    forteDesc: '洛可可是<b style="color:#a78bff">湮灭副C</b>：<b class="term-skill">共鸣技能·高难度设计</b>回 100 想象力 + 10 协奏；普攻每段给全队<b class="term-resource">湮灭伤害 +10%</b>（满 3 层 +40%）。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏起手积湮灭 buff → 共鸣技能 → 普攻铺 3 层 → 切到主 C 享受湮灭团 buff。'
  },
  '菲比': {
    intro: '衍射 · 音感仪 · 主C · 「赦罪/告解双形态」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '夏弥尔之星', skillName: 'FFF · 镜之环', heavyName: '星辉', burstName: '启明之誓愿', varName: '金色恩典',
      hasHeavy: true,
      skillMech: '<span style="color:var(--muted)">形态切换：</span>消耗 <b>1</b> 点<b class="term-resource">福音</b>，<b style="color:var(--gold)">赦罪</b>↔<b style="color:#a78bff">告解</b>形态切换（战斗开始默认<b style="color:var(--gold)">赦罪</b>）。召唤<b class="term-resource">镜之环</b>对范围内目标附加<b class="term-resource">光噪效应</b>。',
      heavyMech: '<span style="color:var(--muted)">形态差异：</span><b style="color:var(--gold)">赦罪</b>下重击普通倍率；<b style="color:#a78bff">告解</b>下重击大幅强化（3 链 +249%）。消耗<b class="term-resource">福音</b>。',
      burstMech: '<span style="color:var(--muted)">形态差异：</span><b style="color:var(--gold)">赦罪</b>下解放高倍率（1 链 255% → 480%）；<b style="color:#a78bff">告解</b>下解放叠满<b class="term-resource">光噪</b>（1 链）。',
      skillFollowUp: '6 链：召唤<b class="term-resource">镜之环</b>时攻击 +10%。',
      heavyFollowUp: '2 链：赦罪状态下延奏对光噪目标 +120%。 3 链：重击·星辉 +91%。',
      burstFollowUp: '1 链：赦罪状态解放倍率从 255% → 480%。 5 链：自身衍射伤害 +12%。'
    }),
    forteName: '福音',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· <b style="color:var(--gold)">赦罪</b>（默认）：强化<b class="term-burst">共鸣解放</b>（解放倍率 +225%）<br>· <b style="color:#a78bff">告解</b>：强化<b class="term-heavy">重击·星辉</b>（重击 +249%）+ FFF 镜之环叠满光噪<br>· 施放<b class="term-skill">共鸣技能·FFF</b>消耗 <b>1</b> 点<b class="term-resource">福音</b>切换形态；战斗开始默认赦罪<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻铺<b class="term-resource">光噪效应</b> → FFF 召唤<b class="term-resource">镜之环</b> 切换告解 → 重击·星辉爆发 → 再 FFF 切回赦罪 → 共鸣解放·启明之誓愿清场。'
  },
  '卡提希娅': {
    intro: '气动 · 迅刀 · 主C · 「气动侵蚀 + 强化形态」',
    customLines: makeSkillLines({
      element: '气动',
      normalName: '驳问', skillName: '看潮怒风', heavyName: '空中攻击', burstName: '怒风哮之刃', varName: '芙露德莉斯入场',
      hasHeavy: true,
      skillFollowUp: '给目标附加<b class="term-resource">气动侵蚀</b>（受气动伤害 +15%）。',
      heavyFollowUp: '<b class="term-heavy">空中攻击</b>是核心爆发段。 1 链：决意 4 层 × 25% = 暴击伤害 +100%。 2 链：普攻/重击/闪反/变奏倍率 +50%。',
      burstFollowUp: '进入强化形态扩散输出。 3 链：看潮怒风哮之刃 +100%。 4 链：附加属性效应时全队伤害 +20%。 6 链：芙露德莉斯受伤增伤 +40%。'
    }),
    forteName: '决意',
    forteDesc: '<b class="term-resource">决意</b>积满到 30 / 60 / 90 / 120 时各 +25% 暴击伤害（最多 4 层 = +100%，1 链）。<b class="term-resource">气动侵蚀</b>给目标气动易伤 buff。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏起手 → 共鸣技能挂侵蚀 → 普攻/空中攻击积决意 → 共鸣解放·看潮怒风哮之刃终结。'
  },
  '嘉贝莉娜': {
    intro: '热熔 · 佩枪 · 主C · 「余火 + 永恒位格」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '炼羽射击', skillName: '裁决', heavyName: '炼羽裁决', burstName: '永恒位格', varName: '声骸入场',
      heavyMech: '<span style="color:var(--muted)">爆发段：</span><b class="term-heavy">重击·炼羽裁决</b>是永恒位格期间的主输出。',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·永恒位格</b>后进入<b class="term-resource">永恒位格</b>强化状态；6 链时自身伤害 +60%，余火满层热熔加深 +35%。',
      skillMech: '<span style="color:var(--muted)">资源积累：</span>普攻/技能积攒<b class="term-resource">余火</b>（0-10 点），余火越高暴击伤害越高（1 链）。',
      hasHeavy: true,
      skillFollowUp: '积<b class="term-resource">余火</b>。 1 链：余火 10 点 × 8% = 暴击伤害 +80%。 5 链：共鸣技能伤害 +150%。',
      heavyFollowUp: '炼羽裁决是嘉贝主输出段。 2 链：内燃烧攻击 +150%。',
      burstFollowUp: '进入<b class="term-resource">永恒位格</b>，自身全面增益。 3 链：共鸣解放 +130%。 4 链：声骸后全队伤害 +20%。 6 链：永恒位格自身伤害 +60%，余火满层热熔加深 +35%。'
    }),
    forteName: '余火',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普攻/技能积攒<b class="term-resource">余火</b>（0-10）<br>· 释放<b class="term-burst">共鸣解放·永恒位格</b> → 进入永恒位格强化状态<br>· 永恒位格期间：自身伤害提升（6 链 +60%），重击·炼羽裁决主输出；余火越高，热熔加深越高<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻/技能积余火 → 余火接近满层 → 共鸣解放进入永恒位格 → 重击·炼羽裁决爆发。'
  },
  '卡卡罗': {
    intro: '导电 · 长刃 · 主C · 「Deathblade 形态」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '杀戮指令', skillName: '灭杀指令', heavyName: '死告', burstName: '杀戮武装', varName: '全境通缉',
      heavyMech: '<span style="color:var(--muted)">解放形态内：</span><b class="term-heavy">重击·死告</b>是 Deathblade 形态的终结段；6 链会召唤<b class="term-resource">猎杀影</b>协同。',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·杀戮武装</b>后进入<b class="term-resource">Deathblade</b>形态 <b>2</b> 回合；期间普攻/技能 +50%，结束后自动退出。',
      hasHeavy: true,
      skillFollowUp: '1 链：共鸣技能命中额外回 10 能量。 2 链：变奏后共鸣技能 +30%。',
      heavyFollowUp: '6 链：召唤 2 个<b class="term-resource">猎杀影</b><b class="term-resource">协同攻击</b>。',
      burstFollowUp: '进入 <b style="color:var(--gold)">Deathblade</b> 形态：普攻/技能 +50%（持续 2 回合）。 3 链：解放期间导电 +25%。 4 链：延奏后全队导电 +20%。 5 链：变奏伤害 +50%。'
    }),
    forteName: '杀意',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普攻/技能攒能量<br>· 释放<b class="term-burst">共鸣解放·杀戮武装</b> → 进入<b class="term-resource">Deathblade</b>形态 <b>2</b> 回合<br>· Deathblade 期间：普攻/技能 +50%；重击·死告是爆发终结段；6 链召唤猎杀影协同<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能攒能量 → 满能量开杀戮武装 → 2 回合内普攻/技能输出 → 重击·死告收尾。'
  },
  '布兰特': {
    intro: '热熔 · 迅刀 · 辅助 · 「火焰归亡曲护盾辅助」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '生活皆舞台', skillName: '空中攻击', burstName: '火焰归亡曲', varName: '为我！',
      skillFollowUp: '<b class="term-heavy">空中攻击</b>是布兰特核心。 1 链：变奏/<b class="term-heavy">空中攻击</b> +20%，叠 3 层（满 +60%）。 6 链：<b class="term-heavy">空中攻击</b>倍率 +30%。',
      burstFollowUp: '给全队上护盾。 2 链：<b class="term-heavy">空中攻击</b>/火焰归亡曲暴击 +30%。 3 链：火焰归亡曲伤害 +42%。 4 链：护盾 +20% + 治疗全队。 5 链：普攻伤害 +15%。 6 链：解放后<b class="term-normal">再燃</b> +30%。'
    }),
    forteName: '航向',
    forteDesc: '布兰特是<b style="color:#ff8c5e">热熔辅助</b>：<b class="term-burst">火焰归亡曲</b>给全队上护盾 + 治疗，<b class="term-variation">变奏·为我！</b>叠攻击 buff（3 层 +60%），适合配合主 C 输出。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏起手叠 3 层攻击 → 共鸣解放·火焰归亡曲铺护盾 → 切到主 C 主输出 → 切回触发延奏爆炸（2 链）。'
  },
  '坎特蕾拉': {
    intro: '湮灭 · 音感仪 · 副C · 「蜃境 + 织梦水母」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '蛰幻', skillName: '翩跹', burstName: '陷溺', varName: '幻梦入场',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">陷溺</b>给目标附加<b class="term-resource">迷梦</b>，触发<b class="term-resource">惊醒</b>爆发；3 链时释放后直接进入<b class="term-resource">蜃境</b>。',
      skillMech: '<span style="color:var(--muted)">资源积累：</span>施放共鸣技能回复 <b>1</b> 点<b class="term-resource">迷离</b>。迷离满后配合解放·陷溺进入<b class="term-resource">蜃境</b>。',
      skillFollowUp: '回 1 点<b class="term-resource">迷离</b>。 1 链：共鸣技能 +50%。',
      burstFollowUp: '附加<b class="term-resource">迷梦</b>状态，触发<b class="term-resource">惊醒</b>。 2 链：惊醒伤害倍率 +245%。 3 链：解放·陷溺 +370% + 直接进入蜃境。 4 链：蜃境治疗加成 +25%。 6 链：解放期间无视 30% 防御。'
    }),
    forteName: '迷离',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 共鸣技能每次 +1 <b class="term-resource">迷离</b><br>· 释放<b class="term-burst">共鸣解放·陷溺</b>给目标附加<b class="term-resource">迷梦</b>，后续命中触发<b class="term-resource">惊醒</b><br>· 3 链：释放陷溺后直接进入<b class="term-resource">蜃境</b>；无 3 链时需迷离满才进入<br>· 蜃境期间治疗 +25%（4 链）并强化输出<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能积迷离 → 共鸣解放·陷溺挂迷梦 → 触发惊醒 → 进入蜃境继续输出。'
  },

  // ===== 常驻 5★ =====
  '维里奈': {
    intro: '衍射 · 音感仪 · 治疗 · 「光合标记 + 全队衍射 buff」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '星星花', skillName: '扩繁试验', burstName: '草木生长', varName: '盛放入场',
      skillFollowUp: '回 <b class="term-resource">光合能量</b>。 2 链：技能额外回 1 光合 + 10 协奏。',
      burstFollowUp: '<b class="term-burst">解放</b>给全队挂<b class="term-resource">光合标记</b>（持续治疗）。 3 链：<b class="term-resource">光合标记</b>治疗加成 +12%。 4 链：重击/解放/延奏后全队衍射 +15%。 5 链：治疗低 HP 角色时治疗 +20%。 6 链：重击·星星花绽放 +20% + <b class="term-resource">协同攻击</b>。'
    }),
    forteName: '光合能量',
    forteDesc: '维里奈是<b style="color:var(--accent)">衍射治疗</b>位：<b class="term-burst">共鸣解放·草木生长</b>给全队<b class="term-resource">光合标记</b>持续回血，<b class="term-resource">延奏·盛放</b>给登场角色额外回血。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻技能积能量 → 解放铺光合标记 → 切到主 C → 后续切回挂延奏。'
  },
  '安可': {
    intro: '热熔 · 佩枪 · 主C · 「失序值 + 黑咩大暴走」',
    customLines: makeSkillLines({
      element: '热熔',
      forteName: '失序值',
      normalNameWhite: '羊咩出击', normalNameBlack: '黑咩·胡闹',
      skillNameWhite: '热力羊咩', skillNameBlack: '黑咩·狂热',
      heavyNameWhite: '白咩·失控之炎', heavyNameBlack: '黑咩·暴走之炎', burstName: '黑咩大暴走', varName: '咩咩帮手',
      normalForteGainWhite: 20, normalForteGainBlack: 10,
      skillForteGainWhite: 35, skillForteGainBlack: 10,
      hasHeavy: true,
      burstMechWhite: '安可释放<b class="term-burst">黑咩大暴走</b>进入<b style="color:#a78bff">黑咩形态</b>并持续 <b>4</b> 个回合，期间攻击和技能获得强化并额外 +<b>10</b> <b class="term-resource">失序值</b>。',
      burstMechBlack: '<b style="color:#a78bff">黑咩形态</b>期间，普攻和技能已切换为强化版；<b class="term-resource">失序值</b>满时重击触发<b class="term-burst">黑咩·暴走之炎</b>。',
      encoreBurstToggle: true,
      skillFollowUp: '1 链：普攻命中给自身热熔 +3%/层（最多 4 层）。 2 链：普攻/共鸣技能额外回 10 能量。 5 链：共鸣技能伤害加成 +35%。',
      heavyFollowUp: '3 链：白咩·失控之炎 / 黑咩·暴走之炎伤害倍率 +40%。 4 链：黑咩·暴走之炎后全队热熔 +20%。',
      burstFollowUp: '6 链：黑咩大暴走期间每段伤害叠 1 层<b class="term-resource">迷失羔羊</b>（攻击 +5%，最多 5 层）。'
    }),
    showSkillModeToggle: true,
    forteName: '失序值',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 核心资源</span><br>· <b class="term-resource">失序值</b> 0-100：普攻 +20 / 共鸣技能 +35 / 变奏 +30；黑咩形态内命中额外 +10<br>· 失序值满时施放重击：消耗 100 失序值，常态触发<b class="term-burst">白咩·失控之炎</b>；黑咩形态内触发<b class="term-burst">黑咩·暴走之炎</b>。'
  },
  '凌阳': {
    intro: '冷凝 · 迅刀 · 主C · 「狮子奋迅 + 行狮强化」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '挥斩', skillName: '飞身式·翻山越涧', burstName: '狮子奋迅', varName: '出洞·睡狮蛰醒',
      skillMech: '<span style="color:var(--muted)">行狮期间：</span>共鸣技能后下次普攻会获得 6 链强化（若已激活）。',
      burstMech: '<span style="color:var(--muted)">形态切换：</span>释放<b class="term-burst">共鸣解放·狮子奋迅</b>后进入<b class="term-resource">行狮</b>形态；期间普攻/技能获得强化，6 链时技能后下次普攻 +100%。',
      skillFollowUp: '6 链：行狮状态下，共鸣技能后下次普攻 +100%。',
      burstFollowUp: '开启<b style="color:var(--gold)">行狮形态</b>。 2 链：变奏额外回 10 能量。 3 链：解放期间普攻 +20% / 技能 +10%。 4 链：延奏给全队冷凝 +20%。 5 链：解放额外 atk × 200% 冷凝伤害。'
    }),
    forteName: '行狮',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 形态切换</span><br>· 常态：普通普攻/技能循环<br>· 释放<b class="term-burst">共鸣解放·狮子奋迅</b> → 进入<b class="term-resource">行狮</b>形态<br>· 行狮期间：3 链给普攻 +20% / 技能 +10%；6 链每次技能后下次普攻 +100%<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>变奏入场 → 共鸣解放进入行狮 → 技能 → 强化普攻 → 重复循环。'
  },
  '鉴心': {
    intro: '气动 · 臂铠 · 辅助 · 「架势反击 + 涤净力场」',
    customLines: makeSkillLines({
      element: '气动',
      normalName: '掌击', skillName: '静气循行', burstName: '涤净力场', varName: '掌息之要',
      burstMech: '<span style="color:var(--muted)">重击联动：</span>施放<b class="term-heavy">重击·混元气旋</b>后，4 链会让<b class="term-burst">涤净力场</b>伤害 +80%。',
      skillMech: '<span style="color:var(--muted)">派生条件：</span>施放<b class="term-skill">静气循行</b>进入<b class="term-resource">架势</b>，保持 <b>1</b> 回合后下次技能变为<b class="term-skill">行气反击</b>。',
      skillFollowUp: '进入<b class="term-resource">架势</b>。 2 链：使用次数 +1。 3 链：架势保持后可打出<b class="term-skill">行气反击</b>。',
      burstFollowUp: '<b class="term-burst">涤净力场</b>清场。 4 链：重击·混元气旋时解放 +80%。 5 链：解放额外回 20 能量。 6 链：气动伤害 +20%。'
    }),
    forteName: '架势',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 派生条件</span><br>· 施放<b class="term-skill">共鸣技能·静气循行</b> → 进入<b class="term-resource">架势</b><br>· 架势保持 <b>1</b> 回合后，再次施放技能 → <b class="term-skill">行气反击</b><br>· 6 链：重击·混元气旋期间可施放特殊行气反击（atk×557% 重击类型）<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能进入架势 → 等 1 回合/或技能派生 → 行气反击 → 重击·混元气旋 → 共鸣解放·涤净力场。'
  },

  // ===== 4★ 角色 =====
  '莫特斐': {
    intro: '热熔 · 佩枪 · 副C · 「浮翼狂想协同」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '佩枪射击', skillName: '应援', burstName: '浮翼狂想', varName: '声骸入场',
      skillFollowUp: '4 链：技能命中后全队热熔 +12%。',
      burstFollowUp: '<b class="term-burst">浮翼狂想</b>协同窗口：主 C 用技能时莫特斐补刀。 1 链：解放期间共鸣技能触发协同。 2 链：声骸后额外回 10 能量。 3 链：加强音暴伤 +30%。 4 链：解放时长 +7 秒。 5 链：共鸣技能命中触发协同。 6 链：解放·暴烈终曲时全队攻击 +20%。'
    }),
    forteDesc: '莫特斐是<b style="color:#ff8c5e">热熔副C</b>：<b class="term-burst">共鸣解放·浮翼狂想</b>开启协同窗口，主 C 用技能时莫特斐补刀。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>解放铺协同 buff → 切到主 C 用技能触发莫特斐协同。'
  },
  '散华': {
    intro: '冷凝 · 长刃 · 副C · 「五段普攻 + 重击爆裂」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '剑舞', skillName: '朔雪永冻', heavyName: '爆裂', burstName: '焦瞑冻土', varName: '剑修入场',
      hasHeavy: true,
      skillFollowUp: '1 链：第 5 段普攻后暴击 +15%。',
      heavyFollowUp: '4 链：解放后下次重击·爆裂 +120%。 6 链：重击·爆裂倍率 +50%。',
      burstFollowUp: '消耗<b class="term-resource">冰绽</b>。 4 链：解放回 10 能量。 5 链：<b class="term-resource">冰绽</b>暴击伤害 +100%，冰棘/冰棱/冰川消失时直接爆炸。 6 链：引爆冰棱/冰川后全队攻击 +10%×2 层。'
    }),
    forteDesc: '散华是<b style="color:#7bd6ff">冷凝副C</b>：核心是<b class="term-heavy">重击·爆裂</b>，配合 4 链解放后的高倍率爆发。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>普攻 5 段 → 共鸣技能 → 共鸣解放 → 重击·爆裂爆发。'
  },
  '卜灵': {
    intro: '导电 · 音感仪 · 辅助 · 「五雷荡煞阵」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '符咒', skillName: '五雷荡煞阵', burstName: '飞雷诀·归一', varName: '索拉云游',
      skillFollowUp: '<b class="term-resource">五雷荡煞阵</b>给团队电磁 debuff + 治疗。 5 链：荡煞阵生成时附加 6 层<b class="term-resource">电磁效应</b>。',
      burstFollowUp: '<b class="term-burst">飞雷诀</b>清场。 1 链：解放暴击 +20%。 2 链：<b class="term-resource">阴阳相生</b>回 25 能量。 3 链：荡煞阵期间全队 HP <50% 时治疗。 4 链：治疗加成 +20%。 6 链：<b class="term-resource">雷法·三才合一</b>时全队共鸣技能 +50%。'
    }),
    forteDesc: '卜灵是<b style="color:#7bd6ff">导电辅助</b>：<b class="term-skill">五雷荡煞阵</b>给团队电磁 debuff + 治疗，最强的 6 链全队<b class="term-skill">共鸣技能 +30%</b> 是核心辅助价值。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>开场共鸣技能铺雷阵 → 解放·飞雷诀爆发 → 切到主 C 享受全队技能 buff。'
  },
  '丹瑾': {
    intro: '湮灭 · 长刃 · 副C · 「朱蚀之刻 + 彤华暴击」',
    customLines: makeSkillLines({
      element: '湮灭',
      normalName: '红枝挥斩', skillName: '朱蚀之刻', burstName: '湮灭爆发', varName: '红椿入场',
      skillFollowUp: '给目标附加<b class="term-resource">朱蚀之刻</b>。 1 链：攻击带朱蚀目标 +5%/层（满 6 层 +30%）。 2 链：攻击带朱蚀目标伤害 +20%。',
      burstFollowUp: '3 链：共鸣解放伤害加成 +30%。 4 链：彤华 ≥ 60 时暴击 +15%。 5 链：湮灭伤害 +15%。 6 链：重击·缭乱后全队攻击 +20%。'
    }),
    forteDesc: '丹瑾是<b style="color:#a78bff">湮灭副C</b>：核心是<b class="term-resource">朱蚀之刻</b>给目标打 debuff，攻击朱蚀目标享受所有 1/2 链加成。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能挂朱蚀 → 普攻/重击堆攻击层数 → 共鸣解放爆发。'
  },
  '白芷': {
    intro: '冷凝 · 音感仪 · 治疗 · 「念意 + 频隙回响」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '音感弹', skillName: '应急预案', burstName: '刹那合弥', varName: '覆雪流盈',
      burstMech: '<span style="color:var(--muted)">治疗派生：</span>释放<b class="term-burst">刹那合弥</b>触发<b class="term-skill">频隙回响</b>多段治疗。',
      skillMech: '<span style="color:var(--muted)">资源消耗：</span>消耗<b class="term-resource">念意</b>治疗队友；满 4 点念意时治疗/冷凝加成更高。',
      skillFollowUp: '消耗<b class="term-resource">念意</b>给自身回能量。 1 链：每<b class="term-resource">念意</b>回 2.5 能量。 2 链：满<b class="term-resource">念意</b>时冷凝/治疗 +15%。',
      burstFollowUp: '<b class="term-burst">刹那合弥</b>触发<b class="term-skill">频隙回响</b>。 3 链：变奏后生命上限 +12%。 4 链：<b class="term-skill">频隙回响</b> +2 段 + 治疗 +20%。 5 链：复活倒下队友（每场战斗 1 次）。 6 链：拾取<b class="term-resource">天籁</b>时全队冷凝 +12%。'
    }),
    forteName: '念意',
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 治疗循环</span><br>· <b class="term-resource">念意</b> 0-4：普攻积攒，技能消耗念意治疗队友<br>· 满 4 念意时，共鸣技能治疗更强（2 链：冷凝/治疗 +15%）<br>· 释放<b class="term-burst">共鸣解放·刹那合弥</b> → 触发<b class="term-skill">频隙回响</b>多段治疗<br>· 5 链：白芷存活时可复活一次倒下队友<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>普攻积念意 → 共鸣技能治疗 → 能量满放解放持续回血 → 切主 C 输出。'
  },
  '秋水': {
    intro: '气动 · 佩枪 · 副C · 「雾化分身 + 雾化子弹」',
    customLines: makeSkillLines({
      element: '气动',
      normalName: '佩枪射击', skillName: '移位戏法', burstName: '虚幻迷雾', varName: '影舞入场',
      burstMech: '<span style="color:var(--muted)">潜行窗口：</span>释放解放后进入<b class="term-resource">迷雾潜行</b>，期间减伤并获得气动增益（5 链）。',
      skillMech: '<span style="color:var(--muted)">召唤物：</span>施放共鸣技能召唤<b class="term-resource">雾化分身</b>并生成<b class="term-resource">虚实之门</b>；分身会<b class="term-resource">嘲讽</b>目标。',
      skillFollowUp: '生成<b class="term-resource">雾化分身</b><b class="term-resource">嘲讽</b>敌人。 1 链：技能冷却 -1 回合。 2 链：攻击被<b class="term-resource">嘲讽</b>目标时攻击 +15%。 3 链：穿<b class="term-resource">虚实之门</b>额外生成 2 颗子弹。 4 链：共鸣技能·雾化子弹 +30%。',
      burstFollowUp: '5 链：<b class="term-resource">迷雾潜行</b>时气动 +25%。 6 链：解放暴击 +8%；重击穿<b class="term-resource">虚实之门</b> +50%。'
    }),
    forteDesc: '<span style="color:var(--gold);font-size:11px">▸ 机制说明</span><br>· <b class="term-skill">共鸣技能·移位戏法</b>召唤<b class="term-resource">雾化分身</b>，分身嘲讽目标<br>· <b class="term-resource">虚实之门</b>：普攻/重击穿过门时获得额外子弹/伤害<br>· <b class="term-resource">迷雾潜行</b>：释放解放后进入，期间减伤；5 链气动伤害 +25%<br><br><span style="color:var(--gold);font-size:11px">▸ 推荐战斗节奏</span><br>共鸣技能召分身 + 虚实之门 → 普攻穿门追加子弹 → 共鸣解放进入迷雾潜行 → 重击穿门爆发。'
  },
  '炽霞': {
    intro: '热熔 · 佩枪 · 副C · 「炽烈焰火 + 热压弹」',
    customLines: makeSkillLines({
      element: '热熔',
      normalName: '咻咻射击', skillName: '咻咻斗意', burstName: '炽烈焰火', varName: '英雄入场',
      skillFollowUp: '1 链：共鸣技能·轰轰必定暴击。 6 链：触发技能·轰轰后全队普攻 +25%。',
      burstFollowUp: '<b class="term-resource">热压弹</b> 60 发持续输出。 2 链：解放期间击败目标回 5 能量。 3 链：解放对低 HP 目标 +40%。 4 链：获 60 弹 + 重置技能 CD。 5 链：<b class="term-resource">加麻加辣</b>满层时攻击 +30%。'
    }),
    forteDesc: '炽霞是<b style="color:#ff8c5e">热熔副C</b>，核心是<b class="term-burst">共鸣解放·炽烈焰火</b>的 60 发热压弹 + 重置技能 CD。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能·轰轰 → 共鸣解放·炽烈焰火 → 60 弹高速输出 → 重置 CD 再放技能。'
  },
  '秧秧': {
    intro: '气动 · 音感仪 · 副C · 「风场牵引 + 空中释羽」',
    customLines: makeSkillLines({
      element: '气动',
      normalName: '羽箭', skillName: '风场鸣声', heavyName: '空中释羽', burstName: '湛蓝礼赞', varName: '湛蓝入场',
      hasHeavy: true,
      skillFollowUp: '<b class="term-skill">风场鸣声</b><b class="term-resource">牵引</b>敌人。 3 链：共鸣技能 +40%。',
      heavyFollowUp: '<b class="term-heavy">空中释羽</b>是核心输出段。 4 链：<b class="term-heavy">空中释羽</b> +95%。',
      burstFollowUp: '1 链：变奏后气动 +15%。 2 链：重击命中回 10 能量。 5 链：解放·朔风旋涌 +85%。 6 链：<b class="term-heavy">空中释羽</b>后全队攻击 +20%。',
    }),
    forteDesc: '秧秧是<b style="color:var(--green)">气动副C</b>：<b class="term-skill">风场鸣声</b>牵引敌人 + <b class="term-heavy">空中释羽</b>主输出。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能铺风场 → 变奏入场叠气动 buff → 空中重击释羽爆发。'
  },
  '桃祈': {
    intro: '衍射 · 臂铠 · 辅助 · 「磐岩护壁 + 不动如山」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '岩拳', skillName: '磐岩护壁', burstName: '不动如山', varName: '盾守入场',
      skillFollowUp: '<b class="term-skill">磐岩护壁</b>给全队护盾。 3 链：磐岩护壁持续延长。 6 链：磐岩护壁期间普攻/重击 +40%。',
      burstFollowUp: '<b class="term-burst">不动如山</b>反击爆发。 1 链：护盾量 +40%。 2 链：解放暴击/暴伤 +20%。 4 链：重击发后制人触发时回血 + 防御 +50%。 5 链：<b class="term-resource">攻防转换</b>命中回 20 能量。'
    }),
    forteDesc: '桃祈是<b style="color:var(--accent)">衍射辅助</b>（护盾型）：<b class="term-skill">磐岩护壁</b>给全队护盾，<b class="term-burst">共鸣解放·不动如山</b>反击爆发。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能上护盾 → 重击发后制人触发反击 → 共鸣解放收尾。'
  },
  '渊武': {
    intro: '导电 · 臂铠 · 辅助 · 「雷之楔协同 + 寂土重明」',
    customLines: makeSkillLines({
      element: '导电',
      normalName: '雷拳', skillName: '雷之楔', burstName: '寂土重明', varName: '轰雷入场',
      skillFollowUp: '<b class="term-skill">雷之楔</b>召唤协同武器。 3 链：<b class="term-skill">雷之楔</b>命中按 20% 防御加伤。',
      burstFollowUp: '<b class="term-burst">寂土重明</b>给全队护盾。 1 链：雷厉风行状态攻速 +20%。 2 链：变奏·轰雷回 15 能量。 5 链：<b class="term-skill">雷之楔</b>在场时解放 +50%。 6 链：<b class="term-skill">雷之楔</b>范围内全队防御 +32%。'
    }),
    forteDesc: '渊武是<b style="color:#7bd6ff">导电辅助</b>：<b class="term-skill">雷之楔</b>召唤协同武器，<b class="term-burst">共鸣解放·寂土重明</b>给全队护盾。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>变奏入场积能量 → 共鸣技能召楔 → 共鸣解放给全队护盾。'
  },
  '釉瑚': {
    intro: '冷凝 · 臂铠 · 副C · 「诗中物对偶/联珠」',
    customLines: makeSkillLines({
      element: '冷凝',
      normalName: '匣中拳', skillName: '匣中问祯', burstName: '诗中物·终幕', varName: '酣睡入场',
      skillFollowUp: '靠<b class="term-resource">诗中物</b><b class="term-skill">对偶</b>/<b class="term-skill">联珠</b>/<b class="term-skill">合说</b>叠层。 1 链：技能·问祯有 10% 概率免伤。 2 链：<b class="term-skill">对偶</b>/<b class="term-skill">联珠</b>对诗中物效果二次触发。 4 链：20% 概率技能不进 CD。',
      burstFollowUp: '<b class="term-burst">诗中物·终幕</b>清场。 3 链：攻击 +20%。 5 链：变奏·遂心匣后暴击 +15%。 6 链：奇珍赏获<b class="term-resource">霁青</b> 4 层（暴击伤害 +60%）。'
    }),
    forteDesc: '釉瑚是<b style="color:#7bd6ff">冷凝副C</b>：靠<b class="term-resource">诗中物</b>的对偶/联珠/合说叠层放大伤害。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>共鸣技能·匣中问祯起手 → 普攻补段叠层 → 共鸣解放爆发。'
  },
  '灯灯': {
    intro: '衍射 · 臂铠 · 副C · 「强化前扑/后撤 + 啾啾专送」',
    customLines: makeSkillLines({
      element: '衍射',
      normalName: '快递投掷', skillName: '强化·前扑', burstName: '啾啾专送', varName: '派送入场',
      skillFollowUp: '<b class="term-skill">强化·前扑/后撤</b>无视防御。 1 链：<b class="term-skill">强化·后撤</b>回耐力。 2 链：<b class="term-skill">强化·前扑</b>/后撤无视 20% 防御。 5 链：光能满时强光穿射倍率 +100%。',
      burstFollowUp: '3 链：共鸣解放·啾啾专送 +30%。 4 链：普攻伤害加成 +30%。 6 链：解放时全队攻击 +20%。'
    }),
    forteDesc: '灯灯是<b style="color:var(--accent)">衍射副C</b>：<b class="term-skill">强化·前扑/后撤</b>无视防御，<b class="term-normal">普攻</b>主输出。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>强化前扑/后撤 → 普攻铺伤害 → 共鸣解放·啾啾专送清场。'
  },

  '吟霖': {
    intro: '导电 · 音感仪 · 副C · 「审判印记」标记型副C',
    // 文案=具体数值，tooltip=计算公式
    customLines: (stats, role) => {
      const tipAttr = s => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
      const chain = role.chain || 0;
      const atk = stats.atk;
      const energyMax = stats.maxEnergy || 125;

      // ===== 共鸣链相关参数 =====
      const markSkillMult = chain >= 1 ? 1.7 : 1.0;        // 1 链：技能/解放对印记 ×1.7
      const markBurstMult = chain >= 5 ? 1.5 : 1.0;        // 5 链：解放对印记额外 ×1.5（B-Tier 下调，原 ×2.0）
      const markVulnPerStack = chain >= 3 ? 0.10 : 0;      // 3 链：印记每层 +10%（B-Tier 下调，原 +15%）
      const teamAtkOnTrigger = chain >= 4 ? 0.15 : 0;      // 4 链：审判之雷触发时全队 atk +15%（B-Tier 下调，原 +20%）
      const jiTingMult = chain >= 6 ? 0.7 : 0;             // 6 链：疾霆昭彰 atk×70%（B-Tier 下调，原 ×100%）

      // ===== 真实伤害数（命中前结算，命中印记目标的总倍率）=====
      const normalDmg = Math.round(atk * 1.0);
      const skillDmg  = Math.round(atk * 1.8);
      const burstMainDmg = Math.round(atk * 4.0);
      const burstSideDmg = Math.round(atk * 2.0);
      // 对印记目标的额外加成：debuffBonus × 1链(技能/解放) × 5链(解放) × 3链每层
      const maxStacks = 3;
      const vulnFull = 1 + markVulnPerStack * maxStacks;   // 满 3 层易伤总倍率
      const markedSkillDmg = chain >= 1 ? Math.round(skillDmg * markSkillMult * vulnFull) : skillDmg;
      const markedBurstMain = Math.round(burstMainDmg * markSkillMult * markBurstMult * vulnFull);
      const jiTingDmg = chain >= 6 ? Math.round(atk * jiTingMult * markSkillMult) : 0;
      const varDmg = Math.round(atk * 0.8);
      const varConcerto = Math.round(atk * 1.6);

      // ===== 公式 tooltips =====
      const normalTip = tipAttr(
        `<b style="color:var(--gold)">普攻伤害公式</b><br>` +
        `= 攻击 <b>${atk}</b> × 100% = <b style="color:var(--text)">${normalDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">命中印记目标额外 +${(markVulnPerStack*100).toFixed(0)}%/层（3 链）；解放后窗口期内额外触发疾霆昭彰（6 链）</span>`
      );
      const skillTip = tipAttr(
        `<b style="color:var(--gold)">共鸣技能伤害公式</b><br>` +
        `· 普通目标：攻击 <b>${atk}</b> × 180% = <b style="color:var(--accent)">${skillDmg}</b><br>` +
        (chain >= 1 ? `· 印记目标：${skillDmg} × <b style="color:var(--gold)">1.7</b>${markVulnPerStack>0?` × (1 + ${(markVulnPerStack*100).toFixed(0)}%×层)`:''} = <b style="color:var(--accent)">${markedSkillDmg}</b>（满 3 层）` : '') +
        `<br>命中后回复 22 能量、+30 审判值`
      );
      const burstTip = tipAttr(
        `<b style="color:var(--gold)">解放伤害公式</b><br>` +
        `· 主目标：攻击 <b>${atk}</b> × 400% = ${burstMainDmg}<br>` +
        `· 副目标：攻击 <b>${atk}</b> × 200% = ${burstSideDmg}<br>` +
        (chain >= 1 ? `· 主目标对印记叠满：${burstMainDmg} × <b style="color:var(--gold)">1.7</b>${chain>=5?` × <b style="color:var(--gold)">${markBurstMult.toFixed(1)}</b>`:''}${markVulnPerStack>0?` × <b style="color:var(--gold)">${vulnFull.toFixed(2)}</b>`:''} = <b style="color:#ff8c5e">${markedBurstMain}</b>`:``)
      );
      const jiTingTip = chain >= 6 ? tipAttr(
        `<b style="color:var(--gold)">疾霆昭彰公式</b>（共鸣链 6）<br>` +
        `= 攻击 <b>${atk}</b> × ${(jiTingMult*100).toFixed(0)}%${markVulnPerStack>0?` × 1.7（1 链 × 印记目标）`:''} = <b style="color:var(--accent)">${jiTingDmg}</b><br>` +
        `<span style="color:var(--muted);font-size:10px">解放后 2 回合内，普攻命中印记目标额外触发（每回合 1 次）</span>`
      ) : '';
      const varTip = tipAttr(
        `<b style="color:var(--gold)">变奏伤害公式</b><br>` +
        `· 普通：攻击 <b>${atk}</b> × 80% = ${varDmg}<br>` +
        `· 协奏满：攻击 <b>${atk}</b> × 160% = <b style="color:var(--accent)">${varConcerto}</b>`
      );

      // 共鸣链激活的额外效果摘要
      const chainExtras = [
        chain >= 2 ? `命中印记目标额外 +<b>5</b> 审判 / +<b>5</b> 能量（共鸣链 2）` : '',
        chain >= 4 ? `审判之雷触发时全队攻击 +<b>${(teamAtkOnTrigger*100).toFixed(0)}%</b>（2 回合 · 共鸣链 4）` : ''
      ].filter(Boolean).join('<br>');
      const chainHints = chainExtras ? `<br>${chainExtras}` : '';

      return [
        {
          icon: '⚔', name: '普攻 · 音感弹', cost: '1 AP',
          color: 'var(--text)',
          desc: `对目标造成 <span class="tip" data-tip='${normalTip}'><b style="color:var(--text)">${normalDmg}</b> 点</span><b class="term-normal">导电伤害</b>，命中后回复 12 共鸣能量、积累 8 协奏值、<b class="term-resource">审判值</b> +<b>15</b>。${chain>=6?`<br>解放后 2 回合内，命中印记目标额外触发 <span class="tip" data-tip='${jiTingTip}'><b class="term-skill">疾霆昭彰</b>（<b style="color:var(--accent)">${jiTingDmg}</b>）</span>。`:''}`
        },
        {
          icon: '✦', name: '共鸣技能 · 磁殛咆哮', cost: '1 AP · 冷却 3 回合',
          color: 'var(--accent)',
          desc: `对目标造成 <span class="tip" data-tip='${skillTip}'><b style="color:var(--accent)">${skillDmg}</b>${chain>=1?`（对印记目标 <b style="color:var(--gold)">${markedSkillDmg}</b>）`:''} 点</span><b class="term-skill">导电伤害</b>，命中后回复 22 能量、<b class="term-resource">审判值</b> +<b>30</b>。${chainHints}`
        },
        {
          icon: '⚡', name: '共鸣解放 · 破天雷灭击', cost: `3 AP · 需共鸣能量满 ${energyMax}`,
          color: 'var(--gold)',
          desc: `对主目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstMainDmg}</b>${chain>=1?`（印记叠满 <b style="color:var(--gold)">${markedBurstMain}</b>）`:''} 点</span>、副目标造成 <span class="tip" data-tip='${burstTip}'><b style="color:#ff8c5e">${burstSideDmg}</b> 点</span><b class="term-burst">导电伤害</b>。<br>必为主目标挂 <b>1</b> 层<b class="term-resource">审判印记</b>。${chain>=6?`<br>释放后 <b>2</b> 回合内开启<b class="term-skill">疾霆昭彰</b>（见普攻）。`:''}`
        },
        {
          icon: '🎵', name: '变奏技能 · 雷霆入场', cost: '切换上场时触发',
          color: '#c39bff',
          desc: `切换至吟霖上场，对当前主目标造成 <span class="tip" data-tip='${varTip}'><b style="color:var(--accent)">${varDmg}</b>（协奏满 <b>${varConcerto}</b>）点</span><b class="term-variation">导电伤害</b>。`
        }
      ];
    },
    forteName: '审判值',
    forteDesc: '吟霖不依赖普通的破阵/技能循环，而是<b class="term-resource">审判值</b>（0-100）：<b class="term-normal">普攻</b> +<b>15</b> / <b class="term-skill">共鸣技能</b> +<b>30</b>。<br>满 <b>100</b> 自动触发<b class="term-resource">审判之雷</b>：给当前主目标挂 <b>1</b> 层<b class="term-resource">审判印记</b>（持续 3 回合，最高 3 层）。<br><br><b class="term-resource">审判印记</b>是吟霖的真正价值 —— <b>全队</b>对印记目标输出时享受加成（3 链 +15%/层 易伤；吟霖自己技能/解放 1 链 ×1.7、5 链 ×2.0）。<br><br><span style="color:var(--gold);font-size:10px">▸ 推荐战斗节奏</span><br>开场普攻/技能堆审判 → 满 100 标记主目标 → 切到主 C 让队友打印记目标 → 能量满放解放给主目标补印记 + 全队 atk buff。'
  },
};

function stripSkillPageNoise(html) {
  return String(html || '')
    .replace(/<br><br><span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '')
    .replace(/<br><span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '')
    .replace(/<span[^>]*>▸ 推荐战斗节奏<\/span><br>[\s\S]*$/g, '');
}

function renderForteBlock(forteName, forteDesc) {
  if (!forteDesc) return '';
  return `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed var(--line);font-size:13px;line-height:1.75">
    <div><b style="color:#c39bff;font-size:14px">🌀 ${forteName}</b></div>
    <div style="color:var(--dim);padding-left:16px;margin-top:4px">${forteDesc}</div>
  </div>`;
}

// 角色技能与共鸣回路区块
function renderSkillsBlock(roleName, meta, roleOverride = null) {
  const f = getForte(roleName);
  const s = SKILL_HINTS[roleName];
  const stats = computeRoleStatsForModal(roleName) || {};

  // 通用 fallback（无定制技能描述）
  const isMC = meta.type === '主C' || meta.type === '副C';
  const intro = s?.intro || `${meta.element}${meta.weaponType}${meta.type}`;
  const forteName = s?.forteName || f.resourceName;
  const forteDesc = stripSkillPageNoise(s?.forteDesc || f.desc);
  const forteBlock = renderForteBlock(forteName, forteDesc);
  const skillModeToggle = s?.showSkillModeToggle
    ? `<button class="mbtn" style="padding:5px 11px;font-size:12px;line-height:1.2" title="切换普攻 / 技能 / 重击文案" onclick="event.stopPropagation();window.__toggleEncoreBurstMode()">${window.__encoreBurstMode === 'black' ? '黑咩版' : '白咩版'}</button>`
    : '';

  // 4 段技能：优先用 customLines（可以是数组或函数）
  let linesHtml;
  if (s?.customLines) {
    const lines = typeof s.customLines === 'function' ? s.customLines(stats, roleOverride || getRoleForModal(roleName) || {}) : s.customLines;
    linesHtml = lines.map(L => `
      <div style="margin-bottom:8px">
        <b style="color:${L.color};min-width:70px;display:inline-block;font-size:14px">${L.icon} ${L.name}</b>
        <span style="color:var(--muted);font-size:12px"> · ${L.cost}</span>
        <div style="color:var(--dim);padding-left:22px;margin-top:4px;font-size:13px;line-height:1.65">${attachTermTips(L.desc)}</div>
      </div>
    `).join('');
  } else {
    const normal = s?.normal || '基础打击';
    const skill = s?.skill || (isMC ? '元素技能（180% atk · CD 3回合）' : '增益/治疗技能（180% atk）');
    const burst = s?.burst || (meta.type === '辅助' || meta.type === '治疗' ? '展开领域 / 全队治疗（能量满激活）' : '元素范围爆发（主 400% / 副 200% · 能量满激活）');
    linesHtml = `
      <div><b style="color:var(--text);min-width:70px;display:inline-block;font-size:14px">⚔ 普攻</b><span style="color:var(--muted);font-size:12px"> · 1 AP</span><br><span style="color:var(--dim);padding-left:22px;font-size:13px;line-height:1.65">${normal} · 100% 攻击 · +12 能量 · 削破韧 8</span></div>
      <div><b style="color:var(--accent);min-width:70px;display:inline-block;font-size:14px">✦ 技能</b><span style="color:var(--muted);font-size:12px"> · 1 AP · CD 3回合</span><br><span style="color:var(--dim);padding-left:22px;font-size:13px;line-height:1.65">${skill} · +22 能量 · 削破韧 20</span></div>
      ${s?.hasHeavy ? `<div><b style="color:#ff8c5e;min-width:70px;display:inline-block;font-size:14px">💢 重击</b><span style="color:var(--muted);font-size:12px"> · 2 AP · CD 1回合</span><br><span style="color:var(--dim);padding-left:22px;font-size:13px;line-height:1.65">重击伤害类型 · 220% 攻击 · +15 能量 · 削破韧 25</span></div>` : ''}
      <div><b style="color:var(--gold);min-width:70px;display:inline-block;font-size:14px">⚡ 解放</b><span style="color:var(--muted);font-size:12px"> · 3 AP · 能量满</span><br><span style="color:var(--dim);padding-left:22px;font-size:13px;line-height:1.65">${burst} · AOE · 削破韧 30</span></div>
    `;
  }

  return `<div style="border:1px solid var(--line);border-radius:10px;padding:14px 16px;background:rgba(245,207,107,.03);margin-bottom:10px;border-bottom:2px solid rgba(245,207,107,.2)">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px">
      <div style="font-size:12px;color:var(--gold);letter-spacing:2px">技 能 介 绍</div>
      ${skillModeToggle}
    </div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:12px;letter-spacing:.3px">▸ ${intro}</div>

    <div style="display:grid;grid-template-columns:1fr;gap:8px;font-size:13px;line-height:1.65">
      ${linesHtml}
    </div>

    ${forteBlock}
  </div>`;
}
