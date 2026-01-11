import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import type { ReceptionEntry } from '../../outpatient/types';
import type { ChartsPrintMeta } from '../print/outpatientClinicalDocument';
import { ChartsOutpatientPrintPage } from '../pages/ChartsOutpatientPrintPage';
import { hasStoredAuth } from '../../../libs/http/httpClient';

vi.mock('../../../libs/http/httpClient', () => ({
  hasStoredAuth: vi.fn(),
}));

vi.mock('../audit', () => ({
  recordChartsAuditEvent: vi.fn(),
}));

const baseEntry: ReceptionEntry = {
  id: 'REC-001',
  patientId: 'P-001',
  appointmentId: 'APT-001',
  name: '患者テスト',
  status: '受付中',
  source: 'visits',
};

const baseMeta: ChartsPrintMeta = {
  runId: 'RUN-PRINT-001',
  cacheHit: false,
  missingMaster: false,
  fallbackUsed: false,
  dataSourceTransition: 'snapshot',
};

type OutpatientPrintOverrides = Partial<{
  entry: Partial<ReceptionEntry>;
  meta: Partial<ChartsPrintMeta>;
  actor: string;
  facilityId: string;
}>;

const buildRouter = (stateOverrides: OutpatientPrintOverrides = {}) => {
  const state = {
    entry: { ...baseEntry, ...(stateOverrides.entry ?? {}) },
    meta: { ...baseMeta, ...(stateOverrides.meta ?? {}) },
    actor: stateOverrides.actor ?? '0001:doctor',
    facilityId: stateOverrides.facilityId ?? 'FAC-001',
  };
  return createMemoryRouter(
    [
      {
        path: '/charts/print/outpatient',
        element: <ChartsOutpatientPrintPage />,
      },
    ],
    { initialEntries: [{ pathname: '/charts/print/outpatient', state }] },
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
    Reflect.deleteProperty(window as Window & { print?: unknown }, 'print');
  }
});

describe('ChartsOutpatientPrintPage', () => {
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

  it.each([
    {
      title: 'missingMaster',
      meta: { missingMaster: true },
      expected: 'missingMaster=true',
    },
    {
      title: 'fallbackUsed',
      meta: { fallbackUsed: true },
      expected: 'fallbackUsed=true',
    },
  ])('ガード条件($title)で出力ブロック表示が出る', async ({ meta, expected }) => {
    const router = buildRouter({ meta });
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('button', { name: '印刷' })).toBeDisabled();
    expect(screen.getByText(/出力ガード中/)).toHaveTextContent(expected);
  });

  it('ガード条件(permission)で出力ブロック表示が出る', async () => {
    setAuth(false);
    const router = buildRouter();
    render(<RouterProvider router={router} />);

    expect(screen.getByRole('button', { name: '印刷' })).toBeDisabled();
    expect(screen.getByText(/出力ガード中/)).toHaveTextContent('権限不足/認証不備');
  });
});
