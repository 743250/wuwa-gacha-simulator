#!/usr/bin/env node
/**
 * 从 biligame 鸣潮 WIKI 抓角色技能倍率表（Lv 列末档 ≈ Lv10）。
 * 输出: docs/sources/characters/wiki-skill-mults/<角色>.json + 汇总 index.json
 *
 * 用法: node scripts/fetch-wiki-skill-mults.mjs [角色名...]
 * 无参: 抓默认主 C/常驻批
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs/sources/characters/wiki-skill-mults');
const CACHE = path.join(ROOT, 'docs/sources/characters/wiki-html-cache');

const DEFAULT_BATCH = [
  '忌炎', '安可', '卡卡罗', '今汐', '长离', '椿', '吟霖', '凌阳', '鉴心', '维里奈',
  '折枝', '相里要', '守岸人', '珂莱塔', '洛可可', '菲比', '布兰特', '坎特蕾拉',
  '赞妮', '夏空', '卡提希娅', '露帕', '弗洛洛', '奥古斯塔', '尤诺', '嘉贝莉娜', '仇远',
  '散华', '丹瑾', '桃祈', '秋水', '秧秧', '渊武', '莫特斐', '白芷', '炽霞',
];

function wikiUrl(name) {
  const enc = encodeURIComponent(name);
  return `https://wiki.biligame.com/wutheringwaves/${encodeURIComponent('共鸣者')}/${enc}`;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchHtml(name) {
  fs.mkdirSync(CACHE, { recursive: true });
  const cachePath = path.join(CACHE, `${name}.html`);
  if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 5000) {
    return fs.readFileSync(cachePath, 'utf8');
  }
  const url = wikiUrl(name);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; wuwa-simulator-research/1.0)',
      Accept: 'text/html',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const html = await res.text();
  fs.writeFileSync(cachePath, html);
  return html;
}

function htmlToLines(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(tr|p|div|h\d|li|td|th)>/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&times;/g, '×')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&amp;/g, '&')
    .split(/\n/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** 解析单段倍率串: "23.60%*7 + 153.45%*2" → 数值合计 */
function evalMultExpr(expr) {
  const s = expr.replace(/\s+/g, '').replace(/×/g, '*').replace(/x/gi, '*');
  let total = 0;
  const parts = s.split('+');
  for (const p of parts) {
    const m = p.match(/^([\d.]+)%?(?:\*(\d+))?$/);
    if (!m) continue;
    const base = parseFloat(m[1]);
    const n = m[2] ? parseInt(m[2], 10) : 1;
    if (Number.isFinite(base)) total += base * n;
  }
  return total;
}

/** 从一串 Lv1..Lv10 的格子里取最后一档（满级） */
function pickMaxLevelCell(cells) {
  // cells: array of strings that look like mult expressions
  if (!cells.length) return null;
  return cells[cells.length - 1];
}

/**
 * 启发式：在「伤害」标签附近收集连续 % 行，每 10 个为一组取末档。
 * biligame 常把 10 级倍率纵向列出。
 */
function extractLabeledMults(lines) {
  const labels = [];
  const multLine = (s) =>
    /^[\d.]+%(\*\d+)?(\s*\+\s*[\d.]+%(\*\d+)?)*$/.test(s.replace(/\s+/g, '')) ||
    /^[\d.]+%(\*\d+)?$/.test(s.replace(/\s+/g, ''));

  // 找「xxx伤害」标签
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    if (!/伤害|倍率/.test(L)) continue;
    if (L.length > 40) continue;
    if (!/[\u4e00-\u9fff]/.test(L)) continue;
    // 向后收集 mult lines
    const cells = [];
    for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
      const t = lines[j].replace(/\s+/g, '');
      if (multLine(lines[j]) || multLine(t)) {
        cells.push(lines[j].replace(/\s+/g, ''));
      } else if (cells.length >= 3) {
        break;
      } else if (cells.length === 0 && j > i + 3) {
        break;
      } else if (cells.length > 0 && !multLine(t) && !/^[\d.]+$/.test(t)) {
        // 可能夹杂非倍率，若已有一批则停
        if (cells.length >= 8) break;
      }
    }
    if (cells.length >= 5) {
      // 通常 10 档；若更多，取末 10
      const use = cells.length >= 10 ? cells.slice(-10) : cells;
      const lvMax = pickMaxLevelCell(use);
      const sum = evalMultExpr(lvMax);
      labels.push({
        label: L,
        levels: use.length,
        lvMaxExpr: lvMax,
        lvMaxSum: Math.round(sum * 100) / 100,
      });
    }
  }

  // 去重：同 label 保留 levels 最多
  const byLabel = new Map();
  for (const row of labels) {
    const prev = byLabel.get(row.label);
    if (!prev || row.levels > prev.levels) byLabel.set(row.label, row);
  }
  return [...byLabel.values()];
}

