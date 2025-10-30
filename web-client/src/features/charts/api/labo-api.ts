import { httpClient } from '@/libs/http';
import { measureApiPerformance } from '@/libs/monitoring';

import type {
  LaboModule,
  LaboTrendEntry,
  RawLaboItem,
  RawLaboItemListResponse,
  RawLaboModule,
  RawLaboModuleListResponse,
} from '@/features/charts/types/labo';

const toIsoString = (value: string | undefined | null): string | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const normalizeLaboItem = (raw: RawLaboItem) => {
  const id = raw.id ?? 0;
  const code = raw.itemCode?.trim();
  const name = raw.itemName?.trim();
  if (!id || !code || !name) {
    return null;
  }

  const comments = [raw.comment1, raw.comment2].filter((value): value is string => Boolean(value?.trim()));

  return {
    id,
    itemCode: code,
    itemName: name,
    valueText: raw.value?.trim() ?? '',
    unit: raw.unit ?? undefined,
    abnormalFlag: raw.abnormalFlg ?? null,
    normalRange: raw.normalValue ?? null,
    sampleDate: toIsoString(raw.sampleDate),
    comments,
    specimenName: raw.specimenName ?? undefined,
    raw,
  };
};

const normalizeLaboModule = (raw: RawLaboModule): LaboModule | null => {
  const id = raw.id ?? 0;
  if (!id) {
    return null;
  }
  const items = (raw.items ?? [])
    .map(normalizeLaboItem)
    .filter((item): item is NonNullable<ReturnType<typeof normalizeLaboItem>> => Boolean(item));

  const numOfItems = Number.parseInt(raw.numOfItems ?? '', 10);
  const itemCount = Number.isNaN(numOfItems) ? items.length : Math.max(items.length, numOfItems);

  return {
    id,
    sampleDate: toIsoString(raw.sampleDate),
    itemCount,
    centerCode: raw.laboCenterCode ?? undefined,
    moduleKey: raw.moduleKey ?? undefined,
    reportFormat: raw.reportFormat ?? undefined,
    items,
    raw,
  };
};

const extractNumeric = (value: string | undefined | null): number | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const sanitized = trimmed.replace(/[^0-9.+-]/g, '');
  if (!sanitized) {
    return null;
  }
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeTrendEntry = (raw: RawLaboItem): LaboTrendEntry | null => {
  const sampleDate = toIsoString(raw.sampleDate);
  if (!sampleDate) {
    return null;
  }
  return {
    sampleDate,
    numericValue: extractNumeric(raw.value),
    valueText: raw.value?.trim() ?? '',
    unit: raw.unit ?? undefined,
    abnormalFlag: raw.abnormalFlg ?? null,
    normalRange: raw.normalValue ?? null,
  };
};

const buildModuleEndpoint = (patientId: string, offset: number, limit: number) =>
  `/lab/module/${encodeURIComponent(`${patientId},${offset},${limit}`)}`;

const buildTrendEndpoint = (patientId: string, itemCode: string, offset: number, limit: number) =>
  `/lab/item/${encodeURIComponent(`${patientId},${offset},${limit},${itemCode}`)}`;

export interface FetchLaboModulesOptions {
  offset?: number;
  limit?: number;
}

export const fetchLaboModules = async (
  patientId: string,
  options: FetchLaboModulesOptions = {},
): Promise<LaboModule[]> => {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  const endpoint = buildModuleEndpoint(patientId, offset, limit);

  return measureApiPerformance(
    'charts.labo.modules.fetch',
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawLaboModuleListResponse>(endpoint);
      const list = response.data?.list ?? [];
      return list
        .map(normalizeLaboModule)
        .filter((module): module is LaboModule => Boolean(module))
        .sort((a, b) => {
          if (!a.sampleDate || !b.sampleDate) {
            return 0;
          }
          return b.sampleDate.localeCompare(a.sampleDate);
        });
    },
    { patientId, offset, limit },
  );
};

export interface FetchLaboTrendOptions {
  offset?: number;
  limit?: number;
}

export const fetchLaboItemTrend = async (
  patientId: string,
  itemCode: string,
  options: FetchLaboTrendOptions = {},
): Promise<LaboTrendEntry[]> => {
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  const endpoint = buildTrendEndpoint(patientId, itemCode, offset, limit);

  return measureApiPerformance(
    'charts.labo.trend.fetch',
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawLaboItemListResponse>(endpoint);
      const list = response.data?.list ?? [];
      return list
        .map(normalizeTrendEntry)
        .filter((entry): entry is LaboTrendEntry => Boolean(entry))
        .sort((a, b) => a.sampleDate.localeCompare(b.sampleDate));
    },
    { patientId, itemCode, offset, limit },
  );
};
