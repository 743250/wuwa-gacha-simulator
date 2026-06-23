// 渲染主入口
import { S, DAY, fmt, $ } from '../state.js';
import { activePhase, activeBanners, cur, poolKind, poolTitle, tideKey, tideName, tideLetter, targetOptions } from '../gacha/core.js';
import { shopCatalog } from '../shop/actions.js';
import { seqText } from '../data/seq.js';
import { standard5 } from '../data/chars.js';
import { openModal } from '../modal.js';
import { upgrade } from '../gacha/core.js';
import { saveState } from '../save.js';
import { computeBattleStats, calcBP, expToNext, weaponToNext, EXP_VALUES } from '../battle/stats.js';
import { getMeta } from '../battle/template.js';
import { WEAPON_DATA } from '../equip/weapons.js';
import { levelUpRole, levelUpRoleMax, levelUpWeapon, levelUpWeaponMax, equipWeapon, unequipWeapon, getEquippableWeapons, totalExp } from '../equip/actions.js';
import { getForte } from '../battle/forte.js';
import { getChainLabels } from '../battle/chains.js';
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
  gres.push({ c: 'day', l: '体力', v: `${S.stamina}/${S.staminaMax}` });
  $('gres').innerHTML = gres.map(x => `<span class="gtag ${x.c}"><span class="dot"></span>${x.l} <b>${x.v}</b>${x.k ? `<button class="plus" onclick="openTopup('${x.k}')" title="兑换/补充">+</button>` : ''}</span>`).join('');

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
      else if (x.pool === 'noviceChoice') tag = '新旅';
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
      if (pool === 'standardWeapon') return '100% 自选武器';
      if (pool === 'beginner') return '50 抽内必出五星';
      if (pool === 'standardChar') return '常驻五星';
      return '';
    })();
    const headline = kind === 'weapon' ? b.weapon : (b.char || '常驻共鸣者');
    const subline = kind === 'weapon'
      ? (b.char ? `同期共鸣者 <b>${b.char}</b>` : `当前定向 <b>${b.weapon}</b>${b.weaponBanner ? ' · ' + b.weaponBanner : ''}`)
      : (b.pool === 'noviceChoice' ? `当前目标 <b>${b.char}</b>` : (b.weapon ? `同期武器 <b>${b.weapon}</b>` : '常驻五星角色池'));
    const remainDays = Math.max(0, Math.ceil((b.end - S.today) / DAY));
    $('bnArt').className = 'banner-art ' + (kind === 'weapon' ? 'theme-l' : 'theme-r');
    $('bnArt').innerHTML = `
      <div class="ba-main">
        <div class="ba-sub">${poolTitle(b)} · ${b.version}</div>
        <div class="ba-name${headline.length > 5 ? ' small' : ''}">${headline}</div>
        <div class="ba-banner">「${b.banner}」</div>
        <div class="ba-weapon">${subline}</div>
        <div class="ba-fours"><b>四 星</b> ${b.fours.join(' · ')}</div>
        ${targetOptions(b)}
      </div>
      <div class="ba-meta">
        <div class="ba-up">${upText}</div>
        <div class="ba-period">${b.end === Infinity ? '长期开放' : fmt(b.start) + ' — ' + fmt(b.end)}</div>
        <div class="ba-remaining">${b.end === Infinity ? '' : '剩余 <b style="color:var(--accent)">' + remainDays + '</b> 天'}</div>
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

  // 海市
  $('cAg').textContent = S.afterglow;
  $('cOs').textContent = S.oscillated;
  $('cAgHint').textContent = `可换 ${Math.floor(S.afterglow / 8)} 抽`;
  $('cOsHint').textContent = `可换 ${Math.floor(S.oscillated / 70)} 抽`;
  const tides = [['radiant', '浮金波纹'], ['forging', '铸潮波纹'], ['lustrous', '唤声波纹']];
  $('exList').innerHTML = tides.map(([k, n]) => {
    const agMax = Math.floor(S.afterglow / 8);
    const osLeft = 7 - (S.oscBuy[k] || 0);
    const osMax = Math.min(Math.floor(S.oscillated / 70), osLeft);
    return `<div class="exch">
      <div class="n"><span>${n}</span><span class="own">持有 <b>${S[k]}</b> 个</span></div>
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
    // 凝刻月相：6 档充值
    $('bannerTopup').innerHTML = shopCatalog.topup.map(it => renderTopupBanner(it)).join('');
    // 特惠专区：月卡 + 战令 + 限购礼包（非 regular 的 bundle）
    const featuredItems = [
      ...shopCatalog.monthly,
      ...shopCatalog.bundle.filter(it => !it.regular),
      ...shopCatalog.pass
    ];
    $('bannerFeatured').innerHTML = featuredItems.map(it => renderShopBanner(it)).join('');
    // 常驻礼包：bundle 中 regular = true 的
    const regularItems = shopCatalog.bundle.filter(it => it.regular);
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

