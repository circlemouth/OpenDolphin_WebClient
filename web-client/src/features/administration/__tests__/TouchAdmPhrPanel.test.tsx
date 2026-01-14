import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { TouchAdmPhrResponse } from '../touchAdmPhrApi';
import { TouchAdmPhrPanel } from '../TouchAdmPhrPanel';
import { clearAuditEventLog, getAuditEventLog } from '../../../libs/audit/auditLogger';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn<[], Promise<TouchAdmPhrResponse>>(),
}));

vi.mock('../touchAdmPhrApi', async () => {
  const actual = await vi.importActual<typeof import('../touchAdmPhrApi')>('../touchAdmPhrApi');
  return {
    ...actual,
    requestTouchAdmPhr: mockRequest,
  };
});

vi.mock('../../../libs/audit/auditLogger', () => {
  const auditLog: any[] = [];
  return {
    clearAuditEventLog: () => {
      auditLog.length = 0;
    },
    getAuditEventLog: () => [...auditLog],
    logAuditEvent: (entry: any) => {
      const record = { ...entry, timestamp: new Date().toISOString() };
      auditLog.push(record);
      return record;
    },
    logUiState: () => ({ timestamp: new Date().toISOString() }),
  };
});

const buildResponse = (overrides: Partial<TouchAdmPhrResponse>): TouchAdmPhrResponse => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  raw: '{"ok":true}',
  json: { ok: true },
  mode: 'json',
  contentType: 'application/json',
  headers: {},
  runId: 'RUN-TOUCH',
  traceId: 'TRACE-TOUCH',
  ...overrides,
});

afterEach(() => {
  cleanup();
  clearAuditEventLog();
  mockRequest.mockReset();
});

describe('TouchAdmPhrPanel', () => {
  it('疎通確認で監査ログが残る', async () => {
    mockRequest.mockResolvedValueOnce(buildResponse({ status: 200, ok: true }));

    render(
      <TouchAdmPhrPanel
        runId="RUN-TEST"
        role="system_admin"
        actorId="facility:user"
        environmentLabel="dev"
        isSystemAdmin
        facilityId="FAC-1"
        userId="USER-1"
      />,
    );

    const buttons = screen.getAllByRole('button', { name: '疎通確認' });
    fireEvent.click(buttons[0]);

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));

    const logs = getAuditEventLog();
    expect(logs.length).toBe(1);
    expect(logs[0].payload?.screen).toBe('administration/touch-adm-phr');
    expect(logs[0].payload?.endpoint).toBe('/touch/user/USER-1,FAC-1,password');
  });
});
