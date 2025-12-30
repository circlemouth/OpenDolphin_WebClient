import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
  type MouseEvent,
} from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useParams,
  type Location,
} from 'react-router-dom';

import { LoginScreen, type LoginResult } from './LoginScreen';
import { ChartsPage } from './features/charts/pages/ChartsPage';
import { ChartsOutpatientPrintPage } from './features/charts/pages/ChartsOutpatientPrintPage';
import { ChartsDocumentPrintPage } from './features/charts/pages/ChartsDocumentPrintPage';
import { ReceptionPage } from './features/reception/pages/ReceptionPage';
import { OutpatientMockPage } from './features/outpatient/OutpatientMockPage';
import './styles/app-shell.css';
import { updateObservabilityMeta } from './libs/observability/observability';
import { AuthServiceProvider, clearStoredAuthFlags, useAuthService } from './features/charts/authService';
import { PatientsPage } from './features/patients/PatientsPage';
import { AdministrationPage } from './features/administration/AdministrationPage';
import { AppToastProvider, type AppToast, type AppToastInput } from './libs/ui/appToast';
import { logAuditEvent } from './libs/audit/auditLogger';
import {
  SESSION_EXPIRED_EVENT,
  clearSessionExpiredNotice,
  type SessionExpiryNotice,
} from './libs/session/sessionExpiry';
import {
  buildFacilityPath,
  buildFacilityUrl,
  ensureFacilityUrl,
  parseFacilityPath,
} from './routes/facilityRoutes';

type Session = LoginResult;
const AUTH_STORAGE_KEY = 'opendolphin:web-client:auth';

const loadStoredSession = (): Session | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.facilityId || !parsed?.userId) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      clearStoredAuthFlags();
      return null;
    }
    return parsed;
  } catch {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    clearStoredAuthFlags();
    return null;
  }
};

const persistSession = (session: Session) => {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage が使えない環境ではスキップ
  }
};

const clearSession = () => {
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // storage が使えない環境ではスキップ
  }
  clearStoredAuthFlags();
};

const clearStoredCredentials = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem('devPasswordMd5');
    localStorage.removeItem('devClientUuid');
    localStorage.removeItem('devRole');
  } catch {
    // ignore storage errors
  }
};

