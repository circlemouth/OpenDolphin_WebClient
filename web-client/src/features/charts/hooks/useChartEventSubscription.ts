import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { subscribeChartEvent } from '@/features/charts/api/chart-event-api';
import { CHART_EVENT_TYPES } from '@/features/charts/types/chart-event';
import type { RawChartEvent } from '@/features/charts/types/chart-event';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { patientVisitsQueryKey } from '@/features/charts/hooks/usePatientVisits';
import { buildSafetyNotes } from '@/features/patients/utils/safety-notes';

const resolveMemo = (visit: PatientVisitSummary, event: RawChartEvent) => {
  if (event.eventType === CHART_EVENT_TYPES.PVT_MEMO) {
    return event.memo ?? visit.memo ?? null;
  }
  if (event.memo !== undefined) {
    return event.memo;
  }
  const eventVisitMemo = event.patientVisitModel?.memo;
  if (eventVisitMemo !== undefined) {
    return eventVisitMemo;
  }
  return visit.memo ?? null;
};

const updateVisitFromEvent = (visit: PatientVisitSummary, event: RawChartEvent): PatientVisitSummary => {
  const nextState = event.state ?? event.patientVisitModel?.state ?? visit.state;
  const ownerUuid = event.ownerUUID ?? event.patientVisitModel?.patientModel?.ownerUUID ?? null;
  const memo = resolveMemo(visit, event);

  const safetyNotes = buildSafetyNotes([
    visit.raw.patientModel?.appMemo,
    visit.raw.patientModel?.reserve1,
    visit.raw.patientModel?.reserve2,
    visit.raw.patientModel?.reserve3,
    visit.raw.patientModel?.reserve4,
    visit.raw.patientModel?.reserve5,
    visit.raw.patientModel?.reserve6,
    memo ?? undefined,
  ]);

  const rawVisit = {
    ...visit.raw,
    state: nextState,
    memo: memo ?? undefined,
    patientModel: {
      ...visit.raw.patientModel,
      ownerUUID: ownerUuid ?? undefined,
    },
  };

  return {
    ...visit,
    state: nextState,
    ownerUuid,
    memo: memo ?? undefined,
    safetyNotes,
    raw: rawVisit,
  };
};

export const useChartEventSubscription = () => {
  const queryClient = useQueryClient();
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    const controller = new AbortController();

    const loop = async () => {
      while (isActiveRef.current) {
        try {
          const event = await subscribeChartEvent({ signal: controller.signal });
          if (event && event.pvtPk) {
            queryClient.setQueryData<PatientVisitSummary[] | undefined>(patientVisitsQueryKey, (current) => {
              if (!current) {
                return current;
              }
              return current.map((visit) => (visit.visitId === event.pvtPk ? updateVisitFromEvent(visit, event) : visit));
            });
          }
        } catch (error) {
          if (axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')) {
            break;
          }
          if (!isActiveRef.current) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };

    void loop();

    return () => {
      isActiveRef.current = false;
      controller.abort();
    };
  }, [queryClient]);
};
