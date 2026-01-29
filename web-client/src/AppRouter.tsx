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
  useNavigate,
  useNavigationType,
  useParams,
  type Location,
} from 'react-router-dom';

import { LoginScreen, type LoginResult } from './LoginScreen';
import { ChartsPage } from './features/charts/pages/ChartsPage';
import { ChartsOutpatientPrintPage } from './features/charts/pages/ChartsOutpatientPrintPage';
import { ChartsDocumentPrintPage } from './features/charts/pages/ChartsDocumentPrintPage';
import { ReceptionPage } from './features/reception/pages/ReceptionPage';
import { OutpatientMockPage } from './features/outpatient/OutpatientMockPage';
import { DebugHubPage } from './features/debug/DebugHubPage';
import { OrcaApiConsolePage } from './features/debug/OrcaApiConsolePage';
import { LegacyRestConsolePage } from './features/debug/LegacyRestConsolePage';
import './styles/app-shell.css';
import { resolveAriaLive, updateObservabilityMeta } from './libs/observability/observability';
import { copyRunIdToClipboard } from './libs/observability/runIdCopy';
import { AuthServiceProvider, clearStoredAuthFlags, useAuthService } from './features/charts/authService';
import { PatientsPage } from './features/patients/PatientsPage';
import { AdministrationPage } from './features/administration/AdministrationPage';
import { AppToastProvider, type AppToast, type AppToastInput } from './libs/ui/appToast';
import { logAuditEvent } from './libs/audit/auditLogger';
import { RunIdNavBadge } from './features/shared/RunIdNavBadge';
import { ChartEventStreamBridge } from './features/shared/ChartEventStreamBridge';
import {
  SESSION_EXPIRED_EVENT,
  clearSessionExpiredNotice,
  type SessionExpiryNotice,
} from './libs/session/sessionExpiry';
import { clearAllAuthShared, clearScopedStorage } from './libs/session/storageCleanup';
import {
  buildFacilityPath,
  buildFacilityUrl,
  decodeFacilityParam,
  describeFacilityId,
  ensureFacilityUrl,
  isFacilityMatch,
  normalizeFacilityId,
  parseFacilityPath,
} from './routes/facilityRoutes';
import { FacilityLoginResolver } from './features/login/FacilityLoginResolver';
import { addRecentFacility } from './features/login/recentFacilityStore';
import { resolveSwitchContext, type LoginSwitchContext } from './features/login/loginRouteState';
import { isSystemAdminRole } from './libs/auth/roles';

type Session = LoginResult;
const AUTH_STORAGE_KEY = 'opendolphin:web-client:auth';
const normalizeBasePath = (value?: string | null): string => {
  if (!value) return '/';
  const trimmed = value.trim();
  if (!trimmed) return '/';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (withLeadingSlash === '/') return '/';
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
};
const BASE_PATH = normalizeBasePath(import.meta.env.VITE_BASE_PATH);

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
  { to: '/reception', label: '受付' },
  { to: '/charts', label: 'カルテ' },
  { to: '/patients', label: '患者' },
  { to: '/administration', label: '管理', roles: ['system_admin'] },
];

const LEGACY_ROUTES = [
  'reception',
  'charts',
  'charts/print/outpatient',
  'charts/print/document',
  'patients',
  'administration',
];

const DEBUG_PAGES_ENABLED = import.meta.env.VITE_ENABLE_DEBUG_PAGES === '1';

const buildSwitchContext = (
  session: Session,
  reason: LoginSwitchContext['reason'] = 'manual',
): LoginSwitchContext => ({
  mode: 'switch',
  reason,
  actor: {
    facilityId: session.facilityId,
    userId: session.userId,
    role: session.role,
    runId: session.runId,
  },
});

export function AppRouter() {
  return (
    <BrowserRouter basename={BASE_PATH}>
      <AppRouterWithNavigation />
    </BrowserRouter>
  );
}

