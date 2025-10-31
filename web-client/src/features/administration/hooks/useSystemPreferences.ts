import { useMutation, useQuery } from '@tanstack/react-query';

import {
  fetchActivities,
  fetchServerInfoSnapshot,
  registerFacilityAdmin,
  submitLicenseToken,
  triggerCloudZeroReport,
} from '@/features/administration/api/system-api';
import type { ActivityQueryOptions } from '@/features/administration/api/system-api';

export const serverInfoQueryKey = ['administration', 'serverinfo'] as const;

export const useServerInfoSnapshot = () =>
  useQuery({
    queryKey: serverInfoQueryKey,
    queryFn: fetchServerInfoSnapshot,
    refetchInterval: 1000 * 60,
  });

export const activitiesQueryKey = (options: ActivityQueryOptions) =>
  ['administration', 'activities', options.year, options.month, options.count] as const;

export const useActivitiesQuery = (options: ActivityQueryOptions, enabled = true) =>
  useQuery({
    queryKey: activitiesQueryKey(options),
    queryFn: () => fetchActivities(options),
    enabled,
    staleTime: 1000 * 60,
  });

export const useLicenseSubmission = () =>
  useMutation({
    mutationFn: submitLicenseToken,
  });

export const useCloudZeroTrigger = () =>
  useMutation({
    mutationFn: triggerCloudZeroReport,
  });

export const useFacilityAdminRegistration = () =>
  useMutation({
    mutationFn: registerFacilityAdmin,
  });
