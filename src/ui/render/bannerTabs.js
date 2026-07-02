import { $ } from '../../state.js';
import { poolKind } from '../../gacha/core.js';

export function renderBannerTabs(banners, selected, onSelect) {
  $('bnTabs').innerHTML = banners.map(x => {
    const kind = poolKind(x.pool);
    const on = x.id === selected ? (' on ' + (kind === 'weapon' ? 'w' : 'r')) : '';
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
  $('bnTabs').querySelectorAll('.btab').forEach(el => el.onclick = () => onSelect(el.dataset.id));
}
