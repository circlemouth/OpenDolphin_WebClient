import { useMutation } from '@tanstack/react-query';

import {
  lookupGeneralName,
  searchDiseaseByName,
  searchTensuByName,
  searchTensuByPointRange,
  type TensuSearchOptions,
} from '@/features/charts/api/orca-api';
import type { DiseaseMasterEntry, GeneralNameEntry, TensuMasterEntry } from '@/features/charts/types/orca';
import type { OrcaMasterListResponse } from '@/types/orca';

export const useTensuSearch = () =>
  useMutation<OrcaMasterListResponse<TensuMasterEntry>, Error, { keyword: string; options?: TensuSearchOptions }>({
    mutationFn: async ({ keyword, options }) => searchTensuByName(keyword, options),
  });

export const useTensuPointSearch = () =>
  useMutation<
    OrcaMasterListResponse<TensuMasterEntry>,
    Error,
    { min?: number | null; max?: number | null; date?: Date | null } & TensuSearchOptions
  >({
    mutationFn: async ({ min, max, date, ...options }) =>
      searchTensuByPointRange({ min, max, date, ...options }),
  });

export const useDiseaseSearch = () =>
  useMutation<
    OrcaMasterListResponse<DiseaseMasterEntry>,
    Error,
    { keyword: string; options?: { partialMatch?: boolean; date?: Date; runId?: string } }
  >({
    mutationFn: async ({ keyword, options }) => searchDiseaseByName(keyword, options),
  });

export const useGeneralNameLookup = () =>
  useMutation<OrcaMasterListResponse<GeneralNameEntry>, Error, { code: string; options?: { runId?: string } }>({
    mutationFn: async ({ code, options }) => lookupGeneralName(code, options),
  });
