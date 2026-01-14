import { useMemo, useState } from 'react';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { getObservabilityMeta, resolveAriaLive } from '../../libs/observability/observability';
import {
  LEGACY_REST_ENDPOINTS,
  requestLegacyRest,
  type LegacyRestEndpoint,
  type LegacyRestResponseMode,
} from '../debug/legacyRestApi';

export type LegacyRestStatus = {
  endpointId: string;
  endpoint: string;
  status?: number;
  ok?: boolean;
  mode?: LegacyRestResponseMode;
  contentType?: string;
  binarySize?: number;
  updatedAt?: string;
  runId?: string;
  traceId?: string;
  error?: string;
};

export type LegacyRestPanelProps = {
  runId: string;
  role?: string;
  actorId: string;
  environmentLabel?: string;
  isSystemAdmin: boolean;
  onGuarded?: (detail?: string) => void;
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

const buildResultSummary = (status?: LegacyRestStatus) => {
  if (!status) return '未送信';
  const parts = [resolveStatusLabel(status.status)];
  if (status.mode) parts.push(`mode=${status.mode}`);
  if (status.mode === 'binary') {
    parts.push(`bytes=${status.binarySize ?? 'unknown'}`);
  }
  if (status.contentType) parts.push(`ct=${status.contentType}`);
  return parts.join(' / ');
};

export function LegacyRestPanel(props: LegacyRestPanelProps) {
  const { runId, role, actorId, environmentLabel, isSystemAdmin, onGuarded } = props;
  const [results, setResults] = useState<Record<string, LegacyRestStatus>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const endpoints = useMemo(() => LEGACY_REST_ENDPOINTS, []);

  const handleRequest = async (endpoint: LegacyRestEndpoint) => {
    if (!isSystemAdmin) {
      onGuarded?.(`legacy-rest:${endpoint.path}`);
      return;
    }

    setLoadingId(endpoint.id);
    const beforeMeta = getObservabilityMeta();

    logUiState({
      action: 'send',
      screen: 'administration/legacy-rest',
      controlId: `legacy-rest-${endpoint.id}`,
      runId,
      details: {
        legacy: true,
        endpoint: endpoint.path,
        method: endpoint.method,
      },
    });

    try {
      const response = await requestLegacyRest({
        method: endpoint.method,
        path: endpoint.path,
        query: endpoint.defaultQuery,
        body: endpoint.defaultBody,
        contentType: endpoint.defaultContentType,
      });
      const nextStatus: LegacyRestStatus = {
        endpointId: endpoint.id,
        endpoint: endpoint.path,
        status: response.status,
        ok: response.ok,
        mode: response.mode,
        contentType: response.contentType,
        binarySize: response.binarySize,
        updatedAt: new Date().toISOString(),
        runId: response.runId ?? beforeMeta.runId,
        traceId: response.traceId ?? beforeMeta.traceId,
      };
      setResults((prev) => ({ ...prev, [endpoint.id]: nextStatus }));

      const outcome = response.ok ? 'success' : 'error';
      logAuditEvent({
        runId: nextStatus.runId ?? runId,
        traceId: nextStatus.traceId,
        source: 'legacy-rest',
        note: 'legacy-rest-response',
        payload: {
          action: 'legacy-rest-request',
          screen: 'administration/legacy-rest',
          outcome,
          endpoint: endpoint.path,
          method: endpoint.method,
          status: response.status,
          role,
          environment: environmentLabel,
          legacy: true,
          details: {
            legacy: true,
            endpoint: endpoint.path,
            method: endpoint.method,
            status: response.status,
            ok: response.ok,
            mode: response.mode,
            contentType: response.contentType,
            binarySize: response.binarySize,
            actor: actorId,
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const nextStatus: LegacyRestStatus = {
        endpointId: endpoint.id,
        endpoint: endpoint.path,
        status: undefined,
        ok: false,
        updatedAt: new Date().toISOString(),
        runId: beforeMeta.runId,
        traceId: beforeMeta.traceId,
        error: message,
      };
      setResults((prev) => ({ ...prev, [endpoint.id]: nextStatus }));
      logAuditEvent({
        runId: beforeMeta.runId ?? runId,
        traceId: beforeMeta.traceId,
        source: 'legacy-rest',
        note: 'legacy-rest-error',
        payload: {
          action: 'legacy-rest-request',
          screen: 'administration/legacy-rest',
          outcome: 'error',
          endpoint: endpoint.path,
          method: endpoint.method,
          role,
          environment: environmentLabel,
          legacy: true,
          error: message,
          details: {
            legacy: true,
            endpoint: endpoint.path,
            method: endpoint.method,
            error: message,
            actor: actorId,
          },
        },
      });
    } finally {
      setLoadingId((current) => (current === endpoint.id ? null : current));
    }
  };

  return (
    <section className="administration-card admin-legacy-rest" aria-label="Legacy REST 互換 API">
      <div className="admin-legacy-rest__header">
        <h2 className="administration-card__title">Legacy REST 互換 API（通常導線）</h2>
        <span className="admin-legacy-rest__badge">Legacy REST</span>
      </div>
      <p className="admin-quiet">
        system_admin 専用の疎通確認。2xx/4xx 判定と監査ログ（legacy=true）を記録します。
      </p>

      {!isSystemAdmin ? (
        <div className="status-message is-error" role="status" aria-live={resolveAriaLive('error')}>
          権限がないため Legacy REST の疎通確認は利用できません。system_admin でログインしてください。
        </div>
      ) : null}

      <div className="admin-legacy-rest__list" role="list">
        {endpoints.map((endpoint) => {
          const status = results[endpoint.id];
          const tone = resolveStatusTone(status?.status);
          const statusClass = tone === 'success' ? 'is-success' : tone === 'error' ? 'is-error' : undefined;
          return (
            <div key={endpoint.id} className="admin-legacy-rest__row" role="listitem">
              <div className="admin-legacy-rest__meta">
                <div className="admin-legacy-rest__title">
                  <strong>{endpoint.path}</strong>
                  <span className="admin-legacy-rest__method">{endpoint.method}</span>
                </div>
                <p className="admin-legacy-rest__description">{endpoint.description}</p>
                <p className="admin-legacy-rest__summary">{buildResultSummary(status)}</p>
                {status?.updatedAt ? (
                  <p className="admin-legacy-rest__timestamp">最終更新: {status.updatedAt}</p>
                ) : null}
                {status?.error ? (
                  <p className="admin-legacy-rest__error">エラー: {status.error}</p>
                ) : null}
              </div>
              <div className="admin-legacy-rest__actions">
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => handleRequest(endpoint)}
                  disabled={!isSystemAdmin || loadingId === endpoint.id}
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
    </section>
  );
}
