import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { OrderBundleEditPanel } from '../OrderBundleEditPanel';
import { mutateOrderBundles } from '../orderBundleApi';

vi.mock('../orderBundleApi', async () => ({
  fetchOrderBundles: vi.fn().mockResolvedValue({
    ok: true,
    bundles: [],
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

describe('OrderBundleEditPanel item actions', () => {
  it('追加した項目が保存 payload に反映される', async () => {
    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const itemSection = screen.getByText('薬剤/項目').closest('.charts-side-panel__subsection');
    expect(itemSection).not.toBeNull();
    await user.click(within(itemSection!).getByRole('button', { name: '追加' }));

    const nameInputs = screen.getAllByPlaceholderText('項目名') as HTMLInputElement[];
    await user.type(nameInputs[0], 'A');
    await user.type(nameInputs[1], 'B');

    await user.type(screen.getByLabelText('RP名'), '降圧薬');
    await user.type(screen.getByLabelText('用法'), '1日1回');

    await user.click(screen.getByRole('button', { name: '保存して追加' }));

    const mutateMock = vi.mocked(mutateOrderBundles);
    await waitFor(() => expect(mutateMock).toHaveBeenCalled());

    const payload = mutateMock.mock.calls[0]?.[0];
    const items = payload?.operations?.[0]?.items ?? [];
    expect(items.map((item: { name: string }) => item.name)).toEqual(['A', 'B']);
  });

  it('readOnly の場合は追加/削除が無効化される', () => {
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

    const itemSection = screen.getByText('薬剤/項目').closest('.charts-side-panel__subsection');
    expect(itemSection).not.toBeNull();
    expect(within(itemSection!).getByRole('button', { name: '追加' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '✕' })).toBeDisabled();
  });

  it('項目削除で行が減る', async () => {
    const user = userEvent.setup();

    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const itemSection = screen.getByText('薬剤/項目').closest('.charts-side-panel__subsection');
    expect(itemSection).not.toBeNull();
    await user.click(within(itemSection!).getByRole('button', { name: '追加' }));

    const nameInputs = screen.getAllByPlaceholderText('項目名') as HTMLInputElement[];
    await user.type(nameInputs[0], 'A');
    await user.type(nameInputs[1], 'B');

    const secondRow = nameInputs[1].closest('.charts-side-panel__item-row');
    expect(secondRow).not.toBeNull();
    await user.click(within(secondRow!).getByRole('button', { name: '✕' }));

    const cleared = screen.getAllByPlaceholderText('項目名') as HTMLInputElement[];
    expect(cleared).toHaveLength(1);
    expect(cleared[0].value).toBe('A');
  });
});
