#!/usr/bin/env node
// 角色技能面板可视化预览 —— 生成独立 HTML，浏览器直接打开即可审查
// 用法: node --experimental-strip-types scripts/preview-char.mjs [角色名]
// 默认角色: 卡提希娅
//
// 本脚本直接复用前端真实实现（attachTermTips / highlightChainTerms / REGISTRY），
// 不再复制粘贴一份副本 —— 预览结果与页面渲染保持同源。

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const charName = process.argv[2] || '卡提希娅';

const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);

const [{ SKILL_HINTS }, { TERM_DICT, attachTermTips }, { highlightChainTerms }, { REGISTRY }] =
  await Promise.all([
    imp('src/ui/panels/roleModal/skillHints/index.js'),
    imp('src/ui/panels/roleModal/terms.js'),
    imp('src/ui/panels/roleModal/skillText.ts'),
    imp('src/data/chains/registry.ts'),
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

// ---- 生成共鸣链 HTML（数据源：REGISTRY ChainDef）----
function genChainLines(chain) {
  const def = REGISTRY[charName];
  if (!def || !def.chains || !def.chains.length) {
    return '<div style="color:var(--dim)">无共鸣链文案</div>';
  }
  return def.chains.map((c, i) => {
    const owned = i < chain;
    const name = c.text?.name || `${c.index ?? i + 1} 链`;
    const desc = c.text?.desc || '';
    return `<div class="seq-line" style="margin-bottom:10px;padding:10px;border-radius:8px;background:${owned ? 'rgba(245,207,107,.06)' : 'rgba(255,255,255,.02)'};border:1px solid ${owned ? 'var(--gold)' : 'var(--line)'}">
      <b style="color:${owned ? 'var(--gold)' : 'var(--muted)'};font-size:13px">${i + 1}链 · ${name}</b>
      <div style="font-size:12px;color:var(--dim);margin-top:4px;line-height:1.6">${attachTermTips(highlightChainTerms(desc))}</div>
    </div>`;
  }).join('');
}

// ---- 生成完整 HTML ----
// main.css 只做 @import 编排，预览页是独立 HTML（无打包器解析 @import），
// 所以按入口里的引入顺序把模块内容拼平。
function loadStyles() {
  const entry = fs.readFileSync(path.join(root, 'styles/main.css'), 'utf8');
  const order = [...entry.matchAll(/@import\s+['"]\.\/(.+?)['"]/g)].map(m => m[1]);
  if (!order.length) return entry;
  return order
    .map(rel => fs.readFileSync(path.join(root, 'styles', rel), 'utf8'))
    .join('\n');
}

const css = loadStyles();

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
  ${[1, 2, 3, 4, 5, 6].map(i => `<button onclick="setChain(${i})" id="chain${i}">${i} 链</button>`).join('')}
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
${[0, 1, 2, 3, 4, 5, 6].map(i => `  ${i}: \`${genSkillLines(i).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\``).join(',\n')}
};
const chainData = {
${[0, 1, 2, 3, 4, 5, 6].map(i => `  ${i}: \`${genChainLines(i).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\``).join(',\n')}
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
