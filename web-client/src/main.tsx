import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppRouter } from './AppRouter';
import { patchMockRuntimeState, resolveMockGateDecision, writeMockRuntimeState } from './libs/devtools/mockGate';
import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

async function bootstrap() {
  const canEverStartMsw = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === '1' && import.meta.env.VITE_DISABLE_MSW !== '1';
  const decision = resolveMockGateDecision();
  writeMockRuntimeState({ version: 1, decision, mswStarted: false });

  if (canEverStartMsw && decision.allowed) {
    try {
      const { startMockWorker } = await import('./mocks/browser');
      const started = await startMockWorker();
      patchMockRuntimeState({ mswStarted: started });
      if (!started) {
        patchMockRuntimeState({ mswStartError: 'startMockWorker returned false' });
      }
    } catch (error) {
      patchMockRuntimeState({
        mswStarted: false,
        mswStartError: error instanceof Error ? error.message : String(error),
      });
      console.warn('[msw] bootstrap skipped', error);
    }
  } else if (decision.urlEnabled && import.meta.env.DEV) {
    // URL に msw=1 が付いているのに gate が閉じている場合は、誤設定に気づけるようログを残す。
    console.warn('[msw] gate denied', { reasons: decision.reasons });
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </StrictMode>,
  );
}

bootstrap();
