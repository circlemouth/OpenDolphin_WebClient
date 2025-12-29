import type { ChartsPrintMeta } from './outpatientClinicalDocument';
import type { DocumentType } from '../documentTemplates';

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

const STORAGE_KEY = 'opendolphin:web-client:charts:printPreview:document';
const MAX_AGE_MS = 10 * 60 * 1000;

type StoredEnvelope = {
  storedAt: string;
  value: DocumentPrintPreviewState;
};

export function saveDocumentPrintPreview(value: DocumentPrintPreviewState) {
  if (typeof sessionStorage === 'undefined') return;
  const envelope: StoredEnvelope = { storedAt: new Date().toISOString(), value };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // ignore
  }
}

export function loadDocumentPrintPreview(): { value: DocumentPrintPreviewState; storedAt: string } | null {
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
      clearDocumentPrintPreview();
      return null;
    }
    return { value: parsed.value as DocumentPrintPreviewState, storedAt: parsed.storedAt };
  } catch {
    return null;
  }
}

export function clearDocumentPrintPreview() {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
