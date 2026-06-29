// 存档管理：File System Access API（首选）+ localStorage（兜底）
//
// 优先用 File System Access API：用户授权一个文件夹后,存档直接写到本地真实文件,
// 不再受 localStorage 沙箱隔离(不同浏览器/域名各存一份)的困扰。
// 不支持 File System Access API 的浏览器(老 Chrome/Safari/Firefox)回退到 localStorage。
//
// 持久化两份：
//   · 文件系统 wuwa-save.json（主）—— 用户授权的文件夹,可在资源管理器看到/云盘同步
//   · localStorage wuwa-gacha-save-v1（镜像）—— 兜底,确保至少有一份
//
// 句柄存在 localStorage 的 'wuwa-fs-handle' 键里（仅存权限元数据,非内容）。

import { S, state0, fmt } from './state.js';

const KEY = 'wuwa-gacha-save-v1';
const HANDLE_KEY = 'wuwa-fs-handle';
const FILE_NAME = 'wuwa-save.json';
let saveTimer = null;

// ============ 存档版本 + 迁移链 ============
// 当前存档版本号。每次改动 S 的结构（加/删字段、改字段含义）必须 +1 并在 MIGRATIONS 里加一条。
// 老存档缺少 _v 时按 0 处理，逐级跑到当前版本。
const SAVE_VERSION = 2;

// 迁移函数：from → to，每个函数把存档从版本 N 升级到 N+1。
// 只动结构/字段名/数值含义，不要碰业务逻辑。
const MIGRATIONS = [
  // 0 → 1：体力药剂统一为 crystal_solvent；删除废弃材料；今汐元素修正
  (s) => {
    if (!s.materials) return;
    const oldSmall = s.materials.stamina_potion || 0;
    const oldBig = s.materials.stamina_potion_big || 0;
    if (oldSmall || oldBig) {
      s.materials.crystal_solvent = (s.materials.crystal_solvent || 0) + oldSmall + oldBig * 2;
      delete s.materials.stamina_potion;
      delete s.materials.stamina_potion_big;
    }
    ['skill_mat', 'echo_tube', 'boss_mat', 'weekly_skill_mat'].forEach(k => {
      delete s.materials[k];
    });
    if (s.roles) {
      Object.values(s.roles).forEach(r => {
        if (r && r.n === '今汐' && r.element === '湮灭') r.element = '衍射';
      });
    }
  },
  // 1 → 2：声骸副词条引入 unlocked 字段。老存档的副词条默认按已解锁处理（undefined !== false），
  // 不强制改写——echoContrib 用 `s.unlocked === false` 判定，undefined 视为已解锁。
  // 此迁移为占位，记录"为何不强制改"——见 docs/decisions/0001-echo-substats-5-slots.md
  (s) => {
    if (Array.isArray(s.echos)) {
      s.echos.forEach(e => {
        if (e && Array.isArray(e.subStats)) {
          e.subStats.forEach(sub => {
            if (sub && sub.unlocked === undefined) sub.unlocked = true;
          });
        }
      });
    }
  },
];

// 文件句柄（启动时从 IndexedDB 恢复）
let fileHandle = null;
let fsSupported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

// ============ 句柄持久化（IndexedDB,因为 localStorage 不能存 FileSystemHandle）============
const IDB_NAME = 'wuwa-saves';
const IDB_STORE = 'handles';

