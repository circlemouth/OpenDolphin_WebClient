import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { ChartsActionBar } from '../ChartsActionBar';
import { httpFetch } from '../../../libs/http/httpClient';
import { recordChartsAuditEvent } from '../audit';

vi.mock('../../../libs/http/httpClient', () => ({
  httpFetch: vi.fn(),
}));

vi.mock('../../../libs/audit/auditLogger', () => ({
  logUiState: vi.fn(),
}));

vi.mock('../audit', () => ({
  recordChartsAuditEvent: vi.fn(),
}));

vi.mock('../../../libs/auth/storedAuth', () => ({
  resolveAuditActor: () => ({ actor: 'tester', facilityId: 'F-1', userId: 'U-1' }),
}));

const baseProps = {
  runId: 'RUN-ACTION',
  cacheHit: false,
  missingMaster: false,
  dataSourceTransition: 'server' as const,
  fallbackUsed: false,
};

describe('ChartsActionBar', () => {
  it('ORCA送信の成功をトーストと監査ログに反映する', async () => {
    const user = userEvent.setup();
    vi.mocked(httpFetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        runId: 'RUN-OK',
        traceId: 'TRACE-OK',
        requestId: 'REQ-1',
        outcome: 'SUCCESS',
        apiResult: 'OK',
        apiResultMessage: 'ok',
      }),
    } as unknown as Response);

    render(
      <MemoryRouter>
        <ChartsActionBar {...baseProps} patientId="P-100" visitDate="2026-01-03" />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'ORCA 送信' }));
    await user.click(screen.getByRole('button', { name: '送信する' }));

    await waitFor(() => expect(httpFetch).toHaveBeenCalled());
    expect(screen.getByText('ORCA送信を完了')).toBeInTheDocument();
    expect(recordChartsAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ORCA_SEND',
        outcome: 'success',
        details: expect.objectContaining({
          endpoint: '/orca/claim/outpatient',
          httpStatus: 200,
          apiResult: 'OK',
          apiResultMessage: 'ok',
          outcome: 'SUCCESS',
          visitDate: '2026-01-03',
        }),
      }),
    );
  });

  it('診療終了の失敗を明示し監査ログにapiResultを残す', async () => {
    const user = userEvent.setup();
    vi.mocked(httpFetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({
        runId: 'RUN-NG',
        traceId: 'TRACE-NG',
        outcome: 'FAILURE',
        apiResult: 'ERR',
        apiResultMessage: 'server error',
      }),
    } as unknown as Response);

    render(
      <MemoryRouter>
        <ChartsActionBar {...baseProps} patientId="P-200" visitDate="2026-01-04" />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '診療終了' }));

    await waitFor(() => expect(httpFetch).toHaveBeenCalled());
    expect(screen.getByText('診療終了に失敗')).toBeInTheDocument();
    expect(recordChartsAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'error',
        details: expect.objectContaining({
          endpoint: '/orca21/medicalmodv2/outpatient',
          httpStatus: 500,
          apiResult: 'ERR',
          apiResultMessage: 'server error',
          outcome: 'FAILURE',
          visitDate: '2026-01-04',
        }),
      }),
    );
  });

  it('承認ロック中は印刷がガードされる', () => {
    render(
      <MemoryRouter>
        <ChartsActionBar
          {...baseProps}
          patientId="P-300"
          visitDate="2026-01-05"
          selectedEntry={{ patientId: 'P-300', appointmentId: 'APT-1', visitDate: '2026-01-05' } as any}
          approvalLock={{ locked: true, runId: 'RUN-LOCK', action: 'send' }}
        />
      </MemoryRouter>,
    );

    const printButton = screen.getByRole('button', { name: '印刷/エクスポート' });
    expect(printButton).toBeDisabled();
    expect(screen.getAllByText(/承認済み（署名確定）/).length).toBeGreaterThan(0);
  });

  it('閲覧専用時は印刷がガードされる', () => {
    render(
      <MemoryRouter>
        <ChartsActionBar
          {...baseProps}
          patientId="P-400"
          visitDate="2026-01-06"
          selectedEntry={{ patientId: 'P-400', appointmentId: 'APT-2', visitDate: '2026-01-06' } as any}
          editLock={{ readOnly: true, reason: '別タブが編集中です', lockStatus: 'other-tab' }}
        />
      </MemoryRouter>,
    );

    const printButton = screen.getByRole('button', { name: '印刷/エクスポート' });
    expect(printButton).toBeDisabled();
    expect(screen.getAllByText(/閲覧専用（並行編集）/).length).toBeGreaterThan(0);
  });

  it('UIロック中は印刷がガードされる', () => {
    render(
      <MemoryRouter>
        <ChartsActionBar
          {...baseProps}
          patientId="P-500"
          visitDate="2026-01-07"
          selectedEntry={{ patientId: 'P-500', appointmentId: 'APT-3', visitDate: '2026-01-07' } as any}
          uiLockReason="別アクション実行中"
        />
      </MemoryRouter>,
    );

    const printButton = screen.getByRole('button', { name: '印刷/エクスポート' });
    expect(printButton).toBeDisabled();
    expect(screen.getAllByText(/他の操作が進行中\/ロック中/).length).toBeGreaterThan(0);
  });
});
