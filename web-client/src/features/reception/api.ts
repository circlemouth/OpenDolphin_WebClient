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
  ReceptionEntry,
  OutpatientMeta,
} from '../outpatient/types';
import { loadOrcaClaimSendCache } from '../charts/orcaClaimSendCache';
import { getOrcaIncomeInfoEntry } from '../charts/orcaIncomeInfoCache';
import {
  buildPaidInvoiceSet,
  buildQueueEntryFromSendCache,
  buildSendClaimBundle,
  mergeClaimBundles,
  mergeQueueEntries,
  resolveOverallClaimStatus,
} from '../charts/orcaBillingStatus';
export type { ReceptionEntry, ReceptionStatus, OutpatientFlagResponse, AppointmentPayload } from '../outpatient/types';

export type AppointmentQueryParams = {
  date: string;
  keyword?: string;
  departmentCode?: string;
  physicianCode?: string;
  page?: number;
  size?: number;
};

export type VisitMutationParams = {
  patientId: string;
  acceptanceDate: string;
  acceptanceTime?: string;
  departmentCode?: string;
  physicianCode?: string;
  medicalInformation?: string;
  /**
   * 01: 登録 / 02: 取消 / 03: 更新 / 00: 照会
   */
  requestNumber: '00' | '01' | '02' | '03';
  /**
   * ORCA の保険/自費区分。保険=1, 自費=9 を送る。
   */
  paymentMode?: 'insurance' | 'self';
  /**
   * 受付区分。仕様上 1:通常,2:時間外,3:救急 など。必須扱い。
   */
  acceptancePush: string;
  acceptanceId?: string;
};

export type VisitMutationPayload = OutpatientMeta & {
  requestNumber?: string;
  acceptanceId?: string;
  acceptanceDate?: string;
  acceptanceTime?: string;
  departmentCode?: string;
  departmentName?: string;
  physicianCode?: string;
  physicianName?: string;
  medicalInformation?: string;
  appointmentDate?: string;
  visitNumber?: string;
  patient?: {
    patientId?: string;
    name?: string;
    kana?: string;
    birthDate?: string;
    sex?: string;
  };
  warnings?: string[];
  apiResult?: string;
  apiResultMessage?: string;
};

const claimCandidates = [{ path: '/orca/claim/outpatient', source: 'server' as ResolveMasterSource }];

const appointmentCandidates = [
  { path: '/orca/appointments/list', source: 'server' as ResolveMasterSource },
  { path: '/orca/appointments/list/mock', source: 'mock' as ResolveMasterSource },
];

const visitCandidates = [
  { path: '/orca/visits/list', source: 'server' as ResolveMasterSource },
  { path: '/orca/visits/list/mock', source: 'mock' as ResolveMasterSource },
];

