import { describe, expect, it, vi, beforeEach } from 'vitest';

import { httpClient } from '@/libs/http';
import {
  buildPatientSearchPath,
  createPatient,
  fetchPatientById,
  searchPatients,
  updatePatient,
} from '@/features/patients/api/patient-api';

vi.mock('@/libs/http', async () => {
  const actual = await vi.importActual<typeof import('@/libs/http')>('@/libs/http');
  return {
    ...actual,
    httpClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
    },
  };
});

describe('patient-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.get).mockReset();
    vi.mocked(httpClient.post).mockReset();
    vi.mocked(httpClient.put).mockReset();
  });

  it('builds search path with encoded keyword', () => {
    expect(buildPatientSearchPath({ mode: 'name', keyword: '山田 太郎' })).toBe('/patient/name/%E5%B1%B1%E7%94%B0%20%E5%A4%AA%E9%83%8E');
    expect(buildPatientSearchPath({ mode: 'id', keyword: '000123' })).toBe('/patient/id/000123');
  });

  it('returns empty array when keyword is blank', async () => {
    const result = await searchPatients({ mode: 'name', keyword: '   ' });
    expect(result).toEqual([]);
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('maps and filters patient resources', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        list: [
          {
            id: 1,
            patientId: '0001-01',
            fullName: '山田 太郎',
            kanaName: 'ヤマダ タロウ',
            genderDesc: '男性',
            pvtDate: '2025-01-01',
            appMemo: 'ペニシリン禁忌',
            reserve1: '感染症注意',
          },
          {
            id: null,
            patientId: null,
            fullName: null,
          },
        ],
      },
    } as never);

    const result = await searchPatients({ mode: 'name', keyword: '山田' });

    expect(httpClient.get).toHaveBeenCalledWith('/patient/name/%E5%B1%B1%E7%94%B0');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      patientId: '0001-01',
      safetyNotes: ['ペニシリン禁忌', '感染症注意'],
    });
  });

  it('fetches patient detail and normalizes fields', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: {
        id: 10,
        patientId: '0001-01',
        fullName: '山田 太郎',
        kanaName: 'ヤマダ タロウ',
        gender: 'M',
        genderDesc: '男性',
        birthday: '1980-01-01',
        memo: '訪問看護あり',
        appMemo: '感染症注意',
        telephone: '03-1234-5678',
        email: 'taro@example.com ',
        simpleAddressModel: { zipCode: '123-4567', address: '東京都港区' },
        reserve1: '在宅酸素',
        healthInsurances: [
          { id: 1, beanBytes: Buffer.from('<xml>', 'utf-8').toString('base64') },
          { id: 2, beanBytes: null },
        ],
      },
    } as never);

    const result = await fetchPatientById(' 0001-01 ');

    expect(httpClient.get).toHaveBeenCalledWith('/patient/id/0001-01');
    expect(result).not.toBeNull();
    expect(result?.memo).toBe('訪問看護あり');
    expect(result?.email).toBe('taro@example.com');
    expect(result?.address).toEqual({ zipCode: '123-4567', address: '東京都港区' });
    expect(result?.healthInsurances).toHaveLength(1);
    expect(result?.safetyNotes).toContain('感染症注意');
  });

  it('returns null when patient id is blank or response empty', async () => {
    expect(await fetchPatientById(' ')).toBeNull();

    vi.mocked(httpClient.get).mockResolvedValue({ data: null } as never);
    expect(await fetchPatientById('0001')).toBeNull();
  });

  it('creates patient with sanitized payload', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: '101' } as never);

    const payload = {
      patientId: ' 0001-02 ',
      fullName: '佐藤 花子 ',
      kanaName: 'サトウ ハナコ',
      gender: 'F',
      birthday: '1990-03-10',
      memo: 'アレルギー有り ',
      address: { zipCode: '100-0001', address: '東京都千代田区 ' },
      healthInsurances: [{ beanBytes: 'YmVhbg==', id: undefined }],
    };

    const result = await createPatient(payload);

    expect(result).toBe('101');
    expect(httpClient.post).toHaveBeenCalledWith('/patient', {
      patientId: '0001-02',
      fullName: '佐藤 花子',
      kanaName: 'サトウ ハナコ',
      gender: 'F',
      birthday: '1990-03-10',
      memo: 'アレルギー有り',
      simpleAddressModel: { zipCode: '100-0001', address: '東京都千代田区' },
      healthInsurances: [{ id: undefined, beanBytes: 'YmVhbg==' }],
    });
  });

  it('updates patient and returns response text', async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: '1' } as never);

    const result = await updatePatient({
      id: 10,
      patientId: '0001-01',
      fullName: '山田 太郎',
      gender: 'M',
      healthInsurances: [],
    });

    expect(result).toBe('1');
    expect(httpClient.put).toHaveBeenCalledWith('/patient', expect.objectContaining({ id: 10 }));
  });
});
