import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./js/tests/setup.ts'],
    include: ['js/tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['js/core/**/*.ts', 'js/stores/**/*.ts'],
    },
  },
  plugins: [react({ include: /\.(jsx|tsx)$/ })],
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor';
          if (id.includes('node_modules/dexie')) return 'dexie';
        },
      },
    },
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': '/js',
      '@/core': '/js/core',
      '@/ui': '/js/ui',
      '@/config': '/js/config',
    },
  },
});
