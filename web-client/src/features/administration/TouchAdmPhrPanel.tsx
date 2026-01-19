import { useEffect, useMemo, useState } from 'react';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { getObservabilityMeta, resolveAriaLive } from '../../libs/observability/observability';
import {
  TOUCH_ADM_PHR_ENDPOINTS,
  requestTouchAdmPhr,
  type TouchAdmPhrContext,
  type TouchAdmPhrEndpoint,
  type TouchAdmPhrResponseMode,
} from './touchAdmPhrApi';

export type TouchAdmPhrStatus = {
  endpointId: string;
  endpoint: string;
  status?: number;
  ok?: boolean;
  mode?: TouchAdmPhrResponseMode;
  contentType?: string;
  binarySize?: number;
  updatedAt?: string;
  runId?: string;
  traceId?: string;
  error?: string;
  stubExpected?: boolean;
  stubHint?: string;
};

export type TouchAdmPhrPanelProps = {
  runId: string;
  role?: string;
  actorId: string;
  environmentLabel?: string;
  isSystemAdmin: boolean;
  facilityId?: string;
  userId?: string;
  onGuarded?: (detail?: string) => void;
};

const groupLabels: Record<string, string> = {
  touch: 'Touch',
  adm10: 'ADM10',
  adm20: 'ADM20',
  phr: 'PHR',
  demo: 'Demo',
};

const resolveStatusTone = (status?: number) => {
  if (status === undefined) return 'info';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 500) return 'error';
  if (status >= 400) return 'warning';
  return 'info';
};

const resolveStatusLabel = (status?: number) => {
  if (status === undefined) return '未送信';
  const group = Math.floor(status / 100);
  const groupLabel = Number.isFinite(group) ? `${group}xx` : 'unknown';
  const groupText =
    status >= 200 && status < 300
      ? 'success'
      : status >= 400 && status < 500
        ? 'client error'
        : status >= 500
          ? 'server error'
          : 'info';
  return `HTTP ${status} (${groupLabel} ${groupText})`;
};

const buildResultSummary = (status?: TouchAdmPhrStatus) => {
  if (!status) return '未送信';
  const parts = [resolveStatusLabel(status.status)];
  if (status.mode) parts.push(`mode=${status.mode}`);
  if (status.mode === 'binary') {
    parts.push(`bytes=${status.binarySize ?? 'unknown'}`);
  }
  if (status.contentType) parts.push(`ct=${status.contentType}`);
  if (status.stubExpected) {
    parts.push(`stub=${status.stubHint ?? 'possible'}`);
  }
  return parts.join(' / ');
};

const buildDefaultContext = (props: TouchAdmPhrPanelProps): TouchAdmPhrContext => ({
  facilityId: props.facilityId,
  userId: props.userId,
  patientId: '00002',
  patientPk: '1',
  accessKey: 'ACCESS-KEY',
});

