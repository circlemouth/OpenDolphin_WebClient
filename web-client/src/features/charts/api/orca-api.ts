import axios from 'axios';
import type {
  DiseaseMasterEntry,
  DrugInteractionEntry,
  GeneralNameEntry,
  TensuMasterEntry,
} from '@/features/charts/types/orca';
import { determineInteractionSeverity } from '@/features/charts/utils/interactionSeverity';
import type { ModuleListPayload, ModuleModelPayload } from '@/features/charts/types/module';
import { httpClient } from '@/libs/http';
import { measureApiPerformance, PERFORMANCE_METRICS } from '@/libs/monitoring';
import { OrcaValidationError, validateOrcaCode } from '@/features/charts/utils/orcaMasterValidation';
import type {
  AddressMasterEntry,
  DosageInstructionMaster,
  DrugClassificationMaster,
  EtensuMasterEntry,
  InsurerMaster,
  LabClassificationMaster,
  MinimumDrugPriceEntry,
  OrcaMasterListResponse,
  Orca05MasterRecord,
  Orca06InsurerAddressRecord,
  Orca08EtensuRecord,
  OrcaMasterSource,
  SpecialEquipmentMaster,
} from '@/types/orca';

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

interface RawDrugClassificationMaster {
  classCode?: string | null;
  className?: string | null;
  kanaName?: string | null;
  categoryCode?: string | null;
  parentClassCode?: string | null;
  isLeaf?: boolean | string | null;
  startDate?: string | null;
  endDate?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  version?: string | null;
}

interface RawMinimumDrugPriceEntry {
  srycd?: string | null;
  drugName?: string | null;
  kanaName?: string | null;
  price?: number | string | null;
  unit?: string | null;
  priceType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  reference?: MinimumDrugPriceEntry['reference'] | null;
  validFrom?: string | null;
  validTo?: string | null;
  version?: string | null;
}

interface RawDosageInstructionMaster {
  youhouCode?: string | null;
  youhouName?: string | null;
  timingCode?: string | null;
  routeCode?: string | null;
  daysLimit?: number | string | null;
  dosePerDay?: number | string | null;
  comment?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  version?: string | null;
}

interface RawSpecialEquipmentMaster {
  materialCode?: string | null;
  materialName?: string | null;
  category?: string | null;
  materialCategory?: string | null;
  insuranceType?: string | null;
  unit?: string | null;
  price?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  maker?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  version?: string | null;
}

interface RawLabClassificationMaster {
  kensaCode?: string | null;
  kensaName?: string | null;
  sampleType?: string | null;
  departmentCode?: string | null;
  classification?: string | null;
  insuranceCategory?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  version?: string | null;
}

interface RawInsurerMaster {
  insurerNumber?: string | null;
  insurerName?: string | null;
  insurerKana?: string | null;
  payerRatio?: number | string | null;
  payerType?: string | null;
  prefectureCode?: string | null;
  prefCode?: string | null;
  cityCode?: string | null;
  zip?: string | null;
  addressLine?: string | null;
  address?: string | null;
  phone?: string | null;
  insurerType?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  version?: string | null;
}

interface RawEtensuMasterEntry {
  etensuCategory?: string | null;
  medicalFeeCode?: string | null;
  name?: string | null;
  points?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  note?: string | null;
  kubun?: string | null;
  unit?: string | null;
  category?: string | null;
  tensuVersion?: string | null;
  version?: string | null;
}

interface RawAddressMasterEntry {
  zipCode?: string | null;
  zip?: string | null;
  prefectureCode?: string | null;
  prefCode?: string | null;
  city?: string | null;
  cityCode?: string | null;
  town?: string | null;
  kana?: string | null;
  roman?: string | null;
  fullAddress?: string | null;
  version?: string | null;
}

const formatOrcaDate = (inputDate?: Date): string => {
  const date = inputDate ?? new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

const toOrcaDateParam = (value?: string | Date | null): string | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : formatOrcaDate(value);
  }
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length >= 8) {
    return digitsOnly.slice(0, 8);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : formatOrcaDate(parsed);
};

const toNullableNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
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

const mapDrugClassification = (entry: RawDrugClassificationMaster): DrugClassificationMaster | null => {
  const classCode = entry.classCode?.trim();
  const className = entry.className?.trim();
  if (!classCode || !className) {
    return null;
  }

  const isLeafValue = entry.isLeaf;

  return {
    classCode,
    className,
    kanaName: entry.kanaName ?? undefined,
    categoryCode: entry.categoryCode ?? undefined,
    parentClassCode: entry.parentClassCode ?? undefined,
    isLeaf:
      typeof isLeafValue === 'boolean'
        ? isLeafValue
        : isLeafValue != null
          ? ['1', 'true', 'TRUE'].includes(String(isLeafValue))
          : undefined,
    startDate: entry.startDate ?? undefined,
    endDate: entry.endDate ?? undefined,
    validFrom: entry.validFrom ?? entry.startDate ?? undefined,
    validTo: entry.validTo ?? entry.endDate ?? undefined,
    version: entry.version ?? undefined,
  };
};

