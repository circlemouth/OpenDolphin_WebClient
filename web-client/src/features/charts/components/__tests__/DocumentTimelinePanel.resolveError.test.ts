import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { resolveErrorMessage } from '@/features/charts/components/DocumentTimelinePanel';

const createAxiosError = (options: { status?: number; code?: string }) => {
  const config = { url: '/test', method: 'get' } as InternalAxiosRequestConfig;
  const { status, code } = options;
  const response =
    typeof status === 'number'
      ? ({
          status,
          statusText: '',
          headers: {},
          config,
          data: {},
        } as AxiosResponse)
      : undefined;

  return new AxiosError('error', code, config, undefined, response);
};

describe('resolveErrorMessage', () => {
  it('returns not found guidance for 404', () => {
    const error = createAxiosError({ status: 404 });
    expect(resolveErrorMessage(error)).toContain('見つかりません');
  });

  it('returns server guidance for 500 errors', () => {
    const error = createAxiosError({ status: 500 });
    expect(resolveErrorMessage(error)).toContain('サーバー側でエラーが発生しました');
  });

  it('returns timeout guidance for aborted requests', () => {
    const error = createAxiosError({ status: 408, code: 'ECONNABORTED' });
    expect(resolveErrorMessage(error)).toContain('タイムアウトしました');
  });

  it('returns network guidance when no response is available', () => {
    const error = createAxiosError({ code: 'ERR_NETWORK' });
    expect(resolveErrorMessage(error)).toContain('サーバーに接続できません');
  });

  it('falls back to generic guidance on unknown errors', () => {
    expect(resolveErrorMessage(new Error('unknown'))).toContain('イベントの取得に失敗しました');
  });
});
