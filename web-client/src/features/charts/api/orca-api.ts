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
  OrcaMasterAuditMeta,
  OrcaMasterSource,
  SpecialEquipmentMaster,
} from '@/types/orca';
import {
  addressMasterResponse,
  dosageInstructionMasterResponse,
  drugClassificationMasterResponse,
  etensuMasterResponse,
  insurerMasterResponse,
  labClassificationMasterResponse,
  minimumDrugPriceResponse,
  specialEquipmentMasterResponse,
} from '@/mocks/fixtures/orcaMaster';
import { getOrcaMasterBridgeBaseUrl, resolveOrcaMasterSource } from './orca-source-resolver';

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

export interface TensuSearchOptions extends OrcaMasterFetchOptions {
  partialMatch?: boolean;
  date?: Date;
}

export const searchTensuByName = async (
  keyword: string,
  options?: TensuSearchOptions,
): Promise<OrcaMasterListResponse<TensuMasterEntry>> => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return {
      list: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
      dataSource: options?.sourceHint ?? 'fallback',
      cacheHit: false,
      missingMaster: true,
      fallbackUsed: false,
      runId: options?.runId,
      snapshotVersion: undefined,
      version: options?.version,
    };
  }
  const base = await fetchOrca08BridgeMasters(options);
  const normalizedDate = toOrcaDateParam(options?.date ?? null);
  const partial = options?.partialMatch ?? true;
  const normalizedKeyword = trimmed.toLowerCase();
  const filtered = base.list.filter((entry) => {
    const name = entry.name?.toLowerCase() ?? '';
    const matchesKeyword = partial ? name.includes(normalizedKeyword) : name.startsWith(normalizedKeyword);
    if (!matchesKeyword) return false;
    if (!normalizedDate) return true;
    const starts = entry.startDate ?? '00000000';
    const ends = entry.endDate ?? '99999999';
    return starts <= normalizedDate && normalizedDate <= ends;
  });

  const list = filtered
    .map((entry) => ({
      code: entry.tensuCode ?? entry.medicalFeeCode ?? '',
      name: entry.name,
      kana: undefined,
      unitName: entry.unit,
      point: entry.tanka ?? entry.points ?? null,
      startDate: entry.startDate,
      endDate: entry.endDate,
      routeFlag: undefined,
      inpatientFlag: undefined,
      categoryFlag: entry.category,
      dataSource: entry.dataSource ?? base.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? base.dataSourceTransition,
      cacheHit: entry.cacheHit ?? base.cacheHit,
      missingMaster: entry.missingMaster ?? base.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? base.fallbackUsed,
      runId: entry.runId ?? base.runId,
      snapshotVersion: entry.snapshotVersion ?? base.snapshotVersion,
      version: entry.version ?? base.version,
    }))
    .filter((item): item is TensuMasterEntry => Boolean(item.code) && Boolean(item.name));

  return {
    list,
    totalCount: list.length,
    fetchedAt: base.fetchedAt,
    version: base.version,
    dataSource: base.dataSource,
    dataSourceTransition: base.dataSourceTransition,
    cacheHit: base.cacheHit ?? false,
    missingMaster: base.missingMaster ?? list.length === 0,
    fallbackUsed: base.fallbackUsed ?? false,
    runId: base.runId,
    snapshotVersion: base.snapshotVersion,
  };
};

export const searchDiseaseByName = async (
  keyword: string,
  options?: { partialMatch?: boolean; date?: Date; runId?: string },
): Promise<OrcaMasterListResponse<DiseaseMasterEntry>> => {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return {
      list: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
      dataSource: 'fallback',
      cacheHit: false,
      missingMaster: true,
      fallbackUsed: false,
      runId: options?.runId,
    };
  }
  const now = formatOrcaDate(options?.date);
  const partial = options?.partialMatch ?? true;
  const endpoint = `/orca/disease/name/${buildParam([trimmed, now, partial])}/`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawDiseaseListResponse>(endpoint);
      const list = (response.data?.list ?? [])
        .map(mapDiseaseEntry)
        .filter((item): item is DiseaseMasterEntry => Boolean(item));
      return {
        list,
        totalCount: list.length,
        fetchedAt: new Date().toISOString(),
        dataSource: 'server',
        cacheHit: false,
        missingMaster: list.length === 0,
        fallbackUsed: false,
        runId: options?.runId,
      };
    },
    {
      keyword: trimmed,
      partial,
      date: options?.date?.toISOString(),
    },
  );
};

