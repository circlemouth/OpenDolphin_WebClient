import { useEffect, useMemo, useState } from 'react';

import { logAuditEvent, logUiState } from '../../libs/audit/auditLogger';
import { getObservabilityMeta, resolveAriaLive } from '../../libs/observability/observability';
import {
  LEGACY_REST_ENDPOINTS,
  requestLegacyRest,
  type LegacyRestContentType,
  type LegacyRestMethod,
  type LegacyRestResponse,
  buildLegacyRestUrl,
} from './legacyRestApi';
import './legacyRestConsole.css';

const METHOD_OPTIONS: LegacyRestMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const CONTENT_TYPE_OPTIONS: Array<{ value: LegacyRestContentType; label: string }> = [
  { value: 'json', label: 'application/json' },
  { value: 'form', label: 'application/x-www-form-urlencoded' },
  { value: 'text', label: 'text/plain' },
];

const resolveStatusTone = (status?: number) => {
  if (status === undefined) return 'info';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 500) return 'error';
  return 'warning';
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

const buildResponseText = (response: LegacyRestResponse | null) => {
  if (!response) return '';
  if (response.mode === 'binary') {
    return '[binary response]';
  }
  if (response.json !== undefined) {
    try {
      return JSON.stringify(response.json, null, 2);
    } catch {
      return response.raw || '';
    }
  }
  return response.raw || '';
};

