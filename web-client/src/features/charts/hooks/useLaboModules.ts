import { useQuery } from '@tanstack/react-query';

import { fetchLaboItemTrend, fetchLaboModules } from '@/features/charts/api/labo-api';
import type { LaboModule, LaboTrendEntry } from '@/features/charts/types/labo';

export const laboModulesQueryKey = (patientId: string | null, limit: number) =>
  ['charts', 'labo', 'modules', patientId, limit] as const;

export const useLaboModules = (patientId: string | null, limit = 50) =>
  useQuery<LaboModule[]>({
    queryKey: laboModulesQueryKey(patientId, limit),
    queryFn: () => (patientId ? fetchLaboModules(patientId, { limit }) : Promise.resolve([])),
    enabled: Boolean(patientId),
    staleTime: 1000 * 60,
  });

export const laboTrendQueryKey = (patientId: string | null, itemCode: string | null, limit: number) =>
  ['charts', 'labo', 'trend', patientId, itemCode, limit] as const;

export const useLaboItemTrend = (patientId: string | null, itemCode: string | null, limit = 24) =>
  useQuery<LaboTrendEntry[]>({
    queryKey: laboTrendQueryKey(patientId, itemCode, limit),
    queryFn: () => (patientId && itemCode ? fetchLaboItemTrend(patientId, itemCode, { limit }) : Promise.resolve([])),
    enabled: Boolean(patientId && itemCode),
    staleTime: 1000 * 60,
  });
