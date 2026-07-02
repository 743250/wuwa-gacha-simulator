import { fmt, $ } from '../../state.js';
import { VERSION_NAMES } from '../../data/phases.js';
import { poolKind } from '../../gacha/core.js';

export function renderTopOverview(phases, banners, state) {
  const gres = [
    { c: 'ast', l: '星声', v: state.astrite.toLocaleString(), k: 'astrite' },
    { c: 'lun', l: '月相', v: state.lunite, k: 'lunite' },
    { c: 'r', l: '浮金', v: state.radiant, k: 'radiant' },
    { c: 'f', l: '铸潮', v: state.forging, k: 'forging' },
    { c: 'l', l: '唤声', v: state.lustrous, k: 'lustrous' }
  ];
  if (state.days > 0) gres.push({ c: 'day', l: '月卡', v: state.days + '天' });
  gres.push({ c: 'day', l: '体力', v: `${state.stamina}/${state.staminaMax}`, k: 'stamina' });
  $('gres').innerHTML = gres.map(x => `<span class="gtag ${x.c}"><span class="dot"></span>${x.l} <b>${x.v}</b>${x.k ? `<button class="plus" onclick="${x.k === 'stamina' ? 'openStaminaModal' : 'openTopup'}('${x.k}')" title="${x.k === 'stamina' ? '嗑药剂回复体力' : '兑换/补充'}">+</button>` : ''}</span>`).join('');

  $('dateNow').textContent = fmt(state.today);
  const vs = phases.map(p => p.v).filter((v, i, a) => a.indexOf(v) === i).join(' · ') || '无';
  const vName = VERSION_NAMES[vs] || '';
  $('dateMeta').textContent = `版本 ${vs}${vName ? ' · ' + vName : ''} · 开放卡池 ${banners.length}`;
}

export function renderPullStats(currentBanner, state) {
  $('sTotal').textContent = state.total;
  $('sFive').textContent = state.five;
  $('sFour').textContent = state.four;
  $('sAvg').textContent = state.five ? (state.total / state.five).toFixed(1) : '-';
  $('sUp').textContent = state.upHits;
  $('sWave').textContent = Object.values(state.waveBuy).reduce((a, b) => a + b, 0);
  const curPool = currentBanner ? currentBanner.pool : 'eventChar';
  const charPityPool = poolKind(curPool) === 'char' ? curPool : 'eventChar';
  const weapPityPool = poolKind(curPool) === 'weapon' ? curPool : 'eventWeapon';
  $('sCharPity').textContent = state.pity[charPityPool] || 0;
  $('sWeapPity').textContent = state.pity[weapPityPool] || 0;

  const roleArr = Object.values(state.roles || {}).filter(r => r.owned > 0);
  const role5 = roleArr.filter(r => r.r === 5).length;
  const role4 = roleArr.filter(r => r.r === 4).length;
  const weaponArr = Object.values(state.weapons || {});
  const weapon5 = weaponArr.filter(w => w.r === 5).length;
  const weapon4 = weaponArr.filter(w => w.r === 4).length;
  $('sRoles').textContent = roleArr.length;
  $('sWeapons').textContent = weaponArr.length;
  const cd = $('sCollectionDetail');
  if (cd) cd.innerHTML = `角色 ★5 × <b style="color:var(--gold)">${role5}</b> · ★4 × <b style="color:var(--purple)">${role4}</b><br>武器 ★5 × <b style="color:var(--gold)">${weapon5}</b> · ★4 × <b style="color:var(--purple)">${weapon4}</b>`;
}
