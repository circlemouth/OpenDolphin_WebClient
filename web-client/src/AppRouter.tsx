import { useMemo, useState, createContext, useContext } from 'react';
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
import { ReceptionPage } from './features/reception/pages/ReceptionPage';
import { OutpatientMockPage } from './features/outpatient/OutpatientMockPage';
import './styles/app-shell.css';

type Session = LoginResult & {
  runId: string;
};

const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionContext');
  }
  return context;
}

const NAV_LINKS = [
  { to: '/reception', label: '受付 / トーン連携' },
  { to: '/charts', label: 'カルテ / Charts' },
  { to: '/outpatient-mock', label: 'Outpatient Mock' },
];

const generateRunId = () => {
  const iso = new Date().toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  return iso.replace(/[-:]/g, '') + 'Z';
};

export function AppRouter() {
  const [session, setSession] = useState<Session | null>(null);

  const handleLoginSuccess = (result: LoginResult) => {
    setSession({ ...result, runId: generateRunId() });
  };

  const handleLogout = () => setSession(null);

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
      <AppLayout onLogout={onLogout} />
    </SessionContext.Provider>
  );
}

function AppLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const session = useSession();

  const navItems = useMemo(
    () =>
      NAV_LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `app-shell__nav-link${isActive || location.pathname.startsWith(link.to) ? ' is-active' : ''}`
          }
        >
          {link.label}
        </NavLink>
      )),
    [location.pathname],
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
  const session = useSession();
  return <ChartsPage runId={session.runId} />;
}
