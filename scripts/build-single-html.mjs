import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

// 从 registry.ts 抽取每个角色的 6 链 name/desc(Phase 3 后 seq.js 已合并到此)
const registrySrc = fs.readFileSync(path.join(root, 'src/data/chains/registry.ts'), 'utf8');

// 角色头:  "角色名": {
const charRe = /^  "([^"]+)":\s*\{/gm;
// text 块: text: { name: "...", desc: "..." }
const textRe = /text:\s*\{\s*name:\s*"((?:[^"\\]|\\.)*)"\s*,\s*desc:\s*"((?:[^"\\]|\\.)*)"/g;

const charSpans = [];
let cm;
while ((cm = charRe.exec(registrySrc)) !== null) {
  charSpans.push({ name: cm[1], start: cm.index, end: -1 });
}
charSpans.forEach((c, i) => { c.end = i + 1 < charSpans.length ? charSpans[i + 1].start : registrySrc.length; });

const chainsByChar = new Map();
let tm;
while ((tm = textRe.exec(registrySrc)) !== null) {
  const owner = charSpans.find(c => tm.index >= c.start && tm.index < c.end);
  if (!owner) continue;
  if (!chainsByChar.has(owner.name)) chainsByChar.set(owner.name, []);
  chainsByChar.get(owner.name).push([tm[1].replace(/\\"/g, '"'), tm[2].replace(/\\"/g, '"')]);
}

let backup = '# 鸣潮原版共鸣链文案备份\n\n生成时间：2026-07-07\n\n---\n\n';
for (const name of [...chainsByChar.keys()].sort((a, b) => a.localeCompare(b, 'zh'))) {
  const chains = chainsByChar.get(name);
  backup += `## ${name}\n\n`;
  chains.forEach((s, i) => {
    backup += `**${i + 1} 链 · ${s[0]}**\n${s[1]}\n\n`;
  });
  backup += '---\n\n';
}
fs.writeFileSync(path.join(root, '共鸣链原版备份.txt'), backup, 'utf8');
console.log(`wrote 共鸣链原版备份.txt (${charSpans.length} chars, ${chainsByChar.size} with chains)`);

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const jsMatch = html.match(/<script type="module" crossorigin src="\.\/assets\/([^"]+)"><\/script>/);
const cssMatch = html.match(/<link rel="stylesheet" crossorigin href="\.\/assets\/([^"]+)">/);
const preloadMatch = html.match(/<link rel="modulepreload" crossorigin href="\.\/assets\/([^"]+)">/);
if (!jsMatch || !cssMatch) throw new Error('dist assets not found');
if (preloadMatch) {
  throw new Error(
    `检测到 vendor 分包(${preloadMatch[1]}),单文件内联后 import 路径会断、模块加载失败。\n` +
    `请用 \`npm run build:single\`(SINGLE_FILE=1) 构建,它会禁用 manualChunks 输出单 JS chunk。`
  );
}

const js = fs.readFileSync(path.join(dist, 'assets', jsMatch[1]), 'utf8');
const css = fs.readFileSync(path.join(dist, 'assets', cssMatch[1]), 'utf8');
const safeJs = js.replaceAll('</script', '<\\/script');
const single = html
  .replace(cssMatch[0], () => `<style>\n${css}\n</style>`)
  .replace(jsMatch[0], () => `<script type="module">\n${safeJs}\n</script>`);

fs.writeFileSync(path.join(dist, '鸣潮模拟器-单文件版.html'), single, 'utf8');
console.log('wrote dist/鸣潮模拟器-单文件版.html');
