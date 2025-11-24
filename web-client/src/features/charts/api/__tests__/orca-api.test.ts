import { beforeEach, describe, expect, it, vi } from 'vitest';

import { httpClient } from '@/libs/http';
import {
  checkDrugInteractions,
  lookupAddressMaster,
  lookupGeneralName,
  searchDiseaseByName,
  searchTensuByName,
  searchTensuByPointRange,
} from '@/features/charts/api/orca-api';
import { OrcaValidationError } from '@/features/charts/utils/orcaMasterValidation';

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

  it('returns empty array when search keyword is blank', async () => {
    await expect(searchTensuByName('   ')).resolves.toEqual([]);
    expect(httpClient.get).not.toHaveBeenCalled();

    await expect(searchDiseaseByName('')).resolves.toEqual([]);
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('fetches and maps tensu master entries', async () => {
    const date = new Date('2026-04-01T00:00:00Z');
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          {
            srycd: '123456',
            name: '内服薬',
            kananame: 'ナイフギャク',
            taniname: '回',
            ten: '12.5',
            nyugaitekkbn: '0',
          },
          {
            srycd: null,
            name: '無効データ',
          },
        ],
      },
    } as never);

    const endpoint = `/orca/tensu/name/${encodeURIComponent('内服薬,20260401,false')}/`;
    const result = await searchTensuByName('内服薬', { partialMatch: false, date });

    expect(httpClient.get).toHaveBeenCalledWith(endpoint);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      code: '123456',
      name: '内服薬',
      point: 12.5,
      routeFlag: undefined,
    });
  });

  it('fetches tensu entries by point range with optional date', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { list: [{ srycd: '001', name: '初診料', ten: '50' }] },
    } as never);

    const result = await searchTensuByPointRange({ min: 50, max: 100, date: new Date('2026-05-01') });
    const endpoint = `/orca/tensu/ten/${encodeURIComponent('50-100,20260501')}/`;

    expect(httpClient.get).toHaveBeenCalledWith(endpoint);
    expect(result).toEqual([
      {
        code: '001',
        name: '初診料',
        kana: undefined,
        unitName: undefined,
        point: 50,
        startDate: undefined,
        endDate: undefined,
        yakkaCode: undefined,
        inpatientFlag: undefined,
        routeFlag: undefined,
        categoryFlag: undefined,
      },
    ]);
  });

  it('returns empty array when point range is invalid', async () => {
    await expect(searchTensuByPointRange({ min: null, max: null })).resolves.toEqual([]);
    await expect(searchTensuByPointRange({ min: 200, max: 100 })).resolves.toEqual([]);
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
    expect(result).toEqual([
      { code: 'A001', name: '感冒', icd10: 'J00', validUntil: '2026-12-31', kana: undefined },
    ]);
  });

  it('looks up general name codes and returns null for incomplete payloads', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: { code: '6134004', name: 'アセトアミノフェン' } } as never);

    await expect(lookupGeneralName('   ')).resolves.toBeNull();
    expect(httpClient.get).not.toHaveBeenCalled();

    const result = await lookupGeneralName('6134004');
    expect(httpClient.get).toHaveBeenCalledWith('/orca/general/6134004');
    expect(result).toEqual({ code: '6134004', name: 'アセトアミノフェン' });

    vi.mocked(httpClient.get).mockResolvedValue({ data: { code: null, name: null } } as never);
    await expect(lookupGeneralName('6134004')).resolves.toBeNull();
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
    vi.mocked(httpClient.get).mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { runId: '20251124T170000Z' } },
    } as never);

    await expect(lookupAddressMaster('1234567')).rejects.toMatchObject({
      meta: expect.objectContaining({ validationError: true, runId: '20251124T170000Z', missingMaster: false }),
      userMessage: expect.stringContaining('郵便番号'),
    });
  });
});

