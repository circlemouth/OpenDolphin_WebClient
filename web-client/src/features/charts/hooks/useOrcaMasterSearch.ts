import { useMutation } from '@tanstack/react-query';

import {
  lookupGeneralName,
  searchDiseaseByName,
  searchTensuByName,
  searchTensuByPointRange,
  type TensuSearchOptions,
} from '@/features/charts/api/orca-api';
import type { DiseaseMasterEntry, GeneralNameEntry, TensuMasterEntry } from '@/features/charts/types/orca';

export const useTensuSearch = () =>
  useMutation<TensuMasterEntry[], Error, { keyword: string; options?: TensuSearchOptions }>({
    mutationFn: async ({ keyword, options }) => searchTensuByName(keyword, options),
  });

export const useTensuPointSearch = () =>
  useMutation<TensuMasterEntry[], Error, { min?: number | null; max?: number | null; date?: Date | null }>({
    mutationFn: async ({ min, max, date }) => searchTensuByPointRange({ min, max, date }),
  });

export const useDiseaseSearch = () =>
  useMutation<DiseaseMasterEntry[], Error, { keyword: string; options?: { partialMatch?: boolean; date?: Date } }>({
    mutationFn: async ({ keyword, options }) => searchDiseaseByName(keyword, options),
  });

export const useGeneralNameLookup = () =>
  useMutation<GeneralNameEntry | null, Error, { code: string }>({
    mutationFn: async ({ code }) => lookupGeneralName(code),
  });
