import { useQuery } from '@tanstack/react-query';

import {
  fetchFacilitySchedule,
  type FacilityScheduleEntry,
  type FetchFacilityScheduleParams,
} from '@/features/schedule/api/facility-schedule-api';

export const facilityScheduleQueryKey = (params: FetchFacilityScheduleParams) => [
  'facilitySchedule',
  params.date,
  params.assignedOnly ?? false,
  params.orcaDoctorId ?? null,
  params.unassignedDoctorId ?? null,
] as const;

export const useFacilitySchedule = (params: FetchFacilityScheduleParams) =>
  useQuery<FacilityScheduleEntry[]>({
    queryKey: facilityScheduleQueryKey(params),
    queryFn: () => fetchFacilitySchedule(params),
    enabled: Boolean(params.date),
    staleTime: 1000 * 30,
  });
