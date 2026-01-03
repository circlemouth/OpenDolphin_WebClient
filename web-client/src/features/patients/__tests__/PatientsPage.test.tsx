import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { clearAuditEventLog, logAuditEvent } from '../../../libs/audit/auditLogger';

type MockQueryData = {
  patients: Array<Record<string, any>>;
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  dataSourceTransition?: string;
  recordsReturned?: number;
  status?: number;
  error?: string;
  fetchedAt?: string;
  sourcePath?: string;
  auditEvent?: Record<string, unknown>;
};

let mockQueryData: MockQueryData = {
  patients: [],
  runId: 'RUN-PATIENTS',
  cacheHit: false,
  missingMaster: false,
  fallbackUsed: false,
  dataSourceTransition: 'server',
  recordsReturned: 0,
};

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

vi.mock('../../charts/authService', () => ({
  applyAuthServicePatch: (patch: any, previous: any) => ({ ...previous, ...patch }),
  useAuthService: () => ({
    flags: mockAuthFlags,
    ...mockAuthActions,
  }),
}));

vi.mock('@emotion/react', () => ({
  Global: () => null,
  css: () => '',
}));

vi.mock('../../../libs/audit/auditLogger', () => {
  const auditLog: any[] = [];
  return {
    clearAuditEventLog: () => {
      auditLog.length = 0;
    },
    getAuditEventLog: () => [...auditLog],
    logAuditEvent: (entry: any) => {
      const record = { ...entry, timestamp: new Date().toISOString() };
      auditLog.push(record);
      return record;
    },
    logUiState: () => ({ timestamp: new Date().toISOString() }),
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: mockQueryData,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }: { children: any }) => children,
  useLocation: () => ({ search: '' }),
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('../../../libs/admin/useAdminBroadcast', () => ({
  useAdminBroadcast: () => ({ broadcast: null }),
}));

vi.mock('../../../libs/ui/appToast', () => ({
  useAppToast: () => ({ enqueue: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock('../../../AppRouter', () => ({
  useSession: () => ({ facilityId: 'FAC-TEST', runId: 'RUN-SESSION' }),
}));

type PatientsPageType = typeof import('../PatientsPage').PatientsPage;
let PatientsPage: PatientsPageType;

beforeAll(async () => {
  ({ PatientsPage } = await import('../PatientsPage'));
});

afterAll(() => {
  PatientsPage = undefined as unknown as PatientsPageType;
});

afterEach(() => {
  cleanup();
});

const renderPatientsPage = () => {
  render(
    <MemoryRouter initialEntries={['/patients']}>
      <PatientsPage runId="RUN-INIT" />
    </MemoryRouter>,
  );
  screen.getByRole('list', { name: '患者一覧' });
};

const addAuditEvent = (timestamp: string, entry: Parameters<typeof logAuditEvent>[0]) => {
  const record = logAuditEvent(entry);
  record.timestamp = timestamp;
  return record;
};

const mockPatients = (overrides?: Partial<MockQueryData>) => {
  mockQueryData = {
    patients: [
      {
        patientId: 'P-001',
        name: '山田 花子',
        kana: 'ヤマダ ハナコ',
        birthDate: '1980-01-01',
      },
    ],
    runId: 'RUN-PATIENTS',
    cacheHit: false,
    missingMaster: false,
    fallbackUsed: false,
    dataSourceTransition: 'server',
    recordsReturned: 1,
    ...overrides,
  };
};

describe('PatientsPage audit filters', () => {
  beforeEach(() => {
    clearAuditEventLog();
    localStorage.clear();
    sessionStorage.clear();
    mockAuthFlags.missingMaster = false;
    mockAuthFlags.fallbackUsed = false;
  });

  afterEach(() => {
    clearAuditEventLog();
  });

  it('keyword/outcome は全角混在と大文字小文字を正規化して一致する', async () => {
    mockPatients();
    addAuditEvent('2025-12-01T10:00:00.000Z', {
      source: 'patient-save',
      patientId: 'P-001',
      payload: {
        action: 'PATIENT_UPDATE',
        outcome: 'SUCCESS',
        details: { patientId: 'P-001', message: 'updated', requestId: 'REQ-1' },
      },
    });
    addAuditEvent('2025-12-02T10:00:00.000Z', {
      source: 'patient-save',
      patientId: 'P-001',
      payload: {
        action: 'PATIENT_DELETE',
        outcome: 'ERROR',
        details: { patientId: 'P-001', message: 'deleted', requestId: 'REQ-2' },
      },
    });

    renderPatientsPage();
    expect(screen.getByText('対象件数: 2')).toBeInTheDocument();
    const user = userEvent.setup();

    const auditGroup = screen.getByRole('group', { name: '監査検索' });
    const keywordInput = within(auditGroup).getByLabelText('キーワード');
    await user.type(keywordInput, 'Ｐ－００１');
    const outcomeSelect = within(auditGroup).getByLabelText('outcome');
    await user.selectOptions(outcomeSelect, 'success');

    expect(screen.getByText('対象件数: 1')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: '保存履歴' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });

  it('date/limit フィルタと無効範囲エラーを反映する', async () => {
    mockPatients();
    const base = new Date('2025-12-01T00:00:00Z');
    for (let i = 0; i < 12; i += 1) {
      addAuditEvent(new Date(base.getTime() + i * 24 * 60 * 60 * 1000).toISOString(), {
        source: 'patient-save',
        patientId: 'P-001',
        payload: {
          action: 'PATIENT_UPDATE',
          outcome: 'SUCCESS',
          details: { patientId: 'P-001', message: `log-${i}` },
        },
      });
    }

    renderPatientsPage();
    const user = userEvent.setup();

    const list = screen.getByRole('list', { name: '保存履歴' });
    expect(await screen.findByText('対象件数: 12')).toBeInTheDocument();
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);

    const auditGroup = screen.getByRole('group', { name: '監査検索' });
    const dateFrom = within(auditGroup).getByLabelText('開始日');
    const dateTo = within(auditGroup).getByLabelText('終了日');
    await user.clear(dateFrom);
    await user.type(dateFrom, '2025-12-03');
    await user.clear(dateTo);
    await user.type(dateTo, '2025-12-03');

    expect(screen.getByText('対象件数: 1')).toBeInTheDocument();

    await user.clear(dateFrom);
    await user.type(dateFrom, '2025-12-10');
    await user.clear(dateTo);
    await user.type(dateTo, '2025-12-05');

    expect(screen.getByText('開始日 (2025-12-10) が終了日 (2025-12-05) より後です。')).toBeInTheDocument();
  });
});

describe('PatientsPage unlinked warnings', () => {
  beforeEach(() => {
    clearAuditEventLog();
    localStorage.clear();
    sessionStorage.clear();
    mockAuthFlags.missingMaster = false;
    mockAuthFlags.fallbackUsed = false;
  });

  afterEach(() => {
    clearAuditEventLog();
  });

  it('未紐付警告を一覧と詳細で表示する', async () => {
    mockAuthFlags.missingMaster = false;
    mockAuthFlags.fallbackUsed = false;
    mockPatients({
      patients: [
        { patientId: '', name: '', kana: '', birthDate: '1990-01-01' },
        { patientId: 'P-002', name: '鈴木 太郎', kana: 'スズキ タロウ' },
      ],
      recordsReturned: 2,
    });

    renderPatientsPage();
    await screen.findAllByText('患者ID欠損');

    await screen.findAllByText('未紐付警告');
    expect(screen.getAllByText('未紐付').length).toBeGreaterThan(0);
    expect(screen.getAllByText('患者ID欠損').length).toBeGreaterThan(0);
    expect(screen.getAllByText('氏名欠損').length).toBeGreaterThan(0);
  });

  it('missingMaster 時は反映停止注意として表示する', async () => {
    mockAuthFlags.missingMaster = true;
    mockAuthFlags.fallbackUsed = false;
    mockPatients({
      patients: [{ patientId: '', name: '', kana: '', birthDate: '1990-01-01' }],
      missingMaster: true,
      recordsReturned: 1,
    });

    renderPatientsPage();
    await screen.findAllByText('患者ID欠損');

    await screen.findAllByText('反映停止注意');
    expect(screen.getAllByText('反映停止').length).toBeGreaterThan(0);
  });
});

describe('PatientsPage audit changedKeys', () => {
  beforeEach(() => {
    clearAuditEventLog();
    localStorage.clear();
    sessionStorage.clear();
    mockAuthFlags.missingMaster = false;
    mockAuthFlags.fallbackUsed = false;
  });

  afterEach(() => {
    clearAuditEventLog();
  });

  it('changedKeys は上限5件で他n件表記', async () => {
    mockPatients();
    addAuditEvent('2025-12-01T10:00:00.000Z', {
      source: 'patient-save',
      patientId: 'P-001',
      payload: {
        action: 'PATIENT_UPDATE',
        outcome: 'SUCCESS',
        details: {
          patientId: 'P-001',
          changedKeys: ['name', 'kana', 'birthDate', 'sex', 'phone', 'zip', 'address'],
        },
      },
    });

    renderPatientsPage();
    await screen.findByText('対象件数: 1');

    expect(screen.getByText('changedKeys: name, kana, birthDate, sex, phone 他2件')).toBeInTheDocument();
  });
});