export function AppRouterWithNavigation() {
  const [session, setSession] = useState<Session | null>(() => loadStoredSession());
  const location = useLocation();
  const navigate = useNavigate();

  const handleLoginSuccess = useCallback(
    (result: LoginResult, context?: LoginSwitchContext) => {
      const nextActor = {
        facilityId: result.facilityId,
        userId: result.userId,
        role: result.role,
        runId: result.runId,
      };
      const previousActor = context?.actor ?? (session ?? undefined);
      if (
        context?.mode === 'switch' ||
        (session &&
          (session.facilityId !== result.facilityId ||
            session.userId !== result.userId ||
            session.role !== result.role))
      ) {
        logAuditEvent({
          runId: result.runId,
          source: 'auth',
          note: 'role-switch',
          payload: {
            action: 'role-switch',
            screen: 'login',
            reason: context?.reason ?? 'manual',
            previous: previousActor,
            next: nextActor,
          },
        });
      }
      updateObservabilityMeta({ runId: result.runId });
      addRecentFacility(result.facilityId);
      setSession(result);
      persistSession(result);

      const redirectIntent = resolveLoginRedirect(location);
      const fallbackPath = buildFacilityPath(result.facilityId, '/reception');
      const nextPath = redirectIntent?.to ?? fallbackPath;
      navigate(nextPath, { replace: true, state: redirectIntent?.state });
    },
    [location, navigate, session],
  );

  const handleLogout = useCallback(
    (reason: 'manual' | 'session-expired' = 'manual') => {
      if (reason === 'manual') {
        clearSessionExpiredNotice();
      }
      const current = session;
      if (current) {
        clearScopedStorage({ facilityId: current.facilityId, userId: current.userId });
      }
      clearAllAuthShared();
      clearStoredCredentials();
      clearSession();
      setSession(null);
    },
    [session],
  );

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
    <Routes>
      <Route element={<FacilityGate session={session} onLogout={() => handleLogout('manual')} />}>
        <Route path="login" element={<FacilityLoginResolver />} />
        {LEGACY_ROUTES.map((path) => (
          <Route key={path} path={path} element={<LegacyRootRedirect session={session} />} />
        ))}
        <Route path="outpatient-mock" element={<LegacyOutpatientMockNotFound />} />
        <Route path="f/:facilityId/login" element={<FacilityLoginScreen onLoginSuccess={handleLoginSuccess} />} />
        <Route path="f/:facilityId/*" element={<FacilityShell session={session} />} />
        <Route path="*" element={<LegacyRootRedirect session={session} />} />
      </Route>
    </Routes>
  );
}

