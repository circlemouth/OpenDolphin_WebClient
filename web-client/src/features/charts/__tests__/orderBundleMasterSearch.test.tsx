import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { OrderBundleEditPanel } from '../OrderBundleEditPanel';
import { fetchOrderBundles } from '../orderBundleApi';
import { fetchOrderMasterSearch } from '../orderMasterSearchApi';

vi.mock('../orderBundleApi', async () => ({
  fetchOrderBundles: vi.fn().mockResolvedValue({
    ok: true,
    bundles: [],
    patientId: 'P-1',
  }),
  mutateOrderBundles: vi.fn(),
}));

vi.mock('../orderMasterSearchApi', async () => ({
  fetchOrderMasterSearch: vi.fn(),
}));

vi.mock('../stampApi', async () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({ ok: true, id: 1, userId: 'facility:doctor' }),
  fetchStampTree: vi.fn().mockResolvedValue({ ok: true, trees: [] }),
  fetchStampDetail: vi.fn(),
}));

const renderWithClient = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
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

describe('OrderBundleEditPanel master search UI', () => {
  it('検索条件変更時に結果が更新される', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    const searchMock = vi.mocked(fetchOrderMasterSearch);
    searchMock.mockImplementation(async ({ keyword }) => {
      if (keyword.includes('ベル')) {
        return {
          ok: true,
          items: [
            {
              type: 'generic-class',
              code: 'B200',
              name: 'ベルベリン',
              unit: '包',
            },
          ],
          totalCount: 1,
        };
      }
      return {
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
      };
    });

    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const keywordInput = screen.getByLabelText('キーワード', {
      selector: 'input[id$="-master-keyword"]',
    });
    await user.type(keywordInput, 'アム');

    await waitFor(() => expect(searchMock).toHaveBeenCalled());
    expect(screen.getByText('アムロジピン')).toBeInTheDocument();

    await user.clear(keywordInput);
    await user.type(keywordInput, 'ベル');

    await waitFor(() => expect(screen.getByText('ベルベリン')).toBeInTheDocument());
  });

  it('検索結果の行選択で項目が追加される', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    const searchMock = vi.mocked(fetchOrderMasterSearch);
    searchMock.mockImplementation(async () => ({
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
    }));

    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const keywordInput = screen.getByLabelText('キーワード', {
      selector: 'input[id$="-master-keyword"]',
    });
    await user.type(keywordInput, 'アム');

    await waitFor(() => expect(screen.getByText('アムロジピン')).toBeInTheDocument());

    const rowButton = screen.getByText('アムロジピン').closest('button');
    expect(rowButton).not.toBeNull();
    await user.click(rowButton!);

    const itemNameInput = screen.getByPlaceholderText('項目名') as HTMLInputElement;
    expect(itemNameInput.value).toBe('A100 アムロジピン');
  });

  it('readOnly の場合は検索入力が無効化される', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    renderWithClient(
      <OrderBundleEditPanel
        {...baseProps}
        meta={{
          ...baseProps.meta,
          readOnly: true,
          readOnlyReason: '閲覧専用',
        }}
      />,
    );

    const keywordInput = screen.getByLabelText('キーワード', {
      selector: 'input[id$="-master-keyword"]',
    });
    expect(keywordInput).toBeDisabled();
    const typeSelect = screen.getByLabelText('検索種別');
    expect(typeSelect).toBeDisabled();
    expect(fetchOrderBundles).toHaveBeenCalled();
  });

  it('readOnly の場合は放射線の部位/コメント入力が無効化される', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');

    renderWithClient(
      <OrderBundleEditPanel
        {...baseProps}
        entity="radiologyOrder"
        title="放射線"
        bundleLabel="放射線オーダー名"
        meta={{
          ...baseProps.meta,
          readOnly: true,
          readOnlyReason: '閲覧専用',
        }}
      />,
    );

    expect(screen.getByLabelText('部位')).toBeDisabled();
    expect(screen.getByLabelText('部位検索')).toBeDisabled();
    expect(screen.getByRole('button', { name: '部位検索' })).toBeDisabled();
    expect(screen.getByPlaceholderText('コード')).toBeDisabled();
    expect(screen.getByPlaceholderText('コメント内容')).toBeDisabled();
    const addButtons = screen.getAllByRole('button', { name: '追加' });
    addButtons.forEach((button) => expect(button).toBeDisabled());
  });
});
