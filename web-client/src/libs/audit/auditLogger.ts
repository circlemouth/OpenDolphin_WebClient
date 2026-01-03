import { ensureObservabilityMeta, updateObservabilityMeta } from '../observability/observability';
import { resolveAuditActor } from '../auth/storedAuth';
import type { DataSourceTransition } from '../observability/types';
import { maskSensitiveLog } from '../logging/mask';

export type UiAction =
  | 'tone_change'
  | 'scenario_change'
  | 'scenario_override'
  | 'search'
  | 'navigate'
  | 'deeplink'
  | 'history_jump'
  | 'audit_open'
  | 'memo_edit_toggle'
  | 'diff'
  | 'send'
  | 'save'
  | 'print'
  | 'config_delivery'
  | 'finish'
  | 'draft'
  | 'cancel'
  | 'lock'
  | 'patient_fetch'
  | 'patient_save'
  | 'patient_edit_open'
  | 'outpatient_fetch';

export type UiStateLog = {
  action: UiAction;
  screen?: string;
  controlId?: string;
  tone?: string;
  runId?: string;
  traceId?: string;
  facilityId?: string;
  patientId?: string;
  appointmentId?: string;
  claimId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  dataSourceTransition?: DataSourceTransition;
  fallbackUsed?: boolean;
  details?: Record<string, unknown>;
  timestamp: string;
};

const uiStateLog: UiStateLog[] = [];

const mergeDefined = <T extends Record<string, unknown>>(base: T, next?: Partial<T>): T => {
  if (!next) return base;
  const merged = { ...base };
  (Object.keys(next) as (keyof T)[]).forEach((key) => {
    const value = next[key];
    if (value !== undefined) {
      merged[key] = value;
    }
  });
  return merged;
};

const resolveDataSourceTransition = (
  dataSourceTransition?: DataSourceTransition,
  cacheHit?: boolean,
  fallbackUsed?: boolean,
): DataSourceTransition => {
  if (dataSourceTransition) return dataSourceTransition;
  if (fallbackUsed) return 'fallback';
  if (cacheHit) return 'server';
  return 'server';
};