function FacilityGate({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const loginRoute = isLoginRoute(location.pathname);
  const redirectIntent = resolveLoginRedirect(location);
  const isBackNavigation = loginRoute && navigationType === 'POP' && Boolean(redirectIntent);
  if (!session) {
    if (loginRoute) {
      return <Outlet />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (loginRoute) {
    if (!isBackNavigation) {
      const nextPath = redirectIntent?.to ?? buildFacilityPath(session.facilityId, '/reception');
      return <Navigate to={nextPath} state={redirectIntent?.state} replace />;
    }
    return <LoginSwitchNotice session={session} onLogout={onLogout} />;
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

function LoginSwitchNotice({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logAuditEvent({
      runId: session.runId,
      source: 'authz',
      note: 'login route blocked',
      payload: {
        action: 'login',
        screen: 'login',
        outcome: 'blocked',
        facilityId: session.facilityId,
        userId: session.userId,
        role: session.role,
      },
    });
  }, [session.facilityId, session.role, session.runId, session.userId]);

  const handleReturn = () => {
    navigate(buildFacilityPath(session.facilityId, '/reception'), { replace: true });
  };

  const handleSwitch = () => {
    const switchContext = buildSwitchContext(session, 'manual');
    logAuditEvent({
      runId: session.runId,
      source: 'auth',
      note: 'switch initiated',
      payload: {
        action: 'role-switch',
        screen: 'login',
        reason: switchContext.reason,
        previous: switchContext.actor,
      },
    });
    onLogout();
    navigate('/login', { state: { from: location, switchContext }, replace: true });
  };

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-switch-notice">
        <header className="login-card__header">
          <h1 id="login-switch-notice">ログイン中のため切替が必要です</h1>
          <p>現在のセッションでは別施設/ユーザーへの切替はできません。権限境界を明示するため、ログアウト後に再ログインしてください。</p>
        </header>
        <div className="status-message is-error" role="status">
          <p>現在のログイン: 施設ID={describeFacilityId(session.facilityId)}</p>
          <p>ユーザー={session.userId} / role={session.role} / RUN_ID={session.runId}</p>
        </div>
        <div className="login-form__actions">
          <button type="button" onClick={handleSwitch}>
            ログアウトして切替
          </button>
          <button type="button" className="facility-entry__secondary" onClick={handleReturn}>
            現在の施設へ戻る
          </button>
        </div>
      </section>
    </main>
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

  if (normalizedId && !isFacilityMatch(normalizedId, session.facilityId)) {
    return <FacilityMismatchNotice session={session} requestedFacilityId={normalizedId} />;
  }

  return (
    <Routes>
      <Route index element={<Navigate to={buildFacilityPath(session.facilityId, '/reception')} replace />} />
      <Route path="reception" element={<ConnectedReception />} />
      <Route path="charts" element={<ConnectedCharts />} />
      <Route path="charts/print/outpatient" element={<ChartsOutpatientPrintPage />} />
      <Route path="charts/print/document" element={<ChartsDocumentPrintPage />} />
      <Route path="patients" element={<ConnectedPatients />} />
      <Route path="administration" element={<AdministrationGate session={session} />} />
      <Route path="debug" element={<DebugHubGate session={session} />} />
      <Route
        path="debug/outpatient-mock"
        element={<DebugOutpatientMockGate session={session} />}
      />
      <Route path="debug/orca-api" element={<DebugOrcaApiGate session={session} />} />
      <Route path="debug/legacy-rest" element={<DebugLegacyRestGate session={session} />} />
      <Route path="*" element={<Navigate to={buildFacilityPath(session.facilityId, '/reception')} replace />} />
    </Routes>
  );
}

function AdministrationGate({ session }: { session: Session }) {
  const navigate = useNavigate();
  const isAllowed = isSystemAdminRole(session.role);

  useEffect(() => {
    if (isAllowed) return;
    logAuditEvent({
      runId: session.runId,
      source: 'authz',
      note: 'administration access denied',
      payload: {
        operation: 'navigate',
        screen: 'administration',
        outcome: 'blocked',
        requiredRole: 'system_admin',
        role: session.role,
        actor: `${session.facilityId}:${session.userId}`,
      },
    });
  }, [isAllowed, session.facilityId, session.role, session.runId, session.userId]);

  if (isAllowed) {
    return <ConnectedAdministration />;
  }

  return (
    <div style={{ maxWidth: '620px', margin: '2rem auto' }}>
      <div className="status-message is-error" role="status">
        <p>Administration は system_admin 専用のためアクセスできません。</p>
        <p>
          現在のログイン: 施設ID={describeFacilityId(session.facilityId)} / ユーザー={session.userId} / role={session.role}
        </p>
        <p>system_admin で再ログインしてください。</p>
      </div>
      <div className="login-form__actions" style={{ marginTop: '1rem' }}>
        <button type="button" onClick={() => navigate(buildFacilityPath(session.facilityId, '/reception'), { replace: true })}>
          受付へ戻る
        </button>
      </div>
    </div>
  );
}

function FacilityMismatchNotice({
  session,
  requestedFacilityId,
}: {
  session: Session;
  requestedFacilityId: string;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    logAuditEvent({
      runId: session.runId,
      source: 'authz',
      note: 'facility boundary denied',
      payload: {
        action: 'navigate',
        screen: 'facility',
        outcome: 'denied',
        facilityId: session.facilityId,
        requestedFacilityId,
        userId: session.userId,
        role: session.role,
      },
    });
  }, [requestedFacilityId, session.facilityId, session.role, session.runId, session.userId]);

  return (
    <div style={{ maxWidth: '620px', margin: '2rem auto' }}>
      <div className="status-message is-error" role="status">
        <p>施設IDが現在のログインと一致しないためアクセスを拒否しました。</p>
        <p>
          要求された施設: {describeFacilityId(requestedFacilityId)} / 現在の施設: {describeFacilityId(session.facilityId)}
        </p>
        <p>現在のログイン: ユーザー={session.userId} / role={session.role} / RUN_ID={session.runId}</p>
        <p>施設/ユーザー切替は上部の「施設/ユーザー切替」からログアウト後に実施してください。</p>
      </div>
      <div className="login-form__actions" style={{ marginTop: '1rem' }}>
        <button type="button" onClick={() => navigate(buildFacilityPath(session.facilityId, '/reception'), { replace: true })}>
          現在の施設へ戻る
        </button>
      </div>
    </div>
  );
}

function FacilityLoginScreen({
  onLoginSuccess,
}: {
  onLoginSuccess: (result: LoginResult, context?: LoginSwitchContext) => void;
}) {
  const { facilityId } = useParams();
  const location = useLocation();
  const normalizedId = normalizeFacilityId(decodeFacilityParam(facilityId) ?? facilityId);
  const switchContext = useMemo(() => resolveSwitchContext(location.state), [location.state]);

  return (
    <LoginScreen
      onLoginSuccess={(result) => onLoginSuccess(result, switchContext)}
      initialFacilityId={normalizedId ?? ''}
      lockFacilityId={Boolean(normalizedId)}
    />
  );
}

function LegacyOutpatientMockNotFound() {
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="legacy-outpatient-mock">
        <header className="login-card__header">
          <h1 id="legacy-outpatient-mock">指定されたページは存在しません</h1>
          <p>旧導線（/outpatient-mock）は本番環境では無効化されています。</p>
        </header>
        <div className="login-form__actions">
          <NavLink to="/login">ログイン画面へ戻る</NavLink>
        </div>
      </section>
    </main>
  );
}

function DebugOutpatientMockGate({ session }: { session: Session }) {
  const navigate = useNavigate();
  const hasEnvAccess = DEBUG_PAGES_ENABLED;
  const hasRoleAccess = isSystemAdminRole(session.role);
  const isAllowed = hasEnvAccess && hasRoleAccess;
  const envFlagValue = DEBUG_PAGES_ENABLED ? '1' : '0';

  useEffect(() => {
    if (isAllowed) return;
    const denialReasons: string[] = [];
    if (!hasEnvAccess) denialReasons.push('env flag disabled');
    if (!hasRoleAccess) denialReasons.push('role missing');
    logAuditEvent({
      runId: session.runId,
      source: 'authz',
      note: 'debug access denied',
      payload: {
        action: 'navigate',
        screen: 'debug',
        debug: true,
        debugFeature: 'outpatient-mock',
        requiredRole: 'system_admin',
        role: session.role,
        envFlags: { VITE_ENABLE_DEBUG_PAGES: envFlagValue },
        denialReasons,
        actor: `${session.facilityId}:${session.userId}`,
      },
    });
  }, [
    envFlagValue,
    hasEnvAccess,
    hasRoleAccess,
    isAllowed,
    session.facilityId,
    session.role,
    session.runId,
    session.userId,
  ]);

  if (!isAllowed) {
    return (
      <div style={{ maxWidth: '620px', margin: '2rem auto' }}>
        <div className="status-message is-error" role="status">
          <p>権限がないためデバッグ画面へのアクセスを拒否しました。</p>
          <p>必要ロール: system_admin / 現在: {session.role}</p>
          <p>ENV: VITE_ENABLE_DEBUG_PAGES={envFlagValue}</p>
          {!hasEnvAccess ? <p>環境フラグが OFF のため表示されません。</p> : null}
          <p>ログイン中: 施設ID={describeFacilityId(session.facilityId)} / ユーザー={session.userId}</p>
        </div>
        <div className="login-form__actions" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate(buildFacilityPath(session.facilityId, '/reception'), { replace: true })}
          >
            Reception へ戻る
          </button>
        </div>
      </div>
    );
  }

  return <OutpatientMockPage />;
}

function DebugHubGate({ session }: { session: Session }) {
  const navigate = useNavigate();
  const hasEnvAccess = DEBUG_PAGES_ENABLED;
  const hasRoleAccess = isSystemAdminRole(session.role);
  const isAllowed = hasEnvAccess && hasRoleAccess;
  const envFlagValue = DEBUG_PAGES_ENABLED ? '1' : '0';

  useEffect(() => {
    if (isAllowed) return;
    const denialReasons: string[] = [];
    if (!hasEnvAccess) denialReasons.push('env flag disabled');
    if (!hasRoleAccess) denialReasons.push('role missing');
    logAuditEvent({
      runId: session.runId,
      source: 'authz',
      note: 'debug access denied',
      payload: {
        action: 'navigate',
        screen: 'debug',
        debug: true,
        debugFeature: 'hub',
        requiredRole: 'system_admin',
        role: session.role,
        envFlags: { VITE_ENABLE_DEBUG_PAGES: envFlagValue },
        denialReasons,
        actor: `${session.facilityId}:${session.userId}`,
      },
    });
  }, [
    envFlagValue,
    hasEnvAccess,
    hasRoleAccess,
    isAllowed,
    session.facilityId,
    session.role,
    session.runId,
    session.userId,
  ]);

  if (!isAllowed) {
    return (
      <div style={{ maxWidth: '620px', margin: '2rem auto' }}>
        <div className="status-message is-error" role="status">
          <p>権限がないためデバッグ導線へのアクセスを拒否しました。</p>
          <p>必要ロール: system_admin / 現在: {session.role}</p>
          <p>ENV: VITE_ENABLE_DEBUG_PAGES={envFlagValue}</p>
          {!hasEnvAccess ? <p>環境フラグが OFF のため表示されません。</p> : null}
          <p>ログイン中: 施設ID={describeFacilityId(session.facilityId)} / ユーザー={session.userId}</p>
        </div>
        <div className="login-form__actions" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate(buildFacilityPath(session.facilityId, '/reception'), { replace: true })}
          >
            Reception へ戻る
          </button>
        </div>
      </div>
    );
  }

  return <DebugHubPage />;
}

