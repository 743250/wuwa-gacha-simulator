#!/usr/bin/env node
// 角色技能面板可视化预览 —— 生成独立 HTML，浏览器直接打开即可审查
// 用法: node scripts/preview-char.mjs [角色名]
// 默认角色: 卡提希娅

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const charName = process.argv[2] || '卡提希娅';

// 动态 import ES modules
const [{ SKILL_HINTS }, { TERM_DICT }, { seqText }] = await Promise.all([
  import(pathToFileURL(path.join(root, 'src/ui/render/skillHints.js')).href),
  import(pathToFileURL(path.join(root, 'src/ui/terms.js')).href),
  import(pathToFileURL(path.join(root, 'src/data/seq.js')).href),
]);

const s = SKILL_HINTS[charName];
if (!s) {
  console.error(`未找到角色: ${charName}`);
  console.error(`可用角色: ${Object.keys(SKILL_HINTS).sort().join(', ')}`);
  process.exit(1);
}

// 模拟 stats（Lv90 典型值）
const stats = { hp: 10000, atk: 1000, def: 500, crate: 0.05, cdmg: 0.50, maxEnergy: 125,
  elemBonus: { 气动: 0 }, elemAllBonus: 0, healBonus: 0,
  normalBonus: 0, skillBonus: 0, burstBonus: 0, heavyBonus: 0 };

// 模拟 role（0 链 和 6 链各一份）
function genRole(chain) {
  return { chain, spare: chain, bought: 0,
    weapon: '五星专武', weaponLevel: 90, weaponRank: 1, level: 90 };
}

// ---- HTML 工具函数（从 terms.js 复制）----
function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/'/g, '&#39;'); }
function attachTermTips(html) {
  if (!html) return '';
  // 保护 data-tip 内容
  const tipContents = [];
  let tipIdx = 0;
  let safe = String(html).replace(/ data-tip='([^']*)'/g, (full, content) => {
    const idx = tipIdx++;
    tipContents.push(content);
    return ` data-tip='__TPROT_${idx}__'`;
  });
  safe = safe.replace(/ data-tip="([^"]*)"/g, (full, content) => {
    const idx = tipIdx++;
    tipContents.push(content);
    return ` data-tip="__TPROT_${idx}__"`;
  });
  const TERM_KEYS_SORTED = Object.keys(TERM_DICT).sort((a, b) => b.length - a.length);
  const processed = safe.replace(/<b\s+class="(term-[\w-]+)"\s*>([^<]+)<\/b>/g, (full, cls, inner) => {
    const text = inner.trim();
    if (TERM_DICT[text]) return `<span class="tip-term" data-tip='${escAttr(TERM_DICT[text])}'>${full}</span>`;
    for (const key of TERM_KEYS_SORTED) {
      if (text.includes(key)) return `<span class="tip-term" data-tip='${escAttr(TERM_DICT[key])}'>${full}</span>`;
    }
    return full;
  });
  return processed.replace(/__TPROT_(\d+)__/g, (full, idx) => tipContents[parseInt(idx)] || '');
}

// ---- 生成技能行 HTML ----
function genSkillLines(chain) {
  const role = genRole(chain);
  const lines = typeof s.customLines === 'function' ? s.customLines(stats, role) : s.customLines;
  if (!lines || !lines.length) return '<div style="color:var(--dim)">无技能数据</div>';
  return lines.map(L => `
    <div style="border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-weight:600;font-size:14px">${L.icon || ''} ${L.name || ''}</span>
        <span style="font-size:10px;color:var(--muted);padding:2px 8px;border:1px solid var(--line);border-radius:999px">${L.cost || ''}</span>
      </div>
      <div style="font-size:13px;line-height:1.7;color:var(--dim)">${attachTermTips(L.desc || '')}</div>
    </div>`).join('');
}

