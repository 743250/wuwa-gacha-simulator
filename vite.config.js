import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

const SINGLE_FILE = process.env.SINGLE_FILE === '1';

export default defineConfig({
  base: './',
  plugins: [preact()],
  server: { port: 5173, open: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: SINGLE_FILE ? {} : {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('preact') || id.includes('@preact')) return 'vendor-preact';
            return 'vendor';
          }
          // src/ 全部进 index chunk(默认)
          // 历史:曾有 battle / ui2 分块,但 src/battle/characters/ ↔ src/ui2/ ↔ src/(index)
          // 形成多重循环:battle→index(via ../forms.js)、index→ui2(via main.js→ui2/root.tsx)、
          // ui2→battle(via TeamRow→battle/characters/index.js)、index→battle(via buffRenderers)。
          // 无法仅靠 manualChunks 打破,合并到 index 是最简方案。
          // 详见 docs/plans/architecture/next-phase-plan.md Phase 2。
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
