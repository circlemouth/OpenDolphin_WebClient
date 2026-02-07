import { useEffect, useState } from 'react';

import { MOCK_RUNTIME_EVENT, readMockRuntimeState } from '../../libs/devtools/mockGate';
import { resolveAriaLive } from '../../libs/observability/observability';

const formatReasons = (reasons: string[]) => reasons.join(' / ');

export function MockModeBanner() {
  const [runtime, setRuntime] = useState(() => readMockRuntimeState());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => setRuntime(readMockRuntimeState());
    window.addEventListener(MOCK_RUNTIME_EVENT, handler);
    return () => window.removeEventListener(MOCK_RUNTIME_EVENT, handler);
  }, []);

  if (!runtime?.decision.allowed) return null;

  const started = runtime.mswStarted;
  const message = started ? 'MSW ON: モック/fixture が有効です（実運用禁止）' : 'MSW gate は ON だが起動に失敗しました';
  const detail = started
    ? 'DEV + VITE_ENABLE_MSW=1 + ?msw=1'
    : runtime.mswStartError
      ? `error=${runtime.mswStartError}`
      : `reasons=${formatReasons(runtime.decision.reasons)}`;

  return (
    <div
      className="app-shell__mock-banner status-message is-error"
      role="status"
      aria-live={resolveAriaLive('warning')}
      data-test-id="mock-mode-banner"
      data-mock-mode={started ? 'msw' : 'gate'}
    >
      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{message}</strong>
      <span style={{ display: 'block', opacity: 0.9 }}>{detail}</span>
    </div>
  );
}