function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  try {
    const db = await idbOpen();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

async function idbSet(key, value) {
  try {
    const db = await idbOpen();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* 忽略 */ }
}

// ============ 文件系统 API ============

// 用户首次需要授权文件夹：弹窗选目录
export async function pickSaveFolder() {
  if (!fsSupported) {
    console.warn('当前浏览器不支持 File System Access API');
    return false;
  }
  try {
    const handle = await window.showDirectoryPicker({ id: 'wuwa-saves', mode: 'readwrite' });
    fileHandle = handle;
    await idbSet(HANDLE_KEY, handle);
    return true;
  } catch (e) {
    if (e.name === 'AbortError') return false; // 用户取消
    console.warn('授权文件夹失败:', e);
    return false;
  }
}

// 检查权限,必要时请求
async function verifyPermission(handle, write = true) {
  const opts = { mode: write ? 'readwrite' : 'read' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if ((await handle.requestPermission(opts)) === 'granted') return true;
  return false;
}

// 写到文件系统
async function writeToFS(jsonStr) {
  if (!fileHandle) {
    fileHandle = await idbGet(HANDLE_KEY);
    if (!fileHandle) return false;
  }
  if (!(await verifyPermission(fileHandle, true))) return false;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(jsonStr);
    await writable.close();
    return true;
  } catch (e) {
    console.warn('文件系统写入失败:', e);
    return false;
  }
}

// 从文件系统读
async function readFromFS() {
  if (!fileHandle) {
    fileHandle = await idbGet(HANDLE_KEY);
    if (!fileHandle) return null;
  }
  if (!(await verifyPermission(fileHandle, false))) return null;
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    return text;
  } catch (e) {
    console.warn('文件系统读取失败:', e);
    return null;
  }
}

export function isFsSaveActive() {
  return !!fileHandle;
}

export function isFsSupported() {
  return fsSupported;
}

// ============ 统一存档 API ============

export function saveState() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 1000);
}

export async function saveStateNow() {
  await doSave();
}

async function doSave() {
  S._v = SAVE_VERSION;
  const jsonStr = JSON.stringify(S, null, 2);
  // 并行写两份
  const fsPromise = fsSupported ? writeToFS(jsonStr) : Promise.resolve(false);
  const lsPromise = new Promise(resolve => {
    try {
      localStorage.setItem(KEY, jsonStr);
      resolve(true);
    } catch (e) {
      console.warn('localStorage 存档失败:', e);
      resolve(false);
    }
  });
  const [fsOk, lsOk] = await Promise.all([fsPromise, lsPromise]);
  if (!fsOk && !lsOk) console.warn('存档全部失败');
}

export async function loadState() {
  // 1. 优先从文件系统读
  if (fsSupported) {
    const fsText = await readFromFS();
    if (fsText) {
      const ok = applyLoadedState(fsText);
      if (ok) return true;
    }
  }
  // 2. 回退到 localStorage
  const raw = localStorage.getItem(KEY);
  if (!raw) return false;
  return applyLoadedState(raw);
}

function applyLoadedState(raw) {
  try {
    const data = JSON.parse(raw);
    const fresh = state0();
    const merged = deepMerge(fresh, data);
    runMigrations(merged);
    Object.assign(S, merged);
    return true;
  } catch (e) {
    console.warn('存档损坏,使用默认状态:', e);
    return false;
  }
}

// 按版本号跑迁移链：从存档自带 _v（无则 0）跑到 SAVE_VERSION
function runMigrations(s) {
  const fromV = Number(s._v) || 0;
  for (let v = fromV; v < SAVE_VERSION && v < MIGRATIONS.length; v++) {
    MIGRATIONS[v](s);
  }
  s._v = SAVE_VERSION;
}

function deepMerge(target, source) {
  const out = { ...target };
  for (const k in source) {
    if (source[k] === undefined) continue;
    if (source[k] === null) { out[k] = null; continue; }
    if (Array.isArray(source[k])) {
      out[k] = source[k];
      continue;
    }
    if (typeof source[k] === 'object' && typeof target[k] === 'object' && target[k] !== null) {
      out[k] = deepMerge(target[k], source[k]);
    } else {
      out[k] = source[k];
    }
  }
  return out;
}

function migrateLegacy(s) {
  // 旧函数保留为 no-op，逻辑已迁到 MIGRATIONS[0]
  // 调用方（import）已切换到 runMigrations
  void s;
}

export function clearSave() {
  localStorage.removeItem(KEY);
  // 文件系统的存档不删,保留作为冷备份
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
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const fresh = state0();
      const merged = deepMerge(fresh, data);
      runMigrations(merged);
      Object.assign(S, merged);
      await saveStateNow();
      onDone(true);
    } catch (err) {
      onDone(false, err.message);
    }
  };
  reader.readAsText(file);
}

