import { defineConfig } from '@playwright/test';

// RUN_ID=20251212T054836Z
// MSW/実API 切替フラグ（Vite 側と合わせる）:
// - VITE_USE_MOCK_ORCA_QUEUE=1 なら ORCA キューをモックし、0/未設定なら実 API に向ける。
// - VITE_VERIFY_ADMIN_DELIVERY=1 なら Administration 設定配信をテストで検証する。
// - VITE_DISABLE_MSW/PLAYWRIGHT_DISABLE_MSW で dev サーバーの MSW を無効化できる（CI matrix 用）。
const useMockOrcaQueue = process.env.VITE_USE_MOCK_ORCA_QUEUE === '1';
const verifyAdminDelivery = process.env.VITE_VERIFY_ADMIN_DELIVERY === '1';
const disableMsw = process.env.VITE_DISABLE_MSW === '1' || process.env.PLAYWRIGHT_DISABLE_MSW === '1';
const useHttps = process.env.VITE_DEV_USE_HTTPS === '1';
const protocol = useHttps ? 'https' : 'http';
const patientImagesMvp = process.env.VITE_PATIENT_IMAGES_MVP === '1';
const webServerCommand = `cd web-client && VITE_DEV_USE_HTTPS=${useHttps ? '1' : '0'} VITE_DISABLE_PROXY=1 VITE_DISABLE_MSW=${disableMsw ? '1' : '0'} VITE_PATIENT_IMAGES_MVP=${patientImagesMvp ? '1' : '0'} npm run dev -- --host --port 4173 --clearScreen false`;

export default defineConfig({
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `${protocol}://localhost:4173`,
    ignoreHTTPSErrors: true,
    serviceWorkers: 'allow',
    // 環境フラグはヘッダー経由でテストアプリに伝播させる（サーバー側で参照する想定）。
    extraHTTPHeaders: {
      'x-use-mock-orca-queue': useMockOrcaQueue ? '1' : '0',
      'x-verify-admin-delivery': verifyAdminDelivery ? '1' : '0',
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: webServerCommand,
    url: `${protocol}://localhost:4173`,
    ignoreHTTPSErrors: true,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
