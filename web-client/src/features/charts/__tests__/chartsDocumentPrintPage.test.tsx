import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { ChartsDocumentPrintPage } from '../pages/ChartsDocumentPrintPage';
import type { DocumentPrintPreviewState } from '../print/documentPrintPreviewStorage';
import { hasStoredAuth } from '../../../libs/http/httpClient';

vi.mock('../../../libs/http/httpClient', () => ({
  hasStoredAuth: vi.fn(),
}));

vi.mock('../audit', () => ({
  recordChartsAuditEvent: vi.fn(),
}));

const baseState: DocumentPrintPreviewState = {
  document: {
    id: 'DOC-001',
    type: 'referral',
    issuedAt: '2025-12-29',
    title: '東京クリニック宛',
    savedAt: new Date('2025-12-29T08:00:00Z').toISOString(),
    templateId: 'REF-ODT-STD',
    templateLabel: '紹介状（標準）',
    form: {
      issuedAt: '2025-12-29',
      templateId: 'REF-ODT-STD',
      hospital: '東京クリニック',
      doctor: '山田太郎',
      purpose: '精査依頼',
      diagnosis: '高血圧',
      body: '既往歴と検査結果を記載',
    },
    patientId: 'P-001',
  },
  meta: {
    runId: 'RUN-DOC-001',
    cacheHit: false,
    missingMaster: false,
    fallbackUsed: false,
    dataSourceTransition: 'snapshot',
  },
  actor: '0001:doctor',
  facilityId: 'FAC-001',
};

const buildRouter = (stateOverrides: Partial<DocumentPrintPreviewState> = {}) => {
  const state = {
    ...baseState,
    ...stateOverrides,
    document: { ...baseState.document, ...(stateOverrides.document ?? {}) },
    meta: { ...baseState.meta, ...(stateOverrides.meta ?? {}) },
  };
  return createMemoryRouter(
    [
      {
        path: '/charts/print/document',
        element: <ChartsDocumentPrintPage />,
      },
    ],
    { initialEntries: [{ pathname: '/charts/print/document', state }] },
  );
};

const setAuth = (value: boolean) => {
  const mocked = vi.mocked(hasStoredAuth);
  mocked.mockReturnValue(value);
};

let originalPrint: typeof window.print | undefined;

beforeEach(() => {
  originalPrint = window.print;
  Object.defineProperty(window, 'print', {
    value: vi.fn(),
    writable: true,
  });
  setAuth(true);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (originalPrint) {
    window.print = originalPrint;
  } else {
    delete (window as typeof window & { print?: unknown }).print;
  }
});

describe('ChartsDocumentPrintPage', () => {
  it('出力前確認モーダルの表示/キャンセル/確定ができる', async () => {
    const router = buildRouter();
    render(<RouterProvider router={router} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: '印刷' }));
    expect(screen.getByRole('dialog', { name: '出力の最終確認' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'キャンセル' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '出力の最終確認' })).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: '印刷' }));
    await user.click(screen.getByRole('button', { name: '出力する' }));

    await waitFor(() => {
      expect(window.print).toHaveBeenCalledTimes(1);
    });
  });

  it('テンプレ未選択で出力ブロック表示が出る', () => {
    const router = buildRouter({ document: { templateId: '', templateLabel: '未選択' } });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('button', { name: '印刷' })).toBeDisabled();
    expect(screen.getByText(/出力ガード中/)).toHaveTextContent('テンプレ未選択');
  });

  it('権限不足で出力ブロック表示が出る', () => {
    setAuth(false);
    const router = buildRouter();
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('button', { name: '印刷' })).toBeDisabled();
    expect(screen.getByText(/出力ガード中/)).toHaveTextContent('権限不足/認証不備');
  });
});
