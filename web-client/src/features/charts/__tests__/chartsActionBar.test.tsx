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
          endpoint: '/api01rv2/claim/outpatient',
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
});
