import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  base: './',
  plugins: [preact()],
  server: { port: 5173, open: true },
  build: { outDir: 'dist', emptyOutDir: true },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