// 角色面板的当前 tab（每次打开重置；切换 tab 时重新渲染）
let _currentRoleTab = 'basic';
let _currentRoleName = null;

export function openRoleModal(n) {
  _currentRoleName = n;
  _currentRoleTab = 'basic';
  renderRoleModal();
}

function renderRoleModal() {
  const n = _currentRoleName;
  const o = S.roles[n]; if (!o) return;
  const base = o.n.split(' / ')[0];
  const hasSeq = !!seqText[base];
  const stars = '★'.repeat(o.r);
  const meta = getMeta(n);
  const stats = computeBattleStats(n);
  const bp = calcBP(n);
  const expNext = expToNext(o);
  const wName = o.equipWeapon;
  const wObj = wName ? S.weapons[wName] : null;
  const wInfo = wObj ? `${wName} · LV${wObj.level} · 精${wObj.refine}` : '未装备';
  const chainLabels = getChainLabels(base);

  const elemColor = {
    '热熔': '#ff8c5e', '湮灭': '#c39bff', '气动': '#8de6a6',
    '冷凝': '#7bd6ff', '衍射': '#fff0b0', '导电': '#b58cff'
  }[meta.element] || '#fff';

  // 5 个 tab 配置
  const TABS = [
    { id: 'basic',  icon: '🧍', label: '基本属性' },
    { id: 'weapon', icon: '⚔', label: '武器' },
    { id: 'chain',  icon: '🔗', label: '共鸣链' },
    { id: 'skill',  icon: '✦', label: '战斗风格' },
    { id: 'levelup',icon: '🎯', label: '突破升级' }
  ];

  // 内容生成（按 tab）
  let content = '';
  if (_currentRoleTab === 'basic') {
    content = `
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
        敌方攻击时按此概率躲避（模拟玩家操作）。主C 18% / 副C 14% / 辅助 10% / 治疗 8%
      </div>`;
  }
  else if (_currentRoleTab === 'weapon') {
    content = `
      <div style="border:1px solid var(--line);border-radius:8px;padding:11px 13px;background:rgba(255,255,255,.02)">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">
          <span style="font-size:9px;color:var(--muted);letter-spacing:2px">装 备 武 器</span>
          <span style="font-size:10px;padding:2px 8px;border:1px solid var(--line2);color:var(--muted);border-radius:999px">${meta.weaponType}</span>
        </div>
        <div style="font-size:13px;font-weight:700;color:${wName ? 'var(--gold)' : 'var(--dim)'}">${wInfo}</div>
        ${wName && WEAPON_DATA[wName] ? renderWeaponDetail(wName, wObj) : '<div style="font-size:10px;color:var(--dim);margin-top:8px">点击下方"装备"选择匹配的武器</div>'}
        <div style="display:flex;gap:5px;margin-top:10px;flex-wrap:wrap">
          <button class="mbtn" onclick="openWeaponPicker('${n.replace(/'/g, "\\'")}')">${wName ? '换装' : '装备'}</button>
          ${wName ? `<button class="mbtn" onclick="window.__doUnequip('${n.replace(/'/g, "\\'")}')">卸下</button>` : ''}
          ${wName && wObj.level < 90 ? `<button class="mbtn gold" onclick="window.__levelUpWeapon('${wName.replace(/'/g, "\\'")}')">武器升级 (${weaponToNext(wObj)} 石)</button>` : ''}
          ${wName && wObj.level < 90 ? `<button class="mbtn" onclick="window.__levelUpWeaponMax('${wName.replace(/'/g, "\\'")}')">升满</button>` : ''}
        </div>
        <div style="font-size:10px;color:var(--muted);text-align:center;margin-top:10px">武器石库存 <b style="color:var(--gold)">${S.materials.weapon_book}</b></div>
      </div>`;
  }
  else if (_currentRoleTab === 'chain') {
    content = `
      <div style="font-size:11px;color:var(--muted);letter-spacing:.5px;text-align:center;margin:0 0 8px">
        共鸣链 <b style="color:var(--gold)">${o.chain}/6</b> · 回音频段 <b style="color:var(--accent)">${o.spare}</b>${o.bought ? ' · 海市兑换 ' + o.bought + '/2' : ''}
      </div>
      <div class="chain">${[1, 2, 3, 4, 5, 6].map(i => `<i class="${i <= o.chain ? 'on' : ''}">${i}链</i>`).join('')}</div>
      ${hasSeq ? `<div class="seq-detail">
        ${seqText[base].map((s, i) => `<div class="seq-line ${i < o.chain ? 'owned' : ''}">
          <b class="seq-name ${i < o.chain ? 'owned' : ''}">${i + 1}链 · ${s[0]}</b>
          <div class="seq-effect">${chainLabels[i] || '保留原文机制'}</div>
          <div class="seq-desc">${s[1]}</div>
        </div>`).join('')}
      </div>` : '<div style="font-size:11px;color:var(--dim);text-align:center;padding:10px">暂无共鸣链文案</div>'}`;
  }
  else if (_currentRoleTab === 'skill') {
    content = renderSkillsBlock(n, meta);
  }
  else if (_currentRoleTab === 'levelup') {
    content = `
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

  // 左侧 tab 栏 + 右侧内容
  const sidebar = TABS.map(t => `
    <div class="role-tab ${_currentRoleTab === t.id ? 'on' : ''}" onclick="window.__switchRoleTab('${t.id}')">
      <span class="rt-icon">${t.icon}</span>
      <span class="rt-lbl">${t.label}</span>
    </div>`).join('');

  const body = `
    <div class="role-modal-wrap">
      <div class="role-sidebar">
        <div class="role-portrait">
          <div style="font-size:16px;font-weight:700;color:${o.r === 5 ? 'var(--gold)' : '#dbc6ff'};letter-spacing:1px">${o.n}</div>
          <div style="font-size:10px;color:${o.r === 5 ? 'var(--gold)' : 'var(--purple)'};letter-spacing:2px;margin-top:3px">${stars}</div>
          <div style="display:flex;gap:3px;justify-content:center;margin-top:5px;flex-wrap:wrap">
            <span style="font-size:9px;padding:1px 6px;border:1px solid ${elemColor};color:${elemColor};border-radius:999px">${meta.element}</span>
            <span style="font-size:9px;padding:1px 6px;border:1px solid var(--line2);color:var(--muted);border-radius:999px">${meta.type}</span>
          </div>
          <div style="font-size:10px;color:var(--muted);margin-top:5px">LV ${o.level} · 链 ${o.chain}/6</div>
        </div>
        ${sidebar}
      </div>
      <div class="role-content">${content}</div>
    </div>`;

  const canUp = o.spare > 0 && o.chain < 6;
  openModal({
    title: '',
    body,
    className: 'role-modal',
    actions: [
      { cls: 'mbtn', label: '关闭', fn: () => {} },
      { cls: 'mbtn ' + (canUp ? 'gold' : ''), label: o.chain >= 6 ? '已满 6链' : (canUp ? `激活 ${o.chain + 1}链` : '无回音频段'), fn: () => { if (canUp) upgrade(o.n); } }
    ]
  });
}

