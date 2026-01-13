import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { resolveAriaLive, resolveRunId } from '../../libs/observability/observability';
import { persistHeaderFlags, resolveHeaderFlags } from '../../libs/http/header-flags';
import { isSystemAdminRole } from '../../libs/auth/roles';
import { ToneBanner } from '../reception/components/ToneBanner';
import { useSession } from '../../AppRouter';
import { buildFacilityPath } from '../../routes/facilityRoutes';
import { applyAuthServicePatch, useAuthService, type AuthServiceFlags } from '../charts/authService';
import {
  ORCA_QUEUE_STALL_THRESHOLD_MS,
  buildOrcaQueueWarningSummary,
  isOrcaQueueWarningEntry,
} from '../outpatient/orcaQueueStatus';
import {
  discardOrcaQueue,
  fetchEffectiveAdminConfig,
  fetchMasterLastUpdate,
  fetchMedicalSet,
  fetchOrcaQueue,
  fetchSystemDaily,
  fetchSystemInfo,
  retryOrcaQueue,
  saveAdminConfig,
  syncMedicationMod,
  type AdminConfigPayload,
  type ChartsMasterSourcePolicy,
  type MasterLastUpdateResponse,
  type MedicalSetResponse,
  type MedicalSetSearchPayload,
  type MedicationModResponse,
  type OrcaQueueEntry,
  type SystemDailyResponse,
  type SystemInfoResponse,
} from './api';
import './administration.css';
import {
  publishAdminBroadcast,
  type AdminDeliveryFlagState,
  type AdminDeliveryStatus,
} from '../../libs/admin/broadcast';
import { RunIdBadge } from '../shared/RunIdBadge';

type AdministrationPageProps = {
  runId: string;
  role?: string;
};

type Feedback = { tone: 'success' | 'warning' | 'error' | 'info'; message: string };
type GuardAction = 'access' | 'edit' | 'save' | 'retry' | 'discard' | 'master-check' | 'master-sync' | 'system-check' | 'medicalset-search';

const deliveryFlagStateLabel = (state: AdminDeliveryFlagState) => {
  if (state === 'applied') return '配信済み';
  if (state === 'pending') return '未反映';
  return '不明';
};

const DEFAULT_ORCA_ENDPOINT =
  (import.meta.env as Record<string, string | undefined>).VITE_ORCA_ENDPOINT ?? 'https://localhost:9080/openDolphin/resources';
