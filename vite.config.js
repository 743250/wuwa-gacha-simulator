import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

const SINGLE_FILE = process.env.SINGLE_FILE === '1';

export default defineConfig({
  base: './',
  plugins: [preact()],
  server: { port: 5173, open: true },
  build: {
    outDir: SINGLE_FILE ? 'single' : 'dist',
    emptyOutDir: true,
    rollupOptions: SINGLE_FILE ? {} : {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('preact') || id.includes('@preact')) return 'vendor-preact';
            return 'vendor';
          }
          // src/ 全部进 index chunk(默认)。当前入口、UI、battle、data 之间仍有交叉依赖,
          // 强行拆 src/ chunk 容易重新引入 circular chunk 警告。后续若 AppShell / init
          // 边界收口完成,再重新评估分块。计划见 docs/plans/architecture/plan.md。
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
