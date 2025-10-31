import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createScheduleDocument,
  deleteScheduledVisit,
} from '@/features/schedule/api/schedule-document-api';
import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

vi.mock('@/libs/http', async () => {
  const actual = await vi.importActual<typeof import('@/libs/http')>('@/libs/http');
  return {
    ...actual,
    httpClient: {
      post: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock('@/libs/monitoring', async () => {
  const actual = await vi.importActual<typeof import('@/libs/monitoring')>('@/libs/monitoring');
  return {
    ...actual,
    measureApiPerformance: vi.fn((_, __, fn: () => Promise<unknown>) => fn()),
  };
});

describe('schedule-document-api', () => {
  beforeEach(() => {
    vi.mocked(httpClient.post).mockReset();
    vi.mocked(httpClient.delete).mockReset();
    vi.mocked(measureApiPerformance).mockClear();
  });

  it('creates schedule document with normalized payload', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: '1' } as never);

    const count = await createScheduleDocument({
      visitId: 2001,
      patientPk: 3001,
      scheduleDate: '2026-05-25',
      providerId: 4001,
      sendClaim: true,
    });

    expect(count).toBe(1);
    expect(httpClient.post).toHaveBeenCalledWith('/schedule/document', {
      pvtPK: 2001,
      ptPK: 3001,
      scheduleDate: new Date(2026, 4, 25).getTime(),
      phPK: 4001,
      sendClaim: true,
    });
  });

  it('deletes scheduled visit with compound identifier', async () => {
    vi.mocked(httpClient.delete).mockResolvedValue({} as never);

    await deleteScheduledVisit({ visitId: 55, patientPk: 99, scheduleDate: '2026-05-25' });

    expect(httpClient.delete).toHaveBeenCalledWith('/schedule/pvt/55,99,2026-05-25');
  });
});
