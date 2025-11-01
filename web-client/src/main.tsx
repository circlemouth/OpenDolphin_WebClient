import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/App';
import { initializeAuditTrail } from '@/libs/audit';
import { initializeSecurityPolicies } from '@/libs/security';

const enableMocking = async () => {
  if (!import.meta.env.DEV) {
    return;
  }

  try {
    const { worker } = await import('@/mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
    console.info('[MSW] 開発用モックを有効化しました。');
  } catch (error) {
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