const visitMutationCandidates = [
  { path: '/orca/visits/mutation', source: 'server' as ResolveMasterSource },
  { path: '/orca/visits/mutation/mock', source: 'mock' as ResolveMasterSource },
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

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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
  options: { preferredSourceOverride?: ResolveMasterSource; screen?: string } = {},
): Promise<AppointmentPayload> {
  const page = params.page ?? 1;
  const size = params.size ?? 50;
  const preferred = options.preferredSourceOverride ?? preferredSource();
  const [appointmentResult, visitResult] = await Promise.all([
    fetchWithResolver({
      candidates: appointmentCandidates,
      body: {
        appointmentDate: params.date,
        medicalInformation: params.keyword,
        departmentCode: params.departmentCode,
        physicianCode: params.physicianCode,
        page,
        size,
      },
      queryContext: context,
      preferredSource: preferred,
      description: 'appointment_outpatient',
    }),
    fetchWithResolver({
      candidates: visitCandidates,
      body: {
        visitDate: params.date,
        requestNumber: '01',
      },
      queryContext: context,
      preferredSource: preferred,
      description: 'visit_outpatient',
    }),
  ]);

  const combinedRaw = {
    ...appointmentResult.raw,
    ...visitResult.raw,
    slots: Array.isArray((appointmentResult.raw as any)?.slots) ? (appointmentResult.raw as any).slots : [],
    reservations: Array.isArray((appointmentResult.raw as any)?.reservations) ? (appointmentResult.raw as any).reservations : [],
    visits: Array.isArray((visitResult.raw as any)?.visits)
      ? (visitResult.raw as any).visits
      : Array.isArray((appointmentResult.raw as any)?.visits)
        ? (appointmentResult.raw as any).visits
        : [],
  };
  const primaryResult = appointmentResult.ok ? appointmentResult : visitResult;
  const combinedOk = appointmentResult.ok || visitResult.ok;
  const combinedError =
    appointmentResult.ok && visitResult.ok
      ? undefined
      : [appointmentResult.ok ? undefined : `appointment: ${appointmentResult.error ?? 'error'}`,
        visitResult.ok ? undefined : `visit: ${visitResult.error ?? 'error'}`]
          .filter((entry): entry is string => Boolean(entry))
          .join(' / ');

  const entries = parseAppointmentEntries(combinedRaw);
  const mergedMeta = mergeOutpatientMeta(combinedRaw, {
    ...primaryResult.meta,
    recordsReturned: entries.length,
    resolveMasterSource: resolvedDataSource(primaryResult.meta.dataSourceTransition, primaryResult.meta.resolveMasterSource),
    page,
    size,
  });

  const payload: AppointmentPayload = attachAppointmentMeta(
    {
      entries,
      raw: combinedRaw,
      apiResult: (combinedRaw as any).apiResult,
      apiResultMessage: (combinedRaw as any).apiResultMessage,
    },
    mergedMeta,
  );

  recordOutpatientFunnel('charts_orchestration', {
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? primaryResult.meta.fromCache ?? false,
    missingMaster: payload.missingMaster ?? false,
    dataSourceTransition: payload.dataSourceTransition ?? 'snapshot',
    fallbackUsed: payload.fallbackUsed ?? false,
    action: 'appointment_fetch',
    outcome: combinedOk ? 'success' : 'error',
    note: payload.sourcePath,
    reason: combinedOk ? undefined : combinedError ?? payload.apiResultMessage ?? payload.apiResult,
  });

  logUiState({
    action: 'outpatient_fetch',
    screen: options.screen ?? 'reception',
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? primaryResult.meta.fromCache,
    missingMaster: payload.missingMaster,
    dataSourceTransition: payload.dataSourceTransition,
    fallbackUsed: payload.fallbackUsed,
    details: {
      endpoint: payload.sourcePath ?? primaryResult.meta.sourcePath,
      fetchedAt: payload.fetchedAt,
      recordsReturned: payload.recordsReturned,
      resolveMasterSource: payload.resolveMasterSource,
      fromCache: primaryResult.meta.fromCache,
      retryCount: primaryResult.meta.retryCount,
      description: 'appointment_outpatient',
      appointmentEndpoint: appointmentResult.meta.sourcePath,
      appointmentStatus: appointmentResult.meta.httpStatus,
      appointmentOk: appointmentResult.ok,
      visitEndpoint: visitResult.meta.sourcePath,
      visitStatus: visitResult.meta.httpStatus,
      visitOk: visitResult.ok,
      combinedError,
    },
  });

  logAuditEvent({
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? primaryResult.meta.fromCache,
    missingMaster: payload.missingMaster,
    fallbackUsed: payload.fallbackUsed,
    dataSourceTransition: payload.dataSourceTransition,
    patientId: entries[0]?.patientId,
    appointmentId: entries[0]?.appointmentId,
    payload: {
      action: 'APPOINTMENT_OUTPATIENT_FETCH',
      outcome: combinedOk ? 'success' : 'error',
      details: {
        runId: payload.runId,
        cacheHit: payload.cacheHit ?? primaryResult.meta.fromCache ?? false,
        missingMaster: payload.missingMaster ?? false,
        fallbackUsed: payload.fallbackUsed ?? false,
        dataSourceTransition: payload.dataSourceTransition ?? primaryResult.meta.dataSourceTransition,
        fetchedAt: payload.fetchedAt,
        recordsReturned: payload.recordsReturned ?? entries.length,
        page: payload.page,
        size: payload.size,
        resolveMasterSource: payload.resolveMasterSource,
        sourcePath: payload.sourcePath ?? primaryResult.meta.sourcePath,
        apiResult: payload.apiResult,
        apiResultMessage: payload.apiResultMessage,
        patientId: entries[0]?.patientId,
        appointmentId: entries[0]?.appointmentId,
        appointmentEndpoint: appointmentResult.meta.sourcePath,
        appointmentStatus: appointmentResult.meta.httpStatus,
        appointmentOk: appointmentResult.ok,
        visitEndpoint: visitResult.meta.sourcePath,
        visitStatus: visitResult.meta.httpStatus,
        visitOk: visitResult.ok,
        error: combinedOk ? undefined : combinedError ?? payload.apiResultMessage,
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

const extractWarnings = (raw: Record<string, unknown>): string[] => {
  if (Array.isArray(raw.warnings)) return raw.warnings as string[];
  if (Array.isArray((raw as any).warningMessages)) return (raw as any).warningMessages as string[];
  const message = (raw as any).warningMessage ?? (raw as any).apiWarningMessage;
  return message ? [String(message)] : [];
};

const parsePatientSummary = (raw: any) => {
  const patient =
    raw?.patient ??
    raw?.Patient ??
    raw?.patientInformation ??
    raw?.patient_information ??
    raw?.Patient_Information;
  if (!patient) return undefined;
  return {
    patientId: normalizeOptionalString(patient.patientId ?? patient.Patient_ID),
    name: normalizeOptionalString(patient.name ?? patient.wholeName ?? patient.WholeName),
    kana: normalizeOptionalString(patient.kana ?? patient.wholeNameKana ?? patient.WholeName_inKana),
    birthDate: normalizeOptionalString(patient.birthDate ?? patient.BirthDate),
    sex: normalizeOptionalString(patient.sex ?? patient.Sex),
  };
};

export const buildVisitEntryFromMutation = (
  payload: VisitMutationPayload,
  options: { paymentMode?: 'insurance' | 'self' } = {},
): ReceptionEntry | null => {
  if (payload.requestNumber === '02' || payload.requestNumber === '00') return null;
  const patientId = payload.patient?.patientId;
  if (!patientId && !payload.acceptanceId) return null;
  const paymentLabel = options.paymentMode === 'self' ? '自費' : options.paymentMode === 'insurance' ? '保険' : undefined;
  return {
    id: payload.acceptanceId ?? payload.visitNumber ?? patientId ?? `visit-${Date.now()}`,
    appointmentId: payload.visitNumber ?? payload.appointmentDate,
    receptionId: payload.acceptanceId,
    patientId: patientId ?? undefined,
    name: payload.patient?.name,
    kana: payload.patient?.kana,
    birthDate: payload.patient?.birthDate,
    sex: payload.patient?.sex,
    department: payload.departmentName ?? payload.departmentCode,
    physician: payload.physicianName ?? payload.physicianCode,
    appointmentTime: payload.acceptanceTime,
    visitDate: payload.acceptanceDate ?? payload.appointmentDate,
    status: '受付中',
    insurance: paymentLabel,
    note: payload.medicalInformation,
    source: 'visits',
  };
};

export async function mutateVisit(
  params: VisitMutationParams,
  context?: QueryFunctionContext,
  options: { preferredSourceOverride?: ResolveMasterSource } = {},
): Promise<VisitMutationPayload> {
  const body = {
    requestNumber: params.requestNumber,
    patientId: params.patientId,
    acceptanceDate: params.acceptanceDate,
    acceptanceTime: params.acceptanceTime,
    acceptancePush: params.acceptancePush,
    acceptanceId: params.acceptanceId,
    departmentCode: params.departmentCode,
    physicianCode: params.physicianCode,
    medicalInformation: params.medicalInformation,
    insurances: params.paymentMode
      ? [
          {
            insuranceProviderClass: params.paymentMode === 'insurance' ? '1' : '9',
            insuranceCombinationNumber: params.paymentMode === 'insurance' ? '0001' : undefined,
          },
        ]
      : undefined,
  };

  const result = await fetchWithResolver({
    candidates: visitMutationCandidates,
    body,
    queryContext: context,
    preferredSource: options.preferredSourceOverride ?? preferredSource(),
    description: 'visit_mutation',
  });

  const raw = result.raw ?? {};
  const meta = mergeOutpatientMeta(raw, {
    ...result.meta,
    recordsReturned: 1,
    resolveMasterSource: resolvedDataSource(result.meta.dataSourceTransition, result.meta.resolveMasterSource),
  });

  const patientSummary = parsePatientSummary(raw);
  const patient = patientSummary?.patientId ? patientSummary : { patientId: params.patientId };
  const acceptanceIdRaw = (raw as any).acceptanceId ?? (raw as any).Acceptance_Id ?? (raw as any).acceptance_id;
  const acceptanceDateRaw = (raw as any).acceptanceDate ?? (raw as any).Acceptance_Date ?? (raw as any).acceptance_date;
  const acceptanceTimeRaw = (raw as any).acceptanceTime ?? (raw as any).Acceptance_Time ?? (raw as any).acceptance_time;
  const departmentCodeRaw = (raw as any).departmentCode ?? (raw as any).Department_Code ?? (raw as any).department_code;
  const departmentNameRaw =
    (raw as any).departmentName ?? (raw as any).Department_WholeName ?? (raw as any).department_name;
  const physicianCodeRaw = (raw as any).physicianCode ?? (raw as any).Physician_Code ?? (raw as any).physician_code;
  const physicianNameRaw =
    (raw as any).physicianName ?? (raw as any).Physician_WholeName ?? (raw as any).physician_name;

  const payload: VisitMutationPayload = {
    ...meta,
    requestNumber: params.requestNumber,
    acceptanceId:
      (raw as any).apiResult === '21'
        ? undefined
        : normalizeOptionalString(acceptanceIdRaw),
    acceptanceDate: normalizeOptionalString(acceptanceDateRaw),
    acceptanceTime: normalizeOptionalString(acceptanceTimeRaw),
    departmentCode: normalizeOptionalString(departmentCodeRaw),
    departmentName: normalizeOptionalString(departmentNameRaw),
    physicianCode: normalizeOptionalString(physicianCodeRaw),
    physicianName: normalizeOptionalString(physicianNameRaw),
    medicalInformation:
      (raw as any).medicalInformation ?? (raw as any).Medical_Information ?? (raw as any).medical_information,
    appointmentDate: (raw as any).appointmentDate ?? (raw as any).Appointment_Date ?? (raw as any).appointment_date,
    visitNumber: (raw as any).visitNumber ?? (raw as any).Visit_Number ?? (raw as any).visit_number,
    warnings: extractWarnings(raw),
    apiResult:
      (raw as any).apiResult ?? (raw as any).Api_Result ?? (raw as any).result ?? (raw as any).Result ?? undefined,
    apiResultMessage:
      (raw as any).apiResultMessage ??
      (raw as any).Api_Result_Message ??
      (raw as any).message ??
      (raw as any).Result_Message ??
      ((raw as any).apiResult === '21' ? '受付なし' : undefined),
    patient,
  };

  recordOutpatientFunnel('reception_accept', {
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? result.meta.fromCache ?? false,
    missingMaster: payload.missingMaster ?? false,
    dataSourceTransition: payload.dataSourceTransition ?? 'server',
    fallbackUsed: payload.fallbackUsed ?? false,
    action: params.requestNumber === '02' ? 'cancel' : 'create',
    outcome: result.ok ? 'success' : 'error',
    note: payload.sourcePath,
    reason: result.ok ? undefined : result.error ?? payload.apiResultMessage ?? payload.apiResult,
  });

  logUiState({
    action: params.requestNumber === '02' ? 'cancel' : 'send',
    screen: 'reception/acceptmodv2',
    controlId: params.requestNumber,
    runId: payload.runId,
    traceId: payload.traceId,
    cacheHit: payload.cacheHit,
    missingMaster: payload.missingMaster,
    dataSourceTransition: payload.dataSourceTransition,
    details: {
      requestNumber: params.requestNumber,
      apiResult: payload.apiResult,
      apiResultMessage: payload.apiResultMessage,
      acceptanceId: payload.acceptanceId,
      acceptanceDate: payload.acceptanceDate,
      acceptanceTime: payload.acceptanceTime,
      paymentMode: params.paymentMode,
      acceptancePush: params.acceptancePush,
      warnings: payload.warnings,
      traceId: payload.traceId,
    },
  });

  logAuditEvent({
    runId: payload.runId,
    traceId: payload.traceId,
    source: 'reception',
    patientId: payload.patient?.patientId ?? params.patientId,
    payload: {
      action: 'reception_accept',
      requestNumber: params.requestNumber,
      apiResult: payload.apiResult,
      apiResultMessage: payload.apiResultMessage,
      acceptanceId: payload.acceptanceId,
      acceptanceDate: payload.acceptanceDate,
      acceptanceTime: payload.acceptanceTime,
      paymentMode: params.paymentMode,
      acceptancePush: params.acceptancePush,
      warnings: payload.warnings,
      traceId: payload.traceId,
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
  const sendCache = loadOrcaClaimSendCache({});
  const sendEntries = Object.values(sendCache ?? {});
  const sendBundles = sendEntries.map((entry) => {
    const incomeEntry = getOrcaIncomeInfoEntry({}, entry.patientId);
    return buildSendClaimBundle(entry, buildPaidInvoiceSet(incomeEntry));
  });
  const sendQueueEntries = sendEntries.map((entry) => {
    const incomeEntry = getOrcaIncomeInfoEntry({}, entry.patientId);
    return buildQueueEntryFromSendCache(entry, buildPaidInvoiceSet(incomeEntry));
  });
  const mergedBundles = mergeClaimBundles(bundles, sendBundles);
  const mergedQueueEntries = mergeQueueEntries(queueEntries, sendQueueEntries);
  const claimInformation = (json as any)?.['claim:information'] ?? (json as any)?.claim?.information ?? (json as any)?.claimInformation ?? (json as any)?.information;
  const claimInformationStatus =
    claimInformation?.status ?? claimInformation?.claimStatus ?? claimInformation?.['claim:status'] ?? claimInformation?.['claim_status'];
  const resolvedClaimStatusText =
    (json as any).claimStatus ??
    claimInformationStatus ??
    (json as any).status ??
    (json as any).apiResult ??
    bundles[0]?.claimStatusText;
  const metaRecords = typeof json.recordsReturned === 'number' ? (json.recordsReturned as number) : mergedBundles.length || undefined;
  const meta = mergeOutpatientMeta(json, {
    ...result.meta,
    recordsReturned: metaRecords,
    resolveMasterSource: resolvedDataSource(result.meta.dataSourceTransition, result.meta.resolveMasterSource),
  });
  const overallStatus = resolveOverallClaimStatus(mergedBundles);
  const primarySendEntry = sendEntries.find((entry) => entry.invoiceNumber || entry.dataId);

  const payload: ClaimOutpatientPayload = {
    ...meta,
    bundles: mergedBundles,
    claimStatus: overallStatus ?? resolveClaimStatus(resolvedClaimStatusText) ?? mergedBundles[0]?.claimStatus,
    claimStatusText:
      overallStatus ??
      (typeof resolvedClaimStatusText === 'string' ? resolvedClaimStatusText : mergedBundles[0]?.claimStatusText),
    queueEntries: mergedQueueEntries,
    raw: json as Record<string, unknown>,
    apiResult: (json as any).apiResult,
    apiResultMessage: (json as any).apiResultMessage,
    invoiceNumber:
      primarySendEntry?.invoiceNumber ??
      (json as any).invoiceNumber ??
      (json as any).Invoice_Number ??
      (json as any).invoice_number ??
      (json as any)?.claim?.invoiceNumber ??
      (json as any)?.claim?.Invoice_Number,
    dataId:
      primarySendEntry?.dataId ??
      (json as any).dataId ??
      (json as any).Data_Id ??
      (json as any).DataID ??
      (json as any)?.claim?.dataId ??
      (json as any)?.claim?.Data_Id,
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
      claimBundles: mergedBundles.length,
      queueEntries: mergedQueueEntries.length,
      patientId: mergedBundles[0]?.patientId,
      appointmentId: mergedBundles[0]?.appointmentId,
      claimId: mergedBundles[0]?.bundleNumber,
      resolveMasterSource: payload.resolveMasterSource,
      fromCache: result.meta.fromCache,
      retryCount: result.meta.retryCount,
      description: 'claim_outpatient',
      claimStatus: payload.claimStatus ?? payload.claimStatusText,
      apiResult: payload.apiResult,
      apiResultMessage: payload.apiResultMessage,
      fallbackFlagMissing: payload.fallbackFlagMissing,
      invoiceNumber: payload.invoiceNumber,
      dataId: payload.dataId,
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
      claimBundles: mergedBundles.length,
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
        recordsReturned: payload.recordsReturned ?? mergedBundles.length,
        hasNextPage: payload.hasNextPage,
        page: payload.page,
        size: payload.size,
        queueEntries: mergedQueueEntries.length,
        claimBundles: mergedBundles.length,
        patientId: mergedBundles[0]?.patientId,
        appointmentId: mergedBundles[0]?.appointmentId,
        claimId: mergedBundles[0]?.bundleNumber,
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
