import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

const buildDataTransfer = () => {
  const store: Record<string, string> = {};
  return {
    setData: (type: string, value: string) => {
      store[type] = value;
    },
    getData: (type: string) => store[type] ?? '',
    effectAllowed: 'move',
  } as DataTransfer;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe('OrderBundleEditPanel item actions', () => {
  it('DnD 並べ替え後の順序が保存 payload に反映される', async () => {
    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    await user.click(screen.getByRole('button', { name: '追加' }));

    const nameInputs = screen.getAllByPlaceholderText('項目名') as HTMLInputElement[];
    await user.type(nameInputs[0], 'A');
    await user.type(nameInputs[1], 'B');

    await user.type(screen.getByLabelText('RP名'), '降圧薬');
    await user.type(screen.getByLabelText('用法'), '1日1回');

    const handles = screen.getAllByLabelText('ドラッグして並べ替え');
    const rows = nameInputs
      .map((input) => input.closest('.charts-side-panel__item-row'))
      .filter((row): row is HTMLElement => !!row);

    const dataTransfer = buildDataTransfer();
    fireEvent.dragStart(handles[0], { dataTransfer });
    fireEvent.dragOver(rows[1], { dataTransfer });
    fireEvent.drop(rows[1], { dataTransfer });
    fireEvent.dragEnd(handles[0], { dataTransfer });

    const reordered = screen.getAllByPlaceholderText('項目名') as HTMLInputElement[];
    expect(reordered[0].value).toBe('B');
    expect(reordered[1].value).toBe('A');

    await user.click(screen.getByRole('button', { name: '保存して追加' }));

    const mutateMock = vi.mocked(mutateOrderBundles);
    await waitFor(() => expect(mutateMock).toHaveBeenCalled());

    const payload = mutateMock.mock.calls[0]?.[0];
    const items = payload?.operations?.[0]?.items ?? [];
    expect(items.map((item: { name: string }) => item.name)).toEqual(['B', 'A']);
  });

  it('readOnly の場合は並べ替え/全クリア/行削除が無効化される', () => {
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

    expect(screen.getByRole('button', { name: '全クリア' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '行削除' })).toBeDisabled();
    expect(screen.getByLabelText('ドラッグして並べ替え')).toBeDisabled();
  });

  it('全クリアで行が初期化される', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    await user.click(screen.getByRole('button', { name: '追加' }));

    const nameInputs = screen.getAllByPlaceholderText('項目名') as HTMLInputElement[];
    await user.type(nameInputs[0], 'A');
    await user.type(nameInputs[1], 'B');

    await user.click(screen.getByRole('button', { name: '全クリア' }));

    const cleared = screen.getAllByPlaceholderText('項目名') as HTMLInputElement[];
    expect(cleared).toHaveLength(1);
    expect(cleared[0].value).toBe('');
    const rows = screen.getAllByTestId('order-bundle-item-row');
    expect(rows).toHaveLength(1);
    expect(rows[0].getAttribute('data-rowid')).toBeTruthy();

    confirmSpy.mockRestore();
  });
});
