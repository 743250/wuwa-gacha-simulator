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
import { levelUpRole, levelUpRoleMax, levelUpWeapon, levelUpWeaponMax, refineWeapon, equipWeapon, unequipWeapon, getEquippableWeapons, totalExp } from '../equip/actions.js';
import { getForte } from '../battle/forte.js';
import { getOverrideMeta, hasChainOverride } from '../battle/chains.js';
import { attachTermTips } from './terms.js';
import { msg } from '../state.js';
import { escJs } from './render/utils.js';
import { makeSkillLines } from './render/skillLines.js';
import { SKILL_HINTS } from './render/skillHints.js';

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

// 武器详情弹窗（背包点击武器卡片时打开）
window.__openWeaponModal = (weaponName) => {
  const w = S.weapons[weaponName];
  if (!w) return;
  const data = WEAPON_DATA[weaponName];
  if (!data) return;
  const r = w.r || data.r || 5;
  const stars = '★'.repeat(r);
  const starColor = r === 5 ? 'var(--gold)' : r === 4 ? 'var(--purple)' : 'var(--accent)';
  const canLevel = (w.level || 1) < 90;
  const canRefine = (w.spareRefine || 0) > 0 && (w.refine || 1) < 5;
  const eqTag = w.equippedBy ? `<span style="color:var(--green)">装备于 ${w.equippedBy}</span>` : '<span style="color:var(--dim)">未装备</span>';

  function buildBody() {
    const body = `
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:28px;font-weight:700;letter-spacing:1px;color:${starColor}">${weaponName}</div>
        <div style="font-size:13px;color:${starColor};margin-top:2px">${stars}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">${data.type || '武器'} · Lv ${w.level || 1} / 90 · R${w.refine || 1}/5 · ${eqTag}</div>
      </div>
      ${renderWeaponDetail(weaponName, w)}
      <div style="display:flex;gap:5px;margin-top:12px;flex-wrap:wrap">
        <button class="mbtn" style="flex:1;font-size:11px;padding:6px" onclick="window.__weaponLevelUp('${weaponName.replace(/'/g, "\\'")}')" ${!canLevel ? 'disabled' : ''}>升级（${weaponToNext({level:w.level||1})} 石）</button>
        <button class="mbtn" style="flex:1;font-size:11px;padding:6px" onclick="window.__weaponLevelMax('${weaponName.replace(/'/g, "\\'")}')" ${!canLevel ? 'disabled' : ''}>升满</button>
        <button class="mbtn gold" style="flex:1;font-size:11px;padding:6px" onclick="window.__weaponRefine('${weaponName.replace(/'/g, "\\'")}')" ${!canRefine ? 'disabled' : ''}>精炼</button>
      </div>
      <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:8px">武器突破石库存 <b style="color:var(--gold)">${S.materials.weapon_book}</b></div>`;
    return body;
  }

  openModal({
    title: `武器详情`,
    body: buildBody(),
    className: 'role-modal',
    actions: [{ label: '关闭', cls: '', fn: () => {} }]
  });
};

// 武器弹窗内升级/升满/精炼（刷新弹窗内容而非关闭）
window.__weaponLevelUp = (name) => {
  if (levelUpWeapon(name)) msg(`${name} 升级成功`, false);
  else return;
  window.__openWeaponModal(name);
  window.__render();
};

window.__weaponLevelMax = (name) => {
  const c = levelUpWeaponMax(name);
  if (c > 0) msg(`${name} +${c} 级`, false);
  else { msg('武器突破石不足或已满级'); return; }
  window.__openWeaponModal(name);
  window.__render();
};

window.__weaponRefine = (name) => {
  const r = refineWeapon(name, 1);
  if (!r.ok) { msg(r.err); return; }
  msg(`${name} 精炼 +${r.used}（现 R${r.refine}）`, false);
  window.__openWeaponModal(name);
  window.__render();
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
  // 招式术语（长串优先 — 角色专属技能名先匹配，防止贪心截断）
  { re: /(看潮怒风哮之刃|听骑士从心祈愿)/g,                                    cls: 'term-burst' },
  { re: /(共鸣解放[··]终末回环|共鸣解放|终末回环)/g,                       cls: 'term-burst' },
  { re: /(共鸣技能[··][一-龥]{2,6}|共鸣技能)/g,                   cls: 'term-skill' },
  { re: /(共鸣回路|延奏技能|变奏技能|变奏|延奏|协奏)/g, replaceCls: dynamicTermCls },
  { re: /(重击)/g,                                                            cls: 'term-heavy' },
  { re: /(普攻)/g,                                                            cls: 'term-normal' },
  // 角色独有资源/状态名
  { re: /(星蝶|星域|破阵值|破阵|离火|韶光|晶体|红椿|杀意|猎杀阈值|决意|气动侵蚀|衍射失序|心眼)/g, cls: 'term-resource' },
  // 卡提希娅 专属术语
  { re: /(风蚀效应|芙露德莉斯)/g, cls: 'term-resource' },
  { re: /(人权|神权|异权)/g, cls: 'term-resource' },
  { re: /(形态之力)/g, cls: 'term-forte' }
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

// makeSkillLines 工厂已移至 ./render/skillLines.js
// escJs 已移至 ./render/utils.js

// 角色技能与机制简要描述（模拟器抽象，参考 AI 第三轮校准）

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
