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
    expect(banner.textContent).toContain('配信:未反映（D=表示/S=送信/M=master）');
    expect(banner.textContent).toContain('D:未反映');
    expect(banner.textContent).toContain('S:反映');
    expect(banner.textContent).toContain('M:不明');
  });

  it('配信キュー操作は結果を含めて通知する', () => {
    render(
      <AdminBroadcastBanner
        surface="reception"
        broadcast={{
          runId: 'RUN-QUEUE',
          updatedAt: '2025-12-28T00:10:00.000Z',
          action: 'queue',
          queueOperation: 'retry',
          queueResult: 'success',
          queuePatientId: 'P-001',
          queueCount: 2,
          queueWarningCount: 1,
          queueMode: 'mock',
          environment: 'dev',
        }}
      />,
    );

    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('tone-banner--info');
    expect(banner.textContent).toContain('配信キュー操作が通知されました');
    expect(banner.textContent).toContain('操作: 再送');
    expect(banner.textContent).toContain('結果: 完了');
    expect(banner.textContent).toContain('patientId: P-001');
    expect(banner.textContent).toContain('queue: 2件');
    expect(banner.textContent).toContain('warning: 1件');
  });
});
