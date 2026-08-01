// 抽卡翻牌动画 · Phase 3 步骤 B 从 src/gacha/animation.js 迁入 src/ui/gacha/
//
// 历史:animation.js 原本放在 src/gacha/ 目录,但它是纯 UI 渲染(DOM 操作、CSS class 切换、
// 点击交互),不属于领域层。boundary-gacha-no-dom.test.js 因此为它保留白名单。
// 现迁到 UI 域,白名单可删;领域层(src/gacha/**)再无 DOM 访问。
import { setAnimating } from '../gachaAnimationState.js';
import { $ } from '../services/toast.ts';
import { sfx } from '../assets/audio.ts';
import { getRoleArt } from '../assets/index.ts';

export function showResult(arr) {
  setAnimating(true);
  sfx('reveal');
  const ov = $('ov'), beam = $('beam'), cards = $('cards'), sparks = $('sparks'), hint = $('skipHint'), title = $('ovTitle');
  const top = arr.reduce((m, x) => Math.max(m, x.r), 3);
  const cls = top === 5 ? 'gold' : top === 4 ? 'purple' : 'blue';
  const c5 = arr.filter(x => x.r === 5).length;
  const c4 = arr.filter(x => x.r === 4).length;
  const c3 = arr.filter(x => x.r === 3).length;
  const upCnt = arr.filter(x => x.up && x.r === 5).length;

  beam.className = 'beam'; sparks.innerHTML = ''; cards.innerHTML = '';
  cards.className = 'cards-wrap' + (arr.length === 1 ? ' single' : '');

  if (arr.length === 1) {
    const x = arr[0];
    title.innerHTML = `<div class="lvl ${cls}">${'★'.repeat(x.r)} ${x.r === 5 ? '五 星 降 临' : x.r === 4 ? '四 星 出 货' : '三 星'}</div>
      <div class="summary">${x.n}${x.up ? ' <span class="g">· 概率提升</span>' : ''}</div>`;
  } else {
    title.innerHTML = `<div class="lvl ${cls}">${arr.length} 连 唤 取</div>
      <div class="summary">
        ${c5 ? `<span class="g">五星 × ${c5}${upCnt ? `（命中提升 ${upCnt}）` : ''}</span> · ` : ''}
        ${c4 ? `<span class="p">四星 × ${c4}</span> · ` : ''}
        <span class="b">三星 × ${c3}</span>
      </div>`;
  }

  ov.classList.add('on');
  requestAnimationFrame(() => {
    beam.classList.add('show', cls);
    if (top >= 4) spawnSparks(top === 5 ? 50 : 24, cls);
  });

  arr.forEach(x => {
    const c = document.createElement('div');
    c.className = 'gcard r' + x.r + (x.up ? ' up' : '') + (arr.length === 1 ? ' single' : '');
    const art = getRoleArt(x.n);
    const bgImg = art?.portrait || art?.bannerBg;
    c.innerHTML = `<div class="face${bgImg ? ' has-art' : ''}"${bgImg ? ` style="background-image:url('${bgImg}')"` : ''}>
      <div class="stars">${'★'.repeat(x.r)}</div>
      <div>
        <div class="nm">${x.n}</div>
        <div class="tg">${x.t}</div>
      </div>
    </div>`;
    cards.appendChild(c);
  });
  setTimeout(() => cards.classList.add('show'), 550);
  setTimeout(() => {
    cards.querySelectorAll('.gcard').forEach((el, i) => setTimeout(() => el.classList.add('flipped'), i * 70));
    hint.classList.add('show');
  }, 850);

  let phase = 0;
  const onTap = () => {
    if (phase === 0) { cards.querySelectorAll('.gcard').forEach(el => el.classList.add('flipped')); phase = 1; }
    else {
      sfx('reveal_close');
      ov.classList.remove('on'); hint.classList.remove('show');
      beam.classList.remove('show', 'gold', 'purple', 'blue');
      ov.removeEventListener('click', onTap);
      setTimeout(() => { setAnimating(false); }, 300);
    }
  };
  ov.addEventListener('click', onTap);
}

function spawnSparks(n, cls) {
  const sp = $('sparks');
  const color = cls === 'gold' ? '#ffe89a' : cls === 'purple' ? '#e6d4ff' : '#cfeaff';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    const ang = Math.random() * Math.PI * 2, dist = 100 + Math.random() * 220;
    s.style.background = color; s.style.boxShadow = '0 0 10px ' + color;
    s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
    s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
    s.style.animation = `spark ${.7 + Math.random() * .6}s ease-out forwards`;
    s.style.animationDelay = (Math.random() * .3) + 's';
    sp.appendChild(s);
  }
  setTimeout(() => sp.innerHTML = '', 1800);
}