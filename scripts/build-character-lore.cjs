// 从 encore.moe 抓取全部角色的「角色故事 + 好感语音」数据，生成 src/data/characterLore.js
// 用法: node scripts/build-character-lore.cjs [--limit N]
// 输入: docs/sources/characters/encore-full-data.json (results: {角色名: {id}})
// 输出: src/data/characterLore.js (ESM, CHARACTER_LORE 按角色名键)
// 数据源: api-v2.encore.moe/api/zh-Hans/character/{id} → Stories / Words / favorRole.Info

const fs = require('fs');
const path = require('path');

const API = 'https://api-v2.encore.moe/api/zh-Hans/character';
const SRC = path.join(__dirname, '..', 'docs', 'sources', 'characters', 'encore-full-data.json');
const OUT = path.join(__dirname, '..', 'src', 'data', 'character-lore.json');

// 好感语音只保留「性格/关系/成长」类，剔除战斗/移动音效类 (受击/重伤/力竭/技能/滑翔等)
const GRUNT_RE = /^(受击|重伤|力竭|滑翔|钩索|冲刺|纵跑|获得补给|声骸异能|进战提醒|感知|共鸣技能|共鸣解放|变奏技能)/;
function keepWord(title) {
  return !GRUNT_RE.test(String(title || ''));
}

const limitArg = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

// 清洗 <te href=850081>残象</te> / <br> 等 → 纯文本 + \n 换行
function clean(html) {
  return String(html || '')
    .replace(/<te\s+[^>]*>/g, '')
    .replace(/<\/te>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const meta = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const entries = Object.entries(meta.results).slice(0, LIMIT);
  console.log(`开始抓取 ${entries.length} 个角色…`);

  const out = {};
  let failed = [];
  for (const [name, { id }] of entries) {
    try {
      const c = await fetchJson(`${API}/${id}`);
      const stories = (c.Stories || [])
        .slice()
        .sort((a, b) => (a.Sort || 0) - (b.Sort || 0))
        .map(s => ({ title: clean(s.Title), content: clean(s.Content), hint: clean(s.HintText) }))
        .filter(s => s.title || s.content);
      const words = (c.Words || [])
        .filter(w => keepWord(w.Title))
        .map(w => ({ title: clean(w.Title), content: clean(w.Content), voiceZh: w.VoiceZh || '' }))
        .filter(w => w.content);
      const bio = clean(c.favorRole && c.favorRole.Info && c.favorRole.Info.Content) || '';
      out[name] = { bio, stories, words };
      console.log(`✓ ${name} (stories ${stories.length}, words ${words.length})`);
    } catch (e) {
      failed.push(name);
      console.log(`✗ ${name}: ${e.message}`);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\n写入 ${OUT}`);
  console.log(`失败: ${failed.length ? failed.join(', ') : '无'}`);
  console.log(`文件大小: ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
}

main().catch(e => { console.error(e); process.exit(1); });