/** 额外：正文里一次性写出的固定%（延奏等） */
function extractInlineFixed(lines) {
  const hits = [];
  for (const L of lines) {
    const m = L.match(/造成[^。]{0,40}?([\d.]+)%攻击/);
    if (m) hits.push({ context: L.slice(0, 80), pct: parseFloat(m[1]) });
  }
  return hits.slice(0, 20);
}

function summarize(name, rows, inline) {
  // 粗分类
  const pick = (re) => rows.filter(r => re.test(r.label));
  return {
    name,
    source: wikiUrl(name),
    fetchedAt: new Date().toISOString().slice(0, 10),
    rows,
    inlineFixed: inline,
    anchors: {
      normalish: pick(/第[一二三四五六七八九十\d]+段|常态|普攻/),
      skillish: pick(/共鸣技能|技能伤害/).filter(r => !/解放|回路|变奏|延奏/.test(r.label)),
      heavyish: pick(/重击/),
      burstish: pick(/共鸣解放|解放|后动|谋定/),
      variationish: pick(/变奏/),
      outroish: pick(/延奏|协同/),
    },
  };
}

function isMissingPage(html, name) {
  if (!html || html.length < 8000) return true;
  // 导航里也会出现「页面不存在」字样，不能裸 includes
  if (html.includes(`<title>页面不存在`) || html.includes('class="noarticletext"')) return true;
  // 正文应含角色名或常见技能结构
  if (!html.includes(name) && !html.includes('共鸣解放') && !html.includes('常态攻击')) return true;
  return false;
}

async function processOne(name) {
  const html = await fetchHtml(name);
  if (isMissingPage(html, name)) {
    return { name, error: 'page_missing_or_short', size: html?.length || 0 };
  }
  const lines = htmlToLines(html);
  const rows = extractLabeledMults(lines);
  const inline = extractInlineFixed(lines);
  const data = summarize(name, rows, inline);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data, null, 2));
  return {
    name,
    ok: true,
    rowCount: rows.length,
    top: rows
      .slice()
      .sort((a, b) => b.lvMaxSum - a.lvMaxSum)
      .slice(0, 8)
      .map(r => `${r.label}=${r.lvMaxSum}%`),
  };
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
  const names = args.length ? args : DEFAULT_BATCH;
  const concurrency = 3;
  const results = [];
  for (let i = 0; i < names.length; i += concurrency) {
    const chunk = names.slice(i, i + concurrency);
    const part = await Promise.all(
      chunk.map(async (n, idx) => {
        await sleep(idx * 400);
        try {
          return await processOne(n);
        } catch (e) {
          return { name: n, error: String(e.message || e) };
        }
      }),
    );
    results.push(...part);
    console.log(part.map(p => (p.ok ? `OK ${p.name}(${p.rowCount})` : `ERR ${p.name}: ${p.error}`)).join(' | '));
    if (i + concurrency < names.length) await sleep(800);
  }
  const index = {
    generatedAt: new Date().toISOString(),
    count: results.length,
    ok: results.filter(r => r.ok).length,
    results,
  };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, '_index.json'), JSON.stringify(index, null, 2));
  console.log('\nDone', index.ok + '/' + index.count, '→', OUT);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
