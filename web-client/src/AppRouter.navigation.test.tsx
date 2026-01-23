import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppRouter } from './AppRouter';

const AUTH_KEY = 'opendolphin:web-client:auth';

const setSession = (role: string) => {
  sessionStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      facilityId: '0001',
      userId: 'user01',
      role,
      runId: 'RUN-NAV',
      displayName: 'user01',
    }),
  );
};

const prepareSession = (role: string) => {
  localStorage.clear();
  sessionStorage.clear();
  setSession(role);
};

describe('AppRouter navigation guard', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/f/0001/reception');
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('non system_admin は管理リンクが無効化されトーストが出る', async () => {
    prepareSession('doctor');
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>,
    );

    const adminLink = await screen.findByRole('link', { name: '管理' });
    expect(adminLink).toHaveAttribute('aria-disabled', 'true');
    expect(adminLink.className).toContain('is-disabled');

    await user.click(adminLink);

    expect(window.location.pathname).toBe('/f/0001/reception');
    expect(await screen.findByText('アクセス権限がありません')).toBeInTheDocument();
  });

  it('system_admin は管理リンクが有効で遷移できる', async () => {
    prepareSession('system_admin');
    const user = userEvent.setup();
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>,
    );

    const adminLink = await screen.findByRole('link', { name: '管理' });
    expect(adminLink).toHaveAttribute('aria-disabled', 'false');
    expect(adminLink.className).not.toContain('is-disabled');

    await user.click(adminLink);

    expect(window.location.pathname).toBe('/f/0001/administration');
  });

  it('system_admin 以外の直アクセスは Administration を遮断する', async () => {
    prepareSession('doctor');
    const queryClient = new QueryClient();
    window.history.pushState({}, '', '/f/0001/administration');

    render(
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Administration は system_admin 専用のためアクセスできません。')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/f/0001/administration');
  });
});
