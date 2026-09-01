// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/ui/gachaAnimationState.js', () => ({ setAnimating: vi.fn() }));
vi.mock('../../src/ui/assets/audio.ts', () => ({ sfx: vi.fn() }));
vi.mock('../../src/ui/assets/index.ts', () => ({ getRoleArt: () => null }));

function mountOverlay() {
  document.body.innerHTML = `
    <div id="ov">
      <div id="beam"></div>
      <div id="ovTitle"></div>
      <div id="cards"></div>
      <div id="sparks"></div>
      <div id="skipHint"></div>
    </div>
  `;
}

describe('showResult DOM 契约', () => {
  beforeEach(() => {
    mountOverlay();
  });

  it('单抽出货：标题与卡面用文本节点，不拼 HTML', async () => {
    const { showResult } = await import('../../src/ui/gacha/animation.js');
    showResult([{ n: '忌炎', t: '气动 · 长刃', r: 5, up: true }]);

    const title = document.getElementById('ovTitle');
    expect(title.querySelector('.lvl.gold').textContent).toBe('★★★★★ 五 星 降 临');
    expect(title.querySelector('.summary').textContent).toContain('忌炎');
    expect(title.querySelector('.g').textContent).toBe(' · 概率提升');

    const card = document.querySelector('.gcard.r5.up.single');
    expect(card).toBeTruthy();
    expect(card.querySelector('.nm').textContent).toBe('忌炎');
    expect(card.querySelector('.tg').textContent).toBe('气动 · 长刃');
    expect(card.querySelector('.stars').textContent).toBe('★★★★★');
  });

  it('十连：统计行按五/四/三星分段，卡数等于结果数', async () => {
    const { showResult } = await import('../../src/ui/gacha/animation.js');
    const arr = [
      { n: '忌炎', t: '气动', r: 5, up: true },
      { n: '散华', t: '冷凝', r: 4, up: false },
      { n: '武器A', t: '长刃', r: 3, up: false },
      { n: '武器B', t: '长刃', r: 3, up: false },
    ];
    showResult(arr);
    const summary = document.querySelector('#ovTitle .summary').textContent;
    expect(summary).toContain('五星 × 1');
    expect(summary).toContain('命中提升 1');
    expect(summary).toContain('四星 × 1');
    expect(summary).toContain('三星 × 2');
    expect(document.querySelectorAll('.gcard')).toHaveLength(4);
  });
});
