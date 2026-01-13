import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

import { OrderBundleEditPanel } from '../OrderBundleEditPanel';
import { fetchContraindicationCheckXml } from '../contraindicationCheckApi';
import { fetchOrderMasterSearch } from '../orderMasterSearchApi';

vi.mock('../orderBundleApi', async () => ({
  fetchOrderBundles: vi.fn().mockResolvedValue({
    ok: true,
    bundles: [],
    patientId: 'P-1',
  }),
  mutateOrderBundles: vi.fn().mockResolvedValue({ ok: true, runId: 'RUN-ORDER' }),
}));

vi.mock('../orderMasterSearchApi', async () => ({
  fetchOrderMasterSearch: vi.fn(),
}));

vi.mock('../contraindicationCheckApi', async () => ({
  buildContraindicationCheckRequestXml: vi.fn().mockReturnValue('<data />'),
  fetchContraindicationCheckXml: vi.fn(),
}));

vi.mock('../stampApi', async () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({ ok: true, id: 1, userId: 'facility:doctor' }),
  fetchStampTree: vi.fn().mockResolvedValue({
    ok: true,
    trees: [
      {
        treeName: '個人',
        entity: 'medOrder',
        stampList: [
          {
            name: '降圧セット',
            entity: 'medOrder',
            stampId: 'STAMP-1',
          },
        ],
      },
    ],
  }),
  fetchStampDetail: vi.fn(),
}));

const renderWithClient = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

const baseProps = {
  patientId: 'P-1',
  entity: 'medOrder',
  title: '処方編集',
  bundleLabel: 'RP名',
  itemQuantityLabel: '用量',
  meta: {
    runId: 'RUN-ORDER',
    cacheHit: false,
    missingMaster: false,
    fallbackUsed: false,
    dataSourceTransition: 'server' as const,
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('OrderBundleEditPanel contraindication warning', () => {
  it('禁忌チェック警告と症状情報を表示する', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    vi.mocked(fetchOrderMasterSearch).mockResolvedValue({
      ok: true,
      items: [
        {
          type: 'generic-class',
          code: 'A100',
          name: 'アムロジピン',
          unit: '錠',
        },
      ],
      totalCount: 1,
    });

    vi.mocked(fetchContraindicationCheckXml).mockResolvedValue({
      ok: true,
      status: 200,
      rawXml: '<data />',
      apiResult: 'E20',
      apiResultMessage: 'warning',
      results: [
        {
          medicationCode: 'A100',
          medicationName: 'アムロジピン',
          medicalResult: '0',
          medicalResultMessage: 'OK',
          warnings: [
            {
              contraCode: 'C001',
              contraName: 'ContraSample',
              contextClass: '1',
            },
          ],
        },
      ],
      symptomInfo: [{ code: 'S001', content: 'Headache' }],
      missingTags: [],
    } as any);

    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const keywordInput = screen.getByLabelText('キーワード', {
      selector: 'input[id$="-master-keyword"]',
    });
    fireEvent.change(keywordInput, { target: { value: 'アム' } });

    await waitFor(() => expect(screen.getByText('アムロジピン')).toBeInTheDocument());

    const rowButton = screen.getByText('アムロジピン').closest('button');
    expect(rowButton).not.toBeNull();
    fireEvent.click(rowButton!);

    fireEvent.change(screen.getByLabelText('用法'), { target: { value: '1日1回' } });

    fireEvent.click(screen.getByRole('button', { name: '保存して追加' }));

    await waitFor(() => expect(fetchContraindicationCheckXml).toHaveBeenCalled());

    expect(screen.getByText(/禁忌チェックで警告があります/)).toBeInTheDocument();
    expect(screen.getByText(/アムロジピン × ContraSample/)).toBeInTheDocument();
    expect(screen.getByText(/症状: S001 Headache/)).toBeInTheDocument();
  });

  it('症状情報がない場合は症状表示を出さない', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    vi.mocked(fetchOrderMasterSearch).mockResolvedValue({
      ok: true,
      items: [
        {
          type: 'generic-class',
          code: 'A200',
          name: 'ロサルタン',
          unit: '錠',
        },
      ],
      totalCount: 1,
    });

    vi.mocked(fetchContraindicationCheckXml).mockResolvedValue({
      ok: true,
      status: 200,
      rawXml: '<data />',
      apiResult: 'E20',
      apiResultMessage: 'warning',
      results: [
        {
          medicationCode: 'A200',
          medicationName: 'ロサルタン',
          medicalResult: '0',
          medicalResultMessage: 'OK',
          warnings: [
            {
              contraCode: 'C010',
              contraName: 'ContraOther',
              contextClass: '1',
            },
          ],
        },
      ],
      symptomInfo: [],
      missingTags: [],
    } as any);

    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const keywordInput = screen.getByLabelText('キーワード', {
      selector: 'input[id$="-master-keyword"]',
    });
    fireEvent.change(keywordInput, { target: { value: 'ロサ' } });

    await waitFor(() => expect(screen.getByText('ロサルタン')).toBeInTheDocument());

    const rowButton = screen.getByText('ロサルタン').closest('button');
    expect(rowButton).not.toBeNull();
    fireEvent.click(rowButton!);

    fireEvent.change(screen.getByLabelText('用法'), { target: { value: '1日1回' } });

    fireEvent.click(screen.getByRole('button', { name: '保存して追加' }));

    await waitFor(() => expect(fetchContraindicationCheckXml).toHaveBeenCalled());

    expect(screen.getByText(/禁忌チェックで警告があります/)).toBeInTheDocument();
    expect(screen.getByText(/ロサルタン × ContraOther/)).toBeInTheDocument();
    expect(screen.queryByText(/症状:/)).not.toBeInTheDocument();
  });
});
