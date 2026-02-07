import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReceptionPage } from '../pages/ReceptionPage';

const baseClaimData = {
  runId: 'RUN-CLAIM',
  missingMaster: false,
  cacheHit: false,
  fallbackUsed: false,
  dataSourceTransition: 'server',
  fetchedAt: '2026-01-29T00:00:00Z',
  bundles: [],
  queueEntries: [],
};

const baseAppointmentData = {
  runId: 'RUN-APPOINT',
  missingMaster: false,
  cacheHit: false,
  fallbackUsed: false,
  dataSourceTransition: 'server',
  fetchedAt: '2026-01-29T00:00:00Z',
  entries: [],
  recordsReturned: 0,
};

let mockClaimData = { ...baseClaimData };
let mockAppointmentData = { ...baseAppointmentData };
let mockMutationResult: any = null;
let mockMutationPending = false;
let mockClaimSendCache: Record<string, { invoiceNumber?: string; dataId?: string; sendStatus?: 'success' | 'error' }> =
  {};

const mockAuthFlags = {
  runId: 'RUN-AUTH',
  missingMaster: false,
  cacheHit: false,
  dataSourceTransition: 'server' as const,
  fallbackUsed: false,
};

const mockAuthActions = {
  setCacheHit: vi.fn(),
  setMissingMaster: vi.fn(),
  setDataSourceTransition: vi.fn(),
  setFallbackUsed: vi.fn(),
  bumpRunId: vi.fn(),
};

vi.mock('@emotion/react', () => ({
  Global: () => null,
  css: () => '',
}));

vi.mock('../../charts/authService', () => ({
  applyAuthServicePatch: (patch: any, previous: any) => ({ ...previous, ...patch }),
  useAuthService: () => ({
    flags: mockAuthFlags,
    ...mockAuthActions,
  }),
}));

vi.mock('../../shared/AdminBroadcastBanner', () => ({
  AdminBroadcastBanner: () => <div data-testid="admin-broadcast" />,
}));

vi.mock('../components/OrderConsole', () => ({
  OrderConsole: () => (
    <section role="region" aria-label="オーダー概要" data-testid="order-console">
      <div>請求状態</div>
      <div>会計待ち</div>
      <div>合計金額/診療時間</div>
      <div>送信キャッシュ</div>
      <div>ORCAキュー</div>
      <button type="button">Charts 新規タブ</button>
    </section>
  ),
}));

vi.mock('../components/ReceptionAuditPanel', () => ({
  ReceptionAuditPanel: () => <div data-testid="reception-audit" />,
}));

vi.mock('../components/ReceptionExceptionList', () => ({
  ReceptionExceptionList: () => <div data-testid="reception-exceptions" />,
}));

vi.mock('../../shared/autoRefreshNotice', () => ({
  OUTPATIENT_AUTO_REFRESH_INTERVAL_MS: 90_000,
  resolveAutoRefreshIntervalMs: (value: number) => value,
  useAutoRefreshNotice: () => null,
}));

vi.mock('../../../libs/admin/useAdminBroadcast', () => ({
  useAdminBroadcast: () => ({ broadcast: null }),
}));

