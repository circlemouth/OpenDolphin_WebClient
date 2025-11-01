import { useMemo } from 'react';

import { useDocInfos } from '@/features/charts/hooks/useDocInfos';
import { usePatientVisits } from '@/features/charts/hooks/usePatientVisits';
import { useLaboModules } from '@/features/charts/hooks/useLaboModules';
import {
  buildTimelineEvents,
  type BuildTimelineEventsOptions,
  type TimelineEvent,
  type TimelineOrderSource,
  type TimelinePlanCardSource,
} from '@/features/charts/utils/timeline-events';
import type { DocInfoSummary } from '@/features/charts/types/doc';
import type { PatientVisitSummary } from '@/features/charts/types/patient-visit';
import type { LaboModule } from '@/features/charts/types/labo';

export interface UseTimelineEventsOptions {
  karteId: number | null;
  fromDate: string;
  includeModified?: boolean;
  patientId: string | null;
  orderSources?: TimelineOrderSource[];
  planCards?: TimelinePlanCardSource[];
  labLimit?: number;
}

export interface UseTimelineEventsResult {
  events: TimelineEvent[];
  documents: DocInfoSummary[];
  visits: PatientVisitSummary[];
  labModules: LaboModule[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  labError: unknown;
  refetch: () => Promise<void>;
}

export const useTimelineEvents = ({
  karteId,
  fromDate,
  includeModified = true,
  patientId,
  orderSources,
  planCards,
  labLimit = 24,
}: UseTimelineEventsOptions): UseTimelineEventsResult => {
  const docInfosQuery = useDocInfos({
    karteId,
    fromDate,
    includeModified,
    enabled: Boolean(karteId),
  });

  const patientVisitsQuery = usePatientVisits();
  const labModulesQuery = useLaboModules(patientId, labLimit);

  const filteredVisits = useMemo(() => {
    if (!patientId) {
      return [] as PatientVisitSummary[];
    }
    return (patientVisitsQuery.data ?? []).filter((visit) => visit.patientId === patientId);
  }, [patientId, patientVisitsQuery.data]);

  const buildOptions: BuildTimelineEventsOptions = useMemo(
    () => ({
      documents: docInfosQuery.data ?? [],
      visits: filteredVisits,
      labModules: labModulesQuery.data ?? [],
      orderSources,
      planCards,
    }),
    [docInfosQuery.data, filteredVisits, labModulesQuery.data, orderSources, planCards],
  );

  const events = useMemo<TimelineEvent[]>(
    () => buildTimelineEvents(buildOptions),
    [buildOptions],
  );

  const isLoading = docInfosQuery.isLoading || patientVisitsQuery.isLoading || labModulesQuery.isLoading;
  const isFetching = docInfosQuery.isFetching || patientVisitsQuery.isFetching || labModulesQuery.isFetching;
  const error = docInfosQuery.error ?? patientVisitsQuery.error ?? labModulesQuery.error ?? null;

  const refetch = async () => {
    await Promise.all([docInfosQuery.refetch(), patientVisitsQuery.refetch(), labModulesQuery.refetch()]);
  };

  return {
    events,
    documents: docInfosQuery.data ?? [],
    visits: filteredVisits,
    labModules: labModulesQuery.data ?? [],
    isLoading,
    isFetching,
    error,
    labError: labModulesQuery.error ?? null,
    refetch,
  };
};
