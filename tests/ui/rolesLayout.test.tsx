// @vitest-environment happy-dom
// 角色仓库卡片(RoleGrid)布局契约:卡面显示立绘(cover 背景)+ 底部蒙层文字。
// happy-dom 不做真实 CSS 布局,这里锁定「DOM 结构 + main.css 防御规则」契约:
// 内容(立绘/星级/名字/等级/徽章)全部 absolute 定位 + .role overflow:hidden → 结构上不可能叠压,
// .roles 用 auto-fill+minmax 响应式列数,桌面端宽屏自动加列、不会拥挤错排。
import { describe, it, expect, afterEach } from 'vitest';
import { render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { bumpStateVersion } from '../../src/ui/signals.js';
import { RoleGrid } from '../../src/ui/panels/gacha/RoleGrid';
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

describe('RoleGrid 角色卡立绘 + 防叠压契约', () => {
  it('有立绘的角色卡渲染 .role-art(encore portrait 背景)+ .role-shade 蒙层', () => {
    resetState();
    S.roles = { '忌炎': { n: '忌炎', r: 5, owned: 1, chain: 0, level: 90, equipWeapon: null } };
    bumpStateVersion();
    const el = mount(<RoleGrid />);
    const card = el.querySelector('.role') as HTMLElement | null;
    expect(card).not.toBeNull();
    const art = card?.querySelector('.role-art') as HTMLElement | null;
    expect(art).not.toBeNull();
    expect(art?.getAttribute('style')).toMatch(/background-image/);
    expect(art?.getAttribute('style')).toMatch(/api\.encore\.moe/);
    expect(card?.querySelector('.role-shade')).not.toBeNull();
  });

  it('未登记美术的角色卡不渲染 .role-art(回落纯色卡片)', () => {
    resetState();
    S.roles = { '测试角色': { n: '测试角色', r: 4, owned: 1, chain: 0, level: 1, equipWeapon: null } };
    bumpStateVersion();
    const el = mount(<RoleGrid />);
    const card = el.querySelector('.role') as HTMLElement | null;
    expect(card?.querySelector('.role-art')).toBeNull();
    expect(card?.textContent).toContain('测试角色');
  });

  it('文字信息仍渲染(名字/等级/链徽章)', () => {
    resetState();
    S.roles = { '忌炎': { n: '忌炎', r: 5, owned: 1, chain: 3, level: 80, spare: 2, equipWeapon: null } };
    bumpStateVersion();
    const el = mount(<RoleGrid />);
    const txt = el.textContent || '';
    expect(txt).toContain('忌炎');
    expect(txt).toContain('LV 80');
    expect(txt).toContain('+3/6');
    expect(txt).toContain('频段 2');
  });

  it('CSS 契约:响应式列数 + 卡片 overflow:hidden + 内容全 absolute → 不可能叠压', () => {
    // 网格 auto-fill+minmax:桌面宽屏自动加列,卡片永远排得下
    expect(CSS).toMatch(/\.roles\{[^}]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(88px,\s*1fr\)\)/);
    // 卡片裁剪溢出内容,内容不逃逸
    expect(CSS).toMatch(/\.role\{[^}]*overflow:\s*hidden/);
    // 立绘 cover 铺满卡面
    expect(CSS).toMatch(/\.role-art\{[^}]*background-size:\s*cover/);
    expect(CSS).toMatch(/\.role-art\{[^}]*position:\s*absolute/);
    // 底部蒙层保证文字可读,层级在背景之上、文字之下
    expect(CSS).toMatch(/\.role-shade\{[^}]*background:\s*linear-gradient/);
    // 文字/徽章全 absolute 浮层,不与卡片盒尺寸互相推挤
    expect(CSS).toMatch(/\.role \.rname\{[^}]*position:\s*absolute/);
    expect(CSS).toMatch(/\.role \.rlv\{[^}]*position:\s*absolute/);
    expect(CSS).toMatch(/\.role \.stars\{[^}]*position:\s*absolute/);
    expect(CSS).toMatch(/\.role \.chain-badge\{[^}]*z-index:\s*2/);
  });
});
