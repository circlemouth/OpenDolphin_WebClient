import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: 'list',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    ignoreHTTPSErrors: true,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
});
