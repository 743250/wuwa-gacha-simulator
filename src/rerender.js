import { render } from './ui/render.js';
import { renderTeamBuilder } from './ui/teambuilder.js';
import { renderBag } from './ui/bag.js';
import { renderDungeon } from './ui/dungeon.js';
import { renderAbyss } from './ui/abyss.js';
import { renderDaily } from './ui/daily.js';
import { renderWastes } from './ui/wastes.js';
import { renderPodcast } from './ui/podcast.js';
import { bumpStateVersion } from './ui2/signals.ts';

// 全部面板重渲染（旧 render + Preact signals）
export function rerenderAll() {
  render();
  renderTeamBuilder();
  renderBag();
  renderDaily();
  renderDungeon();
  renderAbyss();
  renderWastes();
  renderPodcast();
  bumpStateVersion();
}

// dual-mode: 保留 window 桥给 Preact/HTML 内联 onclick 用
window.__render = rerenderAll;
window.__rerenderAll = rerenderAll;
