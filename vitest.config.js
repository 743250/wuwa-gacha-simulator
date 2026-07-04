import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx,ts,tsx}'],
    // 用 forks pool 隔离模块单例。src/ 的 `S` 是模块级共享对象,
    // 用 threads 默认池时并行 worker 会互相污染(2026-07-03 由 weapons.test 引入后暴露)。
    pool: 'forks',
    // tests/ui2/ 下的 Preact 组件测试需要 DOM,用 happy-dom。
    // vitest 4.x 已移除 environmentMatchGlobs,改在每个 UI 测试文件顶部加:
    //   // @vitest-environment happy-dom
    // docblock 生效,其余测试保持 node 环境,464 现有测试零受影响。
  },
});
