import { logAuditEvent, type AuditEventRecord } from '../../libs/audit/auditLogger';
import { getObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition } from './authService';

export type ChartsAuditAction =
  | 'CHARTS_PATIENT_SWITCH'
  | 'ORCA_SEND'
  | 'ENCOUNTER_CLOSE'
  | 'DRAFT_SAVE'
  | 'DRAFT_CANCEL'
  | 'PRINT_OUTPATIENT'
  | 'CHARTS_ACTION_FAILURE';

export type ChartsAuditOutcome = 'success' | 'error' | 'blocked' | 'started';

type AuditContext = {
  runId?: string;
  traceId?: string;
  requestId?: string;
  dataSourceTransition?: DataSourceTransition;
  cacheHit?: boolean;
  missingMaster?: boolean;
  fallbackUsed?: boolean;
};

type ChartsAuditParams = AuditContext & {
  action: ChartsAuditAction;
  outcome: ChartsAuditOutcome;
  subject?: string;
  patientId?: string;
  appointmentId?: string;
  note?: string;
  durationMs?: number;
  error?: string;
};

const resolveDataSource = ({
  dataSourceTransition,
  cacheHit,
  fallbackUsed,
}: {
  dataSourceTransition?: DataSourceTransition;
  cacheHit?: boolean;
  fallbackUsed?: boolean;
}) => {
  if (dataSourceTransition) return dataSourceTransition;
  if (cacheHit) return 'cache';
  if (fallbackUsed) return 'fallback';
  return undefined;
};

const buildDetails = (params: ChartsAuditParams) => {
  const meta = getObservabilityMeta();
  const cacheHit = params.cacheHit ?? meta.cacheHit ?? false;
  const missingMaster = params.missingMaster ?? meta.missingMaster ?? false;
  const fallbackUsed = params.fallbackUsed ?? meta.fallbackUsed ?? false;
  const dataSourceTransition = params.dataSourceTransition ?? meta.dataSourceTransition;
  return {
    runId: params.runId ?? meta.runId,
    traceId: params.traceId ?? meta.traceId,
    requestId: params.requestId,
    dataSource: resolveDataSource({ dataSourceTransition, cacheHit, fallbackUsed }),
    dataSourceTransition,
    cacheHit,
    missingMaster,
    fallbackUsed,
    patientId: params.patientId,
    appointmentId: params.appointmentId,
    note: params.note,
    durationMs: params.durationMs,
    error: params.error,
  };
};

export function recordChartsAuditEvent(params: ChartsAuditParams) {
  const details = buildDetails(params);
  logAuditEvent({
    runId: details.runId,
    cacheHit: details.cacheHit,
    missingMaster: details.missingMaster,
    dataSourceTransition: details.dataSourceTransition,
    fallbackUsed: details.fallbackUsed,
    payload: {
      action: params.action,
      outcome: params.outcome,
      subject: params.subject,
      details,
    },
  });
}

export function normalizeAuditEventPayload(
  auditEvent: Record<string, unknown> | undefined,
  meta: AuditContext,
): Record<string, unknown> | undefined {
  if (!auditEvent) return undefined;
  const base = { ...auditEvent };
  const rawDetails = typeof base.details === 'object' && base.details !== null ? base.details : {};
  const cacheHit =
    (rawDetails as Record<string, unknown>).cacheHit ?? (rawDetails as Record<string, unknown>).cache ?? meta.cacheHit ?? false;
  const fallbackUsed =
    (rawDetails as Record<string, unknown>).fallbackUsed ?? meta.fallbackUsed ?? false;
  const dataSourceTransition =
    (rawDetails as Record<string, unknown>).dataSourceTransition ?? meta.dataSourceTransition;
  const mergedDetails = {
    runId: (rawDetails as Record<string, unknown>).runId ?? meta.runId,
    traceId: (rawDetails as Record<string, unknown>).traceId ?? meta.traceId,
    requestId: (rawDetails as Record<string, unknown>).requestId ?? meta.requestId,
    dataSource:
      (rawDetails as Record<string, unknown>).dataSource ??
      resolveDataSource({ dataSourceTransition, cacheHit, fallbackUsed }),
    dataSourceTransition,
    cacheHit,
    missingMaster: (rawDetails as Record<string, unknown>).missingMaster ?? meta.missingMaster ?? false,
    fallbackUsed,
    ...rawDetails,
  };

  return { ...base, runId: base.runId ?? mergedDetails.runId, details: mergedDetails };
}

export function normalizeAuditEventLog(
  record: AuditEventRecord | undefined,
  meta: AuditContext,
): Record<string, unknown> | undefined {
  if (!record) return undefined;
  const payload =
    (record.payload as Record<string, unknown> | undefined) ??
    (record as unknown as Record<string, unknown>);
  return normalizeAuditEventPayload(payload, meta);
}
