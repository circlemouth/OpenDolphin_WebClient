import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { DocumentTimeline } from '../DocumentTimeline';
import { AppToastProvider } from '../../../libs/ui/appToast';

vi.mock('@emotion/react', () => ({
  Global: () => null,
  css: () => '',
}));

vi.mock('../authService', () => ({
  useAuthService: () => ({
    flags: {
      runId: 'RUN-DOC',
      missingMaster: true,
      cacheHit: false,
      dataSourceTransition: 'server',
      fallbackUsed: false,
    },
  }),
}));

vi.mock('../../../libs/ui/appToast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../libs/ui/appToast')>();
  return {
    ...actual,
    useAppToast: () => ({ enqueue: vi.fn(), dismiss: vi.fn() }),
  };
});

describe('DocumentTimeline recovery order', () => {
  it('renders alert -> banner -> details in order', () => {
    const { container } = render(
      <AppToastProvider value={{ enqueue: vi.fn(), dismiss: vi.fn() }}>
        <DocumentTimeline claimData={{ missingMaster: true } as any} />
      </AppToastProvider>,
    );

    const alert = container.querySelector('.document-timeline__alert');
    const banner = container.querySelector('.tone-banner');
    const details = container.querySelector('.document-timeline__controls');

    expect(alert).toBeTruthy();
    expect(banner).toBeTruthy();
    expect(details).toBeTruthy();

    expect(alert?.compareDocumentPosition(banner!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(banner?.compareDocumentPosition(details!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
