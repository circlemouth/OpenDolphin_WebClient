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
import { PatientsPage } from './features/patients/PatientsPage';
import { AdministrationPage } from './features/administration/AdministrationPage';
import { ReceptionPage } from './features/reception/pages/ReceptionPage';
import { OutpatientMockPage } from './features/outpatient/OutpatientMockPage';
import './styles/app-shell.css';

type NavKey = 'reception' | 'charts' | 'patients' | 'administration' | 'outpatient-mock';

type NavBadgeTone = 'info' | 'warning';

type NavItemState = {
  key: NavKey;
  to: string;
  label: string;
  enabled: boolean;
  tooltip?: string;
  badge?: {
    tone: NavBadgeTone;
    label: string;
  };
};

type Session = LoginResult & {
  runId: string;
};

const SessionContext = createContext<Session | null>(null);
const NavAccessContext = createContext<NavItemState[] | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionContext');
  }
  return context;
}

function useNavAccess() {
  const context = useContext(NavAccessContext);
  if (!context) {
    throw new Error('useNavAccess must be used within NavAccessContext');
  }
  return context;
}

const deriveNavItems = (session: Session): NavItemState[] => {
  const userId = session.userId.toLowerCase();
  const isAdmin = /admin|sys/.test(userId);
  const isClinician = /doctor|dr|chart|med/.test(userId);

  return [
    {
      key: 'reception',
      to: '/reception',
      label: '受付 / トーン連携',
      enabled: true,
    },
    {
      key: 'charts',
      to: '/charts',
      label: 'カルテ / Charts',
      enabled: true,
    },
    {
      key: 'patients',
      to: '/patients',
      label: '患者 / Patients',
      enabled: isClinician || isAdmin,
      tooltip: '患者管理は医師または管理権限が必要です。',
      badge: isClinician || isAdmin ? undefined : { tone: 'warning', label: '要権限' },
    },
    {
      key: 'administration',
      to: '/administration',
      label: '管理 / Administration',
      enabled: isAdmin,
      tooltip: 'システム管理者のみが設定配信にアクセスできます。',
      badge: isAdmin ? undefined : { tone: 'warning', label: '管理者' },
    },
    {
      key: 'outpatient-mock',
      to: '/outpatient-mock',
      label: 'Outpatient Mock',
      enabled: true,
      tooltip: 'MSW/QA 用のサンドボックス。実運用導線では利用しません。',
      badge: { tone: 'warning', label: 'QA' },
    },
  ];
};

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
  const navItems = useMemo(() => deriveNavItems(session), [session]);

  return (
    <SessionContext.Provider value={session}>
      <NavAccessContext.Provider value={navItems}>
        <AppLayout onLogout={onLogout} />
      </NavAccessContext.Provider>
    </SessionContext.Provider>
  );
}

function AppLayout({ onLogout }: { onLogout: () => void }) {
  const session = useSession();
  const navItems = useNavAccess();

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
        {navItems.map((item) => {
          const baseClassName = `app-shell__nav-link${item.enabled ? '' : ' is-disabled'}${item.badge ? ' has-badge' : ''}`;
          const badge = item.badge ? (
            <span className={`app-shell__nav-badge app-shell__nav-badge--${item.badge.tone}`} aria-label={item.badge.label}>
              {item.badge.label}
            </span>
          ) : null;

          if (!item.enabled) {
            return (
              <span
                key={item.to}
                className={baseClassName}
                role="link"
                aria-disabled="true"
                tabIndex={0}
                title={item.tooltip}
              >
                <span className="app-shell__nav-label">{item.label}</span>
                {badge}
              </span>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${baseClassName}${isActive ? ' is-active' : ''}`}
              onClick={(event) => {
                if (!item.enabled) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              title={item.tooltip}
              aria-label={item.label}
            >
              <span className="app-shell__nav-label">{item.label}</span>
              {badge}
            </NavLink>
          );
        })}
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

function ConnectedPatients() {
  const session = useSession();
  const navItems = useNavAccess();
  const hasAccess = navItems.find((item) => item.key === 'patients')?.enabled;
  const fallback = navItems.find((item) => item.enabled)?.to ?? '/reception';

  if (!hasAccess) {
    return <AccessDenied featureLabel="患者管理" redirectTo={fallback} reason="患者管理への権限がありません。" />;
  }
  return <PatientsPage runId={session.runId} />;
}

function ConnectedAdministration() {
  const session = useSession();
  const navItems = useNavAccess();
  const hasAccess = navItems.find((item) => item.key === 'administration')?.enabled;
  const fallback = navItems.find((item) => item.enabled)?.to ?? '/reception';

  if (!hasAccess) {
    return <AccessDenied featureLabel="管理コンソール" redirectTo={fallback} reason="管理者権限が必要です。" />;
  }
  return <AdministrationPage runId={session.runId} />;
}

function AccessDenied({ featureLabel, redirectTo, reason }: { featureLabel: string; redirectTo: string; reason: string }) {
  return (
    <div className="access-denied" role="alert" aria-live="assertive">
      <p className="access-denied__title">「{featureLabel}」へのアクセスは許可されていません。</p>
      <p className="access-denied__reason">{reason}</p>
      <p className="access-denied__redirect">
        <NavLink to={redirectTo}>利用可能な画面に戻る</NavLink>
      </p>
    </div>
  );
}
