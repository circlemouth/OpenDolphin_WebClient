import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { AdminBroadcastBanner } from '../AdminBroadcastBanner';

afterEach(cleanup);

describe('AdminBroadcastBanner', () => {
  it('配信未反映は短いラベルで表示し warning 扱いになる', () => {
    render(
      <AdminBroadcastBanner
        surface="charts"
        broadcast={{
          runId: 'RUN-DELIVERY',
          updatedAt: '2025-12-28T00:00:00.000Z',
          environment: 'stage',
          deliveryStatus: {
            chartsDisplayEnabled: 'pending',
            chartsSendEnabled: 'applied',
            chartsMasterSource: 'unknown',
          },
        }}
      />,
    );

    const banner = screen.getByRole('alert');
    expect(banner).toHaveClass('tone-banner--warning');
    expect(banner.textContent).toContain('配信:未反映');
    expect(banner.textContent).toContain('D:未反映');
    expect(banner.textContent).toContain('S:反映');
    expect(banner.textContent).toContain('M:不明');
  });
});