const mapMinimumDrugPrice = (entry: RawMinimumDrugPriceEntry): MinimumDrugPriceEntry | null => {
  const srycd = entry.srycd?.trim();
  const drugName = entry.drugName?.trim();
  if (!srycd || !drugName) {
    return null;
  }

  return {
    srycd,
    drugName,
    kanaName: entry.kanaName ?? undefined,
    price: toNullableNumber(entry.price),
    unit: entry.unit ?? undefined,
    priceType: entry.priceType ?? undefined,
    startDate: entry.startDate ?? undefined,
    endDate: entry.endDate ?? undefined,
    validFrom: entry.validFrom ?? entry.startDate ?? undefined,
    validTo: entry.validTo ?? entry.endDate ?? undefined,
    version: entry.version ?? undefined,
    reference: entry.reference ?? undefined,
  };
};

const mapDosageInstruction = (entry: RawDosageInstructionMaster): DosageInstructionMaster | null => {
  const code = entry.youhouCode?.trim();
  const name = entry.youhouName?.trim();
  if (!code || !name) {
    return null;
  }

  const daysLimit = toNullableNumber(entry.daysLimit);
  const dosePerDay = toNullableNumber(entry.dosePerDay);

  return {
    youhouCode: code,
    youhouName: name,
    timingCode: entry.timingCode ?? undefined,
    routeCode: entry.routeCode ?? undefined,
    daysLimit: daysLimit ?? undefined,
    dosePerDay: dosePerDay ?? undefined,
    comment: entry.comment ?? undefined,
    validFrom: entry.validFrom ?? undefined,
    validTo: entry.validTo ?? undefined,
    version: entry.version ?? undefined,
  };
};

const mapSpecialEquipment = (entry: RawSpecialEquipmentMaster): SpecialEquipmentMaster | null => {
  const materialCode = entry.materialCode?.trim();
  const materialName = entry.materialName?.trim();
  if (!materialCode || !materialName) {
    return null;
  }

  return {
    materialCode,
    materialName,
    category: entry.category ?? undefined,
    materialCategory: entry.materialCategory ?? entry.category ?? undefined,
    insuranceType: entry.insuranceType ?? undefined,
    unit: entry.unit ?? undefined,
    price: toNullableNumber(entry.price),
    startDate: entry.startDate ?? undefined,
    endDate: entry.endDate ?? undefined,
    maker: entry.maker ?? undefined,
    validFrom: entry.validFrom ?? entry.startDate ?? undefined,
    validTo: entry.validTo ?? entry.endDate ?? undefined,
    version: entry.version ?? undefined,
  };
};

const mapLabClassification = (entry: RawLabClassificationMaster): LabClassificationMaster | null => {
  const kensaCode = entry.kensaCode?.trim();
  const kensaName = entry.kensaName?.trim();
  if (!kensaCode || !kensaName) {
    return null;
  }

  return {
    kensaCode,
    kensaName,
    sampleType: entry.sampleType ?? undefined,
    departmentCode: entry.departmentCode ?? undefined,
    classification: entry.classification ?? undefined,
    insuranceCategory: entry.insuranceCategory ?? undefined,
    validFrom: entry.validFrom ?? undefined,
    validTo: entry.validTo ?? undefined,
    version: entry.version ?? undefined,
  };
};

const mapInsurer = (entry: RawInsurerMaster): InsurerMaster | null => {
  const insurerNumber = entry.insurerNumber?.trim();
  const insurerName = entry.insurerName?.trim();
  if (!insurerNumber || !insurerName) {
    return null;
  }

  return {
    insurerNumber,
    insurerName,
    insurerKana: entry.insurerKana ?? undefined,
    prefectureCode: entry.prefectureCode ?? entry.prefCode ?? undefined,
    prefCode: entry.prefCode ?? entry.prefectureCode ?? undefined,
    cityCode: entry.cityCode ?? undefined,
    zip: entry.zip ?? undefined,
    addressLine: entry.addressLine ?? undefined,
    address: entry.address ?? undefined,
    phone: entry.phone ?? undefined,
    insurerType: entry.insurerType ?? undefined,
    payerRatio: toNullableNumber(entry.payerRatio),
    payerType: entry.payerType ?? undefined,
    validFrom: entry.validFrom ?? undefined,
    validTo: entry.validTo ?? undefined,
    version: entry.version ?? undefined,
  };
};

