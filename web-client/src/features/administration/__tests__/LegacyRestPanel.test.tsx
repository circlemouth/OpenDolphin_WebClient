import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { LegacyRestResponse } from '../../debug/legacyRestApi';
import { LegacyRestPanel } from '../LegacyRestPanel';
import { clearAuditEventLog, getAuditEventLog } from '../../../libs/audit/auditLogger';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn<(req: any) => Promise<LegacyRestResponse>>(),
}));

vi.mock('../../debug/legacyRestApi', async () => {
  const actual = await vi.importActual<typeof import('../../debug/legacyRestApi')>('../../debug/legacyRestApi');
  return {
    ...actual,
    requestLegacyRest: mockRequest,
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

const buildResponse = (overrides: Partial<LegacyRestResponse>): LegacyRestResponse => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  raw: '{"ok":true}',
  json: { ok: true },
  mode: 'json',
  contentType: 'application/json',
  headers: {},
  runId: 'RUN-LEGACY',
  traceId: 'TRACE-LEGACY',
  ...overrides,
});

afterEach(() => {
  cleanup();
  clearAuditEventLog();
  mockRequest.mockReset();
});

describe('LegacyRestPanel', () => {
  it('疎通確認で legacy 監査ログが残る', async () => {
    mockRequest.mockResolvedValueOnce(buildResponse({ status: 200, ok: true }));

    render(
      <LegacyRestPanel
        runId="RUN-TEST"
        role="system_admin"
        actorId="facility:user"
        environmentLabel="dev"
        isSystemAdmin
      />,
    );

    const buttons = screen.getAllByRole('button', { name: '疎通確認' });
    fireEvent.click(buttons[0]);

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
    expect(screen.getByText('HTTP 200 (2xx success)')).toBeInTheDocument();

    const logs = getAuditEventLog();
    expect(logs.length).toBe(1);
    expect(logs[0].payload?.legacy).toBe(true);
    expect(logs[0].payload?.endpoint).toBe('/pvt');
    expect(logs[0].payload?.screen).toBe('administration/legacy-rest');
  });
});
