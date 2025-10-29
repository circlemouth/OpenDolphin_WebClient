import axios from 'axios';

import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { RawChartEvent } from '@/features/charts/types/chart-event';
import { httpClient } from '@/libs/http';

interface SubscribeOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export const subscribeChartEvent = async ({
  signal,
  timeoutMs = 60000,
}: SubscribeOptions = {}): Promise<RawChartEvent | null> => {
  try {
    const response = await httpClient.get<RawChartEvent>('/chartEvent/subscribe', {
      signal,
      timeout: timeoutMs,
    });
    return response.data ?? null;
  } catch (error) {
    if (axios.isCancel(error)) {
      return null;
    }
    throw error;
  }
};

export interface ChartEventRequest {
  visit: PatientVisitSummary;
  nextState: number;
  ownerUuid: string | null;
}

export const publishChartEvent = async ({ visit, nextState, ownerUuid }: ChartEventRequest) => {
  const payload: RawChartEvent = {
    eventType: 0,
    pvtPk: visit.visitId,
    state: nextState,
    ownerUUID: ownerUuid,
    facilityId: visit.facilityId,
    memo: visit.memo,
    ptPk: visit.patientPk,
    patientModel: {
      ...visit.raw.patientModel,
      ownerUUID: ownerUuid ?? undefined,
    },
    patientVisitModel: {
      ...visit.raw,
      state: nextState,
      patientModel: {
        ...visit.raw.patientModel,
        ownerUUID: ownerUuid ?? undefined,
      },
    },
  };

  const response = await httpClient.put<string>('/chartEvent/event', payload);
  return response.data;
};