export function LegacyRestConsolePage() {
  const enableDemo = import.meta.env.VITE_ENABLE_DEMO_ENDPOINTS === '1';
  const endpoints = useMemo(
    () => LEGACY_REST_ENDPOINTS.filter((endpoint) => enableDemo || !endpoint.path.startsWith('/demo')),
    [enableDemo],
  );
  const initialEndpoint = endpoints[0];
  const [selectedId, setSelectedId] = useState<string>(initialEndpoint?.id ?? '');
  const selected = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === selectedId) ?? initialEndpoint,
    [endpoints, initialEndpoint, selectedId],
  );
  const [method, setMethod] = useState<LegacyRestMethod>(selected?.method ?? 'GET');
  const [path, setPath] = useState<string>(selected?.path ?? '');
  const [query, setQuery] = useState<string>(selected?.defaultQuery ?? '');
  const [contentType, setContentType] = useState<LegacyRestContentType>(selected?.defaultContentType ?? 'json');
  const [body, setBody] = useState<string>(selected?.defaultBody ?? '');
  const [response, setResponse] = useState<LegacyRestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setMethod(selected.method);
    setPath(selected.path);
    setQuery(selected.defaultQuery ?? '');
    setBody(selected.defaultBody ?? '');
    setContentType(selected.defaultContentType ?? 'json');
  }, [selected]);

  const previewUrl = useMemo(() => buildLegacyRestUrl(path, query), [path, query]);
  const responseText = useMemo(() => buildResponseText(response), [response]);
  const statusTone = resolveStatusTone(response?.status);
  const statusClass =
    statusTone === 'success' ? 'is-success' : statusTone === 'error' ? 'is-error' : undefined;

  const handleSubmit = async () => {
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      setError('エンドポイントが未指定です。');
      return;
    }
    setLoading(true);
    setError(null);

    const metaBefore = getObservabilityMeta();
    logUiState({
      action: 'send',
      screen: 'debug/legacy-rest',
      controlId: 'legacy-rest-send',
      details: {
        legacy: true,
        method,
        path: trimmedPath,
        query,
        hasBody: Boolean(body.trim()),
        contentType,
      },
    });

    try {
      const result = await requestLegacyRest({
        method,
        path: trimmedPath,
        query,
        body,
        contentType,
      });
      setResponse(result);
      const outcome = result.ok ? 'success' : 'error';
      logAuditEvent({
        runId: result.runId ?? metaBefore.runId,
        traceId: result.traceId ?? metaBefore.traceId,
        source: 'legacy-rest',
        note: 'legacy-rest-response',
        payload: {
          action: 'legacy-rest-request',
          screen: 'debug/legacy-rest',
          outcome,
          status: result.status,
          statusText: result.statusText,
          method,
          path: trimmedPath,
          endpoint: trimmedPath,
          query,
          contentType,
          legacy: true,
          details: {
            legacy: true,
            method,
            path: trimmedPath,
            endpoint: trimmedPath,
            query,
            status: result.status,
            ok: result.ok,
            mode: result.mode,
            contentType: result.contentType,
            binarySize: result.binarySize,
          },
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      logAuditEvent({
        runId: metaBefore.runId,
        traceId: metaBefore.traceId,
        source: 'legacy-rest',
        note: 'legacy-rest-error',
        payload: {
          action: 'legacy-rest-request',
          screen: 'debug/legacy-rest',
          outcome: 'error',
          method,
          path: trimmedPath,
          endpoint: trimmedPath,
          query,
          contentType,
          legacy: true,
          error: message,
          details: {
            legacy: true,
            method,
            path: trimmedPath,
            endpoint: trimmedPath,
            query,
            error: message,
          },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResponse(null);
    setError(null);
    if (selected) {
      setMethod(selected.method);
      setPath(selected.path);
      setQuery(selected.defaultQuery ?? '');
      setBody(selected.defaultBody ?? '');
      setContentType(selected.defaultContentType ?? 'json');
    }
  };

  return (
    <main className="legacy-rest-console">
      <header className="legacy-rest-console__header">
        <div>
          <p className="legacy-rest-console__kicker">Legacy REST Compatibility</p>
          <h1>Legacy REST 互換 API コンソール</h1>
          <p className="legacy-rest-console__sub">
            Web クライアント未接続の Legacy REST を疎通確認する QA 用導線です。2xx/4xx 判定と監査タグ (legacy) を残します。
          </p>
          <p className="legacy-rest-console__note">RUN_ID: {getObservabilityMeta().runId ?? '未設定'} / trace: {getObservabilityMeta().traceId ?? '未設定'}</p>
        </div>
        <button type="button" onClick={handleSubmit} disabled={loading}>
          {loading ? '送信中…' : '送信'}
        </button>
      </header>

      <div className="legacy-rest-console__grid">
        <section className="legacy-rest-console__panel" aria-label="Legacy REST Request Builder">
          <label>
            エンドポイント
            <select value={selected?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)}>
              {LEGACY_REST_ENDPOINTS.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.label}
                </option>
              ))}
            </select>
          </label>
          <p className="legacy-rest-console__hint">{selected?.description}</p>
          <label>
            Method
            <select value={method} onChange={(event) => setMethod(event.target.value as LegacyRestMethod)}>
              {METHOD_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Path
            <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="/pvt" />
          </label>
          <label>
            Query
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="patientId=00001" />
          </label>
          <label>
            Content-Type
            <select value={contentType} onChange={(event) => setContentType(event.target.value as LegacyRestContentType)}>
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="legacy-rest-console__textarea">
            Body
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={`{\n  "patientId": "00001"\n}`}
            />
          </label>
          <div className="legacy-rest-console__actions">
            <button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? '送信中…' : '送信'}
            </button>
            <button type="button" className="ghost" onClick={handleReset}>
              リセット
            </button>
          </div>
          <p className="legacy-rest-console__hint">プレビュー URL: {previewUrl || '—'}</p>
          <p className="legacy-rest-console__hint">/chart-events はストリームのため、長時間保持する場合は別ツール推奨。</p>
        </section>

        <section className="legacy-rest-console__panel" aria-label="Legacy REST Response">
          <div className="legacy-rest-console__panel-header">
            <h2>Response</h2>
            <span className="legacy-rest-console__meta">
              {response?.runId ? `runId: ${response.runId}` : 'runId: -'} / {response?.traceId ? `trace: ${response.traceId}` : 'trace: -'}
            </span>
          </div>
          <div className={`status-message ${statusClass ?? ''}`} role="status" aria-live={resolveAriaLive(statusTone)}>
            {resolveStatusLabel(response?.status)}
          </div>
          {error ? (
            <div className="status-message is-error" role="status" aria-live={resolveAriaLive('error')}>
              送信エラー: {error}
            </div>
          ) : null}
          {response ? (
            <>
              <div className="legacy-rest-console__status">
                <div>ok: {String(response.ok)}</div>
                <div>content-type: {response.contentType ?? 'unknown'}</div>
                <div>mode: {response.mode}</div>
                {response.mode === 'binary' ? (
                  <div>binary-size: {response.binarySize ? `${response.binarySize} bytes` : 'unknown'}</div>
                ) : null}
                <div>statusText: {response.statusText ?? '—'}</div>
              </div>
              <details className="legacy-rest-console__headers">
                <summary>レスポンスヘッダ</summary>
                <ul>
                  {Object.entries(response.headers).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value}
                    </li>
                  ))}
                </ul>
              </details>
              <pre className="legacy-rest-console__response">{responseText || '—'}</pre>
            </>
          ) : (
            <p className="legacy-rest-console__empty">まだレスポンスがありません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