vi.mock('../../../libs/ui/appToast', () => ({
  useAppToast: () => ({ enqueue: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock('../../../AppRouter', () => ({
  useSession: () => ({ facilityId: 'FAC-TEST', userId: 'user01' }),
}));

vi.mock('../../../libs/audit/auditLogger', () => ({
  getAuditEventLog: () => [],
  logAuditEvent: () => ({ timestamp: new Date().toISOString() }),
  logUiState: () => ({ timestamp: new Date().toISOString() }),
}));

vi.mock('../../outpatient/savedViews', () => ({
  loadOutpatientSavedViews: () => [],
  removeOutpatientSavedView: () => [],
  upsertOutpatientSavedView: () => [],
  resolvePaymentMode: (insurance?: string) => {
    if (!insurance) return undefined;
    const normalized = insurance.toLowerCase();
    if (normalized.includes('自費') || normalized.includes('self')) return 'self';
    return 'insurance';
  },
}));

vi.mock('../../charts/orcaClaimSendCache', () => ({
  loadOrcaClaimSendCache: () => mockClaimSendCache,
}));

vi.mock('../exceptionLogic', () => ({
  buildExceptionAuditDetails: () => ({}),
  buildQueuePhaseSummary: () => ({
    shouldWarn: false,
    summary: 'ok',
  }),
  resolveExceptionDecision: () => ({
    kind: undefined,
    detail: '',
    nextAction: '—',
    reasons: {},
  }),
}));

vi.mock('../../outpatient/orcaQueueStatus', () => ({
  ORCA_QUEUE_STALL_THRESHOLD_MS: 120_000,
  resolveOrcaSendStatus: () => ({
    key: 'waiting',
    label: '待ち',
    tone: 'warning',
    isStalled: false,
  }),
}));

vi.mock('../../outpatient/appointmentDataBanner', () => ({
  getAppointmentDataBanner: () => null,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey: unknown[] }) => {
    const key = options.queryKey[0];
    if (key === 'outpatient-claim-flags') {
      return {
        data: mockClaimData,
        dataUpdatedAt: 0,
        isError: false,
        error: null,
        isFetching: false,
        isLoading: false,
        refetch: vi.fn(),
      };
    }
    if (key === 'outpatient-appointments') {
      return {
        data: mockAppointmentData,
        dataUpdatedAt: 0,
        isError: false,
        error: null,
        isFetching: false,
        isLoading: false,
        refetch: vi.fn(),
      };
    }
    return {
      data: undefined,
      dataUpdatedAt: 0,
      isError: false,
      error: null,
      isFetching: false,
      isLoading: false,
      refetch: vi.fn(),
    };
  },
  useMutation: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(async () => mockMutationResult ?? {}),
    isPending: mockMutationPending,
  }),
  useQueryClient: () => ({
    getQueryState: () => ({ dataUpdatedAt: 0, fetchFailureCount: 0 }),
    setQueryData: vi.fn((_: unknown, updater: any) => {
      if (typeof updater === 'function') {
        const next = updater(mockAppointmentData);
        if (next) mockAppointmentData = next;
        return next;
      }
      mockAppointmentData = updater;
      return updater;
    }),
  }),
}));

vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

const renderReceptionPage = () => {
  render(
    <MemoryRouter initialEntries={['/reception']}>
      <ReceptionPage runId="RUN-INIT" />
    </MemoryRouter>,
  );
  screen.getByRole('heading', { name: '受付中' });
};

beforeEach(() => {
  mockClaimData = { ...baseClaimData };
  mockAppointmentData = { ...baseAppointmentData };
  mockMutationResult = null;
  mockMutationPending = false;
  mockClaimSendCache = {};
});

afterEach(() => {
  cleanup();
});

describe('ReceptionPage accept form safety', () => {
  it('auto-fills patientId/receptionId/payment mode on selection', async () => {
    mockAppointmentData.entries = [
      {
        id: 'row-1',
        patientId: 'P-001',
        receptionId: 'R-001',
        name: '山田太郎',
        appointmentTime: '09:00',
        department: '内科',
        status: '受付中',
        insurance: '保険',
        source: 'visits',
      },
      {
        id: 'row-2',
        patientId: 'P-002',
        receptionId: 'R-002',
        name: '佐藤花子',
        appointmentTime: '10:00',
        department: '内科',
        status: '受付中',
        insurance: '自費',
        source: 'visits',
      },
    ];

    const user = userEvent.setup();
    renderReceptionPage();

    const acceptSection = screen.getByRole('region', { name: '当日受付登録/取消' });
    const form = within(acceptSection);
    const patientInput = form.getByLabelText(/患者ID/);
    const receptionInput = form.getByLabelText(/受付ID/);
    const paymentSelect = form.getByLabelText(/保険\/自費/);

    await waitFor(() => {
      expect(patientInput).toHaveValue('P-001');
      expect(receptionInput).toHaveValue('R-001');
      expect(paymentSelect).toHaveValue('insurance');
    });

    const card2 = screen.getByRole('button', { name: /佐藤花子/ });
    await user.click(card2);

    expect(patientInput).toHaveValue('P-002');
    expect(receptionInput).toHaveValue('R-002');
    expect(paymentSelect).toHaveValue('self');
  });

  it('does not overwrite manual input when auto-fill signature changes', async () => {
    mockAppointmentData.entries = [
      {
        id: 'row-1',
        patientId: 'P-010',
        receptionId: 'R-010',
        name: '田中一郎',
        appointmentTime: '09:00',
        department: '内科',
        status: '受付中',
        insurance: '保険',
        source: 'visits',
      },
      {
        id: 'row-2',
        patientId: 'P-020',
        receptionId: 'R-020',
        name: '田中二郎',
        appointmentTime: '10:00',
        department: '内科',
        status: '受付中',
        insurance: '自費',
        source: 'visits',
      },
    ];

    const user = userEvent.setup();
    renderReceptionPage();

    const acceptSection = screen.getByRole('region', { name: '当日受付登録/取消' });
    const form = within(acceptSection);
    const patientInput = form.getByLabelText(/患者ID/);
    const receptionInput = form.getByLabelText(/受付ID/);
    const paymentSelect = form.getByLabelText(/保険\/自費/);

    await waitFor(() => {
      expect(patientInput).toHaveValue('P-010');
    });
    await user.clear(patientInput);
    await user.type(patientInput, 'MANUAL-999');

    const card2 = screen.getByRole('button', { name: /田中二郎/ });
    await user.click(card2);

    expect(patientInput).toHaveValue('MANUAL-999');
    expect(receptionInput).toHaveValue('R-020');
    expect(paymentSelect).toHaveValue('self');
  });

  it('requires receptionId when cancel operation is selected', async () => {
    mockAppointmentData.entries = [
      {
        id: 'row-1',
        patientId: 'P-100',
        receptionId: 'R-100',
        name: '取消患者',
        appointmentTime: '09:00',
        department: '内科',
        status: '受付中',
        insurance: '保険',
        source: 'visits',
      },
    ];

    const user = userEvent.setup();
    renderReceptionPage();

    const acceptSection = screen.getByRole('region', { name: '当日受付登録/取消' });
    const form = within(acceptSection);
    const receptionInput = form.getByLabelText(/受付ID/);

    expect(receptionInput).not.toBeRequired();
    expect(receptionInput).toHaveAttribute('aria-required', 'false');

    const cancelRadio = form.getByLabelText(/受付取消/);
    await user.click(cancelRadio);

    expect(receptionInput).toBeRequired();
    expect(receptionInput).toHaveAttribute('aria-required', 'true');
  });

  it('shows Api_Result and duration in the result area after submit', async () => {
    mockAppointmentData.entries = [
      {
        id: 'row-1',
        patientId: 'P-555',
        receptionId: 'R-555',
        name: '送信患者',
        appointmentTime: '09:00',
        department: '内科',
        status: '受付中',
        insurance: '保険',
        source: 'visits',
      },
    ];
    mockMutationResult = {
      runId: 'RUN-VISIT',
      traceId: 'TRACE-VISIT',
      apiResult: '00',
      apiResultMessage: 'OK',
      requestNumber: '01',
      acceptanceId: 'R-555',
      acceptanceDate: '2026-01-29',
      acceptanceTime: '09:10:00',
      patient: {
        patientId: 'P-555',
        name: '送信患者',
      },
    };

    const user = userEvent.setup();
    renderReceptionPage();

    const acceptSection = screen.getByRole('region', { name: '当日受付登録/取消' });
    const form = within(acceptSection);
    const visitKindSelect = form.getByLabelText(/来院区分/);
    await user.selectOptions(visitKindSelect, '1');

    const submitButton = form.getByRole('button', { name: '受付送信' });
    await user.click(submitButton);

    const resultHeading = await screen.findByRole('heading', { name: '送信結果' });
    const resultArea = resultHeading.closest('[role="status"]') ?? resultHeading.parentElement ?? resultHeading;
    const resultScope = within(resultArea);

    expect(resultScope.getByText('Api_Result: 00')).toBeInTheDocument();
    const durationText = resultScope.getByText(/所要時間:/);
    expect(durationText.textContent).toMatch(/所要時間: \d+ ms/);
  });
});

describe('ReceptionPage section collapse defaults', () => {
  it('keeps 会計済み section collapsed by default', () => {
    renderReceptionPage();

    const completedHeading = screen.getByRole('heading', { name: '会計済み' });
    const section = completedHeading.closest('section');
    expect(section).not.toBeNull();
    const toggleButton = within(section as HTMLElement).getByRole('button', { name: '開く' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(within(section as HTMLElement).queryByRole('list', { name: /会計済みの患者一覧/ })).toBeNull();
  });
});

describe('ReceptionPage list and side pane guidance', () => {
  it('highlights selected row and shows double-click/Enter guidance', async () => {
    mockAppointmentData.entries = [
      {
        id: 'row-1',
        patientId: 'P-001',
        receptionId: 'R-001',
        name: '山田太郎',
        appointmentTime: '09:00',
        department: '内科',
        status: '受付中',
        insurance: '保険',
        source: 'visits',
      },
      {
        id: 'row-2',
        patientId: 'P-002',
        receptionId: 'R-002',
        name: '佐藤花子',
        appointmentTime: '10:00',
        department: '外科',
        status: '診療中',
        insurance: '自費',
        source: 'visits',
      },
    ];

    const user = userEvent.setup();
    renderReceptionPage();

    const guidance = screen.getByText(/行クリックで右ペイン更新/);
    expect(guidance).toBeInTheDocument();

    const card1 = screen.getByRole('button', { name: /山田太郎/ });
    const card2 = screen.getByRole('button', { name: /佐藤花子/ });

    expect(card1).toHaveClass('is-selected');
    expect(card2).not.toHaveClass('is-selected');

    await user.click(card2);

    expect(card1).not.toHaveClass('is-selected');
    expect(card2).toHaveClass('is-selected');
  });

  it('shows patient search, accept form, and history pane in the right column (debug panels hidden by default)', async () => {
    mockAppointmentData.entries = [
      {
        id: 'row-3',
        patientId: 'P-010',
        receptionId: 'R-010',
        appointmentId: 'A-010',
        name: '集約患者',
        kana: 'シュウヤク',
        appointmentTime: '11:30',
        department: '内科',
        physician: 'Dr. Test',
        status: '会計待ち',
        insurance: '保険',
        source: 'visits',
      },
    ];
    const user = userEvent.setup();
    renderReceptionPage();

    expect(screen.getByRole('region', { name: '患者検索' })).toBeInTheDocument();

    const acceptSection = screen.getByRole('region', { name: '当日受付登録/取消' });
    await waitFor(() => {
      expect(within(acceptSection).getByLabelText(/患者ID/)).toHaveValue('P-010');
    });

    const historySection = screen.getByRole('region', { name: '過去カルテ' });
    const historyScope = within(historySection);
    expect(historyScope.getByText(/対象: 集約患者（P-010）/)).toBeInTheDocument();
    expect(historyScope.getByText('過去カルテがありません。')).toBeInTheDocument();

    // Selecting the card keeps the right panes in sync.
    const card = screen.getByRole('button', { name: /集約患者/ });
    await user.click(card);
    expect(historyScope.getByText(/対象: 集約患者（P-010）/)).toBeInTheDocument();

    // Debug panels should not be visible by default.
    expect(screen.queryByTestId('order-console')).toBeNull();
    expect(screen.queryByTestId('reception-audit')).toBeNull();
  });
});
