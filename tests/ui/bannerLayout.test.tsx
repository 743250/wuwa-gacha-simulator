// @vitest-environment happy-dom
// GachaBanner 布局契约:方块行可换行、文字列可收缩、卡池大图(官方海报立绘)铺整块 banner-art 背景。
// happy-dom 不做真实 CSS 布局,无法测量视觉重叠/蒙层深浅;这里锁定「DOM 结构 + main.css 防御规则」契约,
// 保证桌面端方块不会互相叠压(bsl-chip 禁收缩 + bsl-row 换行 + ba-main 可收缩),
// 且卡池大图是以 cover 背景铺满、蒙层保证文字可读,而不是右侧小图或单色背景。
import { describe, it, expect, afterEach } from 'vitest';
import { render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui/signals.js';
import { GachaBanner } from '../../src/ui/panels/gacha/GachaBanner';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const CSS = readFileSync(resolve(__dirname, '../../styles/main.css'), 'utf8');

let container: HTMLDivElement | null = null;
function mount(node: any): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  render(node, container);
  return container;
}
afterEach(() => {
  if (container) { render(null, container); container.remove(); container = null; }
});

describe('GachaBanner 布局契约（防桌面端方块重叠 + 整背景卡池大图）', () => {
  it('常驻池:暂无多人同框大图,走文字布局(池名 + 常驻五星 5 人列表,无背景图)', () => {
    resetState();
    S.selected = 'standard-char';
    bumpStateVersion();
    const el = mount(<GachaBanner />);
    const art = el.querySelector('.banner-art');
    // 无 pool 级大图 → 无 has-art,无 background-image
    expect(art?.className).not.toContain('has-art');
    const style = art?.getAttribute('style') || '';
    expect(style).not.toMatch(/background-image/);
    // 文字布局:池名 + 常驻五星 5 人 chips
    expect(el.textContent).toMatch(/常驻共鸣者/);
    expect([...el.querySelectorAll('.bsl-chip')].map(c => c.textContent)).toEqual(['维里奈', '卡卡罗', '安可', '凌阳', '鉴心']);
    expect(el.textContent).toMatch(/永久常驻 · 5 选 1 等概率/);
    // CSS 契约仍保留:行可换行 + 方块不收缩(无图池兜底时不叠压)
    expect(CSS).toMatch(/\.bsl-row\{[^}]*flex-wrap:\s*wrap/);
    expect(CSS).toMatch(/\.bsl-chip\{[^}]*flex:\s*0\s*0\s*auto/);
  });

  it('新手池定向按钮用 flex-wrap 容器，不被压缩重叠', () => {
    resetState();
    S.selected = 'novice-choice';
    bumpStateVersion();
    const el = mount(<GachaBanner />);
    const btnWrap = [...el.querySelectorAll('.ba-main div')].find(d => d.querySelector('button'));
    expect(btnWrap?.getAttribute('style')).toMatch(/flex-wrap:\s*wrap/);
  });

  it('新手池(万象新声):5 个定向按钮,点选后背景切到该角色壁纸 + 新手 badge 保留', async () => {
    resetState();
    S.selected = 'beginner';
    bumpStateVersion();
    const el = mount(<GachaBanner />);
    // 5 个定向按钮
    const labels = [...el.querySelectorAll('button')].map(b => b.textContent || '');
    expect(labels).toEqual(['维里奈', '卡卡罗', '安可', '凌阳', '鉴心']);
    // 未选目标:banner 无背景图
    expect(el.querySelector('.banner-art')?.className).not.toContain('has-art');
    // 新手 badge 未选时也在
    expect(el.textContent).toMatch(/新手专享/);
    // 点选 鉴心
    const btn = [...el.querySelectorAll('button')].find(b => b.textContent === '鉴心')!;
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(S.beginnerTarget).toBe('鉴心');
    // 等 signal 冲刷(Preact signals 在 happy-dom 异步 flush)
    await new Promise(r => setTimeout(r, 0));
    // 背景切到鉴心壁纸(灰机wiki CDN),新手 badge 仍保留
    const art = el.querySelector('.banner-art');
    expect(art?.className).toContain('has-art');
    const style = art?.getAttribute('style') || '';
    expect(style).toMatch(/huiji-public\.huijistatic\.com/);
    // 鉴心(URL 编码 %E9%89%B4%E5%BF%83)横版壁纸
    expect(style).toMatch(/%E9%89%B4%E5%BF%83/);
    expect(el.textContent).toMatch(/新手专享/);
  });

  it('限定池:整块 banner-art 铺卡池大图(官方海报立绘),不再用右侧小图/单色背景', () => {
    resetState();
    S.today = 1753315200000; // 2025-07-24,eventChar-2.5-弗洛洛 激活
    S.selected = 'eventChar-2.5-弗洛洛';
    bumpStateVersion();
    const el = mount(<GachaBanner />);
    const art = el.querySelector('.banner-art');
    expect(art?.className).toContain('has-art');
    // 背景 = 官方海报立绘(Moegirl / 灰机wiki huiji CDN),不是 BgCgBig/T_LuckdrawBg 单色背景
    const style = art?.getAttribute('style') || '';
    expect(style).toMatch(/storage\.moegirl\.org\.cn|huiji-public\.huijistatic\.com/);
    expect(style).toMatch(/background-image/);
    expect(style).not.toMatch(/T_LuckdrawBg/);
    // 已去掉右侧小图元素
    expect(el.querySelector('.ba-art-img')).toBeNull();
    // CSS 契约:cover 铺满 + 蒙层保证文字可读
    expect(CSS).toMatch(/\.banner-art\.has-art\{[^}]*background-size:\s*cover/);
    expect(CSS).toMatch(/\.banner-art\.has-art::before\{[^}]*background:/);
  });

  it('文字列可收缩(flex:1 + min-width:0),蒙层在背景图之上、文字之下', () => {
    expect(CSS).toMatch(/\.ba-main\{[^}]*flex:\s*1/);
    expect(CSS).toMatch(/\.ba-main\{[^}]*min-width:\s*0/);
    expect(CSS).toMatch(/\.banner-art\.has-art::before\{[^}]*z-index:\s*0/);
    expect(CSS).toMatch(/\.ba-main\{[^}]*z-index:\s*1/);
  });
});
