import { buildScopedStorageKey, type StorageScope } from '../../libs/session/storageScope';

export type OutpatientEncounterContext = {
  patientId?: string;
  appointmentId?: string;
  receptionId?: string;
  visitDate?: string; // YYYY-MM-DD
};

export type ChartsNavigationMeta = {
  runId?: string;
};

export type ReceptionCarryoverParams = {
  kw?: string;
  dept?: string;
  phys?: string;
  pay?: string;
  sort?: string;
  date?: string;
};

const STORAGE_BASE_KEY = 'opendolphin:web-client:charts:encounter-context';
const STORAGE_VERSION = 'v2';
const LEGACY_STORAGE_KEY = `${STORAGE_BASE_KEY}:v1`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const RUN_ID_RE = /^\d{8}T\d{6}Z$/;

export const CHARTS_CONTEXT_QUERY_KEYS = {
  patientId: 'patientId',
  appointmentId: 'appointmentId',
  receptionId: 'receptionId',
  visitDate: 'visitDate',
} as const;

export const CHARTS_META_QUERY_KEYS = {
  runId: 'runId',
} as const;

export const RECEPTION_CARRYOVER_QUERY_KEYS = {
  keyword: 'kw',
  department: 'dept',
  physician: 'phys',
  payment: 'pay',
  sort: 'sort',
  date: 'date',
} as const;

export const normalizeVisitDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!DATE_RE.test(trimmed)) return undefined;
  return trimmed;
};

export const normalizeRunId = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!RUN_ID_RE.test(trimmed)) return undefined;
  return trimmed;
};

export const hasEncounterContext = (context?: OutpatientEncounterContext | null): boolean => {
  if (!context) return false;
  return Boolean(context.receptionId || context.appointmentId || context.patientId || context.visitDate);
};

export const parseChartsEncounterContext = (search: string): OutpatientEncounterContext => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const patientId = params.get(CHARTS_CONTEXT_QUERY_KEYS.patientId) ?? undefined;
  const appointmentId = params.get(CHARTS_CONTEXT_QUERY_KEYS.appointmentId) ?? undefined;
  const receptionId = params.get(CHARTS_CONTEXT_QUERY_KEYS.receptionId) ?? undefined;
  const visitDate = normalizeVisitDate(params.get(CHARTS_CONTEXT_QUERY_KEYS.visitDate) ?? undefined);
  return { patientId, appointmentId, receptionId, visitDate };
};

export const parseChartsNavigationMeta = (search: string): ChartsNavigationMeta => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const runId = normalizeRunId(params.get(CHARTS_META_QUERY_KEYS.runId) ?? undefined);
  return { runId };
};

export const parseReceptionCarryoverParams = (search: string): ReceptionCarryoverParams => {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const keyword = params.get(RECEPTION_CARRYOVER_QUERY_KEYS.keyword) ?? undefined;
  const department = params.get(RECEPTION_CARRYOVER_QUERY_KEYS.department) ?? undefined;
  const physician = params.get(RECEPTION_CARRYOVER_QUERY_KEYS.physician) ?? undefined;
  const payment = params.get(RECEPTION_CARRYOVER_QUERY_KEYS.payment) ?? undefined;
  const sort = params.get(RECEPTION_CARRYOVER_QUERY_KEYS.sort) ?? undefined;
  const date = params.get(RECEPTION_CARRYOVER_QUERY_KEYS.date) ?? undefined;
  return { kw: keyword, dept: department, phys: physician, pay: payment, sort, date };
};

export const buildChartsEncounterSearch = (
  context: OutpatientEncounterContext,
  carryover: ReceptionCarryoverParams = {},
  meta: ChartsNavigationMeta = {},
): string => {
  const params = new URLSearchParams();
  if (context.patientId) params.set(CHARTS_CONTEXT_QUERY_KEYS.patientId, context.patientId);
  if (context.appointmentId) params.set(CHARTS_CONTEXT_QUERY_KEYS.appointmentId, context.appointmentId);
  if (context.receptionId) params.set(CHARTS_CONTEXT_QUERY_KEYS.receptionId, context.receptionId);
  const normalizedDate = normalizeVisitDate(context.visitDate);
  if (normalizedDate) params.set(CHARTS_CONTEXT_QUERY_KEYS.visitDate, normalizedDate);
  const normalizedRunId = normalizeRunId(meta.runId);
  if (normalizedRunId) params.set(CHARTS_META_QUERY_KEYS.runId, normalizedRunId);
  if (carryover.kw) params.set(RECEPTION_CARRYOVER_QUERY_KEYS.keyword, carryover.kw);
  if (carryover.dept) params.set(RECEPTION_CARRYOVER_QUERY_KEYS.department, carryover.dept);
  if (carryover.phys) params.set(RECEPTION_CARRYOVER_QUERY_KEYS.physician, carryover.phys);
  if (carryover.pay) params.set(RECEPTION_CARRYOVER_QUERY_KEYS.payment, carryover.pay);
  if (carryover.sort) params.set(RECEPTION_CARRYOVER_QUERY_KEYS.sort, carryover.sort);
  if (carryover.date) params.set(RECEPTION_CARRYOVER_QUERY_KEYS.date, carryover.date);
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const buildChartsUrl = (
  context: OutpatientEncounterContext,
  carryover?: ReceptionCarryoverParams,
  meta?: ChartsNavigationMeta,
  basePath = '/charts',
): string => `${basePath}${buildChartsEncounterSearch(context, carryover, meta)}`;

const loadFromRaw = (raw: string | null): OutpatientEncounterContext | null => {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Partial<OutpatientEncounterContext>;
  return {
    patientId: typeof parsed.patientId === 'string' ? parsed.patientId : undefined,
    appointmentId: typeof parsed.appointmentId === 'string' ? parsed.appointmentId : undefined,
    receptionId: typeof parsed.receptionId === 'string' ? parsed.receptionId : undefined,
    visitDate: normalizeVisitDate(typeof parsed.visitDate === 'string' ? parsed.visitDate : undefined),
  };
};

export const storeChartsEncounterContext = (context: OutpatientEncounterContext, scope?: StorageScope) => {
  if (typeof sessionStorage === 'undefined') return;
  const scopedKey = buildScopedStorageKey(STORAGE_BASE_KEY, STORAGE_VERSION, scope) ?? LEGACY_STORAGE_KEY;
  try {
    sessionStorage.setItem(scopedKey, JSON.stringify(context));
  } catch {
    // storage が使えない環境ではスキップ
  }
};

export const loadChartsEncounterContext = (scope?: StorageScope): OutpatientEncounterContext | null => {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const scopedKey = buildScopedStorageKey(STORAGE_BASE_KEY, STORAGE_VERSION, scope);
    const rawScoped = scopedKey ? sessionStorage.getItem(scopedKey) : null;
    if (rawScoped) return loadFromRaw(rawScoped);

    // legacy fallback
    const legacyRaw = sessionStorage.getItem(LEGACY_STORAGE_KEY);
    const legacy = loadFromRaw(legacyRaw);
    if (legacy && scopedKey) {
      try {
        sessionStorage.setItem(scopedKey, JSON.stringify(legacy));
        sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // ignore migration errors
      }
    }
    return legacy;
  } catch {
    return null;
  }
};
