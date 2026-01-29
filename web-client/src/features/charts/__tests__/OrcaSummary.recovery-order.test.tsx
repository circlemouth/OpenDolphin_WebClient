import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { OrcaSummary } from '../OrcaSummary';
import { AppToastProvider } from '../../../libs/ui/appToast';

vi.mock('@emotion/react', () => ({
  Global: () => null,
  css: () => '',
}));

vi.mock('../authService', () => ({
  useAuthService: () => ({
    flags: {
      runId: 'RUN-ORCA',
      missingMaster: true,
      cacheHit: false,
      dataSourceTransition: 'server',
      fallbackUsed: false,
    },
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: undefined,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../AppRouter', () => ({
  useOptionalSession: () => ({ facilityId: 'FAC-TEST', userId: 'user01' }),
}));

vi.mock('../../../libs/telemetry/telemetryClient', () => ({
  recordOutpatientFunnel: () => undefined,
}));

vi.mock('../../../libs/audit/auditLogger', () => ({
  logAuditEvent: () => ({ timestamp: new Date().toISOString() }),
  logUiState: () => ({ timestamp: new Date().toISOString() }),
}));

vi.mock('../../../libs/ui/appToast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../libs/ui/appToast')>();
  return {
    ...actual,
    useAppToast: () => ({ enqueue: vi.fn(), dismiss: vi.fn() }),
  };
});

describe('OrcaSummary recovery order', () => {
  it('renders banner -> recovery guide -> details in order', () => {
    const { container } = render(
      <AppToastProvider value={{ enqueue: vi.fn(), dismiss: vi.fn() }}>
        <OrcaSummary summary={{ missingMaster: true } as any} />
      </AppToastProvider>,
    );

    const banner = container.querySelector('.tone-banner');
    const recovery = container.querySelector('.missing-master-recovery');
    const details = container.querySelector('.orca-summary__details');

    expect(banner).toBeTruthy();
    expect(recovery).toBeTruthy();
    expect(details).toBeTruthy();

    expect(banner?.compareDocumentPosition(recovery!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(recovery?.compareDocumentPosition(details!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