const mapEtensuMaster = (entry: RawEtensuMasterEntry): EtensuMasterEntry | null => {
  const etensuCategory = entry.etensuCategory?.trim();
  const medicalFeeCode = entry.medicalFeeCode?.trim();
  const name = entry.name?.trim();
  const points = toNullableNumber(entry.points);

  if (!etensuCategory || !medicalFeeCode || !name || points === null) {
    return null;
  }

  return {
    etensuCategory,
    category: entry.category ?? etensuCategory,
    medicalFeeCode,
    tensuCode: medicalFeeCode,
    name,
    points,
    tanka: points,
    unit: entry.unit ?? undefined,
    kubun: entry.kubun ?? undefined,
    startDate: entry.startDate ?? undefined,
    endDate: entry.endDate ?? undefined,
    note: entry.note ?? undefined,
    tensuVersion: entry.tensuVersion ?? undefined,
    version: entry.version ?? undefined,
  };
};

const mapAddressMaster = (entry: RawAddressMasterEntry): AddressMasterEntry | null => {
  const zipCode = entry.zipCode?.trim();
  const fullAddress = entry.fullAddress?.trim();
  if (!zipCode && !fullAddress) {
    return null;
  }

  return {
    zipCode: zipCode ?? entry.zip ?? undefined,
    zip: entry.zip ?? zipCode ?? undefined,
    prefectureCode: entry.prefectureCode ?? entry.prefCode ?? undefined,
    prefCode: entry.prefCode ?? entry.prefectureCode ?? undefined,
    city: entry.city ?? undefined,
    cityCode: entry.cityCode ?? undefined,
    town: entry.town ?? undefined,
    kana: entry.kana ?? undefined,
    roman: entry.roman ?? undefined,
    fullAddress: fullAddress ?? undefined,
    version: entry.version ?? undefined,
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

export const fetchOrcaOrderModules = async (
  code: string,
  name: string,
  options?: { visitDate?: string | Date | null },
): Promise<ModuleModelPayload[]> => {
  const trimmedCode = code.trim();
  const trimmedName = name.trim();
  if (!trimmedCode || !trimmedName) {
    return [];
  }
  const parts = [trimmedCode, trimmedName];
  const visitDateToken = toOrcaDateParam(options?.visitDate);
  if (visitDateToken) {
    parts.push(visitDateToken);
  }
  const endpoint = `/orca/stamp/${parts.map((part) => encodeURIComponent(part)).join(',')}`;
  const response = await httpClient.get<ModuleListPayload>(endpoint);
  const payload = response.data;
  if (!payload?.list) {
    return [];
  }
  return payload.list.map(mapModuleModel).filter((module): module is ModuleModelPayload => Boolean(module));
};

export const fetchDrugClassifications = async (): Promise<DrugClassificationMaster[]> => {
  const endpoint = '/orca/master/generic-class';
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<OrcaMasterListResponse<RawDrugClassificationMaster>>(endpoint);
      const list = response.data?.list ?? [];
      return list
        .map(mapDrugClassification)
        .filter((item): item is DrugClassificationMaster => Boolean(item));
    },
  );
};

export const searchTensuByPointRange = async (
  range: { min?: number | null; max?: number | null; date?: Date | null },
): Promise<TensuMasterEntry[]> => {
  const sanitizePoint = (value?: number | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return null;
    }
    const floored = Math.floor(value);
    if (floored < 0 || floored > 9999) {
      return null;
    }
    return floored;
  };

  const minValue = sanitizePoint(range.min);
  const maxValue = sanitizePoint(range.max);

  if (minValue === null && maxValue === null) {
    return [];
  }

  if (minValue !== null && maxValue !== null && minValue > maxValue) {
    return [];
  }

  const rangeToken =
    minValue !== null && maxValue !== null
      ? `${minValue}-${maxValue}`
      : `${minValue ?? maxValue}`;
  const dateToken = toOrcaDateParam(range.date ?? null);
  const endpoint = `/orca/tensu/ten/${encodeURIComponent(
    dateToken ? `${rangeToken},${dateToken}` : rangeToken,
  )}/`;

  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawTensuListResponse>(endpoint);
      const list = response.data?.list ?? [];
      return list.map(mapTensuMaster).filter((item): item is TensuMasterEntry => Boolean(item));
    },
    {
      min: minValue ?? undefined,
      max: maxValue ?? undefined,
      date: range.date ?? undefined,
    },
  );
};

export const fetchMinimumDrugPrices = async (): Promise<MinimumDrugPriceEntry[]> => {
  const endpoint = '/orca/master/generic-price';
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<OrcaMasterListResponse<RawMinimumDrugPriceEntry>>(endpoint);
      const list = response.data?.list ?? [];
      return list
        .map(mapMinimumDrugPrice)
        .filter((item): item is MinimumDrugPriceEntry => Boolean(item));
    },
  );
};

