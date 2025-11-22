import axios, { AxiosHeaders } from 'axios';
import { context, SpanStatusCode, trace, type Span } from '@opentelemetry/api';

import { getCsrfToken, refreshCsrfToken, shouldAttachCsrfHeader } from '@/libs/security';
import type { AuthHeaders } from '@/libs/auth/auth-headers';
import { generateRequestId } from './request-id';
import { pushTraceNotice } from '@/observability/traceNotifications';
import { updateTraceContext } from '@/observability/traceContext';

type AuthHeaderProvider = () => AuthHeaders | null | Promise<AuthHeaders | null>;

export type HttpAuditPhase = 'request' | 'response' | 'error';

export interface HttpAuditEvent {
  phase: HttpAuditPhase;
  method: string;
  url?: string;
  status?: number;
  durationMs?: number;
  retryCount: number;
  error?: unknown;
}

type HttpAuditLogger = (event: HttpAuditEvent) => void;

let authHeaderProvider: AuthHeaderProvider | null = null;
let auditLogger: HttpAuditLogger | null = null;

export const setAuthHeaderProvider = (provider: AuthHeaderProvider | null) => {
  authHeaderProvider = provider;
};

export const setHttpAuditLogger = (logger: HttpAuditLogger | null) => {
  auditLogger = logger;
};

declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime?: number;
      retryCount?: number;
      rootSpan?: Span;
      attemptSpan?: Span;
      traceparent?: string;
      requestId?: string;
    };
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const timeout = Number.parseInt(import.meta.env.VITE_HTTP_TIMEOUT_MS ?? '10000', 10);
const maxRetries = Number.parseInt(import.meta.env.VITE_HTTP_MAX_RETRIES ?? '1', 10);
const auditExclusionPattern = /\/audit\/logs$/;
const shouldLogBaseUrl = (import.meta.env.VITE_HTTP_LOG_BASEURL ?? 'true').toLowerCase() !== 'false';

const tracer = trace.getTracer('open-dolphin-web-client');

const endSpanSafely = (span?: Span | null, status?: SpanStatusCode, message?: string) => {
  if (!span) return;
  if (status) {
    span.setStatus({ code: status, message });
  }
  span.end();
};

export const httpClient = axios.create({
  baseURL,
  timeout,
  withCredentials: true,
  xsrfCookieName: 'ODW_XSRF',
  xsrfHeaderName: 'X-CSRF-Token',
});

