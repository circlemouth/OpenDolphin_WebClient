import axios from 'axios';

type AuthHeaderProvider = () => Record<string, string> | null | Promise<Record<string, string> | null>;

let authHeaderProvider: AuthHeaderProvider | null = null;

export const setAuthHeaderProvider = (provider: AuthHeaderProvider | null) => {
  authHeaderProvider = provider;
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

export const httpClient = axios.create({
  baseURL,
  timeout,
  withCredentials: true,
});

httpClient.interceptors.request.use(async (config) => {
  config.metadata = {
    ...(config.metadata ?? {}),
    startTime: Date.now(),
    retryCount: config.metadata?.retryCount ?? 0,
  };

  if (authHeaderProvider) {
    const headers = await authHeaderProvider();
    if (headers) {
      config.headers = {
        ...headers,
        ...config.headers,
      };
    }
  }

  if (import.meta.env.DEV) {
    console.debug(`[HTTP] ${config.method?.toUpperCase() ?? 'GET'} ${config.url}`, config);
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
    }
    return response;
  },
  async (error) => {
    if (!shouldRetry(error)) {
      return Promise.reject(error);
    }

    const config = error.config;
    config.metadata = config.metadata ?? {};
    const retryCount = config.metadata.retryCount ?? 0;

    if (retryCount >= maxRetries) {
      return Promise.reject(error);
    }

    config.metadata.retryCount = retryCount + 1;

    const backoff = Math.min(1000 * 2 ** retryCount, 4000);
    await new Promise((resolve) => setTimeout(resolve, backoff));

    return httpClient(config);
  },
);