export function logUiState(entry: Omit<UiStateLog, 'timestamp'>) {
  const meta = ensureObservabilityMeta();
  const actorMeta = resolveAuditActor();
  const merged = mergeDefined({ ...meta } as UiStateLog, entry as Partial<UiStateLog>);
  const details =
    merged.details && typeof merged.details === 'object' && merged.details !== null
      ? (merged.details as Record<string, unknown>)
      : {};
  const resolvedFacilityId =
    merged.facilityId ??
    (details.facilityId as string | undefined) ??
    actorMeta.facilityId;
  const resolvedPatientId =
    merged.patientId ??
    (details.patientId as string | undefined);
  const resolvedAppointmentId =
    merged.appointmentId ??
    (details.appointmentId as string | undefined);
  const resolvedClaimId =
    merged.claimId ??
    (details.claimId as string | undefined);
  const resolvedRunId = merged.runId ?? meta.runId;
  const resolvedTraceId = merged.traceId ?? meta.traceId;
  const resolvedCacheHit = merged.cacheHit ?? meta.cacheHit ?? false;
  const resolvedMissingMaster = merged.missingMaster ?? meta.missingMaster ?? false;
  const resolvedFallbackUsed = merged.fallbackUsed ?? meta.fallbackUsed ?? false;
  const resolvedDataSourceTransition = resolveDataSourceTransition(
    merged.dataSourceTransition,
    merged.cacheHit,
    merged.fallbackUsed,
  );
  const normalizedDetails: Record<string, unknown> = { ...details };
  if (normalizedDetails.runId === undefined) normalizedDetails.runId = resolvedRunId;
  if (normalizedDetails.traceId === undefined) normalizedDetails.traceId = resolvedTraceId;
  if (normalizedDetails.cacheHit === undefined) normalizedDetails.cacheHit = resolvedCacheHit;
  if (normalizedDetails.missingMaster === undefined) normalizedDetails.missingMaster = resolvedMissingMaster;
  if (normalizedDetails.fallbackUsed === undefined) normalizedDetails.fallbackUsed = resolvedFallbackUsed;
  if (normalizedDetails.dataSourceTransition === undefined) {
    normalizedDetails.dataSourceTransition = resolvedDataSourceTransition;
  }
  if (normalizedDetails.facilityId === undefined) normalizedDetails.facilityId = resolvedFacilityId;
  if (resolvedPatientId !== undefined && normalizedDetails.patientId === undefined) {
    normalizedDetails.patientId = resolvedPatientId;
  }
  if (resolvedAppointmentId !== undefined && normalizedDetails.appointmentId === undefined) {
    normalizedDetails.appointmentId = resolvedAppointmentId;
  }
  if (resolvedClaimId !== undefined && normalizedDetails.claimId === undefined) {
    normalizedDetails.claimId = resolvedClaimId;
  }
  const record: UiStateLog = {
    ...merged,
    facilityId: resolvedFacilityId,
    patientId: resolvedPatientId,
    appointmentId: resolvedAppointmentId,
    claimId: resolvedClaimId,
    runId: resolvedRunId,
    traceId: resolvedTraceId,
    cacheHit: resolvedCacheHit,
    missingMaster: resolvedMissingMaster,
    fallbackUsed: resolvedFallbackUsed,
    dataSourceTransition: resolvedDataSourceTransition,
    details: normalizedDetails,
    timestamp: new Date().toISOString(),
  };
  const missing: string[] = [];
  if (!record.runId) missing.push('runId');
  if (record.dataSourceTransition === undefined) missing.push('dataSourceTransition');
  if (record.cacheHit === undefined) missing.push('cacheHit');
  if (record.missingMaster === undefined) missing.push('missingMaster');
  const maskedRecord = maskSensitiveLog(record);
  if (missing.length > 0 && typeof console !== 'undefined') {
    console.warn('[audit] UI state schema warning', { missing, record: maskedRecord });
  }
  uiStateLog.push(record);
  // 監査の目視突き合わせ用にブラウザコンソールと window へ露出する。
  if (typeof console !== 'undefined') {
    console.info('[audit] UI state', maskedRecord);
  }
  if (typeof window !== 'undefined') {
    (window as any).__AUDIT_UI_STATE__ = uiStateLog.map((entry) => maskSensitiveLog(entry));
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
  traceId?: string;
  source?: string;
  note?: string;
  facilityId?: string;
  patientId?: string;
  appointmentId?: string;
  claimId?: string;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
  dataSourceTransition?: DataSourceTransition;
  payload?: Record<string, unknown>;
  timestamp: string;
};

const auditEventLog: AuditEventRecord[] = [];

export function logAuditEvent(entry: Omit<AuditEventRecord, 'timestamp'>) {
  const meta = ensureObservabilityMeta();
  const actorMeta = resolveAuditActor();
  const base = mergeDefined({ ...meta } as AuditEventRecord, entry as Partial<AuditEventRecord>);
  const payload =
    entry.payload && typeof entry.payload === 'object'
      ? (entry.payload as Record<string, unknown>)
      : undefined;
  const rawDetails =
    payload && typeof payload.details === 'object' && payload.details !== null
      ? (payload.details as Record<string, unknown>)
      : {};
  const resolvedRunId =
    (rawDetails.runId as string | undefined) ?? (payload?.runId as string | undefined) ?? base.runId ?? meta.runId;
  const resolvedTraceId =
    (rawDetails.traceId as string | undefined) ??
    (payload?.traceId as string | undefined) ??
    base.traceId ??
    meta.traceId;
  const resolvedCacheHit =
    (rawDetails.cacheHit as boolean | undefined) ?? base.cacheHit ?? meta.cacheHit ?? false;
  const resolvedMissingMaster =
    (rawDetails.missingMaster as boolean | undefined) ?? base.missingMaster ?? meta.missingMaster ?? false;
  const resolvedFallbackUsed =
    (rawDetails.fallbackUsed as boolean | undefined) ?? base.fallbackUsed ?? meta.fallbackUsed ?? false;
  const resolvedDataSourceTransition =
    (rawDetails.dataSourceTransition as DataSourceTransition | undefined) ??
    base.dataSourceTransition ??
    meta.dataSourceTransition ??
    resolveDataSourceTransition(undefined, resolvedCacheHit, resolvedFallbackUsed);
  const resolvedFacilityId =
    (rawDetails.facilityId as string | undefined) ??
    (payload?.facilityId as string | undefined) ??
    base.facilityId ??
    actorMeta.facilityId;
  const resolvedPatientId =
    (rawDetails.patientId as string | undefined) ??
    (payload?.patientId as string | undefined) ??
    base.patientId;
  const resolvedAppointmentId =
    (rawDetails.appointmentId as string | undefined) ??
    (payload?.appointmentId as string | undefined) ??
    base.appointmentId;
  const resolvedClaimId =
    (rawDetails.claimId as string | undefined) ??
    (payload?.claimId as string | undefined) ??
    base.claimId;

  const normalizedDetails: Record<string, unknown> = { ...rawDetails };
  if (normalizedDetails.runId === undefined) normalizedDetails.runId = resolvedRunId;
  if (normalizedDetails.traceId === undefined) normalizedDetails.traceId = resolvedTraceId;
  if (normalizedDetails.dataSourceTransition === undefined) {
    normalizedDetails.dataSourceTransition = resolvedDataSourceTransition;
  }
  if (normalizedDetails.cacheHit === undefined) normalizedDetails.cacheHit = resolvedCacheHit;
  if (normalizedDetails.missingMaster === undefined) normalizedDetails.missingMaster = resolvedMissingMaster;
  if (normalizedDetails.fallbackUsed === undefined) normalizedDetails.fallbackUsed = resolvedFallbackUsed;
  if (normalizedDetails.facilityId === undefined) normalizedDetails.facilityId = resolvedFacilityId;
  if (resolvedPatientId !== undefined && normalizedDetails.patientId === undefined) {
    normalizedDetails.patientId = resolvedPatientId;
  }
  if (resolvedAppointmentId !== undefined && normalizedDetails.appointmentId === undefined) {
    normalizedDetails.appointmentId = resolvedAppointmentId;
  }
  if (resolvedClaimId !== undefined && normalizedDetails.claimId === undefined) {
    normalizedDetails.claimId = resolvedClaimId;
  }

  const normalizedPayload = payload
    ? {
        ...payload,
        runId: (payload.runId as string | undefined) ?? resolvedRunId,
        traceId: (payload.traceId as string | undefined) ?? resolvedTraceId,
        details: normalizedDetails,
      }
    : payload;

  const record: AuditEventRecord = {
    ...base,
    runId: resolvedRunId ?? base.runId,
    traceId: resolvedTraceId ?? base.traceId,
    facilityId: resolvedFacilityId ?? base.facilityId,
    patientId: resolvedPatientId ?? base.patientId,
    appointmentId: resolvedAppointmentId ?? base.appointmentId,
    claimId: resolvedClaimId ?? base.claimId,
    cacheHit: resolvedCacheHit,
    missingMaster: resolvedMissingMaster,
    fallbackUsed: resolvedFallbackUsed,
    dataSourceTransition: resolvedDataSourceTransition,
    payload: normalizedPayload,
    timestamp: new Date().toISOString(),
  };
  auditEventLog.push(record);
  const maskedEvent = maskSensitiveLog(record);
  if (typeof console !== 'undefined') {
    console.info('[audit] event', maskedEvent);
  }
  if (typeof window !== 'undefined') {
    (window as any).__AUDIT_EVENTS__ = auditEventLog.map((entry) => maskSensitiveLog(entry));
  }
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

export function getAuditEventLog() {
  return [...auditEventLog];
}

export function clearAuditEventLog() {
  auditEventLog.length = 0;
}
