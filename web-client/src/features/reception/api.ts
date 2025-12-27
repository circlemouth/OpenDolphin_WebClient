import type { QueryFunctionContext } from '@tanstack/react-query';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition, ResolveMasterSource } from '../../libs/observability/types';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { fetchWithResolver } from '../outpatient/fetchWithResolver';
import { attachAppointmentMeta, mergeOutpatientMeta, parseAppointmentEntries, parseClaimBundles, resolveClaimStatus } from '../outpatient/transformers';
import type {
  AppointmentPayload,
  ClaimOutpatientPayload,
  ClaimQueueEntry,
  ClaimQueuePhase,
  OutpatientFlagResponse,
  ReceptionEntry,
  ReceptionStatus,
} from '../outpatient/types';
export type { ReceptionEntry, ReceptionStatus, OutpatientFlagResponse, AppointmentPayload } from '../outpatient/types';

export type AppointmentQueryParams = {
  date: string;
  keyword?: string;
  departmentCode?: string;
  physicianCode?: string;
  page?: number;
  size?: number;
};

const claimCandidates = [{ path: '/api01rv2/claim/outpatient', source: 'server' as ResolveMasterSource }];

const appointmentCandidates = [
  { path: '/api01rv2/appointment/outpatient/list', source: 'server' as ResolveMasterSource },
  { path: '/api01rv2/appointment/outpatient', source: 'server' as ResolveMasterSource },
  { path: '/api01rv2/appointment/outpatient/mock', source: 'mock' as ResolveMasterSource },
];

const preferredSource = (): ResolveMasterSource | undefined =>
  import.meta.env.VITE_DISABLE_MSW === '1' ? 'server' : undefined;

const resolvedDataSource = (transition?: DataSourceTransition, fallback?: ResolveMasterSource): ResolveMasterSource | undefined =>
  (transition as ResolveMasterSource | undefined) ?? fallback;

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeQueuePhase = (phase?: string): ClaimQueuePhase => {
  if (!phase) return 'pending';
  if (phase === 'retry' || phase === 'hold' || phase === 'failed' || phase === 'sent' || phase === 'ack') return phase;
  if (phase === 'delivered') return 'ack';
  if (phase === 'queued' || phase === 'waiting') return 'pending';
  if (phase === 'error') return 'failed';
  return 'pending';
};

const toIsoString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
};

const parseQueueEntries = (json: any): ClaimQueueEntry[] => {
  const queue: any[] =
    (Array.isArray(json?.queue) && json.queue) ||
    (Array.isArray(json?.queueEntries) && json.queueEntries) ||
    (Array.isArray(json?.queue?.entries) && json.queue.entries) ||
    [];
  if (queue.length === 0) return [];

  return queue.map((item, index) => {
    const phase = normalizeQueuePhase(item?.phase ?? item?.status ?? item?.state);
    return {
      id: (item?.id as string | undefined) ?? (item?.requestId as string | undefined) ?? `queue-${index}`,
      phase,
      retryCount: toNumber(item?.retryCount ?? item?.retries ?? item?.attempts),
      nextRetryAt: toIsoString(item?.nextRetryAt ?? item?.nextRetryAtMs ?? item?.retryAt),
      errorMessage: item?.errorMessage ?? item?.error ?? item?.message,
      holdReason: item?.holdReason ?? item?.reason,
      requestId: item?.requestId,
      patientId: item?.patientId,
      appointmentId: item?.appointmentId,
      fallbackUsed: typeof item?.fallbackUsed === 'boolean' ? item.fallbackUsed : undefined,
    };
  });
};

