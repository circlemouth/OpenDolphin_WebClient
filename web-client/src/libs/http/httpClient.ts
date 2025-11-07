import axios, { AxiosHeaders } from 'axios';

import { getCsrfToken, refreshCsrfToken, shouldAttachCsrfHeader } from '@/libs/security';
import type { AuthHeaders } from '@/libs/auth/auth-headers';

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
    };
  }
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const timeout = Number.parseInt(import.meta.env.VITE_HTTP_TIMEOUT_MS ?? '10000', 10);
const maxRetries = Number.parseInt(import.meta.env.VITE_HTTP_MAX_RETRIES ?? '1', 10);
const auditExclusionPattern = /\/audit\/logs$/;

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

  if (shouldAttachCsrfHeader(config.method)) {
    const token = getCsrfToken();
    if (token) {
      mergedHeaders.set({ 'X-CSRF-Token': token });
    }
  }

  config.headers = mergedHeaders;

  if (import.meta.env.DEV) {
    console.debug(`[HTTP] ${config.method?.toUpperCase() ?? 'GET'} ${config.url}`, config);
  }

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
      return Promise.reject(error);
    }

    config.metadata.retryCount = retryCount + 1;

    const backoff = Math.min(1000 * 2 ** retryCount, 4000);
    await new Promise((resolve) => setTimeout(resolve, backoff));

    return httpClient(config);
  },
);