const DEFAULT_FORM: AdminConfigPayload = {
  orcaEndpoint: DEFAULT_ORCA_ENDPOINT,
  mswEnabled: import.meta.env.VITE_DISABLE_MSW !== '1',
  useMockOrcaQueue: resolveHeaderFlags().useMockOrcaQueue,
  verifyAdminDelivery: resolveHeaderFlags().verifyAdminDelivery,
  chartsDisplayEnabled: true,
  chartsSendEnabled: true,
  chartsMasterSource: 'auto',
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeAgo = (iso?: string) => {
  if (!iso) return '―';
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return '1分以内';
  return `${minutes}分前`;
};

const formatTimestamp = (iso?: string) => {
  if (!iso) return '―';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ja-JP', { hour12: false });
};

const formatTimestampWithAgo = (iso?: string) => {
  if (!iso) return '―';
  return `${formatTimestamp(iso)}（${formatTimeAgo(iso)}）`;
};

const formatDateTime = (date?: string, time?: string) => {
  if (!date && !time) return '―';
  if (!time) return date ?? '―';
  if (!date) return time ?? '―';
  return `${date} ${time}`;
};

const QUEUE_DELAY_WARNING_MS = ORCA_QUEUE_STALL_THRESHOLD_MS;

const toStatusClass = (status: string) => {
  if (status === 'delivered') return 'admin-queue__status admin-queue__status--delivered';
  if (status === 'failed') return 'admin-queue__status admin-queue__status--failed';
  return 'admin-queue__status admin-queue__status--pending';
};

const normalizeEnvironmentLabel = (raw?: string) => {
  if (!raw) return undefined;
  const value = raw.toLowerCase();
  if (value.includes('stage')) return 'stage';
  if (value.includes('dev')) return 'dev';
  if (value.includes('prod')) return 'prod';
  if (value.includes('preview')) return 'preview';
  return raw;
};

const resolveDeliveryFlagState = (
  configValue: boolean | string | undefined,
  deliveryValue: boolean | string | undefined,
): AdminDeliveryFlagState => {
  if (deliveryValue === undefined && configValue === undefined) return 'unknown';
  if (deliveryValue === undefined) return 'pending';
  if (configValue === undefined) return 'applied';
  return deliveryValue === configValue ? 'applied' : 'pending';
};

const buildChartsDeliveryStatus = (
  config?: Partial<AdminConfigPayload>,
  delivery?: Partial<AdminConfigPayload>,
): AdminDeliveryStatus => ({
  chartsDisplayEnabled: resolveDeliveryFlagState(config?.chartsDisplayEnabled, delivery?.chartsDisplayEnabled),
  chartsSendEnabled: resolveDeliveryFlagState(config?.chartsSendEnabled, delivery?.chartsSendEnabled),
  chartsMasterSource: resolveDeliveryFlagState(config?.chartsMasterSource, delivery?.chartsMasterSource),
});

const summarizeDeliveryStatus = (status: AdminDeliveryStatus) => {
  const states = Object.values(status).filter(Boolean) as AdminDeliveryFlagState[];
  const hasPending = states.some((state) => state === 'pending');
  const hasApplied = states.some((state) => state === 'applied');
  return {
    hasPending,
    summary: hasPending ? '次回リロード' : hasApplied ? '即時反映' : '不明',
  };
};

const formatDeliveryValue = (value: boolean | string | undefined) => (value === undefined ? '―' : String(value));

export function AdministrationPage({ runId, role }: AdministrationPageProps) {
  const isSystemAdmin = isSystemAdminRole(role);
  const session = useSession();
  const appliedMeta = useRef<Partial<AuthServiceFlags>>({});
  const guardLogRef = useRef<{ runId?: string; role?: string }>({});
  const { flags, bumpRunId, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed } = useAuthService();
  const today = useMemo(() => formatDateInput(new Date()), []);
  const [form, setForm] = useState<AdminConfigPayload>(DEFAULT_FORM);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [masterLastUpdateResult, setMasterLastUpdateResult] = useState<MasterLastUpdateResponse | null>(null);
  const [medicationSyncResult, setMedicationSyncResult] = useState<MedicationModResponse | null>(null);
  const [medicationSyncClass, setMedicationSyncClass] = useState('01');
  const [medicationSyncXml, setMedicationSyncXml] = useState(() =>
    [
      '<data>',
      '  <medicatonmodreq type="record">',
      `    <Request_Number type="string">01</Request_Number>`,
      `    <Base_Date type="string">${today}</Base_Date>`,
      '  </medicatonmodreq>',
      '</data>',
    ].join('\n'),
  );
  const [systemInfoResult, setSystemInfoResult] = useState<SystemInfoResponse | null>(null);
  const [systemDailyResult, setSystemDailyResult] = useState<SystemDailyResponse | null>(null);
  const [systemBaseDate, setSystemBaseDate] = useState(() => today);
  const [medicalSetQuery, setMedicalSetQuery] = useState<MedicalSetSearchPayload>(() => ({
    baseDate: today,
    setCode: '',
    setName: '',
    startDate: today,
    endDate: '',
    inOut: 'O',
  }));
  const [medicalSetResult, setMedicalSetResult] = useState<MedicalSetResponse | null>(null);
  const [masterUpdateLabel, setMasterUpdateLabel] = useState<'初回取得' | '更新あり' | '更新なし'>('初回取得');
  const lastMasterSignatureRef = useRef<string | undefined>(undefined);
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: ['admin-config'],
    queryFn: fetchEffectiveAdminConfig,
    staleTime: 60_000,
  });

  const queueQuery = useQuery({
    queryKey: ['orca-queue'],
    queryFn: () => fetchOrcaQueue(),
    refetchInterval: 60_000,
  });

  const latestRunId = configQuery.data?.runId ?? queueQuery.data?.runId ?? runId;
  const resolvedRunId = resolveRunId(latestRunId ?? flags.runId);
  const infoLive = resolveAriaLive('info');
  const envFallback = normalizeEnvironmentLabel(
    (import.meta.env as Record<string, string | undefined>).VITE_ENVIRONMENT ??
      (import.meta.env as Record<string, string | undefined>).VITE_DEPLOY_ENV ??
      (import.meta.env.MODE === 'development' ? 'dev' : import.meta.env.MODE),
  );
  const environmentLabel = normalizeEnvironmentLabel(configQuery.data?.environment) ?? envFallback ?? 'unknown';
  const warningThresholdMinutes = Math.round(QUEUE_DELAY_WARNING_MS / 60000);
  const guardMessageId = 'admin-guard-message';
  const guardDetailsId = 'admin-guard-details';
  const actorId = `${session.facilityId}:${session.userId}`;
  const showAdminDebugToggles = import.meta.env.VITE_ENABLE_ADMIN_DEBUG === '1' && isSystemAdmin;
  const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));
  const countVersionDiffs = (versions?: Array<{ localVersion?: string; newVersion?: string }>) =>
    versions?.filter((entry) => entry.localVersion && entry.newVersion && entry.localVersion !== entry.newVersion).length ?? 0;
  const resolveStatusTone = (result: { ok: boolean } | null, isPending: boolean) => {
    if (isPending) return 'pending';
    if (!result) return 'idle';
    return result.ok ? 'ok' : 'error';
  };
  const resolveStatusLabel = (result: { ok: boolean; apiResult?: string } | null, isPending: boolean) => {
    if (isPending) return '実行中';
    if (!result) return '未実行';
    if (result.ok) return `OK${result.apiResult ? ` (${result.apiResult})` : ''}`;
    return 'NG';
  };
  const isApiResultOk = (apiResult?: string) => (apiResult ? apiResult.startsWith('00') : false);
  const resolveHealthTone = (
    info: SystemInfoResponse | null,
    daily: SystemDailyResponse | null,
    isPending: boolean,
  ) => {
    if (isPending) return 'pending';
    if (!info && !daily) return 'idle';
    if (info && !info.ok) return 'error';
    if (daily && !daily.ok) return 'error';
    if (info && info.apiResult && !isApiResultOk(info.apiResult)) return 'warn';
    if (daily && daily.apiResult && !isApiResultOk(daily.apiResult)) return 'warn';
    return 'ok';
  };
  const resolveHealthLabel = (
    info: SystemInfoResponse | null,
    daily: SystemDailyResponse | null,
    isPending: boolean,
  ) => {
    const tone = resolveHealthTone(info, daily, isPending);
    if (tone === 'pending') return '実行中';
    if (tone === 'idle') return '未実行';
    if (tone === 'error') return 'NG';
    if (tone === 'warn') return 'Warn';
    return 'OK';
  };
  const buildMasterSignature = (result: MasterLastUpdateResponse | null) => {
    if (!result) return undefined;
    const versions = result.versions
      .map((entry) => `${entry.name ?? ''}:${entry.localVersion ?? ''}:${entry.newVersion ?? ''}`)
      .join('|');
    return `${result.lastUpdateDate ?? ''}|${versions}`;
  };

  const logGuardEvent = useCallback(
    (action: GuardAction, detail?: string) => {
      logAuditEvent({
        runId: resolvedRunId,
        source: 'admin/guard',
        note: action === 'access' ? 'admin access restricted' : 'admin action blocked',
        payload: {
          operation: action,
          actor: actorId,
          role,
          requiredRole: 'system_admin',
          environment: environmentLabel,
          detail,
          fallback: ['再ログイン', '管理者へ依頼', 'Receptionで確認'],
        },
      });
      logUiState({
        action: 'navigate',
        screen: 'administration',
        controlId: 'admin-guard',
        runId: resolvedRunId,
        details: { operation: action, role, detail, requiredRole: 'system_admin' },
      });
    },
    [actorId, environmentLabel, resolvedRunId, role],
  );

  const reportGuardedAction = useCallback(
    (action: GuardAction, detail?: string) => {
      setFeedback({ tone: 'warning', message: '権限がないため操作をブロックしました。管理者へ依頼してください。' });
      logGuardEvent(action, detail);
    },
    [logGuardEvent],
  );

  useEffect(() => {
    if (isSystemAdmin) return;
    if (guardLogRef.current.runId === resolvedRunId && guardLogRef.current.role === role) return;
    guardLogRef.current = { runId: resolvedRunId, role };
    logGuardEvent('access', 'read-only view');
  }, [isSystemAdmin, logGuardEvent, resolvedRunId, role]);

  useEffect(() => {
    const data = configQuery.data;
    if (!data) return;
    setForm((prev) => ({
      ...prev,
      orcaEndpoint: data.orcaEndpoint || prev.orcaEndpoint,
      mswEnabled: data.mswEnabled ?? prev.mswEnabled,
      useMockOrcaQueue: data.useMockOrcaQueue ?? prev.useMockOrcaQueue,
      verifyAdminDelivery: data.verifyAdminDelivery ?? prev.verifyAdminDelivery,
      chartsDisplayEnabled: data.chartsDisplayEnabled ?? prev.chartsDisplayEnabled,
      chartsSendEnabled: data.chartsSendEnabled ?? prev.chartsSendEnabled,
      chartsMasterSource: data.chartsMasterSource ?? prev.chartsMasterSource,
    }));
    persistHeaderFlags({
      useMockOrcaQueue: data.useMockOrcaQueue,
      verifyAdminDelivery: data.verifyAdminDelivery,
    });
    appliedMeta.current = applyAuthServicePatch(
      { runId: data.runId },
      appliedMeta.current,
      { bumpRunId, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed },
    );
  }, [bumpRunId, configQuery.data, setCacheHit, setDataSourceTransition, setFallbackUsed, setMissingMaster]);

  const configMutation = useMutation({
    mutationFn: saveAdminConfig,
    onSuccess: (data) => {
      setFeedback({ tone: 'success', message: '設定を保存し、配信をブロードキャストしました。' });
      persistHeaderFlags({
        useMockOrcaQueue: data.useMockOrcaQueue,
        verifyAdminDelivery: data.verifyAdminDelivery,
      });
      const nextChartsFlags = {
        chartsDisplayEnabled: data.chartsDisplayEnabled ?? form.chartsDisplayEnabled,
        chartsSendEnabled: data.chartsSendEnabled ?? form.chartsSendEnabled,
        chartsMasterSource: data.chartsMasterSource ?? form.chartsMasterSource,
      };
      const nextDeliveryStatus = buildChartsDeliveryStatus(nextChartsFlags, rawDelivery);
      const deliveredAt = data.deliveredAt ?? rawDelivery?.deliveredAt;
      const resolvedEnvironment = normalizeEnvironmentLabel(data.environment) ?? environmentLabel;
      const broadcast = publishAdminBroadcast({
        runId: data.runId ?? runId,
        action: 'config',
        deliveryId: data.deliveryId,
        deliveryVersion: data.deliveryVersion,
        deliveryEtag: data.deliveryEtag ?? data.deliveryVersion,
        deliveredAt,
        queueMode: data.useMockOrcaQueue ? 'mock' : 'live',
        verifyAdminDelivery: data.verifyAdminDelivery,
        chartsDisplayEnabled: nextChartsFlags.chartsDisplayEnabled,
        chartsSendEnabled: nextChartsFlags.chartsSendEnabled,
        chartsMasterSource: nextChartsFlags.chartsMasterSource,
        environment: resolvedEnvironment,
        deliveryStatus: nextDeliveryStatus,
        note: data.note,
        source: data.source,
      });
      logAuditEvent({
        runId: data.runId ?? runId,
        source: 'admin/delivery',
        note: data.note ?? 'admin delivery saved',
        payload: {
          operation: 'save',
          actor: `${session.facilityId}:${session.userId}`,
          role: session.role,
          environment: resolvedEnvironment,
          delivery: {
            deliveryId: data.deliveryId,
            deliveryVersion: data.deliveryVersion,
            deliveryEtag: data.deliveryEtag ?? data.deliveryVersion,
            deliveredAt,
            deliveryMode: data.deliveryMode ?? configQuery.data?.deliveryMode,
            source: data.source,
            verified: data.verified,
          },
          flags: {
            ...form,
            ...nextChartsFlags,
          },
          broadcast,
          raw: {
            config: rawConfig,
            delivery: rawDelivery,
          },
        },
      });
      logUiState({
        action: 'config_delivery',
        screen: 'administration',
        controlId: 'save-config',
        runId: data.runId ?? runId,
        dataSourceTransition: undefined,
      });
    },
    onError: () => {
      setFeedback({ tone: 'error', message: '保存に失敗しました。再度お試しください。' });
    },
  });

  const queueMutation = useMutation({
    mutationFn: (params: { kind: 'retry' | 'discard'; patientId: string }) => {
      if (params.kind === 'retry') return retryOrcaQueue(params.patientId);
      return discardOrcaQueue(params.patientId);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['orca-queue'], data);
      const queueOperation = variables.kind;
      const queueSummary = buildOrcaQueueWarningSummary(data.queue);
      publishAdminBroadcast({
        runId: data.runId ?? runId,
        action: 'queue',
        queueOperation,
        queueResult: 'success',
        queuePatientId: variables.patientId,
        queueStatus: queueSummary,
        deliveryId: variables.patientId,
        deliveryVersion: data.source,
        deliveredAt: new Date().toISOString(),
        queueMode: data.source,
        verifyAdminDelivery: data.verifyAdminDelivery,
        environment: environmentLabel,
        note: queueOperation === 'retry' ? '再送完了' : '破棄完了',
      });
      logAuditEvent({
        runId: data.runId ?? runId,
        source: 'admin/delivery',
        note: `orca queue ${queueOperation}`,
        payload: {
          operation: queueOperation,
          result: 'success',
          patientId: variables.patientId,
          environment: environmentLabel,
          queueMode: data.source,
          queue: data.queue,
          queueSnapshot: queueSummary,
          warningThresholdMs: QUEUE_DELAY_WARNING_MS,
        },
      });
      logAuditEvent({
        runId: data.runId ?? runId,
        source: 'orca/queue',
        note: queueOperation,
        patientId: variables.patientId,
        payload: {
          patientId: variables.patientId,
          queue: data.queue,
          operation: queueOperation,
          result: 'success',
          queueSnapshot: queueSummary,
          warningThresholdMs: QUEUE_DELAY_WARNING_MS,
        },
      });
      setFeedback({
        tone: 'info',
        message: queueOperation === 'retry' ? '再送リクエストを送信しました。' : 'キューエントリを破棄しました。',
      });
    },
    onError: (error, variables) => {
      const queueSnapshotEntries = queueQuery.data?.queue ?? [];
      const queueSummary = buildOrcaQueueWarningSummary(queueSnapshotEntries);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const queueOperation = variables.kind;
      publishAdminBroadcast({
        runId: resolvedRunId,
        action: 'queue',
        queueOperation,
        queueResult: 'failure',
        queuePatientId: variables.patientId,
        queueStatus: queueSummary,
        deliveredAt: new Date().toISOString(),
        queueMode: queueQuery.data?.source ?? (form.useMockOrcaQueue ? 'mock' : 'live'),
        verifyAdminDelivery: queueQuery.data?.verifyAdminDelivery ?? form.verifyAdminDelivery,
        environment: environmentLabel,
        note: queueOperation === 'retry' ? '再送失敗' : '破棄失敗',
      });
      logAuditEvent({
        runId: resolvedRunId,
        source: 'admin/delivery',
        note: `orca queue ${queueOperation} failed`,
        payload: {
          operation: queueOperation,
          result: 'failure',
          patientId: variables.patientId,
          environment: environmentLabel,
          queueMode: queueQuery.data?.source ?? (form.useMockOrcaQueue ? 'mock' : 'live'),
          error: errorMessage,
          queueSnapshot: queueSummary,
          warningThresholdMs: QUEUE_DELAY_WARNING_MS,
        },
      });
      logAuditEvent({
        runId: resolvedRunId,
        source: 'orca/queue',
        note: `${queueOperation} failed`,
        patientId: variables.patientId,
        payload: {
          patientId: variables.patientId,
          operation: queueOperation,
          result: 'failure',
          error: errorMessage,
          queueSnapshot: queueSummary,
          warningThresholdMs: QUEUE_DELAY_WARNING_MS,
        },
      });
      setFeedback({ tone: 'error', message: 'キュー操作に失敗しました。' });
    },
  });

  const masterLastUpdateMutation = useMutation({
    mutationFn: fetchMasterLastUpdate,
    onSuccess: (data) => {
      const currentSignature = buildMasterSignature(data);
      const nextLabel =
        !lastMasterSignatureRef.current
          ? '初回取得'
          : lastMasterSignatureRef.current === currentSignature
            ? '更新なし'
            : '更新あり';
      setMasterUpdateLabel(nextLabel);
      lastMasterSignatureRef.current = currentSignature;
      setMasterLastUpdateResult(data);
      logAuditEvent({
        runId: data.runId ?? resolvedRunId,
        source: 'admin/master',
        note: 'master last update checked',
        payload: {
          operation: 'masterlastupdatev3',
          actor: actorId,
          role,
          apiResult: data.apiResult,
          apiResultMessage: data.apiResultMessage,
          lastUpdateDate: data.lastUpdateDate,
          versionDiffs: countVersionDiffs(data.versions),
          updateLabel: nextLabel,
        },
      });
      logUiState({
        action: 'master_check',
        screen: 'administration',
        controlId: 'masterlastupdatev3',
        runId: data.runId ?? resolvedRunId,
      });
    },
    onError: (error) => {
      setMasterLastUpdateResult({
        ok: false,
        status: 0,
        apiResultMessage: undefined,
        apiResult: undefined,
        informationDate: undefined,
        informationTime: undefined,
        lastUpdateDate: undefined,
        versions: [],
        rawXml: '',
        error: toErrorMessage(error),
        runId: resolvedRunId,
      });
    },
  });

  const medicationModMutation = useMutation({
    mutationFn: (payload: { classCode: string; xml: string }) => syncMedicationMod(payload),
    onSuccess: (data) => {
      setMedicationSyncResult(data);
      logAuditEvent({
        runId: data.runId ?? resolvedRunId,
        source: 'admin/master',
        note: 'medication master sync requested',
        payload: {
          operation: 'medicatonmodv2',
          actor: actorId,
          role,
          apiResult: data.apiResult,
          apiResultMessage: data.apiResultMessage,
          classCode: medicationSyncClass,
        },
      });
      logUiState({
        action: 'master_sync',
        screen: 'administration',
        controlId: 'medicatonmodv2',
        runId: data.runId ?? resolvedRunId,
      });
    },
    onError: (error) => {
      setMedicationSyncResult({
        ok: false,
        status: 0,
        apiResultMessage: undefined,
        apiResult: undefined,
        rawXml: '',
        error: toErrorMessage(error),
        runId: resolvedRunId,
      });
    },
  });

  const systemHealthMutation = useMutation({
    mutationFn: async (params: { baseDate: string }) => {
      const [info, daily] = await Promise.all([fetchSystemInfo(), fetchSystemDaily(params.baseDate)]);
      return { info, daily };
    },
    onSuccess: ({ info, daily }) => {
      setSystemInfoResult(info);
      setSystemDailyResult(daily);
      logAuditEvent({
        runId: info.runId ?? daily.runId ?? resolvedRunId,
        source: 'admin/system',
        note: 'system health check',
        payload: {
          operation: 'system_health',
          actor: actorId,
          role,
          info: {
            apiResult: info.apiResult,
            apiResultMessage: info.apiResultMessage,
            jmaReceiptVersion: info.jmaReceiptVersion,
            databaseLocalVersion: info.databaseLocalVersion,
            databaseNewVersion: info.databaseNewVersion,
            versionDiffs: countVersionDiffs(info.versions),
          },
          daily: {
            apiResult: daily.apiResult,
            apiResultMessage: daily.apiResultMessage,
            baseDate: daily.baseDate,
          },
        },
      });
      logUiState({
        action: 'system_health',
        screen: 'administration',
        controlId: 'system-health',
        runId: info.runId ?? daily.runId ?? resolvedRunId,
      });
    },
    onError: (error) => {
      const message = toErrorMessage(error);
      setSystemInfoResult({
        ok: false,
        status: 0,
        apiResult: undefined,
        apiResultMessage: undefined,
        informationDate: undefined,
        informationTime: undefined,
        jmaReceiptVersion: undefined,
        databaseLocalVersion: undefined,
        databaseNewVersion: undefined,
        lastUpdateDate: undefined,
        versions: [],
        rawXml: '',
        error: message,
        runId: resolvedRunId,
      });
      setSystemDailyResult({
        ok: false,
        status: 0,
        apiResult: undefined,
        apiResultMessage: undefined,
        informationDate: undefined,
        informationTime: undefined,
        baseDate: systemBaseDate,
        rawXml: '',
        error: message,
        runId: resolvedRunId,
      });
    },
  });

  const medicalSetMutation = useMutation({
    mutationFn: (payload: MedicalSetSearchPayload) => fetchMedicalSet(payload),
    onSuccess: (data) => {
      setMedicalSetResult(data);
      logAuditEvent({
        runId: data.runId ?? resolvedRunId,
        source: 'admin/medical-set',
        note: 'medical set search',
        payload: {
          operation: 'medicalsetv2',
          actor: actorId,
          role,
          apiResult: data.apiResult,
          apiResultMessage: data.apiResultMessage,
          query: medicalSetQuery,
          results: data.entries.length,
        },
      });
      logUiState({
        action: 'medicalset_search',
        screen: 'administration',
        controlId: 'medicalsetv2',
        runId: data.runId ?? resolvedRunId,
      });
    },
    onError: (error) => {
      setMedicalSetResult({
        ok: false,
        status: 0,
        apiResult: undefined,
        apiResultMessage: undefined,
        baseDate: medicalSetQuery.baseDate,
        entries: [],
        rawXml: '',
        error: toErrorMessage(error),
        runId: resolvedRunId,
      });
    },
  });

  const queueEntries: OrcaQueueEntry[] = useMemo(
    () => queueQuery.data?.queue ?? [],
    [queueQuery.data?.queue],
  );

  useEffect(() => {
    const runIdFromQueue = queueQuery.data?.runId ?? configQuery.data?.runId;
    if (!runIdFromQueue) return;
    appliedMeta.current = applyAuthServicePatch(
      { runId: runIdFromQueue },
      appliedMeta.current,
      { bumpRunId, setCacheHit, setMissingMaster, setDataSourceTransition, setFallbackUsed },
    );
  }, [bumpRunId, configQuery.data?.runId, queueQuery.data?.runId, setCacheHit, setDataSourceTransition, setFallbackUsed, setMissingMaster]);
  const warningEntries = useMemo(() => {
    const nowMs = Date.now();
    return queueEntries.filter((entry) => isOrcaQueueWarningEntry(entry, nowMs).isWarning);
  }, [queueEntries]);

  const handleInputChange = (key: keyof AdminConfigPayload, value: string | boolean) => {
    if (!isSystemAdmin) {
      reportGuardedAction('edit', `field:${key}`);
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleChartsMasterSourceChange = (value: string) => {
    const next: ChartsMasterSourcePolicy =
      value === 'auto' || value === 'server' || value === 'mock' || value === 'snapshot' || value === 'fallback'
        ? value
        : 'auto';
    handleInputChange('chartsMasterSource', next);
  };

  const handleSave = () => {
    if (!isSystemAdmin) {
      reportGuardedAction('save');
      return;
    }
    configMutation.mutate(form);
  };

  const handleRetry = (patientId: string) => {
    if (!isSystemAdmin) {
      reportGuardedAction('retry', `patient:${patientId}`);
      return;
    }
    queueMutation.mutate({ kind: 'retry', patientId });
  };

  const handleDiscard = (patientId: string) => {
    if (!isSystemAdmin) {
      reportGuardedAction('discard', `patient:${patientId}`);
      return;
    }
    queueMutation.mutate({ kind: 'discard', patientId });
  };

  const handleMasterCheck = () => {
    if (!isSystemAdmin) {
      reportGuardedAction('master-check');
      return;
    }
    masterLastUpdateMutation.mutate();
  };

  const handleMedicationSync = () => {
    if (!isSystemAdmin) {
      reportGuardedAction('master-sync');
      return;
    }
    medicationModMutation.mutate({ classCode: medicationSyncClass, xml: medicationSyncXml });
  };

  const handleSystemHealthCheck = () => {
    if (!isSystemAdmin) {
      reportGuardedAction('system-check');
      return;
    }
    systemHealthMutation.mutate({ baseDate: systemBaseDate });
  };

  const handleMedicalSetSearch = () => {
    if (!isSystemAdmin) {
      reportGuardedAction('medicalset-search');
      return;
    }
    medicalSetMutation.mutate(medicalSetQuery);
  };

  const syncMismatch = configQuery.data?.syncMismatch;
  const syncMismatchFields = configQuery.data?.syncMismatchFields?.length ? configQuery.data.syncMismatchFields.join(', ') : undefined;
  const rawConfig = configQuery.data?.rawConfig ?? configQuery.data;
  const rawDelivery = configQuery.data?.rawDelivery;
  const deliveryMode = configQuery.data?.deliveryMode ?? rawDelivery?.deliveryMode ?? rawConfig?.deliveryMode;
  const effectiveDeliveryEtag = configQuery.data?.deliveryEtag ?? configQuery.data?.deliveryVersion;
  const deliveryStatus = buildChartsDeliveryStatus(rawConfig, rawDelivery);
  const deliverySummary = summarizeDeliveryStatus(deliveryStatus);
  const lastDeliveredAt = rawDelivery?.deliveredAt ?? configQuery.data?.deliveredAt;
  const deliveryPriorityLabel = rawDelivery ? 'delivery → config' : 'config（delivery未取得）';
  const deliveryFlagRows = [
    {
      key: 'chartsDisplayEnabled',
      label: 'Charts表示',
      configValue: rawConfig?.chartsDisplayEnabled,
      deliveryValue: rawDelivery?.chartsDisplayEnabled,
      state: deliveryStatus.chartsDisplayEnabled ?? 'unknown',
    },
    {
      key: 'chartsSendEnabled',
      label: 'Charts送信',
      configValue: rawConfig?.chartsSendEnabled,
      deliveryValue: rawDelivery?.chartsSendEnabled,
      state: deliveryStatus.chartsSendEnabled ?? 'unknown',
    },
    {
      key: 'chartsMasterSource',
      label: 'Charts master',
      configValue: rawConfig?.chartsMasterSource,
      deliveryValue: rawDelivery?.chartsMasterSource,
      state: deliveryStatus.chartsMasterSource ?? 'unknown',
    },
  ];
  const masterVersionDiffs = countVersionDiffs(masterLastUpdateResult?.versions);
  const systemVersionDiffs = countVersionDiffs(systemInfoResult?.versions);
  const masterStatusTone = resolveStatusTone(masterLastUpdateResult, masterLastUpdateMutation.isPending);
  const medicationStatusTone = resolveStatusTone(medicationSyncResult, medicationModMutation.isPending);
  const systemInfoStatusTone = resolveStatusTone(systemInfoResult, systemHealthMutation.isPending);
  const systemDailyStatusTone = resolveStatusTone(systemDailyResult, systemHealthMutation.isPending);
  const medicalSetStatusTone = resolveStatusTone(medicalSetResult, medicalSetMutation.isPending);
  const isMasterUpdateDetected = masterUpdateLabel === '更新あり';
  const masterUpdateHeadline = isMasterUpdateDetected ? '更新検知: 同期推奨' : `更新検知: ${masterUpdateLabel}`;

  return (
    <main className="administration-page" data-test-id="administration-page" data-run-id={resolvedRunId}>
      <div className="administration-page__header">
        <h1>Administration（設定配信）</h1>
        <p className="administration-page__lead" role="status" aria-live={infoLive}>
          管理者が ORCA 接続・MSW トグル・配信フラグを編集し、保存時に broadcast / audit を送ります。RUN_ID:{' '}
          <strong>{resolvedRunId}</strong>
        </p>
        <div className="administration-page__meta" aria-live={infoLive}>
          <RunIdBadge runId={resolvedRunId} />
          <span className="administration-page__pill">role: {role ?? 'unknown'}</span>
          <span className="administration-page__pill">配信元: {configQuery.data?.source ?? 'live'}</span>
          <span className="administration-page__pill">環境: {environmentLabel}</span>
          <span className="administration-page__pill">deliveryMode: {deliveryMode ?? '―'}</span>
          <span className="administration-page__pill">ETag: {effectiveDeliveryEtag ?? '―'}</span>
          <span className="administration-page__pill">配信状態: {deliverySummary.summary}</span>
          <span className="administration-page__pill">最終配信: {formatTimestampWithAgo(lastDeliveredAt)}</span>
          <span className="administration-page__pill">
            検証フラグ: {form.verifyAdminDelivery ? 'enabled' : 'disabled'}
          </span>
          <span className="administration-page__pill">
            ORCA queue: {form.useMockOrcaQueue ? 'mock (MSW)' : 'live'}
          </span>
          <span className="administration-page__pill">
            Charts表示: {form.chartsDisplayEnabled ? 'enabled' : 'disabled'}
          </span>
          <span className="administration-page__pill">
            Charts送信: {form.chartsSendEnabled ? 'enabled' : 'disabled'}
          </span>
          <span className="administration-page__pill">Charts master: {form.chartsMasterSource}</span>
          <span className="administration-page__pill">
            syncMismatch: {syncMismatch === undefined ? '―' : syncMismatch ? `true（${deliveryPriorityLabel}）` : 'false'}
          </span>
          <span className="administration-page__pill">mismatchFields: {syncMismatchFields ?? '―'}</span>
        </div>
        {!isSystemAdmin ? (
          <div className="admin-guard" role="alert" aria-live={resolveAriaLive('warning')} id={guardMessageId}>
            <div className="admin-guard__header">
              <span className="admin-guard__title">操作ガード中</span>
              <span className="admin-guard__badge">system_adminのみ</span>
            </div>
            <p className="admin-guard__message">
              現在のロール（{role ?? 'unknown'}）では配信設定の変更・キュー操作はできません。閲覧のみ可能です。
            </p>
            <ul className="admin-guard__next" id={guardDetailsId}>
              <li>system_admin で再ログインしてください。</li>
              <li>権限保持者へ配信依頼を行ってください。</li>
              <li>
                <Link to={buildFacilityPath(session.facilityId, '/reception')} className="admin-guard__link">
                  Reception へ戻って受付状況を確認
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </div>

      {warningEntries.length > 0 ? (
        <ToneBanner
          tone="warning"
          message={`未配信・失敗バンドルが ${warningEntries.length} 件あります（遅延判定:${warningThresholdMinutes}分）。再送または破棄を実施してください。`}
          destination="ORCA queue"
          runId={resolvedRunId}
          nextAction="再送/破棄・再取得"
        />
      ) : syncMismatch ? (
        <ToneBanner
          tone="warning"
          message={`config/delivery の不一致を検知しました（delivery優先）。fields: ${syncMismatchFields ?? 'unknown'}`}
          destination="Administration"
          runId={resolvedRunId}
          nextAction="再取得 / 再配信で解消"
        />
      ) : (
        <p className="admin-quiet">
          未配信キューの遅延は検知されていません（遅延閾値:{warningThresholdMinutes}分）。
        </p>
      )}

      <div className="administration-grid">
        <section className="administration-card" aria-label="配信設定フォーム">
          <h2 className="administration-card__title">配信設定</h2>
          <form className="admin-form" onSubmit={(e) => e.preventDefault()}>
            <div className="admin-form__field">
              <label htmlFor="orca-endpoint">ORCA 接続先</label>
              <input
                id="orca-endpoint"
                type="text"
                value={form.orcaEndpoint}
                onChange={(event) => handleInputChange('orcaEndpoint', event.target.value)}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              />
              <p className="admin-quiet">例: https://localhost:9080/openDolphin/resources</p>
            </div>

            <div className="admin-form__toggles">
              {showAdminDebugToggles ? (
                <>
                  <div className="admin-toggle">
                    <div className="admin-toggle__label">
                      <span>MSW（モック）を優先</span>
                      <span className="admin-toggle__hint">開発時は ON、実 API 検証時は OFF</span>
                    </div>
                    <input
                      type="checkbox"
                      aria-label="MSW（モック）を優先"
                      checked={form.useMockOrcaQueue}
                      onChange={(event) => {
                        const next = event.target.checked;
                        handleInputChange('useMockOrcaQueue', next);
                        persistHeaderFlags({ useMockOrcaQueue: next });
                      }}
                      disabled={!isSystemAdmin}
                      aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
                    />
                  </div>
                  <div className="admin-toggle">
                    <div className="admin-toggle__label">
                      <span>配信検証フラグ</span>
                      <span className="admin-toggle__hint">ヘッダー x-admin-delivery-verification を付与</span>
                    </div>
                    <input
                      type="checkbox"
                      aria-label="配信検証フラグ"
                      checked={form.verifyAdminDelivery}
                      onChange={(event) => {
                        const next = event.target.checked;
                        handleInputChange('verifyAdminDelivery', next);
                        persistHeaderFlags({ verifyAdminDelivery: next });
                      }}
                      disabled={!isSystemAdmin}
                      aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
                    />
                  </div>
                  <div className="admin-toggle">
                    <div className="admin-toggle__label">
                      <span>MSW ローカルキャッシュ</span>
                      <span className="admin-toggle__hint">mswEnabled=true で UI モックを許可</span>
                    </div>
                    <input
                      type="checkbox"
                      aria-label="MSW ローカルキャッシュ"
                      checked={form.mswEnabled}
                      onChange={(event) => handleInputChange('mswEnabled', event.target.checked)}
                      disabled={!isSystemAdmin}
                      aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
                    />
                  </div>
                </>
              ) : null}
              <div className="admin-toggle">
                <div className="admin-toggle__label">
                  <span>Charts 表示フラグ</span>
                  <span className="admin-toggle__hint">Charts の表示（カード一式）を切替</span>
                </div>
                <input
                  type="checkbox"
                  aria-label="Charts 表示フラグ"
                  checked={form.chartsDisplayEnabled}
                  onChange={(event) => handleInputChange('chartsDisplayEnabled', event.target.checked)}
                  disabled={!isSystemAdmin}
                  aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
                />
              </div>
              <div className="admin-toggle">
                <div className="admin-toggle__label">
                  <span>Charts 送信フラグ</span>
                  <span className="admin-toggle__hint">ORCA送信（ActionBar）を切替</span>
                </div>
                <input
                  type="checkbox"
                  aria-label="Charts 送信フラグ"
                  checked={form.chartsSendEnabled}
                  onChange={(event) => handleInputChange('chartsSendEnabled', event.target.checked)}
                  disabled={!isSystemAdmin}
                  aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
                />
              </div>
            </div>

            <div className="admin-form__field">
              <label htmlFor="charts-master-source">Charts master ソース</label>
              <select
                id="charts-master-source"
                value={form.chartsMasterSource}
                onChange={(event) => handleChartsMasterSourceChange(event.target.value)}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              >
                <option value="auto">auto（環境変数に従う）</option>
                <option value="server">server（実 API 優先）</option>
                <option value="mock">mock（MSW/fixture 優先）</option>
                <option value="fallback">fallback（送信停止・フォールバック扱い）</option>
                <option value="snapshot">snapshot（将来拡張）</option>
              </select>
              <p className="admin-quiet">
                `fallback` は Charts 側で送信をブロックし、ToneBanner で「server→fallback」を明示します（デモ用途）。
              </p>
            </div>

            <div className="admin-actions">
              <button
                type="button"
                className="admin-button admin-button--primary"
                onClick={handleSave}
                disabled={configMutation.isPending}
                aria-disabled={!isSystemAdmin || configMutation.isPending}
                data-guarded={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              >
                保存して配信
              </button>
              <button
                type="button"
                className="admin-button admin-button--secondary"
                onClick={() => configQuery.refetch()}
                disabled={configQuery.isFetching}
              >
                再取得
              </button>
            </div>
            {feedback ? (
              <p
                className="status-message"
                role="status"
                aria-live={resolveAriaLive(feedback.tone)}
              >
                {feedback.message}
              </p>
            ) : null}
            {configQuery.data?.note ? <p className="admin-note">{configQuery.data.note}</p> : null}
          </form>
        </section>

        <section className="administration-card" aria-label="配信ステータス">
          <h2 className="administration-card__title">配信ステータス</h2>
          <ul className="placeholder-page__list">
            <li>deliveryId: {configQuery.data?.deliveryId ?? '―'}</li>
            <li>deliveryVersion: {configQuery.data?.deliveryVersion ?? '―'}</li>
            <li>ETag: {effectiveDeliveryEtag ?? '―'}</li>
            <li>deliveredAt: {formatTimestamp(rawDelivery?.deliveredAt ?? configQuery.data?.deliveredAt)}</li>
            <li>environment: {environmentLabel}</li>
            <li>deliveryMode: {deliveryMode ?? '―'}</li>
            <li>verified: {configQuery.data?.verifyAdminDelivery ? 'true' : 'false'}</li>
            <li>chartsDisplayEnabled: {configQuery.data?.chartsDisplayEnabled === undefined ? '―' : String(configQuery.data.chartsDisplayEnabled)}</li>
            <li>chartsSendEnabled: {configQuery.data?.chartsSendEnabled === undefined ? '―' : String(configQuery.data.chartsSendEnabled)}</li>
            <li>chartsMasterSource: {configQuery.data?.chartsMasterSource ?? '―'}</li>
          </ul>
          <p className="admin-quiet">表示優先: {deliveryPriorityLabel}（rawConfig / rawDelivery を併記）</p>
          <ul className="admin-delivery-flags" aria-label="Charts 配信状態">
            {deliveryFlagRows.map((row) => (
              <li key={row.key} className="admin-delivery-flags__row">
                <span className="admin-delivery-flags__label">{row.label}</span>
                <span className="admin-delivery-flags__value">
                  rawConfig: {formatDeliveryValue(row.configValue)} / rawDelivery: {formatDeliveryValue(row.deliveryValue)}
                </span>
                <span className={`admin-delivery-pill admin-delivery-pill--${row.state}`}>
                  {deliveryFlagStateLabel(row.state)}
                </span>
              </li>
            ))}
          </ul>
          <p className="admin-note">
            保存時に broadcast を発行し、Reception/Charts へ「設定更新」バナーを表示します。system_admin 以外は読み取り専用です。
          </p>
        </section>
      </div>

      <div className="administration-grid administration-grid--wide">
        <section className="administration-card" aria-label="ORCA マスタ同期">
          <h2 className="administration-card__title">ORCA マスタ同期</h2>
          <div className="admin-status-row">
            <span className={`admin-status admin-status--${masterStatusTone}`}>
              {resolveStatusLabel(masterLastUpdateResult, masterLastUpdateMutation.isPending)}
            </span>
            <span className="admin-status-label">更新検知:</span>
            <span
              className={`admin-status admin-status--${
                masterUpdateLabel === '更新あり' ? 'warn' : masterUpdateLabel === '初回取得' ? 'idle' : 'ok'
              }`}
            >
              {masterUpdateLabel}
            </span>
            <span>更新差分: {masterLastUpdateResult ? `${masterVersionDiffs}件` : '―'}</span>
            <span>最終更新日: {masterLastUpdateResult?.lastUpdateDate ?? '―'}</span>
          </div>
          <div className="admin-callout">
            <div className="admin-callout__body">
              <p className="admin-callout__title">{masterUpdateHeadline}</p>
              <ol className="admin-step-list">
                <li>masterlastupdatev3 で更新有無を確認</li>
                <li>更新ありなら medicatonmodv2 で点数マスタ同期</li>
                <li>同期後に再度更新確認して反映確認</li>
              </ol>
            </div>
            <div className="admin-callout__actions">
              <span className={`admin-status admin-status--${masterStatusTone}`}>
                {resolveStatusLabel(masterLastUpdateResult, masterLastUpdateMutation.isPending)}
              </span>
            </div>
          </div>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={handleMasterCheck}
              disabled={masterLastUpdateMutation.isPending}
              aria-disabled={!isSystemAdmin || masterLastUpdateMutation.isPending}
              data-guarded={!isSystemAdmin}
              aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
            >
              更新確認
            </button>
          </div>
          {masterLastUpdateResult ? (
            <div className="admin-result">
              <span>Api_Result: {masterLastUpdateResult.apiResult ?? '―'}</span>
              <span>Message: {masterLastUpdateResult.apiResultMessage ?? '―'}</span>
              <span>取得日時: {formatDateTime(masterLastUpdateResult.informationDate, masterLastUpdateResult.informationTime)}</span>
              <span>更新検知: {masterUpdateLabel}（差分 {masterVersionDiffs}件）</span>
              {masterLastUpdateResult.error ? <span className="admin-error">error: {masterLastUpdateResult.error}</span> : null}
            </div>
          ) : null}
          <div className="admin-divider" />
          <div className="admin-form">
            <div className="admin-form__field">
              <label htmlFor="medication-class">medicatonmodv2 class</label>
              <input
                id="medication-class"
                type="text"
                value={medicationSyncClass}
                onChange={(event) => setMedicationSyncClass(event.target.value)}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              />
              <p className="admin-quiet">例: 01（点数マスタ登録）</p>
            </div>
            <div className="admin-form__field">
              <label htmlFor="medication-xml">medicatonmodv2 payload (XML)</label>
              <textarea
                id="medication-xml"
                className="admin-textarea"
                value={medicationSyncXml}
                onChange={(event) => setMedicationSyncXml(event.target.value)}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
                rows={7}
              />
            </div>
          </div>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={handleMedicationSync}
              disabled={medicationModMutation.isPending}
              aria-disabled={!isSystemAdmin || medicationModMutation.isPending}
              data-guarded={!isSystemAdmin}
              aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
            >
              点数マスタ同期
            </button>
          </div>
          {medicationSyncResult ? (
            <div className="admin-result">
              <span className={`admin-status admin-status--${medicationStatusTone}`}>
                {resolveStatusLabel(medicationSyncResult, medicationModMutation.isPending)}
              </span>
              <span>Api_Result: {medicationSyncResult.apiResult ?? '―'}</span>
              <span>Message: {medicationSyncResult.apiResultMessage ?? '―'}</span>
              {medicationSyncResult.error ? <span className="admin-error">error: {medicationSyncResult.error}</span> : null}
            </div>
          ) : null}
        </section>

        <section className="administration-card" aria-label="システムヘルスチェック">
          <h2 className="administration-card__title">システムヘルスチェック</h2>
          <div className="admin-status-row">
            <span
              className={`admin-status admin-status--${resolveHealthTone(
                systemInfoResult,
                systemDailyResult,
                systemHealthMutation.isPending,
              )}`}
            >
              総合:{' '}
              {resolveHealthLabel(systemInfoResult, systemDailyResult, systemHealthMutation.isPending)}
            </span>
            <span className={`admin-status admin-status--${systemInfoStatusTone}`}>
              systeminfv2: {resolveStatusLabel(systemInfoResult, systemHealthMutation.isPending)}
            </span>
            <span className={`admin-status admin-status--${systemDailyStatusTone}`}>
              system01dailyv2: {resolveStatusLabel(systemDailyResult, systemHealthMutation.isPending)}
            </span>
            <span>バージョン差分: {systemInfoResult ? `${systemVersionDiffs}件` : '―'}</span>
          </div>
          <div className="admin-callout">
            <div className="admin-callout__body">
              <p className="admin-callout__title">systeminfv2 / system01dailyv2 統合サマリー</p>
              <div className="admin-summary">
                <div className="admin-summary__row">
                  <span className="admin-summary__label">JMA Receipt</span>
                  <span>{systemInfoResult?.jmaReceiptVersion ?? '―'}</span>
                </div>
                <div className="admin-summary__row">
                  <span className="admin-summary__label">DB(Local/New)</span>
                  <span>{systemInfoResult?.databaseLocalVersion ?? '―'} / {systemInfoResult?.databaseNewVersion ?? '―'}</span>
                </div>
                <div className="admin-summary__row">
                  <span className="admin-summary__label">Master更新日</span>
                  <span>{systemInfoResult?.lastUpdateDate ?? '―'}</span>
                </div>
                <div className="admin-summary__row">
                  <span className="admin-summary__label">system01dailyv2 Base_Date</span>
                  <span>{systemDailyResult?.baseDate ?? systemBaseDate}</span>
                </div>
                <div className="admin-summary__row">
                  <span className="admin-summary__label">取得日時</span>
                  <span>
                    {formatDateTime(systemInfoResult?.informationDate, systemInfoResult?.informationTime)} /{' '}
                    {formatDateTime(systemDailyResult?.informationDate, systemDailyResult?.informationTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="admin-form">
            <div className="admin-form__field">
              <label htmlFor="system-base-date">system01dailyv2 Base_Date</label>
              <input
                id="system-base-date"
                type="date"
                value={systemBaseDate}
                onChange={(event) => setSystemBaseDate(event.target.value)}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              />
            </div>
          </div>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={handleSystemHealthCheck}
              disabled={systemHealthMutation.isPending}
              aria-disabled={!isSystemAdmin || systemHealthMutation.isPending}
              data-guarded={!isSystemAdmin}
              aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
            >
              ヘルスチェック実行
            </button>
          </div>
          <div className="admin-result admin-result--stack">
            <span>JMA Receipt: {systemInfoResult?.jmaReceiptVersion ?? '―'}</span>
            <span>DB(Local/New): {systemInfoResult?.databaseLocalVersion ?? '―'} / {systemInfoResult?.databaseNewVersion ?? '―'}</span>
            <span>Master更新日: {systemInfoResult?.lastUpdateDate ?? '―'}</span>
            <span>systeminfv2 取得日時: {formatDateTime(systemInfoResult?.informationDate, systemInfoResult?.informationTime)}</span>
            <span>system01dailyv2 Base_Date: {systemDailyResult?.baseDate ?? systemBaseDate}</span>
            <span>system01dailyv2 取得日時: {formatDateTime(systemDailyResult?.informationDate, systemDailyResult?.informationTime)}</span>
            {systemInfoResult?.error ? <span className="admin-error">systeminfv2 error: {systemInfoResult.error}</span> : null}
            {systemDailyResult?.error ? <span className="admin-error">system01dailyv2 error: {systemDailyResult.error}</span> : null}
          </div>
          <div className="admin-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>マスタ名</th>
                  <th>Local</th>
                  <th>New</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {systemInfoResult?.versions.length ? (
                  systemInfoResult.versions.map((entry, index) => {
                    const isDiff =
                      entry.localVersion && entry.newVersion && entry.localVersion !== entry.newVersion;
                    return (
                      <tr key={`${entry.name ?? 'master'}-${index}`} className={isDiff ? 'admin-version--diff' : undefined}>
                        <td>{entry.name ?? '―'}</td>
                        <td>{entry.localVersion ?? '―'}</td>
                        <td>{entry.newVersion ?? '―'}</td>
                        <td>{isDiff ? '更新あり' : '一致'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4}>バージョン情報は未取得です。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="administration-card" aria-label="診療セット検索">
          <h2 className="administration-card__title">診療セット検索</h2>
          <div className="admin-status-row">
            <span className={`admin-status admin-status--${medicalSetStatusTone}`}>
              {resolveStatusLabel(medicalSetResult, medicalSetMutation.isPending)}
            </span>
            <span>結果: {medicalSetResult ? `${medicalSetResult.entries.length}件` : '―'}</span>
          </div>
          <div className="admin-callout">
            <div className="admin-callout__body">
              <p className="admin-callout__title">セット検索の起点</p>
              <p className="admin-quiet">Administration で条件を入力 → セット検索 → Charts オーダーへ接続します。</p>
            </div>
            <div className="admin-callout__actions">
              <Link to={buildFacilityPath(session.facilityId, '/charts')} className="admin-link admin-link--button">
                Charts で利用
              </Link>
            </div>
          </div>
          <div className="admin-form">
            <div className="admin-form__field">
              <label htmlFor="medicalset-base-date">Base_Date</label>
              <input
                id="medicalset-base-date"
                type="date"
                value={medicalSetQuery.baseDate}
                onChange={(event) => setMedicalSetQuery((prev) => ({ ...prev, baseDate: event.target.value }))}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="medicalset-code">Set_Code</label>
              <input
                id="medicalset-code"
                type="text"
                value={medicalSetQuery.setCode ?? ''}
                onChange={(event) => setMedicalSetQuery((prev) => ({ ...prev, setCode: event.target.value }))}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="medicalset-name">Set_Code_Name</label>
              <input
                id="medicalset-name"
                type="text"
                value={medicalSetQuery.setName ?? ''}
                onChange={(event) => setMedicalSetQuery((prev) => ({ ...prev, setName: event.target.value }))}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="medicalset-start-date">Start_Date</label>
              <input
                id="medicalset-start-date"
                type="date"
                value={medicalSetQuery.startDate ?? ''}
                onChange={(event) => setMedicalSetQuery((prev) => ({ ...prev, startDate: event.target.value }))}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="medicalset-end-date">Ende_Date</label>
              <input
                id="medicalset-end-date"
                type="date"
                value={medicalSetQuery.endDate ?? ''}
                onChange={(event) => setMedicalSetQuery((prev) => ({ ...prev, endDate: event.target.value }))}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              />
            </div>
            <div className="admin-form__field">
              <label htmlFor="medicalset-inout">InOut</label>
              <select
                id="medicalset-inout"
                value={medicalSetQuery.inOut ?? ''}
                onChange={(event) => setMedicalSetQuery((prev) => ({ ...prev, inOut: event.target.value }))}
                disabled={!isSystemAdmin}
                aria-readonly={!isSystemAdmin}
                aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
              >
                <option value="">指定なし</option>
                <option value="O">O（外来）</option>
                <option value="I">I（入院）</option>
              </select>
            </div>
          </div>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-button admin-button--secondary"
              onClick={handleMedicalSetSearch}
              disabled={medicalSetMutation.isPending}
              aria-disabled={!isSystemAdmin || medicalSetMutation.isPending}
              data-guarded={!isSystemAdmin}
              aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
            >
              セット検索
            </button>
          </div>
          {medicalSetResult?.error ? <p className="admin-error">error: {medicalSetResult.error}</p> : null}
          <div className="admin-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Set_Code</th>
                  <th>名称</th>
                  <th>期間</th>
                  <th>InOut</th>
                  <th>内容</th>
                </tr>
              </thead>
              <tbody>
                {medicalSetResult?.entries.length ? (
                  medicalSetResult.entries.map((entry, index) => (
                    <tr key={`${entry.setCode ?? 'set'}-${index}`}>
                      <td>{entry.setCode ?? '―'}</td>
                      <td>{entry.setName ?? '―'}</td>
                      <td>
                        {entry.startDate ?? '―'} ~ {entry.endDate ?? '―'}
                      </td>
                      <td>{entry.inOut ?? '―'}</td>
                      <td>{entry.medicationSummary ?? '―'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>検索結果はまだありません。</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="administration-card" aria-label="配信キュー一覧">
        <h2 className="administration-card__title">配信キュー</h2>
        <p className="admin-quiet">
          未配信のバンドルを確認し、必要に応じて再送（retry）または破棄します。遅延判定は {warningThresholdMinutes}
          分超の pending を対象とし、失敗と合わせて警告バナーに反映します。
        </p>
        <table className="admin-queue">
          <thead>
            <tr>
              <th>patientId</th>
              <th>status</th>
              <th>lastDispatch</th>
              <th>headers</th>
              <th aria-label="actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {queueEntries.length === 0 ? (
              <tr>
                <td colSpan={5}>未配信キューはありません。</td>
              </tr>
            ) : (
              queueEntries.map((entry) => (
                <tr key={entry.patientId}>
                  <td>{entry.patientId}</td>
                  <td>
                    <span className={toStatusClass(entry.status)}>{entry.status}</span>
                  </td>
                  <td>{formatTimeAgo(entry.lastDispatchAt)}</td>
                  <td>{entry.headers?.join(' / ') ?? '―'}</td>
                  <td>
                    <div className="admin-queue__actions">
                      <button
                        type="button"
                        className="admin-button admin-button--secondary"
                        onClick={() => handleRetry(entry.patientId)}
                        disabled={queueMutation.isPending || !entry.retryable}
                        aria-disabled={!isSystemAdmin || queueMutation.isPending || !entry.retryable}
                        data-guarded={!isSystemAdmin}
                        aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
                      >
                        再送
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button--danger"
                        onClick={() => handleDiscard(entry.patientId)}
                        disabled={queueMutation.isPending}
                        aria-disabled={!isSystemAdmin || queueMutation.isPending}
                        data-guarded={!isSystemAdmin}
                        aria-describedby={!isSystemAdmin ? guardDetailsId : undefined}
                      >
                        破棄
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
