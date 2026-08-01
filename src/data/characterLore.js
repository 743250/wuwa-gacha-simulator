// 角色故事 + 好感语音 数据加载器
// 数据源: scripts/build-character-lore.cjs (encore.moe API, zh-Hans/character/{id} → Stories/Words/favorRole)
// 数据较大(全角色故事+语音约 1MB),用动态 import 按需加载,不塞进主包。
let _cache = null;

async function load() {
  if (!_cache) {
    const mod = await import('./character-lore.json');
    _cache = mod.default || mod;
  }
  return _cache;
}

export async function getCharacterLore(name) {
  const map = await load();
  if (map[name]) return map[name];
  if (name.includes('漂泊者')) {
    return map['漂泊者·衍射'] || map['漂泊者·湮灭'] || map['漂泊者·气动'] || null;
  }
  return null;
}
