import { beforeEach, describe, expect, it, vi } from 'vitest';

import { updatePatientMemo } from '@/features/patients/api/patient-memo-api';
import { httpClient } from '@/libs/http';
import type { AuthSession } from '@/libs/auth';

vi.mock('@/libs/http', async () => {
  const actual = await vi.importActual<typeof import('@/libs/http')>('@/libs/http');
  return {
    ...actual,
    httpClient: {
      put: vi.fn(),
    },
  };
});

describe('patient-memo-api', () => {
  const session: AuthSession = {
    credentials: {
      facilityId: 'FAC001',
      userId: 'doctor01',
      passwordMd5: 'hashed',
      clientUuid: 'uuid-1234',
    },
    userProfile: {
      displayName: '山田 太郎',
      userModelId: 42,
      facilityId: 'FAC001',
      userId: 'doctor01',
    },
  };

  beforeEach(() => {
    vi.mocked(httpClient.put).mockReset();
  });

  it('sends PUT request with trimmed memo and identifiers', async () => {
    vi.mocked(httpClient.put).mockResolvedValue({ data: '1' } as never);

    await updatePatientMemo({ memoId: 10, karteId: 99, memo: '  注意事項  ', session });

    expect(httpClient.put).toHaveBeenCalledTimes(1);
    const [endpoint, payload] = vi.mocked(httpClient.put).mock.calls[0];
    expect(endpoint).toBe('/karte/memo');
    expect(payload).toMatchObject({
      id: 10,
      memo: '注意事項',
      status: 'F',
      karteBean: { id: 99 },
      userModel: {
        id: 42,
        userId: 'FAC001:doctor01',
        commonName: '山田 太郎',
      },
    });
    expect(typeof (payload as { confirmed: string }).confirmed).toBe('string');
  });

  it('falls back to login id when profile is missing', async () => {
    const minimalSession: AuthSession = {
      credentials: {
        facilityId: 'FAC002',
        userId: 'staff01',
        passwordMd5: 'x',
        clientUuid: 'uuid-5678',
      },
    };

    vi.mocked(httpClient.put).mockResolvedValue({ data: '1' } as never);

    await updatePatientMemo({ memoId: null, karteId: 55, memo: '', session: minimalSession });

    const [, payload] = vi.mocked(httpClient.put).mock.calls[0];
    expect(payload).toMatchObject({
      id: 0,
      memo: '',
      userModel: {
        id: 0,
        userId: 'FAC002:staff01',
        commonName: 'staff01',
      },
    });
  });
});
