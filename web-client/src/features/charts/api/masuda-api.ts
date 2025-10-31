import { httpClient } from '@/libs/http';

export interface RoutineMedicationModuleInfo {
  stampName?: string;
  entity?: string;
  stampId?: string | null;
}

export interface RoutineMedicationModule {
  moduleInfoBean?: RoutineMedicationModuleInfo | null;
  beanBytes?: string | null;
  model?: unknown;
}

export interface RoutineMedicationEntry {
  id?: number;
  name?: string;
  memo?: string;
  category?: string | null;
  moduleList?: RoutineMedicationModule[] | null;
  lastUpdated?: string | null;
}

export interface RpHistoryDrug {
  srycd?: string;
  srysyukbn?: string;
  name?: string;
  amount?: string;
  dose?: string;
  usage?: string;
  days?: string;
  memo?: string;
}

export interface RpHistoryEntry {
  issuedDate?: string;
  memo?: string;
  rpList?: RpHistoryDrug[] | null;
}

export interface UserPropertyEntry {
  id?: number;
  name?: string;
  value?: string;
  description?: string;
  category?: string;
  updateAt?: string;
}

const buildQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query.length ? `?${query}` : '';
};

export const fetchRoutineMedications = async (
  karteId: number,
  options?: { firstResult?: number; maxResults?: number },
) => {
  const endpoint = `/karte/routineMed/list/${karteId}${buildQueryString({
    firstResult: options?.firstResult,
    maxResults: options?.maxResults,
  })}`;
  const response = await httpClient.get<RoutineMedicationEntry[]>(endpoint);
  return response.data ?? [];
};

export const fetchRpHistory = async (
  karteId: number,
  params: { fromDate?: string; toDate?: string; lastOnly?: boolean } = {},
) => {
  const endpoint = `/karte/rpHistory/list/${karteId}${buildQueryString({
    fromDate: params.fromDate,
    toDate: params.toDate,
    lastOnly: params.lastOnly,
  })}`;
  const response = await httpClient.get<RpHistoryEntry[][]>(endpoint);
  // API は日付ごとに複数 RP を返すため flatten する
  const data = response.data ?? [];
  return data.flat().filter(Boolean);
};

export const fetchUserProperties = async (userId: string) => {
  const endpoint = `/karte/userProperty/${encodeURIComponent(userId)}`;
  const response = await httpClient.get<UserPropertyEntry[]>(endpoint);
  return response.data ?? [];
};