httpClient.interceptors.request.use(async (config) => {
  const existingHeaders = config.headers;
  config.metadata = {
    ...(config.metadata ?? {}),
    startTime: Date.now(),
    retryCount: config.metadata?.retryCount ?? 0,
  };

  const mergedHeaders = AxiosHeaders.from({
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    'X-Requested-With': 'XMLHttpRequest',
  });

  if (authHeaderProvider) {
    const headers = await authHeaderProvider();
    if (headers) {
      mergedHeaders.set(headers);
    }
  }

  if (existingHeaders) {
    mergedHeaders.set(existingHeaders);
  }

  const parentSpan = config.metadata.rootSpan ?? tracer.startSpan(`HTTP ${config.method?.toUpperCase() ?? 'GET'}`, {
    attributes: {
      'http.method': config.method?.toUpperCase(),
      'http.url': config.url ?? baseURL,
    },
  });
  config.metadata.rootSpan = parentSpan;

  const requestContext = trace.setSpan(context.active(), parentSpan);
  const attemptSpan = tracer.startSpan('http.request.attempt', {
    attributes: {
      'http.method': config.method?.toUpperCase(),
      'http.url': config.url ?? baseURL,
      'http.retry_count': config.metadata.retryCount ?? 0,
    },
  }, requestContext);
  config.metadata.attemptSpan = attemptSpan;

  const spanContext = attemptSpan.spanContext();
  const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-01`;
  config.metadata.traceparent = traceparent;

  const requestId = config.metadata.requestId ?? generateRequestId();
  config.metadata.requestId = requestId;

  mergedHeaders.set({
    traceparent,
    'x-request-id': requestId,
  });

  if (shouldAttachCsrfHeader(config.method)) {
    const token = getCsrfToken();
    if (token) {
      mergedHeaders.set({ 'X-CSRF-Token': token });
    }
  }

  config.headers = mergedHeaders;

  if (import.meta.env.DEV) {
    const debugConfig = shouldLogBaseUrl ? config : { ...config, baseURL: '[redacted]' };
    console.debug(`[HTTP] ${config.method?.toUpperCase() ?? 'GET'} ${config.url}`, debugConfig);
  }

  updateTraceContext({
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    requestId,
    source: 'http-request',
  });

  if (!auditExclusionPattern.test(config.url ?? '')) {
    auditLogger?.({
      phase: 'request',
      method: config.method?.toUpperCase() ?? 'GET',
      url: config.url,
      retryCount: config.metadata?.retryCount ?? 0,
    });
  }

  return config;
});

const shouldRetry = (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.config) {
    return false;
  }

  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    return false;
  }

  return true;
};

httpClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV && response.config.metadata?.startTime) {
      const elapsed = Date.now() - response.config.metadata.startTime;
      console.debug(`[HTTP] ${response.config.url} completed in ${elapsed}ms`);
      if (!auditExclusionPattern.test(response.config.url ?? '')) {
        auditLogger?.({
          phase: 'response',
          method: response.config.method?.toUpperCase() ?? 'GET',
          url: response.config.url,
          status: response.status,
          durationMs: elapsed,
          retryCount: response.config.metadata?.retryCount ?? 0,
        });
      }
    } else {
      if (!auditExclusionPattern.test(response.config.url ?? '')) {
        auditLogger?.({
          phase: 'response',
          method: response.config.method?.toUpperCase() ?? 'GET',
          url: response.config.url,
          status: response.status,
          retryCount: response.config.metadata?.retryCount ?? 0,
        });
      }
    }

    if (response.config.metadata?.attemptSpan) {
      response.config.metadata.attemptSpan.setAttribute('http.status_code', response.status);
      endSpanSafely(response.config.metadata.attemptSpan, SpanStatusCode.OK);
    }
    if (response.config.metadata?.rootSpan) {
      response.config.metadata.rootSpan.setAttribute('http.status_code', response.status);
      response.config.metadata.rootSpan.setAttribute('http.retry_count', response.config.metadata.retryCount ?? 0);
      endSpanSafely(response.config.metadata.rootSpan, SpanStatusCode.OK);
    }

    return response;
  },
  async (error) => {
    if (!shouldRetry(error)) {
      if (axios.isAxiosError(error) && error.config) {
        const elapsed = error.config.metadata?.startTime
          ? Date.now() - error.config.metadata.startTime
          : undefined;
        if (error.response?.status === 419 || error.response?.headers?.['x-csrf-refresh'] === 'required') {
          refreshCsrfToken();
        }
        if (error.config.metadata?.attemptSpan) {
          error.config.metadata.attemptSpan.setAttribute('http.status_code', error.response?.status ?? 0);
          error.config.metadata.attemptSpan.recordException(error);
          endSpanSafely(error.config.metadata.attemptSpan, SpanStatusCode.ERROR, error.message);
        }
        if (error.config.metadata?.rootSpan) {
          error.config.metadata.rootSpan.setAttribute('http.status_code', error.response?.status ?? 0);
          error.config.metadata.rootSpan.recordException(error);
          error.config.metadata.rootSpan.setAttribute('http.retry_count', error.config.metadata.retryCount ?? 0);
          endSpanSafely(error.config.metadata.rootSpan, SpanStatusCode.ERROR, error.message);
        }
        if (!auditExclusionPattern.test(error.config.url ?? '')) {
          auditLogger?.({
            phase: 'error',
            method: error.config.method?.toUpperCase() ?? 'GET',
            url: error.config.url,
            status: error.response?.status,
            durationMs: elapsed,
            retryCount: error.config.metadata?.retryCount ?? 0,
            error,
          });
        }

        const traceId = error.config.metadata?.attemptSpan?.spanContext().traceId
          ?? error.config.metadata?.rootSpan?.spanContext().traceId;
        updateTraceContext({
          traceId,
          requestId: error.config.metadata?.requestId,
          source: 'http-request',
        });
        pushTraceNotice({
          severity: 'error',
          message: error.response?.data?.message ?? 'サーバーでエラーが発生しました。時間をおいて再試行してください。',
          statusCode: error.response?.status,
          url: error.config.url,
          traceId,
          requestId: error.config.metadata?.requestId,
        });
      }
      return Promise.reject(error);
    }

    const config = error.config;
    config.metadata = config.metadata ?? {};
    const retryCount = config.metadata.retryCount ?? 0;

    const elapsed = config.metadata.startTime ? Date.now() - config.metadata.startTime : undefined;
    if (error.response?.status === 419 || error.response?.headers?.['x-csrf-refresh'] === 'required') {
      refreshCsrfToken();
    }

    if (config.metadata.attemptSpan) {
      config.metadata.attemptSpan.setAttribute('http.status_code', error.response?.status ?? 0);
      config.metadata.attemptSpan.recordException(error);
      endSpanSafely(config.metadata.attemptSpan, SpanStatusCode.ERROR, error.message);
    }

    if (!auditExclusionPattern.test(config.url ?? '')) {
      auditLogger?.({
        phase: 'error',
        method: config.method?.toUpperCase() ?? 'GET',
        url: config.url,
        status: error.response?.status,
        durationMs: elapsed,
        retryCount,
        error,
      });
    }

    if (retryCount >= maxRetries) {
      if (config.metadata.rootSpan) {
        config.metadata.rootSpan.recordException(error);
        config.metadata.rootSpan.setAttribute('http.retry_count', retryCount);
        config.metadata.rootSpan.setAttribute('http.status_code', error.response?.status ?? 0);
        endSpanSafely(config.metadata.rootSpan, SpanStatusCode.ERROR, error.message);
      }
      const traceId = config.metadata.attemptSpan?.spanContext().traceId
        ?? config.metadata.rootSpan?.spanContext().traceId;
      updateTraceContext({
        traceId,
        requestId: config.metadata.requestId,
        source: 'http-request',
      });
      pushTraceNotice({
        severity: 'error',
        message: error.response?.data?.message ?? '再試行後も応答が得られませんでした。',
        statusCode: error.response?.status,
        url: config.url,
        traceId,
        requestId: config.metadata.requestId,
      });
      return Promise.reject(error);
    }

    config.metadata.retryCount = retryCount + 1;
    config.metadata.startTime = Date.now();
    config.metadata.traceparent = undefined;

    const backoff = Math.min(1000 * 2 ** retryCount, 4000);
    await new Promise((resolve) => setTimeout(resolve, backoff));

    return httpClient(config);
  },
);