export const fetchDosageInstructions = async (): Promise<DosageInstructionMaster[]> => {
  const endpoint = '/orca/master/youhou';
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<OrcaMasterListResponse<RawDosageInstructionMaster>>(endpoint);
      const list = response.data?.list ?? [];
      return list
        .map(mapDosageInstruction)
        .filter((item): item is DosageInstructionMaster => Boolean(item));
    },
  );
};

export const fetchSpecialEquipments = async (): Promise<SpecialEquipmentMaster[]> => {
  const endpoint = '/orca/master/material';
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<OrcaMasterListResponse<RawSpecialEquipmentMaster>>(endpoint);
      const list = response.data?.list ?? [];
      return list
        .map(mapSpecialEquipment)
        .filter((item): item is SpecialEquipmentMaster => Boolean(item));
    },
  );
};

export const fetchLabClassifications = async (): Promise<LabClassificationMaster[]> => {
  const endpoint = '/orca/master/kensa-sort';
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<OrcaMasterListResponse<RawLabClassificationMaster>>(endpoint);
      const list = response.data?.list ?? [];
      return list
        .map(mapLabClassification)
        .filter((item): item is LabClassificationMaster => Boolean(item));
    },
  );
};

export const fetchInsurers = async (): Promise<InsurerMaster[]> => {
  const endpoint = '/orca/master/hokenja';
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<OrcaMasterListResponse<RawInsurerMaster>>(endpoint);
      const list = response.data?.list ?? [];
      return list.map(mapInsurer).filter((item): item is InsurerMaster => Boolean(item));
    },
  );
};

export const fetchEtensuMasters = async (): Promise<EtensuMasterEntry[]> => {
  const endpoint = '/orca/master/etensu';
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<OrcaMasterListResponse<RawEtensuMasterEntry>>(endpoint);
      const list = response.data?.list ?? [];
      return list.map(mapEtensuMaster).filter((item): item is EtensuMasterEntry => Boolean(item));
    },
  );
};

export const lookupAddressMaster = async (zipcode: string): Promise<AddressMasterEntry[]> => {
  const { ok, normalized, error } = validateOrcaCode('zip', zipcode);
  if (!ok || !normalized) {
    throw error ?? new OrcaValidationError('zip', zipcode);
  }
  const endpoint = `/orca/master/address?zip=${encodeURIComponent(normalized)}`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      try {
        const response = await httpClient.get<OrcaMasterListResponse<RawAddressMasterEntry>>(endpoint);
        const list = response.data?.list ?? [];
        return list.map(mapAddressMaster).filter((item): item is AddressMasterEntry => Boolean(item));
      } catch (requestError) {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 422) {
          const runId = (requestError.response.data as { runId?: string })?.runId;
          throw new OrcaValidationError('zip', normalized, { runId });
        }
        throw requestError;
      }
    },
    { zipcode: normalized },
  );
};

// --- Bridge スケルトン（ORCA-05/06/08 REST 提供待ち） ---

export interface OrcaMasterFetchOptions {
  runId?: string;
  sourceHint?: OrcaMasterSource;
  version?: string;
}

export const fetchOrca05BridgeMasters = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<Orca05MasterRecord>> => {
  // TODO: 実 REST 実装後に `/orca/master/{generic-class|generic-price|youhou|material|kensa-sort}` を呼び出す
  return {
    list: [],
    totalCount: 0,
    fetchedAt: new Date().toISOString(),
    dataSource: options?.sourceHint ?? 'mock',
    fallbackUsed: true,
    missingMaster: true,
    runId: options?.runId,
    version: options?.version,
  };
};

export const fetchOrca06BridgeMasters = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<Orca06InsurerAddressRecord>> => {
  // TODO: 実 REST 実装後に `/orca/master/hokenja` `/orca/master/address` を呼び出す
  return {
    list: [],
    totalCount: 0,
    fetchedAt: new Date().toISOString(),
    dataSource: options?.sourceHint ?? 'mock',
    fallbackUsed: true,
    missingMaster: true,
    runId: options?.runId,
    version: options?.version,
  };
};

export const fetchOrca08BridgeMasters = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<Orca08EtensuRecord>> => {
  // TODO: 実 REST 実装後に `/orca/master/etensu` を呼び出す
  return {
    list: [],
    totalCount: 0,
    fetchedAt: new Date().toISOString(),
    dataSource: options?.sourceHint ?? 'mock',
    fallbackUsed: true,
    missingMaster: true,
    runId: options?.runId,
    version: options?.version,
  };
};
