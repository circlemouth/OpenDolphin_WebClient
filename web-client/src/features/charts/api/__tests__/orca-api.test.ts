// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { httpClient } from '@/libs/http';
import {
  checkDrugInteractions,
  lookupAddressMaster,
  lookupGeneralName,
  searchDiseaseByName,
  searchTensuByName,
  searchTensuByPointRange,
  fetchOrca08BridgeMasters,
} from '@/features/charts/api/orca-api';
import { OrcaValidationError } from '@/features/charts/utils/orcaMasterValidation';
import { resolveOrcaMasterSource } from '@/features/charts/api/orca-source-resolver';
import { etensuMasterResponse } from '@/mocks/fixtures/orcaMaster';

vi.mock('@/libs/http', async () => {
  const actual = await vi.importActual<typeof import('@/libs/http')>('@/libs/http');
  return {
    ...actual,
    httpClient: {
      get: vi.fn(),
      put: vi.fn(),
    },
  };
});

vi.mock('@/libs/monitoring', async () => {
  const actual = await vi.importActual<typeof import('@/libs/monitoring')>('@/libs/monitoring');
  return {
    ...actual,
    measureApiPerformance: vi.fn(async <T>(
      _metric: unknown,
      _action: unknown,
      fn: () => Promise<T>,
    ) => fn()),
  };
});

