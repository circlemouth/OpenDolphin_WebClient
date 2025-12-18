export type OutpatientEncounterContext = {
  patientId?: string;
  appointmentId?: string;
  receptionId?: string;
  visitDate?: string; // YYYY-MM-DD
};

const STORAGE_KEY = 'opendolphin:web-client:charts:encounter-context:v1';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const CHARTS_CONTEXT_QUERY_KEYS = {
  patientId: 'patientId',
  appointmentId: 'appointmentId',
  receptionId: 'receptionId',
  visitDate: 'visitDate',
} as const;

export const normalizeVisitDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!DATE_RE.test(trimmed)) return undefined;
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

export const buildChartsEncounterSearch = (context: OutpatientEncounterContext): string => {
  const params = new URLSearchParams();
  if (context.patientId) params.set(CHARTS_CONTEXT_QUERY_KEYS.patientId, context.patientId);
  if (context.appointmentId) params.set(CHARTS_CONTEXT_QUERY_KEYS.appointmentId, context.appointmentId);
  if (context.receptionId) params.set(CHARTS_CONTEXT_QUERY_KEYS.receptionId, context.receptionId);
  const normalizedDate = normalizeVisitDate(context.visitDate);
  if (normalizedDate) params.set(CHARTS_CONTEXT_QUERY_KEYS.visitDate, normalizedDate);
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const buildChartsUrl = (context: OutpatientEncounterContext): string =>
  `/charts${buildChartsEncounterSearch(context)}`;

export const storeChartsEncounterContext = (context: OutpatientEncounterContext) => {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    // storage が使えない環境ではスキップ
  }
};

export const loadChartsEncounterContext = (): OutpatientEncounterContext | null => {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OutpatientEncounterContext>;
    return {
      patientId: typeof parsed.patientId === 'string' ? parsed.patientId : undefined,
      appointmentId: typeof parsed.appointmentId === 'string' ? parsed.appointmentId : undefined,
      receptionId: typeof parsed.receptionId === 'string' ? parsed.receptionId : undefined,
      visitDate: normalizeVisitDate(typeof parsed.visitDate === 'string' ? parsed.visitDate : undefined),
    };
  } catch {
    return null;
  }
};

