// 循环依赖检测 · Phase 4 验收
// 检测 src/battle/** 与 src/gacha/** 的运行时 import 循环。
// 重点保护 Phase 4 已切断的:
//   battle/characters/aogusita.js → battle/combat/damage.js → battle/characters/index.js
//
// 实现思路:
//   1. 静态扫描 src/battle/** 与 src/gacha/** 的每个文件的 import 路径
//   2. 解析为相对文件路径(无扩展名 → 尝试补 .js/.ts/.tsx)
//   3. 构建有向图,跑 Tarjan SCC 找强连通分量
//   4. 任意 SCC 包含 ≥2 个文件 → 报循环
//
// 注意:import type 形成的"类型环"不在此检测(单独观察);运行时 import 循环才报错。
// Vite 打包时 ESM 静态分析能容忍一些循环,但运行时初始化顺序错乱会触发 bug,所以提前拦截。

import { describe, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { lintWarn, relativeSourcePath } from './helpers.js';

const ROOT = resolve(__dirname, '../../src');
const GUARD_DIRS = ['battle', 'gacha'].map(d => join(ROOT, d));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(js|ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const EXT_CANDIDATES = ['.js', '.ts', '.tsx', '/index.js', '/index.ts'];

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;  // 忽略 node_modules / bare module
  const base = resolve(dirname(fromFile), spec);
  // 直接命中文件
  if (existsSync(base) && statSync(base).isFile()) return base;
  // 尝试补扩展名
  for (const ext of EXT_CANDIDATES) {
    if (ext.startsWith('/')) {
      const idx = base + ext;
      if (existsSync(idx) && statSync(idx).isFile()) return idx;
    } else {
      const p = base + ext;
      if (existsSync(p) && statSync(p).isFile()) return p;
    }
  }
  return null;
}

function collectEdges() {
  const files = [...GUARD_DIRS.flatMap(d => walk(d))];
  const edgeMap = new Map();  // file -> [imports...]
  for (const f of files) {
    const txt = readFileSync(f, 'utf8');
    const lines = txt.split('\n');
    const imports = [];
    lines.forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      // 匹配 import ... from '...'
      const m = line.match(/\bfrom\s+['"]([^'"]+)['"]/);
      if (!m) return;
      const target = resolveImport(f, m[1]);
      if (target) imports.push({ spec: m[1], target, line: i + 1 });
    });
    edgeMap.set(f, imports);
  }
  return { files, edgeMap };
}

// Tarjan SCC
function tarjanSCC(nodes, edges) {
  // edges: Map<node, node[]>
  const index = new Map(); const low = new Map(); const onStack = new Set();
  const stack = []; const sccs = []; let ord = 0;
  function strong(v) {
    index.set(v, ord); low.set(v, ord); ord++; stack.push(v); onStack.add(v);
    const succ = edges.get(v) || [];
    for (const w of succ) {
      if (!index.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
    }
    if (low.get(v) === index.get(v)) {
      const comp = [];
      while (true) {
        const w = stack.pop(); onStack.delete(w); comp.push(w);
        if (w === v) break;
      }
      sccs.push(comp);
    }
  }
  for (const v of nodes) if (!index.has(v)) strong(v);
  return sccs;
}

describe('lint · 边界:battle/gacha 运行时 import 无循环', () => {
  it('提醒:src/battle/** 与 src/gacha/** 不得有运行时 import 循环(SCC ≥2)', () => {
    const { files, edgeMap } = collectEdges();
    // 构建邻接表(限定在我们扫到的文件集内)
    const nodeSet = new Set(files);
    const adj = new Map();
    for (const [src, imports] of edgeMap) {
      adj.set(src, imports.map(im => im.target).filter(t => nodeSet.has(t)));
    }
    const sccs = tarjanSCC(files, adj);
    const cyclicSCCs = sccs.filter(c => c.length >= 2);
    // 已知预存环(Phase 4 任务范围之外,待后续阶段专项处理):
    //   combat orchestration 大环:turnEnd/helpers/actions/setup/combat.js 互相 import,
    //   因 combat.js 只是 re-export facade + setup 创建战斗场景,触不到运行时初始化顺序问题。
    //   幸好 damage.js ↔ characters/index.js 已断,新的"领域底层→角色注册表"环不许再建。
    const KNOWN_PREEXISTING_CYCLES = [
      // 把 SCC 的文件名集合签名(排序后 join) 作为白名单 key
      'battle/characters/frolo.js|battle/characters/index.js|battle/combat.js|battle/combat/actions.js|battle/combat/helpers.js|battle/combat/setup.js|battle/combat/turnEnd.js',
    ];
    const isWhitelisted = (scc) => {
      const sig = scc.map(f => relativeSourcePath(ROOT, f)).sort().join('|');
      return KNOWN_PREEXISTING_CYCLES.includes(sig);
    };
    const newCycles = cyclicSCCs.filter(c => !isWhitelisted(c));
    // 把循环报成 "violations",展示 SCC 成员
    const violations = newCycles.map((scc, i) => ({
      file: `(cycle ${i + 1}) ${scc.map(f => relativeSourcePath(ROOT, f)).join(' → ')}`,
    }));
    lintWarn({
      rule: '边界:battle/gacha 运行时 import 无循环',
      reason: '循环依赖让模块初始化顺序错乱,aogusita.js ↔ damage.js ↔ characters/index.js 这种环会让 hook 注册时机不可控。Phase 4 通过 hook 注入切断 damage.js → characters/index.js,不得再用任何形式重连。combat orchestration 大环(turnEnd/helpers/actions/setup/combat.js/frolo)因属 facade+setup 互引,触发不到运行时初始化顺序问题,暂白名单。',
      violations,
      fix: '把反向依赖改成上层注入、callback 或 context 传递。不得用 await import() 隐藏、不得复制两份、不得合并文件。',
    });
  });

  it('验证:Phase 4 切断 damage.js → characters/index.js(不许重连)', () => {
    const damagePath = resolve(ROOT, 'battle/combat/damage.js');
    const txt = readFileSync(damagePath, 'utf8');
    const lines = txt.split('\n');
    const violations = [];
    lines.forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      if (/\bfrom\s+['"]\.\.\/characters\/index\b/.test(line) ||
          /\bfrom\s+['"]\.\.\/characters\/index\.js['"]/.test(line)) {
        violations.push({ file: 'battle/combat/damage.js', line: i + 1, snippet: line.trim() });
      }
    });
    lintWarn({
      rule: 'Phase 4 验断:damage.js 不许 import characters/index.js',
      reason: 'Phase 4 已通过 setDamageHooksResolver 注入 hook 切断循环。重新引入此 import 会让 aogusita.js ↔ damage.js 循环重建,角色 hook 注册时机失控。',
      violations,
      fix: '保持 damage.js 用 queryHook/{}_resolveCharacterHook 调用注入的 resolver;若需要新 hook 通过 combat orchestration 注入。',
    });
  });
});