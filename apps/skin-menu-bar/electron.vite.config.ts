import { defineConfig } from 'electron-vite';
import { resolve } from 'node:path';

export default defineConfig({
  main: {
    entry: 'src/main.ts',
    outDir: 'dist',
  },
  preload: {
    entry: 'src/preload.ts',
    outDir: 'dist',
  },
  renderer: {
    root: 'src/renderer',
    build: {
      outDir: 'dist/renderer',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
