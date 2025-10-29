import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from '@/app/App';
import { render, screen } from '@/test/test-utils';
import { __internal } from '@/libs/auth/auth-storage';

describe('App', () => {
  beforeEach(() => {
    window.sessionStorage?.clear();
    window.localStorage?.clear();
  });

  afterEach(() => {
    window.sessionStorage?.clear();
    window.localStorage?.clear();
  });

  it('未認証時はログイン画面が表示される', async () => {
    render(<App />, { withRouter: false });

    expect(await screen.findByRole('heading', { name: 'OpenDolphin Web ログイン' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('認証済みセッションが存在する場合はアプリシェルを表示する', async () => {
    window.sessionStorage?.setItem(
      __internal.STORAGE_KEY,
      JSON.stringify({
        credentials: {
          facilityId: '0001',
          userId: 'doctor01',
          passwordMd5: 'hash',
          clientUuid: 'uuid',
        },
        userProfile: {
          facilityId: '0001',
          userId: 'doctor01',
          displayName: 'テスト医師',
        },
        persistedAt: Date.now(),
      }),
    );

    render(<App />, { withRouter: false });

    expect(await screen.findByText('OpenDolphin Web Client')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '主要ナビゲーション' })).toBeInTheDocument();
  });
});
