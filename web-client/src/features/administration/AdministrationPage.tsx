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
  fetchOrcaQueue,
  retryOrcaQueue,
  saveAdminConfig,
  type AdminConfigPayload,
  type ChartsMasterSourcePolicy,
  type OrcaQueueEntry,
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
type GuardAction = 'access' | 'edit' | 'save' | 'retry' | 'discard';

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
  const [form, setForm] = useState<AdminConfigPayload>(DEFAULT_FORM);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
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
