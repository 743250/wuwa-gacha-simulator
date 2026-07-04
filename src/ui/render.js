// Preact 已接管所有 gacha 视图渲染（Stage 6.1b）
// render() 变为 no-op，只保留 initRoleModal 副作用注册

import { initRoleModal } from './render/roleModal.js';
import { saveState } from '../save.js';

export function render() {
  // Preact 已接管，不再 innerHTML 写
  // 仅保留存档副作用
  saveState();
}

initRoleModal({ render });
