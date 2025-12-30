import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { OrderBundleEditPanel } from '../OrderBundleEditPanel';
import { mutateOrderBundles } from '../orderBundleApi';

const mockHistoryBundle = vi.hoisted(() => ({
  documentId: 100,
  moduleId: 200,
  bundleName: '降圧薬セット',
  admin: '1日1回 朝',
  bundleNumber: '7',
  started: '2025-12-01',
  items: [
    {
      name: 'アムロジピン',
      quantity: '1',
      unit: '錠',
    },
  ],
}));

vi.mock('../orderBundleApi', async () => ({
  fetchOrderBundles: vi.fn().mockResolvedValue({
    ok: true,
    bundles: [mockHistoryBundle],
    patientId: 'P-1',
  }),
  mutateOrderBundles: vi.fn().mockResolvedValue({ ok: true, runId: 'RUN-ORDER' }),
}));

vi.mock('../stampApi', async () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({ ok: true, id: 1, userId: 'facility:doctor' }),
  fetchStampTree: vi.fn().mockResolvedValue({ ok: true, trees: [] }),
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

describe('OrderBundleEditPanel history copy', () => {
  it('履歴コピー後は新規作成として保存される', async () => {
    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const list = await screen.findByRole('list');
    const copyButton = within(list).getByRole('button', { name: 'コピー' });
    await user.click(copyButton);

    await user.click(screen.getByRole('button', { name: '保存して追加' }));

    const mutateMock = vi.mocked(mutateOrderBundles);
    await waitFor(() => expect(mutateMock).toHaveBeenCalled());

    const payload = mutateMock.mock.calls[0]?.[0];
    const operation = payload?.operations?.[0];
    expect(operation?.operation).toBe('create');
    expect(operation?.documentId).toBeUndefined();
    expect(operation?.moduleId).toBeUndefined();
  });

  it('編集ガード中は履歴コピーが無効になる', async () => {
    renderWithClient(
      <OrderBundleEditPanel
        {...baseProps}
        meta={{ ...baseProps.meta, readOnly: true, readOnlyReason: '閲覧専用です' }}
      />,
    );

    await screen.findByText('編集はブロックされています: 閲覧専用です');

    const list = await screen.findByRole('list');
    const copyButton = within(list).getByRole('button', { name: 'コピー' });
    expect(copyButton).toBeDisabled();
  });
});
