// 存档管理：localStorage 自动保存 + 手动导入导出
import { S, state0, fmt } from './state.js';

const KEY = 'wuwa-gacha-save-v1';
let saveTimer = null;

export function saveState() {
  // 防抖：1 秒内多次调用只存最后一次
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {
      console.warn('存档失败：', e);
    }
  }, 1000);
}

// 立即保存（重置/导入等场景）
export function saveStateNow() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    console.warn('存档失败：', e);
  }
}

export function loadState() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    // 迁移：以 state0() 为基础，再覆盖存档数据
    // 对于嵌套对象（如 pity / materials），先合并默认值再覆盖
    const fresh = state0();
    // 深度合并：保留旧存档没有的新字段
    const merged = deepMerge(fresh, data);
    // 旧存档迁移：把已废弃字段折算到新名字
    migrateLegacy(merged);
    Object.assign(S, merged);
    return true;
  } catch (e) {
    console.warn('存档损坏，使用默认状态：', e);
    return false;
  }
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const k in source) {
    if (source[k] !== null && typeof source[k] === 'object' && !Array.isArray(source[k]) && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      out[k] = deepMerge(target[k], source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

// 旧存档迁移：处理已废弃的字段名
function migrateLegacy(s) {
  if (!s.materials) return;
  // 自创的「小型/大型体力药剂」→ 官方「结晶溶剂」
  // 小药剂 +60 = 1 结晶溶剂；大药剂 +120 = 2 结晶溶剂
  const oldSmall = s.materials.stamina_potion || 0;
  const oldBig = s.materials.stamina_potion_big || 0;
  if (oldSmall || oldBig) {
    s.materials.crystal_solvent = (s.materials.crystal_solvent || 0) + oldSmall + oldBig * 2;
    delete s.materials.stamina_potion;
    delete s.materials.stamina_potion_big;
  }
  // 角色元素修正：今汐 湮灭 → 衍射
  if (s.roles) {
    Object.values(s.roles).forEach(r => {
      if (r && r.n === '今汐' && r.element === '湮灭') r.element = '衍射';
    });
  }
}

export function clearSave() {
  localStorage.removeItem(KEY);
}

export function exportSave() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wuwa-save-${fmt(S.today)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importSave(file, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const fresh = state0();
      const merged = deepMerge(fresh, data);
      migrateLegacy(merged);
      Object.assign(S, merged);
      saveStateNow();
      onDone(true);
    } catch (err) {
      onDone(false, err.message);
    }
  };
  reader.readAsText(file);
}
