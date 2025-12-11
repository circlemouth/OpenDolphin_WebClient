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
import { AuthServiceProvider, useAuthService } from './features/charts/authService';
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
  { to: '/reception', label: '受付 / トーン連携', role: 'RECEPTION' },
  { to: '/charts', label: 'カルテ / Charts', role: 'CHARTS' },
  { to: '/outpatient-mock', label: 'Outpatient Mock', role: 'OUTPATIENT' },
];

export function AppRouter() {
  const [session, setSession] = useState<Session | null>(null);

  const handleLoginSuccess = (result: LoginResult) => {
    setSession({ ...result, runId: generateRunId(), roles: result.roles ?? ['RECEPTION', 'CHARTS', 'OUTPATIENT'] });
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
      <AuthServiceProvider initialFlags={{ runId: session.runId }} runId={session.runId}>
        <AppLayout onLogout={onLogout} />
      </AuthServiceProvider>
    </SessionContext.Provider>
  );
}

function AppLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const session = useSession();
  const { flags } = useAuthService();
  const [notices, setNotices] = useState<string[]>([]);

  const handleCopyRunId = async () => {
    try {
      await navigator.clipboard.writeText(flags.runId);
      setNotices((prev) => [`RUN_ID をコピーしました: ${flags.runId}`, ...prev].slice(0, 3));
    } catch (error) {
      setNotices((prev) => [`RUN_ID コピーに失敗しました`, ...prev].slice(0, 3));
      console.error('[AppShell] copy runId failed', error);
    }
  };

  const navItems = useMemo(
    () =>
      NAV_LINKS.filter((link) => !session.roles || session.roles.includes(link.role)).map((link) => (
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
    [location.pathname, session.roles],
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
          <button type="button" className="app-shell__pill app-shell__pill--copy" onClick={handleCopyRunId} title="RUN_ID をコピー">
            RUN_ID: {flags.runId}（クリックでコピー）
          </button>
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
      <div className="app-shell__notice-stack" role="status" aria-live="polite">
        {notices.map((notice, index) => (
          <div key={`${notice}-${index}`} className="app-shell__notice">
            {notice}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectedReception() {
  const session = useSession();
  const { flags, setMissingMaster, setCacheHit, setDataSourceTransition, bumpRunId } = useAuthService();

  return (
    <ReceptionPage
      runId={flags.runId}
      patientId={`PX-${session.facilityId}-${session.userId}`}
      receptionId={`R-${session.facilityId}-${session.userId}`}
      destination="ORCA queue"
      title="Reception → Charts トーン連携"
      description="ログインした RUN_ID を受け継ぎ、Reception の missingMaster/cacheHit/dataSourceTransition をそのまま Charts 側へ渡すデモです。"
      flags={flags}
      onToggleMissingMaster={() => setMissingMaster(!flags.missingMaster)}
      onToggleCacheHit={() => setCacheHit(!flags.cacheHit)}
      onMasterSourceChange={setDataSourceTransition}
      onRunIdChange={(next) => bumpRunId(next || flags.runId)}
    />
  );
}

function ConnectedCharts() {
  const session = useSession();
  return <ChartsPage />;
}
