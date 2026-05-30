import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const DEV_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self';";
const PROD_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self';";

function cspPlugin() {
  return {
    name: 'csp',
    transformIndexHtml(html: string, ctx: any) {
      const isDev = ctx.server || process.env.NODE_ENV !== 'production';
      return html.replace('__CSP__', isDev ? DEV_CSP : PROD_CSP);
    },
  };
}

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./js/tests/setup.ts'],
    include: ['js/shared/tests/**/*.test.{ts,tsx}', 'js/tests/**/*.test.{ts,tsx}', 'js/domains/**/tests/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['js/core/**/*.ts', 'js/stores/**/*.ts', 'js/domains/**/*.ts', 'js/config/**/*.ts'],
    },
  },
  plugins: [react({ include: /\.(jsx|tsx)$/ }), cspPlugin()],
  server: {
    host: true,
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
