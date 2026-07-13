// Phase D · skillHints/terms 玩家文案门禁 + 假倍率草稿词
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');
const BAD = /状态机|模拟器简化|未实装|原版未|effect\.|flat\s|hook\b/;
const DRAFT = /假倍率|原版对比|工程口径|占位不双算/;

function playerLines(src) {
  return src
    .split('\n')
    .filter(l => !l.trim().startsWith('//'))
    .join('\n');
}

describe('lint · skillHints/terms 玩家文案无工程草稿词', () => {
  it('skillHints.js', () => {
    const src = playerLines(readFileSync(resolve(ROOT, 'src/ui/render/skillHints.js'), 'utf8'));
    const m = src.match(BAD);
    expect(m, m ? `found ${m[0]}` : '').toBeNull();
  });

  it('terms.js', () => {
    const src = playerLines(readFileSync(resolve(ROOT, 'src/ui/terms.js'), 'utf8'));
    const m = src.match(BAD);
    expect(m, m ? `found ${m[0]}` : '').toBeNull();
  });

  it('skillHints 无假倍率/工程对照草稿词与裸 ×3.0 字面', () => {
    const src = playerLines(readFileSync(resolve(ROOT, 'src/ui/render/skillHints.js'), 'utf8'));
    const m = src.match(DRAFT);
    expect(m, m ? `found ${m[0]}` : '').toBeNull();
    // 仅拦源码里的裸字面「× 3.0」；模板 ${fullMult} 不算
    const lit = src.match(/[×xX]\s*3\.0(?![0-9])/);
    expect(lit, lit ? `literal ${lit[0]}` : '').toBeNull();
  });

  it('registry.ts effect.label 无 →', () => {
    const src = readFileSync(resolve(ROOT, 'src/data/chains/registry.ts'), 'utf8');
    const labels = [...src.matchAll(/"label"\s*:\s*"([^"]*)"/g)].map(m => m[1]);
    const bad = labels.filter(l => l.includes('→') || l.includes('状态机'));
    expect(bad, bad.join(' | ')).toEqual([]);
  });
});
