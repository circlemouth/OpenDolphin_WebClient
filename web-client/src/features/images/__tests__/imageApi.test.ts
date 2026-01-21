import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchKarteImageList,
  sendKarteDocumentWithAttachments,
  IMAGE_ATTACHMENT_MAX_SIZE_BYTES,
  type KarteDocumentAttachmentPayload,
} from '../api';
import { httpFetch } from '../../../libs/http/httpClient';
import { updateObservabilityMeta } from '../../../libs/observability/observability';
import { logAuditEvent } from '../../../libs/audit/auditLogger';

vi.mock('../../../libs/http/httpClient', () => ({
  httpFetch: vi.fn(),
}));

vi.mock('../../../libs/audit/auditLogger', () => ({
  logAuditEvent: vi.fn(),
}));

const mockHttpFetch = vi.mocked(httpFetch);
const mockLogAuditEvent = vi.mocked(logAuditEvent);

beforeEach(() => {
  mockHttpFetch.mockReset();
  mockLogAuditEvent.mockReset();
  updateObservabilityMeta({ runId: 'RUN-IMAGE', traceId: 'TRACE-IMAGE' });
});

describe('image api', () => {
  it('image list は typo fallback を試行する', async () => {
    mockHttpFetch
      .mockResolvedValueOnce(new Response('not found', { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            list: [{ id: 1, title: 'mock' }],
            page: 1,
            total: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );

    const result = await fetchKarteImageList({ chartId: '100', allowTypoFallback: true });

    expect(mockHttpFetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    expect(result.endpoint).toContain('/karte/iamges');
    expect(result.list).toHaveLength(1);
    expect(result.runId).toBe('RUN-IMAGE');
    expect(result.traceId).toBe('TRACE-IMAGE');
    expect(mockLogAuditEvent).toHaveBeenCalled();
    const audit = mockLogAuditEvent.mock.calls[0]?.[0] as { payload?: { action?: string; details?: Record<string, unknown> } };
    expect(audit.payload?.action).toBe('image_api_call');
    expect(audit.payload?.details?.runId).toBe('RUN-IMAGE');
    expect(audit.payload?.details?.traceId).toBe('TRACE-IMAGE');
  });

  it('添付のバリデーションでサイズ超過を検知する', async () => {
    const payload: KarteDocumentAttachmentPayload = {
      id: 10,
      attachment: [
        {
          fileName: 'large.png',
          contentType: 'image/png',
          contentSize: IMAGE_ATTACHMENT_MAX_SIZE_BYTES + 1,
          extension: 'png',
          bytes: 'BASE64',
        },
      ],
    };

    const result = await sendKarteDocumentWithAttachments(payload, { validate: true });

    expect(result.ok).toBe(false);
    expect(result.validationErrors).toBeTruthy();
    expect(mockHttpFetch).not.toHaveBeenCalled();
  });

  it('document 送信は JSON payload を送る', async () => {
    const payload: KarteDocumentAttachmentPayload = {
      id: 10,
      attachment: [
        {
          fileName: 'image.png',
          contentType: 'image/png',
          contentSize: 1024,
          extension: 'png',
          bytes: 'BASE64',
        },
      ],
    };

    mockHttpFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, docPk: 123 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await sendKarteDocumentWithAttachments(payload, { method: 'PUT' });

    expect(result.ok).toBe(true);
    expect(mockHttpFetch).toHaveBeenCalledWith(
      '/karte/document',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    expect(result.payload?.ok).toBe(true);
  });

  it('5MB 添付の送信が 3 秒以内で完了する', async () => {
    const sizeBytes = 5 * 1024 * 1024;
    const payload: KarteDocumentAttachmentPayload = {
      id: 10,
      attachment: [
        {
          fileName: 'image-5mb.png',
          contentType: 'image/png',
          contentSize: sizeBytes,
          extension: 'png',
          bytes: Buffer.alloc(sizeBytes, 1).toString('base64'),
        },
      ],
    };

    mockHttpFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, docPk: 999 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const started = Date.now();
    const result = await sendKarteDocumentWithAttachments(payload, { method: 'PUT' });
    const elapsed = Date.now() - started;

    expect(result.ok).toBe(true);
    expect(elapsed).toBeLessThan(3000);
  });
});
