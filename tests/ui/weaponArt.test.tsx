// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { resetState } from '../helpers.js';
import { S } from '../../src/state.js';
import { addWeapon } from '../../src/gacha/core.js';
import { WEAPON_ART, getWeaponArt, getWeaponBannerArt } from '../../src/ui/assets/index.ts';
import { WeaponTab } from '../../src/ui/panels/roleModal/WeaponTab';

let container: HTMLDivElement | null = null;

function mount(node: any): HTMLDivElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  render(node, container);
  return container;
}

afterEach(() => {
  if (container) {
    render(null, container);
    container.remove();
    container = null;
  }
});

function weaponTabProps(overrides: any = {}) {
  return {
    roleName: '忌炎',
    weaponType: '长刃',
    wName: null,
    wInfo: '未装备武器',
    wObj: null,
    preview: false,
    weaponDetailHtml: '',
    weaponBook: 12,
    weaponNextCost: 0,
    ...overrides,
  };
}

describe('WEAPON_ART 数据', () => {
  it('至少收录 30 把武器', () => {
    expect(Object.keys(WEAPON_ART).length).toBeGreaterThanOrEqual(30);
  });

  it('包含千古洑流 与 苍鳞千嶂', () => {
    expect(WEAPON_ART['千古洑流']).toBeTruthy();
    expect(WEAPON_ART['苍鳞千嶂']).toBeTruthy();
  });

  it('所有 URL 以 https:// 开头', () => {
    for (const url of Object.values(WEAPON_ART)) {
      expect(url.startsWith('https://')).toBe(true);
    }
  });

  it('getWeaponArt 未知武器返回 undefined', () => {
    expect(getWeaponArt('不存在武器')).toBeUndefined();
  });

  it('getWeaponBannerArt 派生 732 横版武器大图(卡池大图),未知武器返回 undefined', () => {
    expect(getWeaponBannerArt('千古洑流')).toMatch(/IconWeapon732\/T_IconWeapon732_21020015_UI\.webp$/);
    expect(getWeaponBannerArt('苍鳞千嶂')).toMatch(/IconWeapon732\//);
    expect(getWeaponBannerArt('不存在武器')).toBeUndefined();
  });
});

describe('WeaponTab 渲染武器图标', () => {
  it('指定武器时渲染 img(class=weapon-icon-img)', () => {
    resetState();
    addWeapon('千古洑流', 5);
    const el = mount(
      <WeaponTab {...weaponTabProps({
        wName: '千古洑流',
        wInfo: '千古洑流 · LV1 · 精1',
        wObj: S.weapons['千古洑流'],
      })} />
    );
    const img = el.querySelector('.weapon-icon-img');
    expect(img).not.toBeNull();
    expect((img as HTMLImageElement).src).toContain('api.encore.moe');
    expect((img as HTMLImageElement).src).toContain('IconWeapon');
  });

  it('未指定武器时不渲染武器图', () => {
    resetState();
    const el = mount(<WeaponTab {...weaponTabProps()} />);
    expect(el.querySelector('.weapon-icon-img')).toBeNull();
  });

  it('武器无图标映射(合成武器)时不渲染 img', () => {
    resetState();
    addWeapon('训练迅刀', 3);
    const el = mount(
      <WeaponTab {...weaponTabProps({
        wName: '训练迅刀',
        wInfo: '训练迅刀 · LV1 · 精1',
        wObj: S.weapons['训练迅刀'],
      })} />
    );
    expect(el.querySelector('.weapon-icon-img')).toBeNull();
    expect(el.textContent).toContain('训练迅刀');
  });
});
