import { httpFetch } from '../../libs/http/httpClient';
import { ensureObservabilityMeta, getObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition } from './authService';
import { buildMedicationGetRequestXml, fetchOrcaMedicationGetXml } from './orcaMedicationGetApi';

export type OrderMasterSearchType =
  | 'generic-class'
  | 'youhou'
  | 'material'
  | 'kensa-sort'
  | 'etensu'
  | 'bodypart';

export type OrderMasterSearchItem = {
  type: OrderMasterSearchType;
  code?: string;
  name: string;
  unit?: string;
  category?: string;
  points?: number;
  note?: string;
  validFrom?: string;
  validTo?: string;
};

export type OrderMasterSearchResult = {
  ok: boolean;
  items: OrderMasterSearchItem[];
  totalCount?: number;
  runId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  dataSourceTransition?: DataSourceTransition;
  message?: string;
  raw?: unknown;
  correctionCandidates?: OrderMasterSearchItem[];
  correctionMeta?: {
    apiResult?: string;
    apiResultMessage?: string;
    validTo?: string;
  };
};

type OrcaMasterListResponse<T> = {
  totalCount?: number;
  items?: T[];
  message?: string;
};

type OrcaDrugMasterEntry = {
  code?: string;
  name?: string;
  category?: string;
  unit?: string;
  minPrice?: number;
  youhouCode?: string;
  materialCategory?: string;
  kensaSort?: string;
  validFrom?: string;
  validTo?: string;
  note?: string;
};

type OrcaTensuEntry = {
  tensuCode?: string;
  name?: string;
  kubun?: string;
  points?: number;
  tanka?: number;
  unit?: string;
  category?: string;
  noticeDate?: string;
  effectiveDate?: string;
  startDate?: string;
  endDate?: string;
  tensuVersion?: string;
};

const MASTER_ENDPOINT_MAP: Record<OrderMasterSearchType, string> = {
  'generic-class': '/orca/master/generic-class',
  youhou: '/orca/master/youhou',
  material: '/orca/master/material',
  'kensa-sort': '/orca/master/kensa-sort',
  etensu: '/orca/master/etensu',
  bodypart: '/orca/master/etensu',
};

const ORCA_MASTER_USER =
  import.meta.env.VITE_ORCA_MASTER_USER ?? '1.3.6.1.4.1.9414.70.1:admin';
const ORCA_MASTER_PASSWORD =
  import.meta.env.VITE_ORCA_MASTER_PASSWORD ?? '21232f297a57a5a743894a0e4a801fc3';

const normalizeDrugEntry = (entry: OrcaDrugMasterEntry, type: OrderMasterSearchType): OrderMasterSearchItem | null => {
  const name = entry.name?.trim();
  if (!name) return null;
  const code = entry.code?.trim();
  const category = entry.category ?? entry.materialCategory ?? entry.kensaSort ?? entry.youhouCode;
  return {
    type,
    code: code || undefined,
    name,
    unit: entry.unit ?? undefined,
    category: category ?? undefined,
    points: typeof entry.minPrice === 'number' ? entry.minPrice : undefined,
    note: entry.note ?? undefined,
    validFrom: entry.validFrom ?? undefined,
    validTo: entry.validTo ?? undefined,
  };
};

const normalizeTensuEntry = (entry: OrcaTensuEntry, type: OrderMasterSearchType): OrderMasterSearchItem | null => {
  const name = entry.name?.trim();
  if (!name) return null;
  const code = entry.tensuCode?.trim();
  return {
    type,
    code: code || undefined,
    name,
    unit: entry.unit ?? undefined,
    category: entry.category ?? entry.kubun ?? undefined,
    points: typeof entry.points === 'number' ? entry.points : typeof entry.tanka === 'number' ? entry.tanka : undefined,
    note: entry.noticeDate ?? entry.effectiveDate ?? entry.tensuVersion ?? undefined,
    validFrom: entry.startDate ?? entry.effectiveDate ?? undefined,
    validTo: entry.endDate ?? undefined,
  };
};

const readMessage = (json: unknown, fallback: string) => {
  if (json && typeof json === 'object' && 'message' in json && typeof (json as { message?: unknown }).message === 'string') {
    return (json as { message?: string }).message ?? fallback;
  }
  return fallback;
};

const isLikelyCodeSearch = (value: string) => /^\d{4,}$/.test(value.trim());

const extractList = <T,>(json: unknown): { items: T[]; totalCount?: number } => {
  if (Array.isArray(json)) {
    return { items: json as T[], totalCount: (json as T[]).length };
  }
  if (json && typeof json === 'object') {
    const list = (json as OrcaMasterListResponse<T>).items;
    const total = (json as OrcaMasterListResponse<T>).totalCount;
    if (Array.isArray(list)) {
      return { items: list, totalCount: typeof total === 'number' ? total : list.length };
    }
  }
  return { items: [], totalCount: 0 };
};

