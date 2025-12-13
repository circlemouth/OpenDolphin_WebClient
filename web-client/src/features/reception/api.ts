import type { QueryFunctionContext } from '@tanstack/react-query';

import { logUiState } from '../../libs/audit/auditLogger';
import { updateObservabilityMeta } from '../../libs/observability/observability';
import type { DataSourceTransition, ResolveMasterSource } from '../../libs/observability/types';
import { recordOutpatientFunnel } from '../../libs/telemetry/telemetryClient';
import { fetchWithResolver } from '../outpatient/fetchWithResolver';
import { attachAppointmentMeta, mergeOutpatientMeta, parseAppointmentEntries } from '../outpatient/transformers';
import type { AppointmentPayload, OutpatientFlagResponse, ReceptionEntry, ReceptionStatus } from '../outpatient/types';
export type { ReceptionEntry, ReceptionStatus, OutpatientFlagResponse, AppointmentPayload } from '../outpatient/types';

export type AppointmentQueryParams = {
  date: string;
  keyword?: string;
  departmentCode?: string;
  physicianCode?: string;
};

const SAMPLE_APPOINTMENTS: ReceptionEntry[] = [
  {
    id: 'SAMPLE-01',
    appointmentId: 'APT-2401',
    patientId: '000001',
    name: '山田 花子',
    kana: 'ヤマダ ハナコ',
    birthDate: '1985-04-12',
    sex: 'F',
    department: '内科',
    physician: '藤井',
    appointmentTime: '09:10',
    status: '受付中',
    insurance: '社保 12',
    note: '血圧フォロー',
    source: 'unknown',
  },
  {
    id: 'SAMPLE-02',
    appointmentId: 'APT-2402',
    patientId: '000002',
    name: '佐藤 太郎',
    kana: 'サトウ タロウ',
    birthDate: '1978-11-30',
    sex: 'M',
    department: '整形',
    physician: '鈴木',
    appointmentTime: '09:25',
    status: '診療中',
    insurance: '国保 34',
    note: '膝痛・レントゲン待ち',
    source: 'unknown',
  },
  {
    id: 'SAMPLE-03',
    appointmentId: 'APT-2403',
    patientId: '000003',
    name: '高橋 光',
    kana: 'タカハシ ヒカリ',
    birthDate: '1992-02-01',
    sex: 'F',
    department: '小児',
    physician: '山口',
    appointmentTime: '10:05',
    status: '予約',
    insurance: '自費',
    note: '健診',
    source: 'unknown',
  },
];

const claimCandidates = [
  { path: '/api01rv2/claim/outpatient/mock', source: 'mock' as ResolveMasterSource },
  { path: '/api01rv2/claim/outpatient', source: 'server' as ResolveMasterSource },
];

const appointmentCandidates = [
  { path: '/api01rv2/appointment/outpatient/list', source: 'server' as ResolveMasterSource },
  { path: '/api01rv2/appointment/outpatient', source: 'server' as ResolveMasterSource },
  { path: '/api01rv2/appointment/outpatient/mock', source: 'mock' as ResolveMasterSource },
];

const preferredSource = (): ResolveMasterSource | undefined =>
  import.meta.env.VITE_DISABLE_MSW === '1' ? 'server' : undefined;

const resolvedDataSource = (transition?: DataSourceTransition, fallback?: ResolveMasterSource): ResolveMasterSource | undefined =>
  (transition as ResolveMasterSource | undefined) ?? fallback;

export async function fetchAppointmentOutpatients(
  params: AppointmentQueryParams,
  context?: QueryFunctionContext,
): Promise<AppointmentPayload> {
  const result = await fetchWithResolver({
    candidates: appointmentCandidates,
    body: {
      appointmentDate: params.date,
      keyword: params.keyword,
      departmentCode: params.departmentCode,
      physicianCode: params.physicianCode,
    },
    queryContext: context,
    preferredSource: preferredSource(),
    description: 'appointment_outpatient',
  });

  const json = result.raw ?? {};
  const entries = parseAppointmentEntries(json);
  const isFallbackSample = entries.length === 0;
  const resolvedEntries = isFallbackSample ? SAMPLE_APPOINTMENTS : entries;
  const mergedMeta = mergeOutpatientMeta(json, {
    ...result.meta,
    recordsReturned: entries.length > 0 ? entries.length : undefined,
    resolveMasterSource: resolvedDataSource(result.meta.dataSourceTransition, result.meta.resolveMasterSource),
    fallbackUsed:
      result.meta.fallbackUsed ??
      (isFallbackSample || result.meta.fromCache === true ? true : undefined),
  });

  const payload: AppointmentPayload = attachAppointmentMeta(
    {
      entries: resolvedEntries,
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

export async function fetchClaimFlags(context?: QueryFunctionContext): Promise<OutpatientFlagResponse> {
  const result = await fetchWithResolver({
    candidates: claimCandidates,
    queryContext: context,
    preferredSource: preferredSource(),
    description: 'claim_outpatient',
  });

  const json = result.raw ?? {};
  const meta = mergeOutpatientMeta(json, {
    ...result.meta,
    recordsReturned: typeof json.recordsReturned === 'number' ? (json.recordsReturned as number) : undefined,
    resolveMasterSource: resolvedDataSource(result.meta.dataSourceTransition, result.meta.resolveMasterSource),
  });

  const payload: OutpatientFlagResponse = meta;

  recordOutpatientFunnel('charts_orchestration', {
    runId: payload.runId,
    cacheHit: payload.cacheHit ?? result.meta.fromCache ?? false,
    missingMaster: payload.missingMaster ?? false,
    dataSourceTransition: payload.dataSourceTransition ?? 'snapshot',
    fallbackUsed: payload.fallbackUsed ?? false,
    action: 'claim_fetch',
    outcome: result.ok ? 'success' : 'error',
    note: payload.sourcePath,
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
      description: 'claim_outpatient',
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
