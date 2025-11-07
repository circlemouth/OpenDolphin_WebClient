import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@emotion/react';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from '@/libs/auth/AuthProvider';
import { ReplayGapProvider } from '@/features/replay-gap/ReplayGapContext';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { appTheme } from '@/styles/theme';
import { createAppRouter } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * attempt, 5000),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const App = () => {
  const router = useMemo(() => createAppRouter(), []);

  return (
    <ThemeProvider theme={appTheme}>
      <GlobalStyle />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ReplayGapProvider>
            <RouterProvider router={router} />
          </ReplayGapProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
