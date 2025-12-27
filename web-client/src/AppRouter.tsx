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

type ToastTone = 'info' | 'success' | 'warning' | 'error';
type Toast = {
  id: string;
  message: string;
  detail?: string;
  tone: ToastTone;
};

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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<Map<string, number>>(new Map());

  const enqueueToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev.slice(-2), { id, ...toast }]);
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
            enqueueToast({
              tone: 'warning',
              message: 'アクセス権限がありません',
              detail: `必要ロール: ${link.roles?.join(', ') ?? '指定なし'} / 現在: ${session.role}`,
            });
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
            data-tooltip={
              allowed ? undefined : `権限がありません（必要ロール: ${link.roles?.join(', ') ?? '指定なし'}）`
            }
          >
            {link.label}
          </NavLink>
        );
      }),
    [enqueueToast, location.pathname, session.role],
  );

  const handleCopyRunId = async () => {
    const runId = session.runId;
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
    <div className="app-shell">
      <header className="app-shell__topbar" role="status" aria-live="polite" data-run-id={session.runId}>
        <div className="app-shell__brand">
          <span className="app-shell__title">OpenDolphin Web</span>
          <small className="app-shell__subtitle">電子カルテデモシェル</small>
        </div>
        <div className="app-shell__session" data-run-id={session.runId}>
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
            aria-label={`RUN_ID をコピー: ${session.runId}`}
          >
            RUN_ID: {session.runId}
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
