import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppRouter } from './AppRouter';
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
  if (typeof window !== 'undefined' && import.meta.env.VITE_DISABLE_MSW !== '1') {
    try {
      const { startMockWorker } = await import('./mocks/browser');
      await startMockWorker();
    } catch (error) {
      console.warn('[msw] bootstrap skipped', error);
    }
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
