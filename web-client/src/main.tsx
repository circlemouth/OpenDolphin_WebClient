import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';

const isTruthyEnvFlag = (value: string | undefined) => value === '1' || value?.toLowerCase() === 'true';

const enableMocking = async (): Promise<boolean> => {
  if (!import.meta.env.DEV) {
    return false;
  }

  if (isTruthyEnvFlag(import.meta.env.VITE_DISABLE_MSW)) {
    console.info('[MSW] 環境変数によりモックを無効化します。');
    return false;
  }

  const supportsServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  if (!supportsServiceWorker) {
    console.info('[MSW] このブラウザは Service Worker に未対応のためモックを無効化します。');
    return false;
  }

  const hostname = window.location.hostname;
  const isLoopbackHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
  const isHttpLocalhost = window.location.protocol === 'http:' && isLoopbackHost;

  if (!window.isSecureContext && !isHttpLocalhost) {
    console.info('[MSW] 非セキュアコンテキストのためモックを無効化します。');
    return false;
  }

  try {
    const { worker } = await import('@/mocks/browser');
    const baseUrl = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: `${baseUrl}mockServiceWorker.js`,
      },
    });
    console.info('[MSW] 開発用モックを有効化しました。');
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/SSL certificate error/i.test(message)) {
      console.warn('[MSW] セルフサイン証明書の検証に失敗したためモックを無効化しました。');
      return false;
    }
    console.error('[MSW] モックの初期化に失敗しました。', error);
    return false;
  }
};

const bootstrap = async () => {
  if (isTruthyEnvFlag(import.meta.env.VITE_ENABLE_TELEMETRY)) {
    const { initializeOtel } = await import('@/observability/otelClient');
    initializeOtel();
  }

  if (!isTruthyEnvFlag(import.meta.env.VITE_DISABLE_SECURITY)) {
    const { initializeSecurityPolicies } = await import('@/libs/security');
    initializeSecurityPolicies();
  }

  if (!isTruthyEnvFlag(import.meta.env.VITE_DISABLE_AUDIT)) {
    const { initializeAuditTrail } = await import('@/libs/audit');
    initializeAuditTrail();
  }

  const mswEnabled = await enableMocking();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App mswEnabled={mswEnabled} />
    </StrictMode>,
  );
};

void bootstrap();
