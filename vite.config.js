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
          if (id.includes('/src/battle/characters/')) return 'battle';
          if (id.includes('/src/battle/combat/')) return 'battle';
          if (id.includes('/src/ui2/')) return 'ui2';
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
