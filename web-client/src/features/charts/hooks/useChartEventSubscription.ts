import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { subscribeChartEvent } from '@/features/charts/api/chart-event-api';
import type { RawChartEvent } from '@/features/charts/types/chart-event';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import { patientVisitsQueryKey } from '@/features/charts/hooks/usePatientVisits';

const updateVisitFromEvent = (visit: PatientVisitSummary, event: RawChartEvent): PatientVisitSummary => {
  const nextState = event.state ?? visit.state;
  const ownerUuid = event.ownerUUID ?? null;
  const rawVisit = {
    ...visit.raw,
    state: nextState,
    patientModel: {
      ...visit.raw.patientModel,
      ownerUUID: ownerUuid ?? undefined,
    },
  };

  return {
    ...visit,
    state: nextState,
    ownerUuid,
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
