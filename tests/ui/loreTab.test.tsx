// @vitest-environment happy-dom

import { describe, it, expect, afterEach } from 'vitest';
import { h, render } from 'preact';
import { getCharacterLore } from '../../src/data/characterLore.js';
import { LoreTab } from '../../src/ui/panels/roleModal/LoreTab';
import { Shell } from '../../src/ui/panels/roleModal/Shell';

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

async function waitFor(fn: () => boolean, tries = 40) {
  for (let i = 0; i < tries; i++) {
    if (fn()) return true;
    await new Promise(r => setTimeout(r, 10));
  }
  return false;
}

describe('getCharacterLore 数据加载', () => {
  it('忌炎 返回故事 + 好感语音(含中文 mp3)', async () => {
    const d = await getCharacterLore('忌炎');
    expect(d).toBeTruthy();
    expect(d.stories.length).toBeGreaterThanOrEqual(3);
    expect(d.words.length).toBeGreaterThanOrEqual(1);
    expect(d.stories[0].title).toBeTruthy();
    expect(d.stories[0].content).toBeTruthy();
    expect(d.words[0].voiceZh).toMatch(/^https:\/\/api\.encore\.moe\/resource\//);
  });

  it('漂泊者形态回落到一个漂泊者条目', async () => {
    const d = await getCharacterLore('漂泊者·湮灭');
    expect(d).toBeTruthy();
    expect(d.words.length).toBeGreaterThanOrEqual(1);
  });

  it('未知角色返回 null', async () => {
    expect(await getCharacterLore('不存在角色')).toBeNull();
  });
});

describe('LoreTab 渲染', () => {
  it('先加载态,后显示角色故事 + 语音播放按钮', async () => {
    const el = mount(<LoreTab roleName="忌炎" />);
    expect(el.textContent).toContain('载入角色资料');
    expect(await waitFor(() => el.textContent.includes('角色故事'))).toBe(true);
    expect(el.querySelectorAll('.lore-story').length).toBeGreaterThanOrEqual(1);
    expect(el.querySelectorAll('.lore-word').length).toBeGreaterThanOrEqual(1);
    expect(el.querySelectorAll('.lore-play').length).toBeGreaterThanOrEqual(1);
    expect(el.querySelectorAll('.lore-story-hint').length).toBeGreaterThanOrEqual(1);
  });

  it('未知角色显示空态', async () => {
    const el = mount(<LoreTab roleName="不存在角色" />);
    expect(await waitFor(() => el.textContent.includes('暂无故事'))).toBe(true);
  });
});

describe('Shell 侧栏立绘小图', () => {
  const shellProps = {
    rarity: 5, element: '热熔', type: '迅刀', level: 90,
    chain: 0, currentTab: 'basic', preview: false,
  };

  it('有立绘时渲染 img', () => {
    const el = mount(<Shell roleName="忌炎" {...shellProps}><div /></Shell>);
    const img = el.querySelector('.role-portrait img');
    expect(img).not.toBeNull();
    expect((img as HTMLImageElement).src).toContain('T_ActivityRoleJiyan1');
  });

  it('无立绘时不渲染 img', () => {
    const el = mount(<Shell roleName="不存在角色" {...shellProps}><div /></Shell>);
    expect(el.querySelector('.role-portrait img')).toBeNull();
    expect(el.textContent).toContain('不存在角色');
  });
});
