import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { LegacyRestResponse } from '../legacyRestApi';
import { LegacyRestConsolePage } from '../LegacyRestConsolePage';
import { clearAuditEventLog, getAuditEventLog } from '../../../libs/audit/auditLogger';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn<(req: any) => Promise<LegacyRestResponse>>(),
}));

vi.mock('../legacyRestApi', async () => {
  const actual = await vi.importActual<typeof import('../legacyRestApi')>('../legacyRestApi');
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

describe('LegacyRestConsolePage', () => {
  it('2xx の場合は success 表示になり legacy 監査ログを出す', async () => {
    mockRequest.mockResolvedValueOnce(buildResponse({ status: 200, ok: true }));

    render(<LegacyRestConsolePage />);

    const sendButtons = screen.getAllByRole('button', { name: '送信' });
    fireEvent.click(sendButtons[0]);

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('status').textContent).toContain('HTTP 200');
    const logs = getAuditEventLog();
    expect(logs.length).toBe(1);
    expect(logs[0].payload?.legacy).toBe(true);
    expect(logs[0].payload?.endpoint).toBe('/pvt');
    expect(logs[0].payload?.screen).toBe('debug/legacy-rest');
  });

  it('4xx の場合は warning 表示になり legacy 監査ログを出す', async () => {
    mockRequest.mockResolvedValueOnce(
      buildResponse({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        raw: 'not found',
        json: undefined,
        mode: 'text',
        contentType: 'text/plain',
      }),
    );

    render(<LegacyRestConsolePage />);

    const sendButtons = screen.getAllByRole('button', { name: '送信' });
    fireEvent.click(sendButtons[0]);

    await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('status').textContent).toContain('HTTP 404');
    const logs = getAuditEventLog();
    expect(logs.length).toBe(1);
    expect(logs[0].payload?.legacy).toBe(true);
    expect(logs[0].payload?.endpoint).toBe('/pvt');
    expect(logs[0].payload?.status).toBe(404);
  });
});
