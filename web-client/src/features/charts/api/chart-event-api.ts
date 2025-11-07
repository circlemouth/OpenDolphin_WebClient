import axios from 'axios';

import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { CHART_EVENT_TYPES } from '@/features/charts/types/chart-event';
import type { ChartEventType, RawChartEvent } from '@/features/charts/types/chart-event';
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
  nextState?: number;
  ownerUuid?: string | null;
  memo?: string | null;
  eventType?: ChartEventType;
}

export const publishChartEvent = async ({
  visit,
  nextState,
  ownerUuid,
  memo,
  eventType,
}: ChartEventRequest) => {
  const resolvedState = nextState ?? visit.state;
  const resolvedOwnerUuid = ownerUuid ?? visit.ownerUuid ?? null;
  const resolvedMemo = memo ?? visit.memo ?? null;
  const payload: RawChartEvent = {
    eventType: eventType ?? CHART_EVENT_TYPES.PVT_STATE,
    pvtPk: visit.visitId,
    state: resolvedState,
    ownerUUID: resolvedOwnerUuid,
    facilityId: visit.facilityId,
    memo: resolvedMemo ?? undefined,
    ptPk: visit.patientPk,
    patientModel: {
      ...visit.raw.patientModel,
      ownerUUID: resolvedOwnerUuid ?? undefined,
    },
    patientVisitModel: {
      ...visit.raw,
      state: resolvedState,
      memo: resolvedMemo ?? undefined,
      patientModel: {
        ...visit.raw.patientModel,
        ownerUUID: resolvedOwnerUuid ?? undefined,
      },
    },
  };

  const response = await httpClient.put<string>('/chartEvent/event', payload);
  return response.data;
};
