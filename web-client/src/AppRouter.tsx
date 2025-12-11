import { useMemo, useState, createContext, useContext, useCallback } from 'react';
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
import { generateRunId } from './libs/runId';
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

export function AppRouter() {
  const [session, setSession] = useState<Session | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleLoginSuccess = (result: LoginResult) => {
    setSession({ ...result, runId: generateRunId() });
  };

  const handleLogout = () => setSession(null);

  const handleCopyRunId = useCallback(async () => {
    if (!session?.runId) return;
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('クリップボード API が利用できません。');
      }
      await navigator.clipboard.writeText(session.runId);
      setCopyStatus('copied');
    } catch (error) {
      console.warn('RUN_ID のコピーに失敗しました。', error);
      setCopyStatus('failed');
    } finally {
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [session?.runId]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            session ? <Navigate to="/reception" replace /> : <LoginScreen onLoginSuccess={handleLoginSuccess} />
          }
        />
        <Route
          element={
            <Protected
              session={session}
              onLogout={handleLogout}
              onCopyRunId={handleCopyRunId}
              copyStatus={copyStatus}
            />
          }
        >
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

function Protected({
  session,
  onLogout,
  onCopyRunId,
  copyStatus,
}: {
  session: Session | null;
  onLogout: () => void;
  onCopyRunId: () => void;
  copyStatus: 'idle' | 'copied' | 'failed';
}) {
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <SessionContext.Provider value={session}>
      <AppLayout onLogout={onLogout} onCopyRunId={onCopyRunId} copyStatus={copyStatus} />
    </SessionContext.Provider>
  );
}

function AppLayout({
  onLogout,
  onCopyRunId,
  copyStatus,
}: {
  onLogout: () => void;
  onCopyRunId: () => void;
  copyStatus: 'idle' | 'copied' | 'failed';
}) {
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
          <button
            type="button"
            className="app-shell__pill app-shell__pill--copy"
            onClick={onCopyRunId}
            title="RUN_ID をコピー"
          >
            RUN_ID: {session.runId}
          </button>
          <span className="app-shell__pill-note" role="status" aria-live="polite">
            {copyStatus === 'copied'
              ? 'RUN_ID をコピーしました。'
              : copyStatus === 'failed'
                ? 'RUN_ID のコピーに失敗しました。'
                : ''}
          </span>
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