export const lookupGeneralName = async (
  code: string,
  options?: { runId?: string },
): Promise<OrcaMasterListResponse<GeneralNameEntry>> => {
  const trimmed = code.trim();
  if (!trimmed) {
    return {
      list: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
      dataSource: 'fallback',
      cacheHit: false,
      missingMaster: true,
      fallbackUsed: false,
      runId: options?.runId,
    };
  }
  const endpoint = `/orca/general/${encodeURIComponent(trimmed)}`;
  return measureApiPerformance(
    PERFORMANCE_METRICS.orca.master.search,
    `GET ${endpoint}`,
    async () => {
      const response = await httpClient.get<RawGeneralNameResponse>(endpoint);
      const payload = response.data;
      const entry =
        payload?.code && payload.name
          ? ({
              code: payload.code,
              name: payload.name,
              dataSource: 'server',
              cacheHit: false,
              missingMaster: false,
              fallbackUsed: false,
              runId: options?.runId,
            } satisfies GeneralNameEntry)
          : null;
      const list = entry ? [entry] : [];
      return {
        list,
        totalCount: list.length,
        fetchedAt: new Date().toISOString(),
        dataSource: 'server',
        cacheHit: false,
        missingMaster: list.length === 0,
        fallbackUsed: false,
        runId: options?.runId,
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

export const fetchDrugClassifications = async (): Promise<OrcaMasterListResponse<DrugClassificationMaster>> => {
  const response = await fetchOrca05BridgeMasters();
  const list = response.list
    .filter((entry) => entry.masterType === 'drugClassification')
    .map((entry) => ({
      classCode: entry.code,
      className: entry.name,
      kanaName: undefined,
      categoryCode: entry.category,
      parentClassCode: undefined,
      isLeaf: undefined,
      validFrom: entry.validFrom,
      validTo: entry.validTo,
      version: entry.version,
      dataSource: entry.dataSource ?? response.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? response.dataSourceTransition,
      cacheHit: entry.cacheHit ?? response.cacheHit,
      missingMaster: entry.missingMaster ?? response.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed,
      runId: entry.runId ?? response.runId,
      snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
    }))
    .filter((item): item is DrugClassificationMaster => Boolean(item.classCode) && Boolean(item.className));

  return {
    ...response,
    list,
    totalCount: list.length,
    missingMaster: response.missingMaster ?? list.length === 0,
  };
};

export const searchTensuByPointRange = async (
  range: { min?: number | null; max?: number | null; date?: Date | null } & OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<TensuMasterEntry>> => {
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
    return {
      list: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
      dataSource: range.sourceHint ?? 'fallback',
      cacheHit: false,
      missingMaster: true,
      fallbackUsed: false,
      runId: range.runId,
      version: range.version,
    };
  }

  if (minValue !== null && maxValue !== null && minValue > maxValue) {
    return {
      list: [],
      totalCount: 0,
      fetchedAt: new Date().toISOString(),
      dataSource: range.sourceHint ?? 'fallback',
      cacheHit: false,
      missingMaster: true,
      fallbackUsed: false,
      runId: range.runId,
      version: range.version,
    };
  }

  const base = await fetchOrca08BridgeMasters(range);
  const dateToken = toOrcaDateParam(range.date ?? null);
  const filtered = base.list.filter((entry) => {
    const point = entry.tanka ?? entry.points;
    const withinRange =
      (minValue === null || (point ?? 0) >= minValue) && (maxValue === null || (point ?? 0) <= maxValue);
    if (!withinRange) return false;
    if (!dateToken) return true;
    const starts = entry.startDate ?? '00000000';
    const ends = entry.endDate ?? '99999999';
    return starts <= dateToken && dateToken <= ends;
  });

  const list = filtered
    .map((entry) => ({
      code: entry.tensuCode ?? entry.medicalFeeCode ?? '',
      name: entry.name,
      kana: undefined,
      unitName: entry.unit,
      point: entry.tanka ?? entry.points ?? null,
      startDate: entry.startDate,
      endDate: entry.endDate,
      routeFlag: undefined,
      inpatientFlag: undefined,
      categoryFlag: entry.category,
      dataSource: entry.dataSource ?? base.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? base.dataSourceTransition,
      cacheHit: entry.cacheHit ?? base.cacheHit,
      missingMaster: entry.missingMaster ?? base.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? base.fallbackUsed,
      runId: entry.runId ?? base.runId,
      snapshotVersion: entry.snapshotVersion ?? base.snapshotVersion,
      version: entry.version ?? base.version,
    }))
    .filter((item): item is TensuMasterEntry => Boolean(item.code) && Boolean(item.name));

  return {
    list,
    totalCount: list.length,
    fetchedAt: base.fetchedAt,
    version: base.version,
    dataSource: base.dataSource,
    dataSourceTransition: base.dataSourceTransition,
    cacheHit: base.cacheHit ?? false,
    missingMaster: base.missingMaster ?? list.length === 0,
    fallbackUsed: base.fallbackUsed ?? false,
    runId: base.runId,
    snapshotVersion: base.snapshotVersion,
  };
};

export const fetchMinimumDrugPrices = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<MinimumDrugPriceEntry>> => {
  const response = await fetchOrca05BridgeMasters(options);
  const list = response.list
    .filter((entry) => entry.masterType === 'minimumDrugPrice')
    .map((entry) => ({
      srycd: entry.code,
      drugName: entry.name,
      kanaName: entry.kanaName,
      price: entry.minPrice ?? null,
      unit: entry.unit,
      priceType: entry.priceType,
      startDate: entry.validFrom,
      endDate: entry.validTo,
      reference: entry.reference,
      validFrom: entry.validFrom,
      validTo: entry.validTo,
      version: entry.version,
      dataSource: entry.dataSource ?? response.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? response.dataSourceTransition,
      cacheHit: entry.cacheHit ?? response.cacheHit,
      missingMaster: entry.missingMaster ?? response.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed,
      runId: entry.runId ?? response.runId,
      snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
    }))
    .filter((item): item is MinimumDrugPriceEntry => Boolean(item.srycd) && Boolean(item.drugName));

  return {
    ...response,
    list,
    totalCount: list.length,
    missingMaster: response.missingMaster ?? list.length === 0,
  };
};

export const fetchDosageInstructions = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<DosageInstructionMaster>> => {
  const response = await fetchOrca05BridgeMasters(options);
  const list = response.list
    .filter((entry) => entry.masterType === 'dosageInstruction')
    .map((entry) => ({
      youhouCode: entry.youhouCode ?? entry.code,
      youhouName: entry.name,
      timingCode: entry.timingCode ?? undefined,
      routeCode: entry.routeCode ?? undefined,
      daysLimit: entry.daysLimit ?? undefined,
      dosePerDay: entry.dosePerDay ?? undefined,
      comment: entry.comment,
      validFrom: entry.validFrom,
      validTo: entry.validTo,
      version: entry.version,
      dataSource: entry.dataSource ?? response.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? response.dataSourceTransition,
      cacheHit: entry.cacheHit ?? response.cacheHit,
      missingMaster: entry.missingMaster ?? response.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed,
      runId: entry.runId ?? response.runId,
      snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
    }))
    .filter((item): item is DosageInstructionMaster => Boolean(item.youhouCode) && Boolean(item.youhouName));

  return {
    ...response,
    list,
    totalCount: list.length,
    missingMaster: response.missingMaster ?? list.length === 0,
  };
};

export const fetchSpecialEquipments = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<SpecialEquipmentMaster>> => {
  const response = await fetchOrca05BridgeMasters(options);
  const list = response.list
    .filter((entry) => entry.masterType === 'specialEquipment')
    .map((entry) => ({
      materialCode: entry.code,
      materialName: entry.name,
      category: entry.category,
      materialCategory: entry.materialCategory,
      insuranceType: entry.insuranceType,
      unit: entry.unit,
      price: entry.minPrice ?? null,
      startDate: entry.validFrom,
      endDate: entry.validTo,
      maker: entry.maker,
      validFrom: entry.validFrom,
      validTo: entry.validTo,
      version: entry.version,
      dataSource: entry.dataSource ?? response.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? response.dataSourceTransition,
      cacheHit: entry.cacheHit ?? response.cacheHit,
      missingMaster: entry.missingMaster ?? response.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed,
      runId: entry.runId ?? response.runId,
      snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
    }))
    .filter((item): item is SpecialEquipmentMaster => Boolean(item.materialCode) && Boolean(item.materialName));

  return {
    ...response,
    list,
    totalCount: list.length,
    missingMaster: response.missingMaster ?? list.length === 0,
  };
};

export const fetchLabClassifications = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<LabClassificationMaster>> => {
  const response = await fetchOrca05BridgeMasters(options);
  const list = response.list
    .filter((entry) => entry.masterType === 'labClassification')
    .map((entry) => ({
      kensaCode: entry.code,
      kensaName: entry.name,
      sampleType: entry.sampleType,
      departmentCode: entry.departmentCode,
      classification: entry.category,
      insuranceCategory: entry.category,
      validFrom: entry.validFrom,
      validTo: entry.validTo,
      version: entry.version,
      dataSource: entry.dataSource ?? response.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? response.dataSourceTransition,
      cacheHit: entry.cacheHit ?? response.cacheHit,
      missingMaster: entry.missingMaster ?? response.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed,
      runId: entry.runId ?? response.runId,
      snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
    }))
    .filter((item): item is LabClassificationMaster => Boolean(item.kensaCode) && Boolean(item.kensaName));

  return {
    ...response,
    list,
    totalCount: list.length,
    missingMaster: response.missingMaster ?? list.length === 0,
  };
};

export const fetchInsurers = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<InsurerMaster>> => {
  const response = await fetchOrca06BridgeMasters(options);
  const list = response.list
    .filter((entry) => entry.recordType === 'insurer')
    .map((entry) => ({
      insurerNumber: entry.payerCode,
      insurerName: entry.payerName,
      insurerKana: entry.kana,
      payerRatio: entry.payerRatio,
      payerType: entry.payerType,
      insurerType: entry.payerType,
      prefCode: entry.prefCode,
      cityCode: entry.cityCode,
      zip: entry.zip,
      addressLine: entry.addressLine,
      address: entry.addressLine,
      phone: undefined,
      validFrom: undefined,
      validTo: undefined,
      version: entry.version,
      dataSource: entry.dataSource ?? response.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? response.dataSourceTransition,
      cacheHit: entry.cacheHit ?? response.cacheHit,
      missingMaster: entry.missingMaster ?? response.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed,
      runId: entry.runId ?? response.runId,
      snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
    }))
    .filter((item): item is InsurerMaster => Boolean(item.insurerNumber) && Boolean(item.insurerName));

  return {
    ...response,
    list,
    totalCount: list.length,
    missingMaster: response.missingMaster ?? list.length === 0,
  };
};

export const fetchEtensuMasters = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<EtensuMasterEntry>> => {
  const response = await fetchOrca08BridgeMasters(options);
  const list = response.list
    .map((entry) => ({
      etensuCategory: entry.etensuCategory ?? entry.category ?? '',
      category: entry.category,
      medicalFeeCode: entry.medicalFeeCode ?? entry.tensuCode ?? '',
      tensuCode: entry.tensuCode ?? entry.medicalFeeCode ?? '',
      name: entry.name,
      points: entry.tanka ?? entry.points ?? 0,
      tanka: entry.tanka ?? entry.points,
      unit: entry.unit,
      kubun: entry.kubun,
      startDate: entry.startDate,
      endDate: entry.endDate,
      note: entry.note,
      tensuVersion: entry.tensuVersion,
      version: entry.version,
      dataSource: entry.dataSource ?? response.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? response.dataSourceTransition,
      cacheHit: entry.cacheHit ?? response.cacheHit,
      missingMaster: entry.missingMaster ?? response.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed,
      runId: entry.runId ?? response.runId,
      snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
    }))
    .filter((item): item is EtensuMasterEntry => Boolean(item.tensuCode) && Boolean(item.name));

  return {
    ...response,
    list,
    totalCount: list.length,
    missingMaster: response.missingMaster ?? list.length === 0,
  };
};

export const lookupAddressMaster = async (
  zipcode: string,
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<AddressMasterEntry>> => {
  const { ok, normalized, error } = validateOrcaCode('zip', zipcode);
  if (!ok || !normalized) {
    throw error ?? new OrcaValidationError('zip', zipcode);
  }

  const response = await fetchOrca06BridgeMasters({ ...options, zip: normalized });
  const list = response.list
    .filter((entry) => entry.recordType === 'address')
    .filter((entry) => {
      const zip = entry.zip ?? entry.payerCode;
      return zip ? zip === normalized : true;
    })
    .map((entry) => ({
      zipCode: entry.zip ?? entry.payerCode,
      zip: entry.zip ?? entry.payerCode,
      prefectureCode: entry.prefCode,
      prefCode: entry.prefCode,
      city: entry.city,
      cityCode: entry.cityCode,
      town: entry.town,
      kana: entry.kana,
      roman: entry.roman,
      fullAddress: entry.addressLine ?? entry.payerName,
      version: entry.version,
      dataSource: entry.dataSource ?? response.dataSource,
      dataSourceTransition: entry.dataSourceTransition ?? response.dataSourceTransition,
      cacheHit: entry.cacheHit ?? response.cacheHit,
      missingMaster: entry.missingMaster ?? response.missingMaster,
      fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed,
      runId: entry.runId ?? response.runId,
      snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
    }))
    .filter((item): item is AddressMasterEntry => Boolean(item.zip) && Boolean(item.fullAddress));

  if (list.length === 0 && response.missingMaster && response.dataSource === 'server') {
    throw new OrcaValidationError('zip', normalized, {
      runId: response.runId,
      snapshotVersion: response.snapshotVersion,
      missingMaster: response.missingMaster,
      cacheHit: response.cacheHit,
      fallbackUsed: response.fallbackUsed,
    });
  }

  return {
    ...response,
    list,
    totalCount: list.length,
    missingMaster: response.missingMaster ?? list.length === 0,
  };
};

// --- Bridge 実装（runtime source resolver / httpClient ベース） ---

export interface OrcaMasterFetchOptions {
  runId?: string;
  sourceHint?: OrcaMasterSource;
  version?: string;
  previousSource?: OrcaMasterSource;
  zip?: string;
  keyword?: string;
  pref?: string;
}

const extractAuditMeta = (
  payload?: Partial<OrcaMasterListResponse<unknown>>,
): (OrcaMasterAuditMeta & { version?: string; fetchedAt?: string; totalCount?: number }) => ({
  dataSource: payload?.dataSource,
  dataSourceTransition: payload?.dataSourceTransition,
  cacheHit: payload?.cacheHit,
  missingMaster: payload?.missingMaster,
  fallbackUsed: payload?.fallbackUsed,
  runId: payload?.runId,
  snapshotVersion: payload?.snapshotVersion,
  version: payload?.version,
  fetchedAt: payload?.fetchedAt,
  totalCount: payload?.totalCount,
});

const mergeEntryMeta = (
  entryMeta: OrcaMasterAuditMeta | undefined,
  baseMeta: OrcaMasterAuditMeta | undefined,
  dataSource: OrcaMasterSource,
): OrcaMasterAuditMeta => ({
  dataSource: entryMeta?.dataSource ?? baseMeta?.dataSource ?? dataSource,
  dataSourceTransition: entryMeta?.dataSourceTransition ?? baseMeta?.dataSourceTransition,
  cacheHit: entryMeta?.cacheHit ?? baseMeta?.cacheHit ?? false,
  missingMaster: entryMeta?.missingMaster ?? baseMeta?.missingMaster,
  fallbackUsed: entryMeta?.fallbackUsed ?? baseMeta?.fallbackUsed ?? false,
  runId: entryMeta?.runId ?? baseMeta?.runId,
  snapshotVersion: entryMeta?.snapshotVersion ?? baseMeta?.snapshotVersion,
});

const selectPrimaryMeta = (
  ...metas: (ReturnType<typeof extractAuditMeta> | undefined)[]
): ReturnType<typeof extractAuditMeta> | undefined => metas.find((meta) => Boolean(meta));

const cloneResponseWithSource = <T extends OrcaMasterAuditMeta>(
  response: OrcaMasterListResponse<T>,
  dataSource: OrcaMasterSource,
): OrcaMasterListResponse<T> => ({
  ...response,
  dataSource,
  dataSourceTransition: response.dataSourceTransition,
  cacheHit: response.cacheHit ?? false,
  fallbackUsed: response.fallbackUsed ?? false,
  missingMaster: response.missingMaster ?? response.list.length === 0,
  list: response.list.map((entry) => ({
    ...entry,
    dataSource,
    cacheHit: entry.cacheHit ?? response.cacheHit ?? false,
    fallbackUsed: entry.fallbackUsed ?? response.fallbackUsed ?? false,
    missingMaster: entry.missingMaster ?? response.missingMaster,
    runId: entry.runId ?? response.runId,
    snapshotVersion: entry.snapshotVersion ?? response.snapshotVersion,
  })),
});

const fetchMasterListWithMapper = async <TRaw, TMapped extends OrcaMasterAuditMeta>(
  endpoint: string,
  mapper: (entry: TRaw) => TMapped | null,
  options?: { baseURL?: string; params?: Record<string, unknown> },
): Promise<OrcaMasterListResponse<TMapped>> => {
  const response = await httpClient.get<OrcaMasterListResponse<TRaw>>(endpoint, options);
  const baseMeta = extractAuditMeta(response.data);
  const list = (response.data?.list ?? [])
    .map(mapper)
    .filter((item): item is TMapped => Boolean(item))
    .map((item) => ({
      ...item,
      dataSource: item.dataSource ?? baseMeta.dataSource,
      dataSourceTransition: item.dataSourceTransition ?? baseMeta.dataSourceTransition,
      cacheHit: item.cacheHit ?? baseMeta.cacheHit ?? false,
      missingMaster: item.missingMaster ?? baseMeta.missingMaster,
      fallbackUsed: item.fallbackUsed ?? baseMeta.fallbackUsed ?? false,
      runId: item.runId ?? baseMeta.runId,
      snapshotVersion: item.snapshotVersion ?? baseMeta.snapshotVersion,
    }));

  return {
    list,
    totalCount: response.data?.totalCount ?? list.length,
    fetchedAt: response.data?.fetchedAt ?? new Date().toISOString(),
    dataSource: baseMeta.dataSource,
    dataSourceTransition: baseMeta.dataSourceTransition,
    cacheHit: baseMeta.cacheHit ?? false,
    missingMaster: baseMeta.missingMaster ?? list.length === 0,
    fallbackUsed: baseMeta.fallbackUsed ?? false,
    runId: baseMeta.runId,
    snapshotVersion: baseMeta.snapshotVersion,
    version: response.data?.version,
  };
};

const buildOrca05ResponseFromSources = (
  sources: {
    drugClasses?: OrcaMasterListResponse<DrugClassificationMaster>;
    minimumPrices?: OrcaMasterListResponse<MinimumDrugPriceEntry>;
    dosageInstructions?: OrcaMasterListResponse<DosageInstructionMaster>;
    specialEquipments?: OrcaMasterListResponse<SpecialEquipmentMaster>;
    labClassifications?: OrcaMasterListResponse<LabClassificationMaster>;
  },
  dataSource: OrcaMasterSource,
): OrcaMasterListResponse<Orca05MasterRecord> => {
  const primaryMeta = selectPrimaryMeta(
    sources.drugClasses && extractAuditMeta(sources.drugClasses),
    sources.minimumPrices && extractAuditMeta(sources.minimumPrices),
    sources.dosageInstructions && extractAuditMeta(sources.dosageInstructions),
    sources.specialEquipments && extractAuditMeta(sources.specialEquipments),
    sources.labClassifications && extractAuditMeta(sources.labClassifications),
  );

  const records: Orca05MasterRecord[] = [];

  const metaFrom = (entry?: OrcaMasterAuditMeta) => mergeEntryMeta(entry, primaryMeta, dataSource);

  (sources.drugClasses?.list ?? []).forEach((entry) => {
    records.push({
      ...metaFrom(entry),
      masterType: 'drugClassification',
      code: entry.classCode,
      name: entry.className,
      category: entry.categoryCode ?? entry.parentClassCode,
      unit: undefined,
      minPrice: null,
      youhouCode: undefined,
      materialCategory: undefined,
      kensaSort: undefined,
      validFrom: entry.validFrom ?? entry.startDate,
      validTo: entry.validTo ?? entry.endDate,
      version: entry.version,
      kanaName: entry.kanaName,
    });
  });

  (sources.minimumPrices?.list ?? []).forEach((entry) => {
    records.push({
      ...metaFrom(entry),
      masterType: 'minimumDrugPrice',
      code: entry.srycd,
      name: entry.drugName,
      category: entry.priceType ?? 'generic-price',
      unit: entry.unit,
      minPrice: entry.price ?? null,
      youhouCode: undefined,
      materialCategory: undefined,
      kensaSort: undefined,
      validFrom: entry.validFrom ?? entry.startDate,
      validTo: entry.validTo ?? entry.endDate,
      version: entry.version,
      kanaName: entry.kanaName,
      priceType: entry.priceType ?? undefined,
      reference: entry.reference,
    });
  });

  (sources.dosageInstructions?.list ?? []).forEach((entry) => {
    records.push({
      ...metaFrom(entry),
      masterType: 'dosageInstruction',
      code: entry.youhouCode,
      name: entry.youhouName,
      category: 'dosage',
      unit: undefined,
      minPrice: null,
      youhouCode: entry.youhouCode,
      materialCategory: undefined,
      kensaSort: undefined,
      validFrom: entry.validFrom,
      validTo: entry.validTo,
      version: entry.version,
      timingCode: entry.timingCode,
      routeCode: entry.routeCode,
      daysLimit: entry.daysLimit ?? null,
      dosePerDay: entry.dosePerDay ?? null,
      comment: entry.comment,
    });
  });

  (sources.specialEquipments?.list ?? []).forEach((entry) => {
    records.push({
      ...metaFrom(entry),
      masterType: 'specialEquipment',
      code: entry.materialCode,
      name: entry.materialName,
      category: entry.category ?? 'material',
      unit: entry.unit,
      minPrice: entry.price ?? null,
      youhouCode: undefined,
      materialCategory: entry.materialCategory ?? entry.category,
      kensaSort: undefined,
      validFrom: entry.validFrom ?? entry.startDate,
      validTo: entry.validTo ?? entry.endDate,
      version: entry.version,
      insuranceType: entry.insuranceType,
      maker: entry.maker,
    });
  });

  (sources.labClassifications?.list ?? []).forEach((entry) => {
    records.push({
      ...metaFrom(entry),
      masterType: 'labClassification',
      code: entry.kensaCode,
      name: entry.kensaName,
      category: entry.classification ?? entry.insuranceCategory ?? 'kensa',
      unit: undefined,
      minPrice: null,
      youhouCode: undefined,
      materialCategory: undefined,
      kensaSort: entry.kensaCode,
      validFrom: entry.validFrom,
      validTo: entry.validTo,
      version: entry.version,
      sampleType: entry.sampleType,
      departmentCode: entry.departmentCode,
    });
  });

  const fetchedAt = primaryMeta?.fetchedAt ?? new Date().toISOString();
  const version = primaryMeta?.version;
  const cacheHit = primaryMeta?.cacheHit ?? false;
  const missingMaster = primaryMeta?.missingMaster ?? records.length === 0;
  const fallbackUsed = primaryMeta?.fallbackUsed ?? false;
  const runId = primaryMeta?.runId;
  const snapshotVersion = primaryMeta?.snapshotVersion;
  const dataSourceTransition = primaryMeta?.dataSourceTransition;

  return {
    list: records,
    totalCount: records.length,
    fetchedAt,
    version,
    dataSource,
    dataSourceTransition,
    cacheHit,
    missingMaster,
    fallbackUsed,
    runId,
    snapshotVersion,
  };
};

const buildOrca06ResponseFromSources = (
  sources: {
    insurers?: OrcaMasterListResponse<InsurerMaster>;
    addresses?: OrcaMasterListResponse<AddressMasterEntry>;
  },
  dataSource: OrcaMasterSource,
): OrcaMasterListResponse<Orca06InsurerAddressRecord> => {
  const primaryMeta = selectPrimaryMeta(
    sources.insurers && extractAuditMeta(sources.insurers),
    sources.addresses && extractAuditMeta(sources.addresses),
  );
  const metaFrom = (entry?: OrcaMasterAuditMeta) => mergeEntryMeta(entry, primaryMeta, dataSource);
  const records: Orca06InsurerAddressRecord[] = [];

  (sources.insurers?.list ?? []).forEach((entry) => {
    records.push({
      ...metaFrom(entry),
      recordType: 'insurer',
      payerCode: entry.insurerNumber,
      payerName: entry.insurerName,
      payerType: entry.insurerType ?? entry.payerType,
      payerRatio: entry.payerRatio,
      prefCode: entry.prefCode ?? entry.prefectureCode,
      cityCode: entry.cityCode,
      zip: entry.zip,
      addressLine: entry.addressLine ?? entry.address,
      city: entry.address,
      town: undefined,
      kana: entry.insurerKana,
      version: entry.version,
    });
  });

  (sources.addresses?.list ?? []).forEach((entry) => {
    const payerCode = entry.zip ?? entry.zipCode;
    const payerName =
      entry.fullAddress ?? [entry.prefectureCode, entry.city, entry.town].filter(Boolean).join(' ');
    if (!payerCode && !payerName) {
      return;
    }
    records.push({
      ...metaFrom(entry),
      recordType: 'address',
      payerCode: payerCode ?? 'address',
      payerName: payerName || payerCode || 'address',
      payerType: undefined,
      payerRatio: undefined,
      prefCode: entry.prefCode ?? entry.prefectureCode,
      cityCode: entry.cityCode,
      zip: entry.zip ?? entry.zipCode,
      addressLine: entry.fullAddress ?? undefined,
      city: entry.city,
      town: entry.town,
      kana: entry.kana,
      roman: entry.roman,
      version: entry.version,
    });
  });

  const fetchedAt = primaryMeta?.fetchedAt ?? new Date().toISOString();
  const version = primaryMeta?.version;
  const cacheHit = primaryMeta?.cacheHit ?? false;
  const missingMaster = primaryMeta?.missingMaster ?? records.length === 0;
  const fallbackUsed = primaryMeta?.fallbackUsed ?? false;
  const runId = primaryMeta?.runId;
  const snapshotVersion = primaryMeta?.snapshotVersion;
  const dataSourceTransition = primaryMeta?.dataSourceTransition;

  return {
    list: records,
    totalCount: records.length,
    fetchedAt,
    version,
    dataSource,
    dataSourceTransition,
    cacheHit,
    missingMaster,
    fallbackUsed,
    runId,
    snapshotVersion,
  };
};

const buildOrca08ResponseFromSources = (
  source: OrcaMasterListResponse<EtensuMasterEntry>,
  dataSource: OrcaMasterSource,
): OrcaMasterListResponse<Orca08EtensuRecord> => {
  const meta = extractAuditMeta(source);
  const records: Orca08EtensuRecord[] = source.list.map((entry) => ({
    ...mergeEntryMeta(entry, meta, dataSource),
    tensuCode: entry.tensuCode ?? entry.medicalFeeCode ?? '',
    name: entry.name,
    kubun: entry.kubun,
    tanka: entry.tanka ?? entry.points,
    unit: entry.unit,
    category: entry.category,
    startDate: entry.startDate,
    endDate: entry.endDate,
    tensuVersion: entry.tensuVersion,
    version: entry.version,
  }));

  return {
    list: records,
    totalCount: records.length,
    fetchedAt: source.fetchedAt,
    version: source.version,
    dataSource,
    dataSourceTransition: meta.dataSourceTransition,
    cacheHit: meta.cacheHit ?? false,
    missingMaster: meta.missingMaster ?? records.length === 0,
    fallbackUsed: meta.fallbackUsed ?? false,
    runId: meta.runId,
    snapshotVersion: meta.snapshotVersion,
  };
};

const buildFallbackResponse = <T>(
  dataSource: OrcaMasterSource,
  options?: OrcaMasterFetchOptions,
): OrcaMasterListResponse<T> => ({
  list: [],
  totalCount: 0,
  fetchedAt: new Date().toISOString(),
  dataSource,
  cacheHit: false,
  fallbackUsed: true,
  missingMaster: true,
  runId: options?.runId,
  version: options?.version,
});

const fetchOrca05FromSource = async (
  source: OrcaMasterSource,
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<Orca05MasterRecord>> => {
  if (source === 'server') {
    const baseURL = getOrcaMasterBridgeBaseUrl();
    const [drugClasses, minimumPrices, dosageInstructions, specialEquipments, labClassifications] =
      await Promise.all([
        fetchMasterListWithMapper('/orca/master/generic-class', mapDrugClassification, { baseURL }),
        fetchMasterListWithMapper('/orca/master/generic-price', mapMinimumDrugPrice, { baseURL }),
        fetchMasterListWithMapper('/orca/master/youhou', mapDosageInstruction, { baseURL }),
        fetchMasterListWithMapper('/orca/master/material', mapSpecialEquipment, { baseURL }),
        fetchMasterListWithMapper('/orca/master/kensa-sort', mapLabClassification, { baseURL }),
      ]);
    return buildOrca05ResponseFromSources(
      { drugClasses, minimumPrices, dosageInstructions, specialEquipments, labClassifications },
      'server',
    );
  }

  if (source === 'snapshot') {
    return buildOrca05ResponseFromSources(
      {
        drugClasses: cloneResponseWithSource(drugClassificationMasterResponse, 'snapshot'),
        minimumPrices: cloneResponseWithSource(minimumDrugPriceResponse, 'snapshot'),
        dosageInstructions: cloneResponseWithSource(dosageInstructionMasterResponse, 'snapshot'),
        specialEquipments: cloneResponseWithSource(specialEquipmentMasterResponse, 'snapshot'),
        labClassifications: cloneResponseWithSource(labClassificationMasterResponse, 'snapshot'),
      },
      'snapshot',
    );
  }

  if (source === 'mock') {
    return buildOrca05ResponseFromSources(
      {
        drugClasses: cloneResponseWithSource(drugClassificationMasterResponse, 'mock'),
        minimumPrices: cloneResponseWithSource(minimumDrugPriceResponse, 'mock'),
        dosageInstructions: cloneResponseWithSource(dosageInstructionMasterResponse, 'mock'),
        specialEquipments: cloneResponseWithSource(specialEquipmentMasterResponse, 'mock'),
        labClassifications: cloneResponseWithSource(labClassificationMasterResponse, 'mock'),
      },
      'mock',
    );
  }

  return buildFallbackResponse('fallback');
};

const DEFAULT_ADDRESS_LOOKUP_ZIP = addressMasterResponse.list[0]?.zipCode ?? '1000001';

const fetchOrca06FromSource = async (
  source: OrcaMasterSource,
  options?: OrcaMasterFetchOptions & { zip?: string; keyword?: string; pref?: string },
): Promise<OrcaMasterListResponse<Orca06InsurerAddressRecord>> => {
  if (source === 'server') {
    try {
      const baseURL = getOrcaMasterBridgeBaseUrl();
      const zip = options?.zip ?? DEFAULT_ADDRESS_LOOKUP_ZIP;
      const [insurers, addresses] = await Promise.all([
        fetchMasterListWithMapper('/orca/master/hokenja', mapInsurer, {
          baseURL,
          params: options?.pref ? { pref: options.pref, keyword: options.keyword } : undefined,
        }),
        fetchMasterListWithMapper('/orca/master/address', mapAddressMaster, {
          baseURL,
          params: { zip },
        }),
      ]);
      return buildOrca06ResponseFromSources({ insurers, addresses }, 'server');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const runId = (error.response.data as { runId?: string })?.runId;
        throw new OrcaValidationError('zip', options?.zip ?? '', { runId });
      }
      throw error;
    }
  }

  if (source === 'snapshot') {
    const addresses = cloneResponseWithSource(addressMasterResponse, 'snapshot');
    const filteredAddresses =
      options?.zip && addresses.list.length > 0
        ? (() => {
            const filtered = addresses.list.filter((entry) => {
              const zip = entry.zip ?? entry.zipCode;
              return zip ? zip === options.zip : false;
            });
            return {
              ...addresses,
              list: filtered,
              totalCount: filtered.length,
              missingMaster: addresses.missingMaster ?? filtered.length === 0,
            };
          })()
        : addresses;
    return buildOrca06ResponseFromSources(
      {
        insurers: cloneResponseWithSource(insurerMasterResponse, 'snapshot'),
        addresses: filteredAddresses,
      },
      'snapshot',
    );
  }

  if (source === 'mock') {
    const addresses = cloneResponseWithSource(addressMasterResponse, 'mock');
    const filteredAddresses =
      options?.zip && addresses.list.length > 0
        ? (() => {
            const filtered = addresses.list.filter((entry) => {
              const zip = entry.zip ?? entry.zipCode;
              return zip ? zip === options.zip : false;
            });
            return {
              ...addresses,
              list: filtered,
              totalCount: filtered.length,
              missingMaster: addresses.missingMaster ?? filtered.length === 0,
            };
          })()
        : addresses;
    return buildOrca06ResponseFromSources(
      {
        insurers: cloneResponseWithSource(insurerMasterResponse, 'mock'),
        addresses: filteredAddresses,
      },
      'mock',
    );
  }

  return buildFallbackResponse('fallback');
};

const fetchOrca08FromSource = async (
  source: OrcaMasterSource,
  _options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<Orca08EtensuRecord>> => {
  if (source === 'server') {
    const baseURL = getOrcaMasterBridgeBaseUrl();
    const raw = await fetchMasterListWithMapper('/orca/master/etensu', mapEtensuMaster, { baseURL });
    return buildOrca08ResponseFromSources(raw, 'server');
  }

  if (source === 'snapshot') {
    return buildOrca08ResponseFromSources(
      cloneResponseWithSource(etensuMasterResponse, 'snapshot'),
      'snapshot',
    );
  }

  if (source === 'mock') {
    return buildOrca08ResponseFromSources(cloneResponseWithSource(etensuMasterResponse, 'mock'), 'mock');
  }

  return buildFallbackResponse('fallback');
};

const fetchWithResolver = async <T>(
  masterType: string,
  fetcher: (source: OrcaMasterSource, options?: OrcaMasterFetchOptions) => Promise<OrcaMasterListResponse<T>>,
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<T>> => {
  const resolution = resolveOrcaMasterSource(masterType, {
    sourceHint: options?.sourceHint ?? null,
    previousSource: options?.previousSource ?? null,
  });

  let dataSourceTransition = resolution.dataSourceTransition;
  let fallbackUsed = resolution.fallbackUsed ?? false;

  for (let i = 0; i < resolution.attemptOrder.length; i += 1) {
    const source = resolution.attemptOrder[i];
    if (source === 'fallback') {
      return {
        ...buildFallbackResponse<T>('fallback', options),
        dataSourceTransition,
      };
    }
    try {
      const response = await fetcher(source, options);
      const missingMaster = response.missingMaster ?? response.list.length === 0;
      const effectiveFallbackUsed =
        fallbackUsed || response.fallbackUsed === true || source !== resolution.dataSource;

      const finalTransition =
        dataSourceTransition
        ?? (source !== resolution.dataSource
          ? { from: resolution.dataSource, to: source, reason: 'fallback' }
          : response.dataSourceTransition);

      if (missingMaster && i + 1 < resolution.attemptOrder.length) {
        dataSourceTransition = { from: source, to: resolution.attemptOrder[i + 1], reason: 'empty_fallback' };
        fallbackUsed = true;
        continue;
      }

      return {
        ...response,
        dataSource: source,
        dataSourceTransition: finalTransition,
        fallbackUsed: effectiveFallbackUsed,
        missingMaster,
        runId: response.runId ?? options?.runId,
        version: response.version ?? options?.version,
      };
    } catch (error) {
      if (error instanceof OrcaValidationError) {
        throw error;
      }
      fallbackUsed = true;
      dataSourceTransition = {
        from: source,
        to: resolution.attemptOrder[i + 1] ?? 'fallback',
        reason: 'error_fallback',
      };
    }
  }

  return {
    ...buildFallbackResponse<T>('fallback', options),
    dataSourceTransition,
  };
};

export const fetchOrca05BridgeMasters = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<Orca05MasterRecord>> =>
  fetchWithResolver<Orca05MasterRecord>('ORCA05', fetchOrca05FromSource, options);

export const fetchOrca06BridgeMasters = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<Orca06InsurerAddressRecord>> =>
  fetchWithResolver<Orca06InsurerAddressRecord>('ORCA06', fetchOrca06FromSource, options);

export const fetchOrca08BridgeMasters = async (
  options?: OrcaMasterFetchOptions,
): Promise<OrcaMasterListResponse<Orca08EtensuRecord>> =>
  fetchWithResolver<Orca08EtensuRecord>('ORCA08', fetchOrca08FromSource, options);