const SessionContext = createContext<Session | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const context = useOptionalSession();
  if (!context) {
    throw new Error('useSession must be used within SessionContext');
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOptionalSession() {
  return useContext(SessionContext);
}

const NAV_LINKS: Array<{ to: string; label: string; roles?: string[] }> = [
  { to: '/reception', label: '受付 / トーン連携' },
  { to: '/charts', label: 'カルテ / Charts' },
  { to: '/patients', label: '患者管理' },
  { to: '/administration', label: 'Administration 配信', roles: ['system_admin', 'admin', 'system-admin'] },
  { to: '/outpatient-mock', label: 'Outpatient Mock' },
];

export function AppRouter() {
  const [session, setSession] = useState<Session | null>(null);

  const handleLoginSuccess = (result: LoginResult) => {
    updateObservabilityMeta({ runId: result.runId });
    setSession(result);
    persistSession(result);
  };

  const handleLogout = useCallback((reason: 'manual' | 'session-expired' = 'manual') => {
    if (reason === 'manual') {
      clearSessionExpiredNotice();
    }
    clearStoredCredentials();
    clearSession();
    setSession(null);
  }, []);

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored) {
      setSession(stored);
      updateObservabilityMeta({ runId: stored.runId });
    }
  }, []);

  useEffect(() => {
    const onSessionExpired = (event: Event) => {
      const detail = (event as CustomEvent<SessionExpiryNotice>).detail;
      if (session) {
        logAuditEvent({
          runId: session.runId,
          source: 'auth',
          note: 'session expired',
          payload: {
            reason: detail?.reason,
            status: detail?.status,
            screen: 'session',
            actor: `${session.facilityId}:${session.userId}`,
          },
        });
      }
      handleLogout('session-expired');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired as EventListener);
      }
    };
  }, [handleLogout, session]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<FacilityGate session={session} onLogout={() => handleLogout('manual')} />}>
          <Route path="login" element={<LoginScreen onLoginSuccess={handleLoginSuccess} />} />
          <Route path="f/:facilityId/*" element={<FacilityShell session={session} />} />
          <Route path="*" element={<LegacyRootRedirect session={session} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function FacilityGate({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  const location = useLocation();
  if (!session) {
    if (location.pathname === '/login') {
      return <Outlet />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (location.pathname === '/login') {
    const redirectFrom = resolveLoginRedirect(location);
    if (redirectFrom) {
      return <Navigate to={normalizeFacilityRedirect(session.facilityId, redirectFrom)} replace />;
    }
    return <Navigate to={buildFacilityPath(session.facilityId, '/reception')} replace />;
  }

  return (
    <SessionContext.Provider value={session}>
      <AuthServiceProvider
        initialFlags={{
          runId: session.runId,
          cacheHit: false,
          missingMaster: true,
          dataSourceTransition: 'snapshot',
        }}
        sessionKey={`${session.facilityId}:${session.userId}`}
      >
        <AppLayout onLogout={onLogout} />
      </AuthServiceProvider>
    </SessionContext.Provider>
  );
}

function FacilityShell({ session }: { session: Session | null }) {
  const { facilityId } = useParams();
  const location = useLocation();
  const normalizedId = facilityId ? decodeURIComponent(facilityId) : undefined;

  if (!session) {
    const next = buildFacilityUrl(normalizedId, location.pathname, location.search);
    return <Navigate to="/login" state={{ from: next }} replace />;
  }

  if (normalizedId && normalizedId !== session.facilityId) {
    return <Navigate to={buildFacilityPath(session.facilityId, '/reception')} replace />;
  }

  return (
    <Routes>
      <Route index element={<Navigate to={buildFacilityPath(session.facilityId, '/reception')} replace />} />
      <Route path="reception" element={<ConnectedReception />} />
      <Route path="charts" element={<ConnectedCharts />} />
      <Route path="charts/print/outpatient" element={<ChartsOutpatientPrintPage />} />
      <Route path="charts/print/document" element={<ChartsDocumentPrintPage />} />
      <Route path="patients" element={<ConnectedPatients />} />
      <Route path="administration" element={<ConnectedAdministration />} />
      <Route path="outpatient-mock" element={<OutpatientMockPage />} />
      <Route path="*" element={<Navigate to={buildFacilityPath(session.facilityId, '/reception')} replace />} />
    </Routes>
  );
}

function LegacyRootRedirect({ session }: { session: Session | null }) {
  const location = useLocation();
  const redirectFromLoginState = resolveLoginRedirect(location);
  if (redirectFromLoginState) {
    return <Navigate to={redirectFromLoginState} replace />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const facilityId = session.facilityId;
  const legacyRedirect = ensureFacilityUrl(facilityId, location.pathname, location.search);
  return <Navigate to={legacyRedirect} replace />;
}

const resolveLoginRedirect = (location: Location): string | null => {
  const state = location.state as { from?: string | Location } | null;
  const from = state?.from;
  if (!from) return null;
  if (typeof from === 'string') {
    return from;
  }
  const path = from.pathname ?? '';
  if (!path) return null;
  return `${path}${from.search ?? ''}`;
};

const normalizeFacilityRedirect = (facilityId: string, target: string) => {
  const [pathname, rawSearch] = target.split('?');
  const search = rawSearch ? `?${rawSearch}` : '';
  const facilityMatch = parseFacilityPath(pathname);
  const safePath = facilityMatch
    ? buildFacilityPath(facilityId, facilityMatch.suffix)
    : buildFacilityPath(facilityId, pathname);
  return `${safePath}${search}`;
};

function AppLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const session = useSession();
  const { flags } = useAuthService();
  const resolvedRunId = flags.runId || session.runId;
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const toastTimers = useRef<Map<string, number>>(new Map());

  const enqueueToast = useCallback((toast: AppToastInput) => {
    const id = toast.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => {
      if (prev.some((item) => item.id === id)) {
        return prev;
      }
      return [...prev.slice(-2), { id, ...toast }];
    });
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
      toastTimers.current.delete(id);
    }, 5200);
    toastTimers.current.set(id, timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setToasts((prev) => {
          const removed = prev.length ? prev[prev.length - 1] : undefined;
          if (removed) {
            const timer = toastTimers.current.get(removed.id);
            if (timer) {
              window.clearTimeout(timer);
              toastTimers.current.delete(removed.id);
            }
          }
          return prev.slice(0, -1);
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      toastTimers.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!resolvedRunId || resolvedRunId === session.runId) return;
    persistSession({ ...session, runId: resolvedRunId });
  }, [resolvedRunId, session]);

  const navItems = useMemo(
    () =>
      NAV_LINKS.map((link) => {
        const allowed = !link.roles || link.roles.includes(session.role);
        const linkPath = buildFacilityPath(session.facilityId, link.to);
        const className = ({ isActive }: { isActive: boolean }) =>
          `app-shell__nav-link${isActive || location.pathname.startsWith(linkPath) ? ' is-active' : ''}${
            allowed ? '' : ' is-disabled'
          }`;
        const handleClick = (event: MouseEvent) => {
          if (!allowed) {
            event.preventDefault();
            enqueueToast({
              tone: 'warning',
              message: 'アクセス権限がありません',
              detail: `必要ロール: ${link.roles?.join(', ') ?? '指定なし'} / 現在: ${session.role} / 管理者へ依頼・再ログインで解消`,
            });
            logAuditEvent({
              runId: resolvedRunId,
              source: 'authz',
              note: 'navigation access denied',
              payload: {
                operation: 'navigate',
                target: link.to,
                requiredRoles: link.roles,
                role: session.role,
                actor: `${session.facilityId}:${session.userId}`,
                screen: 'navigation',
              },
            });
          }
        };
        return (
          <NavLink
            key={link.to}
            to={allowed ? linkPath : '#'}
            className={className}
            aria-disabled={!allowed}
            tabIndex={allowed ? 0 : -1}
            onClick={handleClick}
            data-tooltip={
              allowed ? undefined : `権限がありません（必要ロール: ${link.roles?.join(', ') ?? '指定なし'}）`
            }
          >
            {link.label}
          </NavLink>
        );
      }),
    [enqueueToast, location.pathname, resolvedRunId, session.facilityId, session.role, session.userId],
  );

  const handleCopyRunId = async () => {
    const runId = resolvedRunId;
    if (!runId) {
      enqueueToast({ tone: 'error', message: 'RUN_ID が未取得です', detail: 'ログイン情報を確認してください。' });
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(runId);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = runId;
        textarea.style.position = 'fixed';
        textarea.style.top = '-1000px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      enqueueToast({ tone: 'success', message: 'RUN_ID をコピーしました', detail: runId });
    } catch {
      enqueueToast({ tone: 'error', message: 'RUN_ID のコピーに失敗しました', detail: 'クリップボード権限を確認してください。' });
    }
  };

  return (
    <AppToastProvider value={{ enqueue: enqueueToast, dismiss: dismissToast }}>
      <div className="app-shell">
        <header className="app-shell__topbar" role="status" aria-live="polite" data-run-id={resolvedRunId}>
          <div className="app-shell__brand">
            <span className="app-shell__title">OpenDolphin Web</span>
            <small className="app-shell__subtitle">電子カルテデモシェル</small>
          </div>
          <div className="app-shell__session" data-run-id={resolvedRunId}>
            <span className="app-shell__pill app-shell__pill--fixed">施設ID: {session.facilityId}</span>
            <span className="app-shell__pill app-shell__pill--fixed">
              ユーザー: {session.displayName ?? session.commonName ?? session.userId}
            </span>
            <span className="app-shell__pill app-shell__pill--fixed" data-tooltip="認可ロール">
              role: {session.role}
            </span>
            <button
              type="button"
              className="app-shell__pill app-shell__pill--copy"
              onClick={handleCopyRunId}
              aria-label={`RUN_ID をコピー: ${resolvedRunId}`}
            >
              RUN_ID: {resolvedRunId}
              <span className="app-shell__pill-note">クリックでコピー</span>
            </button>
            <button type="button" className="app-shell__logout" onClick={onLogout}>
              ログアウト
            </button>
          </div>
        </header>

        <nav className="app-shell__nav" aria-label="画面ナビゲーション" role="status" aria-live="polite">
          {navItems}
        </nav>

        <div className="app-shell__body">
          <Outlet />
        </div>

        <aside className="app-shell__notice-stack" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`app-shell__notice app-shell__notice--${toast.tone}`} role="status">
              <div className="app-shell__notice-message">{toast.message}</div>
              {toast.detail ? <div className="app-shell__notice-detail">{toast.detail}</div> : null}
              <button
                type="button"
                className="app-shell__notice-close"
                onClick={() => dismissToast(toast.id)}
                aria-label="通知を閉じる"
              >
                ×
              </button>
            </div>
          ))}
        </aside>
      </div>
    </AppToastProvider>
  );
}

function ConnectedReception() {
  const session = useSession();
  const { flags } = useAuthService();

  return (
    <ReceptionPage
      runId={flags.runId ?? session.runId}
      patientId={`PX-${session.facilityId}-${session.userId}`}
      receptionId={`R-${session.facilityId}-${session.userId}`}
      destination="ORCA queue"
      title="Reception → Charts トーン連携"
      description="ログインした RUN_ID を受け継ぎ、Reception の missingMaster/cacheHit/dataSourceTransition をそのまま Charts 側へ渡すデモです。"
    />
  );
}

function ConnectedCharts() {
  return <ChartsPage />;
}

function ConnectedPatients() {
  const session = useSession();
  const { flags } = useAuthService();
  return <PatientsPage runId={flags.runId ?? session.runId} />;
}

function ConnectedAdministration() {
  const session = useSession();
  const { flags } = useAuthService();
  return <AdministrationPage runId={flags.runId ?? session.runId} role={session.role} />;
}