// 切换 tab（onclick 调用）
window.__switchRoleTab = (tabId) => {
  _currentRoleTab = tabId;
  renderRoleModal();
};
window.openRoleModal = openRoleModal;

// 角色升级桥接
window.__levelUpRole = (n) => {
  if (levelUpRole(n)) { msg('升级成功', false); renderRoleModal(); render(); }
};
window.__levelUpRoleMax = (n) => {
  const c = levelUpRoleMax(n);
  if (c > 0) { msg(`+${c} 级`, false); renderRoleModal(); render(); }
  else msg('经验书不足');
};
window.__levelUpWeapon = (wn) => {
  if (levelUpWeapon(wn)) {
    msg('武器升级', false);
    const ownerName = S.weapons[wn]?.equippedBy;
    if (ownerName) renderRoleModal();
    render();
  }
};
window.__levelUpWeaponMax = (wn) => {
  const c = levelUpWeaponMax(wn);
  if (c > 0) {
    msg(`武器 +${c} 级`, false);
    renderRoleModal();
    render();
  }
};
window.__doUnequip = (n) => {
  unequipWeapon(n);
  renderRoleModal();
  render();
};

// 武器选择器
window.openWeaponPicker = (roleName) => {
  const list = getEquippableWeapons(roleName);
  if (!list.length) {
    openModal({
      title: '没有可装备的武器',
      body: '当前没有匹配类型的武器。<br>去抽卡获得武器吧！',
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
  openRoleModal(roleName);
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
  const limitLabel = it.period === 'month' ? `每月限购：${left}/${it.limit}`
                   : it.period === 'version' ? `本版本限购：${left}/${it.limit}`
                   : it.limit ? `限购：${left}/${it.limit}`
                   : '';
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
  const scale = 0.20 + lv * 0.0089;
  const refineMult = 1 + (refine - 1) * 0.25;

  // 实时攻击 + 副词条数值
  const baseAtk = Math.round(data.atk90 * scale);
  const sub = data.sub;
  const subText = sub ? `${SUB_STAT_LABEL[sub.stat] || sub.stat} ${formatStatValue(sub.stat, sub.value90 * scale)}` : '';

  // 静态被动（带精炼）
  const staticPassives = (data.passive || []).map(p => {
    const v = (p.value * refineMult * 100).toFixed(0);
    return `${PASSIVE_TYPE_LABEL[p.type] || p.type}${p.element ? ' · ' + p.element : ''} +${v}%`;
  });

  // 触发器列表（精炼倍率）
  const triggers = (data.triggers || []).map(t => {
    const v = (t.value * refineMult * 100).toFixed(0);
    const trig = TRIGGER_LABEL[t.on] || t.on;
    const eff = EFFECT_LABEL[t.effect] || t.effect;
    const stacks = t.maxStacks > 1 ? ` (×${t.maxStacks} 层)` : '';
    const dur = t.duration && t.duration < 99 ? ` · ${t.duration} 回合` : '';
    return `${trig} → ${eff}${t.element ? '(' + t.element + ')' : ''} +${v}%${stacks}${dur}`;
  });

  let html = `<div style="font-size:10px;color:var(--muted);margin-top:5px;line-height:1.5">
    <div>基础攻击 <b style="color:var(--red)">${baseAtk}</b>${subText ? ` · ${subText}` : ''}</div>`;
  if (staticPassives.length) {
    html += `<div style="color:var(--accent);margin-top:2px">▸ ${staticPassives.join(' · ')}</div>`;
  }
  if (triggers.length) {
    html += `<div style="margin-top:3px;padding-top:3px;border-top:1px dashed var(--line)">
      ${triggers.map(t => `<div style="color:var(--gold2);font-size:9px">⚡ ${t}</div>`).join('')}
    </div>`;
  }
  if (refine > 1) {
    html += `<div style="margin-top:3px;font-size:9px;color:var(--gold)">精炼 ${refine}/5 · 触发被动效果 ×${refineMult.toFixed(2)}</div>`;
  }
  html += '</div>';
  return html;
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

// 角色技能与机制简要描述（模拟器抽象，参考 AI 第三轮校准）
const SKILL_HINTS = {
  '忌炎': {
    intro: '气动长刃主C · 重击/聚怪输出',
    normal: '普攻长枪连段',
    skill: '突进型气动伤害（180% atk）',
    burst: '解放后进入强化状态，长枪连段重击（300% atk）'
  },
  '今汐': {
    intro: '衍射长刃主C · 共鸣技能爆发',
    normal: '普攻挥砍',
    skill: '韶光形态切换 → 高额衍射爆发（180% atk）',
    burst: '大范围衍射爆发（300% atk）'
  },
  '长离': {
    intro: '热熔迅刀主C · 心眼派生输出',
    normal: '迅刀挥砍',
    skill: '召唤焰离副本协同攻击（180% atk）',
    burst: '热熔爆发 + 补充离火（300% atk）'
  },
  '守岸人': {
    intro: '衍射音感仪辅助 · 治疗 + 增伤',
    normal: '音感仪打击',
    skill: '召唤星蝶治疗全队（180% atk 治疗）',
    burst: '展开治疗领域，给全队暴击/暴伤/增伤'
  },
  '椿': {
    intro: '湮灭迅刀主C · 普攻连段输出',
    normal: '红椿剑舞',
    skill: '切换攻击形态（180% atk）',
    burst: '湮灭范围爆发（300% atk）'
  },
  '珂莱塔': {
    intro: '冷凝佩枪主C · 技能爆发型',
    normal: '冷凝枪击',
    skill: '晶体强化共鸣技能（180% atk）',
    burst: '高额冷凝爆发（300% atk）'
  },
  '菲比': {
    intro: '衍射音感仪主C · 衍射失序状态',
    normal: '音感仪攻击',
    skill: '切换衍射形态（180% atk）',
    burst: '衍射范围爆发（300% atk）'
  },
  '卡提希娅': {
    intro: '气动迅刀主C · 气动侵蚀 + 牵引',
    normal: '迅刀挥砍',
    skill: '施加气动侵蚀（180% atk + debuff）',
    burst: '进入强化形态扩散输出（300% atk）'
  },
  '嘉贝莉娜': {
    intro: '热熔佩枪主C · 重击/猎杀',
    normal: '佩枪射击',
    skill: '强化枪击（180% atk）',
    burst: '猎杀阈值爆发（300% atk）'
  },
  '卡卡罗': {
    intro: '导电长刃主C · 解放强化形态',
    normal: '长刃挥砍',
    skill: '导电斩击（180% atk）',
    burst: 'Deathblade 形态 · 普攻/技能 +50%（持续 2 回合）'
  },
  '吟霖': {
    intro: '导电音感仪副C · 后台输出',
    normal: '音感仪攻击',
    skill: '导电领域（180% atk）',
    burst: '导电范围爆发（300% atk）'
  }
};

// 角色技能与共鸣回路区块
function renderSkillsBlock(roleName, meta) {
  const f = getForte(roleName);
  const s = SKILL_HINTS[roleName];

  // 通用 fallback（无定制技能描述）
  const isMC = meta.type === '主C' || meta.type === '副C';
  const intro = s?.intro || `${meta.element}${meta.weaponType}${meta.type}`;
  const normal = s?.normal || '基础打击';
  const skill = s?.skill || (isMC ? '元素技能（180% atk · CD 3回合）' : '增益/治疗技能（180% atk）');
  const burst = s?.burst || (meta.type === '辅助' || meta.type === '治疗' ? '展开领域 / 全队治疗（能量满激活）' : '元素范围爆发（300% atk · 能量满激活）');

  return `<div style="border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:rgba(245,207,107,.03);margin-bottom:10px;border-bottom:2px solid rgba(245,207,107,.2)">
    <div style="font-size:9px;color:var(--gold);letter-spacing:2px;margin-bottom:6px">技 能 与 机 制</div>
    <div style="font-size:10px;color:var(--muted);margin-bottom:8px;letter-spacing:.3px">▸ ${intro}</div>

    <div style="display:grid;grid-template-columns:1fr;gap:5px;font-size:10px;line-height:1.5">
      <div><b style="color:var(--text);min-width:50px;display:inline-block">⚔ 普攻</b><span style="color:var(--muted)"> · 1 AP</span><br><span style="color:var(--dim);padding-left:8px">${normal} · 100% 攻击 · +12 能量 · 削破韧 8</span></div>
      <div><b style="color:var(--accent);min-width:50px;display:inline-block">✦ 技能</b><span style="color:var(--muted)"> · 1 AP · CD 3回合</span><br><span style="color:var(--dim);padding-left:8px">${skill} · +22 能量 · 削破韧 20</span></div>
      <div><b style="color:#ff8c5e;min-width:50px;display:inline-block">💢 重击</b><span style="color:var(--muted)"> · 2 AP · CD 1回合</span><br><span style="color:var(--dim);padding-left:8px">重击伤害类型 · 220% 攻击 · +15 能量 · 削破韧 25</span></div>
      <div><b style="color:var(--gold);min-width:50px;display:inline-block">⚡ 解放</b><span style="color:var(--muted)"> · 3 AP · 能量满</span><br><span style="color:var(--dim);padding-left:8px">${burst} · AOE · 削破韧 30</span></div>
    </div>

    <div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--line);font-size:10px;line-height:1.5">
      <div><b style="color:#c39bff">🌀 共鸣回路</b><span style="color:var(--muted);font-size:9px;margin-left:6px">${f.resourceName} 0/${f.max}</span></div>
      <div style="color:var(--dim);padding-left:12px;margin-top:2px">${f.desc}</div>
    </div>

    <div style="margin-top:6px;font-size:10px;line-height:1.5">
      <div><b style="color:var(--green)">🎵 协奏 / 变奏 / 延奏</b></div>
      <div style="color:var(--dim);padding-left:12px;margin-top:2px">
        造成伤害积累<b style="color:#69b8ff">协奏值</b>（满 100）；切人时入场角色触发<b style="color:var(--accent)">变奏</b>（一段攻击）；协奏满时强化变奏 +伤害 +武器特殊被动
      </div>
    </div>
  </div>`;
}
