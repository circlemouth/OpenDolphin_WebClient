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

describe('OrderBundleEditPanel usage search UI', () => {
  it('用法検索の行選択で用法が反映される', async () => {
    localStorage.setItem('devFacilityId', 'facility');
    localStorage.setItem('devUserId', 'doctor');
    const searchMock = vi.mocked(fetchOrderMasterSearch);
    searchMock.mockImplementation(async ({ type }) => {
      if (type === 'youhou') {
        return {
          ok: true,
          items: [
            {
              type: 'youhou',
              code: '0010001',
              name: '1日1回 朝食後',
              unit: '',
            },
          ],
          totalCount: 1,
        };
      }
      return { ok: true, items: [], totalCount: 0 };
    });

    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const usageKeywordInput = screen.getByLabelText('キーワード', {
      selector: 'input[id$="-usage-keyword"]',
    });
    await user.type(usageKeywordInput, '朝食');

    await waitFor(() => expect(searchMock).toHaveBeenCalled());
    expect(screen.getByText('1日1回 朝食後')).toBeInTheDocument();

    const rowButton = screen.getByText('1日1回 朝食後').closest('button');
    expect(rowButton).not.toBeNull();
    await user.click(rowButton!);

    const adminInput = screen.getByLabelText('用法') as HTMLInputElement;
    expect(adminInput.value).toBe('0010001 1日1回 朝食後');
  });

  it('readOnly の場合は用法検索が無効化される', async () => {
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

    expect(
      screen.getByLabelText('キーワード', {
        selector: 'input[id$="-usage-keyword"]',
      }),
    ).toBeDisabled();
    expect(screen.getByLabelText('用法フィルタ')).toBeDisabled();
    expect(screen.getByLabelText('部分一致')).toBeDisabled();
    expect(screen.getByLabelText('件数上限')).toBeDisabled();
    expect(fetchOrderBundles).toHaveBeenCalled();
  });
});
