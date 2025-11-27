// @vitest-environment node

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { z } from 'zod';

import {
  addressMasterResponse,
  buildTensuByPointResponse,
  etensuMasterResponse,
  minimumDrugPriceResponse,
} from '@/mocks/fixtures/orcaMaster';
import { orcaMasterHandlers } from '@/mocks/handlers/orcaMasterHandlers';

const server = setupServer(...orcaMasterHandlers);
const capturedUrls: string[] = [];
server.events.on('request:start', ({ request }) => {
  capturedUrls.push(request.url);
});
const auditSchema = z.object({
  dataSource: z.literal('snapshot'),
  runId: z.string().min(1),
  snapshotVersion: z.string().min(1),
  cacheHit: z.literal(false),
  missingMaster: z.boolean(),
  fallbackUsed: z.boolean(),
});

beforeAll(() => server.listen());
afterEach(() => {
  capturedUrls.length = 0;
  server.resetHandlers();
});
afterAll(() => server.close());

const expectAuditMeta = (entry: {
  dataSource?: string;
  runId?: string;
  snapshotVersion?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
}) => {
  expect(entry.dataSource).toBe('snapshot');
  expect(entry.runId).toBe(addressMasterResponse.runId);
  expect(entry.snapshotVersion).toBe(addressMasterResponse.snapshotVersion);
  expect(entry.cacheHit).toBe(false);
  expect(entry.missingMaster).toBe(false);
  expect(entry.fallbackUsed).toBe(false);
};

describe('orca master fixture contract (msw)', () => {
  it('includes audit meta on parent responses and list entries', () => {
    expectAuditMeta(addressMasterResponse);
    expect(addressMasterResponse.list).not.toHaveLength(0);
    expectAuditMeta(addressMasterResponse.list[0]);

    expectAuditMeta(minimumDrugPriceResponse);
    expectAuditMeta(minimumDrugPriceResponse.list[0]);
    expect(minimumDrugPriceResponse.runId).toBe(addressMasterResponse.runId);
  });

  it('propagates snapshotVersion and runId into tensu fixtures', () => {
    expectAuditMeta(etensuMasterResponse);
    expect(etensuMasterResponse.list).not.toHaveLength(0);
    const tensuEntry = etensuMasterResponse.list[0];
    expectAuditMeta(tensuEntry);
    expect(tensuEntry.tensuVersion).toBe(etensuMasterResponse.snapshotVersion);
  });

  it('keeps audit meta when generating filtered tensu responses', () => {
    const filtered = buildTensuByPointResponse(0, 400);
    expectAuditMeta(filtered);
    expect(filtered.list.length).toBeGreaterThanOrEqual(0);
    if (filtered.list.length > 0) {
      expectAuditMeta(filtered.list[0]);
    }

    const empty = buildTensuByPointResponse(5000, 6000);
    expectAuditMeta(empty);
    expect(empty.list).toHaveLength(0);
  });

  it('orcaMasterHandlers respond with audit meta and fallback flags', async () => {
    const normalRequest = new URL('/orca/master/address', 'http://localhost');
    normalRequest.searchParams.set('zip', '1000001');
    const normalResponse = await fetch(normalRequest.toString()).then((res) => res.json());
    expect(capturedUrls).toContain(normalRequest.toString());
    expect(auditSchema.parse(normalResponse)).toMatchObject({
      dataSource: 'snapshot',
      fallbackUsed: false,
    });
    expect(normalResponse.list).toHaveLength(1);
    auditSchema.parse(normalResponse.list[0]);

    const fallbackRequest = new URL('/orca/master/address', 'http://localhost');
    fallbackRequest.searchParams.set('zip', '9999999');
    const fallbackResponse = await fetch(fallbackRequest.toString()).then((res) => res.json());
    expect(capturedUrls).toContain(fallbackRequest.toString());
    expect(auditSchema.parse(fallbackResponse)).toMatchObject({
      dataSource: 'snapshot',
      fallbackUsed: true,
      missingMaster: true,
    });
    expect(fallbackResponse.list).toHaveLength(0);
  });
});
