import { defineConfig } from '@playwright/test';

// RUN_ID=20251202T090000Z
// MSW/実API 切替フラグ（Vite 側と合わせる）:
// - VITE_USE_MOCK_ORCA_QUEUE=1 なら ORCA キューをモックし、0/未設定なら実 API に向ける。
// - VITE_VERIFY_ADMIN_DELIVERY=1 なら Administration 設定配信をテストで検証する。
const useMockOrcaQueue = process.env.VITE_USE_MOCK_ORCA_QUEUE === '1';
const verifyAdminDelivery = process.env.VITE_VERIFY_ADMIN_DELIVERY === '1';

export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173',
    // 環境フラグはヘッダー経由でテストアプリに伝播させる（サーバー側で参照する想定）。
    extraHTTPHeaders: {
      'x-use-mock-orca-queue': useMockOrcaQueue ? '1' : '0',
      'x-verify-admin-delivery': verifyAdminDelivery ? '1' : '0',
    },
  },
  webServer: {
    command:
      'cd web-client && VITE_DEV_USE_HTTPS=0 VITE_DISABLE_MSW=0 npm run dev -- --host --port 4173 --clearScreen false',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
