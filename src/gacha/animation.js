// 抽卡动画
import { $, setAnimating } from '../state.js';

export function showResult(arr) {
  setAnimating(true);
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
    c.innerHTML = `<div class="face">
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