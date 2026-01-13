import type { ReceptionEntry } from '../../reception/api';
import type { ChartsPrintMeta } from './outpatientClinicalDocument';
import type { OrcaReportType } from '../orcaReportApi';

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

const STORAGE_KEY = 'opendolphin:web-client:charts:printPreview:outpatient';
const REPORT_STORAGE_KEY = 'opendolphin:web-client:charts:printPreview:report';
const OUTPUT_RESULT_KEY = 'opendolphin:web-client:charts:printResult:outpatient';
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

export function saveOutpatientPrintPreview(value: OutpatientPrintPreviewState) {
  if (typeof sessionStorage === 'undefined') return;
  const envelope: StoredEnvelope = { storedAt: new Date().toISOString(), value };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // storage 利用不可/容量不足は無視（リロード復元のみが失われる）
  }
}

export function loadOutpatientPrintPreview(): { value: OutpatientPrintPreviewState; storedAt: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredEnvelope> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.storedAt || !parsed.value) return null;
    const storedAtMs = new Date(parsed.storedAt).getTime();
    if (Number.isNaN(storedAtMs)) return null;
    if (Date.now() - storedAtMs > MAX_AGE_MS) {
      clearOutpatientPrintPreview();
      return null;
    }
    return { value: parsed.value as OutpatientPrintPreviewState, storedAt: parsed.storedAt };
  } catch {
    return null;
  }
}

export function clearOutpatientPrintPreview() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveReportPrintPreview(value: ReportPrintPreviewState) {
  if (typeof sessionStorage === 'undefined') return;
  const envelope: ReportStoredEnvelope = { storedAt: new Date().toISOString(), value };
  try {
    sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // ignore
  }
}

export function loadReportPrintPreview(): { value: ReportPrintPreviewState; storedAt: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(REPORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ReportStoredEnvelope> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.storedAt || !parsed.value) return null;
    const storedAtMs = new Date(parsed.storedAt).getTime();
    if (Number.isNaN(storedAtMs)) return null;
    if (Date.now() - storedAtMs > MAX_AGE_MS) {
      clearReportPrintPreview();
      return null;
    }
    return { value: parsed.value as ReportPrintPreviewState, storedAt: parsed.storedAt };
  } catch {
    return null;
  }
}

export function clearReportPrintPreview() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(REPORT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveOutpatientOutputResult(value: OutpatientOutputResult) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(OUTPUT_RESULT_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function loadOutpatientOutputResult(): OutpatientOutputResult | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(OUTPUT_RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OutpatientOutputResult;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOutpatientOutputResult() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(OUTPUT_RESULT_KEY);
  } catch {
    // ignore
  }
}
