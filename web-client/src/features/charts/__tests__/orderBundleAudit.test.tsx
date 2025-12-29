import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { clearAuditEventLog, getAuditEventLog } from '../../../libs/audit/auditLogger';
import { OrderBundleEditPanel } from '../OrderBundleEditPanel';

vi.mock('../orderBundleApi', () => ({
  fetchOrderBundles: vi.fn().mockResolvedValue({ ok: true, bundles: [] }),
  mutateOrderBundles: vi.fn(),
}));

const buildQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('OrderBundleEditPanel audit', () => {
  beforeEach(() => {
    clearAuditEventLog();
  });

  afterEach(() => {
    clearAuditEventLog();
  });

  it('必須違反時に blockedReasons と validationMessages を記録する', async () => {
    const user = userEvent.setup();
    const queryClient = buildQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <OrderBundleEditPanel
          patientId="P-001"
          entity="medOrder"
          title="処方"
          bundleLabel="RP名"
          itemQuantityLabel="数量"
          meta={{
            runId: 'RUN-ORDER',
            cacheHit: false,
            missingMaster: false,
            fallbackUsed: false,
            dataSourceTransition: 'server',
            patientId: 'P-001',
          }}
        />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: '追加する' }));

    const events = getAuditEventLog();
    const blocked = events.find((event) => (event.payload as any)?.details?.operationPhase === 'lock');
    const details = (blocked?.payload as any)?.details ?? {};

    expect(blocked).toBeTruthy();
    expect(details.blockedReasons).toEqual(['missing_items', 'missing_usage', 'missing_bundle_name']);
    expect(details.validationMessages).toEqual([
      '薬剤/項目を1件以上入力してください。',
      '用法を入力してください。',
      'RP名を入力してください。',
    ]);
    expect(details.operationPhase).toBe('lock');
  });
});