// ---- 生成共鸣链 HTML ----
const CHAIN_TERM_PATTERNS = [
  { re: /(\d+(?:\.\d+)?%)/g, cls: 'term-num' },
  { re: /(\d+(?:\.\d+)?\s*(?:秒|回合|层|点|次))/g, cls: 'term-num' },
  { re: /(看潮怒风哮之刃|听骑士从心祈愿)/g, cls: 'term-burst' },
  { re: /(共鸣解放[··][一-龥]{2,8}|共鸣解放|终末回环)/g, cls: 'term-burst' },
  { re: /(共鸣技能[··][一-龥]{2,6}|共鸣技能)/g, cls: 'term-skill' },
  { re: /(共鸣回路|延奏技能|变奏技能|变奏|延奏|协奏)/g, cls: 'term-resource' },
  { re: /(重击|空中攻击)/g, cls: 'term-heavy' },
  { re: /(普攻)/g, cls: 'term-normal' },
  { re: /(星蝶|星域|破阵值|破阵|离火|韶光|晶体|红椿|杀意|猎杀阈值|决意|气动侵蚀|衍射失序|心眼)/g, cls: 'term-resource' },
  { re: /(风蚀效应|芙露德莉斯)/g, cls: 'term-resource' },
  { re: /(人权|神权|异权)/g, cls: 'term-resource' },
];
function highlightChainTerms(text) {
  if (!text) return '';
  if (/<b\s+class="term-/.test(text)) return text;
  let out = String(text);
  CHAIN_TERM_PATTERNS.forEach(p => { out = out.replace(p.re, m => `<b class="${p.cls}">${m}</b>`); });
  return out;
}
function genChainLines(chain) {
  const entries = seqText[charName];
  if (!entries) return '<div style="color:var(--dim)">无共鸣链文案</div>';
  return entries.map((s, i) => {
    const owned = i < chain;
    return `<div class="seq-line" style="margin-bottom:10px;padding:10px;border-radius:8px;background:${owned?'rgba(245,207,107,.06)':'rgba(255,255,255,.02)'};border:1px solid ${owned?'var(--gold)':'var(--line)'}">
      <b style="color:${owned?'var(--gold)':'var(--muted)'};font-size:13px">${i + 1}链 · ${s[0]}</b>
      <div style="font-size:12px;color:var(--dim);margin-top:4px;line-height:1.6">${attachTermTips(highlightChainTerms(s[1]))}</div>
    </div>`;
  }).join('');
}

// ---- 生成完整 HTML ----
const css = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');

const html = `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>角色预览: ${charName}</title>
<style>
${css}
body { padding: 16px; max-width: 600px; margin: 0 auto; }
h2 { font-size: 18px; margin: 20px 0 12px; color: var(--gold); }
h2:first-child { margin-top: 0; }
.chain-nav { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
.chain-nav button { padding: 6px 16px; border: 1px solid var(--line); background: rgba(255,255,255,.04); color: var(--dim); border-radius: 999px; cursor: pointer; font-size: 12px; }
.chain-nav button.active { border-color: var(--gold); color: var(--gold); background: rgba(245,207,107,.10); }
.tip-term, .tip { cursor: help; border-bottom: 1px dashed var(--muted); }
/* tooltip 模拟：悬停时在下方显示 */
[data-tip]:hover { position: relative; }
[data-tip]:hover::after {
  content: attr(data-tip);
  position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  background: #1a1a2e; color: #eee; border: 1px solid var(--gold); border-radius: 8px;
  padding: 8px 12px; font-size: 11px; line-height: 1.5; white-space: nowrap; z-index: 999;
  max-width: 360px; white-space: normal; pointer-events: none;
  box-shadow: 0 4px 16px rgba(0,0,0,.5);
}
</style></head>
<body style="background:#0d0d1a;color:#ccc;font-family:sans-serif">

<div style="text-align:center;margin-bottom:20px">
  <h1 style="font-size:24px;color:var(--gold);margin:0">${charName}</h1>
  <p style="font-size:12px;color:var(--muted);margin:4px 0 0">${s.intro || ''}</p>
</div>

<div class="chain-nav">
  <span style="font-size:11px;color:var(--muted);line-height:28px;margin-right:8px">共鸣链:</span>
  <button onclick="setChain(0)" id="chain0">0 链</button>
  ${[1,2,3,4,5,6].map(i => `<button onclick="setChain(${i})" id="chain${i}">${i} 链</button>`).join('')}
</div>

<h2>⚔ 技能</h2>
<div id="skillPanel">${genSkillLines(0)}</div>

<h2>🔗 共鸣链</h2>
<div id="chainPanel">${genChainLines(0)}</div>

${s.forteName ? `
<h2>📜 ${s.forteName}</h2>
<div style="font-size:13px;line-height:1.7;color:var(--dim);padding:12px;border:1px solid var(--line);border-radius:10px">${attachTermTips(s.forteDesc || '')}</div>
` : ''}

<script>
// 共鸣链切换
const skillData = {
${[0,1,2,3,4,5,6].map(i => `  ${i}: \`${genSkillLines(i).replace(/`/g,'\\`').replace(/\$/g,'\\$')}\``).join(',\n')}
};
const chainData = {
${[0,1,2,3,4,5,6].map(i => `  ${i}: \`${genChainLines(i).replace(/`/g,'\\`').replace(/\$/g,'\\$')}\``).join(',\n')}
};
function setChain(n) {
  document.getElementById('skillPanel').innerHTML = skillData[n];
  document.getElementById('chainPanel').innerHTML = chainData[n];
  for (let i = 0; i <= 6; i++) {
    const btn = document.getElementById('chain' + i);
    if (btn) btn.className = i === n ? 'active' : '';
  }
}
setChain(0);
document.getElementById('chain0').className = 'active';
</script>

</body></html>`;

const outFile = path.join(root, 'char-preview.html');
fs.writeFileSync(outFile, html, 'utf8');
console.log(`✓ 已生成: ${outFile}`);
console.log(`  角色: ${charName} | 可切换 0~6 链`);
console.log(`  用浏览器打开该文件即可审查技能面板 UI`);
