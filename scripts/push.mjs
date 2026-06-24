#!/usr/bin/env node
// npm run push —— 打包手机版单文件 → 强加进 git → 提交 → 推送
// 用法：
//   npm run push                     使用默认提交信息
//   npm run push -- "你的提交信息"   自定义提交信息

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const SINGLE_FILE = path.join(root, 'dist', '鸣潮模拟器-单文件版.html');

function run(cmd, opts = {}) {
  console.log(`\n\x1b[36m$ ${cmd}\x1b[0m`);
  return execSync(cmd, { stdio: 'inherit', cwd: root, ...opts });
}

function runQuiet(cmd) {
  return execSync(cmd, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

// ---- 0. 工作区如有未提交改动，先提示 ----
const dirty = runQuiet('git status --porcelain');
if (dirty) {
  console.log('\n\x1b[33m⚠  工作区有未提交改动：\x1b[0m');
  console.log(dirty);
  console.log('\n\x1b[33m先提交（或 stash）再运行 npm run push。\x1b[0m');
  process.exit(1);
}

// ---- 1. 构建 Vite + 打单文件 ----
run('npm run build');
run('node scripts/build-single-html.mjs');

if (!fs.existsSync(SINGLE_FILE)) {
  console.error(`\n\x1b[31m✗ 没找到产物：${SINGLE_FILE}\x1b[0m`);
  process.exit(1);
}
const size = (fs.statSync(SINGLE_FILE).size / 1024).toFixed(1);
console.log(`\n\x1b[32m✓ 已生成 dist/鸣潮模拟器-单文件版.html (${size} KB)\x1b[0m`);

// ---- 2. 强加进 git（dist/ 在 .gitignore 里） ----
run(`git add -f "${SINGLE_FILE}"`);

// ---- 3. 仅当有变化时才提交 ----
let hasStaged = false;
try {
  execSync('git diff --cached --quiet', { cwd: root });
} catch {
  hasStaged = true;
}

if (hasStaged) {
  const msg = process.argv[2] || 'chore: 重新打包手机版单文件';
  run(`git commit -m "${msg.replace(/"/g, '\\"')}"`);
} else {
  console.log('\n\x1b[33m手机版没有变化，跳过提交。\x1b[0m');
}

// ---- 4. 推送 ----
run('git push');

console.log('\n\x1b[32m✓ 全部完成\x1b[0m');
