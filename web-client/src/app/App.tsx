import { useMemo } from 'react';
import styled from '@emotion/styled';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@emotion/react';
import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from '@/libs/auth/AuthProvider';
import { ReplayGapProvider } from '@/features/replay-gap/ReplayGapContext';
import { TraceErrorBoundary } from '@/app/TraceErrorBoundary';
import { TraceNoticeCenter } from '@/components';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { appTheme } from '@/styles/theme';
import { createAppRouter } from './router';

const WarningBanner = styled.div`
  position: sticky;
  top: 0;
  z-index: 90;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.palette.warningMuted};
  border: 1px solid ${({ theme }) => theme.palette.warning};
  color: ${({ theme }) => theme.palette.text};
  padding: 10px 14px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  box-shadow: ${({ theme }) => theme.elevation.level1};
`;

interface AppProps {
  mswEnabled?: boolean;
}

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

export const App = ({ mswEnabled = false }: AppProps) => {
  const router = useMemo(() => createAppRouter(), []);
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const isApiBaseUnset = apiBase === undefined || apiBase === null || apiBase === '';
  const shouldShowMissingEndpointWarning = isApiBaseUnset && !mswEnabled;

  return (
    <ThemeProvider theme={appTheme}>
      <GlobalStyle />
      {shouldShowMissingEndpointWarning ? (
        <WarningBanner role="status" aria-live="assertive">
          接続先未設定（Stage URL を .env.stage に記入してください）
        </WarningBanner>
      ) : null}
      <TraceErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ReplayGapProvider>
              <RouterProvider router={router} />
            </ReplayGapProvider>
          </AuthProvider>
        </QueryClientProvider>
      </TraceErrorBoundary>
      <TraceNoticeCenter />
    </ThemeProvider>
  );
};
