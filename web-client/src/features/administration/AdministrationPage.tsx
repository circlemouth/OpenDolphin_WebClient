import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { persistHeaderFlags, resolveHeaderFlags } from '../../libs/http/header-flags';
import { ToneBanner } from '../reception/components/ToneBanner';
import { useSession } from '../../AppRouter';
import { applyAuthServicePatch, useAuthService, type AuthServiceFlags } from '../charts/authService';
import {
  discardOrcaQueue,
  fetchEffectiveAdminConfig,
  fetchOrcaQueue,
  retryOrcaQueue,
  saveAdminConfig,
  type AdminConfigPayload,
  type AdminConfigResponse,
  type ChartsMasterSourcePolicy,
  type OrcaQueueEntry,
} from './api';
import './administration.css';
import {
  publishAdminBroadcast,
  type AdminDeliveryFlagState,
  type AdminDeliveryStatus,
} from '../../libs/admin/broadcast';

type AdministrationPageProps = {
  runId: string;
  role?: string;
};

type Feedback = { tone: 'success' | 'warning' | 'error' | 'info'; message: string };

const deliveryFlagStateLabel = (state: AdminDeliveryFlagState) => {
  if (state === 'applied') return '配信済み';
  if (state === 'pending') return '未反映';
  return '不明';
};

