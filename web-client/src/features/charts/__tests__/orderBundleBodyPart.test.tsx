import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { OrderBundleEditPanel } from '../OrderBundleEditPanel';
import { fetchOrderBundles, mutateOrderBundles } from '../orderBundleApi';
import { fetchOrderMasterSearch } from '../orderMasterSearchApi';

vi.mock('../orderBundleApi', async () => ({
  fetchOrderBundles: vi.fn().mockResolvedValue({
    ok: true,
    bundles: [],
    patientId: 'P-1',
  }),
  mutateOrderBundles: vi.fn().mockResolvedValue({
    ok: true,
    runId: 'RUN-BODY-PART',
  }),
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
  entity: 'radiologyOrder',
  title: '放射線',
  bundleLabel: '放射線オーダー名',
  itemQuantityLabel: '数量',
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

describe('OrderBundleEditPanel body part search', () => {
  it('放射線の部位検索はキーワード入力で自動検索され、スナップショットに反映される', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    const searchMock = vi.mocked(fetchOrderMasterSearch);
    searchMock.mockImplementation(async ({ type }) => {
      if (type === 'bodypart') {
        return {
          ok: true,
          items: [
            {
              type: 'bodypart',
              code: '002001',
              name: '胸部',
              unit: '部位',
              category: '2',
            },
          ],
          totalCount: 1,
        };
      }
      return { ok: true, items: [], totalCount: 0 };
    });

    const user = userEvent.setup();
    const { container } = renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const keywordInput = screen.getByLabelText('部位検索', {
      selector: 'input[id$="-bodypart-keyword"]',
    });
    await user.type(keywordInput, '胸');

    await waitFor(() =>
      expect(searchMock).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'bodypart', keyword: '胸' })),
    );
    await waitFor(() => expect(screen.getByText('胸部')).toBeInTheDocument());

    expect(container).toMatchSnapshot();
  });

  it('generalOrder で部位選択した内容が保存アイテムに含まれる', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    const searchMock = vi.mocked(fetchOrderMasterSearch);
    searchMock.mockImplementation(async ({ type }) => {
      if (type === 'bodypart') {
        return {
          ok: true,
          items: [
            {
              type: 'bodypart',
              code: '002003',
              name: '膝関節',
              unit: '部位',
              category: '2',
            },
          ],
          totalCount: 1,
        };
      }
      return { ok: true, items: [], totalCount: 0 };
    });

    const user = userEvent.setup();
    renderWithClient(
      <OrderBundleEditPanel
        {...baseProps}
        entity="generalOrder"
        title="オーダー編集"
        bundleLabel="オーダー名"
        itemQuantityLabel="数量"
      />,
    );

    await user.type(screen.getByLabelText('オーダー名'), 'テストオーダー');
    await user.type(screen.getByPlaceholderText('項目名'), 'テスト項目');

    const keywordInput = screen.getByLabelText('部位検索', {
      selector: 'input[id$="-bodypart-keyword"]',
    });
    await user.type(keywordInput, '膝');

    await waitFor(() =>
      expect(searchMock).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'bodypart', keyword: '膝' })),
    );
    await waitFor(() => expect(screen.getByText('膝関節')).toBeInTheDocument());

    await user.click(screen.getByText('膝関節').closest('button')!);

    await user.click(screen.getByRole('button', { name: '保存して追加' }));

    await waitFor(() => expect(mutateOrderBundles).toHaveBeenCalled());

    const call = vi.mocked(mutateOrderBundles).mock.calls[0]?.[0];
    const items = call?.operations?.[0]?.items ?? [];
    expect(items).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: '002003', name: '膝関節' })]),
    );
  });

  it('部位検索の失敗時は aria-live=assertive のエラーバナーが表示される', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    const searchMock = vi.mocked(fetchOrderMasterSearch);
    searchMock.mockResolvedValue({
      ok: false,
      items: [],
      totalCount: 0,
      message: '部位マスタの検索に失敗しました。',
    });

    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const keywordInput = screen.getByLabelText('部位検索', {
      selector: 'input[id$="-bodypart-keyword"]',
    });
    await user.type(keywordInput, '胸');

    await waitFor(() =>
      expect(searchMock).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'bodypart', keyword: '胸' })),
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveTextContent('部位マスタの検索に失敗しました。');
  });

  it('放射線以外のエンティティでは部位検索が発火しない', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    const searchMock = vi.mocked(fetchOrderMasterSearch);
    searchMock.mockResolvedValue({ ok: true, items: [], totalCount: 0 });

    const user = userEvent.setup();
    renderWithClient(
      <OrderBundleEditPanel
        {...baseProps}
        entity="medOrder"
        title="処方編集"
        bundleLabel="RP名"
        itemQuantityLabel="用量"
      />,
    );

    const keywordInput = screen.queryByLabelText('部位検索', {
      selector: 'input[id$="-bodypart-keyword"]',
    });
    expect(keywordInput).toBeNull();
    await user.click(screen.getByRole('button', { name: '保存して追加' }));
    expect(searchMock).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'bodypart' }));
    expect(fetchOrderBundles).toHaveBeenCalled();
  });
});
