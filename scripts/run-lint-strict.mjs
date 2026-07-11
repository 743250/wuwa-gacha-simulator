import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', 'run', 'tests/lint/'],
  {
    stdio: 'inherit',
    env: { ...process.env, LINT_STRICT: '1' },
  },
);

process.exit(result.status);
