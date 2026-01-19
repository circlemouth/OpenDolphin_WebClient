import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppRouterWithNavigation } from '../AppRouter';

// 軽量モック
vi.mock('../styles/app-shell.css', () => ({}));
vi.mock('../libs/observability/observability', () => ({
  updateObservabilityMeta: vi.fn(),
  resolveAriaLive: () => 'polite',
}));
vi.mock('../libs/observability/runIdCopy', () => ({
  copyRunIdToClipboard: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../libs/audit/auditLogger', () => ({
  logAuditEvent: vi.fn(),
}));
vi.mock('../features/login/recentFacilityStore', () => ({
  addRecentFacility: vi.fn(),
}));
vi.mock('../features/login/loginRouteState', () => ({
  normalizeFromState: (state: unknown) => (typeof state === 'object' && state !== null ? (state as any) : undefined),
  resolveFromState: (state: unknown) =>
    typeof state === 'object' && state !== null && 'from' in (state as any) ? (state as any).from : undefined,
  resolveSwitchContext: (state: unknown) =>
    typeof state === 'object' && state !== null && 'switchContext' in (state as any)
      ? (state as any).switchContext
      : undefined,
  isLegacyFrom: () => false,
}));
vi.mock('../libs/session/sessionExpiry', () => ({
  SESSION_EXPIRED_EVENT: 'session-expired',
  clearSessionExpiredNotice: vi.fn(),
  consumeSessionExpiredNotice: () => undefined,
}));
vi.mock('../libs/ui/appToast', () => ({
  AppToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../features/shared/RunIdNavBadge', () => ({
  RunIdNavBadge: ({ runId }: { runId?: string }) => <div data-testid="runid-nav-badge">{runId}</div>,
}));
vi.mock('../features/charts/authService', async () => {
  const ReactModule = await import('react');
  const AuthContext = ReactModule.createContext({ flags: {} });
  return {
    AuthServiceProvider: ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={{ flags: {} }}>{children}</AuthContext.Provider>
    ),
    useAuthService: () => ReactModule.useContext(AuthContext),
    clearStoredAuthFlags: vi.fn(),
  };
});

vi.mock('../LoginScreen', () => {
  const ReactModule = require('react') as typeof import('react');
  const MockLogin = ({ onLoginSuccess }: { onLoginSuccess?: (result: any) => void }) => {
    useEffect(() => {
      if (onLoginSuccess) {
        onLoginSuccess(globalThis.__mockLoginResult);
      }
    }, [onLoginSuccess]);
    return <div data-testid="login-screen">login</div>;
  };
  return { LoginScreen: MockLogin };
});

vi.mock('../features/reception/pages/ReceptionPage', () => ({
  ReceptionPage: () => <div data-testid="reception-page">reception</div>,
}));
vi.mock('../features/charts/pages/ChartsPage', () => ({
  ChartsPage: () => <div data-testid="charts-page">charts</div>,
}));
vi.mock('../features/charts/pages/ChartsOutpatientPrintPage', () => ({
  ChartsOutpatientPrintPage: () => <div data-testid="charts-outpatient-print">print</div>,
}));
vi.mock('../features/charts/pages/ChartsDocumentPrintPage', () => ({
  ChartsDocumentPrintPage: () => <div data-testid="charts-document-print">doc-print</div>,
}));
vi.mock('../features/patients/PatientsPage', () => ({
  PatientsPage: () => <div data-testid="patients-page">patients</div>,
}));
vi.mock('../features/administration/AdministrationPage', () => ({
  AdministrationPage: () => <div data-testid="administration-page">admin</div>,
}));
vi.mock('../features/outpatient/OutpatientMockPage', () => ({
  OutpatientMockPage: () => <div data-testid="outpatient-mock-page">outpatient-mock</div>,
}));
vi.mock('../features/debug/DebugHubPage', () => ({
  DebugHubPage: () => <div data-testid="debug-hub-page">debug-hub</div>,
}));
vi.mock('../features/debug/OrcaApiConsolePage', () => ({
  OrcaApiConsolePage: () => <div data-testid="debug-orca-api">debug-orca</div>,
}));
vi.mock('../features/debug/LegacyRestConsolePage', () => ({
  LegacyRestConsolePage: () => <div data-testid="debug-legacy-rest">debug-legacy</div>,
}));

declare global {
  // eslint-disable-next-line no-var
  var __mockLoginResult: any;
}

const AUTH_STORAGE_KEY = 'opendolphin:web-client:auth';

const buildRouter = (initialEntries: Array<string | { pathname: string; search?: string; hash?: string; state?: unknown }>, initialIndex = 0) =>
  createMemoryRouter(
    [{ path: '*', element: <AppRouterWithNavigation /> }],
    { initialEntries, initialIndex },
  );

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  globalThis.__mockLoginResult = {
    facilityId: '123',
    userId: 'user-1',
    role: 'doctor',
    runId: 'run-001',
    clientUuid: 'client-001',
  };
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('AppRouter login redirect', () => {
  it('state.from がある場合はクエリ・ハッシュ・state を保持したまま遷移する', async () => {
    const fromState = { pathname: '/f/123/patients', search: '?foo=1', hash: '#h', state: { kw: 'keep' } };
    const router = buildRouter([{ pathname: '/login', state: { from: fromState } }]);

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/f/123/patients');
    });
    expect(router.state.location.search).toBe('?foo=1');
    expect(router.state.location.hash).toBe('#h');
    expect(router.state.location.state).toEqual(fromState.state);
  });

  it('/f/:id/login 直アクセス時は reception へ即リダイレクトする', async () => {
    const router = buildRouter(['/f/123/login']);

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/f/123/reception');
    });
  });

  it('ログイン済みで POP + from 付きで /login に戻った場合のみ LoginSwitchNotice を表示する', async () => {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        facilityId: '123',
        userId: 'user-1',
        role: 'doctor',
        runId: 'run-stay',
      }),
    );

    const router = buildRouter(
      ['/f/123/reception', { pathname: '/login', state: { from: '/f/123/reception' } }],
      1,
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText('ログイン中のため切替が必要です')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('state.from が無い POP で /login に来た場合は即 reception に戻す', async () => {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        facilityId: '123',
        userId: 'user-1',
        role: 'doctor',
        runId: 'run-stay',
      }),
    );

    const router = buildRouter(['/f/123/reception', '/login'], 1);

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/f/123/reception');
    });
    expect(screen.queryByText('ログイン中のため切替が必要です')).not.toBeInTheDocument();
  });
});
