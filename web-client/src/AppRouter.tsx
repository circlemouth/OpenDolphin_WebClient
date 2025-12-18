import { useEffect, useMemo, useState, createContext, useContext, type MouseEvent } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { LoginScreen, type LoginResult } from './LoginScreen';
import { ChartsPage } from './features/charts/pages/ChartsPage';
import { ChartsOutpatientPrintPage } from './features/charts/pages/ChartsOutpatientPrintPage';
import { ReceptionPage } from './features/reception/pages/ReceptionPage';
import { OutpatientMockPage } from './features/outpatient/OutpatientMockPage';
import './styles/app-shell.css';
import { updateObservabilityMeta } from './libs/observability/observability';
import { AuthServiceProvider } from './features/charts/authService';
import { PatientsPage } from './features/patients/PatientsPage';
import { AdministrationPage } from './features/administration/AdministrationPage';

type Session = LoginResult;
const AUTH_STORAGE_KEY = 'opendolphin:web-client:auth';

const loadStoredSession = (): Session | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
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

const SessionContext = createContext<Session | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionContext');
  }
  return context;
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

  const handleLogout = () => setSession(null);

  useEffect(() => {
    const stored = loadStoredSession();
    if (stored) {
      setSession(stored);
      updateObservabilityMeta({ runId: stored.runId });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            session ? <Navigate to="/reception" replace /> : <LoginScreen onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route element={<Protected session={session} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/reception" replace />} />
        <Route path="/reception" element={<ConnectedReception />} />
        <Route path="/charts" element={<ConnectedCharts />} />
        <Route path="/charts/print/outpatient" element={<ChartsOutpatientPrintPage />} />
        <Route path="/patients" element={<ConnectedPatients />} />
        <Route path="/administration" element={<ConnectedAdministration />} />
        <Route path="/outpatient-mock" element={<OutpatientMockPage />} />
      </Route>
        <Route path="*" element={<Navigate to={session ? '/reception' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function Protected({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
      >
        <AppLayout onLogout={onLogout} />
      </AuthServiceProvider>
    </SessionContext.Provider>
  );
}

function AppLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const session = useSession();

  const navItems = useMemo(
    () =>
      NAV_LINKS.map((link) => {
        const allowed = !link.roles || link.roles.includes(session.role);
        const className = ({ isActive }: { isActive: boolean }) =>
          `app-shell__nav-link${isActive || location.pathname.startsWith(link.to) ? ' is-active' : ''}${
            allowed ? '' : ' is-disabled'
          }`;
        const handleClick = (event: MouseEvent) => {
          if (!allowed) {
            event.preventDefault();
          }
        };
        return (
          <NavLink
            key={link.to}
            to={allowed ? link.to : '#'}
            className={className}
            aria-disabled={!allowed}
            tabIndex={allowed ? 0 : -1}
            onClick={handleClick}
          >
            {link.label}
          </NavLink>
        );
      }),
    [location.pathname, session.role],
  );

  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <div className="app-shell__brand">
          <span className="app-shell__title">OpenDolphin Web</span>
          <small className="app-shell__subtitle">電子カルテデモシェル</small>
        </div>
        <div className="app-shell__session">
          <span className="app-shell__pill">施設: {session.facilityId}</span>
          <span className="app-shell__pill">
            ユーザー: {session.displayName ?? session.commonName ?? session.userId}
          </span>
          <span className="app-shell__pill">role: {session.role}</span>
          <span className="app-shell__pill">RUN_ID: {session.runId}</span>
          <button type="button" className="app-shell__logout" onClick={onLogout}>
            ログアウト
          </button>
        </div>
      </header>

      <nav className="app-shell__nav" aria-label="画面ナビゲーション">
        {navItems}
      </nav>

      <div className="app-shell__body">
        <Outlet />
      </div>
    </div>
  );
}

function ConnectedReception() {
  const session = useSession();

  return (
    <ReceptionPage
      runId={session.runId}
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
  return <PatientsPage runId={session.runId} />;
}

function ConnectedAdministration() {
  const session = useSession();
  return <AdministrationPage runId={session.runId} role={session.role} />;
}
