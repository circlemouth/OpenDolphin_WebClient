import type { ChartsPrintMeta } from './outpatientClinicalDocument';
import type { DocumentType } from '../documentTemplates';
import { buildScopedStorageKey, type StorageScope } from '../../libs/session/storageScope';

export type DocumentOutputMode = 'print' | 'pdf';

export type DocumentPrintEntry = {
  id: string;
  type: DocumentType;
  issuedAt: string;
  title: string;
  savedAt: string;
  templateId: string;
  templateLabel: string;
  form: Record<string, string>;
  patientId: string;
};

export type DocumentPrintPreviewState = {
  document: DocumentPrintEntry;
  meta: ChartsPrintMeta;
  actor: string;
  facilityId: string;
  initialOutputMode?: DocumentOutputMode;
};

const STORAGE_BASE = 'opendolphin:web-client:charts:printPreview:document';
const OUTPUT_RESULT_BASE = 'opendolphin:web-client:charts:printResult:document';
const STORAGE_VERSION = 'v2';
const LEGACY_STORAGE_KEY = `${STORAGE_BASE}:v1`;
const LEGACY_OUTPUT_KEY = `${OUTPUT_RESULT_BASE}:v1`;
const MAX_AGE_MS = 10 * 60 * 1000;

type StoredEnvelope = {
  storedAt: string;
  value: DocumentPrintPreviewState;
};

export type DocumentOutputResult = {
  documentId: string;
  outcome: 'success' | 'failed' | 'blocked';
  mode?: DocumentOutputMode;
  at: string;
  detail?: string;
  runId?: string;
  traceId?: string;
  endpoint?: string;
  httpStatus?: number;
};

export function saveDocumentPrintPreview(value: DocumentPrintPreviewState, scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  const envelope: StoredEnvelope = { storedAt: new Date().toISOString(), value };
  try {
    const key = buildScopedStorageKey(STORAGE_BASE, STORAGE_VERSION, scope) ?? LEGACY_STORAGE_KEY;
    sessionStorage.setItem(key, JSON.stringify(envelope));
    if (key !== LEGACY_STORAGE_KEY) {
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function loadDocumentPrintPreview(
  scope?: StorageScope,
): { value: DocumentPrintPreviewState; storedAt: string } | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const scopedKey = buildScopedStorageKey(STORAGE_BASE, STORAGE_VERSION, scope);
    const raw = (scopedKey ? sessionStorage.getItem(scopedKey) : null) ?? sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredEnvelope> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.storedAt || !parsed.value) return null;
    const storedAtMs = new Date(parsed.storedAt).getTime();
    if (Number.isNaN(storedAtMs)) return null;
    if (Date.now() - storedAtMs > MAX_AGE_MS) {
      clearDocumentPrintPreview(scope);
      return null;
    }
    if (scopedKey && !sessionStorage.getItem(scopedKey)) {
      sessionStorage.setItem(scopedKey, raw);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    return { value: parsed.value as DocumentPrintPreviewState, storedAt: parsed.storedAt };
  } catch {
    return null;
  }
}

export function clearDocumentPrintPreview(scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const key = buildScopedStorageKey(STORAGE_BASE, STORAGE_VERSION, scope) ?? LEGACY_STORAGE_KEY;
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveDocumentOutputResult(value: DocumentOutputResult, scope?: StorageScope) {
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

export function loadDocumentOutputResult(scope?: StorageScope): DocumentOutputResult | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const scopedKey = buildScopedStorageKey(OUTPUT_RESULT_BASE, STORAGE_VERSION, scope);
    const raw = (scopedKey ? sessionStorage.getItem(scopedKey) : null) ?? sessionStorage.getItem(LEGACY_OUTPUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DocumentOutputResult;
    if (!parsed || typeof parsed !== 'object' || !parsed.documentId) return null;
    if (scopedKey && !sessionStorage.getItem(scopedKey)) {
      sessionStorage.setItem(scopedKey, raw);
      sessionStorage.removeItem(LEGACY_OUTPUT_KEY);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDocumentOutputResult(scope?: StorageScope) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const key = buildScopedStorageKey(OUTPUT_RESULT_BASE, STORAGE_VERSION, scope) ?? LEGACY_OUTPUT_KEY;
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