export function TouchAdmPhrPanel(props: TouchAdmPhrPanelProps) {
  const { runId, role, actorId, environmentLabel, isSystemAdmin, onGuarded } = props;
  const [context, setContext] = useState<TouchAdmPhrContext>(() => buildDefaultContext(props));
  const [results, setResults] = useState<Record<string, TouchAdmPhrStatus>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setContext((prev) => ({
      ...prev,
      facilityId: props.facilityId ?? prev.facilityId,
      userId: props.userId ?? prev.userId,
    }));
  }, [props.facilityId, props.userId]);

  const allowDemo = import.meta.env.VITE_ENABLE_DEMO_ENDPOINTS === '1';
  const allowStub = import.meta.env.VITE_ENABLE_STUB_ENDPOINTS === '1';

  const endpoints = useMemo(
    () =>
      TOUCH_ADM_PHR_ENDPOINTS.filter((endpoint) => {
        if (!allowDemo && endpoint.group === 'demo') return false;
        if (!allowStub && endpoint.stub) return false;
        return true;
      }),
    [allowDemo, allowStub],
  );
  const grouped = useMemo(() => {
    const buckets = new Map<string, TouchAdmPhrEndpoint[]>();
    endpoints.forEach((endpoint) => {
      const list = buckets.get(endpoint.group) ?? [];
      list.push(endpoint);
      buckets.set(endpoint.group, list);
    });
    return Array.from(buckets.entries()).map(([group, list]) => ({
      group,
      label: groupLabels[group] ?? group,
      endpoints: list,
    }));
  }, [endpoints]);

  const handleRequest = async (endpoint: TouchAdmPhrEndpoint) => {
    if (!isSystemAdmin) {
      onGuarded?.(`touch-adm-phr:${endpoint.id}`);
      return;
    }

    setLoadingId(endpoint.id);
    const beforeMeta = getObservabilityMeta();
    const path = endpoint.buildPath(context);
    const query = endpoint.buildQuery?.(context);
    const body = endpoint.buildBody?.(context);

    logUiState({
      action: 'send',
      screen: 'administration/touch-adm-phr',
      controlId: `touch-adm-phr-${endpoint.id}`,
      runId,
      details: {
        endpoint: path,
        method: endpoint.method,
        group: endpoint.group,
        stub: endpoint.stub ?? false,
        query,
      },
    });

    try {
      const response = await requestTouchAdmPhr({
        method: endpoint.method,
        path,
        query,
        body,
        contentType: endpoint.defaultContentType,
        accept: endpoint.accept,
      });
      const nextStatus: TouchAdmPhrStatus = {
        endpointId: endpoint.id,
        endpoint: path,
        status: response.status,
        ok: response.ok,
        mode: response.mode,
        contentType: response.contentType,
        binarySize: response.binarySize,
        updatedAt: new Date().toISOString(),
        runId: response.runId ?? beforeMeta.runId,
        traceId: response.traceId ?? beforeMeta.traceId,
        stubExpected: endpoint.stub,
        stubHint: endpoint.stubHint,
      };
      setResults((prev) => ({ ...prev, [endpoint.id]: nextStatus }));

      const outcome = response.ok ? 'success' : 'error';
      logAuditEvent({
        runId: nextStatus.runId ?? runId,
        traceId: nextStatus.traceId,
        source: 'touch-adm-phr',
        note: 'touch-adm-phr-response',
        payload: {
          action: 'touch-adm-phr-request',
          screen: 'administration/touch-adm-phr',
          outcome,
          endpoint: path,
          method: endpoint.method,
          group: endpoint.group,
          status: response.status,
          role,
          environment: environmentLabel,
          stub: endpoint.stub ?? false,
          details: {
            endpoint: path,
            method: endpoint.method,
            group: endpoint.group,
            status: response.status,
            ok: response.ok,
            mode: response.mode,
            contentType: response.contentType,
            binarySize: response.binarySize,
            actor: actorId,
            query,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const nextStatus: TouchAdmPhrStatus = {
        endpointId: endpoint.id,
        endpoint: path,
        status: undefined,
        ok: false,
        updatedAt: new Date().toISOString(),
        runId: beforeMeta.runId,
        traceId: beforeMeta.traceId,
        error: message,
        stubExpected: endpoint.stub,
        stubHint: endpoint.stubHint,
      };
      setResults((prev) => ({ ...prev, [endpoint.id]: nextStatus }));
      logAuditEvent({
        runId: beforeMeta.runId ?? runId,
        traceId: beforeMeta.traceId,
        source: 'touch-adm-phr',
        note: 'touch-adm-phr-error',
        payload: {
          action: 'touch-adm-phr-request',
          screen: 'administration/touch-adm-phr',
          outcome: 'error',
          endpoint: path,
          method: endpoint.method,
          group: endpoint.group,
          role,
          environment: environmentLabel,
          stub: endpoint.stub ?? false,
          error: message,
          details: {
            endpoint: path,
            method: endpoint.method,
            group: endpoint.group,
            error: message,
            actor: actorId,
            query,
          },
        },
      });
    } finally {
      setLoadingId((current) => (current === endpoint.id ? null : current));
    }
  };

  return (
    <section className="administration-card admin-touch-panel" aria-label="Touch/ADM/PHR API">
      <div className="admin-touch-panel__header">
        <h2 className="administration-card__title">Touch / ADM / PHR API（接続確認）</h2>
        <span className="admin-touch-panel__badge">Touch/ADM/PHR</span>
      </div>
      <p className="admin-quiet">
        system_admin 専用の疎通確認。主要 endpoint を 200/4xx で確認し、監査ログと UI メトリクスを記録します。
      </p>

      {!isSystemAdmin ? (
        <div className="status-message is-error" role="status" aria-live={resolveAriaLive('error')}>
          権限がないため Touch/ADM/PHR の疎通確認は利用できません。system_admin でログインしてください。
        </div>
      ) : null}

      <div className="admin-touch-panel__filters">
        <div className="admin-form__field">
          <label htmlFor="touch-facility-id">facilityId</label>
          <input
            id="touch-facility-id"
            type="text"
            value={context.facilityId ?? ''}
            onChange={(event) => setContext((prev) => ({ ...prev, facilityId: event.target.value }))}
            disabled={!isSystemAdmin}
            aria-readonly={!isSystemAdmin}
          />
        </div>
        <div className="admin-form__field">
          <label htmlFor="touch-user-id">userId</label>
          <input
            id="touch-user-id"
            type="text"
            value={context.userId ?? ''}
            onChange={(event) => setContext((prev) => ({ ...prev, userId: event.target.value }))}
            disabled={!isSystemAdmin}
            aria-readonly={!isSystemAdmin}
          />
        </div>
        <div className="admin-form__field">
          <label htmlFor="touch-patient-id">patientId</label>
          <input
            id="touch-patient-id"
            type="text"
            value={context.patientId ?? ''}
            onChange={(event) => setContext((prev) => ({ ...prev, patientId: event.target.value }))}
            disabled={!isSystemAdmin}
            aria-readonly={!isSystemAdmin}
          />
        </div>
        <div className="admin-form__field">
          <label htmlFor="touch-patient-pk">patientPk</label>
          <input
            id="touch-patient-pk"
            type="text"
            value={context.patientPk ?? ''}
            onChange={(event) => setContext((prev) => ({ ...prev, patientPk: event.target.value }))}
            disabled={!isSystemAdmin}
            aria-readonly={!isSystemAdmin}
          />
        </div>
        <div className="admin-form__field">
          <label htmlFor="touch-access-key">accessKey</label>
          <input
            id="touch-access-key"
            type="text"
            value={context.accessKey ?? ''}
            onChange={(event) => setContext((prev) => ({ ...prev, accessKey: event.target.value }))}
            disabled={!isSystemAdmin}
            aria-readonly={!isSystemAdmin}
          />
        </div>
      </div>

      {grouped.map((group) => (
        <div key={group.group} className="admin-touch-panel__group">
          <div className="admin-touch-panel__group-header">
            <h3 className="admin-touch-panel__group-title">{group.label}</h3>
            <span className="admin-touch-panel__group-count">{group.endpoints.length} endpoints</span>
          </div>
          <div className="admin-touch-panel__list" role="list">
            {group.endpoints.map((endpoint) => {
              const status = results[endpoint.id];
              const tone = resolveStatusTone(status?.status);
              const statusClass = tone === 'success' ? 'is-success' : tone === 'error' ? 'is-error' : undefined;
              const summaryClass = statusClass ? `admin-touch-panel__summary ${statusClass}` : 'admin-touch-panel__summary';
              const resolvedPath = endpoint.buildPath(context);
              const resolvedQuery = endpoint.buildQuery?.(context);
              const queryLabel = resolvedQuery ? `${resolvedPath}?${resolvedQuery}` : resolvedPath;
              return (
                <div key={endpoint.id} className="admin-touch-panel__row" role="listitem">
                  <div className="admin-touch-panel__meta">
                    <div className="admin-touch-panel__title">
                      <strong>{queryLabel}</strong>
                      <span className="admin-touch-panel__method">{endpoint.method}</span>
                      {endpoint.stub ? (
                        <span className="admin-touch-panel__stub">stub</span>
                      ) : null}
                    </div>
                    <p className="admin-touch-panel__description">{endpoint.description}</p>
                    <p className={summaryClass}>{buildResultSummary(status)}</p>
                    {status?.updatedAt ? (
                      <p className="admin-touch-panel__timestamp">{new Date(status.updatedAt).toLocaleString()}</p>
                    ) : null}
                    {status?.runId ? <p className="admin-touch-panel__timestamp">runId: {status.runId}</p> : null}
                    {status?.traceId ? <p className="admin-touch-panel__timestamp">traceId: {status.traceId}</p> : null}
                    {status?.error ? <p className="admin-touch-panel__error">error: {status.error}</p> : null}
                    {status?.stubExpected && status.stubHint ? (
                      <p className="admin-touch-panel__timestamp">stub hint: {status.stubHint}</p>
                    ) : null}
                  </div>
                  <div className="admin-touch-panel__actions">
                    <button
                      type="button"
                      className="admin-button admin-button--secondary"
                      onClick={() => handleRequest(endpoint)}
                      disabled={!isSystemAdmin || loadingId === endpoint.id}
                      aria-disabled={!isSystemAdmin || loadingId === endpoint.id}
                      data-guarded={!isSystemAdmin}
                      aria-busy={loadingId === endpoint.id}
                    >
                      {loadingId === endpoint.id ? '送信中…' : '疎通確認'}
                    </button>
                    <div className={`status-message ${statusClass ?? ''}`} role="status" aria-live={resolveAriaLive(tone)}>
                      {resolveStatusLabel(status?.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
