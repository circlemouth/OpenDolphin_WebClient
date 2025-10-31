import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';

import type {
  DiseaseMasterEntry,
  DrugInteractionEntry,
  GeneralNameEntry,
  TensuMasterEntry,
} from '@/features/charts/types/orca';
import { determineInteractionSeverity } from '@/features/charts/utils/interactionSeverity';
import type { ModuleListPayload, ModuleModelPayload } from '@/features/charts/types/module';

interface RawTensuMaster {
  srycd?: string | null;
  name?: string | null;
  kananame?: string | null;
  taniname?: string | null;
  ten?: string | null;
  ykzkbn?: string | null;
  nyugaitekkbn?: string | null;
  routekkbn?: string | null;
  srysyukbn?: string | null;
  yukostymd?: string | null;
  yukoedymd?: string | null;
}

interface RawTensuListResponse {
  list?: RawTensuMaster[] | null;
}

interface RawDiseaseEntry {
  code?: string | null;
  name?: string | null;
  kana?: string | null;
  icdTen?: string | null;
  disUseDate?: string | null;
}

interface RawDiseaseListResponse {
  list?: RawDiseaseEntry[] | null;
}

interface RawGeneralNameResponse {
  code?: string | null;
  name?: string | null;
}

interface RawDrugInteraction {
  srycd1?: string | null;
  srycd2?: string | null;
  sskijo?: string | null;
  syojyoucd?: string | null;
}

interface RawDrugInteractionListResponse {
  list?: RawDrugInteraction[] | null;
}

const formatOrcaDate = (inputDate?: Date): string => {
  const date = inputDate ?? new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

const mapTensuMaster = (entry: RawTensuMaster): TensuMasterEntry | null => {
  const code = entry.srycd?.trim();
  const name = entry.name?.trim();
  if (!code || !name) {
    return null;
  }

  const point = entry.ten ? Number.parseFloat(entry.ten) : null;

  return {
    code,
    name,
    kana: entry.kananame ?? undefined,
    unitName: entry.taniname ?? undefined,
    point: Number.isFinite(point ?? NaN) ? point : null,
    startDate: entry.yukostymd ?? undefined,
    endDate: entry.yukoedymd ?? undefined,
    yakkaCode: entry.ykzkbn ?? undefined,
    inpatientFlag: entry.nyugaitekkbn ?? undefined,
    routeFlag: entry.routekkbn ?? undefined,
    categoryFlag: entry.srysyukbn ?? undefined,
  };
};

const mapDiseaseEntry = (entry: RawDiseaseEntry): DiseaseMasterEntry | null => {
  const code = entry.code?.trim();
  const name = entry.name?.trim();
  if (!code || !name) {
    return null;
  }
  return {
    code,
    name,
    kana: entry.kana ?? undefined,
    icd10: entry.icdTen ?? undefined,
    validUntil: entry.disUseDate ?? undefined,
  };
};

const mapDrugInteraction = (entry: RawDrugInteraction): DrugInteractionEntry | null => {
  const code1 = entry.srycd1?.trim();
  const code2 = entry.srycd2?.trim();
  if (!code1 || !code2) {
    return null;
  }
  return {
    code1,
    code2,
    symptomCode: entry.syojyoucd ?? undefined,
    symptomDescription: entry.sskijo ?? undefined,
    severity: determineInteractionSeverity({
      code1,
      code2,
      symptomCode: entry.syojyoucd ?? undefined,
      symptomDescription: entry.sskijo ?? undefined,
    }),
  };
};

const buildParam = (parts: (string | number | boolean)[]) =>
  encodeURIComponent(parts.map((part) => String(part)).join(','));

export interface TensuSearchOptions {
  partialMatch?: boolean;
  date?: Date;
}

export const searchTensuByName = async (
  keyword: string,
  options?: TensuSearchOptions,
): Promise<TensuMasterEntry[]> => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }
  const now = formatOrcaDate(options?.date);
  const partial = options?.partialMatch ?? true;
  const endpoint = `/orca/tensu/name/${buildParam([trimmed, now, partial])}/`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawTensuListResponse>(endpoint);
      const list = response.data?.list ?? [];
      return list.map(mapTensuMaster).filter((item): item is TensuMasterEntry => Boolean(item));
    },
    {
      keyword: trimmed,
      partial,
      date: options?.date?.toISOString(),
    },
  );
};

export const searchDiseaseByName = async (
  keyword: string,
  options?: { partialMatch?: boolean; date?: Date },
): Promise<DiseaseMasterEntry[]> => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return [];
  }
  const now = formatOrcaDate(options?.date);
  const partial = options?.partialMatch ?? true;
  const endpoint = `/orca/disease/name/${buildParam([trimmed, now, partial])}/`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawDiseaseListResponse>(endpoint);
      const list = response.data?.list ?? [];
      return list.map(mapDiseaseEntry).filter((item): item is DiseaseMasterEntry => Boolean(item));
    },
    {
      keyword: trimmed,
      partial,
      date: options?.date?.toISOString(),
    },
  );
};

export const lookupGeneralName = async (code: string): Promise<GeneralNameEntry | null> => {
  const trimmed = code.trim();
  if (!trimmed) {
    return null;
  }
  const endpoint = `/orca/general/${encodeURIComponent(trimmed)}`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawGeneralNameResponse>(endpoint);
      const payload = response.data;
      if (!payload?.code || !payload.name) {
        return null;
      }
      return {
        code: payload.code,
        name: payload.name,
      };
    },
    { keyword: trimmed },
  );
};

export const checkDrugInteractions = async (
  codes1: string[],
  codes2: string[],
): Promise<DrugInteractionEntry[]> => {
  if (codes1.length === 0 || codes2.length === 0) {
    return [];
  }
  const payload = {
    codes1,
    codes2,
  };
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    'PUT /orca/interaction',
    async () => {
      const response = await httpClient.put<RawDrugInteractionListResponse>('/orca/interaction', payload);
      const list = response.data?.list ?? [];
      return list.map(mapDrugInteraction).filter((item): item is DrugInteractionEntry => Boolean(item));
    },
    { existingCount: codes2.length, candidateCount: codes1.length },
  );
};

const mapModuleModel = (entry: ModuleModelPayload): ModuleModelPayload | null => {
  if (!entry.moduleInfoBean || !entry.beanBytes) {
    return null;
  }
  return {
    moduleInfoBean: {
      stampName: entry.moduleInfoBean.stampName,
      stampRole: entry.moduleInfoBean.stampRole,
      stampNumber: entry.moduleInfoBean.stampNumber,
      entity: entry.moduleInfoBean.entity,
      stampId: entry.moduleInfoBean.stampId ?? undefined,
    },
    beanBytes: entry.beanBytes,
  };
};

export const fetchOrcaOrderModules = async (code: string, name: string): Promise<ModuleModelPayload[]> => {
  const trimmedCode = code.trim();
  const trimmedName = name.trim();
  if (!trimmedCode || !trimmedName) {
    return [];
  }
  const endpoint = `/orca/stamp/${encodeURIComponent(trimmedCode)},${encodeURIComponent(trimmedName)}`;
  const response = await httpClient.get<ModuleListPayload>(endpoint);
  const payload = response.data;
  if (!payload?.list) {
    return [];
  }
  return payload.list.map(mapModuleModel).filter((module): module is ModuleModelPayload => Boolean(module));
};
