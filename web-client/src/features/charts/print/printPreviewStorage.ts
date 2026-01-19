import type { ReceptionEntry } from '../../reception/api';
import type { ChartsPrintMeta } from './outpatientClinicalDocument';
import type { OrcaReportType } from '../orcaReportApi';
import { buildScopedStorageKey, type StorageScope } from '../../libs/session/storageScope';

export type OutpatientPrintPreviewState = {
  entry: ReceptionEntry;
  meta: ChartsPrintMeta;
  actor: string;
  facilityId: string;
};

export type ReportPrintPreviewState = {
  reportType: OrcaReportType;
  reportLabel: string;
  dataId: string;
  patientId?: string;
  appointmentId?: string;
  invoiceNumber?: string;
  departmentCode?: string;
  insuranceCombinationNumber?: string;
  performMonth?: string;
  requestedAt: string;
  meta: ChartsPrintMeta;
  actor: string;
  facilityId: string;
};

const OUTPATIENT_STORAGE_BASE = 'opendolphin:web-client:charts:printPreview:outpatient';
const REPORT_STORAGE_BASE = 'opendolphin:web-client:charts:printPreview:report';
const OUTPUT_RESULT_BASE = 'opendolphin:web-client:charts:printResult:outpatient';
const STORAGE_VERSION = 'v2';
const LEGACY_OUTPATIENT_KEY = `${OUTPATIENT_STORAGE_BASE}:v1`;
const LEGACY_REPORT_KEY = `${REPORT_STORAGE_BASE}:v1`;
const LEGACY_OUTPUT_KEY = `${OUTPUT_RESULT_BASE}:v1`;
const MAX_AGE_MS = 10 * 60 * 1000; // 10分（PHIを含むため短期）

type StoredEnvelope = {
  storedAt: string;
  value: OutpatientPrintPreviewState;
};

type ReportStoredEnvelope = {
  storedAt: string;
  value: ReportPrintPreviewState;
};

export type OutpatientOutputResult = {
  patientId?: string;
  appointmentId?: string;
  outcome: 'success' | 'failed' | 'blocked';
  mode?: 'print' | 'pdf';
  at: string;
  detail?: string;
  runId?: string;
  traceId?: string;
  endpoint?: string;
  httpStatus?: number;
};

export function saveOutpatientPrintPreview(value: OutpatientPrintPreviewState, scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  const envelope: StoredEnvelope = { storedAt: new Date().toISOString(), value };
  try {
    const key = buildScopedStorageKey(OUTPATIENT_STORAGE_BASE, STORAGE_VERSION, scope) ?? LEGACY_OUTPATIENT_KEY;
    sessionStorage.setItem(key, JSON.stringify(envelope));
    if (key !== LEGACY_OUTPATIENT_KEY) {
      sessionStorage.removeItem(LEGACY_OUTPATIENT_KEY);
    }
  } catch {
    // storage 利用不可/容量不足は無視（リロード復元のみが失われる）
  }
}

export function loadOutpatientPrintPreview(
  scope?: StorageScope,
): { value: OutpatientPrintPreviewState; storedAt: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const scopedKey = buildScopedStorageKey(OUTPATIENT_STORAGE_BASE, STORAGE_VERSION, scope);
    const raw = (scopedKey ? sessionStorage.getItem(scopedKey) : null) ?? sessionStorage.getItem(LEGACY_OUTPATIENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredEnvelope> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.storedAt || !parsed.value) return null;
    const storedAtMs = new Date(parsed.storedAt).getTime();
    if (Number.isNaN(storedAtMs)) return null;
    if (Date.now() - storedAtMs > MAX_AGE_MS) {
      clearOutpatientPrintPreview(scope);
      return null;
    }
    if (scopedKey && !sessionStorage.getItem(scopedKey)) {
      sessionStorage.setItem(scopedKey, raw);
      sessionStorage.removeItem(LEGACY_OUTPATIENT_KEY);
    }
    return { value: parsed.value as OutpatientPrintPreviewState, storedAt: parsed.storedAt };
  } catch {
    return null;
  }
}

export function clearOutpatientPrintPreview(scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const key = buildScopedStorageKey(OUTPATIENT_STORAGE_BASE, STORAGE_VERSION, scope) ?? LEGACY_OUTPATIENT_KEY;
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveReportPrintPreview(value: ReportPrintPreviewState, scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  const envelope: ReportStoredEnvelope = { storedAt: new Date().toISOString(), value };
  try {
    const key = buildScopedStorageKey(REPORT_STORAGE_BASE, STORAGE_VERSION, scope) ?? LEGACY_REPORT_KEY;
    sessionStorage.setItem(key, JSON.stringify(envelope));
    if (key !== LEGACY_REPORT_KEY) {
      sessionStorage.removeItem(LEGACY_REPORT_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadReportPrintPreview(scope?: StorageScope): { value: ReportPrintPreviewState; storedAt: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const scopedKey = buildScopedStorageKey(REPORT_STORAGE_BASE, STORAGE_VERSION, scope);
    const raw = (scopedKey ? sessionStorage.getItem(scopedKey) : null) ?? sessionStorage.getItem(LEGACY_REPORT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReportStoredEnvelope> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.storedAt || !parsed.value) return null;
    const storedAtMs = new Date(parsed.storedAt).getTime();
    if (Number.isNaN(storedAtMs)) return null;
    if (Date.now() - storedAtMs > MAX_AGE_MS) {
      clearReportPrintPreview(scope);
      return null;
    }
    if (scopedKey && !sessionStorage.getItem(scopedKey)) {
      sessionStorage.setItem(scopedKey, raw);
      sessionStorage.removeItem(LEGACY_REPORT_KEY);
    }
    return { value: parsed.value as ReportPrintPreviewState, storedAt: parsed.storedAt };
  } catch {
    return null;
  }
}

export function clearReportPrintPreview(scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const key = buildScopedStorageKey(REPORT_STORAGE_BASE, STORAGE_VERSION, scope) ?? LEGACY_REPORT_KEY;
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveOutpatientOutputResult(value: OutpatientOutputResult, scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const key = buildScopedStorageKey(OUTPUT_RESULT_BASE, STORAGE_VERSION, scope) ?? LEGACY_OUTPUT_KEY;
    sessionStorage.setItem(key, JSON.stringify(value));
    if (key !== LEGACY_OUTPUT_KEY) {
      sessionStorage.removeItem(LEGACY_OUTPUT_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadOutpatientOutputResult(scope?: StorageScope): OutpatientOutputResult | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const scopedKey = buildScopedStorageKey(OUTPUT_RESULT_BASE, STORAGE_VERSION, scope);
    const raw = (scopedKey ? sessionStorage.getItem(scopedKey) : null) ?? sessionStorage.getItem(LEGACY_OUTPUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OutpatientOutputResult;
    if (!parsed || typeof parsed !== 'object') return null;
    if (scopedKey && !sessionStorage.getItem(scopedKey)) {
      sessionStorage.setItem(scopedKey, raw);
      sessionStorage.removeItem(LEGACY_OUTPUT_KEY);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearOutpatientOutputResult(scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const key = buildScopedStorageKey(OUTPUT_RESULT_BASE, STORAGE_VERSION, scope) ?? LEGACY_OUTPUT_KEY;
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
