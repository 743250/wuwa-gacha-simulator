import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const dist = path.join(root, 'dist');

const seqModule = await import(pathToFileURL(path.join(root, 'src/data/seq.js')).href);
let backup = '# 鸣潮原版共鸣链文案备份\n\n生成时间：2026-06-23\n\n---\n\n';
for (const name of Object.keys(seqModule.seqText).sort((a, b) => a.localeCompare(b, 'zh'))) {
  backup += `## ${name}\n\n`;
  seqModule.seqText[name].forEach((s, i) => {
    backup += `**${i + 1} 链 · ${s[0]}**\n${s[1]}\n\n`;
  });
  backup += '---\n\n';
}
fs.writeFileSync(path.join(root, '共鸣链原版备份.txt'), backup, 'utf8');

const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const jsMatch = html.match(/<script type="module" crossorigin src="\.\/assets\/([^"]+)"><\/script>/);
const cssMatch = html.match(/<link rel="stylesheet" crossorigin href="\.\/assets\/([^"]+)">/);
if (!jsMatch || !cssMatch) throw new Error('dist assets not found');

const js = fs.readFileSync(path.join(dist, 'assets', jsMatch[1]), 'utf8');
const css = fs.readFileSync(path.join(dist, 'assets', cssMatch[1]), 'utf8');
const safeJs = js.replaceAll('</script', '<\\/script');
const single = html
  .replace(cssMatch[0], () => `<style>\n${css}\n</style>`)
  .replace(jsMatch[0], () => `<script type="module">\n${safeJs}\n</script>`);

fs.writeFileSync(path.join(dist, '鸣潮模拟器-单文件版.html'), single, 'utf8');
console.log('wrote 共鸣链原版备份.txt');
console.log('wrote dist/鸣潮模拟器-单文件版.html');
