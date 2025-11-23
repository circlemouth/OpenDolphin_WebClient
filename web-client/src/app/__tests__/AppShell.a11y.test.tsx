import { describe, it, expect, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import type { ReactNode } from 'react';

import { AppShell } from '@/app/layout/AppShell';
import { AuthContext } from '@/libs/auth/auth-context';
import { createAuthHeaders } from '@/libs/auth/auth-headers';
import type { AuthContextValue, AuthSession } from '@/libs/auth/auth-types';
import { appTheme } from '@/styles/theme';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { replayGapInitialState } from '@/features/replay-gap/useReplayGapController';

vi.mock('@/features/replay-gap/ReplayGapContext', () => ({
  useReplayGapContext: () => ({
    state: replayGapInitialState,
    retry: vi.fn().mockResolvedValue(undefined),
    dismiss: vi.fn(),
    runbookHref: '',
    supportHref: '',
    isReloading: false,
    showSupportLink: false,
  }),
  ReplayGapProvider: ({ children }: { children: ReactNode }) => children,
}));

const mockSession: AuthSession = {
  credentials: {
    facilityId: '0001',
    userId: 'doctor01',
    passwordMd5: 'mock',
    clientUuid: 'uuid',
  },
};

const mockAuthContext: AuthContextValue = {
  session: mockSession,
  isAuthenticated: true,
  login: async () => mockSession,
  logout: () => undefined,
  getAuthHeaders: () => createAuthHeaders(mockSession.credentials),
  hasRole: () => false,
  hasAnyRole: () => false,
};

describe('AppShell accessibility', () => {
  it('should have no detectable accessibility violations', async () => {
    const { container } = render(
      <ThemeProvider theme={appTheme}>
        <GlobalStyle />
        <AuthContext.Provider value={mockAuthContext}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<section aria-label="患者一覧セクション">患者一覧</section>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </ThemeProvider>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
