import { describe, expect, it } from 'vitest';

import { buildApiFailureBanner } from './apiError';

describe('buildApiFailureBanner', () => {
  it('maps 5xx to error tone with cooldown and retry guidance', () => {
    const banner = buildApiFailureBanner('患者情報', { httpStatus: 502 }, '取得');
    expect(banner.tone).toBe('error');
    expect(banner.nextAction).toBe('時間をおいて再取得');
    expect(banner.retryLabel).toBe('再取得');
    expect(banner.cooldownMs).toBe(5000);
  });

  it('maps 401 to relogin guidance', () => {
    const banner = buildApiFailureBanner('受付一覧', { httpStatus: 401 }, '取得');
    expect(banner.tone).toBe('warning');
    expect(banner.nextAction).toBe('再ログイン');
    expect(banner.forceNextAction).toBe(true);
    expect(banner.reloginReason).toBe('unauthorized');
  });

  it('maps 403 to relogin guidance', () => {
    const banner = buildApiFailureBanner('受付一覧', { httpStatus: 403 }, '取得');
    expect(banner.tone).toBe('warning');
    expect(banner.nextAction).toBe('再ログイン');
    expect(banner.forceNextAction).toBe(true);
    expect(banner.reloginReason).toBe('forbidden');
  });

  it('maps 404 to info tone and empty guidance', () => {
    const banner = buildApiFailureBanner('患者情報', { httpStatus: 404 }, '取得');
    expect(banner.tone).toBe('info');
    expect(banner.message).toContain('見つかりませんでした');
    expect(banner.nextAction).toBe('条件を変えて再取得');
  });

  it('maps network failure to retry guidance', () => {
    const banner = buildApiFailureBanner('請求バンドル', { error: new TypeError('Failed to fetch') }, '取得');
    expect(banner.tone).toBe('error');
    expect(banner.nextAction).toBe('通信回復後に再取得');
    expect(banner.retryLabel).toBe('再取得');
  });
});