function DebugOrcaApiGate({ session }: { session: Session }) {
  const navigate = useNavigate();
  const hasEnvAccess = DEBUG_PAGES_ENABLED;
  const hasRoleAccess = isSystemAdminRole(session.role);
  const isAllowed = hasEnvAccess && hasRoleAccess;
  const envFlagValue = DEBUG_PAGES_ENABLED ? '1' : '0';

  useEffect(() => {
    if (isAllowed) return;
    const denialReasons: string[] = [];
    if (!hasEnvAccess) denialReasons.push('env flag disabled');
    if (!hasRoleAccess) denialReasons.push('role missing');
    logAuditEvent({
      runId: session.runId,
      source: 'authz',
      note: 'debug access denied',
      payload: {
        action: 'navigate',
        screen: 'debug',
        debug: true,
        debugFeature: 'orca-api-console',
        requiredRole: 'system_admin',
        role: session.role,
        envFlags: { VITE_ENABLE_DEBUG_PAGES: envFlagValue },
        denialReasons,
        actor: `${session.facilityId}:${session.userId}`,
      },
    });
  }, [
    envFlagValue,
    hasEnvAccess,
    hasRoleAccess,
    isAllowed,
    session.facilityId,
    session.role,
    session.runId,
    session.userId,
  ]);

  if (!isAllowed) {
    return (
      <div style={{ maxWidth: '620px', margin: '2rem auto' }}>
        <div className="status-message is-error" role="status">
          <p>権限がないため ORCA API コンソールへのアクセスを拒否しました。</p>
          <p>必要ロール: system_admin / 現在: {session.role}</p>
          <p>ENV: VITE_ENABLE_DEBUG_PAGES={envFlagValue}</p>
          {!hasEnvAccess ? <p>環境フラグが OFF のため表示されません。</p> : null}
          <p>ログイン中: 施設ID={describeFacilityId(session.facilityId)} / ユーザー={session.userId}</p>
        </div>
        <div className="login-form__actions" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate(buildFacilityPath(session.facilityId, '/reception'), { replace: true })}
          >
            Reception へ戻る
          </button>
        </div>
      </div>
    );
  }

  return <OrcaApiConsolePage />;
}