export async function fetchAppointmentOutpatients(
  params: AppointmentQueryParams,
  context?: QueryFunctionContext,
  options: { preferredSourceOverride?: ResolveMasterSource } = {},
): Promise<AppointmentPayload> {
  const page = params.page ?? 1;
  const size = params.size ?? 50;
  const result = await fetchWithResolver({
    candidates: appointmentCandidates,
    body: {
      appointmentDate: params.date,
      keyword: params.keyword,
      departmentCode: params.departmentCode,
      physicianCode: params.physicianCode,
      page,
      size,
    },
    queryContext: context,
    preferredSource: options.preferredSourceOverride ?? preferredSource(),
    description: 'appointment_outpatient',
  });

  const json = result.raw ?? {};
  const entries = parseAppointmentEntries(json);
  const mergedMeta = mergeOutpatientMeta(json, {
    ...result.meta,
    recordsReturned: entries.length,
    resolveMasterSource: resolvedDataSource(result.meta.dataSourceTransition, result.meta.resolveMasterSource),
    page,
    size,
  });

  const payload: AppointmentPayload = attachAppointmentMeta(
    {
      entries,
      raw: json,
      apiResult: (json as any).apiResult,
      apiResultMessage: (json as any).apiResultMessage,
    },
    mergedMeta,
  );

  recordOutpatientFunnel('charts_orchestration', {
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? result.meta.fromCache ?? false,
    missingMaster: payload.missingMaster ?? false,
    dataSourceTransition: payload.dataSourceTransition ?? 'snapshot',
    fallbackUsed: payload.fallbackUsed ?? false,
    action: 'appointment_fetch',
    outcome: result.ok ? 'success' : 'error',
    note: payload.sourcePath,
    reason: result.ok ? undefined : result.error ?? payload.apiResultMessage ?? payload.apiResult,
  });

  logUiState({
    action: 'outpatient_fetch',
    screen: 'reception',
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? result.meta.fromCache,
    missingMaster: payload.missingMaster,
    dataSourceTransition: payload.dataSourceTransition,
    fallbackUsed: payload.fallbackUsed,
    details: {
      endpoint: payload.sourcePath ?? result.meta.sourcePath,
      fetchedAt: payload.fetchedAt,
      recordsReturned: payload.recordsReturned,
      resolveMasterSource: payload.resolveMasterSource,
      fromCache: result.meta.fromCache,
      retryCount: result.meta.retryCount,
      description: 'appointment_outpatient',
    },
  });

  logAuditEvent({
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? result.meta.fromCache,
    missingMaster: payload.missingMaster,
    fallbackUsed: payload.fallbackUsed,
    dataSourceTransition: payload.dataSourceTransition,
    patientId: entries[0]?.patientId,
    appointmentId: entries[0]?.appointmentId,
    payload: {
      action: 'APPOINTMENT_OUTPATIENT_FETCH',
      outcome: result.ok ? 'success' : 'error',
      details: {
        runId: payload.runId,
        cacheHit: payload.cacheHit ?? result.meta.fromCache ?? false,
        missingMaster: payload.missingMaster ?? false,
        fallbackUsed: payload.fallbackUsed ?? false,
        dataSourceTransition: payload.dataSourceTransition ?? result.meta.dataSourceTransition,
        fetchedAt: payload.fetchedAt,
        recordsReturned: payload.recordsReturned ?? entries.length,
        page: payload.page,
        size: payload.size,
        resolveMasterSource: payload.resolveMasterSource,
        sourcePath: payload.sourcePath ?? result.meta.sourcePath,
        apiResult: payload.apiResult,
        apiResultMessage: payload.apiResultMessage,
        patientId: entries[0]?.patientId,
        appointmentId: entries[0]?.appointmentId,
        error: result.ok ? undefined : result.error ?? payload.apiResultMessage,
      },
    },
  });

  updateObservabilityMeta({
    runId: payload.runId,
    cacheHit: payload.cacheHit,
    missingMaster: payload.missingMaster,
    dataSourceTransition: payload.dataSourceTransition,
    fallbackUsed: payload.fallbackUsed,
    fetchedAt: payload.fetchedAt,
    recordsReturned: payload.recordsReturned,
  });

  return payload;
}

