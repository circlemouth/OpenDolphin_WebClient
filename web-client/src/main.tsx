import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';
import { initializeAuditTrail } from '@/libs/audit';
import { initializeSecurityPolicies } from '@/libs/security';

const enableMocking = async () => {
  if (!import.meta.env.DEV) {
    return;
  }

  const supportsServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  if (!supportsServiceWorker) {
    console.info('[MSW] このブラウザは Service Worker に未対応のためモックを無効化します。');
    return;
  }

  const hostname = window.location.hostname;
  const isLoopbackHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
  const isHttpLocalhost = window.location.protocol === 'http:' && isLoopbackHost;

  if (!window.isSecureContext && !isHttpLocalhost) {
    console.info('[MSW] 非セキュアコンテキストのためモックを無効化します。');
    return;
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/SSL certificate error/i.test(message)) {
      console.warn('[MSW] セルフサイン証明書の検証に失敗したためモックを無効化しました。');
      return;
    }
    console.error('[MSW] モックの初期化に失敗しました。', error);
  }
};

const bootstrap = async () => {
  initializeSecurityPolicies();
  initializeAuditTrail();

  await enableMocking();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
};

void bootstrap();
