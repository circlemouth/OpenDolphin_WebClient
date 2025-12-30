import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { OrderBundleEditPanel } from '../OrderBundleEditPanel';
import { fetchStampDetail } from '../stampApi';

vi.mock('../orderBundleApi', async () => ({
  fetchOrderBundles: vi.fn().mockResolvedValue({
    ok: true,
    bundles: [],
    patientId: 'P-1',
  }),
  mutateOrderBundles: vi.fn(),
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
  fetchStampDetail: vi.fn().mockResolvedValue({
    ok: true,
    stampId: 'STAMP-1',
    stamp: {
      orderName: '降圧セット',
      admin: '1日1回 朝',
      bundleNumber: '1',
      memo: '注意事項',
      claimItem: [
        { name: 'アムロジピン', number: '1', unit: '錠' },
      ],
    },
  }),
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

beforeEach(() => {
  localStorage.setItem('devFacilityId', 'facility');
  localStorage.setItem('devUserId', 'doctor');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('OrderBundleEditPanel stamp flow', () => {
  it('スタンプ保存入力と反映手順が表示される', () => {
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    expect(screen.getByLabelText('スタンプ名称')).toBeInTheDocument();
    expect(screen.getByLabelText('分類')).toBeInTheDocument();
    expect(screen.getByLabelText('対象')).toBeInTheDocument();
    expect(screen.getByText('取り込み後は内容を確認し、必要に応じて編集してから「展開する」「展開継続する」または「保存して追加」で反映してください。')).toBeInTheDocument();
  });

  it('readOnly の場合はスタンプ操作が無効化される', () => {
    renderWithClient(
      <OrderBundleEditPanel
        {...baseProps}
        meta={{ ...baseProps.meta, readOnly: true, readOnlyReason: '閲覧専用' }}
      />,
    );

    expect(screen.getByLabelText('スタンプ名称')).toBeDisabled();
    expect(screen.getByLabelText('分類')).toBeDisabled();
    expect(screen.getByLabelText('対象')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'スタンプ保存' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'スタンプ取り込み' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'スタンプコピー' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'スタンプペースト' })).toBeDisabled();
  });

  it('スタンプ取り込みでフォームに反映される', async () => {
    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    await screen.findByRole('option', { name: /降圧セット/ });
    const select = screen.getByLabelText('既存スタンプ');
    await user.selectOptions(select, 'server::STAMP-1');
    await user.click(screen.getByRole('button', { name: 'スタンプ取り込み' }));

    const bundleNameInput = screen.getByLabelText('RP名') as HTMLInputElement;
    await waitFor(() => expect(bundleNameInput.value).toBe('降圧セット'));
  });

  it('スタンプコピー/ペーストでフォームに反映される', async () => {
    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    await screen.findByRole('option', { name: /降圧セット/ });
    const select = screen.getByLabelText('既存スタンプ');
    await user.selectOptions(select, 'server::STAMP-1');
    await user.click(screen.getByRole('button', { name: 'スタンプコピー' }));

    await waitFor(() => expect(screen.getByText('スタンプをコピーしました。')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'スタンプペースト' }));

    const bundleNameInput = screen.getByLabelText('RP名') as HTMLInputElement;
    await waitFor(() => expect(bundleNameInput.value).toBe('降圧セット'));
  });

  it('スタンプ保存でローカルスタンプが追加される', async () => {
    const user = userEvent.setup();
    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    await user.type(screen.getByLabelText('スタンプ名称'), '自院セット');
    await user.selectOptions(screen.getByLabelText('対象'), 'medOrder');
    await user.click(screen.getByRole('button', { name: 'スタンプ保存' }));

    const select = screen.getByLabelText('既存スタンプ') as HTMLSelectElement;
    await waitFor(() => expect(select.textContent).toContain('自院セット'));
  });

  it('スタンプ取り込み失敗時にエラー通知される', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchStampDetail).mockResolvedValueOnce({
      ok: false,
      stampId: 'STAMP-1',
      message: '取り込み失敗',
    });

    renderWithClient(<OrderBundleEditPanel {...baseProps} />);

    await screen.findByRole('option', { name: /降圧セット/ });
    await user.selectOptions(screen.getByLabelText('既存スタンプ'), 'server::STAMP-1');
    await user.click(screen.getByRole('button', { name: 'スタンプ取り込み' }));

    await waitFor(() => expect(screen.getByText('取り込み失敗')).toBeInTheDocument());
  });
});