export async function fetchClaimFlags(
  context?: QueryFunctionContext,
  options: { screen?: 'reception' | 'charts'; preferredSourceOverride?: ResolveMasterSource } = {},
): Promise<ClaimOutpatientPayload> {
  const result = await fetchWithResolver({
    candidates: claimCandidates,
    queryContext: context,
    preferredSource: options.preferredSourceOverride ?? preferredSource(),
    description: 'claim_outpatient',
  });

  const json = result.raw ?? {};
  const bundles = parseClaimBundles(json);
  const queueEntries = parseQueueEntries(json);
  const claimInformation = (json as any)?.['claim:information'] ?? (json as any)?.claim?.information ?? (json as any)?.claimInformation ?? (json as any)?.information;
  const claimInformationStatus =
    claimInformation?.status ?? claimInformation?.claimStatus ?? claimInformation?.['claim:status'] ?? claimInformation?.['claim_status'];
  const resolvedClaimStatusText =
    (json as any).claimStatus ??
    claimInformationStatus ??
    (json as any).status ??
    (json as any).apiResult ??
    bundles[0]?.claimStatusText;
  const metaRecords = typeof json.recordsReturned === 'number' ? (json.recordsReturned as number) : bundles.length || undefined;
  const meta = mergeOutpatientMeta(json, {
    ...result.meta,
    recordsReturned: metaRecords,
    resolveMasterSource: resolvedDataSource(result.meta.dataSourceTransition, result.meta.resolveMasterSource),
  });

  const payload: ClaimOutpatientPayload = {
    ...meta,
    bundles,
    claimStatus: resolveClaimStatus(resolvedClaimStatusText) ?? bundles[0]?.claimStatus,
    claimStatusText: typeof resolvedClaimStatusText === 'string' ? resolvedClaimStatusText : bundles[0]?.claimStatusText,
    queueEntries,
    raw: json as Record<string, unknown>,
    apiResult: (json as any).apiResult,
    apiResultMessage: (json as any).apiResultMessage,
  };

  recordOutpatientFunnel('charts_orchestration', {
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? result.meta.fromCache ?? false,
    missingMaster: payload.missingMaster ?? false,
    dataSourceTransition: payload.dataSourceTransition ?? 'snapshot',
    fallbackUsed: payload.fallbackUsed ?? false,
    action: 'claim_fetch',
    outcome: result.ok ? 'success' : 'error',
    note: payload.sourcePath,
    reason: result.ok ? undefined : result.error ?? payload.apiResultMessage ?? payload.apiResult,
  });

  logUiState({
    action: 'outpatient_fetch',
    screen: options.screen ?? 'reception',
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? result.meta.fromCache,
    missingMaster: payload.missingMaster,
    dataSourceTransition: payload.dataSourceTransition,
    fallbackUsed: payload.fallbackUsed,
    patientId: bundles[0]?.patientId,
    appointmentId: bundles[0]?.appointmentId,
    claimId: bundles[0]?.bundleNumber,
    details: {
      endpoint: payload.sourcePath ?? result.meta.sourcePath,
      fetchedAt: payload.fetchedAt,
      recordsReturned: payload.recordsReturned,
       hasNextPage: payload.hasNextPage,
      claimBundles: bundles.length,
      queueEntries: queueEntries.length,
      patientId: bundles[0]?.patientId,
      appointmentId: bundles[0]?.appointmentId,
      claimId: bundles[0]?.bundleNumber,
      resolveMasterSource: payload.resolveMasterSource,
      fromCache: result.meta.fromCache,
      retryCount: result.meta.retryCount,
      description: 'claim_outpatient',
      claimStatus: payload.claimStatus ?? payload.claimStatusText,
      apiResult: payload.apiResult,
      apiResultMessage: payload.apiResultMessage,
      fallbackFlagMissing: payload.fallbackFlagMissing,
    },
  });

  logAuditEvent({
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? result.meta.fromCache,
    missingMaster: payload.missingMaster,
    fallbackUsed: payload.fallbackUsed,
    dataSourceTransition: payload.dataSourceTransition,
    payload: {
      action: 'CLAIM_OUTPATIENT_FETCH',
      outcome: result.ok ? 'success' : 'error',
      claimStatus: payload.claimStatus ?? payload.claimStatusText,
      claimBundles: bundles.length,
      apiResult: payload.apiResult,
      apiResultMessage: payload.apiResultMessage,
      details: {
        runId: payload.runId,
        cacheHit: payload.cacheHit ?? result.meta.fromCache ?? false,
        missingMaster: payload.missingMaster ?? false,
        fallbackUsed: payload.fallbackUsed ?? false,
        fallbackFlagMissing: payload.fallbackFlagMissing ?? false,
        dataSourceTransition: payload.dataSourceTransition ?? result.meta.dataSourceTransition,
        fetchedAt: payload.fetchedAt,
        recordsReturned: payload.recordsReturned ?? bundles.length,
        hasNextPage: payload.hasNextPage,
        page: payload.page,
        size: payload.size,
        queueEntries: queueEntries.length,
        claimBundles: bundles.length,
        patientId: bundles[0]?.patientId,
        appointmentId: bundles[0]?.appointmentId,
        claimId: bundles[0]?.bundleNumber,
        sourcePath: payload.sourcePath ?? result.meta.sourcePath,
        error: result.ok ? undefined : result.error ?? payload.apiResultMessage,
      },
    },
  });

  updateObservabilityMeta({
    runId: payload.runId,
    cacheHit: payload.cacheHit,
    missingMaster: payload.missingMaster,
    dataSourceTransition: payload.dataSourceTransition,
    fallbackUsed: payload.fallbackUsed,
    fetchedAt: payload.fetchedAt,
    recordsReturned: payload.recordsReturned,
  });

  return payload;
}