const DEFAULT_FORM: AdminConfigPayload = {
  orcaEndpoint: 'https://localhost:9080/openDolphin/resources',
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

export function AdministrationPage({ runId, role }: AdministrationPageProps) {
  const isSystemAdmin = role === 'system_admin' || role === 'admin' || role === 'system-admin';
  const session = useSession();
  const appliedMeta = useRef<Partial<AuthServiceFlags>>({});
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
        deliveryId: data.deliveryId,
        deliveryVersion: data.deliveryVersion,
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
      publishAdminBroadcast({
        runId: data.runId ?? runId,
        deliveryId: variables.patientId,
        deliveryVersion: data.source,
        deliveredAt: new Date().toISOString(),
        queueMode: data.source,
        verifyAdminDelivery: data.verifyAdminDelivery,
        environment: environmentLabel,
        note: variables.kind === 'retry' ? '再送完了' : '破棄完了',
      });
      logAuditEvent({
        runId: data.runId ?? runId,
        source: 'orca/queue',
        note: variables.kind,
        patientId: variables.patientId,
        payload: { patientId: variables.patientId, queue: data.queue },
      });
      setFeedback({
        tone: 'info',
        message: variables.kind === 'retry' ? '再送リクエストを送信しました。' : 'キューエントリを破棄しました。',
      });
    },
    onError: () => {
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
  const warningEntries = useMemo(
    () =>
      queueEntries.filter((entry) => {
        if (entry.status === 'failed') return true;
        if (entry.status === 'pending') {
          if (!entry.lastDispatchAt) return true;
          const elapsed = Date.now() - new Date(entry.lastDispatchAt).getTime();
          return elapsed > 120_000;
        }
        return false;
      }),
    [queueEntries],
  );

  const handleInputChange = (key: keyof AdminConfigPayload, value: string | boolean) => {
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
    configMutation.mutate(form);
  };

  const handleRetry = (patientId: string) => {
    queueMutation.mutate({ kind: 'retry', patientId });
  };

  const handleDiscard = (patientId: string) => {
    queueMutation.mutate({ kind: 'discard', patientId });
  };

  const latestRunId = configQuery.data?.runId ?? queueQuery.data?.runId ?? runId;
  const resolvedRunId = latestRunId ?? flags.runId;
  const syncMismatch = configQuery.data?.syncMismatch;
  const syncMismatchFields = configQuery.data?.syncMismatchFields?.length ? configQuery.data.syncMismatchFields.join(', ') : undefined;
  const rawConfig = configQuery.data?.rawConfig ?? configQuery.data;
  const rawDelivery = configQuery.data?.rawDelivery;
  const envFallback = normalizeEnvironmentLabel(
    (import.meta.env as Record<string, string | undefined>).VITE_ENVIRONMENT ??
      (import.meta.env as Record<string, string | undefined>).VITE_DEPLOY_ENV ??
      (import.meta.env.MODE === 'development' ? 'dev' : import.meta.env.MODE),
  );
  const environmentLabel = normalizeEnvironmentLabel(configQuery.data?.environment) ?? envFallback ?? 'unknown';
  const deliveryStatus = buildChartsDeliveryStatus(rawConfig, rawDelivery);
  const deliverySummary = summarizeDeliveryStatus(deliveryStatus);
  const lastDeliveredAt = rawDelivery?.deliveredAt ?? configQuery.data?.deliveredAt;
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
        <p className="administration-page__lead" role="status" aria-live="assertive">
          管理者が ORCA 接続・MSW トグル・配信フラグを編集し、保存時に broadcast / audit を送ります。RUN_ID:{' '}
          <strong>{resolvedRunId}</strong>
        </p>
        <div className="administration-page__meta" aria-live="polite">
          <span className="administration-page__pill">role: {role ?? 'unknown'}</span>
          <span className="administration-page__pill">配信元: {configQuery.data?.source ?? 'live'}</span>
          <span className="administration-page__pill">環境: {environmentLabel}</span>
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
            syncMismatch: {syncMismatch === undefined ? '―' : syncMismatch ? 'true（delivery優先）' : 'false'}
          </span>
          <span className="administration-page__pill">mismatchFields: {syncMismatchFields ?? '―'}</span>
        </div>
      </div>

      {warningEntries.length > 0 ? (
        <ToneBanner
          tone="warning"
          message={`未配信・失敗バンドルが ${warningEntries.length} 件あります。再送または破棄を実施してください。`}
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
        <p className="admin-quiet">未配信キューの遅延は検知されていません。</p>
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
              />
              <p className="admin-quiet">例: https://localhost:9080/openDolphin/resources</p>
            </div>

            <div className="admin-form__toggles">
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
                />
              </div>
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
                disabled={!isSystemAdmin || configMutation.isPending}
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
                aria-live={feedback.tone === 'error' ? 'assertive' : 'polite'}
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
            <li>deliveredAt: {formatTimestamp(rawDelivery?.deliveredAt ?? configQuery.data?.deliveredAt)}</li>
            <li>environment: {environmentLabel}</li>
            <li>deliveryMode: {configQuery.data?.deliveryMode ?? (deliverySummary.summary ?? '―')}</li>
            <li>verified: {configQuery.data?.verifyAdminDelivery ? 'true' : 'false'}</li>
            <li>chartsDisplayEnabled: {configQuery.data?.chartsDisplayEnabled === undefined ? '―' : String(configQuery.data.chartsDisplayEnabled)}</li>
            <li>chartsSendEnabled: {configQuery.data?.chartsSendEnabled === undefined ? '―' : String(configQuery.data.chartsSendEnabled)}</li>
            <li>chartsMasterSource: {configQuery.data?.chartsMasterSource ?? '―'}</li>
          </ul>
          <ul className="admin-delivery-flags" aria-label="Charts 配信状態">
            {deliveryFlagRows.map((row) => (
              <li key={row.key} className="admin-delivery-flags__row">
                <span className="admin-delivery-flags__label">{row.label}</span>
                <span className="admin-delivery-flags__value">
                  config: {row.configValue === undefined ? '―' : String(row.configValue)} / delivery:{' '}
                  {row.deliveryValue === undefined ? '―' : String(row.deliveryValue)}
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
          未配信のバンドルを確認し、必要に応じて再送（retry）または破棄します。ヘッダーで queueMode / delivery verification を表示します。
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
                        disabled={!isSystemAdmin || queueMutation.isPending || !entry.retryable}
                      >
                        再送
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button--danger"
                        onClick={() => handleDiscard(entry.patientId)}
                        disabled={!isSystemAdmin || queueMutation.isPending}
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