export async function fetchOrderMasterSearch(params: {
  type: OrderMasterSearchType;
  keyword: string;
  effective?: string;
  category?: string;
  page?: number;
  size?: number;
  allowEmpty?: boolean;
}): Promise<OrderMasterSearchResult> {
  const keyword = params.keyword.trim();
  if (!keyword && params.type !== 'bodypart' && !params.allowEmpty) {
    return { ok: false, items: [], totalCount: 0, message: '検索キーワードが未指定です。' };
  }
  const query = new URLSearchParams();
  if (keyword) query.set('keyword', keyword);
  if (params.effective) query.set('effective', params.effective);
  if (params.category) query.set('category', params.category);
  if (params.type === 'bodypart' && !params.category) {
    query.set('category', '2');
  }
  if (params.type === 'generic-class') {
    query.set('page', String(params.page ?? 1));
    query.set('size', String(params.size ?? 50));
  }
  const endpoint = MASTER_ENDPOINT_MAP[params.type];
  const meta = ensureObservabilityMeta();
  const response = await httpFetch(`${endpoint}?${query.toString()}`, {
    headers: {
      userName: ORCA_MASTER_USER,
      password: ORCA_MASTER_PASSWORD,
    },
  });
  const json = (await response.json().catch(() => ({}))) as unknown;
  const latestMeta = getObservabilityMeta();

  if (!response.ok) {
    return {
      ok: false,
      items: [],
      totalCount: 0,
      runId: latestMeta.runId ?? meta.runId,
      cacheHit: latestMeta.cacheHit,
      missingMaster: latestMeta.missingMaster,
      fallbackUsed: latestMeta.fallbackUsed,
      dataSourceTransition: latestMeta.dataSourceTransition,
      message: readMessage(json, response.statusText || '検索に失敗しました。'),
      raw: json,
    };
  }

  if (params.type === 'etensu' || params.type === 'bodypart') {
    const { items, totalCount } = extractList<OrcaTensuEntry>(json);
    const normalized = items
      .map((entry) => normalizeTensuEntry(entry, params.type))
      .filter((item): item is OrderMasterSearchItem => Boolean(item));
    return {
      ok: true,
      items: normalized,
      totalCount: totalCount ?? normalized.length,
      runId: latestMeta.runId ?? meta.runId,
      cacheHit: latestMeta.cacheHit,
      missingMaster: latestMeta.missingMaster,
      fallbackUsed: latestMeta.fallbackUsed,
      dataSourceTransition: latestMeta.dataSourceTransition,
      raw: json,
    };
  }

  const { items, totalCount } = extractList<OrcaDrugMasterEntry>(json);
  const normalized = items
    .map((entry) => normalizeDrugEntry(entry, params.type))
    .filter((item): item is OrderMasterSearchItem => Boolean(item));

  let correctionCandidates: OrderMasterSearchItem[] | undefined;
  let correctionMeta: OrderMasterSearchResult['correctionMeta'] | undefined;
  if ((params.type === 'generic-class' || params.type === 'kensa-sort') && isLikelyCodeSearch(keyword)) {
    const baseDate = params.effective ?? new Date().toISOString().slice(0, 10);
    const requestXml = buildMedicationGetRequestXml({ requestCode: keyword, baseDate });
    const medicationResult = await fetchOrcaMedicationGetXml(requestXml);
    const apiOk = medicationResult.apiResult && /^0+$/.test(medicationResult.apiResult);
    correctionMeta = {
      apiResult: medicationResult.apiResult,
      apiResultMessage: medicationResult.apiResultMessage,
      validTo: medicationResult.medication?.endDate,
    };
    if (medicationResult.ok && apiOk && medicationResult.medication?.medicationName) {
      correctionCandidates = [
        {
          type: params.type,
          code: medicationResult.medication.medicationCode ?? keyword,
          name: medicationResult.medication.medicationName,
          unit: undefined,
          category: medicationResult.medication.medicationNameKana ?? 'medicationgetv2',
          note: medicationResult.apiResultMessage ?? 'medicationgetv2',
          validFrom: medicationResult.medication.startDate,
          validTo: medicationResult.medication.endDate,
        },
      ];
    } else {
      correctionCandidates = [];
    }
  }

  return {
    ok: true,
    items: normalized,
    totalCount: totalCount ?? normalized.length,
    runId: latestMeta.runId ?? meta.runId,
    cacheHit: latestMeta.cacheHit,
    missingMaster: latestMeta.missingMaster,
    fallbackUsed: latestMeta.fallbackUsed,
    dataSourceTransition: latestMeta.dataSourceTransition,
    raw: json,
    correctionCandidates,
    correctionMeta,
  };
}
