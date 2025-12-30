import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { OrderBundleEditPanel } from '../OrderBundleEditPanel';

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

describe('OrderBundleEditPanel bundle number UI', () => {
  it('用法入力後に日数入力が編集可能になる', async () => {
    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    const adminInput = screen.getByLabelText('用法');
    const bundleNumberInput = screen.getByLabelText('日数');
    expect(bundleNumberInput).toBeDisabled();

    await user.type(adminInput, '1日1回');
    expect(bundleNumberInput).toBeEnabled();
  });

  it('頓用/臨時では回数ラベルと説明文になる', async () => {
    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    await user.type(screen.getByLabelText('用法'), '1日1回');
    expect(screen.getByLabelText('日数')).toBeInTheDocument();

    await user.click(screen.getByLabelText('頓用'));

    const bundleNumberInput = screen.getByLabelText('回数') as HTMLInputElement;
    expect(bundleNumberInput).toBeInTheDocument();
    expect(bundleNumberInput.placeholder).toBe('例: 1');
    expect(screen.getByText('頓用/臨時は回数として扱われます。')).toBeInTheDocument();
  });
});
