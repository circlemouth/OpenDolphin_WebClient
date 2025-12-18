import { getObservabilityMeta, updateObservabilityMeta } from '../observability/observability';
import type { DataSourceTransition } from '../observability/types';

export type UiAction =
  | 'tone_change'
  | 'send'
  | 'save'
  | 'print'
  | 'config_delivery'
  | 'finish'
  | 'draft'
  | 'cancel'
  | 'lock'
  | 'patient_fetch'
  | 'outpatient_fetch';

export type UiStateLog = {
  action: UiAction;
  screen?: string;
  controlId?: string;
  tone?: string;
  runId?: string;
  traceId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
  fallbackUsed?: boolean;
  details?: Record<string, unknown>;
  timestamp: string;
};

const uiStateLog: UiStateLog[] = [];

export function logUiState(entry: Omit<UiStateLog, 'timestamp'>) {
  const meta = getObservabilityMeta();
  const record: UiStateLog = {
    ...meta,
    ...entry,
    timestamp: new Date().toISOString(),
  };
  const missing: string[] = [];
  if (!record.runId) missing.push('runId');
  if (record.dataSourceTransition === undefined) missing.push('dataSourceTransition');
  if (record.cacheHit === undefined) missing.push('cacheHit');
  if (record.missingMaster === undefined) missing.push('missingMaster');
  if (missing.length > 0 && typeof console !== 'undefined') {
    console.warn('[audit] UI state schema warning', { missing, record });
  }
  uiStateLog.push(record);
  // 監査の目視突き合わせ用にブラウザコンソールと window へ露出する。
  if (typeof console !== 'undefined') {
    console.info('[audit] UI state', record);
  }
  if (typeof window !== 'undefined') {
    (window as any).__AUDIT_UI_STATE__ = [...uiStateLog];
  }
  // tone 変更や runId 更新の副作用が meta に伝播するよう同期する。
  updateObservabilityMeta({
    runId: record.runId,
    traceId: record.traceId,
    cacheHit: record.cacheHit,
    missingMaster: record.missingMaster,
    dataSourceTransition: record.dataSourceTransition,
    fallbackUsed: record.fallbackUsed,
  });
  return record;
}

export function getUiStateLog() {
  return [...uiStateLog];
}

export function clearUiStateLog() {
  uiStateLog.length = 0;
}

export type AuditEventRecord = {
  runId?: string;
  source?: string;
  note?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  dataSourceTransition?: DataSourceTransition;
  payload?: Record<string, unknown>;
  timestamp: string;
};

const auditEventLog: AuditEventRecord[] = [];

export function logAuditEvent(entry: Omit<AuditEventRecord, 'timestamp'>) {
  const record: AuditEventRecord = { ...entry, timestamp: new Date().toISOString() };
  auditEventLog.push(record);
  if (typeof console !== 'undefined') {
    console.info('[audit] event', record);
  }
  if (typeof window !== 'undefined') {
    (window as any).__AUDIT_EVENTS__ = [...auditEventLog];
  }
  return record;
}

export function getAuditEventLog() {
  return [...auditEventLog];
}

export function clearAuditEventLog() {
  auditEventLog.length = 0;
}
