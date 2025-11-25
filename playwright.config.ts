import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173',
  },
});