function DebugLegacyRestGate({ session }: { session: Session }) {
  const navigate = useNavigate();
  const hasEnvAccess = DEBUG_PAGES_ENABLED;
  const hasRoleAccess = isSystemAdminRole(session.role);
  const isAllowed = hasEnvAccess && hasRoleAccess;
  const envFlagValue = DEBUG_PAGES_ENABLED ? '1' : '0';

  useEffect(() => {
    if (isAllowed) return;
    const denialReasons: string[] = [];
    if (!hasEnvAccess) denialReasons.push('env flag disabled');
    if (!hasRoleAccess) denialReasons.push('role missing');
    logAuditEvent({
      runId: session.runId,
      source: 'authz',
      note: 'debug access denied',
      payload: {
        action: 'navigate',
        screen: 'debug',
        debug: true,
        debugFeature: 'legacy-rest-console',
        requiredRole: 'system_admin',
        role: session.role,
        envFlags: { VITE_ENABLE_DEBUG_PAGES: envFlagValue },
        denialReasons,
        actor: `${session.facilityId}:${session.userId}`,
      },
    });
  }, [
    envFlagValue,
    hasEnvAccess,
    hasRoleAccess,
    isAllowed,
    session.facilityId,
    session.role,
    session.runId,
    session.userId,
  ]);

  if (!isAllowed) {
    return (
      <div style={{ maxWidth: '620px', margin: '2rem auto' }}>
        <div className="status-message is-error" role="status">
          <p>権限がないため Legacy REST コンソールへのアクセスを拒否しました。</p>
          <p>必要ロール: system_admin / 現在: {session.role}</p>
          <p>ENV: VITE_ENABLE_DEBUG_PAGES={envFlagValue}</p>
          {!hasEnvAccess ? <p>環境フラグが OFF のため表示されません。</p> : null}
          <p>ログイン中: 施設ID={describeFacilityId(session.facilityId)} / ユーザー={session.userId}</p>
        </div>
        <div className="login-form__actions" style={{ marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate(buildFacilityPath(session.facilityId, '/reception'), { replace: true })}
          >
            Reception へ戻る
          </button>
        </div>
      </div>
    );
  }

  return <LegacyRestConsolePage />;
}

function LegacyRootRedirect({ session }: { session: Session | null }) {
  const location = useLocation();
  const redirectFromLoginState = resolveLoginRedirect(location);
  if (redirectFromLoginState) {
    return <Navigate to={redirectFromLoginState.to} state={redirectFromLoginState.state} replace />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const facilityId = session.facilityId;
  const legacyRedirect = ensureFacilityUrl(facilityId, location.pathname, location.search);
  return <Navigate to={legacyRedirect} replace />;
}

type LoginRedirectIntent = { to: string; state?: unknown };

const resolveLoginRedirect = (location: Location): LoginRedirectIntent | null => {
  const state = location.state as { from?: string | Location } | null;
  const from = state?.from;
  if (!from) return null;
  if (typeof from === 'string') {
    return { to: from };
  }
  const path = from.pathname ?? '';
  if (!path) return null;
  return { to: `${path}${from.search ?? ''}${from.hash ?? ''}`, state: from.state };
};

const isLoginRoute = (pathname: string) => {
  if (pathname === '/login') return true;
  const match = parseFacilityPath(pathname);
  return match?.suffix === '/login';
};

function AppLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useSession();
  const { flags } = useAuthService();
  const resolvedRunId = flags.runId || session.runId;
  const [toasts, setToasts] = useState<AppToast[]>([]);
  const toastTimers = useRef<Map<string, number>>(new Map());
  const runIdNoticeRef = useRef<string | undefined>(resolvedRunId);

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

  useEffect(() => {
    if (!resolvedRunId || runIdNoticeRef.current === resolvedRunId) return;
    runIdNoticeRef.current = resolvedRunId;
    enqueueToast({ tone: 'info', message: 'RUN_ID が更新されました', detail: resolvedRunId, id: `runid-${resolvedRunId}` });
  }, [enqueueToast, resolvedRunId]);

  const navItems = useMemo(
    () =>
      NAV_LINKS.map((link) => {
        const allowed = !link.roles
          ? true
          : link.roles.includes('system_admin')
            ? isSystemAdminRole(session.role)
            : link.roles.includes(session.role);
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
      await copyRunIdToClipboard(runId);
      enqueueToast({ tone: 'success', message: 'RUN_ID をコピーしました', detail: runId });
    } catch {
      enqueueToast({ tone: 'error', message: 'RUN_ID のコピーに失敗しました', detail: 'クリップボード権限を確認してください。' });
    }
  };

  const handleSwitchAccount = () => {
    const switchContext = buildSwitchContext(session, 'manual');
    logAuditEvent({
      runId: resolvedRunId,
      source: 'auth',
      note: 'switch initiated',
      payload: {
        action: 'role-switch',
        screen: 'navigation',
        reason: switchContext.reason,
        previous: switchContext.actor,
      },
    });
    onLogout();
    navigate('/login', { state: { from: location, switchContext }, replace: true });
  };

  return (
    <AppToastProvider value={{ enqueue: enqueueToast, dismiss: dismissToast }}>
      <ChartEventStreamBridge />
      <div className="app-shell">
        <header className="app-shell__topbar" role="status" aria-live={resolveAriaLive('info')} data-run-id={resolvedRunId}>
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
              data-run-id={resolvedRunId}
            >
              RUN_ID: {resolvedRunId}
              <span className="app-shell__pill-note">クリックでコピー</span>
            </button>
            <button type="button" className="app-shell__logout" onClick={handleSwitchAccount}>
              施設/ユーザー切替
            </button>
            <button type="button" className="app-shell__logout" onClick={onLogout}>
              ログアウト
            </button>
          </div>
        </header>

        <nav className="app-shell__nav" aria-label="画面ナビゲーション" role="status" aria-live={resolveAriaLive('info')} data-run-id={resolvedRunId}>
          {navItems}
          <RunIdNavBadge runId={resolvedRunId} onCopy={handleCopyRunId} />
        </nav>

        <div className="app-shell__body">
          <Outlet />
        </div>

        <aside className="app-shell__notice-stack" aria-live={resolveAriaLive('info')} data-run-id={resolvedRunId}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`app-shell__notice app-shell__notice--${toast.tone}`}
              role="status"
              aria-live={resolveAriaLive(toast.tone)}
              aria-atomic="true"
              data-run-id={resolvedRunId}
            >
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
      title="Reception 受付一覧と例外対応"
      description="当日の来院状況を一覧で俯瞰し、カルテを開く対象と例外対応を見分けます。選択した患者は右ペインで確認し、必要なら Charts を新規タブで開きます。"
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
