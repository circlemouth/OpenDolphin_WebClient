import { describe, expect, it } from 'vitest';

import { App } from '@/app/App';
import { render, screen } from '@/test/test-utils';

describe('App', () => {
  it('アプリシェルがレンダリングされる', async () => {
    render(<App />, { withRouter: false });

    expect(await screen.findByText('OpenDolphin Web Client')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ダッシュボード' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
