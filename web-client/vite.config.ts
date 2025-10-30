import path from 'node:path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

const apiProxyTarget = process.env.VITE_DEV_PROXY_TARGET ?? 'http://localhost:8080/opendolphin-server/resources';

const apiProxy = {
  '/api': {
    target: apiProxyTarget,
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => path.replace(/^\/api\b/, ''),
  },
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    strictPort: true,
    proxy: { ...apiProxy },
  },
  preview: {
    https: true,
    proxy: { ...apiProxy },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setupTests.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