describe('orca-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(httpClient.put).mockReset();
  });

  it('returns empty response when search keyword is blank', async () => {
    const tensu = await searchTensuByName('   ');
    expect(tensu.list).toEqual([]);
    expect(tensu.missingMaster).toBe(true);
    expect(httpClient.get).not.toHaveBeenCalled();

    const disease = await searchDiseaseByName('');
    expect(disease.list).toEqual([]);
    expect(disease.missingMaster).toBe(true);
  });

  it('fetches and maps tensu master entries with audit meta', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          { etensuCategory: '1', medicalFeeCode: '123456', name: '内服薬', points: 12.5, unit: '回' },
          { etensuCategory: '1', medicalFeeCode: null, name: '無効データ', points: 10 },
        ],
        dataSource: 'server',
        cacheHit: false,
        missingMaster: false,
        fallbackUsed: false,
        runId: 'RUN-SERVER',
      },
    } as never);

    const result = await searchTensuByName('内服薬', { partialMatch: false, sourceHint: 'server' });

    expect(httpClient.get).toHaveBeenCalledWith('/orca/master/etensu', { baseURL: expect.any(String) });
    expect(result.list).toHaveLength(1);
    expect(result.dataSource).toBe('server');
    expect(result.list[0]).toMatchObject({ code: '123456', name: '内服薬', point: 12.5 });
    expect(result.runId).toBe('RUN-SERVER');
  });

  it('fetches tensu entries by point range with optional date', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [{ etensuCategory: '1', medicalFeeCode: '001', name: '初診料', points: 50, startDate: '20250101' }],
        dataSource: 'server',
      },
    } as never);

    const result = await searchTensuByPointRange({
      min: 50,
      max: 100,
      date: new Date('2026-05-01'),
      sourceHint: 'server',
    });

    expect(httpClient.get).toHaveBeenCalledWith('/orca/master/etensu', { baseURL: expect.any(String) });
    expect(result.list).toEqual([
      expect.objectContaining({
        code: '001',
        name: '初診料',
        point: 50,
      }),
    ]);
    expect(result.missingMaster).toBe(false);
  });

  it('returns empty response when point range is invalid', async () => {
    const empty = await searchTensuByPointRange({ min: null, max: null });
    const reversed = await searchTensuByPointRange({ min: 200, max: 100 });
    expect(empty.list).toEqual([]);
    expect(reversed.list).toEqual([]);
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('fetches disease master entries and filters invalid payloads', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          { code: 'A001', name: '感冒', icdTen: 'J00', disUseDate: '2026-12-31' },
          { code: '', name: '無効' },
        ],
      },
    } as never);

    const endpoint = `/orca/disease/name/${encodeURIComponent('感冒,20260424,true')}/`;
    const result = await searchDiseaseByName('感冒', { date: new Date('2026-04-24T12:00:00Z') });

    expect(httpClient.get).toHaveBeenCalledWith(endpoint);
    expect(result.list).toEqual([
      { code: 'A001', name: '感冒', icd10: 'J00', validUntil: '2026-12-31', kana: undefined },
    ]);
    expect(result.dataSource).toBe('server');
  });

  it('looks up general name codes and returns empty list for incomplete payloads', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { code: '6134004', name: 'アセトアミノフェン' } } as never);

    const blank = await lookupGeneralName('   ');
    expect(blank.list).toEqual([]);
    expect(httpClient.get).not.toHaveBeenCalled();

    const result = await lookupGeneralName('6134004');
    expect(httpClient.get).toHaveBeenCalledWith('/orca/general/6134004');
    expect(result.list[0]).toMatchObject({ code: '6134004', name: 'アセトアミノフェン' });

    vi.mocked(httpClient.get).mockResolvedValue({ data: { code: null, name: null } } as never);
    const missing = await lookupGeneralName('6134004');
    expect(missing.list).toEqual([]);
    expect(missing.missingMaster).toBe(true);
  });

  it('skips interaction checks when either list is empty', async () => {
    await expect(checkDrugInteractions([], ['123'])).resolves.toEqual([]);
    await expect(checkDrugInteractions(['111'], [])).resolves.toEqual([]);
    expect(httpClient.put).not.toHaveBeenCalled();
  });

  it('maps drug interaction responses with severity', async () => {
    vi.mocked(httpClient.put).mockResolvedValue({
      data: {
        list: [
          { srycd1: '111', srycd2: '222', sskijo: 'ショック', syojyoucd: 'A01' },
          { srycd1: null, srycd2: '333' },
        ],
      },
    } as never);

    const result = await checkDrugInteractions(['111'], ['222']);

    expect(httpClient.put).toHaveBeenCalledWith('/orca/interaction', { codes1: ['111'], codes2: ['222'] });
    expect(result).toEqual([
      {
        code1: '111',
        code2: '222',
        symptomCode: 'A01',
        symptomDescription: 'ショック',
        severity: 'critical',
      },
    ]);
  });

  it('throws validation error when zipcode format is invalid', async () => {
    await expect(lookupAddressMaster('123-45')).rejects.toBeInstanceOf(OrcaValidationError);
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('wraps server 422 as OrcaValidationError with audit meta', async () => {
    vi.mocked(httpClient.get).mockImplementation(async (url: string) => {
      if (url.includes('/address')) {
        throw {
          isAxiosError: true,
          response: { status: 422, data: { runId: '20251124T170000Z' } },
        };
      }
      return { data: { list: [] } } as never;
    });

    await expect(lookupAddressMaster('1234567', { sourceHint: 'server' })).rejects.toMatchObject({
      meta: expect.objectContaining({ validationError: true, runId: '20251124T170000Z', missingMaster: false }),
      userMessage: expect.stringContaining('郵便番号'),
    });
  });

  it('resolves source hint and previous source for bridge fetches', () => {
    const result = resolveOrcaMasterSource('ORCA08', { sourceHint: 'snapshot', previousSource: 'mock' });
    expect(result.dataSource).toBe('snapshot');
    expect(result.dataSourceTransition).toEqual({ from: 'mock', to: 'snapshot', reason: 'hint_applied' });
    expect(result.attemptOrder[0]).toBe('snapshot');
  });

  it('falls back to snapshot when server bridge fetch fails', async () => {
    vi.mocked(httpClient.get).mockRejectedValueOnce(new Error('network down'));

    const response = await fetchOrca08BridgeMasters({ sourceHint: 'server' });

    expect(httpClient.get).toHaveBeenCalled();
    expect(response.dataSource).toBe('snapshot');
    expect(response.fallbackUsed).toBe(true);
    expect(response.missingMaster).toBe(false);
    expect(response.list).toHaveLength(etensuMasterResponse.list.length);
  });

  it('returns server data with audit meta when bridge fetch succeeds', async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({
      data: {
        list: [
          {
            etensuCategory: '1',
            medicalFeeCode: '100001',
            name: '初診料',
            points: 50,
            startDate: '20250101',
            endDate: '99999999',
            tensuVersion: '2025-01',
          },
        ],
        totalCount: 1,
        fetchedAt: '2025-01-01T00:00:00Z',
        dataSource: 'server',
        cacheHit: true,
        missingMaster: false,
        fallbackUsed: false,
        runId: 'RUN-SERVER',
        snapshotVersion: '2025-01',
        version: '20250101',
      },
    } as never);

    const response = await fetchOrca08BridgeMasters({ sourceHint: 'server' });

    expect(response.dataSource).toBe('server');
    expect(response.cacheHit).toBe(true);
    expect(response.runId).toBe('RUN-SERVER');
    expect(response.list[0]).toMatchObject({
      tensuCode: '100001',
      name: '初診料',
      tanka: 50,
      tensuVersion: '2025-01',
    });
  });
});

