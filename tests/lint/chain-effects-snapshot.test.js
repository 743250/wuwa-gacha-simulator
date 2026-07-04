// 铁律 2 提醒:已实装角色的共鸣链数值不可擅自修改
//
// chainEffects.js 是 6 链的结构化 effect 表(数值版)。任何改动都需要用户显式批准。
// 这个 lint 把当前 chainEffects.js 的 MD5 锁住,改动会提醒"你改了数值,确认是用户要求的吗?"
//
// 不是硬阻断 —— 如果是用户明确要求的改动,在 commit message 说明 + 更新 SNAPSHOT_MD5 即可。

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { lintWarn } from './helpers.js';

const CHAIN_EFFECTS_PATH = resolve(__dirname, '../../src/battle/chainEffects.js');

// 锁定的快照 MD5。改动 chainEffects.js 后需要更新这个值。
// 更新前请确认:
//   1. 改动是用户明确要求的(不是"贴近官方"擅自改) —— CLAUDE.md 铁律 2
//   2. 改动原因记录在 commit message / PR 描述
//   3. 跑过 tests/battle/chains.test.js 全绿
const SNAPSHOT_MD5 = '9d1f5d71d38533beb1bfaff758ebc59c';

function md5(content) {
  return createHash('md5').update(content).digest('hex');
}

describe('lint · 铁律 2:chainEffects.js 数值快照', () => {
  it('提醒:chainEffects.js 内容 MD5 与锁定快照一致', () => {
    const content = readFileSync(CHAIN_EFFECTS_PATH, 'utf8');
    const current = md5(content);
    const violations = current === SNAPSHOT_MD5 ? [] : [
      { file: 'src/battle/chainEffects.js', snippet: `当前 MD5=${current},锁定=${SNAPSHOT_MD5}` },
    ];
    lintWarn({
      rule: '铁律 2:已实装角色数值不动',
      reason: `chainEffects.js 是 84 角色 × 6 链的战斗 effect 数值表。
CLAUDE.md 铁律 2 明确:已实装角色的机制/数值/公式/共鸣链效果一律不动,无论看到什么官方数据。
看官方数据和代码不一致时,记录差异报告用户,等待决定;严禁因"贴近官方"擅自改数值。
架构优化时严禁顺手改角色行为和数值。`,
      violations,
      fix: `如果是用户明确要求的改动:更新本文件的 SNAPSHOT_MD5 = '${current}',并在 commit message 说明原因。
如果是无意改动:git checkout src/battle/chainEffects.js 回滚。`,
    });
    expect(current).toMatch(/^[a-f0-9]{32}$/);
  });
});
